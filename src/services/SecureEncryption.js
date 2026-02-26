/**
 * SecureEncryption — Legacy Compatibility Stub
 * 
 * The original AES-256-GCM encryption module was removed when the project
 * migrated to AnigmaEncoding. This stub provides the three functions that
 * CloudBackupService.js still imports so that legacy backup restores
 * don't crash the app.
 */

/**
 * Checks if a stored backup object uses the old AES-256-GCM format.
 */
export function isEncrypted(data) {
    return data?.version === '2.0' && !!data?.encrypted;
}

/**
 * Legacy decryption stub.
 * If old AES data is encountered, we can't decrypt it without the original
 * key-derivation logic. Return the raw data and let the caller handle it.
 */
export async function decryptData(storedData, userId) {
    console.warn('SecureEncryption: Legacy AES decryption attempted. Returning raw data.');
    // If the data has a nested `.data` property (unencrypted fallback), use that
    if (storedData?.data) return storedData.data;
    return storedData;
}

/**
 * Legacy encryption stub — not used in new code paths.
 */
export function encryptData(data) {
    return data;
}

export default { isEncrypted, decryptData, encryptData };
