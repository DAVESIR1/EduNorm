/**
 * Cloudflare R2 Storage Service
 * S3-compatible cloud storage with 10GB free tier
 * 
 * Required environment variables:
 * - VITE_R2_ACCOUNT_ID
 * - VITE_R2_ACCESS_KEY_ID
 * - VITE_R2_SECRET_ACCESS_KEY
 * - VITE_R2_BUCKET_NAME
 */

import { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command, DeleteObjectCommand } from '@aws-sdk/client-s3';

// R2 Configuration
const getR2Config = () => {
    const accountId = import.meta.env.VITE_R2_ACCOUNT_ID;
    const accessKeyId = import.meta.env.VITE_R2_ACCESS_KEY_ID;
    const secretAccessKey = import.meta.env.VITE_R2_SECRET_ACCESS_KEY;
    const bucketName = import.meta.env.VITE_R2_BUCKET_NAME || 'edunorm-backups';

    if (!accountId || !accessKeyId || !secretAccessKey) {
        return null;
    }

    return {
        accountId,
        accessKeyId,
        secretAccessKey,
        bucketName,
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`
    };
};

// Create S3 client for R2
const getR2Client = () => {
    const config = getR2Config();
    if (!config) {
        console.warn('R2StorageService: Missing configuration');
        return null;
    }

    return new S3Client({
        region: 'auto',
        endpoint: config.endpoint,
        credentials: {
            accessKeyId: config.accessKeyId,
            secretAccessKey: config.secretAccessKey
        }
    });
};

/**
 * Check if R2 is configured
 */
export function isR2Configured() {
    return getR2Config() !== null;
}

/**
 * Upload backup data to R2
 * @param {string} userId - User ID for organizing backups
 * @param {Object} data - The data to backup
 * @returns {Promise<Object>} - Upload result
 */
export async function uploadBackup(userId, data) {
    const client = getR2Client();
    const config = getR2Config();

    if (!client || !config) {
        throw new Error('R2 not configured. Please add R2 credentials to environment variables.');
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const key = `backups/${userId}/${timestamp}.json`;

    const backupData = {
        userId,
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        data
    };

    try {
        const command = new PutObjectCommand({
            Bucket: config.bucketName,
            Key: key,
            Body: JSON.stringify(backupData, null, 2),
            ContentType: 'application/json'
        });

        await client.send(command);

        // Also save latest backup reference
        const latestCommand = new PutObjectCommand({
            Bucket: config.bucketName,
            Key: `backups/${userId}/latest.json`,
            Body: JSON.stringify(backupData, null, 2),
            ContentType: 'application/json'
        });

        await client.send(latestCommand);

        return {
            success: true,
            key,
            timestamp: backupData.timestamp,
            message: 'Backup uploaded to Cloudflare R2'
        };
    } catch (error) {
        if (error.name === 'TypeError' && error.message.includes('fetch')) {
            const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
            const hasWarned = sessionStorage.getItem('edunorm_r2_cors_warned');

            if (isLocal && !hasWarned) {
                const corsMsg = 'R2StorageService: Upload failed due to CORS. If on localhost, ensure your R2 bucket CORS policy allows development origins (e.g., http://localhost:5174).';
                console.info('%c' + corsMsg, 'color: #ff9800; font-weight: bold;');
                sessionStorage.setItem('edunorm_r2_cors_warned', 'true');
            } else if (!isLocal) {
                console.error('R2StorageService: Network/CORS error during upload', error);
            }

            // Still throw to let the caller know it failed, but don't log red errors repeatedly
            throw new Error('R2 Layer Sync Paused (CORS/Network)');
        }
        console.error('R2StorageService: Upload failed', error);
        throw error;
    }
}

/**
 * Download the latest backup from R2
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - The backup data
 */
export async function downloadLatestBackup(userId) {
    const client = getR2Client();
    const config = getR2Config();

    if (!client || !config) {
        throw new Error('R2 not configured');
    }

    try {
        const command = new GetObjectCommand({
            Bucket: config.bucketName,
            Key: `backups/${userId}/latest.json`
        });

        const response = await client.send(command);
        const bodyString = await response.Body.transformToString();
        const backupData = JSON.parse(bodyString);

        return {
            success: true,
            data: backupData.data,
            timestamp: backupData.timestamp,
            version: backupData.version
        };
    } catch (error) {
        if (error.name === 'NoSuchKey') {
            return {
                success: false,
                message: 'No backup found'
            };
        }
        console.error('R2StorageService: Download failed', error);
        throw error;
    }
}

/**
 * Download a specific backup by key
 * @param {string} key - The backup key/path
 * @returns {Promise<Object>} - The backup data
 */
export async function downloadBackup(key) {
    const client = getR2Client();
    const config = getR2Config();

    if (!client || !config) {
        throw new Error('R2 not configured');
    }

    try {
        const command = new GetObjectCommand({
            Bucket: config.bucketName,
            Key: key
        });

        const response = await client.send(command);
        const bodyString = await response.Body.transformToString();
        return JSON.parse(bodyString);
    } catch (error) {
        console.error('R2StorageService: Download failed', error);
        throw error;
    }
}

/**
 * List all backups for a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} - List of backup keys
 */
export async function listBackups(userId) {
    const client = getR2Client();
    const config = getR2Config();

    if (!client || !config) {
        throw new Error('R2 not configured');
    }

    try {
        const command = new ListObjectsV2Command({
            Bucket: config.bucketName,
            Prefix: `backups/${userId}/`,
            MaxKeys: 50
        });

        const response = await client.send(command);

        if (!response.Contents) {
            return [];
        }

        return response.Contents
            .filter(item => item.Key !== `backups/${userId}/latest.json`)
            .map(item => ({
                key: item.Key,
                lastModified: item.LastModified,
                size: item.Size
            }))
            .sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));
    } catch (error) {
        console.error('R2StorageService: List failed', error);
        throw error;
    }
}

/**
 * Delete a backup
 * @param {string} key - The backup key to delete
 */
export async function deleteBackup(key) {
    const client = getR2Client();
    const config = getR2Config();

    if (!client || !config) {
        throw new Error('R2 not configured');
    }

    try {
        const command = new DeleteObjectCommand({
            Bucket: config.bucketName,
            Key: key
        });

        await client.send(command);
        return { success: true };
    } catch (error) {
        console.error('R2StorageService: Delete failed', error);
        throw error;
    }
}

/**
 * Check if a backup exists for user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} - Backup status
 */
export async function checkBackupExists(userId) {
    const client = getR2Client();
    const config = getR2Config();

    if (!client || !config) {
        return { exists: false, configured: false };
    }

    try {
        const backups = await listBackups(userId);

        if (backups.length === 0) {
            return { exists: false, configured: true };
        }

        return {
            exists: true,
            configured: true,
            count: backups.length,
            lastBackup: backups[0]?.lastModified,
            provider: 'cloudflare_r2'
        };
    } catch (error) {
        return { exists: false, configured: true, error: error.message };
    }
}

/**
 * Get storage usage info
 */
export async function getStorageInfo(userId) {
    try {
        const backups = await listBackups(userId);
        const totalSize = backups.reduce((sum, b) => sum + (b.size || 0), 0);

        return {
            backupCount: backups.length,
            totalSizeBytes: totalSize,
            totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
            freeStorageGB: 10, // R2 free tier
            usedPercentage: ((totalSize / (10 * 1024 * 1024 * 1024)) * 100).toFixed(2)
        };
    } catch (error) {
        return { error: error.message };
    }
}
