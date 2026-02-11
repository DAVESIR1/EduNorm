/**
 * ProCodeService - Secure Pro Code Generation & Verification
 * Generates cryptographically secure codes, stores in Firestore, verifies one-time use
 */

import { db } from '../config/firebase';
import { collection, addDoc, getDocs, query, where, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';

const CODES_COLLECTION = 'proCodes';

// Character sets for secure code generation
const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
const DIGITS = '0123456789';
const SYMBOLS = '!@#$%^&*';
const ALL_CHARS = UPPERCASE + LOWERCASE + DIGITS + SYMBOLS;

/**
 * Generate cryptographically secure random code
 * Format: EDU-XXXX-XXXX-XXXX (where X is from ALL_CHARS)
 */
function generateRandomSegment(length) {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, byte => ALL_CHARS[byte % ALL_CHARS.length]).join('');
}

/**
 * Generate a new Pro code and save to Firestore
 * @param {string} duration - 'monthly' or 'yearly'
 * @param {string} adminEmail - Email of admin generating the code
 * @returns {Promise<{success: boolean, code?: string, error?: string}>}
 */
export async function generateSecureCode(duration, adminEmail) {
    try {
        if (!['monthly', 'yearly'].includes(duration)) {
            return { success: false, error: 'Invalid duration. Must be "monthly" or "yearly"' };
        }

        // Generate code: EDU-XXXX-XXXX-XXXX
        const segment1 = generateRandomSegment(4);
        const segment2 = generateRandomSegment(4);
        const segment3 = generateRandomSegment(4);
        const code = `EDU-${segment1}-${segment2}-${segment3}`;

        const daysValid = duration === 'monthly' ? 30 : 365;

        // Save to Firestore
        const codeDoc = {
            code,
            duration,
            daysValid,
            createdAt: serverTimestamp(),
            createdBy: adminEmail || 'unknown',
            isUsed: false,
            usedBy: null,
            usedAt: null,
            expiresAt: null
        };

        await addDoc(collection(db, CODES_COLLECTION), codeDoc);

        return { success: true, code };
    } catch (error) {
        console.error('Error generating code:', error);

        // Handle Firestore permissions error specifically
        if (error.code === 'permission-denied' || error.message?.includes('permission') || error.message?.includes('insufficient')) {
            return {
                success: false,
                error: 'Firestore permissions not configured. Please set up Firebase rules: allow write: if request.auth != null && request.auth.token.email == "' + adminEmail + '"'
            };
        }

        return { success: false, error: error.message };
    }
}

/**
 * Verify code exists in Firestore and activate it
 * @param {string} code - The Pro code to verify
 * @param {string} email - User's email
 * @returns {Promise<{success: boolean, duration?: string, daysValid?: number, error?: string}>}
 */
export async function verifyAndActivateCode(code, email) {
    try {
        if (!code || !email) {
            return { success: false, error: 'Code and email are required' };
        }

        // Query Firestore for the code
        const q = query(collection(db, CODES_COLLECTION), where('code', '==', code.toUpperCase()));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            return { success: false, error: 'Invalid code. Code not found.' };
        }

        const codeDoc = querySnapshot.docs[0];
        const codeData = codeDoc.data();

        // Check if already used
        if (codeData.isUsed) {
            return { success: false, error: `Code already used by ${codeData.usedBy} on ${new Date(codeData.usedAt?.toDate()).toLocaleDateString()}` };
        }

        // Mark as used
        const expiresAt = new Date(Date.now() + codeData.daysValid * 24 * 60 * 60 * 1000);
        await updateDoc(doc(db, CODES_COLLECTION, codeDoc.id), {
            isUsed: true,
            usedBy: email,
            usedAt: serverTimestamp(),
            expiresAt: expiresAt.toISOString()
        });

        return {
            success: true,
            duration: codeData.duration,
            daysValid: codeData.daysValid,
            endDate: expiresAt.toISOString()
        };
    } catch (error) {
        console.error('Error verifying code:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get all generated codes (admin only)
 * @returns {Promise<Array>}
 */
export async function listGeneratedCodes() {
    try {
        const querySnapshot = await getDocs(collection(db, CODES_COLLECTION));
        const codes = [];

        querySnapshot.forEach(doc => {
            const data = doc.data();
            codes.push({
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate?.()?.toISOString() || null,
                usedAt: data.usedAt?.toDate?.()?.toISOString() || null
            });
        });

        // Sort by creation date, newest first
        codes.sort((a, b) => {
            const dateA = new Date(a.createdAt || 0);
            const dateB = new Date(b.createdAt || 0);
            return dateB - dateA;
        });

        return codes;
    } catch (error) {
        console.error('Error listing codes:', error);
        // If permissions error, return empty array instead of breaking UI
        if (error.code === 'permission-denied' || error.message?.includes('permission')) {
            console.warn('Firestore permissions not set up. Codes will only be stored locally in this session.');
            return [];
        }
        return [];
    }
}

/**
 * Revoke (delete) an unused code
 * @param {string} codeId - Firestore document ID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function revokeCode(codeId) {
    try {
        await deleteDoc(doc(db, CODES_COLLECTION, codeId));
        return { success: true };
    } catch (error) {
        console.error('Error revoking code:', error);
        return { success: false, error: error.message };
    }
}

export default {
    generateSecureCode,
    verifyAndActivateCode,
    listGeneratedCodes,
    revokeCode
};
