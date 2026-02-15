import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { GraduationCap, BookOpen, School, Check, ArrowRight, Loader2, Mail, LogOut } from 'lucide-react';
import './RoleSelectionModal.css';

export default function RoleSelectionModal({ isOpen, onComplete }) {
    const { user, updateProfile, verifyUserCredentials, setError, logout } = useAuth();

    // Steps: 'role', 'identity', 'otp', 'verified'
    const [step, setStep] = useState('role');
    const [selectedRole, setSelectedRole] = useState(null);
    const [loading, setLoading] = useState(false);

    // Identity State
    const [schoolCode, setSchoolCode] = useState('');
    const [userId, setUserId] = useState(''); // GR No or Teacher Code
    const [govId, setGovId] = useState(''); // Mobile or Email or Aadhar

    // OTP State
    const [otp, setOtp] = useState('');
    const [verifiedData, setVerifiedData] = useState(null);
    const [timer, setTimer] = useState(60);
    const [canResend, setCanResend] = useState(false);

    // Timer Effect
    React.useEffect(() => {
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
            if (selectedRole === 'hoi') {
                // HOI Flow: Still needs OTP for security (as they are admins)
                setVerifiedData({ email: user.email, name: user.displayName || 'HOI' });
                await sendOtp(user.email);
                setStep('otp');
                return;
            }

            // Student/Teacher Verification
            const result = await verifyUserCredentials(selectedRole, userId, govId, schoolCode);

            if (result.success) {
                setVerifiedData(result.data);

                // DIRECT SUCCESS (No OTP for Students/Teachers as requested)
                console.log('Identity Verified:', result.data.name);

                await updateProfile({
                    role: selectedRole,
                    isVerified: true,
                    verifiedAt: new Date().toISOString(),
                    schoolCode: schoolCode || 'PENDING',
                    ...result.data
                });

                alert(`Welcome, ${result.data.name}! Identity Updated.`);
                onComplete();

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

    // Helper: Send OTP
    const sendOtp = async (email) => {
        // Call the Serverless Function
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
            // Fallback for localhost testing if API fails or blocks CORS
            console.warn('OTP API failed (likely localhost CORS or dev mode). Simulating success.', e);
            // In PROD, throw error.
            if (window.location.hostname !== 'localhost') throw e;
        }
    };

    // STEP 3: Verify OTP & Finalize
    const verifyOtpAndFinish = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Call Verify API
            // For HOI/Student, we verify against the email we sent to.
            const targetEmail = verifiedData?.email || user.email;

            // Real API Call
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
                // Dev Bypass
                if (window.location.hostname === 'localhost' && otp === '123456') {
                    verified = true;
                    console.log('Dev Mode: OTP Bypassed with 123456');
                } else {
                    throw e;
                }
            }

            if (verified) {
                // Update User Profile
                await updateProfile({
                    role: selectedRole,
                    isVerified: true,
                    verifiedAt: new Date().toISOString(),
                    schoolCode: schoolCode || 'PENDING',
                    // Merge verified data
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
                            <div className="role-option" onClick={() => handleRoleSelect('student')}>
                                <div className="role-icon-box"><GraduationCap size={32} /></div>
                                <h3>Student</h3>
                            </div>
                            <div className="role-option" onClick={() => handleRoleSelect('teacher')}>
                                <div className="role-icon-box"><BookOpen size={32} /></div>
                                <h3>Teacher</h3>
                            </div>
                            <div className="role-option" onClick={() => handleRoleSelect('hoi')}>
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
                                <input
                                    className="input-field"
                                    value={schoolCode}
                                    onChange={e => setSchoolCode(e.target.value)}
                                    placeholder="e.g. 24050200..."
                                    required
                                />
                            </div>

                            {selectedRole !== 'hoi' && (
                                <>
                                    <div className="input-group">
                                        <label>{selectedRole === 'student' ? 'GR Number' : 'Teacher Code'}</label>
                                        <input
                                            className="input-field"
                                            value={userId}
                                            onChange={e => setUserId(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="input-group">
                                        <label>Enter Mobile, Email, or Aadhar No.</label>
                                        <input
                                            className="input-field"
                                            value={govId}
                                            onChange={e => setGovId(e.target.value)}
                                            required
                                        />
                                    </div>
                                </>
                            )}

                            <button className="btn btn-primary btn-large btn-block" disabled={loading}>
                                {loading ? <Loader2 className="spin" /> : 'Verify Records'}
                            </button>
                        </form>
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
                                {/* Dev Helper */}
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
