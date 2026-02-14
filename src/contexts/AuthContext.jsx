import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import {
    onAuthStateChanged,
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signInWithPopup,
    signInWithPhoneNumber,
    RecaptchaVerifier,
    signOut
} from 'firebase/auth';
import { auth, googleProvider, isFirebaseConfigured } from '../config/firebase';
import { logSecurityEvent } from '../services/SecurityManager';

const AuthContext = createContext(null);

// Admin credentials
const ADMIN_EMAIL = 'baraiyanitin220@gmail.com';
const ADMIN_PHONE = '+919737970647';

// Helper function to get user-friendly error messages
const getErrorMessage = (errorCode) => {
    const errorMessages = {
        'auth/email-already-in-use': 'This email is already registered. Please login instead.',
        'auth/invalid-email': 'Please enter a valid email address.',
        'auth/weak-password': 'Password should be at least 6 characters.',
        'auth/user-not-found': 'No account found with this email.',
        'auth/wrong-password': 'Incorrect password. Please try again.',
        'auth/too-many-requests': 'Too many attempts. Please try again later.',
        'auth/popup-closed-by-user': 'Sign-in popup was closed. Please try again.',
        'auth/invalid-phone-number': 'Please enter a valid phone number.',
        'auth/invalid-verification-code': 'Invalid OTP code. Please try again.',
        'auth/code-expired': 'OTP has expired. Please request a new one.',
        'firebase-not-configured': 'Cloud features not available. Running in offline mode.'
    };
    return errorMessages[errorCode] || 'An error occurred. Please try again.';
};

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [confirmationResult, setConfirmationResult] = useState(null);
    const [offlineMode, setOfflineMode] = useState(!isFirebaseConfigured);

    // Listen for auth state changes (only if Firebase is configured)
    useEffect(() => {
        if (!isFirebaseConfigured || !auth) {
            console.warn('Firebase not configured - cloud features disabled');
            setLoading(false);
            setOfflineMode(true);
            return;
        }

        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                // Add admin flag
                const isAdmin = firebaseUser.email === ADMIN_EMAIL ||
                    firebaseUser.phoneNumber === ADMIN_PHONE;

                // Fetch extra profile data
                let userProfile = {};
                const localProfile = localStorage.getItem(`user_profile_${firebaseUser.uid}`);
                if (localProfile) {
                    userProfile = JSON.parse(localProfile);
                }
                // Note: We could fetch from Firestore here too, but for speed we rely on local first
                // A separate sync effect could update local from cloud if needed

                setUser({ ...firebaseUser, ...userProfile, isAdmin });
            } else {
                setUser(null);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    // Clear error after 5 seconds
    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => setError(null), 5000);
            return () => clearTimeout(timer);
        }
    }, [error]);

    // Email + Password Registration
    const registerWithEmail = useCallback(async (email, password, additionalData = {}) => {
        if (!isFirebaseConfigured || !auth) {
            setError(getErrorMessage('firebase-not-configured'));
            return { success: false, error: 'Firebase not configured' };
        }
        try {
            setError(null);
            const result = await createUserWithEmailAndPassword(auth, email, password);
            const user = result.user;

            // Prepare user profile data
            const userProfile = {
                uid: user.uid,
                email: user.email,
                role: additionalData.role || 'student', // Default to student
                rollNo: additionalData.rollNo || '',
                mobile: additionalData.mobile || '',
                schoolCode: additionalData.schoolCode || '',
                createdAt: new Date().toISOString()
            };

            // Save to Firestore (if configured)
            if (isFirebaseConfigured) {
                try {
                    const { getFirestore, doc, setDoc } = await import('firebase/firestore');
                    const db = getFirestore();
                    await setDoc(doc(db, 'users', user.uid), userProfile);
                } catch (fsError) {
                    console.error('Error saving user profile to Firestore:', fsError);
                }
            }

            // TRIGGER AUTOMATIC MEGA BACKUP (Admin Safety Plan)
            // This runs in background to create an initial "School Registered" snapshot
            try {
                const { uploadToMega } = await import('../services/MegaBackupService');
                const initialBackupData = {
                    metadata: { type: 'registration_snapshot', timestamp: Date.now() },
                    schoolCode: additionalData.schoolCode || 'unknown',
                    users: [userProfile] // Initial user
                };
                console.log('Admin Backup: Initiating automatic Mega safety backup...');
                uploadToMega(initialBackupData, `Registered_${additionalData.schoolCode || 'School'}`, user.uid)
                    .then(res => console.log('Admin Backup: Success', res.path))
                    .catch(err => console.error('Admin Backup: Failed', err));
            } catch (backupErr) {
                console.warn('Admin Backup: Module load failed', backupErr);
            }

            // Save to LocalStorage for offline/quick access
            localStorage.setItem(`user_profile_${user.uid}`, JSON.stringify(userProfile));

            // Update local state immediately
            setUser({ ...user, ...userProfile });
            return { success: true, user: { ...user, ...userProfile } };

        } catch (error) {
            setError(getErrorMessage(error.code));
            return { success: false, error: error.message };
        }
    }, [auth]);

    // Offline Login
    const loginOffline = useCallback(() => {
        setUser({
            uid: 'offline-user',
            email: 'offline@local',
            displayName: 'Offline User',
            role: 'hoi', // Default to HOI for offline mode to access everything
            isAdmin: true,
            isOffline: true
        });
        return { success: true };
    }, []);

    // Verify Credentials (for Student/Teacher restricted login)
    const verifyUserCredentials = useCallback(async (role, id1, id2, schoolCode) => {
        try {
            // Dynamically import database service to avoid circular deps if any
            const db = await import('../services/database');

            // 0. Verify School Code (Context Check)
            const schoolProfile = await db.getSetting('school_profile');
            console.log('Login Debug: Profile:', schoolProfile, 'Input Code:', schoolCode);

            if (schoolProfile) {
                const storedUdise = String(schoolProfile.udiseNumber || '').trim().toLowerCase();
                const storedIndex = String(schoolProfile.indexNumber || '').trim().toLowerCase();
                const inputCode = String(schoolCode || '').trim().toLowerCase();

                if (inputCode !== storedUdise && inputCode !== storedIndex) {
                    return {
                        success: false,
                        error: `School Code "${schoolCode}" does not match records (UDISE: ${storedUdise || 'Not Set'}, Index: ${storedIndex || 'Not Set'}).`
                    };
                }
            } else if (!schoolCode) {
                // Block ONLY if neither local profile nor input code is present
                return { success: false, error: 'School Profile not configured. Please enter School Code.' };
            }
            // If profile missing but schoolCode is present, we proceed to remote verifyStudent
            console.log('Login Debug: Proceeding with School Code:', schoolCode);

            if (role === 'student') {
                // id1 = GR No, id2 = Gov ID/Email/Mobile
                // PASS schoolCode to DB service for remote lookup
                const result = await db.verifyStudent(id1, id2, schoolCode);
                if (result && result.success) {
                    return { success: true, data: result.data };
                } else if (result && result.error) {
                    return { success: false, error: result.error };
                }
            } else if (role === 'teacher') {
                // id1 = Teacher Code, id2 = Gov ID
                const teacher = await db.verifyTeacher(id1, id2);
                if (teacher) return { success: true, data: teacher };
            }
            return { success: false, error: 'Record not found. Please ask your Head of Institute (HOI) to register your data first.' };
        } catch (error) {
            console.error('Verification failed:', error);
            return { success: false, error: 'Verification failed: ' + error.message };
        }
    }, []);

    // Email + Password Login
    const loginWithEmail = useCallback(async (email, password) => {
        if (!isFirebaseConfigured || !auth) {
            setError(getErrorMessage('firebase-not-configured'));
            return { success: false, error: 'Firebase not configured' };
        }
        try {
            setError(null);
            const result = await signInWithEmailAndPassword(auth, email, password);
            const user = result.user;

            // Fetch user profile
            let userProfile = {};
            const localProfile = localStorage.getItem(`user_profile_${user.uid}`);

            if (localProfile) {
                userProfile = JSON.parse(localProfile);
            } else if (isFirebaseConfigured) {
                try {
                    const { getFirestore, doc, getDoc } = await import('firebase/firestore');
                    const db = getFirestore();
                    const docSnap = await getDoc(doc(db, 'users', user.uid));
                    if (docSnap.exists()) {
                        userProfile = docSnap.data();
                        localStorage.setItem(`user_profile_${user.uid}`, JSON.stringify(userProfile));
                    }
                } catch (fsError) {
                    console.error('Error fetching user profile:', fsError);
                }
            }

            logSecurityEvent('login', { method: 'email', email });
            setUser({ ...user, ...userProfile });
            return { success: true, user: { ...user, ...userProfile } };
        } catch (err) {
            logSecurityEvent('login_failed', { method: 'email', email, error: err.code });
            const message = getErrorMessage(err.code);
            setError(message);
            return { success: false, error: message };
        }
    }, []);

    // Google Sign-in
    const loginWithGoogle = useCallback(async () => {
        if (!isFirebaseConfigured || !auth) {
            setError(getErrorMessage('firebase-not-configured'));
            return { success: false, error: 'Firebase not configured' };
        }
        try {
            setError(null);
            const result = await signInWithPopup(auth, googleProvider);
            logSecurityEvent('login', { method: 'google', email: result.user?.email });
            return { success: true, user: result.user };
        } catch (err) {
            const message = getErrorMessage(err.code);
            setError(message);
            return { success: false, error: message };
        }
    }, []);

    // Setup Recaptcha for phone auth
    const setupRecaptcha = useCallback((containerId) => {
        if (!isFirebaseConfigured || !auth) return null;
        if (!window.recaptchaVerifier) {
            window.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
                size: 'invisible',
                callback: () => { },
                'expired-callback': () => {
                    setError('reCAPTCHA expired. Please try again.');
                }
            });
        }
        return window.recaptchaVerifier;
    }, []);

    // Phone OTP - Send
    const sendPhoneOTP = useCallback(async (phoneNumber, recaptchaContainerId) => {
        if (!isFirebaseConfigured || !auth) {
            setError(getErrorMessage('firebase-not-configured'));
            return { success: false, error: 'Firebase not configured' };
        }
        try {
            setError(null);
            const appVerifier = setupRecaptcha(recaptchaContainerId);
            const confirmation = await signInWithPhoneNumber(auth, phoneNumber, appVerifier);
            setConfirmationResult(confirmation);
            return { success: true, message: 'OTP sent successfully!' };
        } catch (err) {
            // Reset recaptcha on error
            if (window.recaptchaVerifier) {
                window.recaptchaVerifier.clear();
                window.recaptchaVerifier = null;
            }
            const message = getErrorMessage(err.code);
            setError(message);
            return { success: false, error: message };
        }
    }, [setupRecaptcha]);

    // Verify Phone OTP (existing)
    const verifyPhoneOTP = useCallback(async (code) => {
        try {
            setError(null);
            if (!confirmationResult) {
                setError('Please request OTP first.');
                return { success: false, error: 'No OTP request found' };
            }
            const result = await confirmationResult.confirm(code);
            setConfirmationResult(null);
            return { success: true, user: result.user };
        } catch (err) {
            const message = getErrorMessage(err.code);
            setError(message);
            return { success: false, error: message };
        }
    }, [confirmationResult]);

    // Update User Profile (e.g. adding role after social login)
    const updateProfile = useCallback(async (updates) => {
        if (!user) return;

        try {
            const updatedUser = { ...user, ...updates };

            // 1. Update Firestore (Best effort)
            if (isFirebaseConfigured) {
                try {
                    const { getFirestore, doc, setDoc } = await import('firebase/firestore');
                    const db = getFirestore();
                    await setDoc(doc(db, 'users', user.uid), updates, { merge: true });
                } catch (fsError) {
                    console.warn('Firestore update failed (likely permission issue), falling back to local:', fsError);
                    // Continue to local update - don't block user
                }
            }

            // 2. Update LocalStorage
            const storedProfile = localStorage.getItem(`user_profile_${user.uid}`);
            const newProfile = storedProfile ? { ...JSON.parse(storedProfile), ...updates } : updates;
            localStorage.setItem(`user_profile_${user.uid}`, JSON.stringify(newProfile));

            // 3. Update State
            setUser(updatedUser);
            return { success: true };
        } catch (err) {
            console.error('Update profile failed:', err);
            return { success: false, error: err.message };
        }
    }, [user]);

    // Logout
    const logout = useCallback(async () => {
        if (offlineMode) {
            setUser(null);
            return { success: true };
        }
        try {
            await signOut(auth);
            logSecurityEvent('logout');
            return { success: true };
        } catch (err) {
            setError('Failed to logout. Please try again.');
            return { success: false, error: err.message };
        }
    }, [offlineMode]);

    const value = {
        user,
        loading,
        error,
        offlineMode,
        isAuthenticated: !!user,
        isFirebaseConfigured,
        registerWithEmail,
        loginWithEmail,
        loginWithGoogle,
        loginOffline,
        verifyUserCredentials,
        sendPhoneOTP,
        verifyPhoneOTP,
        updateProfile,
        logout,
        clearError: () => setError(null)
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

export default AuthContext;
