/**
 * Hybrid Storage Service
 * Abstraction layer for multiple cloud storage providers
 * 
 * Supported providers:
 * - Firebase Firestore (default)
 * - Cloudflare R2 (10GB free, zero egress fees) ✅
 * - Supabase (coming soon)
 * - Local only
 */

import * as CloudBackupService from './CloudBackupService';
import * as R2StorageService from './R2StorageService';
import * as LocalBackupService from './LocalBackupService';
import * as database from './database';

// Storage provider types
export const PROVIDERS = {
    FIREBASE: 'firebase',
    CLOUDFLARE_R2: 'cloudflare_r2',
    SUPABASE: 'supabase',
    LOCAL_ONLY: 'local_only'
};

// Current active provider - R2 is now default for 10GB free storage
let currentProvider = PROVIDERS.CLOUDFLARE_R2;

/**
 * Get the current storage provider
 */
export function getCurrentProvider() {
    return currentProvider;
}

/**
 * Set the storage provider
 */
export function setProvider(provider) {
    if (Object.values(PROVIDERS).includes(provider)) {
        currentProvider = provider;
        localStorage.setItem('edunorm_storage_provider', provider);
        return true;
    }
    return false;
}

/**
 * Initialize provider from saved settings
 */
export function initProvider() {
    const saved = localStorage.getItem('edunorm_storage_provider');
    if (saved && Object.values(PROVIDERS).includes(saved)) {
        currentProvider = saved;
    }
    return currentProvider;
}

/**
 * Backup data to the configured cloud provider
 * @param {string} userId - The user ID
 * @returns {Promise<Object>} - Result of the backup operation
 */
export async function backupToCloud(userId) {
    // Always create local backup first (safety net)
    const allData = await database.exportAllData();
    LocalBackupService.createLocalBackup(allData);

    try {
        switch (currentProvider) {
            case PROVIDERS.FIREBASE:
                return await CloudBackupService.backupToCloud(userId);

            case PROVIDERS.CLOUDFLARE_R2:
                if (!R2StorageService.isR2Configured()) {
                    console.warn('R2 not configured, falling back to Firebase');
                    try {
                        return await CloudBackupService.backupToCloud(userId);
                    } catch (fbError) {
                        console.warn('Firebase also not configured:', fbError.message);
                        // Return local backup success
                        return {
                            success: true,
                            message: 'Data backed up locally (cloud storage not configured)',
                            timestamp: new Date().toISOString(),
                            provider: 'local'
                        };
                    }
                }
                return await R2StorageService.uploadBackup(userId, allData);

            case PROVIDERS.SUPABASE:
                console.warn('Supabase not yet implemented, falling back to Firebase');
                try {
                    return await CloudBackupService.backupToCloud(userId);
                } catch (fbError) {
                    return {
                        success: true,
                        message: 'Data backed up locally (cloud storage not configured)',
                        timestamp: new Date().toISOString(),
                        provider: 'local'
                    };
                }

            case PROVIDERS.LOCAL_ONLY:
                return {
                    success: true,
                    message: 'Data backed up locally only',
                    timestamp: new Date().toISOString()
                };

            default:
                try {
                    return await CloudBackupService.backupToCloud(userId);
                } catch (fbError) {
                    return {
                        success: true,
                        message: 'Data backed up locally (cloud not available)',
                        timestamp: new Date().toISOString(),
                        provider: 'local'
                    };
                }
        }
    } catch (error) {
        console.error('HybridStorage backup error:', error);

        // Check for network/fetch errors and provide clearer messages
        let userMessage = 'Backed up locally';
        if (error.message?.includes('fetch') || error.message?.includes('network') || error.name === 'TypeError') {
            userMessage += ' (Cloud unavailable - check internet connection)';
        } else if (error.message?.includes('not configured')) {
            userMessage += ' (Cloud storage not configured)';
        } else {
            userMessage += ` (${error.message || 'Cloud sync pending'})`;
        }

        // Local backup already created above
        return {
            success: true,
            message: userMessage,
            timestamp: new Date().toISOString(),
            provider: 'local',
            cloudError: error.message
        };
    }

}

/**
 * Restore data from the configured cloud provider
 * @param {string} userId - The user ID
 * @returns {Promise<Object>} - Result of the restore operation
 */
export async function restoreFromCloud(userId) {
    switch (currentProvider) {
        case PROVIDERS.FIREBASE:
            return await CloudBackupService.restoreFromCloud(userId);

        case PROVIDERS.CLOUDFLARE_R2:
            if (!R2StorageService.isR2Configured()) {
                console.warn('R2 not configured, falling back to Firebase');
                return await CloudBackupService.restoreFromCloud(userId);
            }
            try {
                const result = await R2StorageService.downloadLatestBackup(userId);
                if (result.success && result.data) {
                    await database.importAllData(result.data);
                    return {
                        success: true,
                        message: 'Data restored from Cloudflare R2',
                        timestamp: result.timestamp
                    };
                }
                return result;
            } catch (error) {
                console.error('R2 restore failed:', error);
                return { success: false, message: error.message };
            }

        case PROVIDERS.SUPABASE:
            console.warn('Supabase not yet implemented, falling back to Firebase');
            return await CloudBackupService.restoreFromCloud(userId);

        case PROVIDERS.LOCAL_ONLY:
            const localBackup = LocalBackupService.getLocalBackup();
            if (localBackup && localBackup.data) {
                await database.importAllData(localBackup.data);
                return {
                    success: true,
                    message: 'Data restored from local backup',
                    timestamp: localBackup.timestamp
                };
            }
            return {
                success: false,
                message: 'No local backup found'
            };

        default:
            return await CloudBackupService.restoreFromCloud(userId);
    }
}

/**
 * Check if backup exists on the configured provider
 * @param {string} userId - The user ID
 * @returns {Promise<Object>} - Backup info
 */
export async function checkBackupExists(userId) {
    switch (currentProvider) {
        case PROVIDERS.FIREBASE:
            return await CloudBackupService.checkBackupExists(userId);

        case PROVIDERS.CLOUDFLARE_R2:
            if (!R2StorageService.isR2Configured()) {
                return { exists: false, configured: false, provider: 'cloudflare_r2' };
            }
            return await R2StorageService.checkBackupExists(userId);

        case PROVIDERS.LOCAL_ONLY:
            const hasBackup = LocalBackupService.hasLocalBackup();
            const timestamp = LocalBackupService.getBackupTimestamp();
            return {
                exists: hasBackup,
                lastBackup: timestamp,
                provider: 'local'
            };

        default:
            return await CloudBackupService.checkBackupExists(userId);
    }
}

/**
 * Get storage provider info for UI display
 */
export function getProviderInfo() {
    const r2Configured = R2StorageService.isR2Configured();

    const providers = [
        {
            id: PROVIDERS.FIREBASE,
            name: 'Firebase',
            description: 'Google Cloud (1GB free)',
            icon: '🔥',
            available: true,
            freeStorage: '1 GB',
            active: currentProvider === PROVIDERS.FIREBASE
        },
        {
            id: PROVIDERS.CLOUDFLARE_R2,
            name: 'Cloudflare R2',
            description: r2Configured ? '10GB free storage' : 'Not configured',
            icon: '☁️',
            available: r2Configured,
            freeStorage: '10 GB',
            active: currentProvider === PROVIDERS.CLOUDFLARE_R2
        },
        {
            id: PROVIDERS.SUPABASE,
            name: 'Supabase',
            description: 'Coming Soon (500MB free)',
            icon: '⚡',
            available: false,
            freeStorage: '500 MB',
            active: false
        },
        {
            id: PROVIDERS.LOCAL_ONLY,
            name: 'Local Only',
            description: 'No cloud backup',
            icon: '💾',
            available: true,
            freeStorage: 'Device storage',
            active: currentProvider === PROVIDERS.LOCAL_ONLY
        }
    ];

    return providers;
}

/**
 * Get R2 storage usage info
 */
export async function getR2StorageInfo(userId) {
    if (!R2StorageService.isR2Configured()) {
        return { configured: false };
    }
    return await R2StorageService.getStorageInfo(userId);
}

/**
 * List all R2 backups for a user
 */
export async function listR2Backups(userId) {
    if (!R2StorageService.isR2Configured()) {
        return [];
    }
    return await R2StorageService.listBackups(userId);
}

/**
 * Auto-backup with failover between providers
 * Try primary provider, fall back to local if fails
 */
export async function smartBackup(userId) {
    try {
        const result = await backupToCloud(userId);
        if (result.success) {
            return result;
        }

        console.warn('HybridStorage: Cloud backup failed, local backup preserved');
        return {
            success: true,
            message: 'Cloud backup failed, but local backup is available',
            fallback: true
        };
    } catch (error) {
        console.error('HybridStorage: Backup error', error);

        // Ensure we have local backup at minimum
        const allData = await database.exportAllData();
        LocalBackupService.createLocalBackup(allData);

        return {
            success: false,
            message: 'Cloud backup failed, local backup created',
            error: error.message
        };
    }
}

/**
 * Export data to a downloadable file
 */
export async function exportToFile() {
    const allData = await database.exportAllData();
    return LocalBackupService.exportToFile(allData);
}

/**
 * Import data from an uploaded file
 */
export async function importFromFile(file) {
    const importedData = await LocalBackupService.importFromFile(file);
    await database.importAllData(importedData.data);
    return importedData;
}
