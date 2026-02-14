
(async () => {
    console.log("--- STARTING BROWSER DEBUG --");

    // 1. Get Firebase methods from the loaded bundle (if exposed) or import dynamically
    // In Vite dev mode, we can try importing from the source path
    try {
        const { getFirestore, collection, query, where, getDocs } = await import('/node_modules/.vite/deps/firebase_firestore.js?v=a49e475d');
        // Note: The version query param might change, better to import from the file path if Vite allows
        // Or better: Use the app's internal modules if we can access them.

        // Actually, let's try to import using the same path the app uses
        const dbModule = await import('/src/services/database.js');
        const db = await import('/src/config/firebase.js'); // This has the app instance

        // Access firestore instance
        // db.db is likely the firestore instance if exported, let's check config/firebase.js exports
        // It exports 'db' and 'auth'.

        const firestore = db.db;
        const SCHOOL_CODE = "24141010601";
        const GR_NO = "6605";

        console.log(`Checking School: ${SCHOOL_CODE}`);

        // 1. Find School
        const schoolsRef = collection(firestore, "schools");
        const qUdise = query(schoolsRef, where("udiseNumber", "==", SCHOOL_CODE));
        const snap = await getDocs(qUdise);

        let schoolId = null;
        if (!snap.empty) {
            schoolId = snap.docs[0].id;
            console.log(`FOUND SCHOOL! ID: ${schoolId}, Data:`, snap.docs[0].data());
        } else {
            // Try index number
            const qIndex = query(schoolsRef, where("indexNumber", "==", SCHOOL_CODE));
            const snapIndex = await getDocs(qIndex);
            if (!snapIndex.empty) {
                schoolId = snapIndex.docs[0].id;
                console.log(`FOUND SCHOOL via Index! ID: ${schoolId}`);
            } else {
                console.error("SCHOOL NOT FOUND by Code");
                return "School Not Found";
            }
        }

        // 2. Find Student - DEBUG LISTING
        if (schoolId) {
            console.log(`Checking Students for School ID: ${schoolId}`);
            const studentsRef = collection(firestore, `schools/${schoolId}/students`);

            // LIST ALL STUDENTS (Limit 5) to see what is there
            console.log("Listing first 5 students to debug structure...");
            const qAll = query(studentsRef, apiLimit(5)); // Need to import limit or just get all if small
            // Let's just use getDocs on the collection if we can, or query with no where
            // But we need 'limit' from firestore module.
            // Let's assume we can just get the first few docs from a simple getDocs(studentsRef) if it's not huge.
            // Safe way: just try to get docs.

            const snapAll = await getDocs(studentsRef);
            console.log(`Total Students Found: ${snapAll.size}`);

            if (snapAll.empty) {
                console.warn("NO STUDENTS FOUND IN THIS SCHOOL COLLECTION!");
                return "Collection Empty";
            }

            snapAll.docs.slice(0, 5).forEach(doc => {
                console.log(`ID: ${doc.id}, Data:`, doc.data());
            });

            // Try String GR
            const qGr = query(studentsRef, where("grNo", "==", String(GR_NO)));
            const snapGr = await getDocs(qGr);

            if (!snapGr.empty) {
                console.log("FOUND STUDENT (String GR):", snapGr.docs[0].data());
                return "Student Found (String)";
            }

            // Try Number GR
            const qGrNum = query(studentsRef, where("grNo", "==", Number(GR_NO)));
            const snapGrNum = await getDocs(qGrNum);
            if (!snapGrNum.empty) {
                console.log("FOUND STUDENT (Number GR):", snapGrNum.docs[0].data());
                return "Student Found (Number)";
            }

            console.error("STUDENT NOT FOUND in sub-collection");
            return "Student Not Found";
        }

    } catch (e) {
        console.error("Debug Script Error:", e);
        return "Script Error: " + e.message;
    }
})();
