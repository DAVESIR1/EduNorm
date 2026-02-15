/**
 * Cloud Sync Service - Automatic backup/restore like Google Contacts
 * Syncs user data automatically on login and periodically
 * With AES-256-GCM encryption and Timestamp-based Conflict Resolution
 */

import { db, isFirebaseConfigured } from '../config/firebase';
import {
    doc,
    setDoc,
    getDoc,
    serverTimestamp
} from 'firebase/firestore';
import * as localDb from './database';
import { encryptData, decryptData, isEncrypted } from './SecureEncryption';
import { safeJsonStringify } from '../utils/SafeJson';

// Sync status
let syncInProgress = false;
let lastSyncTime = null;
let syncListeners = [];

// App Version Management for Safety
const CURRENT_APP_VERSION = '2.1.0';
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
            return false;
        }
    } else if (!lastVersion) {
        await localDb.setSetting(VERSION_KEY, CURRENT_APP_VERSION);
    }
    return false;
}

/**
 * Perform automatic sync on login
 * Improved Logic: Timestamp-based "Last Write Wins" (prevents Undelete bug)
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

        // 1. Get Local Sync Info
        const localLastSynced = await localDb.getLastSyncTime(); // Valid timestamp or 0

        // 2. Get Cloud Valid Data
        const backupRef = doc(db, 'backups', userId);
        const backupSnap = await getDoc(backupRef);

        if (backupSnap.exists()) {
            const cloudData = backupSnap.data();
            const cloudLastModifiedISO = cloudData.lastModified;
            const cloudLastModified = cloudLastModifiedISO ? new Date(cloudLastModifiedISO).getTime() : 0;

            console.log(`CloudSync: Local Last Sync: ${new Date(localLastSynced).toISOString()}`);
            console.log(`CloudSync: Cloud Last Mod: ${new Date(cloudLastModified).toISOString()}`);

            // DECISION LOGIC:
            if (cloudLastModified > localLastSynced) {
                // Cloud is Newer -> Restore from Cloud
                console.log('CloudSync: Cloud is newer. Restoring...');
                await restoreFromCloudData(cloudData, userId);
                await localDb.setLastSyncTime(Date.now()); // Mark as synced
                notifySyncStatus({ type: 'synced', message: '🔄 Synced latest changes from cloud.' });
                return { success: true, action: 'synced_from_cloud' };
            } else {
                // Local is Newer (or Equal) -> Backup to Cloud
                // BUT only if we actually have data to backup, or valid reason.
                // Assuming local state is the "truth" since last sync.
                console.log('CloudSync: Local is up-to-date. Pushing backup...');
                await backupToCloudNow(userId, 'AUTO_SYNC');
                notifySyncStatus({ type: 'backed_up', message: '☁️ Cloud backup updated.' });
                return { success: true, action: 'backed_up' };
            }

        } else {
            // No Cloud Backup -> First Backup
            console.log('CloudSync: No cloud backup found. Creating first backup...');
            await backupToCloudNow(userId, 'FIRST_BACKUP');
            notifySyncStatus({ type: 'first_backup', message: '🚀 Initial cloud backup created!' });
            return { success: true, action: 'first_backup' };
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

    // Clean data using SafeJson to remove circular refs BEFORE encryption
    // Although encryptData does compression, JSON.stringify can choke on circular refs
    // We construct the object normally, but we rely on encryptData which likely does JSON.stringify internally

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

    // We pass the raw object. encryptData calls compressData which calls JSON.stringify.
    // To be safe, let's pre-sanitize if we suspect circular refs, but database data should be clean.
    // However, if needed:
    // const safeData = JSON.parse(safeJsonStringify(backupData)); 
    // We'll trust EncryptionService to handle it, or wrap it.

    const encryptedPackage = await encryptData(backupData, userId);

    const secureBackup = {
        ...encryptedPackage,
        backupDate: serverTimestamp(),
        lastModified: new Date().toISOString(),
        userId: userId,
        dataVersion: '2.0',
        backupReason: reason,
        security: 'AES-256-GCM + PBKDF2 + GZIP'
    };

    const backupRef = doc(db, 'backups', userId);

    // CHUNKING LOGIC FOR LARGE BACKUPS (> 900KB safe limit)
    const MAX_CHUNK_SIZE = 900 * 1024; // 900KB
    const encryptedString = secureBackup.encrypted;

    if (encryptedString.length > MAX_CHUNK_SIZE) {
        console.log(`CloudSync: Backup size ${encryptedString.length} exceeds limit. Chunking...`);
        const chunks = [];
        for (let i = 0; i < encryptedString.length; i += MAX_CHUNK_SIZE) {
            chunks.push(encryptedString.slice(i, i + MAX_CHUNK_SIZE));
        }

        // Save metadata WITHOUT the huge string
        await setDoc(backupRef, {
            ...secureBackup,
            encrypted: null, // Clear main body
            isChunked: true,
            totalChunks: chunks.length
        });

        // Save chunks to subcollection
        const batch = writeBatch(db);
        const chunksRef = collection(backupRef, 'chunks');

        // Delete old chunks first (to avoid stale data)
        const oldChunks = await getDocs(chunksRef);
        oldChunks.forEach(doc => batch.delete(doc.ref));
        await batch.commit();

        // Write new chunks
        // Can't use single batch if too many chunks, but reasonably we won't have THAT many for 1MB limit (maybe 5-10)
        const saveBatch = writeBatch(db);
        chunks.forEach((chunk, index) => {
            const chunkRef = doc(chunksRef, index.toString());
            saveBatch.set(chunkRef, { data: chunk, index });
        });
        await saveBatch.commit();
        console.log(`CloudSync: Saved ${chunks.length} chunks.`);

    } else {
        // Normal save
        await setDoc(backupRef, secureBackup);
    }

    // Update Local "Last Sync" Time to now
    await localDb.setLastSyncTime(Date.now());

    console.log('CloudSync: Encrypted backup completed');

    // ─── PUBLIC DIRECTORY SYNC ───
    try {
        await publishToPublicDirectory(students, settings, userId);
    } catch (pubErr) {
        console.warn('CloudSync: Public directory sync failed (Non-critical):', pubErr);
    }
}

/**
 * Publish essential student data to Public Directory for Verification
 * Writes to: schools/{uid}/students/{studentId}
 */
async function publishToPublicDirectory(students, settings, userId) {
    if (!students || students.length === 0) return;

    // CRITICAL FIX: Use Auth UID as the School ID to match MigrationService and Security Rules
    if (!userId) {
        console.warn('CloudSync: No User ID provided for public sync.');
        return;
    }

    const cleanSchoolId = userId;
    console.log(`CloudSync: Syncing ${students.length} students to Public Directory: schools/${cleanSchoolId}/students`);

    const { collection, writeBatch, doc: firestoreDoc } = await import('firebase/firestore');

    const schoolRef = firestoreDoc(db, 'schools', cleanSchoolId);

    // ROOT CAUSE FIX: Extract school info from BOTH top-level keys AND nested 'school_profile'
    // Settings may look like: { school_profile: { schoolName: '...', udiseNumber: '...' }, schoolName: '...', ... }
    // We need to check the nested object first, then fallback to top-level keys
    const profile = settings.school_profile || {};

    const schoolName = profile.schoolName || profile.name || settings.schoolName || settings.school_name || 'Unknown School';
    const udiseNumber = String(profile.udiseNumber || settings.udiseNumber || profile.udise || settings.udise || '').trim();
    const indexNumber = String(profile.indexNumber || settings.indexNumber || profile.index || settings.index || '').trim();
    const schoolEmail = profile.email || profile.schoolEmail || settings.schoolEmail || settings.email || '';
    const schoolCode = String(profile.schoolCode || settings.schoolCode || '').trim();

    console.log(`CloudSync: School Info -> Name="${schoolName}", UDISE="${udiseNumber}", Index="${indexNumber}", Code="${schoolCode}"`);

    // Create/Update School Doc with CORRECT info
    const schoolData = {
        name: schoolName,
        schoolName: schoolName,
        udiseNumber: udiseNumber,
        indexNumber: indexNumber,
        schoolCode: schoolCode,
        email: schoolEmail,
        ownerId: userId,
        lastUpdated: serverTimestamp()
    };

    // Use setDoc with merge to avoid overwriting existing data
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
            // CRITICAL FIX: Use grNo as doc ID to match MigrationService
            const grNoStr = String(student.grNo || '').trim();
            if (!grNoStr) return; // Skip students without GR number
            const docId = grNoStr.replace(/\//g, '-');
            const studentRef = firestoreDoc(db, `schools/${cleanSchoolId}/students`, docId);

            // Normalize aadharNo/aadharNumber
            const normalizedAadhar = String(student.aadharNo || student.aadharNumber || '');

            const publicData = {
                id: String(student.id || ''),
                grNo: grNoStr,
                name: student.name || student.nameEnglish || '',
                standard: student.standard || '',
                section: student.division || student.section || '',
                aadharNo: normalizedAadhar,
                aadharNumber: normalizedAadhar, // Sync both field names
                govId: String(student.govId || ''),
                sssmId: String(student.sssmId || ''), // Bug 2 fix: was missing
                email: student.email || '',
                dob: student.dob || '',
                mobile: String(student.contactNumber || student.mobile || ''),
                contactNumber: String(student.contactNumber || student.mobile || ''), // Sync both field names
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
    // REASSEMBLE CHUNKS IF NEEDED
    let encryptedDataToDecrypt = storedData.encrypted;

    if (storedData.isChunked) {
        console.log('CloudSync: Backup is chunked. Reassembling...');
        try {
            const { getDocs, collection, orderBy, query } = await import('firebase/firestore');
            const chunksRef = collection(db, 'backups', userId, 'chunks');
            const q = query(chunksRef, orderBy('index'));
            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                throw new Error('Backup is marked as chunked but no chunks found.');
            }

            encryptedDataToDecrypt = snapshot.docs.map(doc => doc.data().data).join('');
            console.log(`CloudSync: Reassembled ${snapshot.size} chunks. Total size: ${encryptedDataToDecrypt.length}`);
        } catch (err) {
            console.error('CloudSync: Failed to reassemble chunks:', err);
            throw new Error('Backup corrupted (missing chunks).');
        }
    }

    // DECRYPT DATA if encrypted
    let backupData;
    // Check if we have data to decrypt (either from chunks or direct)
    if (encryptedDataToDecrypt || isEncrypted(storedData)) {
        // If chunked, we constructed encryptedDataToDecrypt. 
        // If not chunked, storedData.encrypted might be present (if verified by isEncrypted)
        // But isEncrypted checks if 'security' field is present usually.

        // Helper: verify if we have the string
        const cipherText = encryptedDataToDecrypt || storedData.encrypted;

        if (!cipherText) {
            throw new Error('No encrypted data found to restore.');
        }

        console.log('CloudSync: Decrypting backup data...');
        // We pass a mock object with just the encrypted string if we reassembled it, 
        // OR pass the original storedData if it was simple.
        // Actually decryptData takes (encryptedPackage, userId). 
        // encryptedPackage expects { encrypted: string, iv: string, salt: string }

        const packageToDecrypt = {
            encrypted: cipherText,
            iv: storedData.iv,
            salt: storedData.salt
        };

        backupData = await decryptData(packageToDecrypt, userId);
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

    // Restore students — Bug 3 fix: use importAllData with Smart Merge
    // instead of addStudent() which silently fails on duplicate GR numbers
    if (backupData.students?.length > 0) {
        console.log(`CloudSync: Restoring ${backupData.students.length} students via Smart Merge...`);
        try {
            await localDb.importAllData({ students: backupData.students });
            console.log(`CloudSync: Students restored via Smart Merge successfully.`);
        } catch (e) {
            console.error('CloudSync: Student restore via Smart Merge failed:', e);
            // Fallback: try one-by-one with update
            let restoredCount = 0;
            for (const student of backupData.students) {
                try {
                    // Try to find existing by GR
                    const existing = await localDb.getStudentByGrNo(student.grNo);
                    if (existing) {
                        await localDb.updateStudent(existing.id, student);
                    } else {
                        await localDb.addStudent(student);
                    }
                    restoredCount++;
                } catch (innerErr) {
                    console.warn('CloudSync: Skip student:', student.grNo, innerErr.message);
                }
            }
            console.log(`CloudSync: Fallback restored ${restoredCount} students.`);
        }
    } else {
        console.warn('CloudSync: No students found in backup data.');
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
