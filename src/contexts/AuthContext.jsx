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
import AppBus, { APP_EVENTS } from '../core/AppBus.js';

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

                // Robustness: If local profile is missing or incomplete, fetch from Firestore
                // This ensures roles persist across devices or after cache clear
                if ((!userProfile || !userProfile.role) && isFirebaseConfigured) {
                    try {
                        console.log('Auth: Fetching user profile from Firestore...');
                        const { getFirestore, doc, getDoc } = await import('firebase/firestore');
                        const db = getFirestore();
                        const docSnap = await getDoc(doc(db, 'users', firebaseUser.uid));
                        if (docSnap.exists()) {
                            const cloudData = docSnap.data();
                            userProfile = { ...userProfile, ...cloudData };
                            // Update local cache
                            localStorage.setItem(`user_profile_${firebaseUser.uid}`, JSON.stringify(userProfile));

                            // TRIGGER BACKGROUND MIGRATION TO SOVEREIGN V2 (only once per user)
                            const migrationKey = `sovereign_migrated_v2_${firebaseUser.uid}`;
                            if (!localStorage.getItem(migrationKey)) {
                                (async () => {
                                    try {
                                        const { SovereignBridge } = await import('../core/v2/Bridge.js');
                                        console.log('Sovereign: Starting one-time background migration...');
                                        // Use forceSync which properly iterates students + settings individually
                                        const result = await SovereignBridge.forceSync();
                                        console.log('Sovereign: Migration complete:', result);
                                        if (result && result.synced > 0) {
                                            localStorage.setItem(migrationKey, Date.now().toString());
                                        }
                                    } catch (e) {
                                        console.warn('Sovereign: Background migration failed', e);
                                    }
                                })();
                            }
                        }
                    } catch (error) {
                        console.error('Auth: Failed to fetch user profile from cloud:', error);
                    }
                }

                const enrichedUser = { ...firebaseUser, ...userProfile, isAdmin };
                setUser(enrichedUser);

                // Broadcast login to all features via AppBus
                AppBus.emit(APP_EVENTS.USER_LOGGED_IN, { user: enrichedUser });

                // Wire auto-backup: any data save event triggers a queued backup
                (async () => {
                    try {
                        const RegistryMod = await import('../core/FeatureRegistry.js');
                        const { queueBackup } = await import('../services/BackupSandbox.js');
                        RegistryMod.default.setAutoBackupHandler(() => queueBackup(enrichedUser).catch(console.warn));
                    } catch (e) {
                        console.warn('[AuthContext] Auto-backup wiring skipped:', e.message);
                    }
                })();

                // Auto-sync on login: only restore if local is empty, then push local to cloud
                (async () => {
                    try {
                        const { restoreFromCloud, syncToCloud } = await import('../services/DirectBackupService.js');
                        const { getAllStudents } = await import('../services/database.js');

                        // Only restore from cloud if local has NO students
                        const localStudents = await getAllStudents();
                        if (localStudents.length === 0) {
                            console.log('🔄 Auto-sync: Local empty, pulling cloud data...');
                            const result = await restoreFromCloud(enrichedUser.uid);
                            if (result.found) {
                                console.log(`🔄 Auto-sync: Restored ${result.students} students from cloud`);
                            } else {
                                console.log('🔄 Auto-sync: No cloud data found');
                            }
                        } else {
                            console.log(`🔄 Auto-sync: Local has ${localStudents.length} students, skipping cloud restore`);
                        }

                        // Push local → cloud after a delay (captures any local-only data)
                        setTimeout(async () => {
                            try {
                                const currentStudents = await getAllStudents();
                                if (currentStudents.length > 0) {
                                    console.log('🔄 Auto-sync: Pushing local data to cloud...');
                                    const syncResult = await syncToCloud(enrichedUser.uid);
                                    console.log(`🔄 Auto-sync: Pushed ${syncResult.students} students (AES-256-GCM encrypted)`);
                                } else {
                                    console.log('🔄 Auto-sync: No local data to push');
                                }
                            } catch (e) {
                                console.warn('🔄 Auto-sync: Push failed (will retry on data change):', e.message);
                            }
                        }, 10000);
                    } catch (e) {
                        console.warn('[AuthContext] Auto-sync skipped:', e.message);
                    }
                })();
            } else {
                setUser(null);
                AppBus.emit(APP_EVENTS.USER_LOGGED_OUT, {});
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
                role: null, // Explicitly null to trigger selection wizard
                isVerified: false,
                schoolCode: additionalData.schoolCode || '',
                createdAt: new Date().toISOString(),
                ...additionalData
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
    // AI-POWERED SMART MAPPING: Handles missing local profiles, type mismatches, fuzzy codes
    const verifyUserCredentials = useCallback(async (role, id1, id2, schoolCode) => {
        try {
            const db = await import('../services/database');

            // Helper: normalize a code for comparison (trim, lowercase, strip leading zeros for numbers)
            const normalizeCode = (c) => {
                const s = String(c || '').trim().toLowerCase();
                // If it's purely numeric, strip leading zeros for comparison
                const num = parseInt(s, 10);
                if (!isNaN(num) && String(num) === s.replace(/^0+/, '')) return String(num);
                return s;
            };

            // 0. Smart School Code Check
            // We DON'T block here anymore. Instead, we do a best-effort local check
            // and always allow the call to proceed to verifyStudent (which has Firestore fallback)
            const schoolProfile = await db.getSetting('school_profile');
            const inputCode = normalizeCode(schoolCode);

            console.log('Login Debug: Profile:', schoolProfile ? 'EXISTS' : 'MISSING', '| Input Code:', inputCode);

            let localCodeMatch = false;

            if (schoolProfile) {
                const storedUdise = normalizeCode(schoolProfile.udiseNumber);
                const storedIndex = normalizeCode(schoolProfile.indexNumber);
                const storedCode = normalizeCode(schoolProfile.schoolCode);

                console.log(`Login Debug: Comparing "${inputCode}" vs UDISE="${storedUdise}", Index="${storedIndex}", Code="${storedCode}"`);

                localCodeMatch = (
                    (storedUdise && inputCode === storedUdise) ||
                    (storedIndex && inputCode === storedIndex) ||
                    (storedCode && inputCode === storedCode)
                );

                if (!localCodeMatch) {
                    console.log('Login Debug: Local code mismatch, but proceeding to remote verification...');
                    // DON'T BLOCK HERE - let verifyStudent try Firestore
                }
            } else {
                console.log('Login Debug: No local school_profile found. Will rely on remote Firestore lookup.');
            }

            // ALWAYS proceed to verification (local OR remote)
            if (role === 'student') {
                console.log(`AuthContext: Verifying Student -> GR: ${id1}, ID: ${id2}, SchoolCode: ${schoolCode}`);
                const result = await db.verifyStudent(id1, id2, schoolCode);

                if (result && result.success) {
                    return { success: true, data: result.data };
                } else if (result && result.error) {
                    return { success: false, error: result.error };
                }
            } else if (role === 'teacher') {
                const teacher = await db.verifyTeacher(id1, id2);
                if (teacher && teacher.success) return { success: true, data: teacher.data };
            }

            return { success: false, error: 'Record not found. Please check your GR Number, School Code, and ID carefully. Ask your HOI if the issue persists.' };
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
        setError,
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
