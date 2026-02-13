import React, { useState, useCallback } from 'react';
import * as db from '../../services/database';
import './StudentLogin.css';

/**
 * Student Login - Government ID based authentication
 * Supports: Aadhaar (12 digits), APAAR ID (12 digits), Child UID
 * Verification: Email OTP (reuses HOI OTP system pattern)
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

    const clearError = () => setError('');

    const getIdType = () => ID_TYPES.find(t => t.id === selectedIdType) || ID_TYPES[0];

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
            const allStudents = await db.getAllStudentsForBackup();
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

            // Get email for OTP
            const email = student.email || student.parentEmail || student.fatherEmail || student.motherEmail;
            if (email) {
                setStudentEmail(email);
                // Auto-send OTP
                const newOtp = generateOtp();
                setGeneratedOtp(newOtp);
                setStep('otp');
                setOtpSent(true);

                // In production, send via email. For now, show alert.
                console.log(`StudentLogin: OTP for ${email}: ${newOtp}`);
                alert(`Demo Mode:\nOTP sent to ${maskEmail(email)}\nOTP: ${newOtp}\n\n(In production, this will be sent via email)`);
            } else {
                // No email found — allow direct login with warning
                setStep('profile');
                if (onStudentLogin) onStudentLogin(student);
            }
        } catch (err) {
            setError('Verification failed. Please try again.');
            console.error('StudentLogin:', err);
        }
        setLoading(false);
    };

    // Step 2: Verify OTP
    const handleVerifyOtp = (e) => {
        e.preventDefault();
        clearError();

        if (otp.trim() === generatedOtp) {
            setStep('profile');
            if (onStudentLogin) onStudentLogin(studentData);
        } else {
            setError('Invalid OTP. Please check and try again.');
        }
    };

    // Resend OTP
    const handleResendOtp = () => {
        const newOtp = generateOtp();
        setGeneratedOtp(newOtp);
        setOtp('');
        console.log(`StudentLogin: New OTP: ${newOtp}`);
        alert(`New OTP: ${newOtp}\n(In production, this will be sent via email)`);
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
                            </div>
                        )}

                        <div className="otp-info">
                            <p>📧 OTP sent to <strong>{maskEmail(studentEmail)}</strong></p>
                        </div>

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
