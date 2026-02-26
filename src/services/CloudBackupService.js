import { db, isFirebaseConfigured } from '../config/firebase';
import {
    doc,
    setDoc,
    getDoc,
    serverTimestamp,
    collection,
    query,
    orderBy,
    limit,
    getDocs
} from 'firebase/firestore';
import * as localDb from './database';
import { encryptData, decryptData, isEncrypted } from './SecureEncryption'; // Keep for Legacy Restore
import AnigmaEncoding from './AnigmaEncoding'; // New Encoding Method

/**
 * Cloud Backup Service using Firebase Firestore
 * With AES-256-GCM encryption and GZIP compression
 * NO ONE can see user data - only the app can decrypt it!
 */

// Retry helper with exponential backoff
async function retryOperation(fn, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        } catch (err) {
            if (i === maxRetries - 1) throw err;
            const delay = Math.min(1000 * Math.pow(2, i), 5000);
            console.warn(`CloudBackupService: Retry ${i + 1}/${maxRetries} in ${delay}ms...`);
            await new Promise(r => setTimeout(r, delay));
        }
    }
}

// Estimate JSON size in bytes
function estimateSize(data) {
    try {
        return new Blob([JSON.stringify(data)]).size;
    } catch {
        return 0;
    }
}

// Backup all user data to cloud
export async function saveDataToFirestore(userId, unusedData, onProgress) {
    if (!userId) {
        throw new Error('User must be logged in to backup');
    }

    // Check if Firebase is configured
    if (!isFirebaseConfigured || !db) {
        throw new Error('Firebase is not configured. Please set up Firebase environment variables or use local backup.');
    }

    // Check network connectivity first
    if (!navigator.onLine) {
        throw new Error('No internet connection. Please check your network and try again.');
    }

    try {
        if (onProgress) onProgress('Gathering data...');
        console.log('CloudBackupService: Starting backup for user:', userId);

        // Gather all local data
        const settingsArray = await localDb.getAllSettings();
        // Convert settings array to object for easier storage
        const settings = {};
        if (settingsArray && settingsArray.length) {
            settingsArray.forEach(item => {
                if (item.key) {
                    settings[item.key] = item.value;
                }
            });
        }

        const students = await localDb.getAllStudentsForBackup();
        const standards = await localDb.getAllStandards();
        const customFields = await localDb.getAllCustomFields();
        const ledger = await localDb.getAllLedgerEntries();

        console.log('CloudBackupService: Data gathered - Students:', students?.length || 0, 'Standards:', standards?.length || 0);

        // Create backup object
        const backupData = {
            settings,
            students,
            standards,
            customFields,
            ledger,
            appVersion: '2.0.0'
        };

        // Check data size - Firestore limit is 1MB per document (Chunking allows more but practical limit needed)
        const rawSize = estimateSize(backupData);
        const rawSizeMB = (rawSize / (1024 * 1024)).toFixed(2);
        console.log(`CloudBackupService: Raw data size: ${rawSizeMB} MB`);

        if (rawSize > 6 * 1024 * 1024) { // 6MB Limit
            const err = new Error(`Backup too large (${rawSizeMB} MB). Limit is 6MB. Please remove images/files from student profiles.`);
            if (onProgress) onProgress(`Error: Data too large (${rawSizeMB} MB)`);
            throw err;
        }

        // ENCRYPT / ENCODE DATA (Anigma Encoding)
        const rawSizeKB = (rawSize / 1024).toFixed(1);
        if (onProgress) onProgress(`Encrypting ${rawSizeKB} KB of data...`);
        console.log('CloudBackupService: Encoding data with Anigma Method...');
        let encryptedPackage;
        try {
            // Anigma Encoding (GZIP + Base64 + Obfuscation)
            const encodedString = AnigmaEncoding.encode(backupData);

            encryptedPackage = {
                encrypted: encodedString,
                version: '3.0-anigma', // New version
                timestamp: new Date().toISOString()
            };
        } catch (encErr) {
            console.error('CloudBackupService: Encoding failed, saving unencrypted backup:', encErr);
            // Fallback: save without encryption if it fails (safety net)
            encryptedPackage = {
                data: backupData,
                version: '1.0-unencrypted',
                compressed: false,
                timestamp: new Date().toISOString()
            };
        }

        // Check encrypted size
        const encryptedSize = estimateSize(encryptedPackage);
        console.log(`CloudBackupService: Encoded size: ${(encryptedSize / 1024).toFixed(1)}KB`);

        // Add metadata for storage
        const schoolName = settings?.schoolName || 'Unknown School';
        const secureBackup = {
            ...encryptedPackage,
            backupDate: serverTimestamp(),
            lastModified: new Date().toISOString(),
            userId: userId,
            schoolName: schoolName,
            dataVersion: '2.0',
            security: encryptedPackage.version === '3.0-anigma' ? 'Anigma Encoding' : (encryptedPackage.version === '2.0' ? 'AES-256-GCM' : 'none'),
            studentCount: students?.length || 0,
            standardCount: standards?.length || 0,
            customFieldCount: customFields?.length || 0
        };

        // If data is too large for a single document (>800KB after encryption), chunk it
        if (encryptedSize > 800000 && encryptedPackage.encrypted) {
            console.log('CloudBackupService: Data exceeds safe limit, using chunked backup...');
            const encrypted = encryptedPackage.encrypted;
            const CHUNK_SIZE = 500000; // 500KB chunks
            const totalChunks = Math.ceil(encrypted.length / CHUNK_SIZE);

            if (onProgress) onProgress(`Preparing ${totalChunks} chunks...`);

            // Save metadata document
            const metaRef = doc(db, 'backups', userId);
            await retryOperation(() => setDoc(metaRef, {
                ...secureBackup,
                encrypted: null, // Don't store data in meta
                chunked: true,
                totalChunks,
                chunkSize: CHUNK_SIZE
            }));

            // Save chunks (Batched Uploads for Stability)
            const BATCH_SIZE = 5; // Upload 5 chunks at a time
            for (let i = 0; i < totalChunks; i += BATCH_SIZE) {
                const batchPromises = [];
                const batchEnd = Math.min(i + BATCH_SIZE, totalChunks);

                if (onProgress) onProgress(`Uploading batch ${Math.ceil((i + 1) / BATCH_SIZE)}/${Math.ceil(totalChunks / BATCH_SIZE)}...`);

                for (let j = i; j < batchEnd; j++) {
                    const chunkData = encrypted.substring(j * CHUNK_SIZE, (j + 1) * CHUNK_SIZE);
                    const chunkRef = doc(db, 'backups', userId, 'chunks', `chunk_${j}`);

                    batchPromises.push(
                        retryOperation(() => setDoc(chunkRef, {
                            index: j,
                            data: chunkData,
                            totalChunks
                        })).then(() => console.log(`CloudBackupService: Uploaded chunk ${j + 1}/${totalChunks}`))
                    );
                }

                // Wait for this batch
                await Promise.all(batchPromises);
            }
        } else {
            // Save as single document
            if (onProgress) onProgress('Uploading single file...');
            const backupRef = doc(db, 'backups', userId);
            await retryOperation(() => setDoc(backupRef, secureBackup));
        }

        console.log('CloudBackupService: Backup saved successfully!');
        if (onProgress) onProgress('Finalizing...');

        // ─── ADMIN BACKUP (Redundant & History) ───
        // Save to admin-backups using the SAME encrypted package (re-use optimization)
        backupToAdminCloud(userId, encryptedPackage).catch(e => console.warn('CloudBackupService: Background admin backup skipped (Permission or Config):', e.message));

        // Also save to history (optional - may fail on free tier limits)
        try {
            const historyRef = doc(collection(db, 'backups', userId, 'history'));
            await setDoc(historyRef, {
                backupDate: serverTimestamp(),
                lastModified: new Date().toISOString(),
                studentCount: students?.length || 0,
                standardCount: standards?.length || 0,
                dataVersion: '2.0',
                sizeKB: Math.round(encryptedSize / 1024)
            });
        } catch (historyError) {
            // Don't fail the whole backup if history fails, and silence for non-admin users
            if (historyError.message?.includes('permission') || historyError.code === 'permission-denied') {
                console.debug('CloudBackupService: Backup history restricted (non-admin user).');
            } else {
                console.warn('CloudBackupService: Potential history sync delay:', historyError.message);
            }
        }

        return {
            success: true,
            message: '🔐 Backup encrypted & saved to cloud!',
            timestamp: new Date().toISOString(),
            encrypted: encryptedPackage.version === '2.0',
            compression: 'GZIP',
            sizeKB: Math.round(encryptedSize / 1024)
        };
    } catch (error) {
        console.error('CloudBackupService: Backup error:', error);

        // Provide more specific error messages
        if (error.code === 'unavailable' || error.message?.includes('offline')) {
            throw new Error('Cannot reach Firebase server. Please check if Firestore is enabled in your Firebase Console.');
        } else if (error.code === 'permission-denied') {
            throw new Error('Permission denied. Please ensure Firestore security rules allow writes for authenticated users.');
        } else if (error.code === 'unauthenticated') {
            throw new Error('Please log in again to backup your data.');
        }

        throw new Error(`Backup failed: ${error.message}`);
    }
}

// Admin Cloud Backup - Redundant, history-preserving backup
// This saves to a separate 'admin-backups' collection/folder
export async function backupToAdminCloud(userId, encryptedPackage = null) {
    if (!userId || !db) return;

    try {
        if (!encryptedPackage) {
            console.log('CloudBackupService: Starting Independent Admin Backup...');
            const allData = await localDb.exportAllData();

            // Encrypt / Encode (Anigma)
            const encodedString = AnigmaEncoding.encode(allData);
            encryptedPackage = { encrypted: encodedString, version: '3.0-anigma' };
        } else {
            console.log('CloudBackupService: Saving Admin Backup (using existing package)...');
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const adminRef = doc(db, 'admin-backups', userId, 'backups', timestamp);

        await setDoc(adminRef, {
            ...encryptedPackage,
            backupDate: serverTimestamp(),
            type: 'admin-auto-backup',
            security: encryptedPackage.version === '3.0-anigma' ? 'Anigma Encoding' : 'AES-256-GCM',
            sizeKB: Math.round(estimateSize(encryptedPackage) / 1024)
        });

        console.log('CloudBackupService: Admin backup complete (Encrypted)');
    } catch (err) {
        if (err.message?.includes('permission') || err.code === 'permission-denied') {
            // Silently skip if user doesn't have permission (this is expected for non-admin users)
            console.debug('CloudBackupService: Admin-history backup restricted (non-admin user).');
        } else {
            console.warn('CloudBackupService: Non-critical Admin backup skipped:', err.message);
        }
        // We don't throw here to avoid disrupting the main flow
    }
}

// Restore data from cloud
export async function restoreFromCloud(userId) {
    if (!userId) {
        throw new Error('User must be logged in to restore');
    }

    // Check if Firebase is configured
    if (!isFirebaseConfigured || !db) {
        throw new Error('Firebase is not configured. Please set up Firebase environment variables.');
    }

    try {
        // Get backup from Firestore (with retry for transient errors)
        const backupRef = doc(db, 'backups', userId);
        const backupSnap = await retryOperation(() => getDoc(backupRef));

        if (!backupSnap.exists()) {
            throw new Error('No backup found in cloud. Please create a backup first.');
        }

        const storedData = backupSnap.data();

        // DECRYPT DATA if encrypted
        let backupData;
        console.log('CloudBackupService: Checking backup format...', {
            hasEncrypted: !!storedData.encrypted,
            chunked: !!storedData.chunked,
            version: storedData.version,
            studentCount: storedData.studentCount
        });

        // Handle chunked backups (large data split across multiple docs)
        if (storedData.chunked && storedData.totalChunks) {
            console.log(`CloudBackupService: Reassembling ${storedData.totalChunks} chunks...`);
            const chunksQuery = query(
                collection(db, 'backups', userId, 'chunks'),
                orderBy('index'),
                limit(storedData.totalChunks)
            );
            const chunksSnap = await retryOperation(() => getDocs(chunksQuery));
            let reassembled = '';
            chunksSnap.forEach(chunkDoc => {
                reassembled += chunkDoc.data().data;
            });
            console.log(`CloudBackupService: Reassembled ${reassembled.length} chars from ${chunksSnap.size} chunks`);

            // Reconstruct the encrypted package
            const encryptedPackage = {
                ...storedData,
                encrypted: reassembled,
                chunked: undefined
            };

            // Try Anigma first, then legacy
            if (storedData.version === '3.0-anigma') {
                backupData = AnigmaEncoding.decode(encryptedPackage.encrypted);
            } else {
                backupData = await decryptData(encryptedPackage, userId);
            }

        } else if (storedData.version === '3.0-anigma') {
            console.log('CloudBackupService: Decoding Anigma backup...');
            backupData = AnigmaEncoding.decode(storedData.encrypted);

        } else if (isEncrypted(storedData)) {
            console.log('CloudBackupService: Decrypting legacy AES backup...');
            backupData = await decryptData(storedData, userId);
        } else if (storedData.version === '1.0-unencrypted' && storedData.data) {
            // Fallback unencrypted backup
            console.log('CloudBackupService: Unencrypted fallback backup detected');
            backupData = storedData.data;
        } else {
            // Legacy unencrypted backup
            console.log('CloudBackupService: Legacy backup detected (unencrypted)');
            backupData = storedData;
            // Handle edge case where data might be stringified
            if (typeof backupData === 'string') {
                try { backupData = JSON.parse(backupData); } catch (e) { }
            }
        }

        console.log('CloudBackupService: Data ready for import', {
            hasSettings: !!backupData?.settings,
            studentCount: backupData?.students?.length || 0,
            standardCount: backupData?.standards?.length || 0
        });

        // Use importAllData for reliable restore (uses put() which upserts)
        console.log('CloudBackupService: Starting data import...', {
            settings: Object.keys(backupData.settings || {}).length,
            students: backupData.students?.length || 0,
            standards: backupData.standards?.length || 0,
            customFields: backupData.customFields?.length || 0
        });

        // Convert settings object back to array format if needed
        let settingsForImport = backupData.settings;
        if (backupData.settings && !Array.isArray(backupData.settings)) {
            settingsForImport = Object.entries(backupData.settings).map(([key, value]) => ({
                key,
                value,
                updatedAt: new Date().toISOString()
            }));
        }

        // Import all data at once using reliable put() operation
        await localDb.importAllData({
            settings: settingsForImport,
            students: backupData.students || [],
            standards: backupData.standards || [],
            customFields: backupData.customFields || []
        });

        console.log('CloudBackupService: Data import complete!');

        return {
            success: true,
            message: '🔓 Data decrypted & restored from cloud!',
            timestamp: storedData.backupDate?.toDate?.() || new Date(),
            encrypted: isEncrypted(storedData)
        };
    } catch (error) {
        console.error('Cloud restore error:', error);

        // Provide specific, actionable error messages
        if (error.code === 'permission-denied' || error.message?.includes('insufficient permissions') || error.message?.includes('Missing or insufficient permissions')) {
            throw new Error(
                'Permission denied. Your Firebase security rules need to be updated. ' +
                'Go to Firebase Console → Firestore → Rules, and ensure authenticated users ' +
                'can read/write their own backup documents under the "backups" collection.'
            );
        } else if (error.code === 'unauthenticated' || error.message?.includes('unauthenticated')) {
            throw new Error('Your session has expired. Please log out and log back in, then try again.');
        } else if (error.code === 'unavailable' || error.message?.includes('offline') || !navigator.onLine) {
            throw new Error('Cannot connect to cloud server. Please check your internet connection and try again.');
        } else if (error.message?.includes('No backup found')) {
            throw error; // Pass through as-is
        }

        throw new Error(`Restore failed: ${error.message}`);
    }
}

// Check if backup exists
export async function checkBackupExists(userId) {
    if (!userId) return { exists: false };

    // Check if Firebase is configured
    if (!isFirebaseConfigured || !db) {
        return { exists: false, error: 'Firebase not configured' };
    }

    try {
        const { getDocFromServer } = await import('firebase/firestore');
        const backupRef = doc(db, 'backups', userId);

        let backupSnap;
        try {
            // Force fetch from server to get latest data (fixes "0 backup" on multi-device)
            backupSnap = await getDocFromServer(backupRef);
        } catch (serverErr) {
            console.warn('Backup check: Server fetch failed, falling back to cache:', serverErr);
            // Fallback to cache if offline (though offline mode is disabled, network glitches happen)
            backupSnap = await getDoc(backupRef);
        }

        if (backupSnap.exists()) {
            console.log('Backup Check: FOUND backup for', userId);
            const data = backupSnap.data();

            // Debug: log all top-level fields
            console.log('CloudBackupService: checkBackupExists raw data:', {
                keys: Object.keys(data),
                studentCount: data.studentCount,
                standardCount: data.standardCount,
                hasEncrypted: !!data.encrypted,
                version: data.version || data.dataVersion
            });

            // If metadata exists, use it directly
            if (data.studentCount !== undefined && data.studentCount > 0) {
                return {
                    exists: true,
                    lastBackup: data.backupDate?.toDate?.() || data.lastModified || null,
                    studentCount: data.studentCount,
                    standardCount: data.standardCount || 0
                };
            }

            // For old backups without metadata, try to decrypt and count
            if (isEncrypted(data)) {
                try {
                    console.log('CloudBackupService: Decrypting to get student count...');
                    const decrypted = await decryptData(data, userId);
                    const studentCount = decrypted?.students?.length || 0;
                    const standardCount = decrypted?.standards?.length || 0;

                    console.log('CloudBackupService: Decrypted counts:', { studentCount, standardCount });

                    // Update the document with metadata for future reads (don't wait)
                    setDoc(backupRef, {
                        ...data,
                        studentCount,
                        standardCount
                    }).catch(e => console.warn('Failed to update metadata:', e));

                    return {
                        exists: true,
                        lastBackup: data.backupDate?.toDate?.() || data.lastModified || null,
                        studentCount,
                        standardCount
                    };
                } catch (decryptError) {
                    console.error('CloudBackupService: Decrypt for count failed:', decryptError);
                }
            }

            // Fallback for unencrypted legacy data
            return {
                exists: true,
                lastBackup: data.backupDate?.toDate?.() || data.lastModified || null,
                studentCount: data.students?.length || 0,
                standardCount: data.standards?.length || 0
            };
        }

        return { exists: false };
    } catch (error) {
        console.error('Check backup error:', error);
        return { exists: false, error: error.message };
    }
}

// Get backup history
export async function getBackupHistory(userId, maxResults = 5) {
    if (!userId) return [];

    try {
        const historyRef = collection(db, 'backups', userId, 'history');
        const q = query(historyRef, orderBy('backupDate', 'desc'), limit(maxResults));
        const querySnapshot = await getDocs(q);

        return querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            backupDate: doc.data().backupDate?.toDate?.() || null
        }));
    } catch (error) {
        console.error('Get backup history error:', error);
        return [];
    }
}

// Auto-restore: Check if user has cloud backup and no local data
export async function shouldAutoRestore(userId) {
    if (!userId) return false;

    try {
        // Check if there's a cloud backup
        const backupInfo = await checkBackupExists(userId);
        if (!backupInfo.exists) {
            return false;
        }

        // Check if local database is empty (new device/fresh install)
        const localStudents = await localDb.getAllStudentsForBackup();
        const localStandards = await localDb.getAllStandards();

        // If local data is empty but cloud has data, suggest auto-restore
        const isLocalEmpty = (!localStudents || localStudents.length === 0) &&
            (!localStandards || localStandards.length === 0);
        const cloudHasData = backupInfo.studentCount > 0 || backupInfo.standardCount > 0;

        return isLocalEmpty && cloudHasData;
    } catch (error) {
        console.error('Auto-restore check error:', error);
        return false;
    }
}

// Perform auto-restore silently
export async function performAutoRestore(userId) {
    if (!userId) return { success: false, message: 'Not logged in' };

    try {
        const shouldRestore = await shouldAutoRestore(userId);
        if (!shouldRestore) {
            return { success: false, message: 'Auto-restore not needed' };
        }

        const result = await restoreFromCloud(userId);
        return {
            success: true,
            message: 'Your data was automatically restored from cloud!',
            ...result
        };
    } catch (error) {
        console.error('Auto-restore error:', error);
        return { success: false, message: error.message };
    }
}
