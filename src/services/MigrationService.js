import { db, isFirebaseConfigured } from '../config/firebase';
import { doc, setDoc, collection, writeBatch } from 'firebase/firestore';
import * as localDb from './database';

/**
 * Migrates local data to the "Live" Firestore structure.
 * Structure:
 * - schools/{schoolCode} (School Profile)
 * - schools/{schoolCode}/students/{studentId} (Student Data)
 */
export async function migrateToLiveServer() {
    console.log('Migration: Starting...');

    if (!isFirebaseConfigured || !db) {
        throw new Error('Firebase not configured.');
    }

    // 1. Get School Profile
    let schoolProfile = await localDb.getSetting('school_profile');

    // FALLBACK: If "school_profile" object doesn't exist (Legacy Backup), try to build it from individual settings
    if (!schoolProfile) {
        console.warn('Migration: "school_profile" object missing. Attempting to reconstruct from legacy settings...');
        const schoolName = await localDb.getSetting('schoolName');
        const schoolCode = await localDb.getSetting('schoolCode'); // older key
        const udiseNumber = await localDb.getSetting('udiseNumber');
        const indexNumber = await localDb.getSetting('indexNumber');
        const address = await localDb.getSetting('address'); // or schoolAddress

        if (schoolName && (schoolCode || udiseNumber || indexNumber)) {
            schoolProfile = {
                schoolName,
                schoolCode: schoolCode || udiseNumber || indexNumber, // Fallback ID
                udiseNumber,
                indexNumber,
                address,
                isLegacy: true
            };
            console.log('Migration: Reconstructed School Profile:', schoolProfile);

            // OPTIONAL: Save this improved profile back to local DB for future use
            await localDb.saveSetting('school_profile', schoolProfile);
        }
    }

    if (!schoolProfile) {
        throw new Error('No School Profile found locally (checked "school_profile" and legacy keys). Please configure school details in Settings.');
    }

    // Use UDISE or School Code as the Document ID for easy lookup
    const schoolId = schoolProfile.udiseNumber || schoolProfile.schoolCode || schoolProfile.indexNumber || schoolProfile.id;

    if (!schoolId) {
        throw new Error('School Profile is missing UDISE/Index/Code. Cannot migrate.');
    }

    const cleanSchoolId = String(schoolId).trim().replace(/[^a-zA-Z0-9]/g, '');
    console.log(`Migration: Target School ID: ${cleanSchoolId}`);

    // 2. Upload School Profile
    try {
        const schoolRef = doc(db, 'schools', cleanSchoolId);
        await setDoc(schoolRef, {
            ...schoolProfile,
            updatedAt: new Date().toISOString(),
            migratedAt: new Date().toISOString()
        });
        console.log('Migration: School Profile uploaded.');
    } catch (err) {
        console.error('Migration: Failed to upload profile', err);
        throw new Error(`Failed to upload School Profile: ${err.message}`);
    }

    // 3. Upload Students (Batch write)
    const students = await localDb.getAllStudentsForBackup();
    if (!students || students.length === 0) {
        console.warn('Migration: No students to upload.');
        return { success: true, message: 'School Profile migrated (No students found).' };
    }

    console.log(`Migration: Uploading ${students.length} students...`);

    const BATCH_SIZE = 400; // Firestore limit is 500
    const studentsCollectionRef = collection(db, 'schools', cleanSchoolId, 'students');

    let batch = writeBatch(db);
    let count = 0;
    let totalUploaded = 0;

    for (const student of students) {
        // Use GR No or existing ID as doc ID
        const studentDocId = String(student.grNo || student.id).trim();
        const studentRef = doc(studentsCollectionRef, studentDocId);

        batch.set(studentRef, {
            ...student,
            migratedAt: new Date().toISOString()
        });

        count++;

        if (count >= BATCH_SIZE) {
            await batch.commit();
            totalUploaded += count;
            console.log(`Migration: Batch committed (${totalUploaded}/${students.length})`);
            batch = writeBatch(db);
            count = 0;
        }
    }

    if (count > 0) {
        await batch.commit();
        totalUploaded += count;
        console.log(`Migration: Final batch committed (${totalUploaded})`);
    }

    return {
        success: true,
        message: `Successfully migrated School Profile and ${totalUploaded} Students to Live Server (${cleanSchoolId}).`
    };
}
