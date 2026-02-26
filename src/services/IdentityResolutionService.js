/**
 * Identity Resolution Service
 * Professional-grade engine for mapping users to database records.
 * - Deterministic matching (GR No, Employee Code)
 * - Identity Stitching (Claiming records)
 * - Safe Normalization (Fuzzy-proof)
 */

import { getFirestore, doc, getDoc, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { isFirebaseConfigured } from '../config/firebase';

/**
 * Normalizes an identifier for fail-proof comparison.
 * Removes spaces, dashes, leading zeros, and converts to lowercase.
 */
export function normalizeId(id) {
    if (!id) return '';
    const s = String(id).trim().toLowerCase().replace(/[\s-]/g, '');
    // If it's purely numeric, strip leading zeros
    if (/^\d+$/.test(s)) {
        return String(parseInt(s, 10));
    }
    return s;
}

/**
 * Resolves a School Profile by Code or UDISE.
 * Used for Smart Discovery.
 */
export async function resolveSchoolProfile(schoolCode) {
    if (!schoolCode || !isFirebaseConfigured) return null;

    const cleanCode = normalizeId(schoolCode);
    const db = getFirestore();
    const schoolsRef = collection(db, 'schools');

    const variations = [
        query(schoolsRef, where('udiseNumber', '==', cleanCode), limit(1)),
        query(schoolsRef, where('schoolCode', '==', cleanCode), limit(1)),
        query(schoolsRef, where('indexNumber', '==', cleanCode), limit(1))
    ];

    try {
        const results = await Promise.all(variations.map(q => getDocs(q)));
        for (const snap of results) {
            if (!snap.empty) {
                const data = snap.docs[0].data();
                return { ...data, id: snap.docs[0].id };
            }
        }
    } catch (error) {
        console.error('IdentityResolution: School resolution failed', error);
    }
    return null;
}

/**
 * Checks if a specific identity record (Student/Teacher) is already claimed by another account.
 */
export async function isIdentityClaimed(schoolId, role, recordId) {
    if (!isFirebaseConfigured) return false;

    const db = getFirestore();
    const usersRef = collection(db, 'users');
    const q = query(usersRef,
        where('schoolId', '==', schoolId),
        where('role', '==', role),
        where('recordId', '==', recordId)
    );

    const snap = await getDocs(q);
    return !snap.empty;
}

/**
 * Core Resolution Logic for Students and Teachers.
 */
export async function resolveProfile(role, criteria, schoolId) {
    if (!isFirebaseConfigured || !schoolId) return { success: false, error: 'System not ready' };

    const { id1, id2 } = criteria; // id1: GR/Code, id2: GovID/Mobile/Email
    const cleanId1 = normalizeId(id1);
    const cleanId2 = normalizeId(id2);

    const db = getFirestore();
    const path = `schools/${schoolId}/${role === 'student' ? 'students' : 'teachers'}`;
    const ref = collection(db, path);

    // Try multiple queries for robustness
    const queries = [];
    if (role === 'student') {
        queries.push(query(ref, where('grNo', '==', cleanId1), limit(1)));
        // Also try raw if it wasn't numeric
        if (cleanId1 !== id1.trim()) {
            queries.push(query(ref, where('grNo', '==', id1.trim()), limit(1)));
        }
    } else {
        queries.push(query(ref, where('teacherCode', '==', cleanId1), limit(1)));
    }

    try {
        const snaps = await Promise.all(queries.map(q => getDocs(q)));
        let profile = null;

        for (const snap of snaps) {
            if (!snap.empty) {
                profile = { ...snap.docs[0].data(), id: snap.docs[0].id };
                break;
            }
        }

        if (!profile) return { success: false, error: 'Record not found in school database' };

        // Verify Identity Proof (id2) - MULTI-ID CATCH SYSTEM
        const proofFields = [
            'aadharNo', 'aadharNumber', 'aadhar',
            'govId', 'governmentId', 'sssmId', 'sssm_id',
            'email', 'mobile', 'contactNumber', 'phone',
            'panCard', 'panNo', 'voterId', 'passportNo'
        ];

        const proofMatch = proofFields.some(field => {
            if (!profile[field]) return false;
            const storedVal = normalizeId(profile[field]);
            return storedVal && storedVal === cleanId2;
        });

        if (!proofMatch) {
            // Last resort: Check any field that looks like a potential ID or custom field
            const secondaryMatch = Object.keys(profile).some(key => {
                if (typeof profile[key] !== 'string' && typeof profile[key] !== 'number') return false;
                return normalizeId(profile[key]) === cleanId2;
            });

            if (!secondaryMatch) {
                return { success: false, error: 'Multiple ID verification failed. Entering a registered Mobile, Aadhar, or Email is recommended.' };
            }
        }

        // Check if claimed
        const claimed = await isIdentityClaimed(schoolId, role, profile.id);
        if (claimed) {
            return { success: false, error: 'This identity is already linked to another account.' };
        }

        return { success: true, data: profile };

    } catch (error) {
        console.error('IdentityResolution: Profile resolution failed', error);
        return { success: false, error: 'System error during resolution' };
    }
}

export default {
    normalizeId,
    resolveSchoolProfile,
    resolveProfile,
    isIdentityClaimed
};
