/**
 * GoogleDriveService.js — Rewritten for Hybrid Sync
 * Handles: Auth, organized folder structure, file upload/download, search
 */

const SCOPES = 'https://www.googleapis.com/auth/drive.file';
const API_BASE = 'https://www.googleapis.com';

let tokenClient = null;
let gapiLoaded = false;
let gisLoaded = false;

// ─── Auth helpers ─────────────────────────────────────────────────

function getToken() {
    const token = localStorage.getItem('gdriveToken');
    const expiry = localStorage.getItem('gdriveTokenExpiry');
    if (token && expiry && Date.now() < parseInt(expiry)) return token;
    return null;
}

function headers() {
    const t = getToken();
    if (!t) throw new Error('Not authenticated with Google Drive');
    return { Authorization: `Bearer ${t}` };
}

/**
 * Validate that the stored token is actually accepted by Google for Drive operations.
 * Tests a file listing (uses drive.file scope) instead of just read access.
 * Returns true if valid, false if revoked/expired.
 * On failure, clears the stored token immediately.
 */
export async function validateToken() {
    const t = getToken();
    if (!t) return false;
    try {
        const res = await fetch(`${API_BASE}/drive/v3/files?pageSize=1&fields=files(id)`, {
            headers: { Authorization: `Bearer ${t}` }
        });
        if (res.ok) return true;
        // Token is revoked or expired — clear it
        localStorage.removeItem('gdriveToken');
        localStorage.removeItem('gdriveTokenExpiry');
        return false;
    } catch {
        return false;
    }
}

export function clearToken() {
    localStorage.removeItem('gdriveToken');
    localStorage.removeItem('gdriveTokenExpiry');
}

export async function loadGoogleScripts() {
    if (gapiLoaded && gisLoaded) return;
    return new Promise((resolve, reject) => {
        const check = () => { if (gapiLoaded && gisLoaded) resolve(); };

        if (!window.gapi) {
            const s = document.createElement('script');
            s.src = 'https://apis.google.com/js/api.js';
            s.async = true;
            s.onload = () => {
                window.gapi.load('client', async () => {
                    try {
                        const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
                        // Don't load discovery doc — we use direct REST fetch, not gapi.client
                        await window.gapi.client.init({ apiKey });
                        gapiLoaded = true;
                        check();
                    } catch (e) { reject(e); }
                });
            };
            s.onerror = reject;
            document.head.appendChild(s);
        } else { gapiLoaded = true; check(); }

        if (!window.google?.accounts) {
            const s = document.createElement('script');
            s.src = 'https://accounts.google.com/gsi/client';
            s.async = true;
            s.onload = () => { gisLoaded = true; check(); };
            s.onerror = reject;
            document.head.appendChild(s);
        } else { gisLoaded = true; check(); }
    });
}

export function initTokenClient(onSuccess, onError) {
    if (!window.google?.accounts?.oauth2) { onError?.(new Error('GIS not loaded')); return; }
    tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        scope: SCOPES,
        callback: (r) => {
            if (r.error) { onError?.(r); }
            else {
                localStorage.setItem('gdriveToken', r.access_token);
                localStorage.setItem('gdriveTokenExpiry', String(Date.now() + r.expires_in * 1000));
                onSuccess?.(r);
            }
        },
    });
}

export function isAuthenticated() { return !!getToken(); }

export function requestAccessToken() {
    return new Promise((resolve, reject) => {
        if (!tokenClient) initTokenClient(resolve, reject);
        if (tokenClient) {
            if (isAuthenticated()) resolve({ access_token: getToken() });
            else tokenClient.requestAccessToken({ prompt: 'consent' });
        }
    });
}

export function signOut() {
    const t = getToken();
    if (t) {
        try { window.google.accounts.oauth2.revoke(t); } catch (_) { }
        localStorage.removeItem('gdriveToken');
        localStorage.removeItem('gdriveTokenExpiry');
    }
}

// ─── Folder helpers ───────────────────────────────────────────────

const folderCache = {};

async function findOrCreateFolder(name, parentId = null) {
    const cacheKey = `${name}|${parentId || 'root'}`;
    if (folderCache[cacheKey]) return folderCache[cacheKey];

    const q = `name='${name}' and mimeType='application/vnd.google-apps.folder' and trashed=false` +
        (parentId ? ` and '${parentId}' in parents` : '');

    const res = await fetch(`${API_BASE}/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id)`, { headers: headers() });
    const data = await res.json();
    if (data.files?.length) { folderCache[cacheKey] = data.files[0].id; return data.files[0].id; }

    const body = { name, mimeType: 'application/vnd.google-apps.folder' };
    if (parentId) body.parents = [parentId];
    const cr = await fetch(`${API_BASE}/drive/v3/files`, {
        method: 'POST', headers: { ...headers(), 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    const cd = await cr.json();
    folderCache[cacheKey] = cd.id;
    return cd.id;
}

/**
 * Build full folder tree:
 * EduNorm Backups / School_[code] / {Student_Photos, Student_Documents, Certificates, Teacher_Photos}
 */
export async function getSchoolFolderTree(schoolCode = 'default') {
    const root = await findOrCreateFolder('EduNorm Backups');
    const school = await findOrCreateFolder(`School_${schoolCode}`, root);
    const [photos, docs, certs, teacherPhotos] = await Promise.all([
        findOrCreateFolder('Student_Photos', school),
        findOrCreateFolder('Student_Documents', school),
        findOrCreateFolder('Certificates', school),
        findOrCreateFolder('Teacher_Photos', school),
    ]);
    return { root, school, photos, docs, certs, teacherPhotos };
}

// ─── File operations ──────────────────────────────────────────────

/**
 * Upload or update a file (JSON, image, PDF, etc.)
 * If file isn't editable (owned by different client), skips PATCH and creates new.
 * This prevents the red 403 console error from even firing.
 */
/**
 * Upload or update a file on Drive.
 * If knownFileId is given → PATCH (update content in-place, same file, no duplicate).
 * Otherwise → POST new file.
 * Returns the file metadata including id.
 */
export async function uploadFile(name, content, mimeType, folderId, knownFileId = null) {
    const h = headers();
    const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });

    // ── Try PATCH if we know the file ID ─────────────────────────────────────
    if (knownFileId) {
        try {
            const patchRes = await fetch(
                `${API_BASE}/upload/drive/v3/files/${knownFileId}?uploadType=media`,
                { method: 'PATCH', headers: { ...h, 'Content-Type': mimeType }, body: blob }
            );
            if (patchRes.ok) {
                const r = await patchRes.json();
                console.log('[Drive] PATCH ✅ Updated existing file:', name, knownFileId);
                return { ...r, id: knownFileId };   // always keep same ID
            }
            console.warn('[Drive] PATCH failed (' + patchRes.status + ') — will create new file');
        } catch (e) {
            console.warn('[Drive] PATCH error:', e.message, '— will create new file');
        }
    }

    // ── POST: create new file ─────────────────────────────────────────────────
    const meta = { name, mimeType, parents: [folderId] };
    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(meta)], { type: 'application/json' }));
    form.append('file', blob);

    const res = await fetch(`${API_BASE}/upload/drive/v3/files?uploadType=multipart`, {
        method: 'POST', headers: h, body: form,
    });
    if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
            localStorage.removeItem('gdriveToken');
            localStorage.removeItem('gdriveTokenExpiry');
        }
        throw new Error(`Upload failed: ${res.status} ${res.statusText}`);
    }
    const r = await res.json();
    console.log('[Drive] POST ✅ Created new file:', name, r.id);
    return r;
}

/**
 * Download a file by ID
 */
export async function downloadFile(fileId) {
    const res = await fetch(`${API_BASE}/drive/v3/files/${fileId}?alt=media`, { headers: headers() });
    if (!res.ok) throw new Error(`Download failed: ${res.status}`);
    return res;
}

/**
 * List files in a folder
 */
export async function listFiles(folderId, query = '') {
    let q = `'${folderId}' in parents and trashed=false`;
    if (query) q += ` and name contains '${query}'`;
    const res = await fetch(
        `${API_BASE}/drive/v3/files?q=${encodeURIComponent(q)}&orderBy=modifiedTime desc&fields=files(id,name,mimeType,size,modifiedTime,createdTime)&pageSize=100`,
        { headers: headers() }
    );
    if (!res.ok) throw new Error('List failed');
    const data = await res.json();
    return data.files || [];
}

/**
 * Delete a file
 */
export async function deleteFile(fileId) {
    const res = await fetch(`${API_BASE}/drive/v3/files/${fileId}`, { method: 'DELETE', headers: headers() });
    if (!res.ok) throw new Error('Delete failed');
    return true;
}

/**
 * Get web link to a folder
 */
export function getDriveFolderLink(folderId) {
    return `https://drive.google.com/drive/folders/${folderId}`;
}

// ─── Image compression ───────────────────────────────────────────

/**
 * Compress a base64 image to JPEG ~70% quality, max 800px
 */
export function compressImage(base64, maxWidth = 800, quality = 0.7) {
    return new Promise((resolve) => {
        if (!base64 || !base64.startsWith('data:image')) { resolve(base64); return; }
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let w = img.width, h = img.height;
            if (w > maxWidth) { h = (h * maxWidth) / w; w = maxWidth; }
            canvas.width = w;
            canvas.height = h;
            canvas.getContext('2d').drawImage(img, 0, 0, w, h);
            resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = () => resolve(base64);
        img.src = base64;
    });
}

// ─── Photo Helper ──────────────────────────────────────────────────

/**
 * Convert base64 data URL to Blob
 */
export function base64ToBlob(base64) {
    if (!base64) return null;
    const parts = base64.split(',');
    if (parts.length < 2) return null;
    const mime = parts[0].match(/:(.*?);/)?.[1] || 'application/octet-stream';
    const raw = atob(parts[1]);
    const arr = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
    return new Blob([arr], { type: mime });
}


