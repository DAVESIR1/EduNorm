import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Helper to support both Vite and Node environments
const getEnv = (key) => {
    try {
        return import.meta.env[key] || (typeof process !== 'undefined' ? process.env[key] : undefined);
    } catch (e) {
        return typeof process !== 'undefined' ? process.env[key] : undefined;
    }
};

// Firebase configuration from environment variables
const firebaseConfig = {
    apiKey: getEnv('VITE_FIREBASE_API_KEY') || '',
    authDomain: getEnv('VITE_FIREBASE_AUTH_DOMAIN') || '',
    projectId: getEnv('VITE_FIREBASE_PROJECT_ID') || '',
    storageBucket: getEnv('VITE_FIREBASE_STORAGE_BUCKET') || '',
    messagingSenderId: getEnv('VITE_FIREBASE_MESSAGING_SENDER_ID') || '',
    appId: getEnv('VITE_FIREBASE_APP_ID') || '',
    measurementId: getEnv('VITE_FIREBASE_MEASUREMENT_ID') || ''
};

// Check if Firebase is properly configured
export const isFirebaseConfigured = Boolean(
    firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    firebaseConfig.appId
);

// Initialize Firebase only if configured
let app = null;
let auth = null;
let db = null;
let googleProvider = null;

if (isFirebaseConfigured) {
    try {
        app = initializeApp(firebaseConfig);
        auth = getAuth(app);
        db = getFirestore(app);
        googleProvider = new GoogleAuthProvider();
        googleProvider.setCustomParameters({
            prompt: 'select_account'
        });
        console.log('Firebase initialized successfully');
    } catch (error) {
        console.error('Firebase initialization failed:', error);
    }
} else {
    console.warn('Firebase not configured - cloud features disabled');
}

export { auth, db, googleProvider };
export default app;
