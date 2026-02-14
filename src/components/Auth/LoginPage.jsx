import React, { useState, useRef } from 'react';
import { Mail, Lock, Phone, Eye, EyeOff, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { useAuth } from '../../contexts/AuthContext';
import EduNormLogo from '../Common/EduNormLogo';
import './LoginPage.css';

export default function LoginPage() {
    const {
        loginWithEmail,
        registerWithEmail,
        loginWithGoogle,
        verifyUserCredentials,
        loginOffline,
        sendPhoneOTP,
        verifyPhoneOTP,
        error,
        clearError,
        setError // Added setError here
    } = useAuth();

    const [mode, setMode] = useState('login'); // 'login' | 'register'
    const [role, setRole] = useState('student'); // 'student' | 'teacher' | 'hoi' (default to student)
    const [authMethod, setAuthMethod] = useState('email'); // 'email' | 'phone'
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');

    // Email form state
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // Additional Profile Fields
    const [rollNo, setRollNo] = useState('');

    // Phone form state
    const [phoneNumber, setPhoneNumber] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [otp, setOtp] = useState('');

    const recaptchaRef = useRef(null);

    // School registration fields
    const [schoolContact, setSchoolContact] = useState('');
    const [govtSchoolCode, setGovtSchoolCode] = useState('');

    // Restricted Login State
    const [schoolCode, setSchoolCode] = useState('');
    const [schoolVerified, setSchoolVerified] = useState(false);
    const [verifiedData, setVerifiedData] = useState(null); // Store verified student/teacher data

    const handleVerifySchoolCode = async () => {
        if (!schoolCode) return;
        setLoading(true);
        clearError();
        try {
            const db = await import('../../services/database');
            const schoolProfile = await db.getSetting('school_profile');

            if (schoolProfile) {
                const storedUdise = String(schoolProfile.udiseNumber || '').trim().toLowerCase();
                const storedIndex = String(schoolProfile.indexNumber || '').trim().toLowerCase();
                const inputCode = String(schoolCode).trim().toLowerCase();

                if (inputCode === storedUdise || inputCode === storedIndex) {
                    setSchoolVerified(true);
                    setSuccess('School Verified! Please enter your credentials.');
                    // Pre-fill for registration later
                    setGovtSchoolCode(inputCode);
                } else {
                    alert(`Debug: Input "${inputCode}" != Stored UDISE "${storedUdise}" / Index "${storedIndex}"`);
                    setError('Incorrect School Code. Please ask your Head of Institute (HOI) to register your data first.');
                }
            } else {
                alert('Debug: No School Profile found on this device. Please login as HOI first.');
                setError('This device is not registered with any School. Please ask your Head of Institute (HOI) to register first.');
            }
        } catch (err) {
            console.error(err);
            setError('Verification failed. Try again.');
        } finally {
            setLoading(false);
        }
    };

    // Handle Email Login/Register
    const handleEmailSubmit = async (e) => {
        e.preventDefault();
        clearError();

        if (mode === 'register' && password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setLoading(true);
        try {
            const userData = {
                role: role,
                rollNo: role === 'student' ? (rollNo || verifiedData?.grNo) : '',
                mobile: schoolContact || verifiedData?.mobile,
                schoolCode: govtSchoolCode || schoolCode, // Use verified code
                // Add verification data metadata
                isVerified: !!verifiedData,
                verifiedName: verifiedData?.name
            };

            const result = mode === 'login'
                ? await loginWithEmail(email, password)
                : await registerWithEmail(email, password, userData);

            if (result.success) {
                setSuccess(mode === 'register' ? 'Account created!' : 'Welcome back!');
            }
        } finally {
            setLoading(false);
        }
    };

    // Handle Google Sign-in
    const handleGoogleSignIn = async () => {
        clearError();
        setLoading(true);
        try {
            const result = await loginWithGoogle();
            if (result.success) {
                setSuccess('Welcome!');
            }
        } finally {
            setLoading(false);
        }
    };

    // Handle Phone OTP Send
    const handleSendOTP = async () => {
        if (!phoneNumber) return;
        clearError();
        setLoading(true);
        try {
            const result = await sendPhoneOTP(phoneNumber, 'recaptcha-container');
            if (result.success) {
                setOtpSent(true);
                setSuccess('OTP sent to your phone!');
            }
        } finally {
            setLoading(false);
        }
    };

    // Handle OTP Verification
    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        if (!otp) return;
        clearError();
        setLoading(true);
        try {
            const result = await verifyPhoneOTP(otp);
            if (result.success) {
                setSuccess('Phone verified!');
            }
        } finally {
            setLoading(false);
        }
    };

    const [targetRole, setTargetRole] = useState('student'); // 'student' | 'teacher' | 'hoi'

    return (
        <div className="login-page">
            <div className="login-bg">
                <div className="blob blob-1"></div>
                <div className="blob blob-2"></div>
                <div className="blob blob-3"></div>
            </div>

            <div className="login-container">
                <div className="login-header">
                    <img src="/edunorm-logo.png" alt="EduNorm Logo" className="login-logo-img" />
                    <EduNormLogo size="large" />
                    <p>Secure School Management System</p>
                </div>

                {/* Role Tabs - Top Level */}
                <div className="role-tabs-top">
                    <button className={targetRole === 'student' ? 'active' : ''} onClick={() => { setTargetRole('student'); setMode('login'); clearError(); }}>
                        Student
                    </button>
                    <button className={targetRole === 'teacher' ? 'active' : ''} onClick={() => { setTargetRole('teacher'); setMode('login'); clearError(); }}>
                        Teacher
                    </button>
                    <button className={targetRole === 'hoi' ? 'active' : ''} onClick={() => { setTargetRole('hoi'); setMode('login'); clearError(); }}>
                        Institute (HOI)
                    </button>
                </div>

                {/* --- STUDENT & TEACHER FLOW (Restricted) --- */}
                {(targetRole === 'student' || targetRole === 'teacher') && (
                    <div className="restricted-login-box">
                        <div className="info-banner">
                            <AlertCircle size={16} />
                            <span>Restricted Access: You must be registered by your Institute first.</span>
                        </div>

                        <form onSubmit={async (e) => {
                            e.preventDefault();
                            // Final Login Submission
                            if (!schoolVerified) {
                                // Should not happen if UI is correct, but safety check
                                handleVerifySchoolCode();
                                return;
                            }

                            clearError();
                            setLoading(true);
                            try {
                                const id1 = e.target.id1.value; // GR or Teacher Code
                                const id2 = e.target.id2.value; // Gov ID

                                // Safety Timeout Wrapper
                                const timeoutPromise = new Promise((_, reject) =>
                                    setTimeout(() => reject(new Error('Request timed out. Check internet connection.')), 15000)
                                );

                                // 1. Verify availability
                                const verifyPromise = verifyUserCredentials(targetRole, id1, id2, schoolCode);

                                // Race against timeout
                                const verify = await Promise.race([verifyPromise, timeoutPromise]);

                                if (!verify.success) {
                                    throw new Error(verify.error);
                                }

                                setSuccess(`Record Found! Welcome ${verify.data.name || ''}`);

                                // --- SUCCESS ACTION: Redirect to Registration ---
                                setVerifiedData(verify.data);
                                setMode('register');
                                setRole(targetRole); // Ensure role matches

                                // Pre-fill known data
                                if (verify.data.mobile) setSchoolContact(verify.data.mobile);
                                if (verify.data.grNo) setRollNo(verify.data.grNo);
                                setGovtSchoolCode(schoolCode);

                            } catch (err) {
                                console.error('Login Process Error:', err);
                                setError(err.message || 'Login Failed. Check console.');
                            } finally {
                                setLoading(false);
                            }
                        }}>
                            {/* Step 1: School Code Verification */}
                            <div className="input-group">
                                <label className="input-label">
                                    🏫 School Code / UDISE
                                </label>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <input
                                        name="schoolCode"
                                        type="text"
                                        className="input-field"
                                        required
                                        placeholder="Enter School / Institute Code"
                                        value={schoolCode}
                                        onChange={(e) => setSchoolCode(e.target.value)}
                                        disabled={schoolVerified}
                                    />
                                    {schoolVerified && (
                                        <button
                                            type="button"
                                            className="btn btn-secondary btn-icon"
                                            onClick={() => {
                                                setSchoolVerified(false);
                                                setSchoolCode('');
                                                clearError();
                                            }}
                                            title="Change School"
                                        >
                                            ✏️
                                        </button>
                                    )}
                                </div>
                                {!schoolVerified && (
                                    <button
                                        type="button"
                                        className="btn btn-primary"
                                        style={{ marginTop: '8px', width: '100%' }}
                                        onClick={handleVerifySchoolCode}
                                        disabled={loading || !schoolCode}
                                    >
                                        {loading ? <Loader2 className="spin" size={16} /> : 'Verify School Code'}
                                    </button>
                                )}
                            </div>

                            {/* Step 2: User Credentials (Only shown if School Verified) */}
                            {schoolVerified && (
                                <div className="slide-down-animation">
                                    <div className="input-group">
                                        <label className="input-label">
                                            {targetRole === 'student' ? '🔢 GR Number' : '🆔 Teacher Code'}
                                        </label>
                                        <input name="id1" type="text" className="input-field" required placeholder={targetRole === 'student' ? 'e.g. 1024' : 'e.g. T-101'} />
                                    </div>

                                    <div className="input-group">
                                        <label className="input-label">
                                            🏛️ Government ID / Email / Mobile
                                        </label>
                                        <input name="id2" type="text" className="input-field" required placeholder="Aadhar, PAN, Email or Mobile" />
                                    </div>

                                    <button type="submit" className="btn btn-primary btn-lg auth-submit" disabled={loading}>
                                        {loading ? <Loader2 className="spin" size={20} /> : 'Verify Identity & Login'}
                                    </button>
                                </div>
                            )}
                        </form>
                    </div>
                )}

                {/* --- SHARED REGISTRATION / LOGIN FORM --- */}
                {/* Show for HOI (always) OR for Verified Students/Teachers */}
                {(targetRole === 'hoi' || verifiedData) && (
                    <>
                        {targetRole === 'hoi' ? (
                            <div className="auth-tabs">
                                <button className={`auth-tab ${mode === 'login' ? 'active' : ''}`} onClick={() => { setMode('login'); clearError(); }}>Login</button>
                                <button className={`auth-tab ${mode === 'register' ? 'active' : ''}`} onClick={() => { setMode('register'); clearError(); }}>New Registration</button>
                            </div>
                        ) : (
                            // Header for Verified Student
                            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                                <h3>Complete Registration</h3>
                                <p style={{ fontSize: '0.9em', color: '#666' }}>
                                    Setup password for <b>{verifiedData.name}</b>
                                </p>
                            </div>
                        )}

                        {mode === 'register' && (
                            <div className="hoy-register-specific">
                                {/* Only show School Code input for HOI. For Students, it's pre-filled/hidden */}
                                {targetRole === 'hoi' && (
                                    <div className="input-group">
                                        <label className="input-label">🏛️ Government School Code</label>
                                        <input
                                            type="text"
                                            className="input-field"
                                            placeholder="Enter DISE/UDISE Code"
                                            value={govtSchoolCode}
                                            onChange={(e) => setGovtSchoolCode(e.target.value)}
                                            onBlur={(e) => {
                                                if (e.target.value.length < 5) setError('Invalid School Code format');
                                            }}
                                            required
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Auth Method Selector */}
                        <div className="method-tabs">
                            <button className={`method-tab ${authMethod === 'email' ? 'active' : ''}`} onClick={() => { setAuthMethod('email'); clearError(); }}>
                                <Mail size={16} /> Email / Password
                            </button>
                            {/* Only show Phone OTP if NOT verified student (since verified students skipped OTP to get here) */}
                            {/* OR maybe allow them to link phone? For now simpler is better as per user request */}
                            {targetRole === 'hoi' && (
                                <button className={`method-tab ${authMethod === 'phone' ? 'active' : ''}`} onClick={() => { setAuthMethod('phone'); clearError(); setOtpSent(false); }}>
                                    <Phone size={16} /> Phone OTP
                                </button>
                            )}
                        </div>

                        {/* Error/Success Messages */}
                        {error && <div className="auth-message error"><AlertCircle size={18} /><span>{error}</span></div>}
                        {success && <div className="auth-message success"><CheckCircle size={18} /><span>{success}</span></div>}

                        {/* Email Form */}
                        {authMethod === 'email' && (
                            <form className="auth-form" onSubmit={handleEmailSubmit}>
                                <div className="input-group">
                                    <label className="input-label"><Mail size={16} /> Email Address</label>
                                    <input type="email" className="input-field" value={email} onChange={(e) => setEmail(e.target.value)} required />
                                </div>

                                <div className="input-group">
                                    <label className="input-label"><Lock size={16} /> Password</label>
                                    <input type={showPassword ? 'text' : 'password'} className="input-field" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
                                </div>

                                {mode === 'register' && (
                                    <div className="input-group">
                                        <label className="input-label"><Lock size={16} /> Confirm Password</label>
                                        <input type="password" className="input-field" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required minLength={6} />
                                    </div>
                                )}

                                <button type="submit" className="btn btn-primary btn-lg auth-submit" disabled={loading}>
                                    {loading ? <Loader2 className="spin" size={20} /> : (mode === 'login' ? 'Login' : 'Next Step (OTP)')}
                                </button>
                            </form>
                        )}

                        {/* Phone OTP Form (Reuse Logic) */}
                        {authMethod === 'phone' && (
                            <div className="auth-form">
                                {!otpSent ? (
                                    <>
                                        <div className="input-group"><label className="input-label"><Phone size={16} /> Phone Number</label><PhoneInput international defaultCountry="IN" value={phoneNumber} onChange={setPhoneNumber} className="phone-input" /></div>
                                        <button type="button" className="btn btn-primary btn-lg auth-submit" onClick={handleSendOTP} disabled={loading || !phoneNumber}>{loading ? <Loader2 className="spin" size={20} /> : 'Send OTP'}</button>
                                    </>
                                ) : (
                                    <form onSubmit={handleVerifyOTP}>
                                        <div className="input-group"><label className="input-label">Enter OTP</label><input type="text" className="input-field" value={otp} onChange={(e) => setOtp(e.target.value)} required /></div>
                                        <button type="submit" className="btn btn-primary btn-lg auth-submit" disabled={loading}>Verify OTP</button>
                                    </form>
                                )}
                            </div>
                        )}

                        <div className="auth-divider"><span>or</span></div>
                        <div className="social-buttons">
                            {/* Hidden File Input for Restore */}
                            <input
                                type="file"
                                id="restore-input"
                                accept=".json"
                                style={{ display: 'none' }}
                                onChange={async (e) => {
                                    const file = e.target.files[0];
                                    if (!file) return;

                                    setLoading(true);
                                    try {
                                        const text = await file.text();
                                        const data = JSON.parse(text);
                                        const db = await import('../../services/database');
                                        await db.importAllData(data);

                                        // Refresh context / Check if school is now verified
                                        const schoolProfile = await db.getSetting('school_profile');

                                        if (schoolProfile) {
                                            const successMsg = `Restored: ${schoolProfile.schoolName}`;
                                            setSchoolVerified(true);
                                            setSuccess(`${successMsg}. Syncing to Live Server...`);

                                            // AUTO-RELAY to Live Server (Autonomous Sync)
                                            try {
                                                const { migrateToLiveServer } = await import('../../services/MigrationService');
                                                const result = await migrateToLiveServer();
                                                console.log('Auto-Sync Success:', result);
                                                setSuccess(`${successMsg}. Live Sync Complete! ✅`);
                                            } catch (syncErr) {
                                                console.warn('Auto-Sync Failed:', syncErr);

                                                // FALLBACK: If missing profile, ask user manually
                                                if (syncErr.message.includes('No School Profile') || syncErr.message.includes('configure school details')) {
                                                    const manualCode = prompt("Backup is missing School Code. Please enter it to finish Sync:");
                                                    if (manualCode) {
                                                        const manualName = prompt("Enter School Name:") || "My School";

                                                        // Save manual profile
                                                        await db.setSetting('school_profile', {
                                                            schoolName: manualName,
                                                            schoolCode: manualCode,
                                                            createdAt: new Date().toISOString()
                                                        });

                                                        // Retry Sync
                                                        try {
                                                            const { migrateToLiveServer } = await import('../../services/MigrationService');
                                                            await migrateToLiveServer();
                                                            setSuccess(`${successMsg}. Manual Sync Complete! ✅`);
                                                        } catch (retryErr) {
                                                            setError(`Manual Sync Failed: ${retryErr.message}`);
                                                        }
                                                    } else {
                                                        setError(`Sync Skipped. Please set School Code in Settings.`);
                                                    }
                                                } else {
                                                    // CRITICAL: Showing the exact error to the user
                                                    setError(`Data Restored, but Live Sync Failed: ${syncErr.message}`);
                                                    // Keep success message for a bit so they know restore worked at least
                                                    setTimeout(() => setSuccess(null), 3000);
                                                }
                                            }
                                        } else {
                                            // Handling case where NO profile found in context at all (legacy backup flow)
                                            // The MigrationService logic usually catches this inside the sync try/catch above via "checked legacy keys"
                                            // But if we fall into this else block, it means db.getSetting('school_profile') returned null
                                            // So we should try to sync from here too to trigger the fallback logic in MigrationService or our manual prompt

                                            setSuccess('Data Restored. Attempting Legacy Sync...');

                                            try {
                                                const { migrateToLiveServer } = await import('../../services/MigrationService');
                                                await migrateToLiveServer();
                                                setSuccess(`Legacy Sync Complete! ✅`);
                                            } catch (syncErr) {
                                                // Prompt Manual
                                                const manualCode = prompt("Legacy Backup Detected. Enter School Code to finish setup:");
                                                if (manualCode) {
                                                    const manualName = prompt("Enter School Name:") || "My School";
                                                    await db.setSetting('school_profile', {
                                                        schoolName: manualName,
                                                        schoolCode: manualCode,
                                                        createdAt: new Date().toISOString()
                                                    });
                                                    // Retry
                                                    try {
                                                        const { migrateToLiveServer } = await import('../../services/MigrationService');
                                                        await migrateToLiveServer();
                                                        setSuccess(`Manual Setup Complete! ✅`);
                                                    } catch (e) { setError(e.message); }
                                                } else {
                                                    setSuccess('Data Restored. Please configure School Settings manually.');
                                                }
                                            }
                                        }
                                    } catch (err) {
                                        console.error('Restore Failed:', err);
                                        setError('Invalid Backup File or Restore Error: ' + err.message);
                                    } finally {
                                        setLoading(false);
                                        e.target.value = null; // Reset
                                    }
                                }}
                            />

                            <button className="social-btn google-btn" onClick={handleGoogleSignIn} disabled={loading}>Google Login</button>

                            <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                                <button
                                    className="social-btn offline-btn"
                                    onClick={loginOffline}
                                    style={{ flex: 1, background: '#6c757d', color: 'white' }}
                                >
                                    ☁️ Offline Mode
                                </button>
                                <button
                                    className="social-btn restore-btn"
                                    onClick={() => document.getElementById('restore-input').click()}
                                    style={{ flex: 1, background: '#28a745', color: 'white' }}
                                >
                                    📂 Restore
                                </button>
                            </div>
                        </div>
                    </>
                )}

                <div id="recaptcha-container" ref={recaptchaRef}></div>
            </div>
        </div>
    );
}
