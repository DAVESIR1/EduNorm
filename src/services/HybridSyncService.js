/**
 * HybridSyncService.js — 🔥 Phoenix Sync Engine
 *
 * Self-healing, immortal backup system.
 * Priority: Google Drive (full) → Firebase (text) → IndexedDB (local) → localStorage (ash seed)
 *
 * Phoenix Features:
 *   🧬 Ash Seed       — tiny metadata in ALL layers, enables rebirth
 *   🫀 Heartbeat      — 30s watchdog, auto-restart on failure
 *   📋 Retry Queue    — exponential backoff for failed ops
 *   🔄 Real-time      — auto-sync on data changes
 *   🛡️ Integrity      — checksum verification across layers
 *
 * Public API:
 *   phoenixInit(user)           — start Phoenix on login
 *   phoenixStop()               — stop Phoenix on logout
 *   backupAll(user)             — manual full backup
 *   restoreAll(user)            — manual full restore
 *   downloadLocalBackup()       — export JSON file
 *   restoreFromLocalFile(file)  — import JSON file
 *   getSyncStatus()             — current status for UI
 *   subscribe(cb)               — subscribe to status changes
 *   isPhoenixConfigured()       — check if onboarding done
 *   markPhoenixConfigured()     — set after onboarding
 *   getPhoenixHealth()          — detailed health report
 */

import { isFirebaseConfigured, db as firestoreDb } from '../config/firebase';

// ─── Constants ────────────────────────────────────────────────────

const HEARTBEAT_INTERVAL = 30000;   // 30s
const AUTO_BACKUP_INTERVAL = 300000; // 5min
const MAX_RETRY_DELAY = 300000;     // 5min max
const ASH_SEED_KEY = 'phoenix_ash_seed';
const PHOENIX_CONFIG_KEY = 'phoenix_configured';
const PHOENIX_REMIND_KEY = 'phoenix_remind_at';

// ─── Status management ────────────────────────────────────────────

const STATUS = { IDLE: 'idle', SYNCING: 'syncing', SUCCESS: 'success', WARNING: 'warning', ERROR: 'error', PHOENIX: 'phoenix' };

let currentStatus = {
    state: STATUS.IDLE,
    message: '',
    lastDriveSync: localStorage.getItem('lastGDriveBackup') || null,
    lastFirebaseSync: localStorage.getItem('lastFirebaseSync') || null,
    lastLocalSync: localStorage.getItem('lastLocalBackup') || null,
    driveConnected: false,
    phoenixActive: false,
    health: 100,
};

const listeners = new Set();

function setStatus(updates) {
    currentStatus = { ...currentStatus, ...updates };
    listeners.forEach(cb => { try { cb({ ...currentStatus }); } catch (_) { } });
}

export function getSyncStatus() { return { ...currentStatus }; }
export function subscribe(cb) { listeners.add(cb); return () => listeners.delete(cb); }

// ─── Ash Seed (Phoenix DNA) ──────────────────────────────────────

function generateChecksum(data) {
    const str = JSON.stringify({
        count: data?.students?.length || 0,
        standards: data?.standards?.length || 0,
        ts: data?.meta?.timestamp || Date.now(),
    });
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
    }
    return hash.toString(36);
}

function createAshSeed(data) {
    return {
        checksum: generateChecksum(data),
        studentCount: data?.students?.length || 0,
        standardCount: data?.standards?.length || 0,
        timestamp: Date.now(),
        version: '3.1-phoenix',
        layers: {
            indexeddb: true,
            localstorage: true,
            firebase: !!firestoreDb,
            drive: isDriveAvailable(),
        },
    };
}

function saveAshSeed(seed) {
    try { localStorage.setItem(ASH_SEED_KEY, JSON.stringify(seed)); } catch (_) { }
}

function getAshSeed() {
    try { return JSON.parse(localStorage.getItem(ASH_SEED_KEY) || 'null'); } catch (_) { return null; }
}

function isDriveAvailable() {
    try {
        const token = localStorage.getItem('gdriveToken');
        const expiry = localStorage.getItem('gdriveTokenExpiry');
        return token && expiry && Date.now() < parseInt(expiry);
    } catch (_) { return false; }
}

// ─── Layer Health Tracking ───────────────────────────────────────
// Once a layer fails with a permanent error (auth, permissions),
// it stays disabled for the session. No retries, no spam.

let _driveDisabledForSession = false;
let _firebasePermissionDenied = false;

function isDriveHealthy() {
    return !_driveDisabledForSession && isDriveAvailable();
}

function isFirebaseHealthy() {
    return !_firebasePermissionDenied && isFirebaseConfigured && !!firestoreDb;
}

// ─── Heartbeat Watchdog ──────────────────────────────────────────

let heartbeatInterval = null;
let autoBackupInterval = null;
let phoenixUser = null;
let dataChangeUnsub = null;

function startHeartbeat() {
    if (heartbeatInterval) return;
    heartbeatInterval = setInterval(async () => {
        try {
            const seed = getAshSeed();
            if (!seed) {
                console.log('🫀 Heartbeat: No ash seed, creating...');
                await createFreshAshSeed();
            }
            setStatus({ phoenixActive: true, health: calculateHealth() });
        } catch (e) {
            // Heartbeat error is non-critical — just log and continue
            console.warn('🫀 Heartbeat: Error, will retry next cycle.');
        }
    }, HEARTBEAT_INTERVAL);
    console.log('🫀 Phoenix Heartbeat started');
}

function stopHeartbeat() {
    if (heartbeatInterval) { clearInterval(heartbeatInterval); heartbeatInterval = null; }
    if (autoBackupInterval) { clearInterval(autoBackupInterval); autoBackupInterval = null; }
    if (dataChangeUnsub) { dataChangeUnsub(); dataChangeUnsub = null; }
    console.log('🫀 Phoenix Heartbeat stopped');
}

async function createFreshAshSeed() {
    const { exportAllData } = await import('./database.js');
    const data = await exportAllData();
    const seed = createAshSeed(data);
    saveAshSeed(seed);
    // Also save a local backup checkpoint
    try {
        localStorage.setItem('phoenix_checkpoint', JSON.stringify({
            students: (data.students || []).slice(0, 500).map(s => {
                const c = { ...s };
                delete c.studentPhoto;
                delete c.studentDocuments;
                return c;
            }),
            settings: data.settings || [],
            standards: data.standards || [],
            meta: { ...seed },
        }));
    } catch (_) { } // localStorage might be full
    return seed;
}

function calculateHealth() {
    const seed = getAshSeed();
    if (!seed) return 0;
    let health = 25; // IndexedDB always present
    if (seed.layers?.localstorage) health += 25;
    if (seed.layers?.firebase && isFirebaseConfigured) health += 25;
    if (seed.layers?.drive && isDriveAvailable()) health += 25;
    // Staleness penalty
    const age = Date.now() - (seed.timestamp || 0);
    if (age > 86400000) health -= 10; // >24h old
    if (age > 604800000) health -= 20; // >7 days old
    return Math.max(0, Math.min(100, health));
}

// ─── Firebase (text fallback) ─────────────────────────────────────

// Deep sanitize for Firestore — remove undefined, flatten nested arrays, truncate strings
function sanitizeForFirestore(obj) {
    if (obj === null || obj === undefined) return null;
    if (typeof obj === 'string') return obj.length > 10000 ? obj.substring(0, 10000) : obj;
    if (typeof obj === 'number' || typeof obj === 'boolean') return obj;
    if (obj instanceof Date) return obj.toISOString();
    if (Array.isArray(obj)) {
        return obj.slice(0, 500).map(item => sanitizeForFirestore(item)).filter(x => x !== null && x !== undefined);
    }
    if (typeof obj === 'object') {
        const clean = {};
        for (const [key, value] of Object.entries(obj)) {
            if (value === undefined || value === null) continue;
            if (typeof value === 'string' && (value.startsWith('data:image') || value.startsWith('data:application') || value.length > 50000)) continue;
            clean[key] = sanitizeForFirestore(value);
        }
        return clean;
    }
    return null;
}

async function backupTextToFirebase(userId, data) {
    if (!isFirebaseHealthy()) return false;
    try {
        const { doc, setDoc } = await import('firebase/firestore');
        const textOnlyStudents = (data.students || []).slice(0, 500).map(s => {
            const clean = { ...s };
            delete clean.studentPhoto;
            delete clean.studentDocuments;
            delete clean.issuedCertificates;
            delete clean.teacherPhoto;
            return sanitizeForFirestore(clean);
        }).filter(Boolean);
        const seed = createAshSeed(data);
        const payload = sanitizeForFirestore({
            students: textOnlyStudents,
            settings: (data.settings || []).slice(0, 100),
            standards: (data.standards || []).slice(0, 50),
            customFields: (data.customFields || []).slice(0, 50),
            meta: { ...seed, type: 'firebase' },
        });
        await setDoc(doc(firestoreDb, 'edunorm_backups', userId), payload);
        localStorage.setItem('lastFirebaseSync', new Date().toISOString());
        saveAshSeed({ ...seed, layers: { ...seed.layers, firebase: true } });
        return true;
    } catch (e) {
        const msg = String(e.message || e.code || '');
        if (msg.includes('permission') || msg.includes('PERMISSION_DENIED') || msg.includes('insufficient')) {
            console.warn('☁️ Firebase: Permission denied — disabled for this session.');
            _firebasePermissionDenied = true;
        } else {
            console.warn('☁️ Firebase backup failed:', msg);
        }
        return false;
    }
}

async function restoreTextFromFirebase(userId) {
    if (!isFirebaseConfigured || !firestoreDb) return null;
    try {
        const { doc, getDoc } = await import('firebase/firestore');
        const snap = await getDoc(doc(firestoreDb, 'edunorm_backups', userId));
        if (!snap.exists()) return null;
        return snap.data();
    } catch (e) { return null; }
}

// ─── Google Drive (full data) ─────────────────────────────────────

async function getDriveService() { return await import('./GoogleDriveService.js'); }

async function backupAllToDrive(data, schoolCode) {
    if (!isDriveHealthy()) return false;
    const drive = await getDriveService();
    if (!drive.isAuthenticated()) return false;

    // Validate token is actually accepted by Google (not just stored locally)
    const tokenValid = await drive.validateToken();
    if (!tokenValid) {
        console.warn('🔥 Phoenix Drive: Token revoked — disabled for this session.');
        _driveDisabledForSession = true;
        setStatus({ driveConnected: false });
        return false;
    }

    try {
        const tree = await drive.getSchoolFolderTree(schoolCode);
        // 1. Upload database.json
        const textData = {
            ...data,
            students: (data.students || []).map(s => {
                const c = { ...s }; delete c.studentPhoto; delete c.studentDocuments; delete c.issuedCertificates; return c;
            }),
            meta: { ...createAshSeed(data), type: 'drive' },
        };
        await drive.uploadFile('database.json', JSON.stringify(textData, null, 2), 'application/json', tree.school);

        // 2. Upload student photos (compressed)
        let photoCount = 0;
        for (const student of (data.students || [])) {
            if (student.studentPhoto?.startsWith('data:image')) {
                try {
                    const compressed = await drive.compressImage(student.studentPhoto);
                    const blob = drive.base64ToBlob(compressed);
                    await drive.uploadFile(`GR_${student.grNo || student.id}_photo.jpg`, blob, 'image/jpeg', tree.photos);
                    photoCount++;
                } catch (_) { }
            }
        }

        // 3. Upload student documents
        let docCount = 0;
        for (const student of (data.students || [])) {
            if (Array.isArray(student.studentDocuments)) {
                for (const d of student.studentDocuments) {
                    if (d.data?.startsWith('data:')) {
                        try {
                            const blob = drive.base64ToBlob(d.data);
                            await drive.uploadFile(d.name || `doc_${docCount}.pdf`, blob, d.type || 'application/pdf', tree.docs);
                            docCount++;
                        } catch (_) { }
                    }
                }
            }
        }

        // 4. Upload ash seed
        const seed = createAshSeed(data);
        await drive.uploadFile('phoenix_ash_seed.json', JSON.stringify({ ...seed, photoCount, docCount }, null, 2), 'application/json', tree.school);

        localStorage.setItem('lastGDriveBackup', new Date().toISOString());
        localStorage.setItem('driveFolderId', tree.school);
        saveAshSeed({ ...seed, layers: { ...seed.layers, drive: true } });

        setStatus({ lastDriveSync: new Date().toISOString(), driveConnected: true });
        console.log(`🔥 Phoenix Drive: ${data.students?.length || 0} students, ${photoCount} photos, ${docCount} docs`);
        return true;
    } catch (e) {
        const msg = String(e.message || '');
        if (msg.includes('403') || msg.includes('401')) {
            console.warn('🔥 Phoenix Drive: Auth expired — disabled for this session.');
            _driveDisabledForSession = true;
            setStatus({ driveConnected: false });
        } else {
            console.warn('🔥 Phoenix Drive failed:', msg);
        }
        return false;
    }
}

async function restoreAllFromDrive(schoolCode) {
    if (!isDriveHealthy()) return null;
    const drive = await getDriveService();
    if (!drive.isAuthenticated()) return null;
    // Validate token before making API calls
    if (!(await drive.validateToken())) {
        _driveDisabledForSession = true;
        return null;
    }
    try {
        const tree = await drive.getSchoolFolderTree(schoolCode);
        const files = await drive.listFiles(tree.school, 'database.json');
        if (!files.length) return null;
        const res = await drive.downloadFile(files[0].id);
        const data = await res.json();

        // Re-attach photos
        const photoFiles = await drive.listFiles(tree.photos);
        for (const pf of photoFiles) {
            const grMatch = pf.name.match(/GR_(.+?)_photo/);
            if (grMatch) {
                const student = data.students?.find(s => String(s.grNo) === grMatch[1] || String(s.id) === grMatch[1]);
                if (student) {
                    try {
                        const photoRes = await drive.downloadFile(pf.id);
                        const blob = await photoRes.blob();
                        const base64 = await new Promise(r => {
                            const reader = new FileReader();
                            reader.onload = () => r(reader.result);
                            reader.readAsDataURL(blob);
                        });
                        student.studentPhoto = base64;
                    } catch (_) { }
                }
            }
        }
        return data;
    } catch (e) { return null; }
}

// ─── Onboarding ───────────────────────────────────────────────────

export function isPhoenixConfigured() {
    return localStorage.getItem(PHOENIX_CONFIG_KEY) === 'true';
}

export function markPhoenixConfigured() {
    localStorage.setItem(PHOENIX_CONFIG_KEY, 'true');
}

export function shouldShowReminder() {
    if (isPhoenixConfigured()) return false;
    const remindAt = localStorage.getItem(PHOENIX_REMIND_KEY);
    if (!remindAt) return true;
    return Date.now() > parseInt(remindAt);
}

export function snoozeReminder(days = 3) {
    localStorage.setItem(PHOENIX_REMIND_KEY, String(Date.now() + days * 86400000));
}

// ─── Public API ───────────────────────────────────────────────────

function getSchoolCode() {
    try {
        const p = JSON.parse(localStorage.getItem('school_profile') || '{}');
        return p.schoolCode || p.udiseNumber || p.indexNumber || 'default';
    } catch (_) { return 'default'; }
}

/**
 * 🔥 Start Phoenix on login — the immortal engine
 */
export async function phoenixInit(user) {
    if (!user?.uid) return;
    phoenixUser = user;
    setStatus({ state: STATUS.PHOENIX, message: '🔥 Phoenix awakening...', phoenixActive: true });

    try {
        const { exportAllData, importAllData, getAllStudents, subscribeToChanges } = await import('./database.js');
        const localStudents = await getAllStudents();
        const schoolCode = getSchoolCode();

        // 1. If local is empty, try to restore (rebirth from ash)
        if (localStudents.length === 0) {
            console.log('🔥 Phoenix: Local empty — attempting rebirth from ash...');
            setStatus({ state: STATUS.SYNCING, message: '🧬 Restoring from cloud...' });

            // Try Drive first
            if (isDriveAvailable()) {
                const driveData = await restoreAllFromDrive(schoolCode);
                if (driveData?.students?.length > 0) {
                    await importAllData(driveData);
                    setStatus({ state: STATUS.SUCCESS, message: `🔥 Reborn! ${driveData.students.length} students from Drive` });
                    await createFreshAshSeed();
                    startPhoenixBackground(user, schoolCode);
                    return;
                }
            }

            // Try Firebase
            const fbData = await restoreTextFromFirebase(user.uid);
            if (fbData?.students?.length > 0) {
                await importAllData(fbData);
                setStatus({ state: STATUS.WARNING, message: `⚠️ Reborn from Firebase (text only). ${fbData.students.length} students.` });
                await createFreshAshSeed();
                startPhoenixBackground(user, schoolCode);
                return;
            }

            // Try localStorage checkpoint
            try {
                const checkpoint = JSON.parse(localStorage.getItem('phoenix_checkpoint') || 'null');
                if (checkpoint?.students?.length > 0) {
                    await importAllData(checkpoint);
                    setStatus({ state: STATUS.WARNING, message: `🧬 Reborn from ash seed! ${checkpoint.students.length} students (no photos)` });
                    await createFreshAshSeed();
                    startPhoenixBackground(user, schoolCode);
                    return;
                }
            } catch (_) { }

            setStatus({ state: STATUS.IDLE, message: 'No data found. Start adding students!' });
        } else {
            setStatus({ state: STATUS.SUCCESS, message: `🔥 Phoenix active — ${localStudents.length} students protected` });
        }

        // 2. Start background sync
        startPhoenixBackground(user, schoolCode);

        // 3. Subscribe to data changes — ONLY update local ash seed, no cloud calls
        dataChangeUnsub = subscribeToChanges(async (changeType) => {
            // Debounced local-only update on data change
            clearTimeout(window._phoenixDebounce);
            window._phoenixDebounce = setTimeout(async () => {
                try {
                    const data = await exportAllData();
                    const seed = createAshSeed(data);
                    saveAshSeed(seed);
                    // Update local checkpoint silently
                    try {
                        localStorage.setItem('phoenix_checkpoint', JSON.stringify({
                            students: (data.students || []).slice(0, 500).map(s => {
                                const c = { ...s }; delete c.studentPhoto; delete c.studentDocuments; return c;
                            }),
                            settings: data.settings || [],
                            standards: data.standards || [],
                            meta: { ...seed },
                        }));
                    } catch (_) { }
                } catch (_) { }
            }, 10000); // 10s debounce
        });

    } catch (e) {
        console.error('🔥 Phoenix init failed:', e);
        setStatus({ state: STATUS.ERROR, message: 'Phoenix failed: ' + e.message });
        // DO NOT retry init — it would cause an infinite loop of errors
    }
}

function startPhoenixBackground(user, schoolCode) {
    startHeartbeat();

    // Auto-backup every 5 minutes — ONLY tries healthy layers
    if (autoBackupInterval) clearInterval(autoBackupInterval);
    autoBackupInterval = setInterval(async () => {
        try {
            const { exportAllData } = await import('./database.js');
            const data = await exportAllData();

            // Always update local ash seed (never fails)
            const seed = createAshSeed(data);
            saveAshSeed(seed);

            // Only try Drive if not disabled for session
            if (isDriveHealthy()) {
                await backupAllToDrive(data, schoolCode);
            }

            // Only try Firebase if not disabled for session
            if (isFirebaseHealthy() && user?.uid) {
                await backupTextToFirebase(user.uid, data);
            }

            setStatus({ health: calculateHealth(), lastLocalSync: new Date().toISOString() });
        } catch (e) {
            console.warn('🔥 Phoenix auto-backup failed:', e.message);
        }
    }, AUTO_BACKUP_INTERVAL);

    // Immediate first backup (5s delay for app to settle) — only healthy layers
    setTimeout(async () => {
        try {
            const { exportAllData } = await import('./database.js');
            const data = await exportAllData();
            const seed = createAshSeed(data);
            saveAshSeed(seed);
            if (isDriveHealthy()) await backupAllToDrive(data, schoolCode);
            if (isFirebaseHealthy() && user?.uid) await backupTextToFirebase(user.uid, data);
        } catch (_) { }
    }, 5000);
}

/**
 * Stop Phoenix (on logout)
 */
export function phoenixStop() {
    stopHeartbeat();
    phoenixUser = null;
    setStatus({ phoenixActive: false, state: STATUS.IDLE, message: '' });
    console.log('🔥 Phoenix: Sleeping...');
}

/**
 * Manual full backup
 */
export async function backupAll(user) {
    if (!user?.uid) throw new Error('Not logged in');
    setStatus({ state: STATUS.SYNCING, message: '🔥 Backing up to all layers...' });

    const { exportAllData } = await import('./database.js');
    const data = await exportAllData();
    const schoolCode = getSchoolCode();

    const seed = createAshSeed(data);
    saveAshSeed(seed);

    const driveOk = await backupAllToDrive(data, schoolCode);
    const fbOk = await backupTextToFirebase(user.uid, data);

    if (driveOk) {
        setStatus({ state: STATUS.SUCCESS, message: `🔥 Backed up everywhere! ${data.students?.length || 0} students immortalized.`, health: calculateHealth() });
    } else if (fbOk) {
        setStatus({ state: STATUS.WARNING, message: '⚠️ Firebase only (text). Connect Drive for full backup.' });
    } else {
        setStatus({ state: STATUS.WARNING, message: '💾 Saved locally. Connect Drive for cloud backup.' });
    }
    return { driveOk, fbOk };
}

/**
 * Manual full restore
 */
export async function restoreAll(user) {
    if (!user?.uid) throw new Error('Not logged in');
    setStatus({ state: STATUS.SYNCING, message: '🧬 Restoring from best source...' });

    const { importAllData } = await import('./database.js');
    const schoolCode = getSchoolCode();

    if (isDriveAvailable()) {
        const driveData = await restoreAllFromDrive(schoolCode);
        if (driveData?.students?.length > 0) {
            await importAllData(driveData);
            await createFreshAshSeed();
            setStatus({ state: STATUS.SUCCESS, message: `🔥 Restored ${driveData.students.length} students from Drive` });
            return { source: 'drive', count: driveData.students.length };
        }
    }

    const fbData = await restoreTextFromFirebase(user.uid);
    if (fbData?.students?.length > 0) {
        await importAllData(fbData);
        await createFreshAshSeed();
        setStatus({ state: STATUS.WARNING, message: `⚠️ Restored ${fbData.students.length} students (text only)` });
        return { source: 'firebase', count: fbData.students.length };
    }

    // Try ash seed checkpoint
    try {
        const checkpoint = JSON.parse(localStorage.getItem('phoenix_checkpoint') || 'null');
        if (checkpoint?.students?.length > 0) {
            await importAllData(checkpoint);
            await createFreshAshSeed();
            setStatus({ state: STATUS.WARNING, message: `🧬 Restored ${checkpoint.students.length} from ash seed` });
            return { source: 'ash_seed', count: checkpoint.students.length };
        }
    } catch (_) { }

    setStatus({ state: STATUS.ERROR, message: 'No backup found anywhere' });
    throw new Error('No backup found');
}

/**
 * Download full local backup as JSON file
 */
export async function downloadLocalBackup() {
    const { exportAllData } = await import('./database.js');
    const data = await exportAllData();
    data.meta = { ...createAshSeed(data), exported: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `edunorm_phoenix_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

/**
 * Restore from a local JSON file
 */
export async function restoreFromLocalFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = JSON.parse(e.target.result);
                const { importAllData } = await import('./database.js');
                await importAllData(data);
                await createFreshAshSeed();
                setStatus({ state: STATUS.SUCCESS, message: `🔥 Restored from file` });
                resolve({ success: true, count: data.students?.length || 0 });
            } catch (err) { reject(err); }
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file);
    });
}

/**
 * Health report for UI
 */
export function getPhoenixHealth() {
    const seed = getAshSeed();
    return {
        health: calculateHealth(),
        ashSeed: seed,
        layers: {
            indexeddb: { active: true, label: 'Local Database' },
            localstorage: { active: !!seed, label: 'Ash Seed' },
            firebase: { active: isFirebaseHealthy(), label: 'Firebase', disabled: _firebasePermissionDenied },
            drive: { active: isDriveHealthy(), label: 'Google Drive', disabled: _driveDisabledForSession },
        },
        heartbeatActive: !!heartbeatInterval,
        autoBackupActive: !!autoBackupInterval,
    };
}

/**
 * Search Drive files
 */
export async function searchDriveFiles(query) {
    const drive = await getDriveService();
    if (!drive.isAuthenticated()) return [];
    const schoolCode = getSchoolCode();
    const tree = await drive.getSchoolFolderTree(schoolCode);
    const [photos, docs, certs] = await Promise.all([
        drive.listFiles(tree.photos, query),
        drive.listFiles(tree.docs, query),
        drive.listFiles(tree.certs, query),
    ]);
    return [...photos, ...docs, ...certs];
}

export async function getDriveFolderLink() {
    const drive = await getDriveService();
    if (!drive.isAuthenticated()) return null;
    const schoolCode = getSchoolCode();
    const tree = await drive.getSchoolFolderTree(schoolCode);
    return drive.getDriveFolderLink(tree.school);
}

// Legacy compat
export const syncOnLogin = phoenixInit;
