/**
 * EDUNORM BACKUP SANDBOX — Main Thread Bridge
 * 
 * This module is the ONLY way the main app talks to the backup system.
 * The backup Service Worker runs completely sandboxed — it has its own
 * IndexedDB queue and Firestore connection via REST API.
 * 
 * Even if the React app crashes, the SW will keep retrying until data is safe.
 * When the site comes back online, the SW auto-bonds and resumes sync.
 */

import { exportAllData } from './database.js';
import { auth, isFirebaseConfigured } from '../config/firebase.js';
import { syncToCloud } from './DirectBackupService.js'; // fallback

const SW_PATH = '/backup-sw.js';
const SYNC_TAG = 'backup-sync';

let swRegistration = null;
let initPromise = null;

// ─── REGISTRATION ─────────────────────────────────────────────────────────────
export async function initBackupSandbox() {
    if (initPromise) return initPromise;

    initPromise = (async () => {
        if (!('serviceWorker' in navigator)) {
            console.warn('[BackupSandbox] Service Workers not supported in this browser');
            return false;
        }

        try {
            swRegistration = await navigator.serviceWorker.register(SW_PATH, { scope: '/' });
            console.log('[BackupSandbox] ✅ Backup Service Worker registered');

            // Listen for messages from SW
            navigator.serviceWorker.addEventListener('message', (event) => {
                const { type } = event.data || {};
                if (type === 'BACKUP_QUEUED') {
                    console.log('[BackupSandbox] Backup queued by SW:', event.data.queueId);
                }
                if (type === 'BACKUP_SYNC_COMPLETE') {
                    console.log('[BackupSandbox] SW sync complete');
                }
            });

            return true;
        } catch (err) {
            console.error('[BackupSandbox] SW registration failed:', err);
            return false;
        }
    })();

    return initPromise;
}

// ─── GET FIREBASE AUTH TOKEN ──────────────────────────────────────────────────
async function getIdToken() {
    const user = auth?.currentUser;
    if (!user) return null;
    try {
        return await user.getIdToken(/* force refresh */ false);
    } catch (e) {
        console.warn('[BackupSandbox] Could not get ID token:', e.message);
        return null;
    }
}

// ─── TRIGGER BACKUP ──────────────────────────────────────────────────────────
/**
 * Queue a full snapshot for cloud sync.
 * - If the Service Worker is available: posts to SW (runs in isolated sandbox)
 * - If offline or SW not available: falls back to direct Firestore write
 * - If all fails: data is ALREADY SAFE in local IndexedDB (source of truth)
 * 
 * @param {object} user — Firebase user object (must have uid)
 */
export async function queueBackup(user) {
    if (!user?.uid) {
        console.log('[BackupSandbox] No user — backup skipped');
        return { queued: false, reason: 'not logged in' };
    }

    if (!isFirebaseConfigured) {
        console.log('[BackupSandbox] Firebase not configured — backup skipped');
        return { queued: false, reason: 'firebase not configured' };
    }

    // 1. Export all local data
    const snapshot = await exportAllData();
    if (!snapshot) return { queued: false, reason: 'no local data' };

    const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
    const idToken = await getIdToken();

    // 2. Try Service Worker path (sandboxed sandbox)
    if (swRegistration && navigator.serviceWorker.controller && idToken) {
        navigator.serviceWorker.controller.postMessage({
            type: 'ENQUEUE_BACKUP',
            payload: {
                projectId,
                userId: user.uid,
                idToken,
                snapshot: {
                    students: snapshot.students || [],
                    settings: snapshot.settings || [],
                    standards: snapshot.standards || [],
                    customFields: snapshot.customFields || [],
                },
            },
        });
        console.log('[BackupSandbox] Backup posted to SW sandbox');
        return { queued: true, method: 'service-worker' };
    }

    // 3. Fallback: direct Firestore write (works but not sandboxed)
    try {
        const result = await syncToCloud(user.uid);
        console.log('[BackupSandbox] Fallback direct sync done:', result);
        return { queued: true, method: 'direct', ...result };
    } catch (err) {
        console.error('[BackupSandbox] All backup paths failed:', err.message);
        // ⚠️ Data is still safe in local IndexedDB — never lost
        return { queued: false, reason: err.message };
    }
}

// ─── FORCE IMMEDIATE SYNC ─────────────────────────────────────────────────────
export async function forceSyncNow(user) {
    if (!user?.uid) throw new Error('Must be logged in');

    // If SW is active, tell it to process the queue immediately
    if (swRegistration && navigator.serviceWorker.controller) {
        // Update token before forcing sync (tokens expire after 1 hour)
        const idToken = await getIdToken();
        if (idToken) {
            // Re-enqueue a fresh snapshot with the latest token
            await queueBackup(user);

            return new Promise((resolve) => {
                const timeout = setTimeout(() => resolve({ method: 'service-worker', timedOut: true }), 15000);
                navigator.serviceWorker.addEventListener('message', function handler(event) {
                    if (event.data?.type === 'BACKUP_SYNC_COMPLETE') {
                        clearTimeout(timeout);
                        navigator.serviceWorker.removeEventListener('message', handler);
                        resolve({ method: 'service-worker', done: true });
                    }
                });
                navigator.serviceWorker.controller.postMessage({ type: 'FORCE_SYNC' });
            });
        }
    }

    // Fallback: direct sync
    const result = await syncToCloud(user.uid);
    return { method: 'direct', ...result };
}

// ─── GET STATUS ───────────────────────────────────────────────────────────────
export async function getBackupStatus(user) {
    const pending = await new Promise((resolve) => {
        if (!navigator.serviceWorker?.controller) return resolve(0);
        const timeout = setTimeout(() => resolve(0), 2000);
        navigator.serviceWorker.addEventListener('message', function handler(event) {
            if (event.data?.type === 'STATUS') {
                clearTimeout(timeout);
                navigator.serviceWorker.removeEventListener('message', handler);
                resolve(event.data.pending || 0);
            }
        });
        navigator.serviceWorker.controller.postMessage({ type: 'GET_STATUS' });
    });

    return { pending, swActive: !!swRegistration };
}

// ─── AUTO-INIT ON IMPORT ──────────────────────────────────────────────────────
// The sandbox registers itself as soon as it's imported, requiring no manual setup.
if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
        initBackupSandbox().catch(console.error);
    });
}
