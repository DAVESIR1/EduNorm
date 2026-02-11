import React, { useState } from 'react';
import { XIcon, CheckIcon, MailIcon } from '../Icons/CustomIcons';
import './HoiPasswordSettings.css';

export default function HoiPasswordSettings({ isOpen, onClose }) {
    const [step, setStep] = useState('set'); // 'set', 'verify', 'success'
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [sentOtp, setSentOtp] = useState(false);

    if (!isOpen) return null;

    const handleSendOtp = async () => {
        if (!newPassword || newPassword.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setError('');
        setLoading(true);

        try {
            // Generate 6-digit OTP
            const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

            // Store OTP in sessionStorage for verification (valid for 10 minutes)
            const otpData = {
                code: otpCode,
                password: newPassword,
                expiresAt: Date.now() + 10 * 60 * 1000 // 10 minutes
            };
            sessionStorage.setItem('hoi_password_otp', JSON.stringify(otpData));

            // Send email via mailto (browser will open email client)
            // In production, use a proper email service
            const emailBody = `Your EduNorm HOI Password Setup OTP is: ${otpCode}\n\nThis OTP is valid for 10 minutes.\n\nIf you did not request this, please ignore this email.`;
            const mailtoLink = `mailto:help@edunorm.com?subject=HOI Password Setup OTP&body=${encodeURIComponent(emailBody)}`;

            // For demo, show OTP in console and alert
            console.log('HOI Password OTP:', otpCode);
            alert(`Demo Mode: Your OTP is ${otpCode}\n\nIn production, this will be sent to help@edunorm.com`);

            setSentOtp(true);
            setStep('verify');
        } catch (err) {
            setError('Failed to send OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        setError('');
        setLoading(true);

        try {
            const otpDataStr = sessionStorage.getItem('hoi_password_otp');
            if (!otpDataStr) {
                setError('OTP expired. Please request a new one.');
                setStep('set');
                return;
            }

            const otpData = JSON.parse(otpDataStr);

            // Check expiry
            if (Date.now() > otpData.expiresAt) {
                setError('OTP expired. Please request a new one.');
                sessionStorage.removeItem('hoi_password_otp');
                setStep('set');
                return;
            }

            // Verify OTP
            if (otp !== otpData.code) {
                setError('Invalid OTP. Please try again.');
                return;
            }

            // Save password to localStorage
            localStorage.setItem('hoi_password', otpData.password);

            // Clean up
            sessionStorage.removeItem('hoi_password_otp');

            setStep('success');
            setTimeout(() => {
                handleClose();
            }, 2000);

        } catch (err) {
            setError('Verification failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setStep('set');
        setNewPassword('');
        setConfirmPassword('');
        setOtp('');
        setError('');
        setSentOtp(false);
        onClose();
    };

    return (
        <div className="modal-overlay" onClick={handleClose}>
            <div className="hoi-password-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>🔒 HOI Password Settings</h3>
                    <button className="btn-icon btn-ghost" onClick={handleClose}>
                        <XIcon size={20} />
                    </button>
                </div>

                <div className="modal-body">
                    {step === 'set' && (
                        <>
                            <p className="modal-description">
                                Set a secure password for HOI (Head of Institute) menu access.
                            </p>

                            <div className="form-group">
                                <label>New Password</label>
                                <input
                                    type="password"
                                    className="input-field"
                                    placeholder="Enter new password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    minLength={6}
                                />
                            </div>

                            <div className="form-group">
                                <label>Confirm Password</label>
                                <input
                                    type="password"
                                    className="input-field"
                                    placeholder="Confirm new password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    minLength={6}
                                />
                            </div>

                            {error && <p className="error-msg">{error}</p>}

                            <button
                                className="btn btn-primary full-width"
                                onClick={handleSendOtp}
                                disabled={loading}
                            >
                                <MailIcon size={18} />
                                {loading ? 'Sending...' : 'Send OTP to Email'}
                            </button>

                            <p className="info-text">
                                An OTP will be sent for verification
                            </p>
                        </>
                    )}

                    {step === 'verify' && (
                        <>
                            <p className="modal-description">
                                ✅ OTP sent! Check your console (Demo Mode)
                            </p>

                            <div className="form-group">
                                <label>Enter OTP</label>
                                <input
                                    type="text"
                                    className="input-field otp-input"
                                    placeholder="000000"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                    maxLength={6}
                                    autoFocus
                                />
                            </div>

                            {error && <p className="error-msg">{error}</p>}

                            <div className="modal-actions">
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => {
                                        setStep('set');
                                        setOtp('');
                                        setError('');
                                    }}
                                >
                                    Back
                                </button>
                                <button
                                    className="btn btn-primary"
                                    onClick={handleVerifyOtp}
                                    disabled={loading || otp.length !== 6}
                                >
                                    {loading ? 'Verifying...' : 'Verify OTP'}
                                </button>
                            </div>

                            <p className="info-text">
                                OTP valid for 10 minutes
                            </p>
                        </>
                    )}

                    {step === 'success' && (
                        <div className="success-message">
                            <CheckIcon size={48} className="success-icon" />
                            <h4>Password Set Successfully!</h4>
                            <p>Your HOI password has been updated.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
