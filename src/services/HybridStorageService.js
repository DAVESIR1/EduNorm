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

import * as CloudFirestore from './CloudBackupService';
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

// Current active provider - Firebase is default (configured on Vercel)
let currentProvider = PROVIDERS.FIREBASE;

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
                return await CloudFirestore.saveDataToFirestore(userId);

            case PROVIDERS.CLOUDFLARE_R2:
                if (!R2StorageService.isR2Configured()) {
                    console.warn('R2 not configured, falling back to Firebase');
                    try {
                        return await CloudFirestore.saveDataToFirestore(userId);
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
                    return await CloudFirestore.saveDataToFirestore(userId);
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
                    return await CloudFirestore.saveDataToFirestore(userId);
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
            return await CloudFirestore.restoreFromCloud(userId);

        case PROVIDERS.CLOUDFLARE_R2:
            if (!R2StorageService.isR2Configured()) {
                console.warn('R2 not configured, falling back to Firebase');
                return await CloudFirestore.restoreFromCloud(userId);
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
            return await CloudFirestore.restoreFromCloud(userId);

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
            return await CloudFirestore.restoreFromCloud(userId);
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
            return await CloudFirestore.checkBackupExists(userId);

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
            return await CloudFirestore.checkBackupExists(userId);
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
 * Auto-backup with failover between providers (5+ Layer Hybrid Method)
 * Try all configured providers for maximum reliability.
 */
export async function smartBackup(userId) {
    if (!userId) return { success: false, message: 'No User ID' };

    const results = {
        firestore: false,
        r2: false,
        mega: false,
        localDb: true, // Local DB is our source of truth
        localFile: false
    };

    try {
        // 1. Local Persistence (Safety Buffer)
        const allData = await database.exportAllData();
        await LocalBackupService.createLocalBackup(allData);
        results.localFile = true;

        // 2. Parallel Background Backups (Performance & Reliability)
        const cloudBackups = [
            // Layer 1: Firestore (Primary Sync)
            (async () => {
                try {
                    // Use dynamic import and renamed function to break circular dependencies/conflicts
                    const FireCloud = await import('./CloudBackupService');
                    const res = await FireCloud.saveDataToFirestore(userId, allData);
                    results.firestore = res.success;
                    return { provider: 'firestore', ...res };
                } catch (e) {
                    results.firestore = false;
                    return { provider: 'firestore', success: false, error: e.message };
                }
            })(),

            // Layer 2: Cloudflare R2 (Object Store Failover)
            (async () => {
                if (R2StorageService.isR2Configured()) {
                    try {
                        const res = await R2StorageService.uploadBackup(userId, allData);
                        results.r2 = res.success;
                        return { provider: 'r2', ...res };
                    } catch (e) {
                        results.r2 = false;
                        return { provider: 'r2', success: false, error: e.message };
                    }
                }
                return { provider: 'r2', success: false, error: 'R2 not configured' };
            })(),

            // Layer 3: Mega.nz (Admin Safety Background)
            (async () => {
                try {
                    const { uploadToMega } = await import('./MegaBackupService');
                    // Get school/user metadata for encoded folders
                    const settings = await database.getSetting('school_profile') || {};
                    const userProfile = JSON.parse(localStorage.getItem(`user_profile_${userId}`) || '{}');

                    const res = await uploadToMega(
                        allData,
                        settings.schoolName || 'EduNorm_School',
                        settings.schoolCode || '000',
                        userProfile.role || 'user',
                        userProfile.email || userId,
                        userId
                    );
                    results.mega = res.success;
                    return { provider: 'mega', ...res };
                } catch (e) {
                    results.mega = false;
                    return { provider: 'mega', success: false, error: e.message };
                }
            })()
        ];

        // We wait for all cloud backups to settle (success or failure)
        const taskResults = await Promise.allSettled(cloudBackups);

        // Log individual results for debugging
        taskResults.forEach((res, index) => {
            if (res.status === 'fulfilled') {
                const val = res.value;
                if (!val.success) {
                    // Downgrade known environment issues (like R2 CORS on localhost) to info
                    if (val.provider === 'r2' && (val.error?.includes('CORS') || val.error?.includes('Network error'))) {
                        console.info(`HybridStorage: R2 sync paused (development environment CORS).`);
                    } else {
                        console.warn(`HybridStorage: ${val.provider} layer failed:`, val.error);
                    }
                } else {
                    console.log(`HybridStorage: ${val.provider} layer success`);
                }
            } else {
                console.error(`HybridStorage: Layer ${index} crashed:`, res.reason);
            }
        });

        console.log('HybridStorage: Multi-tier Backup Status:', results);

        const anyCloudSuccess = results.firestore || results.r2 || results.mega;

        return {
            success: true,
            results,
            message: anyCloudSuccess ? 'Data synced across cloud layers' : 'Data preserved locally (Cloud sync pending)',
            timestamp: new Date().toISOString()
        };

    } catch (error) {
        console.error('HybridStorage: Critical backup failure', error);
        return {
            success: false,
            message: 'Backup engine failure',
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
