import * as db from '../../services/database';

/**
 * Wrapper for user verification to prevent circular imports.
 * Features should import this instead of database.js directly for business logic.
 */
export async function verifyUserCredentials(role, id1, id2, schoolCode) {
    // Re-use existing robust verification logic from database.js
    // This file acts as the "anti-corruption layer"
    if (role === 'student') {
        return db.verifyStudent(id1, id2, schoolCode);
    } else if (role === 'teacher') {
        return db.verifyTeacher(id1, id2);
    }
    return { success: false, error: 'Invalid Role' };
}
