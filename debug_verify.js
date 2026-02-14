
import { initializeApp } from "firebase/app";
import { getFirestore, collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
// We need to mock the config or read it from file, as we can't easily import from src/
const firebaseConfig = {
    apiKey: "AIzaSy...", // I don't have the key here easily.
    // ... 
};
// Wait, I can't put real keys here.
// I should use the admin SDK or try to read the file content and parse it.
// Let's read src/config/firebase.js first to see how it exports.


const SCHOOL_CODE = "24141010601";
const GR_NO = "6605";

async function genericDebug() {
    console.log(`--- DEBUGGING SCHOOL: ${SCHOOL_CODE} ---`);

    // 1. Find School ID from Code (since we don't know the exact Doc ID)
    const schoolsRef = collection(db, "schools");
    // Try querying by udiseNumber OR indexNumber
    const qUdise = query(schoolsRef, where("udiseNumber", "==", SCHOOL_CODE));
    const qIndex = query(schoolsRef, where("indexNumber", "==", SCHOOL_CODE));

    let schoolId = null;
    let schoolDoc = null;

    const snapUdise = await getDocs(qUdise);
    if (!snapUdise.empty) {
        schoolDoc = snapUdise.docs[0];
        schoolId = schoolDoc.id;
        console.log(`[SUCCESS] Found School via UDISE. ID: ${schoolId}`);
    } else {
        const snapIndex = await getDocs(qIndex);
        if (!snapIndex.empty) {
            schoolDoc = snapIndex.docs[0];
            schoolId = schoolDoc.id;
            console.log(`[SUCCESS] Found School via Index. ID: ${schoolId}`);
        } else {
            console.log(`[FAILURE] School with code ${SCHOOL_CODE} NOT FOUND in 'schools' collection.`);
            // Maybe the user meant the Doc ID is the code?
            const docRef = doc(db, "schools", SCHOOL_CODE);
            const snapDoc = await getDoc(docRef);
            if (snapDoc.exists()) {
                schoolId = SCHOOL_CODE;
                console.log(`[SUCCESS] Found School via Direct Doc ID.`);
            } else {
                console.log(`[FAILURE] School Doc ID '${SCHOOL_CODE}' does not exist.`);
                return;
            }
        }
    }

    if (!schoolId) return;

    // 2. Check Students Sub-collection
    console.log(`--- CHECKING STUDENTS FOR SCHOOL ID: ${schoolId} ---`);
    const studentsRef = collection(db, `schools/${schoolId}/students`);

    // Try String GR
    const qGrString = query(studentsRef, where("grNo", "==", String(GR_NO)));
    const snapGrString = await getDocs(qGrString);

    if (!snapGrString.empty) {
        console.log(`[SUCCESS] Found Student via String GR '${GR_NO}'. Data:`, snapGrString.docs[0].data());
    } else {
        console.log(`[INFO] GR String '${GR_NO}' not found.`);
        // Try Number GR
        const qGrNumber = query(studentsRef, where("grNo", "==", Number(GR_NO)));
        const snapGrNumber = await getDocs(qGrNumber);
        if (!snapGrNumber.empty) {
            console.log(`[SUCCESS] Found Student via Number GR ${GR_NO}. Data:`, snapGrNumber.docs[0].data());
        } else {
            console.log(`[FAILURE] Student GR '${GR_NO}' NOT FOUND in sub-collection.`);
        }
    }
}

genericDebug().catch(console.error);
