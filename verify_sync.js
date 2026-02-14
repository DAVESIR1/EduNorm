import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import dotenv from 'dotenv';

dotenv.config();

const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkSchool() {
    const schoolCode = '24141010601';
    console.log(`Checking for School Code: ${schoolCode}...`);

    try {
        const docRef = doc(db, 'schools', schoolCode);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            console.log('✅ SUCCESS! School Folder Found.');
            console.log('Data:', docSnap.data());
        } else {
            console.log('❌ NOT FOUND. The folder/document does not exist yet.');
        }
    } catch (error) {
        console.error('Error checking Firestore:', error);
    }
    process.exit();
}

checkSchool();
