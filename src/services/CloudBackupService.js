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

/**
 * Cloud Backup Service using Firebase Firestore
 * Simple 1-tap backup and restore functionality
 */

// Backup all user data to cloud
export async function backupToCloud(userId) {
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

        console.log('CloudBackupService: Data gathered - Students:', students?.length || 0);

        // Create backup object
        const backupData = {
            settings,
            students,
            standards,
            customFields,
            ledger,
            backupDate: serverTimestamp(),
            lastModified: new Date().toISOString(),
            appVersion: '1.0.0'
        };

        // Save to Firestore under user's document
        const backupRef = doc(db, 'backups', userId);
        await setDoc(backupRef, backupData);

        console.log('CloudBackupService: Backup saved successfully!');

        // Also save to history (optional - may fail on free tier limits)
        try {
            const historyRef = doc(collection(db, 'backups', userId, 'history'));
            await setDoc(historyRef, {
                ...backupData,
                backupDate: serverTimestamp()
            });
        } catch (historyError) {
            // Don't fail the whole backup if history fails
            console.warn('CloudBackupService: Could not save backup history:', historyError.message);
        }

        return {
            success: true,
            message: 'Backup saved to cloud successfully!',
            timestamp: new Date().toISOString()
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
        // Get backup from Firestore
        const backupRef = doc(db, 'backups', userId);
        const backupSnap = await getDoc(backupRef);

        if (!backupSnap.exists()) {
            throw new Error('No backup found in cloud. Please create a backup first.');
        }

        const backupData = backupSnap.data();

        // Restore settings
        if (backupData.settings) {
            for (const [key, value] of Object.entries(backupData.settings)) {
                await localDb.setSetting(key, value);
            }
        }

        // Restore standards
        if (backupData.standards && backupData.standards.length > 0) {
            for (const standard of backupData.standards) {
                await localDb.addStandard(standard);
            }
        }

        // Restore custom fields
        if (backupData.customFields && backupData.customFields.length > 0) {
            for (const field of backupData.customFields) {
                await localDb.addCustomField(field);
            }
        }

        // Restore students
        if (backupData.students && backupData.students.length > 0) {
            for (const student of backupData.students) {
                await localDb.addStudent(student);
            }
        }

        // Note: Ledger is computed from students, no need to restore separately

        return {
            success: true,
            message: 'Data restored from cloud successfully!',
            timestamp: backupData.backupDate?.toDate?.() || new Date()
        };
    } catch (error) {
        console.error('Cloud restore error:', error);
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
        const backupRef = doc(db, 'backups', userId);
        const backupSnap = await getDoc(backupRef);

        if (backupSnap.exists()) {
            const data = backupSnap.data();
            return {
                exists: true,
                lastBackup: data.backupDate?.toDate?.() || null,
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
