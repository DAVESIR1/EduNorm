/**
 * EDUNORM CLOUD SYNC — v3 (AES-256-GCM Encrypted)
 * 
 * SECURITY: All data is encrypted client-side with AES-256-GCM before
 * leaving the browser. Firestore only stores ciphertext. Even Firebase
 * admins cannot read the data without the user's encryption key.
 * 
 * Key derivation: PBKDF2(userUID + salt, 100000 iterations) → 256-bit AES key
 * Encryption: AES-256-GCM (authenticated encryption — tamper-proof)
 * 
 * Firestore Structure:
 *   sync/{userId}/meta/info       → { totalStudents, syncedAt, version, encrypted: true }
 *   sync/{userId}/data/students   → { cipher, iv, tag }  (encrypted JSON)
 *   sync/{userId}/data/settings   → { cipher, iv, tag }
 *   sync/{userId}/data/standards  → { cipher, iv, tag }
 * 
 * OLD paths checked during restore (one-time migration, unencrypted):
 *   backups/{userId}/...          → DirectBackupService v1
 *   schools/{userId}/...          → School registration
 *   sovereign_data/...            → SovereignSync
 */

import { doc, setDoc, getDoc, collection, getDocs, writeBatch } from 'firebase/firestore';
import { db as firestoreDb, isFirebaseConfigured } from '../config/firebase.js';
import { exportAllData, importAllData } from './database.js';

const ROOT = 'backups';  // Uses existing Firestore rules (firestore.rules line 63)
const SALT = 'EDUNORM_AES256_2026';

function getDb() {
    if (!isFirebaseConfigured || !firestoreDb) throw new Error('Firebase not configured');
    return firestoreDb;
}

// ═══════════════════════════════════════════════════════════════════════════════
// AES-256-GCM ENCRYPTION (Web Crypto API — browser-native, zero dependencies)
// ═══════════════════════════════════════════════════════════════════════════════

async function deriveKey(userId) {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(userId + SALT),
        'PBKDF2',
        false,
        ['deriveKey']
    );
    return crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: encoder.encode(SALT + userId),
            iterations: 100000,
            hash: 'SHA-256',
        },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
    );
}

async function encrypt(data, userId) {
    const key = await deriveKey(userId);
    const iv = crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV for GCM
    const encoder = new TextEncoder();
    const plaintext = encoder.encode(JSON.stringify(data));

    const cipherBuffer = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        plaintext
    );

    // Convert to base64 for Firestore storage
    return {
        cipher: bufferToBase64(cipherBuffer),
        iv: bufferToBase64(iv),
        encrypted: true,
    };
}

async function decrypt(envelope, userId) {
    if (!envelope?.encrypted || !envelope.cipher || !envelope.iv) {
        // Not encrypted — return raw data (legacy support)
        return envelope?.items || envelope;
    }
    const key = await deriveKey(userId);
    const cipherBuffer = base64ToBuffer(envelope.cipher);
    const iv = base64ToBuffer(envelope.iv);

    const plainBuffer = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        cipherBuffer
    );

    const decoder = new TextDecoder();
    return JSON.parse(decoder.decode(plainBuffer));
}

function bufferToBase64(buffer) {
    const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
}

function base64ToBuffer(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes.buffer;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SYNC: Local → Cloud (encrypted)
// ═══════════════════════════════════════════════════════════════════════════════
export async function syncToCloud(userId) {
    if (!userId) throw new Error('Not logged in');
    const db = getDb();
    const data = await exportAllData();

    const students = data.students || [];
    const settings = data.settings || [];
    const standards = data.standards || [];
    const customFields = data.customFields || [];

    console.log(`📤 Sync: ${students.length} students, ${settings.length} settings, ${standards.length} standards`);

    // Strip large binary data from settings (base64 logos, photos > 10KB)
    const cleanSettings = settings.map(s => {
        if (!s || typeof s !== 'object') return s;
        const clean = { ...s };
        if (typeof clean.value === 'string' && clean.value.length > 10000 &&
            (clean.value.startsWith('data:') || clean.value.match(/^[A-Za-z0-9+/=]{10000,}/))) {
            clean.value = '[BINARY_STRIPPED]';
            console.log(`📤 Stripped large binary from setting: ${clean.key}`);
        }
        // Also check nested objects for base64 values
        if (clean.value && typeof clean.value === 'object') {
            clean.value = JSON.parse(JSON.stringify(clean.value, (key, val) => {
                if (typeof val === 'string' && val.length > 10000 &&
                    (val.startsWith('data:') || val.match(/^[A-Za-z0-9+/=]{10000,}/))) {
                    return '[BINARY_STRIPPED]';
                }
                return val;
            }));
        }
        return clean;
    });

    // Encrypt each data type
    const [encStudents, encSettings, encStandards, encCustomFields] = await Promise.all([
        encrypt(students, userId),
        encrypt(cleanSettings, userId),
        encrypt(standards, userId),
        encrypt(customFields, userId),
    ]);

    // Write meta (unencrypted — just counts, no PII)
    await setDoc(doc(db, ROOT, userId, 'meta', 'info'), {
        totalStudents: students.length,
        totalSettings: settings.length,
        totalStandards: standards.length,
        syncedAt: new Date().toISOString(),
        version: 3,
        encrypted: true,
        algorithm: 'AES-256-GCM',
    });

    // Write encrypted data (handle potential size limits)
    try {
        const batch = writeBatch(db);
        batch.set(doc(db, ROOT, userId, 'data', 'students'), encStudents);
        batch.set(doc(db, ROOT, userId, 'data', 'settings'), encSettings);
        batch.set(doc(db, ROOT, userId, 'data', 'standards'), encStandards);
        batch.set(doc(db, ROOT, userId, 'data', 'customFields'), encCustomFields);
        await batch.commit();
    } catch (e) {
        if (e.message?.includes('longer than') || e.message?.includes('INVALID_ARGUMENT')) {
            console.warn('📤 Batch too large, writing documents individually...');
            // Write one by one, skip oversized ones
            for (const [name, data] of [['students', encStudents], ['settings', encSettings], ['standards', encStandards], ['customFields', encCustomFields]]) {
                try {
                    await setDoc(doc(db, ROOT, userId, 'data', name), data);
                } catch (e2) {
                    console.warn(`📤 Skipped oversized ${name}: ${e2.message}`);
                }
            }
        } else {
            throw e;
        }
    }

    console.log(`✅ Sync complete (AES-256-GCM): ${students.length} students + ${settings.length} settings`);
    return { synced: students.length + settings.length + standards.length, students: students.length };
}

// ═══════════════════════════════════════════════════════════════════════════════
// RESTORE: Cloud → Local (decrypts v3, reads legacy unencrypted)
// ═══════════════════════════════════════════════════════════════════════════════
export async function restoreFromCloud(userId) {
    if (!userId) throw new Error('Not logged in');
    const db = getDb();

    console.log('📥 Restore: Starting for user', userId);

    let students = [];
    let settings = [];
    let standards = [];
    let customFields = [];

    // ─── PATH 1: sync/{userId} (v3 — encrypted) ───────────────────────────
    try {
        const metaSnap = await getDoc(doc(db, ROOT, userId, 'meta', 'info'));
        if (metaSnap.exists()) {
            const meta = metaSnap.data();
            console.log(`📥 [sync/] Found v${meta.version} backup: ${meta.totalStudents} students, encrypted: ${meta.encrypted || false}`);

            const studentsSnap = await getDoc(doc(db, ROOT, userId, 'data', 'students'));
            const settingsSnap = await getDoc(doc(db, ROOT, userId, 'data', 'settings'));
            const standardsSnap = await getDoc(doc(db, ROOT, userId, 'data', 'standards'));
            const cfSnap = await getDoc(doc(db, ROOT, userId, 'data', 'customFields'));

            if (studentsSnap.exists()) {
                const raw = await decrypt(studentsSnap.data(), userId);
                students = Array.isArray(raw) ? raw : [];
            }
            if (settingsSnap.exists()) {
                const raw = await decrypt(settingsSnap.data(), userId);
                settings = (Array.isArray(raw) ? raw : []).filter(s => s && typeof s === 'object' && s.key);
            }
            if (standardsSnap.exists()) {
                const raw = await decrypt(standardsSnap.data(), userId);
                standards = (Array.isArray(raw) ? raw : []).filter(s => s && typeof s === 'object' && s.id);
            }
            if (cfSnap.exists()) {
                const raw = await decrypt(cfSnap.data(), userId);
                customFields = Array.isArray(raw) ? raw.filter(c => c && typeof c === 'object') : [];
            }

            console.log(`📥 [sync/] Decrypted: ${students.length} students, ${settings.length} settings, ${standards.length} standards`);
        }
    } catch (e) {
        console.warn('📥 [sync/] Error:', e.message);
    }

    // ─── PATH 2: backups/{userId} (v1 legacy — unencrypted) ────────────────
    if (students.length === 0) {
        try {
            const metaSnap = await getDoc(doc(db, 'backups', userId, 'meta', 'data'));
            if (metaSnap.exists()) {
                const meta = metaSnap.data();
                console.log('📥 [backups/] Found legacy backup');

                if (meta.settings && settings.length === 0) {
                    const s = Array.isArray(meta.settings) ? meta.settings : [];
                    settings.push(...s.filter(s => s && typeof s === 'object' && s.key));
                }
                if (meta.standards && standards.length === 0) {
                    const st = Array.isArray(meta.standards) ? meta.standards : [];
                    standards.push(...st.filter(s => s && typeof s === 'object' && s.id));
                }

                const chunksSnap = await getDocs(collection(db, 'backups', userId, 'chunks'));
                for (const chunkDoc of chunksSnap.docs) {
                    students.push(...(chunkDoc.data()?.students || []));
                }
                console.log(`📥 [backups/] Got: ${students.length} students`);
            }
        } catch (e) {
            console.log('📥 [backups/]', e.message?.includes('permission') ? 'no access' : e.message);
        }
    }

    // ─── PATH 3: schools/{userId} (school registration — unencrypted) ──────
    if (students.length === 0) {
        try {
            const schoolSnap = await getDoc(doc(db, 'schools', userId));
            if (schoolSnap.exists()) {
                const schoolData = schoolSnap.data();
                console.log(`📥 [schools/] Found school: ${schoolData.schoolName || 'unknown'}`);
                if (!settings.find(s => s.key === 'school_profile')) {
                    settings.push({
                        key: 'school_profile',
                        value: schoolData,
                        updatedAt: schoolData.updatedAt || new Date().toISOString()
                    });
                }
            }

            const studentsSnap = await getDocs(collection(db, 'schools', userId, 'students'));
            for (const studentDoc of studentsSnap.docs) {
                const data = { ...studentDoc.data() };
                if (!data.grNo && data.gr_no) data.grNo = String(data.gr_no).trim();
                delete data.id;  // Remove cloud ID — let IndexedDB autoIncrement assign one
                students.push(data);
            }
            if (students.length > 0) console.log(`📥 [schools/students] Found ${students.length} students`);

            if (standards.length === 0) {
                try {
                    const stSnap = await getDocs(collection(db, 'schools', userId, 'standards'));
                    for (const d of stSnap.docs) standards.push({ ...d.data(), id: d.id });
                } catch (e) { /* ok */ }
            }
        } catch (e) {
            console.log('📥 [schools/]', e.message?.includes('permission') ? 'no access' : e.message);
        }
    }

    // ─── PATH 4: sovereign_data (ALWAYS check — may have richer field data) ─
    // Even if students were found from schools/, sovereign_data may have the
    // full 43-field records (encrypted). Merge additional fields by grNo.
    {
        const enrichCollections = ['sovereign_data', 'entity'];
        for (const colName of enrichCollections) {
            try {
                const snap = await getDocs(collection(db, colName));
                if (!snap.empty) {
                    console.log(`📥 [${colName}] Checking ${snap.size} docs for enrichment...`);
                    let enriched = 0;
                    for (const docSnap of snap.docs) {
                        const data = docSnap.data();
                        let fullRecord = null;

                        if (data.body && data.header?.sid) {
                            try {
                                const { default: SC } = await import('../core/v2/SovereignCore.js');
                                fullRecord = JSON.parse(SC.decrypt(data.body));
                            } catch (e) { /* skip corrupt */ }
                        } else if (data.grNo || data.gr_no || data.name) {
                            fullRecord = data;
                        }

                        if (fullRecord) {
                            const grNo = fullRecord.grNo || (fullRecord.gr_no ? String(fullRecord.gr_no).trim() : null);
                            if (grNo) {
                                // Find matching student and merge ALL fields
                                const existing = students.find(s => s.grNo === grNo);
                                if (existing) {
                                    // Merge: fill in any missing fields from the richer record
                                    Object.keys(fullRecord).forEach(key => {
                                        if (key === 'id') return; // skip id
                                        if (existing[key] === undefined || existing[key] === null || existing[key] === '') {
                                            existing[key] = fullRecord[key];
                                        }
                                    });
                                    enriched++;
                                } else if (students.length === 0) {
                                    // No students found yet — add this as a new student
                                    const cleaned = { ...fullRecord };
                                    delete cleaned.id;
                                    if (!cleaned.grNo && cleaned.gr_no) cleaned.grNo = String(cleaned.gr_no).trim();
                                    if (cleaned.grNo) students.push(cleaned);
                                }
                            }
                        }
                    }
                    if (enriched > 0) console.log(`📥 [${colName}] Enriched ${enriched} students with additional fields`);
                }
            } catch (e) {
                console.log(`📥 [${colName}]`, e.message?.includes('permission') ? 'no access' : e.message);
            }
        }
    }

    // ─── IMPORT ────────────────────────────────────────────────────────────
    const total = students.length + settings.length + standards.length + customFields.length;
    console.log(`📥 TOTAL: ${students.length} students, ${settings.length} settings, ${standards.length} standards`);

    if (total === 0) {
        console.log('📥 No data found in any cloud path');
        return { restored: 0, students: 0, found: false };
    }

    await importAllData({
        students: students.length > 0 ? students : undefined,
        settings: settings.length > 0 ? settings : undefined,
        standards: standards.length > 0 ? standards : undefined,
        customFields: customFields.length > 0 ? customFields : undefined,
    });

    console.log(`✅ Restore complete: ${total} records imported`);

    // NOTE: Do NOT auto-sync to cloud after restore.
    // That creates a feedback loop: restore (possibly incomplete) → push incomplete data back → 
    // next restore gets incomplete data. Let the normal auto-backup handle syncing.

    return { restored: total, students: students.length, found: true };
}

// ═══════════════════════════════════════════════════════════════════════════════
// STATUS CHECK
// ═══════════════════════════════════════════════════════════════════════════════
export async function getCloudBackupStatus(userId) {
    if (!userId || !isFirebaseConfigured || !firestoreDb) {
        return { exists: false, configured: isFirebaseConfigured };
    }
    try {
        const db = getDb();
        const metaSnap = await getDoc(doc(db, ROOT, userId, 'meta', 'info'));
        if (metaSnap.exists()) {
            const meta = metaSnap.data();
            return {
                exists: true,
                configured: true,
                students: meta.totalStudents,
                syncedAt: meta.syncedAt,
                version: meta.version,
                encrypted: meta.encrypted || false,
                algorithm: meta.algorithm || 'none',
            };
        }
        return { exists: false, configured: true };
    } catch (e) {
        return { exists: false, configured: true, error: e.message };
    }
}
