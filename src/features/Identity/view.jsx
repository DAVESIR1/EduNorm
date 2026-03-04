import React, { useState, useEffect } from 'react';
import { GraduationCap, BookOpen, School, Check, ArrowRight, Loader2, Mail, LogOut, Search, UserCheck, Info } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import IdentityResolutionService from '../../services/IdentityResolutionService';
import { verifyUserIdentity } from './logic';
import { ROLES } from './types';
import '../../components/Common/RoleSelectionModal.css'; // Re-use existing CSS for now

export default function IdentityWizard({ isOpen, onComplete }) {
    const { user, updateProfile, logout } = useAuth();

    // Steps: 'role', 'identity', 'otp', 'verified'
    const [step, setStep] = useState('role');
    const [selectedRole, setSelectedRole] = useState(null);
    const [loading, setLoading] = useState(false);

    // Identity State
    const [schoolCode, setSchoolCode] = useState('');
    const [userId, setUserId] = useState(''); // GR No or Teacher Code
    const [govId, setGovId] = useState(''); // Mobile or Email or Aadhar

    // Professional Mapping State
    const [discoveredSchool, setDiscoveredSchool] = useState(null);
    const [foundProfile, setFoundProfile] = useState(null);
    const [isResolvingSchool, setIsResolvingSchool] = useState(false);

    // OTP State
    const [otp, setOtp] = useState('');
    const [verifiedData, setVerifiedData] = useState(null);
    const [timer, setTimer] = useState(60);
    const [canResend, setCanResend] = useState(false);

    // Smart School Discovery Effect
    useEffect(() => {
        if (schoolCode.length >= 4) {
            const delayDebounceFn = setTimeout(async () => {
                setIsResolvingSchool(true);
                // We keep IdentityResolutionService for now as it handles complex school lookups
                // Future Refactor: internalize this into Identity/logic.js
                const school = await IdentityResolutionService.resolveSchoolProfile(schoolCode);
                setDiscoveredSchool(school);
                setIsResolvingSchool(false);
            }, 800);
            return () => clearTimeout(delayDebounceFn);
        } else {
            setDiscoveredSchool(null);
        }
    }, [schoolCode]);

    // Timer Effect
    useEffect(() => {
        let interval;
        if (step === 'otp' && timer > 0) {
            interval = setInterval(() => {
                setTimer((prev) => prev - 1);
            }, 1000);
        } else if (timer === 0) {
            setCanResend(true);
        }
        return () => clearInterval(interval);
    }, [step, timer]);

    const handleResendOtp = async () => {
        setLoading(true);
        const targetEmail = verifiedData?.email || user.email;
        try {
            await sendOtp(targetEmail);
            setTimer(60);
            setCanResend(false);
            window.alert('OTP Resent Successfully!');
        } catch (err) {
            window.alert('Failed to resend OTP.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    // STEP 1: Confirm Role & Move to Identity
    const handleRoleSelect = (role) => {
        setSelectedRole(role);
        setStep('identity');
    };

    // STEP 2: Verify Identity with Server
    const verifyIdentity = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const targetSchoolId = discoveredSchool?.id || schoolCode;

            if (selectedRole === ROLES.HOI) {
                // HOI Flow: Registration of NEW school or claiming admin
                setVerifiedData({ email: user.email, name: user.displayName || 'HOI' });
                await sendOtp(user.email);
                setStep('otp');
                return;
            }

            // USE NEW FEATURE LOGIC
            const result = await verifyUserIdentity(
                selectedRole,
                { id1: userId, id2: govId },
                targetSchoolId
            );

            if (result.success) {
                setFoundProfile(result.data);
                setStep('preview');
            } else {
                window.alert(result.error);
            }
        } catch (err) {
            console.error(err);
            window.alert('Verification failed: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const finalizeMapping = async () => {
        setLoading(true);
        try {
            await updateProfile({
                role: selectedRole,
                isVerified: true,
                verifiedAt: new Date().toISOString(),
                schoolId: discoveredSchool?.id || schoolCode, // Store UID if found, else Code
                schoolCode: schoolCode,
                schoolName: discoveredSchool?.name || 'School',
                recordId: foundProfile.id,
                ...foundProfile // Merge student/teacher data
            });

            window.alert(`Identity Mapped! Welcome, ${foundProfile.name}.`);
            onComplete();
        } catch (err) {
            window.alert('Mapping failed: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    // Helper: Send OTP
    const sendOtp = async (email) => {
        try {
            // Use relative path to avoid CORS and domain mismatch issues
            const res = await fetch('/api/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'send', email: email })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
        } catch (e) {
            console.warn('OTP API failed (likely localhost CORS or dev mode). Simulating success.', e);
            if (window.location.hostname !== 'localhost') throw e;
        }
    };

    // STEP 3: Verify OTP & Finalize
    const verifyOtpAndFinish = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const targetEmail = verifiedData?.email || user.email;
            let verified = false;
            try {
                const res = await fetch('/api/send-otp', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'verify', email: targetEmail, otp })
                });
                const data = await res.json();
                if (res.ok && data.success) verified = true;
                else throw new Error(data.error || 'Invalid OTP');
            } catch (e) {
                if (window.location.hostname === 'localhost' && otp === '123456') {
                    verified = true;
                    console.log('Dev Mode: OTP Bypassed with 123456');
                } else {
                    throw e;
                }
            }

            if (verified) {
                await updateProfile({
                    role: selectedRole,
                    isVerified: true,
                    verifiedAt: new Date().toISOString(),
                    schoolCode: schoolCode || 'PENDING',
                    ...verifiedData
                });
                onComplete();
            }

        } catch (err) {
            window.alert('OTP Verification Failed: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="role-modal-overlay" style={{ backdropFilter: 'blur(20px)', backgroundColor: 'rgba(0,0,0,0.6)' }}>
            <div className="glass-panel wizard-container" style={{
                maxWidth: '650px',
                padding: '0',
                overflow: 'hidden',
                position: 'relative',
                border: '1px solid var(--glass-border)',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}>
                {/* Close/Logout button */}
                <button
                    onClick={() => { logout(); window.location.reload(); }}
                    className="btn-premium btn-premium-ghost"
                    style={{
                        position: 'absolute',
                        top: '1rem',
                        right: '1rem',
                        zIndex: 10,
                        padding: '8px 12px',
                        fontSize: '0.8rem'
                    }}
                >
                    <LogOut size={14} /> Exit
                </button>

                {/* Progress Bar */}
                <div style={{
                    height: '4px',
                    width: '100%',
                    background: 'rgba(255,255,255,0.05)',
                    position: 'absolute',
                    top: 0,
                    left: 0
                }}>
                    <div style={{
                        height: '100%',
                        width: step === 'role' ? '25%' : step === 'identity' ? '50%' : step === 'preview' ? '75%' : '100%',
                        background: 'var(--primary)',
                        transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                        boxShadow: '0 0 10px var(--primary)'
                    }} />
                </div>

                {step === 'role' && (
                    <div className="wizard-step animate-fade-in" style={{ padding: '3rem 2rem' }}>
                        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                            <div style={{
                                display: 'inline-flex',
                                padding: '12px',
                                borderRadius: '16px',
                                background: 'rgba(99, 102, 241, 0.1)',
                                color: 'var(--primary)',
                                marginBottom: '1rem'
                            }}>
                                <UserCheck size={32} />
                            </div>
                            <h2 style={{ fontSize: '2rem', fontWeight: '800', margin: '0' }}>Welcome to EduNorm</h2>
                            <p style={{ opacity: 0.7, marginTop: '0.5rem' }}>Select your identity to personalize your experience</p>
                        </div>

                        <div className="role-options-grid" style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                            gap: '1.25rem'
                        }}>
                            <div className="role-card glass-card clickable" onClick={() => handleRoleSelect(ROLES.STUDENT)}>
                                <div className="role-icon-box" style={{ background: 'linear-gradient(135deg, #6366f1, #818cf8)' }}>
                                    <GraduationCap size={32} color="white" />
                                </div>
                                <h3 style={{ margin: '1rem 0 0.5rem' }}>Student</h3>
                                <p style={{ fontSize: '0.8rem', opacity: 0.6, margin: 0 }}>View reports & attendance</p>
                            </div>

                            <div className="role-card glass-card clickable" onClick={() => handleRoleSelect(ROLES.TEACHER)}>
                                <div className="role-icon-box" style={{ background: 'linear-gradient(135deg, #ec4899, #f472b6)' }}>
                                    <BookOpen size={32} color="white" />
                                </div>
                                <h3 style={{ margin: '1rem 0 0.5rem' }}>Teacher</h3>
                                <p style={{ fontSize: '0.8rem', opacity: 0.6, margin: 0 }}>Manage classes & students</p>
                            </div>

                            <div className="role-card glass-card clickable" onClick={() => handleRoleSelect(ROLES.HOI)}>
                                <div className="role-icon-box" style={{ background: 'linear-gradient(135deg, #f59e0b, #fbbf24)' }}>
                                    <School size={32} color="white" />
                                </div>
                                <h3 style={{ margin: '1rem 0 0.5rem' }}>HOI</h3>
                                <p style={{ fontSize: '0.8rem', opacity: 0.6, margin: 0 }}>Institute administration</p>
                            </div>
                        </div>
                    </div>
                )}

                {step === 'identity' && (
                    <div className="wizard-step animate-fade-in" style={{ padding: '3rem 2rem' }}>
                        <button className="btn-premium btn-premium-ghost" onClick={() => setStep('role')} style={{ marginBottom: '1rem' }}>
                            ← Back
                        </button>
                        <h2 style={{ fontSize: '1.75rem', fontWeight: '800' }}>Confirm Identity</h2>
                        <p style={{ opacity: 0.7, marginBottom: '2rem' }}>Enter your credentials to link your account</p>

                        <form onSubmit={verifyIdentity} className="wizard-form" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div className="input-group">
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: '600' }}>
                                    🏫 School / UDISE Code
                                </label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        className="input-field"
                                        style={{ width: '100%', padding: '12px 14px', borderRadius: '12px' }}
                                        value={schoolCode}
                                        onChange={e => setSchoolCode(e.target.value)}
                                        placeholder="Enter school code..."
                                        required
                                    />
                                    {isResolvingSchool && <Loader2 className="animate-spin" size={18} style={{ position: 'absolute', right: '12px', top: '12px', color: 'var(--primary)' }} />}
                                </div>
                                {discoveredSchool && (
                                    <div className="discovery-success animate-fade-in" style={{
                                        marginTop: '10px',
                                        padding: '10px',
                                        background: 'rgba(16, 185, 129, 0.1)',
                                        borderRadius: '10px',
                                        fontSize: '0.85rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        color: '#10b981'
                                    }}>
                                        <Check size={16} /> <span>Verified: <b>{discoveredSchool.name}</b></span>
                                    </div>
                                )}
                            </div>

                            {selectedRole !== ROLES.HOI && (
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div className="input-group">
                                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: '600' }}>
                                            {selectedRole === ROLES.STUDENT ? 'GR Number' : 'Teacher Code'}
                                        </label>
                                        <input
                                            className="input-field"
                                            style={{ width: '100%', padding: '12px 14px', borderRadius: '12px' }}
                                            value={userId}
                                            onChange={e => setUserId(e.target.value)}
                                            placeholder="ID..."
                                            required
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem', fontWeight: '600' }}>Verify With</label>
                                        <input
                                            className="input-field"
                                            style={{ width: '100%', padding: '12px 14px', borderRadius: '12px' }}
                                            value={govId}
                                            onChange={e => setGovId(e.target.value)}
                                            placeholder="Mobile / Email..."
                                            required
                                        />
                                    </div>
                                </div>
                            )}

                            <button className="btn-premium btn-premium-primary btn-block" style={{ padding: '14px' }} disabled={loading}>
                                {loading ? <Loader2 className="animate-spin" /> : <><Search size={18} /> Find My Profile</>}
                            </button>
                        </form>
                    </div>
                )}

                {step === 'preview' && foundProfile && (
                    <div className="wizard-step animate-fade-in" style={{ padding: '3rem 2rem' }}>
                        <button className="btn-premium btn-premium-ghost" onClick={() => setStep('identity')} style={{ marginBottom: '1rem' }}>
                            ← Back
                        </button>
                        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                            <div className="profile-match-icon" style={{
                                width: '80px',
                                height: '80px',
                                borderRadius: '50%',
                                background: 'rgba(16, 185, 129, 0.1)',
                                color: '#10b981',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                margin: '0 auto 1.5rem'
                            }}>
                                <UserCheck size={40} />
                            </div>
                            <h2 style={{ fontSize: '1.75rem', fontWeight: '800' }}>Is this you?</h2>
                            <p style={{ opacity: 0.7 }}>We found a unique match in our system</p>
                        </div>

                        <div className="glass-card" style={{ marginBottom: '2rem', padding: '1.5rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>
                                    <span style={{ opacity: 0.6 }}>Full Name</span>
                                    <span style={{ fontWeight: '700' }}>{foundProfile.name}</span>
                                </div>
                                {selectedRole === ROLES.STUDENT && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--glass-border)', paddingBottom: '0.5rem' }}>
                                        <span style={{ opacity: 0.6 }}>Class</span>
                                        <span style={{ fontWeight: '700' }}>{foundProfile.standard} - {foundProfile.division || 'A'}</span>
                                    </div>
                                )}
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ opacity: 0.6 }}>Record ID</span>
                                    <span style={{ fontWeight: '700' }}>{foundProfile.grNo || foundProfile.teacherCode}</span>
                                </div>
                            </div>
                        </div>

                        <div style={{
                            padding: '1rem',
                            background: 'rgba(245, 158, 11, 0.05)',
                            border: '1px solid rgba(245, 158, 11, 0.1)',
                            borderRadius: '12px',
                            marginBottom: '2rem',
                            display: 'flex',
                            gap: '10px'
                        }}>
                            <Info size={16} color="#f59e0b" style={{ flexShrink: 0, marginTop: '2px' }} />
                            <p style={{ margin: 0, fontSize: '0.8rem', opacity: 0.8 }}> Linking this record to <b>{user.email}</b> is a permanent professional mapping.</p>
                        </div>

                        <button className="btn-premium btn-premium-primary btn-block" style={{ padding: '14px' }} onClick={finalizeMapping} disabled={loading}>
                            {loading ? <Loader2 className="animate-spin" /> : 'Yes, This Is Me - Continue'}
                        </button>
                    </div>
                )}

                {step === 'otp' && (
                    <div className="wizard-step animate-fade-in" style={{ padding: '3rem 2rem' }}>
                        <button className="btn-premium btn-premium-ghost" onClick={() => setStep('identity')} style={{ marginBottom: '1rem' }}>
                            ← Back
                        </button>
                        <h2 style={{ fontSize: '1.75rem', fontWeight: '800' }}>Verification</h2>
                        <p style={{ opacity: 0.7, marginBottom: '2rem' }}>Enter the 6-digit code sent to your email</p>

                        <form onSubmit={verifyOtpAndFinish} className="wizard-form" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                            <div className="otp-container" style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                                <input
                                    type="text"
                                    className="input-field"
                                    style={{
                                        width: '100%',
                                        textAlign: 'center',
                                        fontSize: '2rem',
                                        letterSpacing: '0.5rem',
                                        fontWeight: '800',
                                        padding: '1rem',
                                        borderRadius: '16px'
                                    }}
                                    placeholder="000000"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                    maxLength={6}
                                />
                            </div>

                            <button className="btn-premium btn-premium-primary btn-block" style={{ padding: '14px' }} disabled={loading}>
                                {loading ? <Loader2 className="animate-spin" /> : <><Sparkles size={18} /> Unlock Dashboard</>}
                            </button>

                            <div style={{ textAlign: 'center' }}>
                                {canResend ? (
                                    <button
                                        type="button"
                                        className="btn-premium btn-premium-ghost"
                                        onClick={handleResendOtp}
                                    >
                                        Resend Code
                                    </button>
                                ) : (
                                    <p style={{ fontSize: '0.9rem', opacity: 0.6 }}>Resend available in {timer}s</p>
                                )}
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}
