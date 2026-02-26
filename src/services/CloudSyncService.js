/**
 * Cloud Sync Service - Automatic backup/restore like Google Contacts
 * Syncs user data automatically on login and periodically
 * With AES-256-GCM encryption for maximum security
 */

import { db, isFirebaseConfigured } from '../config/firebase';
import {
    doc,
    setDoc,
    getDoc,
    serverTimestamp,
    onSnapshot
} from 'firebase/firestore';
import * as localDb from './database';
import { encryptData, decryptData, isEncrypted } from './SecureEncryption';

// Sync status
let syncInProgress = false;
let lastSyncTime = null;
let syncListeners = [];

// Notify sync status listeners
function notifySyncStatus(status) {
    syncListeners.forEach(listener => listener(status));
}

// Subscribe to sync status changes
export function onSyncStatusChange(callback) {
    syncListeners.push(callback);
    return () => {
        syncListeners = syncListeners.filter(l => l !== callback);
    };
}

// Get current sync status
export function getSyncStatus() {
    return {
        inProgress: syncInProgress,
        lastSync: lastSyncTime,
        configured: isFirebaseConfigured && !!db
    };
}

/**
 * Perform automatic sync on login
 * Like Google Contacts - check cloud data and sync appropriately
 */
export async function autoSyncOnLogin(userId) {
    if (!userId || !isFirebaseConfigured || !db) {
        console.log('CloudSync: Skipping - not configured or no user');
        return { success: false, reason: 'not_configured' };
    }

    if (syncInProgress) {
        console.log('CloudSync: Already in progress');
        return { success: false, reason: 'in_progress' };
    }

    syncInProgress = true;
    notifySyncStatus({ type: 'started', message: 'Syncing with cloud...' });

    try {
        console.log('CloudSync: Starting auto-sync for user:', userId);

        // Get cloud backup info
        const backupRef = doc(db, 'backups', userId);
        const backupSnap = await getDoc(backupRef);

        // Get local data counts
        const localStudents = await localDb.getAllStudentsForBackup();
        const localStandards = await localDb.getAllStandards();
        const localStudentCount = localStudents?.length || 0;
        const localStandardCount = localStandards?.length || 0;

        if (backupSnap.exists()) {
            const cloudData = backupSnap.data();
            const cloudStudentCount = cloudData.students?.length || 0;
            const cloudStandardCount = cloudData.standards?.length || 0;

            console.log(`CloudSync: Local has ${localStudentCount} students, Cloud has ${cloudStudentCount}`);

            // Decision logic like Google Contacts:
            // 1. If local is empty but cloud has data -> restore from cloud
            // 2. If local has data but cloud is empty -> backup to cloud
            // 3. If both have data -> use the one with more data (or more recent)

            if (localStudentCount === 0 && localStandardCount === 0 &&
                (cloudStudentCount > 0 || cloudStandardCount > 0)) {
                // Restore from cloud
                console.log('CloudSync: Local empty, restoring from cloud...');
                await restoreFromCloudData(cloudData, userId);
                lastSyncTime = new Date();
                notifySyncStatus({
                    type: 'restored',
                    message: `🔓 Restored ${cloudStudentCount} students from cloud!`
                });
                return { success: true, action: 'restored', studentCount: cloudStudentCount };
            }
            else if (localStudentCount > 0 && cloudStudentCount === 0) {
                // Backup to cloud
                console.log('CloudSync: Cloud empty, backing up local data...');
                await backupToCloudNow(userId);
                lastSyncTime = new Date();
                notifySyncStatus({
                    type: 'backed_up',
                    message: `Backed up ${localStudentCount} students to cloud!`
                });
                return { success: true, action: 'backed_up', studentCount: localStudentCount };
            }
            else if (localStudentCount > 0 && cloudStudentCount > 0) {
                // Both have data - prefer cloud if it has more or same data
                // This ensures data isn't lost
                if (cloudStudentCount >= localStudentCount) {
                    console.log('CloudSync: Cloud has more/equal data, syncing from cloud...');
                    await restoreFromCloudData(cloudData, userId);
                    lastSyncTime = new Date();
                    notifySyncStatus({
                        type: 'synced',
                        message: '🔓 Data synced from cloud!'
                    });
                    return { success: true, action: 'synced_from_cloud' };
                } else {
                    // Local has more - backup to cloud
                    console.log('CloudSync: Local has more data, backing up...');
                    await backupToCloudNow(userId);
                    lastSyncTime = new Date();
                    notifySyncStatus({
                        type: 'backed_up',
                        message: 'Local data backed up to cloud!'
                    });
                    return { success: true, action: 'backed_up' };
                }
            }
            else {
                // Both empty - nothing to sync
                console.log('CloudSync: Nothing to sync');
                lastSyncTime = new Date();
                return { success: true, action: 'nothing_to_sync' };
            }
        } else {
            // No cloud backup exists
            if (localStudentCount > 0 || localStandardCount > 0) {
                // Backup local data to cloud
                console.log('CloudSync: No cloud backup, creating first backup...');
                await backupToCloudNow(userId);
                lastSyncTime = new Date();
                notifySyncStatus({
                    type: 'first_backup',
                    message: 'Created your first cloud backup!'
                });
                return { success: true, action: 'first_backup' };
            }
            return { success: true, action: 'nothing_to_sync' };
        }
    } catch (error) {
        console.error('CloudSync: Auto-sync error:', error);
        notifySyncStatus({ type: 'error', message: error.message });
        return { success: false, error: error.message };
    } finally {
        syncInProgress = false;
    }
}

/**
 * Backup current data to cloud (with encryption)
 */
async function backupToCloudNow(userId) {
    if (!userId || !db) throw new Error('Not configured');

    // Gather all local data
    const settingsArray = await localDb.getAllSettings();
    const settings = {};
    if (settingsArray?.length) {
        settingsArray.forEach(item => {
            if (item.key) settings[item.key] = item.value;
        });
    }

    const students = await localDb.getAllStudentsForBackup();
    const standards = await localDb.getAllStandards();
    const customFields = await localDb.getAllCustomFields();
    const ledger = await localDb.getAllLedgerEntries();

    const backupData = {
        settings,
        students,
        standards,
        customFields,
        ledger,
        appVersion: '2.0.0'
    };

    // ENCRYPT DATA
    console.log('CloudSync: Encrypting data...');
    const encryptedPackage = await encryptData(backupData, userId);

    const secureBackup = {
        ...encryptedPackage,
        backupDate: serverTimestamp(),
        lastModified: new Date().toISOString(),
        userId: userId,
        dataVersion: '2.0',
        security: 'AES-256-GCM + PBKDF2 + GZIP'
    };

    const backupRef = doc(db, 'backups', userId);
    await setDoc(backupRef, secureBackup);
    console.log('CloudSync: Encrypted backup completed');
}

/**
 * Restore data from cloud backup object (with decryption)
 */
async function restoreFromCloudData(storedData, userId) {
    // DECRYPT DATA if encrypted
    let backupData;
    if (isEncrypted(storedData)) {
        console.log('CloudSync: Decrypting backup data...');
        backupData = await decryptData(storedData, userId);
        console.log('CloudSync: Data decrypted!');
    } else {
        // Legacy unencrypted backup
        console.log('CloudSync: Legacy backup (unencrypted)');
        backupData = storedData;
    }

    // Restore settings
    if (backupData.settings) {
        for (const [key, value] of Object.entries(backupData.settings)) {
            await localDb.setSetting(key, value);
        }
    }

    // Restore standards
    if (backupData.standards?.length > 0) {
        for (const standard of backupData.standards) {
            try {
                await localDb.addStandard(standard);
            } catch (e) {
                console.log('CloudSync: Standard already exists:', standard.name);
            }
        }
    }

    // Restore custom fields
    if (backupData.customFields?.length > 0) {
        for (const field of backupData.customFields) {
            try {
                await localDb.addCustomField(field);
            } catch (e) {
                console.log('CloudSync: Field already exists:', field.name);
            }
        }
    }

    // Restore students
    if (backupData.students?.length > 0) {
        for (const student of backupData.students) {
            try {
                await localDb.addStudent(student);
            } catch (e) {
                console.log('CloudSync: Student already exists:', student.grNo);
            }
        }
    }

    console.log('CloudSync: Restore completed');
}

/**
 * Trigger backup on data change (debounced)
 */
let backupTimeout = null;
export function scheduleBackup(userId) {
    if (!userId || !isFirebaseConfigured || !db) return;

    // Debounce - wait 5 seconds after last change before backing up
    if (backupTimeout) clearTimeout(backupTimeout);

    backupTimeout = setTimeout(async () => {
        if (syncInProgress) return;

        try {
            syncInProgress = true;
            console.log('CloudSync: Auto-backup triggered by data change');
            await backupToCloudNow(userId);
            lastSyncTime = new Date();
            notifySyncStatus({ type: 'auto_backup', message: 'Data auto-saved to cloud' });
        } catch (error) {
            console.error('CloudSync: Auto-backup failed:', error);
        } finally {
            syncInProgress = false;
        }
    }, 5000);
}

/**
 * Force immediate backup
 */
export async function forceBackup(userId) {
    if (!userId || !isFirebaseConfigured || !db) {
        return { success: false, error: 'Not configured' };
    }

    if (syncInProgress) {
        return { success: false, error: 'Sync in progress' };
    }

    try {
        syncInProgress = true;
        notifySyncStatus({ type: 'backing_up', message: 'Backing up...' });
        await backupToCloudNow(userId);
        lastSyncTime = new Date();
        notifySyncStatus({ type: 'success', message: 'Backup complete!' });
        return { success: true };
    } catch (error) {
        notifySyncStatus({ type: 'error', message: error.message });
        return { success: false, error: error.message };
    } finally {
        syncInProgress = false;
    }
}

export default {
    autoSyncOnLogin,
    scheduleBackup,
    forceBackup,
    onSyncStatusChange,
    getSyncStatus
};
