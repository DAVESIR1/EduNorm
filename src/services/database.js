import { openDB } from 'idb';
import { normalizeId } from './IdentityResolutionService';

const DB_NAME = 'StudentDataEntry';
const DB_VERSION = 2; // Incremented for Migration Support

// Schema Migrations Definition
const MIGRATIONS = {
    2: (db, tx) => {
        // v2 Migration: Ensure 'backups' store exists (locally) if we want local snapshots
        if (!db.objectStoreNames.contains('local_backups')) {
            db.createObjectStore('local_backups', { keyPath: 'id', autoIncrement: true });
        }
        // Example: Add 'status' index to students if missing
        const studentStore = tx.objectStore('students');
        if (!studentStore.indexNames.contains('isActive')) {
            studentStore.createIndex('isActive', 'isActive');
        }
    }
};

// Initialize the database with Migration Support
export async function initDB() {
    return openDB(DB_NAME, DB_VERSION, {
        upgrade(db, oldVersion, newVersion, tx) {
            console.log(`DB Upgrade: v${oldVersion} -> v${newVersion}`);

            // v1: Initial Schema (Legacy Support)
            if (oldVersion < 1) {
                // Settings store
                if (!db.objectStoreNames.contains('settings')) {
                    db.createObjectStore('settings', { keyPath: 'key' });
                }

                // Students store with indexes
                if (!db.objectStoreNames.contains('students')) {
                    const studentStore = db.createObjectStore('students', {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    studentStore.createIndex('grNo', 'grNo', { unique: true });
                    studentStore.createIndex('standard', 'standard');
                    studentStore.createIndex('rollNo', 'rollNo');
                    studentStore.createIndex('name', 'name');
                }

                // Standards/Classes store
                if (!db.objectStoreNames.contains('standards')) {
                    db.createObjectStore('standards', { keyPath: 'id' });
                }

                // Custom fields store
                if (!db.objectStoreNames.contains('customFields')) {
                    db.createObjectStore('customFields', { keyPath: 'id', autoIncrement: true });
                }

                // Documents store (for file metadata)
                if (!db.objectStoreNames.contains('documents')) {
                    const docStore = db.createObjectStore('documents', {
                        keyPath: 'id',
                        autoIncrement: true
                    });
                    docStore.createIndex('studentId', 'studentId');
                }
            }

            // Apply subsequent migrations sequentially
            for (let v = oldVersion + 1; v <= newVersion; v++) {
                if (MIGRATIONS[v]) {
                    console.log(`Applying Migration v${v}...`);
                    MIGRATIONS[v](db, tx);
                }
            }
        },
    });
}

// Settings operations
export async function getSetting(key) {
    const db = await initDB();
    const record = await db.get('settings', key);
    return record?.value ?? null;
}

export async function setSetting(key, value) {
    const db = await initDB();
    const result = await db.put('settings', { key, value, updatedAt: new Date().toISOString() });
    notifyChanges('settings');
    return result;
}

export async function getAllSettings() {
    const db = await initDB();
    return db.getAll('settings');
}

// Sync Timestamp Management
let changeListeners = [];

export function subscribeToChanges(callback) {
    changeListeners.push(callback);
    return () => {
        changeListeners = changeListeners.filter(cb => cb !== callback);
    };
}

let notificationsPaused = false;

export function pauseNotifications() {
    notificationsPaused = true;
}

export function resumeNotifications() {
    notificationsPaused = false;
}

function notifyChanges(type) {
    if (notificationsPaused) return;
    // console.log('DB Change:', type);
    changeListeners.forEach(cb => cb(type));
}

export async function getLastSyncTime() {
    const val = await getSetting('last_sync_timestamp');
    return val ? parseInt(val, 10) : 0;
}

export async function setLastSyncTime(timestamp) {
    return setSetting('last_sync_timestamp', timestamp.toString());
}

// Student operations
export async function addStudent(studentData) {
    const db = await initDB();
    const standard = studentData.standard;

    // Get current count for roll number
    const tx = db.transaction('students', 'readwrite');
    const store = tx.objectStore('students');
    const index = store.index('standard');
    const studentsInClass = await index.getAll(standard);

    const rollNo = studentsInClass.length + 1;

    const student = {
        ...studentData,
        rollNo,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    const id = await store.add(student);
    await tx.done;

    notifyChanges('students');
    return { ...student, id };
}

export async function updateStudent(id, studentData) {
    const db = await initDB();
    const existing = await db.get('students', id);

    if (!existing) {
        throw new Error('Student not found');
    }

    const updated = {
        ...existing,
        ...studentData,
        id,
        updatedAt: new Date().toISOString()
    };

    await db.put('students', updated);
    notifyChanges('students');
    return updated;
}

export async function deleteStudent(id) {
    const db = await initDB();
    await db.delete('students', id);
    notifyChanges('students');
}

export async function getStudent(id) {
    const db = await initDB();
    return db.get('students', id);
}

export async function getStudentByGrNo(grNo) {
    const db = await initDB();
    const index = db.transaction('students').store.index('grNo');
    return index.get(grNo);
}

export async function getAllStudents() {
    const db = await initDB();
    return db.getAll('students');
}

export async function getStudentsByStandard(standard) {
    const db = await initDB();
    const index = db.transaction('students').store.index('standard');
    return index.getAll(standard);
}

export async function searchStudents(query) {
    const db = await initDB();
    const allStudents = await db.getAll('students');
    const queryLower = query.toLowerCase();

    return allStudents.filter(student => {
        return (
            student.name?.toLowerCase().includes(queryLower) ||
            student.grNo?.toString().includes(query) ||
            student.rollNo?.toString().includes(query) ||
            student.nameEnglish?.toLowerCase().includes(queryLower)
        );
    });
}

// Standard operations
export async function addStandard(standardData) {
    const db = await initDB();
    const result = await db.put('standards', {
        ...standardData,
        createdAt: new Date().toISOString()
    });
    notifyChanges('standards');
    return result;
}

export async function getStandard(id) {
    const db = await initDB();
    return db.get('standards', id);
}

export async function getAllStandards() {
    const db = await initDB();
    return db.getAll('standards');
}

export async function updateStandard(id, data) {
    const db = await initDB();
    const existing = await db.get('standards', id);
    const result = await db.put('standards', { ...existing, ...data, id });
    notifyChanges('standards');
    return result;
}

export async function deleteStandard(id) {
    const db = await initDB();
    await db.delete('standards', id);
    notifyChanges('standards');
}

// Custom fields operations
export async function addCustomField(fieldData) {
    const db = await initDB();
    const result = await db.add('customFields', {
        ...fieldData,
        createdAt: new Date().toISOString()
    });
    notifyChanges('customFields');
    return result;
}

export async function getAllCustomFields() {
    const db = await initDB();
    return db.getAll('customFields');
}

export async function updateCustomField(id, data) {
    const db = await initDB();
    const existing = await db.get('customFields', id);
    const result = await db.put('customFields', { ...existing, ...data, id });
    notifyChanges('customFields');
    return result;
}

export async function deleteCustomField(id) {
    const db = await initDB();
    await db.delete('customFields', id);
    notifyChanges('customFields');
}

// Document operations
export async function addDocument(docData) {
    const db = await initDB();
    const result = await db.add('documents', {
        ...docData,
        uploadedAt: new Date().toISOString()
    });
    notifyChanges('documents');
    return result;
}

export async function getDocumentsByStudent(studentId) {
    const db = await initDB();
    const index = db.transaction('documents').store.index('studentId');
    return index.getAll(studentId);
}

export async function deleteDocument(id) {
    const db = await initDB();
    await db.delete('documents', id);
    notifyChanges('documents');
}

// Utility: Upgrade class
export async function upgradeClass(fromStandard, toStandard, updates = {}) {
    const db = await initDB();
    const students = await getStudentsByStandard(fromStandard);

    const tx = db.transaction('students', 'readwrite');
    const store = tx.objectStore('students');

    for (const student of students) {
        await store.put({
            ...student,
            ...updates,
            standard: toStandard,
            previousStandard: fromStandard,
            updatedAt: new Date().toISOString()
        });
    }

    await tx.done;
    return students.length;
}

// Utility: Get ledger (all students ordered by GR)
export async function getLedger() {
    const db = await initDB();
    const allStudents = await db.getAll('students');

    // Sort by GR number
    allStudents.sort((a, b) => {
        const grA = parseInt(a.grNo) || 0;
        const grB = parseInt(b.grNo) || 0;
        return grA - grB;
    });

    // Assign ledger numbers
    return allStudents.map((student, index) => ({
        ...student,
        ledgerNo: index + 1
    }));
}

// Export/Backup
export async function exportAllData() {
    const db = await initDB();
    return {
        settings: await db.getAll('settings'),
        students: await db.getAll('students'),
        standards: await db.getAll('standards'),
        customFields: await db.getAll('customFields'),
        documents: await db.getAll('documents'),
        exportedAt: new Date().toISOString()
    };
}

// Import/Restore
export async function importAllData(data) {
    const db = await initDB();
    const yieldToMain = () => new Promise(resolve => setTimeout(resolve, 0));

    console.log('importAllData: Starting optimized import...', {
        settingsCount: data.settings?.length || 0,
        studentsCount: data.students?.length || 0
    });

    pauseNotifications();
    try {
        if (data.settings) {
            const tx = db.transaction('settings', 'readwrite');
            for (const item of data.settings) {
                // Guard: settings store uses keyPath 'key' — skip items without it
                if (!item.key) {
                    console.warn('importAllData: Skipping setting with no key:', item);
                    continue;
                }
                // Skip settings that are entirely BINARY_STRIPPED (from cloud sync base64 stripping)
                if (item.value === '[BINARY_STRIPPED]') {
                    console.log('importAllData: Skipping BINARY_STRIPPED setting:', item.key);
                    continue;
                }
                // For nested objects, remove any BINARY_STRIPPED fields before merging
                if (item.value && typeof item.value === 'object') {
                    const cleanValue = JSON.parse(JSON.stringify(item.value, (key, val) => {
                        if (val === '[BINARY_STRIPPED]') return undefined; // strip out
                        return val;
                    }));
                    item.value = cleanValue;
                }
                try {
                    // Diagnostic: log school_profile contents for debugging
                    if (item.key === 'school_profile') {
                        const fields = item.value && typeof item.value === 'object' ? Object.keys(item.value) : [];
                        console.log('importAllData: 🏫 school_profile incoming fields:', fields.join(', '));
                        console.log('importAllData: 🏫 udise:', item.value?.udiseNumber || '(empty)', '| board:', item.value?.boardName || '(empty)', '| index:', item.value?.indexNumber || '(empty)');
                    }
                    const existing = await tx.store.get(item.key);
                    if (existing) {
                        if (typeof existing.value === 'object' && existing.value !== null &&
                            typeof item.value === 'object' && item.value !== null) {
                            // Smart merge: never overwrite non-empty local data with empty cloud data
                            const merged = { ...existing.value };
                            for (const [k, v] of Object.entries(item.value)) {
                                // Only overwrite if incoming value is non-empty
                                if (v !== null && v !== undefined && v !== '' && v !== '[BINARY_STRIPPED]') {
                                    merged[k] = v;
                                } else if (!(k in merged) || merged[k] === null || merged[k] === undefined) {
                                    // If local is also empty, take whatever cloud has
                                    merged[k] = v;
                                }
                                // else: local has data, cloud is empty — keep local
                            }
                            item.value = merged;
                        }
                        const existingTime = existing.updatedAt ? new Date(existing.updatedAt).getTime() : 0;
                        const incomingTime = item.updatedAt ? new Date(item.updatedAt).getTime() : 0;
                        if (incomingTime >= existingTime || !existing.value) await tx.store.put(item);
                    } else {
                        await tx.store.put(item);
                    }
                } catch (e) {
                    console.warn('importAllData: Setting import error for key', item.key, e.message);
                }
            }
            await tx.done;
            await yieldToMain();
        }

        if (data.students && data.students.length > 0) {
            const studentMap = new Map();
            let count = 0;

            for (const incoming of data.students) {
                // Normalise grNo — cloud-restored records may use gr_no
                if (!incoming.grNo && incoming.gr_no) incoming.grNo = String(incoming.gr_no).trim();
                if (!incoming.grNo) {
                    console.warn('importAllData: Skipping student with no grNo', incoming);
                    continue;
                }
                const grKey = String(incoming.grNo).trim();
                if (studentMap.has(grKey)) {
                    const existing = studentMap.get(grKey);
                    const hasId = (s) => (s.aadharNo || s.govId || s.aadhar || s.aadharNumber);
                    if (hasId(incoming) && !hasId(existing)) studentMap.set(grKey, incoming);
                    const base = studentMap.get(grKey);
                    const other = (base === incoming) ? existing : incoming;
                    Object.keys(other).forEach(key => {
                        if ((base[key] === undefined || base[key] === '' || base[key] === null) && other[key]) base[key] = other[key];
                    });
                    if (base.aadharNumber && !base.aadharNo) base.aadharNo = base.aadharNumber;
                    if (base.gr_no && !base.grNo) base.grNo = base.gr_no;
                    studentMap.set(grKey, base);
                } else {
                    const s = { ...incoming };
                    if (s.aadharNumber && !s.aadharNo) s.aadharNo = s.aadharNumber;
                    if (s.gr_no && !s.grNo) s.grNo = s.gr_no;
                    studentMap.set(grKey, s);
                }
                if (++count % 500 === 0) await yieldToMain();
            }

            console.log(`importAllData: Deduplicated to ${studentMap.size} unique students.`);

            const entries = Array.from(studentMap.values());
            for (let i = 0; i < entries.length; i += 50) {
                const chunk = entries.slice(i, i + 50);
                const tx = db.transaction('students', 'readwrite');
                for (const student of chunk) {
                    try {
                        // Remove invalid id — let IndexedDB autoIncrement assign one
                        if (student.id === undefined || student.id === null || student.id === '') {
                            delete student.id;
                        }
                        // Skip students without grNo
                        if (!student.grNo || typeof student.grNo !== 'string') {
                            console.warn('importAllData: Skipping student without valid grNo:', student.name || 'unknown');
                            continue;
                        }
                        const existingInDbIdx = tx.store.index('grNo');
                        const existingInDb = await existingInDbIdx.get(student.grNo);
                        if (existingInDb) {
                            student.id = existingInDb.id;
                            Object.keys(existingInDb).forEach(key => {
                                if ((student[key] === undefined || student[key] === '' || student[key] === null) && existingInDb[key]) student[key] = existingInDb[key];
                            });
                        }
                        await tx.store.put(student);
                    } catch (e) {
                        console.warn('importAllData: Student put failed:', student.grNo || 'no-grNo', e.message);
                    }
                }
                await tx.done;
                await yieldToMain();
                console.log(`importAllData: Processed ${i + chunk.length}/${entries.length} students...`);
            }
        }

        if (data.standards) {
            const tx = db.transaction('standards', 'readwrite');
            for (const item of data.standards) {
                if (!item.id) { console.warn('importAllData: Skipping standard with no id:', item); continue; }
                try { await tx.store.put(item); } catch (e) { console.warn('importAllData: Standard import error:', e.message); }
            }
            await tx.done;
        }

        if (data.customFields) {
            const tx = db.transaction('customFields', 'readwrite');
            for (const item of data.customFields) {
                try { await tx.store.put(item); } catch (e) { console.warn('importAllData: CustomField import error:', e.message); }
            }
            await tx.done;
        }
    } finally {
        resumeNotifications();
        notifyChanges('all');
    }

    // ── Post-import: reconcile school_profile from individual keys ──
    // Handles JSON backups made before the school_profile unification
    try {
        const dbConn = await initDB();
        const tx = dbConn.transaction('settings', 'readwrite');
        const schoolProfile = await tx.store.get('school_profile');
        const schoolName = await tx.store.get('schoolName');
        const schoolEmail = await tx.store.get('schoolEmail');
        const schoolContact = await tx.store.get('schoolContact');
        const schoolLogo = await tx.store.get('schoolLogo');

        const existing = schoolProfile?.value || {};
        const needsUpdate = (
            (schoolName?.value && !existing.schoolName) ||
            (schoolEmail?.value && !existing.schoolEmail) ||
            (schoolContact?.value && !existing.schoolContact) ||
            (schoolLogo?.value && !existing.schoolLogo)
        );

        if (needsUpdate) {
            const unified = {
                ...existing,
                schoolName: existing.schoolName || schoolName?.value || '',
                schoolEmail: existing.schoolEmail || schoolEmail?.value || '',
                schoolContact: existing.schoolContact || schoolContact?.value || '',
                schoolLogo: existing.schoolLogo || schoolLogo?.value || '',
                updatedAt: new Date().toISOString()
            };
            await tx.store.put({ key: 'school_profile', value: unified, updatedAt: new Date().toISOString() });
            console.log('importAllData: Reconciled school_profile from individual keys');
        }
        await tx.done;
    } catch (e) {
        console.warn('importAllData: school_profile reconciliation error:', e.message);
    }

    console.log('importAllData: COMPLETE');

    // Notify UI hooks to refresh — critical for auto-restore on login
    try {
        const { default: AppBus, APP_EVENTS } = await import('../core/AppBus.js');
        if (data.students?.length > 0) {
            AppBus.emit(APP_EVENTS.STUDENT_IMPORTED, { count: data.students.length });
        }
        if (data.settings?.length > 0) {
            AppBus.emit(APP_EVENTS.SETTINGS_CHANGED, {});
        }
    } catch (e) { /* AppBus not available */ }

    return true;
}

// Alias for importAllData
export const importData = importAllData;

// Aliases for cloud backup service
export const getAllStudentsForBackup = getAllStudents;
export const getAllLedgerEntries = getLedger;

// Verification Utilities for Login
export async function verifyStudent(grNo, govId, schoolCodeArg) {
    const db = await initDB();

    // Helper: clean string for fuzzy matching (removes spaces, dashes, lowercases)
    const cleanStr = (s) => String(s || '').replace(/[\s-]/g, '').toLowerCase().trim();

    // Smart GR variations
    const cleanGr = normalizeId(grNo);
    const numGr = parseInt(cleanGr, 10);

    // 1. LOCAL IndexedDB lookup (fast path)
    const index = db.transaction('students').store.index('grNo');
    let student = await index.get(cleanGr);

    if (!student && !isNaN(numGr)) {
        student = await index.get(String(numGr)); // Try standard string
    }

    // 2. LIVE FIRESTORE FALLBACK (if local didn't find anything)
    if (!student) {
        console.log('Local verification failed. Trying Live Firestore with Smart Query...');
        try {
            const { getFirestore, collection, query, where, getDocs, limit } = await import('firebase/firestore');
            const { isFirebaseConfigured } = await import('../config/firebase');

            if (isFirebaseConfigured) {
                const firestore = getFirestore();
                const schoolProfile = await getSetting('school_profile');
                const searchCode = String(schoolCodeArg || schoolProfile?.udiseNumber || schoolProfile?.schoolCode || schoolProfile?.indexNumber || '').trim();

                if (searchCode) {
                    console.log('Verifying with School Code:', searchCode);

                    // 2a. Resolve School UID from Code
                    let targetSchoolUid = null;

                    if (schoolProfile?.id && schoolProfile?.id.length > 20) {
                        targetSchoolUid = schoolProfile.id;
                    }

                    if (!targetSchoolUid) {
                        const schoolsRef = collection(firestore, 'schools');

                        // Try UDISE
                        let q = query(schoolsRef, where('udiseNumber', '==', searchCode), limit(1));
                        let snap = await getDocs(q);

                        // Try Index Number
                        if (snap.empty) {
                            q = query(schoolsRef, where('indexNumber', '==', searchCode), limit(1));
                            snap = await getDocs(q);
                        }

                        // Try schoolCode field
                        if (snap.empty) {
                            q = query(schoolsRef, where('schoolCode', '==', searchCode), limit(1));
                            snap = await getDocs(q);
                        }

                        // Try direct document ID
                        if (snap.empty) {
                            const { getDoc, doc } = await import('firebase/firestore');
                            const directDoc = await getDoc(doc(firestore, 'schools', searchCode));
                            if (directDoc.exists()) targetSchoolUid = directDoc.id;
                        } else {
                            targetSchoolUid = snap.docs[0].id;
                        }

                        if (targetSchoolUid) {
                            console.log(`School resolved: code "${searchCode}" -> UID "${targetSchoolUid}"`);
                        }
                    }

                    // 2b. Query students with multiple GR variations
                    if (targetSchoolUid) {
                        console.log('Found School UID:', targetSchoolUid);
                        const studentsRef = collection(firestore, `schools/${targetSchoolUid}/students`);

                        // Fire multiple queries in parallel for robustness
                        const queries = [];
                        queries.push(query(studentsRef, where("grNo", "==", grNo), limit(1)));

                        if (!isNaN(numGr)) {
                            queries.push(query(studentsRef, where("grNo", "==", numGr), limit(1)));
                            queries.push(query(studentsRef, where("grNo", "==", String(numGr)), limit(1)));
                        }

                        const snapshots = await Promise.all(queries.map(q => getDocs(q)));

                        for (const snap of snapshots) {
                            if (!snap.empty) {
                                const doc = snap.docs[0];
                                student = { ...doc.data(), id: doc.id };
                                console.log('Student found in Live Firestore via Smart Match:', student.name);
                                break;
                            }
                        }

                        if (!student) console.log('School found, but Student GR not found with any variation.');
                    } else {
                        console.warn('No registered school found with code:', searchCode);
                    }
                }
            }
        } catch (err) {
            console.warn('Live Firestore verification failed:', err);
        }
    }

    // 3. If student still not found, return error
    if (!student) return { success: false, error: `Student with GR No "${grNo}" not found.` };

    // 4. FUZZY IDENTITY VERIFICATION - MULTI-ID CATCH SYSTEM
    const inputVal = normalizeId(govId);

    const proofFields = [
        'aadharNo', 'aadharNumber', 'aadhar',
        'govId', 'governmentId', 'sssmId', 'sssm_id',
        'email', 'mobile', 'contactNumber', 'phone',
        'panCard', 'panNo', 'voterId', 'passportNo'
    ];

    const proofMatch = proofFields.some(field => {
        if (!student[field]) return false;
        const storedVal = normalizeId(student[field]);
        return storedVal && storedVal === inputVal;
    });

    if (proofMatch) {
        return { success: true, data: student };
    }

    // Last resort: Check any field for a match
    const secondaryMatch = Object.keys(student).some(key => {
        if (typeof student[key] !== 'string' && typeof student[key] !== 'number') return false;
        return normalizeId(student[key]) === inputVal;
    });

    if (secondaryMatch) {
        return { success: true, data: student };
    }

    return { success: false, error: 'Verification credentials mismatch.' };
}

export async function verifyTeacher(teacherCode, govId) {
    const teachers = await getSetting('school_teachers_list') || [];

    const teacher = teachers.find(t => {
        const data = t.data || {};
        return (
            String(data.teacherCode).trim() === String(teacherCode).trim() &&
            String(data.govId).trim() === String(govId).trim()
        );
    });

    return teacher ? { success: true, data: teacher } : null;
}


// Aliases for compatibility
export const saveStudent = (student) => (student.id ? updateStudent(student.id, student) : addStudent(student));
export const updateSetting = setSetting;
export const saveSetting = setSetting;
