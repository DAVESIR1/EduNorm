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
            console.warn('Firebase not configured - running in offline mode');
            setLoading(false);
            setOfflineMode(true);
            // Create a local user for offline mode
            setUser({
                uid: 'offline-user',
                email: 'offline@local',
                displayName: 'Offline User',
                isAdmin: true, // Give admin access in offline mode
                isOffline: true
            });
            return;
        }

        const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
            if (firebaseUser) {
                // Add admin flag
                const isAdmin = firebaseUser.email === ADMIN_EMAIL ||
                    firebaseUser.phoneNumber === ADMIN_PHONE;
                setUser({ ...firebaseUser, isAdmin });
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
    const registerWithEmail = useCallback(async (email, password) => {
        if (!isFirebaseConfigured || !auth) {
            setError(getErrorMessage('firebase-not-configured'));
            return { success: false, error: 'Firebase not configured' };
        }
        try {
            setError(null);
            const result = await createUserWithEmailAndPassword(auth, email, password);
            return { success: true, user: result.user };
        } catch (err) {
            const message = getErrorMessage(err.code);
            setError(message);
            return { success: false, error: message };
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
            return { success: true, user: result.user };
        } catch (err) {
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

    // Phone OTP - Verify
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

    // Logout
    const logout = useCallback(async () => {
        if (offlineMode) {
            setUser(null);
            return { success: true };
        }
        try {
            await signOut(auth);
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
        sendPhoneOTP,
        verifyPhoneOTP,
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
