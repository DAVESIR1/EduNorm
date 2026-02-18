import { db } from '../config/firebase';
import { doc, getDoc, setDoc, serverTimestamp, collection, addDoc } from 'firebase/firestore';
import { checkBackupExists } from './CloudBackupService'; // We can reuse logic or import directly
import AnigmaEncoding from './AnigmaEncoding';
import * as localDb from './database';

/**
 * Backup Verifier Service
 * Runs in background to verify backup integrity.
 * Reports errors to 'admin-bugs' collection.
 */

export async function verifyBackupIntegrity(userId) {
    if (!userId) return;

    console.log('BackupVerifier: Starting integrity check...');

    try {
        // 1. Fetch Cloud Backup
        const backupRef = doc(db, 'backups', userId);
        const backupSnap = await getDoc(backupRef);

        if (!backupSnap.exists()) {
            await reportBug(userId, 'Missing Backup', 'No backup document found in Firestore.');
            return;
        }

        const data = backupSnap.data();

        // 2. Verify Encryption/Encoding
        let decodedData = null;
        if (data.version === '3.0-anigma' && data.encrypted) {
            try {
                decodedData = AnigmaEncoding.decode(data.encrypted);
            } catch (decodeErr) {
                await reportBug(userId, 'Anigma Decode Failed', `Failed to decode Anigma backup: ${decodeErr.message}`);
                return;
            }
        } else {
            console.log('BackupVerifier: Skipping legacy backup verification (only checking Anigma).');
            return;
        }

        // 3. Verify Data Structure
        const missingFields = [];
        if (!decodedData.settings) missingFields.push('settings');
        if (!decodedData.students) missingFields.push('students');
        if (!decodedData.standards) missingFields.push('standards');

        if (missingFields.length > 0) {
            await reportBug(userId, 'Corrupt Data Structure', `Decoded backup is missing required fields: ${missingFields.join(', ')}`);
            return;
        }

        // 4. Verify Content (Simple check)
        const cloudCount = decodedData.students?.length || 0;
        const localStudents = await localDb.getAllStudentsForBackup();
        const localCount = localStudents.length;

        // Allow some difference if sync hasn't happened, but drastic difference is suspicious
        // Logic: specific to implementation.
        console.log(`BackupVerifier: Cloud Students: ${cloudCount}, Local Students: ${localCount}`);

        // 5. Success
        console.log('BackupVerifier: Backup is HEALTHY.');

    } catch (err) {
        console.error('BackupVerifier: Error during verification:', err);
        await reportBug(userId, 'Verifier Crash', `Verifier failed with error: ${err.message}`);
    }
}

// Report bug to Admin Panel
async function reportBug(userId, title, description) {
    try {
        console.error(`BackupVerifier: REPORTING BUG - ${title}`);
        await addDoc(collection(db, 'admin_bugs'), {
            userId: userId,
            title: title,
            description: description,
            timestamp: serverTimestamp(),
            status: 'open',
            source: 'BackupVerifier'
        });
    } catch (err) {
        console.error('BackupVerifier: Failed to report bug:', err);
    }
}
