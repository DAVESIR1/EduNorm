import { subscribeToChanges } from './database';
import { smartBackup } from './HybridStorageService';

/**
 * Real-Time Sync Service
 * 
 * Automatically triggers backupToCloud when local DB changes.
 * Uses debouncing to prevent excessive writes.
 */

let syncTimeout = null;
const SYNC_DELAY = 1000; // 1 second debounce for "immediate" feel
let isSyncing = false;
let pendingSync = false;
let currentUserId = null;

// Initialize service
export function init(userId) {
    if (!userId) return;
    currentUserId = userId;

    console.log('RealTimeSync: Initialized for user', userId);

    // Subscribe to DB changes
    subscribeToChanges((type) => {
        // console.log(`RealTimeSync: Change detected in ${type}, scheduling sync...`);
        scheduleSync();
    });
}

// Schedule a sync
export function scheduleSync() {
    if (!currentUserId) return;

    // Clear existing timeout
    if (syncTimeout) clearTimeout(syncTimeout);

    // Set new timeout
    syncTimeout = setTimeout(() => {
        performSync();
    }, SYNC_DELAY);
}

// Perform the sync
async function performSync() {
    if (isSyncing) {
        pendingSync = true;
        return;
    }

    isSyncing = true;
    try {
        console.log('RealTimeSync: Starting Hybrid Auto-Sync (Firestore+R2+Mega)...');
        await smartBackup(currentUserId);
        console.log('RealTimeSync: Hybrid Auto-Sync Complete.');
    } catch (err) {
        console.error('RealTimeSync: Auto-Backup Failed:', err);
    } finally {
        isSyncing = false;

        // If changes happened while syncing, sync again
        if (pendingSync) {
            pendingSync = false;
            scheduleSync();
        }
    }
}

// Export for manual triggering (optional)
export function syncNow() {
    if (syncTimeout) clearTimeout(syncTimeout);
    return performSync();
}

export default {
    init,
    scheduleSync,
    syncNow
};
