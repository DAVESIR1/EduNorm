import {
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
    signInWithPhoneNumber,
    RecaptchaVerifier,
    signOut
} from 'firebase/auth';
import { auth, googleProvider, isFirebaseConfigured } from '../../config/firebase';
import { logSecurityEvent } from '../../services/SecurityManager';
import { AUTH_ERRORS } from './types.js';

// --- AUTHENTICATION LOGIC ---

/**
 * Maps error codes to user-friendly messages.
 * @param {string} errorCode
 * @returns {string} User friendly error message
 */
export const getErrorMessage = (errorCode) => {
    const errorMessages = {
        [AUTH_ERRORS.EMAIL_IN_USE]: 'This email is already registered. Please login instead.',
        [AUTH_ERRORS.INVALID_EMAIL]: 'Please enter a valid email address.',
        [AUTH_ERRORS.WEAK_PASSWORD]: 'Password should be at least 6 characters.',
        [AUTH_ERRORS.USER_NOT_FOUND]: 'No account found with this email.',
        [AUTH_ERRORS.WRONG_PASSWORD]: 'Incorrect password. Please try again.',
        [AUTH_ERRORS.TOO_MANY_REQUESTS]: 'Too many attempts. Please try again later.',
        [AUTH_ERRORS.POPUP_CLOSED]: 'Sign-in popup was closed. Please try again.',
        [AUTH_ERRORS.INVALID_PHONE]: 'Please enter a valid phone number.',
        [AUTH_ERRORS.INVALID_CODE]: 'Invalid OTP code. Please try again.',
        [AUTH_ERRORS.CODE_EXPIRED]: 'OTP has expired. Please request a new one.',
        [AUTH_ERRORS.NOT_CONFIGURED]: 'Cloud features not available. Running in offline mode.'
    };
    return errorMessages[errorCode] || 'An error occurred. Please try again.';
};

/**
 * Resolves identity against school database.
 * No cross-import from StudentManagement. We use `src/shared/utils/db.js` wrapper if needed.
 * But here we use direct Firestore lookup to avoid circular dependency.
 * 
 * @param {string} role - 'student' | 'teacher'
 * @param {Object} identifiers - { id1: GR/Code, id2: GovID }
 * @param {string} schoolCode - School Code
 */
export async function verifyUserIdentity(role, identifiers, schoolCode) {
    // We dynamically import the shared DB utility to avoid circular loops
    // The shared utility MUST NOT import from features/Identity
    const db = await import('../../services/database');
    return db.verifyUserCredentials(role, identifiers.id1, identifiers.id2, schoolCode);
}
