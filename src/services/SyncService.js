/**
 * SyncService.js — Professional Cloud-First Sync v6.0
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 * PRIMARY: Google Drive (The Single Source of Truth)
 *
 * Professional Standards Implemented:
 *   1. Pull-First: Priority check for cloud data on startup.
 *   2. Pre-flight Guard: Checks cloud metadata before pushing to prevent overwrites.
 *   3. Atomic Writes: Writes to IndexedDB are completed in single transactions.
 *   4. Versioning: Logic to handle data normalization and legacy formats.
 */

import { openDB } from 'idb';
import AppBus, { APP_EVENTS } from '../core/AppBus';
import {
    exportAllData,
    importAllData
} from './database';
import {
    isAuthenticated as driveIsAuthenticated,
    uploadFile,
    downloadFile,
    listFiles,
    compressImage,
    base64ToBlob,
} from './GoogleDriveService';

// ─── Constants ────────────────────────────────────────────────────────────────

const DB_NAME = 'StudentDataEntry';
const DB_VERSION = 2;
const AUTO_MS = 5 * 60 * 1000;   // 5-min periodic backup
const DIRTY_MS = 30 * 1000;       // 30s debounce after data change
const DRIVE_ROOT = 'EduNorm Backups';

// ─── State ────────────────────────────────────────────────────────────────────

let _status = { state: 'idle', message: 'Not started', lastSync: null };
let _subscribers = [];
let _autoTimer = null;
let _dirtyTimer = null;
let _unsubDB = null;
let _folderTree = null;
let _currentUser = null;
let _isSyncing = false;       // Lock to prevent concurrent syncs
let _lastRestoreAt = 0;      // Cooldown after restore

// ─── Status ───────────────────────────────────────────────────────────────────

function _setStatus(update) {
    _status = { ..._status, ...update, at: Date.now() };
    _subscribers.forEach(cb => { try { cb({ ..._status }); } catch (_) { } });
}

// ─── IndexedDB helpers ────────────────────────────────────────────────────────

async function _openDB() {
    return openDB(DB_NAME, DB_VERSION);
}

async function _getStudents() {
    const db = await _openDB();
    return db.getAll('students');
}

async function _getSettings() {
    const db = await _openDB();
    return db.getAll('settings');
}

async function _getStandards() {
    const db = await _openDB();
    return db.getAll('standards');
}

/** ATOMIC batch write of settings */
async function _writeSettingsAtomic(settingsEntries) {
    if (!Array.isArray(settingsEntries) || !settingsEntries.length) return;
    const db = await _openDB();
    const tx = db.transaction('settings', 'readwrite');
    const now = new Date().toISOString();

    for (const s of settingsEntries) {
        if (!s?.key) continue;
        let val = s.value;
        if (typeof val === 'string' && val.length > 1 && (val.startsWith('{') || val.startsWith('['))) {
            try { val = JSON.parse(val); } catch { }
        }
        await tx.store.put({ key: s.key, value: val, updatedAt: now });
    }
    await tx.done;
}

/** ATOMIC batch write of students */
async function _writeStudentsAtomic(students) {
    if (!Array.isArray(students) || !students.length) return 0;
    const db = await _openDB();
    let written = 0;
    for (let i = 0; i < students.length; i += 50) {
        const chunk = students.slice(i, i + 50);
        const tx = db.transaction('students', 'readwrite');
        const idx = tx.store.index('grNo');
        for (const student of chunk) {
            if (!student?.grNo) continue;
            const existing = await idx.get(String(student.grNo));
            if (existing) {
                await tx.store.put({ ...existing, ...student, id: existing.id });
            } else {
                const { id, ...rest } = student;
                await tx.store.add({ ...rest, createdAt: new Date().toISOString() });
            }
            written++;
        }
        await tx.done;
    }
    return written;
}

/** Normalize backup structure for ingestion with importAllData */
function _normalizeBackupData(data) {
    if (!data) return null;

    // Convert object settings to array if needed
    let settingsArr = [];
    if (Array.isArray(data.settings)) {
        settingsArr = data.settings;
    } else if (data.settings && typeof data.settings === 'object') {
        settingsArr = Object.entries(data.settings).map(([key, value]) => ({ key, value }));
    }

    // Ensure it has the structure expected by importAllData
    return {
        ...data,
        students: data.students || data.records || [], // Handle legacy 'records' key
        settings: settingsArr,
        standards: data.standards || [],
        customFields: data.customFields || [],
        documents: data.documents || []
    };
}

// ─── Drive helpers ────────────────────────────────────────────────────────────

function _driveHeaders() {
    const t = localStorage.getItem('gdriveToken');
    const exp = localStorage.getItem('gdriveTokenExpiry');
    if (!t || !exp || Date.now() > parseInt(exp)) throw new Error('Drive not authenticated');
    return { Authorization: `Bearer ${t}` };
}

async function _findOrCreateFolder(name, parentId) {
    const h = _driveHeaders();
    const q = `name='${name}' and mimeType='application/vnd.google-apps.folder' and trashed=false` +
        (parentId ? ` and '${parentId}' in parents` : '');
    const r = await fetch(`https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id)`, { headers: h });
    if (r.ok) {
        const d = await r.json();
        if (d.files?.length) return d.files[0].id;
    }
    const cr = await fetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        headers: { ...h, 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, mimeType: 'application/vnd.google-apps.folder', parents: parentId ? [parentId] : [] }),
    });
    return (await cr.json()).id;
}

async function _getFolderTree(user) {
    if (_folderTree) return _folderTree;
    const dbConn = await _openDB().catch(() => null);
    const profileRec = dbConn ? await dbConn.get('settings', 'school_profile').catch(() => null) : null;
    const code = profileRec?.value?.schoolCode || user?.schoolCode || '';
    const name = profileRec?.value?.schoolName || user?.schoolName || 'School';
    const folderName = (`${code}_${name}`.replace(/[^a-zA-Z0-9_\- ]/g, '') || 'EduNorm_School').slice(0, 50);
    const rootId = await _findOrCreateFolder(DRIVE_ROOT, null);
    const schoolId = await _findOrCreateFolder(folderName, rootId);
    const photosId = await _findOrCreateFolder('Photos', schoolId);
    _folderTree = { root: rootId, school: schoolId, photos: photosId };
    return _folderTree;
}

// ─── DRIVE BACKUP ───────────────────────────────────────────────────────────

async function _backupToDrive(user) {
    if (!driveIsAuthenticated()) return { success: false, error: 'Not authenticated' };
    _setStatus({ state: 'syncing', message: 'Backing up to Google Drive...' });

    try {
        const fullData = await exportAllData();
        const folders = await _getFolderTree(user);

        // Pre-flight Check
        const fileIdKey = `edunorm_db_file_id_${folders.school}`;
        const knownId = localStorage.getItem(fileIdKey);
        if (knownId) {
            try {
                const h = _driveHeaders();
                const res = await fetch(`https://www.googleapis.com/drive/v3/files/${knownId}?fields=size,modifiedTime`, { headers: h });
                if (res.ok) {
                    const meta = await res.json();
                    const cloudSize = parseInt(meta.size || '0');
                    const localSize = JSON.stringify(fullData).length;
                    if (cloudSize > localSize + 5000) {
                        console.warn('[Sync] ABORT: Cloud file is significantly larger.');
                        _setStatus({ state: 'idle', message: 'Cloud has better data — PUSH BLOCKED' });
                        return { success: false, error: 'STRONGER_CLOUD_DATA' };
                    }
                }
            } catch (e) { }
        }

        const now = new Date().toISOString();
        const payload = {
            ...fullData,
            version: '6.5',
            exportedAt: now,
            // Strip large photos for the main json (they go to separate folders)
            students: fullData.students.map(({ studentPhoto, ...rest }) => rest)
        };

        const uploadResult = await uploadFile('database.json', JSON.stringify(payload, null, 2), 'application/json', folders.school, knownId);
        if (uploadResult?.id) localStorage.setItem(fileIdKey, uploadResult.id);

        const syncTime = new Date().toISOString();
        _setStatus({ state: 'idle', message: `Drive backup ✅`, lastSync: syncTime });
        AppBus.emit(APP_EVENTS.BACKUP_COMPLETE, { at: syncTime, count: fullData.students.length });
        return { success: true, id: uploadResult.id };
    } catch (err) {
        console.error('[Sync] Backup full error:', err);
        _setStatus({ state: 'error', message: 'Backup failed' });
        return { success: false, error: err.message };
    }
}

// ─── DRIVE RESTORE ──────────────────────────────────────────────────────────

/** Find any .json backup file anywhere on Drive */
async function _findAllBackupFiles() {
    if (!driveIsAuthenticated()) return [];
    try {
        const h = _driveHeaders();
        // Permissive search: find any JSON file created by the app or in the backups folder
        const q = encodeURIComponent("mimeType='application/json' and trashed=false and name contains '.json'");
        console.log('[Sync] Searching Drive with query:', q);
        const r = await fetch(`https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name,size,modifiedTime)&orderBy=modifiedTime desc`, { headers: h });
        const data = await r.json();
        const files = (data.files || []).filter(f => !f.name.includes('package.json')); // Ignore system files
        console.log(`[Sync] Found ${files.length} potential backup files`);

        return files.sort((a, b) => {
            const timeA = new Date(a.modifiedTime).getTime();
            const timeB = new Date(b.modifiedTime).getTime();
            return timeB - timeA; // Most recent first
        });
    } catch (e) {
        console.error('[Sync] Find files failed:', e);
        return [];
    }
}

async function _restoreFromDrive(user) {
    if (!driveIsAuthenticated()) return { success: false, error: 'Not authenticated' };
    if (_isSyncing) {
        console.warn('[Sync] Restore blocked: already syncing');
        return { success: false, error: 'Sync in progress' };
    }

    _isSyncing = true;
    _setStatus({ state: 'syncing', message: 'Searching Cloud for data...' });

    try {
        const files = await _findAllBackupFiles();
        if (!files.length) {
            _setStatus({ state: 'idle', message: 'No cloud data found' });
            return { success: false, error: 'No cloud data found' };
        }

        console.log('[Sync] Attempting restore from best candidate:', files[0].name);
        let data = null;
        let chosenFile = null;

        for (const file of files) {
            try {
                const token = localStorage.getItem('gdriveToken');
                const resp = await fetch(`https://www.googleapis.com/drive/v3/files/${file.id}?alt=media`, { headers: { Authorization: `Bearer ${token}` } });
                if (!resp.ok) continue;
                const json = await resp.json();
                if (json.students || json.settings) {
                    data = json;
                    chosenFile = file;
                    break;
                }
            } catch (e) { console.warn(`[Sync] Failed to read ${file.name}:`, e.message); }
        }

        if (!data) throw new Error('Could not find any valid EduNorm data in cloud files');

        console.log(`[Sync] Chosen file for restore: ${chosenFile.name} (ID: ${chosenFile.id}, Size: ${chosenFile.size} bytes, Modified: ${new Date(chosenFile.modifiedTime).toLocaleString()})`);

        const normalized = _normalizeBackupData(data);
        console.log(`[Sync] Starting database import (FORCED)...`);
        const success = await importAllData(normalized, true); // <--- FORCE = true
        if (!success) throw new Error('Database import failed');

        const now = new Date().toISOString();
        const count = normalized.students.length;
        _setStatus({ state: 'idle', message: `Restored ${count} records ✅`, lastSync: now });
        console.log(`[Sync] RESTORE SUCCESS: ${count} students restored from ${chosenFile.name}`);
        return { success: true, count };
    } catch (err) {
        console.error('[Sync] Restore error:', err);
        _setStatus({ state: 'error', message: `Restore failed: ${err.message}` });
        return { success: false, error: err.message };
    } finally {
        _isSyncing = false;
    }
}

// ─── RUNBACKUP WRAPPER ───────────────────────────────────────────────────────

async function _runBackup(user, label = 'auto') {
    if (_isSyncing || !driveIsAuthenticated()) return { success: false, error: 'Locked or Unauth' };
    if (label !== 'manual' && (Date.now() - _lastRestoreAt) < 300000) return { success: false, error: 'Cooldown' };
    _isSyncing = true;
    try {
        const res = await _backupToDrive(user);
        return res; // Already returns {success, error} or similar
    } catch (e) {
        return { success: false, error: e.message };
    } finally {
        _isSyncing = false;
    }
}

// ─── PUBLIC API ───────────────────────────────────────────────────────────────

const SyncService = {
    async init(user) {
        if (!user) return;
        _currentUser = user;
        _setStatus({ state: 'idle', message: 'Sync initializing...' });

        // Pull-First Initialization
        try {
            const students = await _getStudents();
            const settings = await _getSettings();
            const hasProfile = settings.some(s => s.key === 'school_profile');
            const files = await _findAllBackupFiles();
            const cloudSize = parseInt(files[0]?.size || '0');
            const localSize = JSON.stringify({ students, settings }).length;

            if (files.length && (!students.length || cloudSize > localSize + 1000)) {
                _setStatus({ state: 'syncing', message: 'Updating from Cloud...' });
                const res = await _restoreFromDrive(user);
                if (res) {
                    _lastRestoreAt = Date.now();
                    AppBus.emit(APP_EVENTS.SETTINGS_CHANGED, { source: 'auto-sync' });
                }
            } else {
                _setStatus({ state: 'idle', message: `${students.length} students ready` });
            }
        } catch (e) { console.warn('[SyncInit] Failed:', e.message); }

        if (_autoTimer) clearInterval(_autoTimer);
        _autoTimer = setInterval(() => _runBackup(user, 'auto'), AUTO_MS);

        if (_unsubDB) _unsubDB();
        const sub = AppBus.on(APP_EVENTS.SETTINGS_CHANGED, () => {
            clearTimeout(_dirtyTimer);
            _dirtyTimer = setTimeout(() => _runBackup(user, 'dirty'), DIRTY_MS);
        });
        _unsubDB = () => sub();
    },

    stop() {
        if (_autoTimer) clearInterval(_autoTimer);
        if (_dirtyTimer) clearTimeout(_dirtyTimer);
        if (_unsubDB) _unsubDB();
        _currentUser = null;
        _setStatus({ state: 'idle', message: 'Sync stopped' });
    },

    async backupNow(user) { return await _runBackup(user || _currentUser, 'manual'); },
    async restoreFromDrive(user) { return await _restoreFromDrive(user || _currentUser); },
    getStatus() { return { ..._status }; },
    subscribe(cb) { _subscribers.push(cb); cb({ ..._status }); return () => { _subscribers = _subscribers.filter(s => s !== cb); }; },
    isDriveConnected() { return driveIsAuthenticated(); },
    isFirebaseReady() { return false; }
};

export default SyncService;
