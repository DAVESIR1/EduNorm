import React, { useState, useRef } from 'react';
import { Mail, Lock, Phone, Eye, EyeOff, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import PhoneInput from 'react-phone-number-input';
import 'react-phone-number-input/style.css';
import { useAuth } from '../../contexts/AuthContext';
import './LoginPage.css';

export default function LoginPage() {
    const {
        loginWithEmail,
        registerWithEmail,
        loginWithGoogle,
        sendPhoneOTP,
        verifyPhoneOTP,
        error,
        clearError
    } = useAuth();

    const [mode, setMode] = useState('login'); // 'login' | 'register'
    const [authMethod, setAuthMethod] = useState('email'); // 'email' | 'phone'
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');

    // Email form state
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // Phone form state
    const [phoneNumber, setPhoneNumber] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [otp, setOtp] = useState('');

    const recaptchaRef = useRef(null);

    // School registration fields
    const [schoolContact, setSchoolContact] = useState('');
    const [govtSchoolCode, setGovtSchoolCode] = useState('');

    // Handle Email Login/Register
    const handleEmailSubmit = async (e) => {
        e.preventDefault();
        clearError();

        if (mode === 'register' && password !== confirmPassword) {
            return;
        }

        setLoading(true);
        try {
            const result = mode === 'login'
                ? await loginWithEmail(email, password)
                : await registerWithEmail(email, password);

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

    return (
        <div className="login-page">
            {/* Background Decorations */}
            <div className="login-bg">
                <div className="blob blob-1"></div>
                <div className="blob blob-2"></div>
                <div className="blob blob-3"></div>
            </div>

            <div className="login-container">
                {/* Logo & Title */}
                <div className="login-header">
                    <div className="login-logo">📚</div>
                    <h1>EduNorm</h1>
                    <p>Manage your school records securely</p>
                </div>


                {/* Auth Mode Tabs */}
                <div className="auth-tabs">
                    <button
                        className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
                        onClick={() => { setMode('login'); clearError(); }}
                    >
                        Login
                    </button>
                    <button
                        className={`auth-tab ${mode === 'register' ? 'active' : ''}`}
                        onClick={() => { setMode('register'); clearError(); }}
                    >
                        Register
                    </button>
                </div>

                {/* Auth Method Selector */}
                <div className="method-tabs">
                    <button
                        className={`method-tab ${authMethod === 'email' ? 'active' : ''}`}
                        onClick={() => { setAuthMethod('email'); clearError(); }}
                    >
                        <Mail size={16} />
                        Email
                    </button>
                    <button
                        className={`method-tab ${authMethod === 'phone' ? 'active' : ''}`}
                        onClick={() => { setAuthMethod('phone'); clearError(); setOtpSent(false); }}
                    >
                        <Phone size={16} />
                        Phone OTP
                    </button>
                </div>

                {/* Error/Success Messages */}
                {error && (
                    <div className="auth-message error">
                        <AlertCircle size={18} />
                        <span>{error}</span>
                    </div>
                )}
                {success && (
                    <div className="auth-message success">
                        <CheckCircle size={18} />
                        <span>{success}</span>
                    </div>
                )}

                {/* Email Form */}
                {authMethod === 'email' && (
                    <form className="auth-form" onSubmit={handleEmailSubmit}>
                        <div className="input-group">
                            <label className="input-label">
                                <Mail size={16} />
                                Email Address
                            </label>
                            <input
                                type="email"
                                className="input-field"
                                placeholder="your@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className="input-group">
                            <label className="input-label">
                                <Lock size={16} />
                                Password
                            </label>
                            <div className="password-input">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    className="input-field"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={6}
                                />
                                <button
                                    type="button"
                                    className="password-toggle"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {mode === 'register' && (
                            <>
                                <div className="input-group">
                                    <label className="input-label">
                                        <Phone size={16} />
                                        School Contact (Mobile)
                                    </label>
                                    <input
                                        type="tel"
                                        className="input-field"
                                        placeholder="School mobile number"
                                        value={schoolContact}
                                        onChange={(e) => setSchoolContact(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                        required
                                        maxLength={10}
                                    />
                                </div>
                                <div className="input-group">
                                    <label className="input-label">
                                        🏛️ Government School Code (DISE/UDISE)
                                    </label>
                                    <input
                                        type="text"
                                        className="input-field"
                                        placeholder="Enter DISE/UDISE code"
                                        value={govtSchoolCode}
                                        onChange={(e) => setGovtSchoolCode(e.target.value)}
                                        required
                                    />
                                    <span className="input-hint" style={{ fontSize: '11px', color: 'var(--gray-500)' }}>Your school's official government identification code</span>
                                </div>
                                <div className="input-group">
                                    <label className="input-label">
                                        <Lock size={16} />
                                        Confirm Password
                                    </label>
                                    <input
                                        type="password"
                                        className="input-field"
                                        placeholder="••••••••"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        minLength={6}
                                    />
                                    {confirmPassword && password !== confirmPassword && (
                                        <span className="input-error">Passwords don't match</span>
                                    )}
                                </div>
                            </>
                        )}

                        <button
                            type="submit"
                            className="btn btn-primary btn-lg auth-submit"
                            disabled={loading || (mode === 'register' && password !== confirmPassword)}
                        >
                            {loading ? <Loader2 className="spin" size={20} /> : null}
                            {mode === 'login' ? 'Login' : 'Create Account'}
                        </button>
                    </form>
                )}

                {/* Phone OTP Form */}
                {authMethod === 'phone' && (
                    <div className="auth-form">
                        {!otpSent ? (
                            <>
                                <div className="input-group">
                                    <label className="input-label">
                                        <Phone size={16} />
                                        Phone Number
                                    </label>
                                    <PhoneInput
                                        international
                                        defaultCountry="IN"
                                        value={phoneNumber}
                                        onChange={setPhoneNumber}
                                        className="phone-input"
                                    />
                                </div>
                                <button
                                    type="button"
                                    className="btn btn-primary btn-lg auth-submit"
                                    onClick={handleSendOTP}
                                    disabled={loading || !phoneNumber}
                                >
                                    {loading ? <Loader2 className="spin" size={20} /> : null}
                                    Send OTP
                                </button>
                            </>
                        ) : (
                            <form onSubmit={handleVerifyOTP}>
                                <div className="input-group">
                                    <label className="input-label">
                                        <Lock size={16} />
                                        Enter OTP
                                    </label>
                                    <input
                                        type="text"
                                        className="input-field otp-input"
                                        placeholder="123456"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                        maxLength={6}
                                        required
                                    />
                                    <p className="input-hint">OTP sent to {phoneNumber}</p>
                                </div>
                                <button
                                    type="submit"
                                    className="btn btn-primary btn-lg auth-submit"
                                    disabled={loading || otp.length !== 6}
                                >
                                    {loading ? <Loader2 className="spin" size={20} /> : null}
                                    Verify OTP
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-ghost resend-btn"
                                    onClick={() => { setOtpSent(false); setOtp(''); }}
                                >
                                    Change Phone Number
                                </button>
                            </form>
                        )}
                    </div>
                )}

                {/* Divider */}
                <div className="auth-divider">
                    <span>or continue with</span>
                </div>

                {/* Social Login */}
                <div className="social-buttons">
                    <button
                        className="social-btn google-btn"
                        onClick={handleGoogleSignIn}
                        disabled={loading}
                    >
                        <svg viewBox="0 0 24 24" width="20" height="20">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Google
                    </button>
                </div>

                {/* Recaptcha Container */}
                <div id="recaptcha-container" ref={recaptchaRef}></div>
            </div>
        </div>
    );
}
