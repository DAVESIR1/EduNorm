import React, { useState } from 'react';
import { Mail, Lock, Loader2, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import EduNormLogo from '../Common/EduNormLogo';
import './LoginPage.css';

export default function LoginPage() {
    const {
        loginWithEmail,
        registerWithEmail,
        loginWithGoogle,
        loginOffline,
        error,
        clearError
    } = useAuth();

    const [mode, setMode] = useState('login'); // 'login' | 'register'
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');

    // Form state
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // Handle Email Submit
    const handleEmailSubmit = async (e) => {
        e.preventDefault();
        clearError();

        if (mode === 'register' && password !== confirmPassword) {
            // Using dynamic import to keep LoginPage lightweight
            import('../Common/Toast').then(m => m.toast.error('Passwords do not match'));
            return;
        }

        setLoading(true);
        try {
            // Standard Auth - No role/school data yet. That comes later.
            const result = mode === 'login'
                ? await loginWithEmail(email, password)
                : await registerWithEmail(email, password, { role: null }); // Role null triggers wizard

            if (result.success) {
                setSuccess(mode === 'register' ? 'Account created! Redirecting...' : 'Welcome back!');
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

                <div className="auth-tabs">
                    <button className={`auth-tab ${mode === 'login' ? 'active' : ''}`} onClick={() => { setMode('login'); clearError(); }}>Login</button>
                    <button className={`auth-tab ${mode === 'register' ? 'active' : ''}`} onClick={() => { setMode('register'); clearError(); }}>New Account</button>
                </div>

                <div className="auth-form-container">
                    {/* Error/Success Messages */}
                    {error && <div className="auth-message error"><AlertCircle size={18} /><span>{error}</span></div>}
                    {success && <div className="auth-message success"><CheckCircle size={18} /><span>{success}</span></div>}

                    <form className="auth-form" onSubmit={handleEmailSubmit}>
                        <div className="input-group">
                            <label className="input-label"><Mail size={16} /> Email Address</label>
                            <input
                                type="email"
                                className="input-field"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="name@example.com"
                            />
                        </div>

                        <div className="input-group">
                            <label className="input-label"><Lock size={16} /> Password</label>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                className="input-field"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                                placeholder="Enter your password"
                            />
                        </div>

                        {mode === 'register' && (
                            <div className="input-group">
                                <label className="input-label"><Lock size={16} /> Confirm Password</label>
                                <input
                                    type="password"
                                    className="input-field"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    minLength={6}
                                    placeholder="Confirm your password"
                                />
                            </div>
                        )}

                        <button type="submit" className="btn btn-primary btn-lg auth-submit" disabled={loading}>
                            {loading ? <Loader2 className="spin" size={20} /> : (mode === 'login' ? 'Sign In' : 'Create Account')}
                        </button>
                    </form>

                    <div className="auth-divider"><span>or continue with</span></div>

                    <button className="social-btn google-btn" onClick={handleGoogleSignIn} disabled={loading}>
                        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" width={20} height={20} />
                        Google
                    </button>

                    <button
                        className="social-btn offline-btn"
                        onClick={loginOffline}
                        style={{ marginTop: '12px' }}
                    >
                        ☁️ Try Offline Mode
                    </button>
                </div>
            </div>
        </div>
    );
}
