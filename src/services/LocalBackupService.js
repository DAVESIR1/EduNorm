/**
 * Local Backup Service
 * Handles automatic local backups to prevent data loss on app updates
 */

const APP_VERSION_KEY = 'edunorm_app_version';
const LOCAL_BACKUP_KEY = 'edunorm_local_backup';
const BACKUP_TIMESTAMP_KEY = 'edunorm_backup_timestamp';

// Current app version - bump this when making breaking changes
export const CURRENT_APP_VERSION = '1.0.0';

/**
 * Get the last known app version
 */
export function getStoredAppVersion() {
    return localStorage.getItem(APP_VERSION_KEY) || null;
}

/**
 * Save the current app version
 */
export function saveAppVersion() {
    localStorage.setItem(APP_VERSION_KEY, CURRENT_APP_VERSION);
}

/**
 * Check if app version has changed (potential for data loss)
 */
export function hasVersionChanged() {
    const stored = getStoredAppVersion();
    return stored !== null && stored !== CURRENT_APP_VERSION;
}

/**
 * Check if this is a fresh install (no previous version)
 */
export function isFreshInstall() {
    return getStoredAppVersion() === null;
}

/**
 * Create a local backup in localStorage
 * @param {Object} data - The complete data to backup
 */
export function createLocalBackup(data) {
    try {
        const backup = {
            version: CURRENT_APP_VERSION,
            timestamp: new Date().toISOString(),
            data: data
        };

        const jsonString = JSON.stringify(backup);

        // Check if data fits in localStorage (usually 5-10MB limit)
        if (jsonString.length > 4 * 1024 * 1024) {
            console.warn('LocalBackupService: Data too large for localStorage, using compressed backup');
            // Store only essential data
            const essentialBackup = {
                version: CURRENT_APP_VERSION,
                timestamp: new Date().toISOString(),
                data: {
                    students: data.students || [],
                    standards: data.standards || [],
                    settings: data.settings || {}
                }
            };
            localStorage.setItem(LOCAL_BACKUP_KEY, JSON.stringify(essentialBackup));
        } else {
            localStorage.setItem(LOCAL_BACKUP_KEY, jsonString);
        }

        localStorage.setItem(BACKUP_TIMESTAMP_KEY, new Date().toISOString());

        console.log('LocalBackupService: Local backup created successfully');
        return true;
    } catch (error) {
        console.error('LocalBackupService: Failed to create local backup', error);
        return false;
    }
}

/**
 * Get the local backup if it exists
 */
export function getLocalBackup() {
    try {
        const backupString = localStorage.getItem(LOCAL_BACKUP_KEY);
        if (!backupString) return null;

        return JSON.parse(backupString);
    } catch (error) {
        console.error('LocalBackupService: Failed to read local backup', error);
        return null;
    }
}

/**
 * Get the timestamp of the last backup
 */
export function getBackupTimestamp() {
    const timestamp = localStorage.getItem(BACKUP_TIMESTAMP_KEY);
    return timestamp ? new Date(timestamp) : null;
}

/**
 * Clear the local backup
 */
export function clearLocalBackup() {
    localStorage.removeItem(LOCAL_BACKUP_KEY);
    localStorage.removeItem(BACKUP_TIMESTAMP_KEY);
}

/**
 * Check if a local backup exists
 */
export function hasLocalBackup() {
    return localStorage.getItem(LOCAL_BACKUP_KEY) !== null;
}

/**
 * Export all data as a downloadable JSON file
 * @param {Object} data - The complete data to export
 * @param {string} filename - The filename for the download
 */
export function exportToFile(data, filename = 'edunorm-backup') {
    try {
        const exportData = {
            appName: 'EduNorm',
            version: CURRENT_APP_VERSION,
            exportedAt: new Date().toISOString(),
            data: data
        };

        const jsonString = JSON.stringify(exportData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = `${filename}-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        URL.revokeObjectURL(url);

        return true;
    } catch (error) {
        console.error('LocalBackupService: Export failed', error);
        return false;
    }
}

/**
 * Import data from a JSON file
 * @param {File} file - The file to import
 * @returns {Promise<Object>} - The imported data
 */
export function importFromFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (event) => {
            try {
                const importedData = JSON.parse(event.target.result);

                // Validate the imported data structure
                if (!importedData.data) {
                    reject(new Error('Invalid backup file format'));
                    return;
                }

                resolve(importedData);
            } catch (error) {
                reject(new Error('Failed to parse backup file'));
            }
        };

        reader.onerror = () => {
            reject(new Error('Failed to read file'));
        };

        reader.readAsText(file);
    });
}

/**
 * Check if we should show a recovery prompt
 * (version changed and we have a backup)
 */
export function shouldShowRecoveryPrompt() {
    return hasVersionChanged() && hasLocalBackup();
}

/**
 * Automatic backup before potential data loss scenarios
 * Call this on critical operations or before updates
 */
export async function autoBackupBeforeUpdate(getAllDataFn) {
    try {
        console.log('LocalBackupService: Creating auto-backup before update...');

        const allData = await getAllDataFn();
        const success = createLocalBackup(allData);

        if (success) {
            console.log('LocalBackupService: Auto-backup completed successfully');
        }

        return success;
    } catch (error) {
        console.error('LocalBackupService: Auto-backup failed', error);
        return false;
    }
}
