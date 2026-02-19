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
            alert('OTP Resent Successfully!');
        } catch (err) {
            alert('Failed to resend OTP.');
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
                alert(result.error);
            }
        } catch (err) {
            console.error(err);
            alert('Verification failed: ' + err.message);
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

            alert(`Identity Mapped! Welcome, ${foundProfile.name}.`);
            onComplete();
        } catch (err) {
            alert('Mapping failed: ' + err.message);
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
            alert('OTP Verification Failed: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="role-modal-overlay">
            <div className="role-modal-content wizard-container" style={{ position: 'relative' }}>
                <button
                    onClick={() => {
                        logout();
                        window.location.reload();
                    }}
                    style={{
                        position: 'absolute',
                        top: '16px',
                        right: '16px',
                        border: 'none',
                        background: 'none',
                        color: '#64748b',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '0.9rem'
                    }}
                    title="Logout / Switch Account"
                >
                    <LogOut size={16} /> Logout
                </button>

                {step === 'role' && (
                    <div className="wizard-step animate-fade-in">
                        <h2>🎓 Select Your Role</h2>
                        <p className="subtitle">Choose how you will use EduNorm</p>
                        <div className="role-options-grid">
                            <div className="role-option" onClick={() => handleRoleSelect(ROLES.STUDENT)}>
                                <div className="role-icon-box"><GraduationCap size={32} /></div>
                                <h3>Student</h3>
                            </div>
                            <div className="role-option" onClick={() => handleRoleSelect(ROLES.TEACHER)}>
                                <div className="role-icon-box"><BookOpen size={32} /></div>
                                <h3>Teacher</h3>
                            </div>
                            <div className="role-option" onClick={() => handleRoleSelect(ROLES.HOI)}>
                                <div className="role-icon-box"><School size={32} /></div>
                                <h3>Institute (HOI)</h3>
                            </div>
                        </div>
                    </div>
                )}

                {step === 'identity' && (
                    <div className="wizard-step animate-fade-in">
                        <button className="back-link" onClick={() => setStep('role')}>← Back</button>
                        <h2>🛡️ Verify Identity</h2>
                        <p className="subtitle">We need to check if you are registered.</p>

                        <form onSubmit={verifyIdentity} className="wizard-form">
                            <div className="input-group">
                                <label>🏫 School Code / UDISE</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        className="input-field"
                                        value={schoolCode}
                                        onChange={e => setSchoolCode(e.target.value)}
                                        placeholder="e.g. 2405..."
                                        required
                                    />
                                    {isResolvingSchool && <Loader2 className="spin" size={16} style={{ position: 'absolute', right: '12px', top: '14px', color: '#6366f1' }} />}
                                </div>
                                {discoveredSchool && (
                                    <div className="discovery-success animate-fade-in">
                                        <Check size={14} /> Found: <b>{discoveredSchool.name}</b>
                                    </div>
                                )}
                            </div>

                            {selectedRole !== ROLES.HOI && (
                                <>
                                    <div className="input-group">
                                        <label>{selectedRole === ROLES.STUDENT ? 'GR Number' : 'Teacher Code'}</label>
                                        <input
                                            className="input-field"
                                            value={userId}
                                            onChange={e => setUserId(e.target.value)}
                                            placeholder={selectedRole === ROLES.STUDENT ? 'e.g. 101' : 'e.g. T45'}
                                            required
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label>Any ID</label>
                                        <input
                                            className="input-field"
                                            value={govId}
                                            onChange={e => setGovId(e.target.value)}
                                            placeholder="Aadhar, Mobile, Email, PAN, etc."
                                            required
                                        />
                                        <p className="input-note">
                                            <Info size={12} /> You can type any ID that's available in school data
                                        </p>
                                    </div>
                                </>
                            )}

                            <button className="btn btn-primary btn-large btn-block" disabled={loading}>
                                {loading ? <Loader2 className="spin" /> : 'Find My Profile'}
                            </button>
                        </form>
                    </div>
                )}

                {step === 'preview' && foundProfile && (
                    <div className="wizard-step animate-fade-in">
                        <button className="back-link" onClick={() => setStep('identity')}>← Back</button>
                        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                            <div className="profile-match-icon">
                                <UserCheck size={48} />
                            </div>
                            <h2>Is this you?</h2>
                            <p className="subtitle">We found a matching record</p>
                        </div>

                        <div className="profile-preview-card">
                            <div className="preview-row">
                                <span className="label">Name</span>
                                <span className="value">{foundProfile.name}</span>
                            </div>
                            {selectedRole === ROLES.STUDENT && (
                                <div className="preview-row">
                                    <span className="label">Class</span>
                                    <span className="value">{foundProfile.standard} {foundProfile.division}</span>
                                </div>
                            )}
                            <div className="preview-row">
                                <span className="label">{selectedRole === ROLES.STUDENT ? 'GR No' : 'Code'}</span>
                                <span className="value">{foundProfile.grNo || foundProfile.teacherCode}</span>
                            </div>
                        </div>

                        <div className="confirmation-warning">
                            <small>By clicking "Confirm", you link this professional record to your account <b>{user.email}</b>. This action is permanent.</small>
                        </div>

                        <button className="btn btn-primary btn-large btn-block" onClick={finalizeMapping} disabled={loading}>
                            {loading ? <Loader2 className="spin" /> : 'Yes, That\'s Me - Finish'}
                        </button>
                    </div>
                )}

                {step === 'otp' && (
                    <div className="wizard-step animate-fade-in">
                        <button className="back-link" onClick={() => setStep('identity')}>← Back</button>
                        <h2>📧 Email Verification</h2>
                        <p className="subtitle">
                            Enter the OTP sent to <b>{verifiedData?.email || user.email}</b>
                            <br />
                            <small>Sent via help@edunorm.in</small>
                        </p>

                        <form onSubmit={verifyOtpAndFinish} className="wizard-form">
                            <div className="input-group">
                                <label className="center-text">One Time Password</label>
                                <input
                                    type="text"
                                    className="input-field otp-input"
                                    placeholder="• • • • • •"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    maxLength={6}
                                />
                                {window.location.hostname === 'localhost' && (
                                    <p style={{ color: '#f59e0b', fontSize: '0.8rem', marginTop: '8px' }}>
                                        🚧 Dev Mode: Use OTP <strong>123456</strong>
                                    </p>
                                )}
                            </div>

                            <button className="btn btn-primary btn-large btn-block" disabled={loading}>
                                {loading ? 'Verifying...' : 'Unlock Dashboard'}
                            </button>

                            <div style={{ marginTop: '16px' }}>
                                {canResend ? (
                                    <button
                                        type="button"
                                        className="btn-link"
                                        onClick={handleResendOtp}
                                        style={{ color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                                    >
                                        Resend OTP
                                    </button>
                                ) : (
                                    <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
                                        Resend OTP in {timer}s
                                    </p>
                                )}
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}
