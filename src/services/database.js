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
        console.log('importAllData: Importing students...');
        // Log first 3 students to verify data
        data.students.slice(0, 3).forEach((s, i) => {
            console.log(`  Student ${i + 1}: ID=${s.id}, GR=${s.grNo}, Name="${s.name}"`);
        });

        const tx = db.transaction('students', 'readwrite');
        for (const item of data.students) {
            await tx.store.put(item);
        }
        await tx.done;
        console.log('importAllData: All students imported');
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
// Verification Utilities for Login
export async function verifyStudent(grNo, govId) {
    const db = await initDB();
    // 1. Try to find by GR No (Local Try both String and Number formats)
    const index = db.transaction('students').store.index('grNo');
    let student = await index.get(grNo);

    // If not found as-is, try converting type
    if (!student && !isNaN(grNo)) {
        student = await index.get(Number(grNo)); // Try number
    }
    if (!student) {
        student = await index.get(String(grNo)); // Try string
    }

    // --- LIVE FIRESTORE FALLBACK ---
    if (!student) {
        console.log('Local verification failed. Trying Live Firestore check...');
        try {
            const { getFirestore, collection, query, where, getDocs } = await import('firebase/firestore');
            const { isFirebaseConfigured } = await import('../config/firebase');

            if (isFirebaseConfigured) {
                const firestore = getFirestore();
                // We need the school ID to query students. 
                // However, at this point, we might only have the School Code from context.
                // Constraint: We can't easily query ALL schools for a GR No.
                // Solution: We must rely on the School Profile being actively set in the context 
                // OR passed down.
                // Assuming the school is set locally (which is the prerequisite for this function anyway).
                // OR passed down.
                // Assuming the school is set locally (which is the prerequisite for this function anyway).
                const schoolProfile = await getSetting('school_profile');

                // CRITICAL FIX: Use schoolCode/udise if ID is missing (Manual Entry case)
                const schoolId = schoolProfile?.id || schoolProfile?.schoolCode || schoolProfile?.udiseNumber || schoolProfile?.indexNumber;

                if (schoolId) {
                    const cleanSchoolId = String(schoolId).trim().replace(/[^a-zA-Z0-9]/g, '');
                    const studentsRef = collection(firestore, `schools/${cleanSchoolId}/students`);
                    // Try querying by GR No (string match usually)
                    const q = query(studentsRef, where("grNo", "==", String(grNo)));
                    const querySnapshot = await getDocs(q);

                    if (!querySnapshot.empty) {
                        const doc = querySnapshot.docs[0];
                        student = { ...doc.data(), id: doc.id };
                        console.log('Student found in Live Firestore:', student.name);
                    }
                }
            }
        } catch (err) {
            console.warn('Live Firestore verification failed:', err);
        }
    }
    // -------------------------------

    if (!student) return { success: false, error: `Student with GR No "${grNo}" not found.` };

    // 2. Verify Gov ID (flexible match against common fields)
    // ALLOW: Aadhar, GovID, SSSM ID, Email, or Mobile
    const inputVal = String(govId).trim().toLowerCase();

    const storedAadhar = student.aadharNo ? String(student.aadharNo).trim() : '';
    const storedGovId = student.govId ? String(student.govId).trim() : '';
    const storedSssm = student.sssmId ? String(student.sssmId).trim() : '';
    const storedEmail = student.email ? String(student.email).trim().toLowerCase() : '';
    const storedMobile = student.mobile ? String(student.mobile).trim() : '';

    const debugMsg = `Checking Student GR: ${grNo} | Input: "${inputVal}" | Stored: Aadhar=${storedAadhar}, GovID=${storedGovId}, Email=${storedEmail}, Mobile=${storedMobile}`;
    console.log(debugMsg);

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
    // Teachers are stored in settings currently
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
