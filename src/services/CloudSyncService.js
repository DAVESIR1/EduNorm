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

// App Version Management for Safety
const CURRENT_APP_VERSION = '2.1.0'; // Increment this whenever DB schema changes
const VERSION_KEY = 'app_data_version';

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
        configured: isFirebaseConfigured && !!db,
        version: CURRENT_APP_VERSION
    };
}

/**
 * SAFETY CHECK: Perform Pre-Update Backup if versions change
 */
export async function checkAndPerformSafetyBackup(userId) {
    if (!userId) return;

    const lastVersion = await localDb.getSetting(VERSION_KEY);

    if (lastVersion && lastVersion !== CURRENT_APP_VERSION) {
        console.log(`CloudSync: Version upgrade detected (${lastVersion} -> ${CURRENT_APP_VERSION}). Performing SAFETY BACKUP.`);
        notifySyncStatus({ type: 'safety_backup', message: '⚠️ Updating App... Backing up data first!' });

        try {
            await backupToCloudNow(userId, 'PRE_UPDATE_SAFETY');
            await localDb.setSetting(VERSION_KEY, CURRENT_APP_VERSION);
            notifySyncStatus({ type: 'success', message: 'Safety backup complete. Update applied.' });
            return true;
        } catch (e) {
            console.error('SAFETY BACKUP FAILED:', e);
            notifySyncStatus({ type: 'error', message: 'Safety Backup Failed! Please check connection.' });
            // In a strict mode, we might throw here to prevent the app from loading
            return false;
        }
    } else if (!lastVersion) {
        // First run or fresh install
        await localDb.setSetting(VERSION_KEY, CURRENT_APP_VERSION);
    }
    return false;
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
                // Both have data - "Smart Conflict Resolution"
                // 1. Check Timestamps (Last Modified Wins) if available
                const cloudTime = cloudData.lastModified ? new Date(cloudData.lastModified).getTime() : 0;

                // We'll estimate local modification time or use a stored value
                // Ideally, we'd store a local 'lastBackedUp' timestamp, but for now, let's use a safe heuristic:
                // If Cloud is significantly newer (e.g. > 1 hour) than our last known sync, it likely has changes from another device.

                // For this implementation, we prioritizing DATA SAFETY:
                if (cloudStudentCount > localStudentCount) {
                    // Cloud has MORE data -> Restore
                    console.log('CloudSync: Cloud has MORE data, restoring...');
                    await restoreFromCloudData(cloudData, userId);
                    notifySyncStatus({ type: 'restored', message: '📥 Fetched missing data from cloud!' });
                    return { success: true, action: 'restored' };
                } else if (cloudTime > (Date.now() - 60000)) {
                    // Cloud was modified very recently (e.g. just now by another device), and we are just logging in.
                    // This is a common case for multi-device usage.
                    console.log('CloudSync: Cloud is newer, syncing down...');
                    await restoreFromCloudData(cloudData, userId);
                    notifySyncStatus({ type: 'synced', message: '🔄 Synced latest changes from cloud.' });
                    return { success: true, action: 'synced_from_cloud' };
                } else {
                    // Local is authoritative or same -> Backup to make cloud current
                    console.log('CloudSync: Local is authoritative, backing up...');
                    await backupToCloudNow(userId, 'AUTO_SYNC');
                    notifySyncStatus({ type: 'backed_up', message: '☁️ Cloud backup updated.' });
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
            // No cloud backup exists (First time or deleted)
            if (localStudentCount > 0 || localStandardCount > 0) {
                // Backup local data to cloud
                console.log('CloudSync: No cloud backup, creating first backup...');
                await backupToCloudNow(userId, 'FIRST_BACKUP');
                lastSyncTime = new Date();
                notifySyncStatus({
                    type: 'first_backup',
                    message: '🚀 Initial cloud backup created!'
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
async function backupToCloudNow(userId, reason = 'MANUAL') {
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
        appVersion: CURRENT_APP_VERSION
    };

    // ENCRYPT DATA
    console.log(`CloudSync: Encrypting data (${reason})...`);
    const encryptedPackage = await encryptData(backupData, userId);

    const secureBackup = {
        ...encryptedPackage,
        backupDate: serverTimestamp(),
        lastModified: new Date().toISOString(),
        userId: userId,
        dataVersion: '2.0',
        backupReason: reason, // Traceability
        security: 'AES-256-GCM + PBKDF2 + GZIP'
    };


    const backupRef = doc(db, 'backups', userId);
    await setDoc(backupRef, secureBackup);
    console.log('CloudSync: Encrypted backup completed');

    // ─── PUBLIC DIRECTORY SYNC (For Student Verification) ───
    try {
        await publishToPublicDirectory(students, settings);
    } catch (pubErr) {
        console.warn('CloudSync: Public directory sync failed (Non-critical):', pubErr);
    }
}

/**
 * Publish essential student data to Public Directory for Verification
 * Writes to: schools/{schoolId}/students/{studentId}
 */
async function publishToPublicDirectory(students, settings) {
    if (!students || students.length === 0) return;

    // 1. Identify School ID (UDISE or Index)
    // We prefer the 'id' if it matches the code, or the code itself
    const schoolId = settings.id || settings.udiseNumber || settings.indexNumber || settings.schoolCode;

    if (!schoolId) {
        console.warn('CloudSync: No School ID found, skipping public sync.');
        return;
    }

    const cleanSchoolId = String(schoolId).trim().replace(/[^a-zA-Z0-9]/g, '');
    console.log(`CloudSync: Syncing ${students.length} students to Public Directory: schools/${cleanSchoolId}/students`);

    const { collection, writeBatch, doc: firestoreDoc } = await import('firebase/firestore');

    // We use batches to write efficiently (max 500 ops per batch)
    // For now, we'll confirm the School Document exists first
    const schoolRef = firestoreDoc(db, 'schools', cleanSchoolId);

    // Create/Update School Doc with basic info
    const schoolData = {
        name: settings.schoolName || 'Unknown School',
        udiseNumber: settings.udiseNumber || '',
        indexNumber: settings.indexNumber || '',
        lastUpdated: serverTimestamp()
    };

    // Use setDoc with merge to avoid overwriting existing data if any
    await setDoc(schoolRef, schoolData, { merge: true });

    // Batch write students
    // Optimization: Only write if data changed? Hard to know without tracking.
    // robust approach: Write all.

    const BATCH_SIZE = 450; // Safety margin below 500
    const chunks = [];

    for (let i = 0; i < students.length; i += BATCH_SIZE) {
        chunks.push(students.slice(i, i + BATCH_SIZE));
    }

    for (const chunk of chunks) {
        const batch = writeBatch(db);
        chunk.forEach(student => {
            if (!student.id) return; // Skip invalid
            const studentRef = firestoreDoc(db, `schools/${cleanSchoolId}/students`, String(student.id));

            // Only sync searchable/verifiable fields to public directory
            // We strip sensitive data not needed for verification if we wanted to be strict,
            // but for verifyStudent() to work flexibly, we send the core object.
            // Let's send a sanitized version.
            const publicData = {
                id: student.id,
                grNo: student.grNo, // Critical
                name: student.name,
                standard: student.standard,
                section: student.division || student.section || '',
                aadharNo: student.aadharNo || '', // Critical for verification
                govId: student.govId || '',
                dob: student.dob || '',
                mobile: student.mobile || '',
                gender: student.gender || '',
                lastUpdated: serverTimestamp()
            };

            batch.set(studentRef, publicData, { merge: true });
        });

        await batch.commit();
        console.log(`CloudSync: Published batch of ${chunk.length} students.`);
    }

    console.log('CloudSync: Public Directory Sync Complete.');
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
