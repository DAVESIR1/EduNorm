import { db, auth, isFirebaseConfigured } from '../config/firebase';
import { doc, setDoc, collection, writeBatch, getDoc } from 'firebase/firestore';
import * as localDb from './database';

/**
 * MIGRATION SERVICE (REWRITE V3 - UNSTOPPABLE)
 * 
 * Goal: Sync local data to Live Firestore to enable Online Verification.
 * Changes:
 * - Soft-fail on School Profile permissions (continue to students)
 * - Update local profile ID to match Auth UID
 */

export async function migrateToLiveServer() {
    console.log('Migration: Starting robust sync...');

    if (!isFirebaseConfigured || !db || !auth) {
        throw new Error('Firebase is not configured.');
    }

    const currentUser = auth.currentUser;
    if (!currentUser) {
        throw new Error('You must be logged in to sync data.');
    }

    // 1. GATHER LOCAL DATA
    const schoolProfile = await getLocalSchoolProfile();
    const schoolId = currentUser.uid;
    console.log(`Migration: Target School ID (Auth UID): ${schoolId}`);

    // 2. UPLOAD SCHOOL PROFILE (Attempt, but don't block)
    if (schoolProfile) {
        try {
            await syncSchoolProfile(schoolId, schoolProfile);
        } catch (profileErr) {
            console.error('Migration: School Profile Sync Blocked (Non-Fatal). Continuing...', profileErr);
        }
    } else {
        console.warn('Migration: No local school profile. Skipping profile sync.');
    }

    // 2.5 UPDATE LOCAL PROFILE ID
    // Crucial: Update local settings so verifyStudent() knows where to look!
    try {
        const currentProfile = await localDb.getSetting('school_profile') || {};
        await localDb.setSetting('school_profile', {
            ...currentProfile,
            id: schoolId, // Link local data to this cloud capability
            ownerId: schoolId,
            lastSynced: new Date().toISOString()
        });
        console.log('Migration: Local Profile updated with Cloud ID.');
    } catch (localErr) {
        console.warn('Migration: Failed to update local profile ID', localErr);
    }

    // 3. UPLOAD STUDENTS
    try {
        const students = await localDb.getAllStudentsForBackup();
        if (students && students.length > 0) {
            await syncStudents(schoolId, students);
        } else {
            console.log('Migration: No students to sync.');
        }
    } catch (studentErr) {
        console.error('Migration: Student Sync Failed:', studentErr);
        throw new Error(`Student Sync Failed: ${studentErr.message}`);
    }

    return { success: true, message: 'Sync Complete' };
}

/**
 * Helper: Get and reconstruct school profile from local settings
 */
async function getLocalSchoolProfile() {
    try {
        let profile = await localDb.getSetting('school_profile');
        if (!profile) {
            const name = await localDb.getSetting('schoolName');
            if (name) {
                profile = {
                    schoolName: name,
                    schoolCode: await localDb.getSetting('schoolCode'),
                    udiseNumber: await localDb.getSetting('udiseNumber'),
                    indexNumber: await localDb.getSetting('indexNumber'),
                    address: await localDb.getSetting('address'),
                };
            }
        }
        return profile;
    } catch (e) {
        console.warn('Migration: Error reading local profile', e);
        return null;
    }
}

/**
 * Step 2: Sync School Profile to `schools/{uid}`
 */
async function syncSchoolProfile(uid, profile) {
    console.log(`Migration: Syncing Profile to schools/${uid}...`);
    const schoolRef = doc(db, 'schools', uid);

    const cleanProfile = {
        name: profile.schoolName || 'Unknown School',
        schoolName: profile.schoolName || 'Unknown School',

        udiseNumber: String(profile.udiseNumber || '').trim(),
        schoolCode: String(profile.schoolCode || '').trim(),
        indexNumber: String(profile.indexNumber || '').trim(),

        email: profile.email || profile.schoolEmail || auth.currentUser.email || '',
        phone: profile.phone || profile.mobile || '',
        address: profile.address || '',

        ownerId: uid,
        updatedAt: new Date().toISOString(),
        isLive: true
    };

    try {
        await setDoc(schoolRef, cleanProfile, { merge: true });
        console.log('Migration: School Profile Synced Successfully.');
    } catch (err) {
        console.error('Migration: Profile Sync Error:', err);
        // Retry with minimal fields
        console.log('Migration: Retrying with minimal fields...');
        await setDoc(schoolRef, {
            ownerId: uid,
            updatedAt: new Date().toISOString(),
            name: cleanProfile.name
        }, { merge: true });
        console.log('Migration: Minimal Profile Synced.');
    }
}

/**
 * Step 3: Sync Students to `schools/{uid}/students` using Batches
 */
async function syncStudents(schoolId, students) {
    console.log(`Migration: Syncing ${students.length} students...`);

    const BATCH_SIZE = 400;
    const chunks = [];
    for (let i = 0; i < students.length; i += BATCH_SIZE) {
        chunks.push(students.slice(i, i + BATCH_SIZE));
    }

    const studentsCollection = collection(db, 'schools', schoolId, 'students');

    for (const [index, chunk] of chunks.entries()) {
        const batch = writeBatch(db);

        chunk.forEach(student => {
            const docId = String(student.grNo || student.id).replace(/\//g, '-').trim();
            if (!docId) return;

            const studentRef = doc(studentsCollection, docId);

            // Normalize aadhar field
            const normalizedAadhar = String(student.aadharNo || student.aadharNumber || '');

            const cleanStudent = {
                id: String(student.id || ''),
                grNo: String(student.grNo || ''),
                name: student.name || student.nameEnglish || 'Unknown',
                standard: student.standard || '',
                section: student.division || student.section || '',

                aadharNo: normalizedAadhar,
                aadharNumber: normalizedAadhar, // Sync both field names
                govId: String(student.govId || ''),
                sssmId: String(student.sssmId || ''), // Bug 4 fix: was missing
                mobile: String(student.contactNumber || student.mobile || ''),
                contactNumber: String(student.contactNumber || student.mobile || ''), // Sync both names
                email: String(student.email || ''),
                dob: student.dob || '',

                migratedAt: new Date().toISOString()
            };

            batch.set(studentRef, cleanStudent);
        });

        try {
            await batch.commit();
            console.log(`Migration: Batch ${index + 1}/${chunks.length} committed.`);
        } catch (err) {
            console.error(`Migration: Batch ${index + 1} failed:`, err);
        }
    }
    console.log('Migration: Student Sync process finished.');
}
