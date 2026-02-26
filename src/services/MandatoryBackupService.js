/**
 * Mandatory Backup Service
 * Ensures data is ALWAYS backed up to both local storage AND cloud (R2)
 * Data should NEVER be lost on app updates
 */

import * as R2StorageService from './R2StorageService';
import * as LocalBackupService from './LocalBackupService';
import * as database from './database';

// Backup interval in milliseconds (5 minutes)
const AUTO_BACKUP_INTERVAL = 5 * 60 * 1000;

// Debounce timeout for continuous changes
const DEBOUNCE_TIMEOUT = 10000; // 10 seconds

let autoBackupTimer = null;
let debounceTimer = null;
let lastBackupTime = null;
let isBackingUp = false;

/**
 * Initialize mandatory backup system
 * Call this on app startup
 */
export function initMandatoryBackup() {
    console.log('MandatoryBackup: Initializing...');

    // Start periodic backup
    startPeriodicBackup();

    // Backup on page unload (before user closes/refreshes)
    window.addEventListener('beforeunload', async (e) => {
        await performLocalBackup();
    });

    // Backup on visibility change (when app goes to background)
    document.addEventListener('visibilitychange', async () => {
        if (document.visibilityState === 'hidden') {
            await performLocalBackup();
        }
    });

    console.log('MandatoryBackup: Initialized successfully');
}

/**
 * Start periodic auto-backup (every 5 minutes)
 */
function startPeriodicBackup() {
    if (autoBackupTimer) {
        clearInterval(autoBackupTimer);
    }

    autoBackupTimer = setInterval(async () => {
        await performFullBackup('periodic');
    }, AUTO_BACKUP_INTERVAL);
}

/**
 * Trigger backup after data change (debounced)
 * Call this after any data modification
 */
export function triggerBackupOnChange() {
    if (debounceTimer) {
        clearTimeout(debounceTimer);
    }

    debounceTimer = setTimeout(async () => {
        await performFullBackup('data_change');
    }, DEBOUNCE_TIMEOUT);
}

/**
 * Force immediate backup (call on critical operations)
 */
export async function forceImmediateBackup(userId = null) {
    return await performFullBackup('forced', userId);
}

/**
 * Perform local-only backup (fast, for critical moments)
 */
async function performLocalBackup() {
    try {
        const allData = await database.exportAllData();
        LocalBackupService.createLocalBackup(allData);
        console.log('MandatoryBackup: Local backup saved');
        return true;
    } catch (error) {
        console.error('MandatoryBackup: Local backup failed', error);
        return false;
    }
}

/**
 * Perform full backup to both local and R2 cloud
 */
async function performFullBackup(reason = 'manual', userId = null) {
    if (isBackingUp) {
        console.log('MandatoryBackup: Backup already in progress, skipping...');
        return { success: false, reason: 'already_in_progress' };
    }

    isBackingUp = true;
    console.log(`MandatoryBackup: Starting full backup (reason: ${reason})`);

    try {
        // Step 1: Export all data
        const allData = await database.exportAllData();

        // Step 2: Always save to local storage first (fast)
        LocalBackupService.createLocalBackup(allData);
        console.log('MandatoryBackup: Local backup completed');

        // Step 3: Upload to R2 cloud if configured
        if (R2StorageService.isR2Configured()) {
            try {
                const backupUserId = userId || getStoredUserId() || 'anonymous';
                const result = await R2StorageService.uploadBackup(backupUserId, allData);
                console.log('MandatoryBackup: R2 cloud backup completed', result);
                lastBackupTime = new Date();

                return {
                    success: true,
                    local: true,
                    cloud: true,
                    timestamp: lastBackupTime.toISOString(),
                    reason
                };
            } catch (r2Error) {
                console.error('MandatoryBackup: R2 backup failed, but local backup is safe', r2Error);
                return {
                    success: true,
                    local: true,
                    cloud: false,
                    error: r2Error.message,
                    timestamp: new Date().toISOString(),
                    reason
                };
            }
        } else {
            console.log('MandatoryBackup: R2 not configured, using local only');
            lastBackupTime = new Date();
            return {
                success: true,
                local: true,
                cloud: false,
                r2Configured: false,
                timestamp: lastBackupTime.toISOString(),
                reason
            };
        }
    } catch (error) {
        console.error('MandatoryBackup: Full backup failed', error);
        return {
            success: false,
            error: error.message,
            reason
        };
    } finally {
        isBackingUp = false;
    }
}

/**
 * Get stored user ID from auth
 */
function getStoredUserId() {
    try {
        const authData = localStorage.getItem('edunorm_auth_user');
        if (authData) {
            const user = JSON.parse(authData);
            return user.uid || user.id || null;
        }
    } catch (e) {
        return null;
    }
    return null;
}

/**
 * Restore data from backup (tries R2 first, then local)
 */
export async function restoreFromBackup(userId = null) {
    console.log('MandatoryBackup: Attempting restore...');

    // Try R2 cloud first (most up-to-date)
    if (R2StorageService.isR2Configured()) {
        try {
            const backupUserId = userId || getStoredUserId();
            if (backupUserId) {
                const result = await R2StorageService.downloadLatestBackup(backupUserId);
                if (result.success && result.data) {
                    await database.importAllData(result.data);
                    console.log('MandatoryBackup: Restored from R2 cloud');
                    return {
                        success: true,
                        source: 'r2_cloud',
                        timestamp: result.timestamp
                    };
                }
            }
        } catch (r2Error) {
            console.warn('MandatoryBackup: R2 restore failed, trying local', r2Error);
        }
    }

    // Fallback to local backup
    const localBackup = LocalBackupService.getLocalBackup();
    if (localBackup && localBackup.data) {
        await database.importAllData(localBackup.data);
        console.log('MandatoryBackup: Restored from local backup');
        return {
            success: true,
            source: 'local',
            timestamp: localBackup.timestamp
        };
    }

    return {
        success: false,
        message: 'No backup found'
    };
}

/**
 * Check backup status
 */
export function getBackupStatus() {
    return {
        lastBackupTime,
        isBackingUp,
        r2Configured: R2StorageService.isR2Configured(),
        hasLocalBackup: LocalBackupService.hasLocalBackup(),
        localBackupTime: LocalBackupService.getBackupTimestamp()
    };
}

/**
 * Get backup info for display
 */
export async function getFullBackupInfo(userId) {
    const localBackup = LocalBackupService.getLocalBackup();
    let r2Info = null;

    if (R2StorageService.isR2Configured() && userId) {
        try {
            r2Info = await R2StorageService.checkBackupExists(userId);
        } catch (e) {
            r2Info = { error: e.message };
        }
    }

    return {
        local: {
            exists: !!localBackup,
            timestamp: localBackup?.timestamp,
            version: localBackup?.version
        },
        cloud: r2Info
    };
}

/**
 * Clean up timers (call on app unmount)
 */
export function cleanup() {
    if (autoBackupTimer) {
        clearInterval(autoBackupTimer);
    }
    if (debounceTimer) {
        clearTimeout(debounceTimer);
    }
}
