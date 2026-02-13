/**
 * Real-Time Backup Service
 * Detects every data change and syncs immediately
 * - 2-second debounce for rapid changes
 * - Offline queue with auto-sync on reconnect
 * - Multi-layer failover: Local → Firebase → R2
 * - Survives app updates and crashes
 */

import * as LocalBackupService from './LocalBackupService';
import * as database from './database';
import * as CloudSyncService from './CloudSyncService';

// Configuration
const DEBOUNCE_MS = 2000;         // 2 seconds after last change
const MAX_QUEUE_SIZE = 50;        // Max offline queue items
const QUEUE_STORAGE_KEY = 'edunorm_backup_queue';
const LAST_BACKUP_KEY = 'edunorm_last_realtime_backup';
const BACKUP_VERSION_KEY = 'edunorm_backup_version';

// State
let debounceTimer = null;
let isBackingUp = false;
let userId = null;
let isOnline = navigator.onLine;
let statusListeners = [];
let changeCount = 0;

/**
 * Initialize the real-time backup system
 * Call once on app startup after user is authenticated
 */
export function init(uid) {
    userId = uid;

    // Listen for online/offline events
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Backup on page unload (sync local backup)
    window.addEventListener('beforeunload', () => {
        saveLocalBackupSync();
    });

    // Backup when app goes to background
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
            saveLocalBackupSync();
        }
    });

    // Process any queued backups from previous sessions
    if (isOnline && userId) {
        processOfflineQueue();
    }

    console.log('RealTimeBackup: Initialized for user', uid);
    notifyStatus({ type: 'ready', message: 'Real-time backup active' });
}

/**
 * Notify that data has changed — triggers debounced backup
 * Call this after ANY data modification
 */
export function onDataChanged(changeType = 'unknown') {
    changeCount++;
    console.log(`RealTimeBackup: Data changed (${changeType}), count: ${changeCount}`);

    // Always save to local immediately (fast, synchronous-ish)
    saveLocalBackupAsync();

    // Debounce cloud backup
    if (debounceTimer) {
        clearTimeout(debounceTimer);
    }

    debounceTimer = setTimeout(() => {
        performCloudBackup(changeType);
    }, DEBOUNCE_MS);
}

/**
 * Save local backup asynchronously (fast path)
 */
async function saveLocalBackupAsync() {
    try {
        const allData = await database.exportAllData();
        if (allData && (allData.students?.length > 0 || allData.settings)) {
            LocalBackupService.createLocalBackup(allData);
        }
    } catch (err) {
        console.warn('RealTimeBackup: Local backup failed', err);
    }
}

/**
 * Save local backup synchronously (for beforeunload)
 */
function saveLocalBackupSync() {
    try {
        // Use whatever data we have cached
        const cached = localStorage.getItem('edunorm_latest_data');
        if (cached) {
            localStorage.setItem('edunorm_emergency_backup', cached);
            localStorage.setItem('edunorm_emergency_backup_time', new Date().toISOString());
        }
    } catch (err) {
        // Can't do much in beforeunload
    }
}

/**
 * Perform cloud backup with failover
 */
async function performCloudBackup(changeType) {
    if (isBackingUp) {
        // Queue for later
        console.log('RealTimeBackup: Backup in progress, will retry');
        debounceTimer = setTimeout(() => performCloudBackup(changeType), DEBOUNCE_MS);
        return;
    }

    if (!isOnline) {
        // Queue for when we're back online
        addToOfflineQueue(changeType);
        notifyStatus({ type: 'queued', message: 'Changes saved locally, will sync when online' });
        return;
    }

    if (!userId) {
        console.log('RealTimeBackup: No user ID, skipping cloud backup');
        return;
    }

    isBackingUp = true;
    notifyStatus({ type: 'syncing', message: 'Syncing to cloud...' });

    try {
        // Primary: Firebase Cloud Backup via CloudSyncService
        await CloudSyncService.forceBackup(userId);

        const now = new Date().toISOString();
        localStorage.setItem(LAST_BACKUP_KEY, now);
        changeCount = 0;

        notifyStatus({ type: 'success', message: 'All changes saved to cloud' });
        console.log('RealTimeBackup: Cloud backup complete');

        // Clear offline queue since we're synced
        clearOfflineQueue();

    } catch (primaryError) {
        console.error('RealTimeBackup: Primary backup failed', primaryError);

        // Failover: try MandatoryBackup (R2)
        try {
            const { forceImmediateBackup } = await import('./MandatoryBackupService.js');
            await forceImmediateBackup(userId);
            notifyStatus({ type: 'partial', message: 'Saved to backup cloud (R2)' });
            console.log('RealTimeBackup: Failover to R2 succeeded');
        } catch (failoverError) {
            console.error('RealTimeBackup: Failover also failed', failoverError);
            // Data is still safe in local backup
            addToOfflineQueue(changeType);
            notifyStatus({ type: 'offline', message: 'Changes saved locally, cloud sync pending' });
        }
    } finally {
        isBackingUp = false;
    }
}

/**
 * Offline Queue Management
 */
function addToOfflineQueue(changeType) {
    try {
        const queue = getOfflineQueue();
        queue.push({
            timestamp: new Date().toISOString(),
            changeType,
            id: Date.now()
        });

        // Keep queue manageable
        if (queue.length > MAX_QUEUE_SIZE) {
            queue.splice(0, queue.length - MAX_QUEUE_SIZE);
        }

        localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
    } catch (err) {
        console.warn('RealTimeBackup: Failed to add to queue', err);
    }
}

function getOfflineQueue() {
    try {
        const raw = localStorage.getItem(QUEUE_STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function clearOfflineQueue() {
    localStorage.removeItem(QUEUE_STORAGE_KEY);
}

/**
 * Process offline queue when back online
 */
async function processOfflineQueue() {
    const queue = getOfflineQueue();
    if (queue.length === 0) return;

    console.log(`RealTimeBackup: Processing ${queue.length} queued changes`);
    notifyStatus({ type: 'syncing', message: `Syncing ${queue.length} queued changes...` });

    try {
        // Just do one full backup — it includes all current data
        await performCloudBackup('queue_flush');
    } catch (err) {
        console.error('RealTimeBackup: Queue processing failed', err);
        notifyStatus({ type: 'error', message: 'Failed to sync queued changes' });
    }
}

/**
 * Online/Offline handlers
 */
function handleOnline() {
    isOnline = true;
    console.log('RealTimeBackup: Back online');
    notifyStatus({ type: 'online', message: 'Back online, syncing...' });

    // Process queued changes
    setTimeout(() => {
        if (userId) {
            processOfflineQueue();
        }
    }, 2000); // Small delay to let connection stabilize
}

function handleOffline() {
    isOnline = false;
    console.log('RealTimeBackup: Gone offline');
    notifyStatus({ type: 'offline', message: 'Offline — changes saved locally' });
}

/**
 * Status notification system
 */
function notifyStatus(status) {
    statusListeners.forEach(cb => {
        try { cb(status); } catch (e) { /* ignore */ }
    });
}

export function onStatusChange(callback) {
    statusListeners.push(callback);
    return () => {
        statusListeners = statusListeners.filter(cb => cb !== callback);
    };
}

export function getStatus() {
    return {
        isOnline,
        isBackingUp,
        changeCount,
        lastBackup: localStorage.getItem(LAST_BACKUP_KEY),
        queuedChanges: getOfflineQueue().length,
        userId
    };
}

/**
 * Cleanup — call on app unmount
 */
export function cleanup() {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
    if (debounceTimer) clearTimeout(debounceTimer);
    statusListeners = [];
    console.log('RealTimeBackup: Cleaned up');
}

export default {
    init,
    onDataChanged,
    onStatusChange,
    getStatus,
    cleanup
};
