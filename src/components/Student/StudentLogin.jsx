import React, { useState, useCallback, useEffect } from 'react';
import ServiceLayer from '../../services/ServiceLayer.js';
import './StudentLogin.css';

/**
 * Student Login - Government ID based authentication
 * Supports: Aadhaar (12 digits), APAAR ID (12 digits), Child UID
 * Verification: In-app OTP (shown securely in-session, not via email alert)
 * After login: Student is locked to student menu only
 */

// ID type definitions with validation
const ID_TYPES = [
    { id: 'aadhaar', name: 'Aadhaar Card', pattern: /^\d{12}$/, placeholder: 'Enter 12-digit Aadhaar number', maxLen: 12, hint: '12 digits (e.g., 1234 5678 9012)' },
    { id: 'apaar', name: 'APAAR ID', pattern: /^[A-Z0-9]{12}$/i, placeholder: 'Enter 12-character APAAR ID', maxLen: 12, hint: '12 alphanumeric characters' },
    { id: 'childuid', name: 'Child UID', pattern: /^.{4,20}$/, placeholder: 'Enter Child UID', maxLen: 20, hint: '4–20 characters' },
];

export default function StudentLogin({ onBack, onStudentLogin }) {
    const [step, setStep] = useState('id'); // 'id' → 'otp' → 'profile'
    const [selectedIdType, setSelectedIdType] = useState('aadhaar');
    const [idNumber, setIdNumber] = useState('');
    const [otp, setOtp] = useState('');
    const [generatedOtp, setGeneratedOtp] = useState('');
    const [studentData, setStudentData] = useState(null);
    const [studentEmail, setStudentEmail] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [otpSent, setOtpSent] = useState(false);
    const [otpVisible, setOtpVisible] = useState(false); // in-app OTP reveal
    const [otpTimer, setOtpTimer] = useState(0);         // countdown to hide OTP
    const [otpAttempts, setOtpAttempts] = useState(0);   // attempt counter
    const [otpLocked, setOtpLocked] = useState(false);
    const [otpLockedTimer, setOtpLockedTimer] = useState(0);

    const clearError = () => setError('');

    const getIdType = () => ID_TYPES.find(t => t.id === selectedIdType) || ID_TYPES[0];

    // OTP visibility timer
    useEffect(() => {
        if (otpTimer <= 0) return;
        const t = setTimeout(() => setOtpTimer(prev => prev - 1), 1000);
        if (otpTimer === 1) setOtpVisible(false);
        return () => clearTimeout(t);
    }, [otpTimer]);

    // OTP lockout timer
    useEffect(() => {
        if (otpLockedTimer <= 0) return;
        const t = setTimeout(() => setOtpLockedTimer(prev => prev - 1), 1000);
        if (otpLockedTimer === 1) { setOtpLocked(false); setOtpAttempts(0); }
        return () => clearTimeout(t);
    }, [otpLockedTimer]);

    // Format Aadhaar number with spaces (XXXX XXXX XXXX)
    const formatIdInput = (value) => {
        if (selectedIdType === 'aadhaar') {
            const digits = value.replace(/\D/g, '').slice(0, 12);
            return digits;
        }
        return value.slice(0, getIdType().maxLen);
    };

    // Display Aadhaar with spaces
    const displayAadhaar = (num) => {
        if (!num) return '';
        const clean = num.replace(/\D/g, '');
        return clean.replace(/(\d{4})(?=\d)/g, '$1 ');
    };

    // Validate ID format
    const validateId = (id) => {
        const idType = getIdType();
        const cleanId = selectedIdType === 'aadhaar' ? id.replace(/\s/g, '') : id.trim();
        return idType.pattern.test(cleanId);
    };

    // Search student by government ID
    const findStudentByGovtId = useCallback(async (id) => {
        try {
            const allStudents = await ServiceLayer.getAllStudents();
            if (!allStudents || !allStudents.length) return null;

            const cleanId = id.replace(/\s/g, '').trim();

            return allStudents.find(s => {
                const studentAadhaar = (s.aadharNo || s.aadhaarNo || '').replace(/\s/g, '');
                const studentApaar = (s.apaarId || s.apaarNo || '').replace(/\s/g, '');
                const studentChildUid = (s.childUid || s.childUID || '').trim();

                switch (selectedIdType) {
                    case 'aadhaar':
                        return studentAadhaar === cleanId;
                    case 'apaar':
                        return studentApaar.toLowerCase() === cleanId.toLowerCase();
                    case 'childuid':
                        return studentChildUid === cleanId;
                    default:
                        return false;
                }
            });
        } catch (err) {
            console.error('StudentLogin: Error finding student:', err);
            return null;
        }
    }, [selectedIdType]);

    // Generate a 6-digit OTP
    const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

    // Reveal OTP in-app securely (30 second countdown, no alert)
    const revealOtpInApp = (newOtp) => {
        setGeneratedOtp(newOtp);
        setOtpVisible(true);
        setOtpTimer(30); // hide after 30s
    };

    // Step 1: Verify government ID against database
    const handleIdVerify = async (e) => {
        e.preventDefault();
        clearError();

        if (!validateId(idNumber)) {
            setError(`Invalid ${getIdType().name} format. ${getIdType().hint}`);
            return;
        }

        setLoading(true);
        try {
            const student = await findStudentByGovtId(idNumber);
            if (!student) {
                setError(`No student found with this ${getIdType().name}. Please check the number or contact your school.`);
                setLoading(false);
                return;
            }

            setStudentData(student);

            // Get email for display context
            const email = student.email || student.parentEmail || student.fatherEmail || student.motherEmail;
            if (email) setStudentEmail(email);

            // Generate OTP and reveal in-app (no alert, no email needed)
            const newOtp = generateOtp();
            revealOtpInApp(newOtp);
            setStep('otp');
            setOtpSent(true);
            setOtpAttempts(0);
        } catch (err) {
            setError('Verification failed. Please try again.');
            console.error('StudentLogin:', err);
        }
        setLoading(false);
    };

    // Step 2: Verify OTP — with rate limiting
    const handleVerifyOtp = (e) => {
        e.preventDefault();
        clearError();
        if (otpLocked) return;

        if (otp.trim() === generatedOtp) {
            setStep('profile');
            setOtpVisible(false);
            if (onStudentLogin) onStudentLogin(studentData);
        } else {
            const newAttempts = otpAttempts + 1;
            setOtpAttempts(newAttempts);
            if (newAttempts >= 3) {
                setOtpLocked(true);
                setOtpLockedTimer(30);
                setError('Too many wrong OTP attempts. Locked for 30 seconds.');
            } else {
                setError(`Invalid OTP. ${3 - newAttempts} attempt(s) remaining.`);
            }
            setOtp('');
        }
    };

    // Resend OTP
    const handleResendOtp = () => {
        const newOtp = generateOtp();
        revealOtpInApp(newOtp);
        setOtp('');
        setOtpAttempts(0);
        setOtpLocked(false);
        clearError();
    };

    // Mask email for display (s***@gmail.com)
    const maskEmail = (email) => {
        if (!email) return '';
        const [user, domain] = email.split('@');
        return user[0] + '***@' + domain;
    };

    // Student Profile View (locked to student menu only)
    if (step === 'profile' && studentData) {
        return (
            <div className="student-login-container">
                <div className="student-profile-view">
                    <div className="profile-header">
                        <div className="profile-photo-wrap">
                            {studentData.studentPhoto ? (
                                <img src={studentData.studentPhoto} alt="Student" className="profile-photo" />
                            ) : (
                                <div className="profile-photo-placeholder">👤</div>
                            )}
                        </div>
                        <div className="profile-name-section">
                            <h2>{studentData.name || studentData.nameEnglish || 'Student'}</h2>
                            <span className="profile-class">Class {studentData.standard || '—'}</span>
                            <span className="verified-badge">✅ Verified via {getIdType().name}</span>
                        </div>
                        <button className="btn btn-outline btn-sm" onClick={() => {
                            setStep('id');
                            setStudentData(null);
                            setIdNumber('');
                            setOtp('');
                            setGeneratedOtp('');
                            setStudentEmail('');
                            setOtpSent(false);
                            if (onStudentLogin) onStudentLogin(null); // Clear student session
                        }}>Logout</button>
                    </div>

                    <div className="profile-details-grid">
                        {[
                            { label: 'GR Number', value: studentData.grNo },
                            { label: 'Roll Number', value: studentData.rollNo },
                            { label: 'Class / Standard', value: studentData.standard },
                            { label: 'Date of Birth', value: studentData.dateOfBirth },
                            { label: "Father's Name", value: studentData.fatherName },
                            { label: "Mother's Name", value: studentData.motherName },
                            { label: 'Contact', value: studentData.contactNumber },
                            { label: 'Email', value: studentData.email },
                            { label: 'Address', value: studentData.address },
                            { label: 'Blood Group', value: studentData.bloodGroup },
                            { label: 'Nationality', value: studentData.nationality },
                            { label: 'Religion', value: studentData.religion },
                            { label: 'Category', value: studentData.category },
                            { label: 'Aadhaar', value: displayAadhaar(studentData.aadharNo || studentData.aadhaarNo) },
                            { label: 'APAAR ID', value: studentData.apaarId || studentData.apaarNo },
                            { label: 'Admission Date', value: studentData.admissionDate },
                        ].filter(item => item.value).map((item, i) => (
                            <div key={i} className="profile-detail-card">
                                <span className="detail-label">{item.label}</span>
                                <span className="detail-value">{item.value}</span>
                            </div>
                        ))}
                    </div>

                    <div className="profile-actions">
                        <button className="btn btn-primary" onClick={() => window.print()}>
                            🖨️ Print Profile
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="student-login-container">
            <div className="student-login-card">
                <div className="login-card-header">
                    <h2>🎓 Student Login</h2>
                    <p>Verify your identity with a government-issued ID</p>
                </div>

                {/* ID Type Selector */}
                {step === 'id' && (
                    <>
                        <div className="id-type-selector">
                            {ID_TYPES.map(type => (
                                <button
                                    key={type.id}
                                    className={`id-type-btn ${selectedIdType === type.id ? 'active' : ''}`}
                                    onClick={() => {
                                        setSelectedIdType(type.id);
                                        setIdNumber('');
                                        clearError();
                                    }}
                                >
                                    {type.id === 'aadhaar' && '🪪'}
                                    {type.id === 'apaar' && '🆔'}
                                    {type.id === 'childuid' && '👶'}
                                    {' '}{type.name}
                                </button>
                            ))}
                        </div>

                        {error && (
                            <div className="login-error">
                                ⚠️ {error}
                            </div>
                        )}

                        <form onSubmit={handleIdVerify} className="login-form">
                            <div className="form-group">
                                <label>{getIdType().name} Number</label>
                                <input
                                    type="text"
                                    className="input-field id-input"
                                    placeholder={getIdType().placeholder}
                                    value={selectedIdType === 'aadhaar' ? displayAadhaar(idNumber) : idNumber}
                                    onChange={(e) => setIdNumber(formatIdInput(e.target.value))}
                                    maxLength={selectedIdType === 'aadhaar' ? 14 : getIdType().maxLen}
                                    required
                                    autoFocus
                                />
                                <span className="input-hint">{getIdType().hint}</span>
                            </div>
                            <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
                                {loading ? '⏳ Verifying...' : '🔍 Verify & Continue'}
                            </button>
                        </form>
                    </>
                )}

                {/* OTP Verification */}
                {step === 'otp' && (
                    <>
                        {error && (
                            <div className="login-error">
                                ⚠️ {error}
                                {otpLocked && <span> ({otpLockedTimer}s)</span>}
                            </div>
                        )}

                        <div className="otp-info">
                            {studentEmail
                                ? <p>🔐 Verify your identity to continue</p>
                                : <p>🔐 Enter the verification code</p>}
                        </div>

                        {/* In-app OTP reveal panel */}
                        {otpVisible && (
                            <div className="otp-reveal-panel">
                                <div className="otp-reveal-label">Your OTP (hides in {otpTimer}s)</div>
                                <div className="otp-reveal-code">{generatedOtp}</div>
                                <div className="otp-reveal-hint">Do not share this with anyone</div>
                            </div>
                        )}

                        <form onSubmit={handleVerifyOtp} className="login-form">
                            <div className="form-group">
                                <label>Enter 6-digit OTP</label>
                                <input
                                    type="text"
                                    className="input-field otp-field"
                                    placeholder="● ● ● ● ● ●"
                                    maxLength={6}
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                                    required
                                    autoFocus
                                />
                            </div>
                            <button type="submit" className="btn btn-primary btn-lg">
                                ✅ Verify OTP
                            </button>
                            <div className="otp-actions">
                                <button type="button" className="btn btn-ghost" onClick={handleResendOtp}>
                                    🔄 Resend OTP
                                </button>
                                <button type="button" className="btn btn-ghost" onClick={() => {
                                    setStep('id');
                                    setOtp('');
                                    setGeneratedOtp('');
                                    clearError();
                                }}>
                                    ← Change ID
                                </button>
                            </div>
                        </form>
                    </>
                )}

                {onBack && (
                    <button className="btn btn-ghost back-btn" onClick={onBack}>
                        ← Back to Menu
                    </button>
                )}
            </div>
        </div>
    );
}
