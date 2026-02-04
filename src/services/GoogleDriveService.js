// Google Drive Backup Service
// Handles authentication and backup/restore operations with Google Drive

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || '';
const SCOPES = 'https://www.googleapis.com/auth/drive.file';
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';

let tokenClient = null;
let gapiLoaded = false;
let gisLoaded = false;

// Backup file name pattern
const BACKUP_FOLDER_NAME = 'EduNorm Backups';
const getBackupFileName = () => `edunorm_backup_${new Date().toISOString().split('T')[0]}.json`;

/**
 * Load Google API scripts dynamically
 */
export async function loadGoogleScripts() {
    return new Promise((resolve, reject) => {
        // Load GAPI script
        if (!window.gapi) {
            const gapiScript = document.createElement('script');
            gapiScript.src = 'https://apis.google.com/js/api.js';
            gapiScript.async = true;
            gapiScript.defer = true;
            gapiScript.onload = () => {
                window.gapi.load('client', async () => {
                    try {
                        await window.gapi.client.init({
                            apiKey: API_KEY,
                            discoveryDocs: [DISCOVERY_DOC],
                        });
                        gapiLoaded = true;
                        checkBothLoaded(resolve);
                    } catch (error) {
                        reject(error);
                    }
                });
            };
            gapiScript.onerror = reject;
            document.head.appendChild(gapiScript);
        } else {
            gapiLoaded = true;
            checkBothLoaded(resolve);
        }

        // Load GIS (Google Identity Services) script
        if (!window.google?.accounts) {
            const gisScript = document.createElement('script');
            gisScript.src = 'https://accounts.google.com/gsi/client';
            gisScript.async = true;
            gisScript.defer = true;
            gisScript.onload = () => {
                gisLoaded = true;
                checkBothLoaded(resolve);
            };
            gisScript.onerror = reject;
            document.head.appendChild(gisScript);
        } else {
            gisLoaded = true;
            checkBothLoaded(resolve);
        }
    });
}

function checkBothLoaded(resolve) {
    if (gapiLoaded && gisLoaded) {
        resolve();
    }
}

/**
 * Initialize Google Identity Services token client
 */
export function initTokenClient(onSuccess, onError) {
    if (!window.google?.accounts?.oauth2) {
        onError(new Error('Google Identity Services not loaded'));
        return;
    }

    tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: (response) => {
            if (response.error) {
                onError(response);
            } else {
                localStorage.setItem('gdriveToken', response.access_token);
                localStorage.setItem('gdriveTokenExpiry', Date.now() + (response.expires_in * 1000));
                onSuccess(response);
            }
        },
    });
}

/**
 * Check if user is authenticated with Google Drive
 */
export function isAuthenticated() {
    const token = localStorage.getItem('gdriveToken');
    const expiry = localStorage.getItem('gdriveTokenExpiry');
    return token && expiry && Date.now() < parseInt(expiry);
}

/**
 * Request access token (will prompt user to sign in)
 */
export function requestAccessToken() {
    return new Promise((resolve, reject) => {
        if (!tokenClient) {
            initTokenClient(resolve, reject);
        }

        if (tokenClient) {
            if (isAuthenticated()) {
                resolve({ access_token: localStorage.getItem('gdriveToken') });
            } else {
                tokenClient.requestAccessToken({ prompt: 'consent' });
            }
        }
    });
}

/**
 * Sign out from Google Drive
 */
export function signOut() {
    const token = localStorage.getItem('gdriveToken');
    if (token) {
        window.google.accounts.oauth2.revoke(token);
        localStorage.removeItem('gdriveToken');
        localStorage.removeItem('gdriveTokenExpiry');
    }
}

/**
 * Get or create backup folder
 */
async function getOrCreateBackupFolder() {
    const token = localStorage.getItem('gdriveToken');
    if (!token) throw new Error('Not authenticated');

    // Search for existing folder
    const searchResponse = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=name='${BACKUP_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        {
            headers: { Authorization: `Bearer ${token}` }
        }
    );
    const searchData = await searchResponse.json();

    if (searchData.files && searchData.files.length > 0) {
        return searchData.files[0].id;
    }

    // Create new folder
    const createResponse = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            name: BACKUP_FOLDER_NAME,
            mimeType: 'application/vnd.google-apps.folder',
        }),
    });
    const createData = await createResponse.json();
    return createData.id;
}

/**
 * Backup data to Google Drive
 */
export async function backupToGoogleDrive(data) {
    const token = localStorage.getItem('gdriveToken');
    if (!token) throw new Error('Not authenticated with Google Drive');

    const folderId = await getOrCreateBackupFolder();
    const fileName = getBackupFileName();
    const fileContent = JSON.stringify(data, null, 2);

    // Check if backup file already exists for today
    const searchResponse = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=name='${fileName}' and '${folderId}' in parents and trashed=false`,
        {
            headers: { Authorization: `Bearer ${token}` }
        }
    );
    const searchData = await searchResponse.json();

    const metadata = {
        name: fileName,
        mimeType: 'application/json',
        parents: [folderId],
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', new Blob([fileContent], { type: 'application/json' }));

    let response;
    if (searchData.files && searchData.files.length > 0) {
        // Update existing file
        const existingFileId = searchData.files[0].id;
        response = await fetch(
            `https://www.googleapis.com/upload/drive/v3/files/${existingFileId}?uploadType=multipart`,
            {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${token}` },
                body: form,
            }
        );
    } else {
        // Create new file
        response = await fetch(
            'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
            {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: form,
            }
        );
    }

    if (!response.ok) {
        throw new Error('Failed to backup to Google Drive');
    }

    const result = await response.json();

    // Save last backup time
    localStorage.setItem('lastGDriveBackup', new Date().toISOString());

    return result;
}

/**
 * List all backups from Google Drive
 */
export async function listBackupsFromGoogleDrive() {
    const token = localStorage.getItem('gdriveToken');
    if (!token) throw new Error('Not authenticated with Google Drive');

    const folderId = await getOrCreateBackupFolder();

    const response = await fetch(
        `https://www.googleapis.com/drive/v3/files?q='${folderId}' in parents and trashed=false&orderBy=createdTime desc&fields=files(id,name,createdTime,size)`,
        {
            headers: { Authorization: `Bearer ${token}` }
        }
    );

    if (!response.ok) {
        throw new Error('Failed to list backups from Google Drive');
    }

    const data = await response.json();
    return data.files || [];
}

/**
 * Restore data from Google Drive backup
 */
export async function restoreFromGoogleDrive(fileId) {
    const token = localStorage.getItem('gdriveToken');
    if (!token) throw new Error('Not authenticated with Google Drive');

    const response = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
        {
            headers: { Authorization: `Bearer ${token}` }
        }
    );

    if (!response.ok) {
        throw new Error('Failed to download backup from Google Drive');
    }

    const data = await response.json();
    return data;
}

/**
 * Delete a backup from Google Drive
 */
export async function deleteBackupFromGoogleDrive(fileId) {
    const token = localStorage.getItem('gdriveToken');
    if (!token) throw new Error('Not authenticated with Google Drive');

    const response = await fetch(
        `https://www.googleapis.com/drive/v3/files/${fileId}`,
        {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
        }
    );

    if (!response.ok) {
        throw new Error('Failed to delete backup from Google Drive');
    }

    return true;
}

/**
 * Get last backup info
 */
export function getLastBackupInfo() {
    return {
        lastLocalBackup: localStorage.getItem('lastLocalBackup'),
        lastGDriveBackup: localStorage.getItem('lastGDriveBackup'),
    };
}

/**
 * Auto-backup scheduler (runs in background)
 */
let autoBackupInterval = null;

export function startAutoBackup(getDataFunction, intervalMinutes = 30) {
    if (autoBackupInterval) {
        clearInterval(autoBackupInterval);
    }

    autoBackupInterval = setInterval(async () => {
        if (isAuthenticated()) {
            try {
                const data = await getDataFunction();
                await backupToGoogleDrive(data);
                console.log('Auto-backup to Google Drive completed');
            } catch (error) {
                console.error('Auto-backup failed:', error);
            }
        }
    }, intervalMinutes * 60 * 1000);

    return autoBackupInterval;
}

export function stopAutoBackup() {
    if (autoBackupInterval) {
        clearInterval(autoBackupInterval);
        autoBackupInterval = null;
    }
}

// Local backup functions
export function saveLocalBackup(data) {
    try {
        const backupData = JSON.stringify(data);
        localStorage.setItem('edunorm_local_backup', backupData);
        localStorage.setItem('lastLocalBackup', new Date().toISOString());
        return true;
    } catch (error) {
        console.error('Local backup failed:', error);
        return false;
    }
}

export function getLocalBackup() {
    try {
        const data = localStorage.getItem('edunorm_local_backup');
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error('Failed to read local backup:', error);
        return null;
    }
}

export function hasLocalBackup() {
    return !!localStorage.getItem('edunorm_local_backup');
}
