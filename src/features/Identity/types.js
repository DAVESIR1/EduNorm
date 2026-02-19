/**
 * @typedef {'student' | 'teacher' | 'hoi' | 'admin'} UserRole
 */

/**
 * @typedef {Object} UserProfile
 * @property {string} uid - Firebase Auth UID
 * @property {string} email - User Email
 * @property {string} [displayName] - Display Name
 * @property {UserRole} role - User Role
 * @property {boolean} isVerified - Has completed identity verification?
 * @property {string} [schoolCode] - Associated School Code (if applicable)
 * @property {string} [schoolId] - Associated School UID (if applicable)
 * @property {string} [recordId] - Linked professional record ID (Student GR or Teacher ID)
 * @property {boolean} [isAdmin] - Is System Admin?
 * @property {boolean} [isOffline] - Is Offline User?
 */

/**
 * @typedef {Object} IdentityVerificationResult
 * @property {boolean} success
 * @property {UserProfile} [data] - Found profile data
 * @property {string} [error] - Error message
 */

export const ROLES = {
    STUDENT: 'student',
    TEACHER: 'teacher',
    HOI: 'hoi',
    ADMIN: 'admin'
};

export const AUTH_ERRORS = {
    EMAIL_IN_USE: 'auth/email-already-in-use',
    INVALID_EMAIL: 'auth/invalid-email',
    WEAK_PASSWORD: 'auth/weak-password',
    USER_NOT_FOUND: 'auth/user-not-found',
    WRONG_PASSWORD: 'auth/wrong-password',
    TOO_MANY_REQUESTS: 'auth/too-many-requests',
    POPUP_CLOSED: 'auth/popup-closed-by-user',
    INVALID_PHONE: 'auth/invalid-phone-number',
    INVALID_CODE: 'auth/invalid-verification-code',
    CODE_EXPIRED: 'auth/code-expired',
    NOT_CONFIGURED: 'firebase-not-configured'
};
