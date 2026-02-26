/**
 * EDUNORM IMMORTAL BACKUP — SERVICE WORKER SANDBOX
 * Runs completely isolated from the main app thread.
 * Survives page crashes, tab closes, and network outages.
 * Auto-reconnects when the site comes back online.
 *
 * KEY PRINCIPLE:
 *   The main app posts snapshot data to this SW via postMessage.
 *   This SW stores it in its own IDB queue and syncs to Firestore
 *   using the Firestore REST API (no Firebase SDK needed in SW).
 *   On reconnect, Background Sync fires 'backup-sync' automatically.
 */

const SW_VERSION = 'edunorm-backup-v2';
const QUEUE_DB_NAME = 'edunorm-backup-queue';
const QUEUE_STORE = 'pending-snapshots';
const SYNC_TAG = 'backup-sync';

// ─── IndexedDB helpers (no third-party deps needed) ─────────────────────────
function openQueueDB() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(QUEUE_DB_NAME, 1);
        req.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(QUEUE_STORE)) {
                db.createObjectStore(QUEUE_STORE, { keyPath: 'queueId' });
            }
        };
        req.onsuccess = (e) => resolve(e.target.result);
        req.onerror = (e) => reject(e.target.error);
    });
}

async function queueGet(db, key) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction(QUEUE_STORE, 'readonly');
        const req = tx.objectStore(QUEUE_STORE).get(key);
        req.onsuccess = (e) => resolve(e.target.result);
        req.onerror = (e) => reject(e.target.error);
    });
}

async function queuePut(db, record) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction(QUEUE_STORE, 'readwrite');
        const req = tx.objectStore(QUEUE_STORE).put(record);
        req.onsuccess = (e) => resolve(e.target.result);
        req.onerror = (e) => reject(e.target.error);
    });
}

async function queueGetAll(db) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction(QUEUE_STORE, 'readonly');
        const req = tx.objectStore(QUEUE_STORE).getAll();
        req.onsuccess = (e) => resolve(e.target.result || []);
        req.onerror = (e) => reject(e.target.error);
    });
}

async function queueDelete(db, key) {
    return new Promise((resolve, reject) => {
        const tx = db.transaction(QUEUE_STORE, 'readwrite');
        const req = tx.objectStore(QUEUE_STORE).delete(key);
        req.onsuccess = () => resolve();
        req.onerror = (e) => reject(e.target.error);
    });
}

// ─── Firestore REST API helper ───────────────────────────────────────────────
// Uses REST so we don't need the Firebase SDK in the SW.
// projectId and idToken are passed with each snapshot from the main app.

async function firestoreSet(projectId, path, data, idToken) {
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${path}`;
    const fields = objectToFirestoreFields(data);
    const res = await fetch(url, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({ fields }),
    });
    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Firestore PATCH failed (${res.status}): ${err}`);
    }
    return res.json();
}

async function firestoreGet(projectId, path, idToken) {
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${path}`;
    const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${idToken}` },
    });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`Firestore GET failed (${res.status})`);
    const doc = await res.json();
    return firestoreFieldsToObject(doc.fields || {});
}

// Firestore REST field encoding
function objectToFirestoreFields(obj) {
    const fields = {};
    for (const [key, val] of Object.entries(obj)) {
        if (val === null || val === undefined) {
            fields[key] = { nullValue: null };
        } else if (typeof val === 'boolean') {
            fields[key] = { booleanValue: val };
        } else if (typeof val === 'number') {
            fields[key] = { integerValue: val };
        } else if (typeof val === 'string') {
            fields[key] = { stringValue: val };
        } else if (Array.isArray(val)) {
            fields[key] = {
                arrayValue: {
                    values: val.map(v => ({ stringValue: typeof v === 'object' ? JSON.stringify(v) : String(v) }))
                }
            };
        } else if (typeof val === 'object') {
            fields[key] = { stringValue: JSON.stringify(val) };
        }
    }
    return fields;
}

function firestoreFieldsToObject(fields) {
    const obj = {};
    for (const [key, val] of Object.entries(fields)) {
        if (val.stringValue !== undefined) {
            // Try to JSON parse arrays/objects stored as strings
            try { obj[key] = JSON.parse(val.stringValue); } catch { obj[key] = val.stringValue; }
        } else if (val.integerValue !== undefined) {
            obj[key] = Number(val.integerValue);
        } else if (val.booleanValue !== undefined) {
            obj[key] = val.booleanValue;
        } else if (val.arrayValue !== undefined) {
            obj[key] = (val.arrayValue.values || []).map(v => {
                if (v.stringValue !== undefined) {
                    try { return JSON.parse(v.stringValue); } catch { return v.stringValue; }
                }
                return v;
            });
        } else {
            obj[key] = null;
        }
    }
    return obj;
}

// ─── CORE SYNC LOGIC ─────────────────────────────────────────────────────────
async function processQueue() {
    const db = await openQueueDB();
    const items = await queueGetAll(db);

    if (items.length === 0) {
        console.log('[BackupSW] Queue is empty — nothing to sync');
        return;
    }

    console.log(`[BackupSW] Processing ${items.length} queued backup(s)`);

    for (const item of items) {
        try {
            const { queueId, projectId, userId, idToken, snapshot } = item;

            if (!projectId || !userId || !idToken) {
                // Token may have expired — skip until re-queued from main thread
                console.warn(`[BackupSW] Item ${queueId} missing credentials, skipping`);
                continue;
            }

            const { settings = [], standards = [], customFields = [], students = [] } = snapshot;

            // Strip large binary data from settings (base64 logos > 10KB)
            const cleanSettings = settings.map(s => {
                if (!s || typeof s !== 'object') return s;
                const clean = { ...s };
                if (typeof clean.value === 'string' && clean.value.length > 10000 &&
                    (clean.value.startsWith('data:') || /^[A-Za-z0-9+/=]{10000,}/.test(clean.value))) {
                    clean.value = '[BINARY_STRIPPED]';
                }
                if (clean.value && typeof clean.value === 'object') {
                    try {
                        clean.value = JSON.parse(JSON.stringify(clean.value, (key, val) => {
                            if (typeof val === 'string' && val.length > 10000 &&
                                (val.startsWith('data:') || /^[A-Za-z0-9+/=]{10000,}/.test(val))) {
                                return '[BINARY_STRIPPED]';
                            }
                            return val;
                        }));
                    } catch (e) { /* keep original */ }
                }
                return clean;
            });

            const CHUNK_SIZE = 200;
            const chunks = [];
            for (let i = 0; i < students.length; i += CHUNK_SIZE) {
                chunks.push(students.slice(i, i + CHUNK_SIZE));
            }

            // Write meta document
            const metaPath = `backups/${userId}/meta/data`;
            await firestoreSet(projectId, metaPath, {
                settings: JSON.stringify(cleanSettings),
                standards: JSON.stringify(standards),
                customFields: JSON.stringify(customFields),
                totalStudents: students.length,
                totalChunks: chunks.length,
                syncedAt: new Date().toISOString(),
                version: 1,
                syncedByWorker: true,
            }, idToken);

            // Write each chunk
            for (let i = 0; i < chunks.length; i++) {
                const chunkPath = `backups/${userId}/chunks/${i}`;
                await firestoreSet(projectId, chunkPath, {
                    students: JSON.stringify(chunks[i]),
                    chunkIndex: i,
                }, idToken);
            }

            // ✅ Successfully synced — remove from queue
            await queueDelete(db, queueId);
            console.log(`[BackupSW] ✅ Synced item ${queueId} (${students.length} students)`);

        } catch (err) {
            console.error(`[BackupSW] ❌ Failed item ${item.queueId}:`, err.message);
            // Track retries — remove after 3 failures
            const retries = (item.retries || 0) + 1;
            if (retries >= 3) {
                await queueDelete(db, queueId);
                console.warn(`[BackupSW] 🗑️ Removed stale item ${queueId} after ${retries} failed attempts`);
            } else {
                // Update retry count
                try {
                    const tx = db.transaction('backupQueue', 'readwrite');
                    const existing = await tx.store.get(queueId);
                    if (existing) {
                        existing.retries = retries;
                        await tx.store.put(existing);
                    }
                    await tx.done;
                } catch (_) { /* ignore */ }
            }
        }
    }
}

// ─── SERVICE WORKER EVENT HANDLERS ───────────────────────────────────────────

self.addEventListener('install', (event) => {
    console.log(`[BackupSW] Installed ${SW_VERSION}`);
    self.skipWaiting(); // Activate immediately
});

self.addEventListener('activate', (event) => {
    console.log(`[BackupSW] Activated ${SW_VERSION}`);
    event.waitUntil((async () => {
        await self.clients.claim();
        // Clear stale queue from previous version
        try {
            const db = await openQueueDB();
            const tx = db.transaction(QUEUE_STORE, 'readwrite');
            const allItems = await tx.store.getAll();
            let cleared = 0;
            for (const item of allItems) {
                if (item.retries >= 2 || !item.userId) {
                    await tx.store.delete(item.queueId);
                    cleared++;
                }
            }
            await tx.done;
            if (cleared > 0) console.log(`[BackupSW] 🗑️ Cleared ${cleared} stale queue items`);
        } catch (e) { /* ignore — queue may not exist yet */ }
    })());
});

// Background Sync: fires automatically when network is restored
self.addEventListener('sync', (event) => {
    if (event.tag === SYNC_TAG) {
        console.log('[BackupSW] Background sync triggered by browser');
        event.waitUntil(processQueue());
    }
});

// Message from main thread: add snapshot to queue and trigger sync
self.addEventListener('message', async (event) => {
    const { type, payload } = event.data || {};

    if (type === 'ENQUEUE_BACKUP') {
        try {
            const db = await openQueueDB();
            const record = {
                queueId: `backup_${Date.now()}`,
                queuedAt: new Date().toISOString(),
                ...payload, // { projectId, userId, idToken, snapshot }
            };
            await queuePut(db, record);
            console.log(`[BackupSW] Queued backup ${record.queueId} (${payload.snapshot?.students?.length || 0} students)`);

            // Try to sync immediately if online
            // Background Sync API will retry if this fails
            try {
                await self.registration.sync.register(SYNC_TAG);
            } catch (e) {
                // Background Sync not supported — try direct sync
                await processQueue();
            }

            // Notify all clients of success
            const clients = await self.clients.matchAll();
            clients.forEach(c => c.postMessage({ type: 'BACKUP_QUEUED', queueId: record.queueId }));

        } catch (err) {
            console.error('[BackupSW] Failed to enqueue backup:', err);
        }
    }

    if (type === 'FORCE_SYNC') {
        await processQueue();
        const clients = await self.clients.matchAll();
        clients.forEach(c => c.postMessage({ type: 'BACKUP_SYNC_COMPLETE' }));
    }

    if (type === 'GET_STATUS') {
        const db = await openQueueDB();
        const items = await queueGetAll(db);
        event.source?.postMessage({ type: 'STATUS', pending: items.length });
    }
});

// Fetch: pass through (we're not a caching SW)
self.addEventListener('fetch', () => { });
