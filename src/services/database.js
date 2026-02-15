import { openDB } from 'idb';

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
    return db.put('settings', { key, value, updatedAt: new Date().toISOString() });
}

export async function getAllSettings() {
    const db = await initDB();
    return db.getAll('settings');
}

// Sync Timestamp Management
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
    return updated;
}

export async function deleteStudent(id) {
    const db = await initDB();
    await db.delete('students', id);
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
    return db.put('standards', {
        ...standardData,
        createdAt: new Date().toISOString()
    });
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
    return db.put('standards', { ...existing, ...data, id });
}

export async function deleteStandard(id) {
    const db = await initDB();
    await db.delete('standards', id);
}

// Custom fields operations
export async function addCustomField(fieldData) {
    const db = await initDB();
    return db.add('customFields', {
        ...fieldData,
        createdAt: new Date().toISOString()
    });
}

export async function getAllCustomFields() {
    const db = await initDB();
    return db.getAll('customFields');
}

export async function updateCustomField(id, data) {
    const db = await initDB();
    const existing = await db.get('customFields', id);
    return db.put('customFields', { ...existing, ...data, id });
}

export async function deleteCustomField(id) {
    const db = await initDB();
    await db.delete('customFields', id);
}

// Document operations
export async function addDocument(docData) {
    const db = await initDB();
    return db.add('documents', {
        ...docData,
        uploadedAt: new Date().toISOString()
    });
}

export async function getDocumentsByStudent(studentId) {
    const db = await initDB();
    const index = db.transaction('documents').store.index('studentId');
    return index.getAll(studentId);
}

export async function deleteDocument(id) {
    const db = await initDB();
    await db.delete('documents', id);
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

    console.log('importAllData: Starting import with:', {
        settingsCount: data.settings?.length || 0,
        studentsCount: data.students?.length || 0,
        standardsCount: data.standards?.length || 0,
        customFieldsCount: data.customFields?.length || 0
    });

    if (data.settings) {
        const tx = db.transaction('settings', 'readwrite');
        for (const item of data.settings) {
            await tx.store.put(item);
        }
        await tx.done;
        console.log('importAllData: Settings imported');
    }

    if (data.students && data.students.length > 0) {
        console.log('importAllData: Importing students with Smart Merge...');

        // --- SMART MERGE & DEDUPLICATION ---
        const studentMap = new Map();

        // 1. Deduplicate INCOMING records first
        data.students.forEach(incoming => {
            if (!incoming.grNo) return; // Skip invalid records without GR
            const grKey = String(incoming.grNo).trim();

            if (studentMap.has(grKey)) {
                // Merge strategy: Prioritize info from the "better" record
                const existing = studentMap.get(grKey);

                // Helper to check if a record has valid ID
                const hasId = (s) => (s.aadharNo || s.govId || s.aadhar || s.aadharNumber);

                // If incoming has ID and existing doesn't, OVERWRITE existing with incoming
                if (hasId(incoming) && !hasId(existing)) {
                    studentMap.set(grKey, incoming);
                }
                // If both have ID, or neither, verify other fields (retain most complete)
                else if (!hasId(existing) && !hasId(incoming)) {
                    // Simple heuristic: keep the one with more keys
                    if (Object.keys(incoming).length > Object.keys(existing).length) {
                        studentMap.set(grKey, incoming);
                    }
                }
                // Else: Existing has ID, keep existing (or merge fields if needed, but for now assumption is one valid record exists)

                // MERGE MISSING FIELDS
                // Regardless of which "base" record we kept, fill in gaps from the "other" one
                const base = studentMap.get(grKey);
                const other = (base === incoming) ? existing : incoming;

                Object.keys(other).forEach(key => {
                    if ((base[key] === undefined || base[key] === '' || base[key] === null) && other[key]) {
                        base[key] = other[key];
                    }
                });
                // NORMALIZE FIELDS
                if (base.aadharNumber && !base.aadharNo) base.aadharNo = base.aadharNumber;
                if (base.gr_no && !base.grNo) base.grNo = base.gr_no;

                studentMap.set(grKey, base);

            } else {
                const s = { ...incoming };
                // NORMALIZE NEW RECORDS TOO
                if (s.aadharNumber && !s.aadharNo) s.aadharNo = s.aadharNumber;
                if (s.gr_no && !s.grNo) s.grNo = s.gr_no;
                studentMap.set(grKey, s);
            }
        });

        console.log(`importAllData: Deduplicated ${data.students.length} incoming records to ${studentMap.size} unique students.`);

        const tx = db.transaction('students', 'readwrite');
        // Clear existing? No, we merge/update. 
        // NOTE: If we want a full restore that matches backup exactly, we might want to clear. 
        // But for "Restore from File" on top of potential local data, update is safer.
        // However, user said "Restore", implying "Reset to this state".
        // Let's iterate and put.

        for (const student of studentMap.values()) {
            // Ensure ID is unique or handled. 
            // If we use 'put', and ID exists, it updates. 
            // But duplicate GR check might fail if IDs don't match existing DB.
            // Best approach for Restore: Look up by GR first in DB?
            // "importAllData" usually implies a bulk load. 
            // If IDs in backup conflict with IDs in DB but for DIFFERENT GRs, we have a mess.
            // SAFEST: Let IndexedDB auto-increment ID if not strictly required, OR strictly use GR as key.
            // But ID is keyPath.

            // To avoid ConstraintError on unique GR index:
            // Check if GR exists in DB.
            const existingInDbIdx = tx.store.index('grNo');
            const existingInDb = await existingInDbIdx.get(student.grNo);

            if (existingInDb) {
                // Update existing record, keeping its DB ID to avoid PK collision/change
                student.id = existingInDb.id;
            } else {
                // New record. If student.id is present, it might collide with another AUTO-INCREMENT.
                // It is safer to DELETE student.id and let DB assign a new one, unless we need to preserve IDs for relations.
                // For this app, relationships (like fees) likely use ID.
                // Assuming Backup preserves integrity.
                // IF we trust backup IDs, use them.
            }

            await tx.store.put(student);
        }
        await tx.done;
        console.log('importAllData: All students imported successfully.');
    }

    if (data.standards) {
        const tx = db.transaction('standards', 'readwrite');
        for (const item of data.standards) {
            await tx.store.put(item);
        }
        await tx.done;
        console.log('importAllData: Standards imported');
    }

    if (data.customFields) {
        const tx = db.transaction('customFields', 'readwrite');
        for (const item of data.customFields) {
            await tx.store.put(item);
        }
        await tx.done;
        console.log('importAllData: Custom fields imported');
    }

    console.log('importAllData: COMPLETE');
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
    const rawGr = String(grNo).trim();
    const numGr = parseInt(rawGr, 10);

    // 1. LOCAL IndexedDB lookup (fast path)
    const index = db.transaction('students').store.index('grNo');
    let student = await index.get(rawGr);

    if (!student && !isNaN(numGr)) {
        student = await index.get(numGr);           // Try as number
    }
    if (!student && !isNaN(numGr)) {
        student = await index.get(String(numGr));   // Try "1" when input was "01"
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
                        queries.push(query(studentsRef, where("grNo", "==", rawGr), limit(1)));

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

    // 4. FUZZY IDENTITY VERIFICATION
    // Handles all field name variants across local DB and Firestore
    const inputVal = cleanStr(govId);

    const storedAadhar = cleanStr(student.aadharNo || student.aadharNumber || student.aadhar);
    const storedGovId = cleanStr(student.govId);
    const storedSssm = cleanStr(student.sssmId || student.sssm_id);
    const storedEmail = cleanStr(student.email);
    const storedMobile = cleanStr(student.mobile || student.contactNumber || student.phone);
    const storedName = student.name || student.nameEnglish || '';

    console.log(`Smart Verify: GR=${grNo} | Name="${storedName}" | Input="${inputVal}" | Aadhar=${storedAadhar === inputVal}, Mobile=${storedMobile === inputVal}, GovId=${storedGovId === inputVal}, SSSM=${storedSssm === inputVal}, Email=${storedEmail === inputVal}`);

    if (
        (storedAadhar && storedAadhar === inputVal) ||
        (storedGovId && storedGovId === inputVal) ||
        (storedSssm && storedSssm === inputVal) ||
        (storedEmail && storedEmail === inputVal) ||
        (storedMobile && storedMobile === inputVal)
    ) {
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

