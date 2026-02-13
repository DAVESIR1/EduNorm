import React, { useState } from 'react';
import { useMenu, MENU_STRUCTURE } from '../../contexts/MenuContext';
import { IconMap, PaletteIcon, LanguageIcon } from '../Icons/CustomIcons';
import { useAuth } from '../../contexts/AuthContext';
import { useUserTier } from '../../contexts/UserTierContext';
import { LogoutIcon, ShieldIcon, CrownIcon, SparklesIcon } from '../Icons/CustomIcons';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../hooks/useDatabase';
import './NewSidebar.css';

// Password modal for HOI access
function PasswordModal({ isOpen, onClose, onSubmit }) {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        const success = onSubmit(password);
        if (!success) {
            setError('Incorrect password');
        } else {
            setPassword('');
            setError('');
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="password-modal" onClick={e => e.stopPropagation()}>
                <h3>🔒 HOI Access</h3>
                <p>Enter password to access Head of Institute menu</p>
                <form onSubmit={handleSubmit}>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter password"
                        autoFocus
                        className="input-field"
                    />
                    {error && <span className="error-msg">{error}</span>}
                    <div className="modal-actions">
                        <button type="button" onClick={onClose} className="btn btn-secondary">
                            Cancel
                        </button>
                        <button type="submit" className="btn btn-primary">
                            Unlock
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// HOI Password Change Modal with Email OTP
function HOIPasswordModal({ isOpen, onClose, userEmail }) {
    const [step, setStep] = useState('email'); // email → otp → password → success
    const [email, setEmail] = useState(userEmail || '');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [countdown, setCountdown] = useState(0);

    // Countdown timer for resend
    React.useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    const handleSendOTP = async () => {
        if (!email || !email.includes('@')) {
            setError('Please enter a valid email address');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'send', email })
            });
            const data = await res.json();
            if (data.success) {
                setStep('otp');
                setCountdown(60);
            } else {
                setError(data.error || 'Failed to send OTP');
            }
        } catch (err) {
            // If API not available, use local-only mode
            setError('Email service not available. Using local mode.');
            setTimeout(() => {
                setStep('password');
                setError('');
            }, 1500);
        }
        setLoading(false);
    };

    const handleVerifyOTP = async () => {
        if (otp.length !== 6) {
            setError('Please enter 6-digit OTP');
            return;
        }
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/send-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'verify', email, otp })
            });
            const data = await res.json();
            if (data.success && data.verified) {
                setStep('password');
            } else {
                setError(data.error || 'Invalid OTP');
            }
        } catch (err) {
            setError('Verification failed. Please try again.');
        }
        setLoading(false);
    };

    const handleSetPassword = () => {
        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        localStorage.setItem('hoi_password', newPassword);
        setStep('success');
        setTimeout(() => {
            onClose();
            setStep('email');
            setOtp('');
            setNewPassword('');
            setConfirmPassword('');
            setError('');
        }, 2000);
    };

    const handleClose = () => {
        onClose();
        setStep('email');
        setOtp('');
        setNewPassword('');
        setConfirmPassword('');
        setError('');
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={handleClose}>
            <div className="password-modal hoi-password-modal" onClick={e => e.stopPropagation()}>
                {step === 'email' && (
                    <>
                        <h3>🔐 Change HOI Password</h3>
                        <p>Enter your email to receive a verification code</p>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="your.email@example.com"
                            autoFocus
                            className="input-field"
                        />
                        {error && <span className="error-msg">{error}</span>}
                        <div className="modal-actions">
                            <button type="button" onClick={handleClose} className="btn btn-secondary">Cancel</button>
                            <button onClick={handleSendOTP} disabled={loading} className="btn btn-primary">
                                {loading ? '⏳ Sending...' : '📧 Send OTP'}
                            </button>
                        </div>
                    </>
                )}

                {step === 'otp' && (
                    <>
                        <h3>📩 Enter Verification Code</h3>
                        <p>We sent a 6-digit code to <strong>{email}</strong></p>
                        <input
                            type="text"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            placeholder="Enter 6-digit OTP"
                            autoFocus
                            className="input-field otp-input"
                            maxLength={6}
                            style={{ textAlign: 'center', letterSpacing: '8px', fontSize: '1.5rem', fontWeight: 'bold' }}
                        />
                        {error && <span className="error-msg">{error}</span>}
                        <div className="modal-actions">
                            <button
                                type="button"
                                onClick={handleSendOTP}
                                disabled={countdown > 0 || loading}
                                className="btn btn-secondary"
                            >
                                {countdown > 0 ? `Resend in ${countdown}s` : '🔄 Resend OTP'}
                            </button>
                            <button onClick={handleVerifyOTP} disabled={loading} className="btn btn-primary">
                                {loading ? '⏳ Verifying...' : '✅ Verify'}
                            </button>
                        </div>
                    </>
                )}

                {step === 'password' && (
                    <>
                        <h3>🔑 Set New Password</h3>
                        <p>Create a new HOI password (min 6 characters)</p>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="New password"
                            autoFocus
                            className="input-field"
                        />
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm password"
                            className="input-field"
                            style={{ marginTop: '8px' }}
                        />
                        {error && <span className="error-msg">{error}</span>}
                        <div className="modal-actions">
                            <button type="button" onClick={handleClose} className="btn btn-secondary">Cancel</button>
                            <button onClick={handleSetPassword} className="btn btn-primary">
                                🔒 Set Password
                            </button>
                        </div>
                    </>
                )}

                {step === 'success' && (
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '10px' }}>✅</div>
                        <h3>Password Updated!</h3>
                        <p>HOI password has been changed successfully.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

// Coming Soon Badge
function ComingSoonBadge() {
    return <span className="coming-soon-badge">Coming Soon</span>;
}

// Menu Item Component
function MenuItem({ item, menuId, isActive, onClick }) {
    const isComingSoon = item.status === 'coming-soon';
    const IconComponent = IconMap[item.icon] || IconMap.fileText;
    const { t } = useLanguage();

    return (
        <button
            className={`sidebar-menu-item ${isActive ? 'active' : ''} ${isComingSoon ? 'disabled' : ''}`}
            onClick={() => !isComingSoon && onClick(menuId, item.id)}
            disabled={isComingSoon}
        >
            <IconComponent size={18} />
            <span className="item-name">{item.nameKey ? t(item.nameKey, item.name) : item.name}</span>
            {isComingSoon && <ComingSoonBadge />}
        </button>
    );
}

// Main Menu Section Component
function MenuSection({ menu, isExpanded, onToggle, onItemClick, activeSubItem, isOpen }) {
    const { hoiUnlocked, getMenuItems } = useMenu();
    const { t } = useLanguage();
    const IconComponent = IconMap[menu.icon] || IconMap.menu;
    const items = getMenuItems(menu.id);

    const isLocked = menu.protected && !hoiUnlocked;

    return (
        <div className={`sidebar-menu-section ${isExpanded ? 'expanded' : ''}`}>
            <button
                className="sidebar-menu-header"
                onClick={() => onToggle(menu.id)}
                style={{ '--menu-color': menu.color }}
            >
                <div className="menu-header-left">
                    <IconComponent size={20} />
                    {isOpen && (
                        <>
                            <span className="menu-name">{menu.nameKey ? t(menu.nameKey, menu.name) : menu.name}</span>
                            {menu.fullName && (
                                <span className="menu-fullname">({menu.fullNameKey ? t(menu.fullNameKey, menu.fullName) : menu.fullName})</span>
                            )}
                        </>
                    )}
                </div>
                <div className="menu-header-right">
                    {isLocked && isOpen && <span className="lock-icon">🔒</span>}
                    {isOpen && <span className={`chevron ${isExpanded ? 'rotated' : ''}`}>▼</span>}
                </div>
            </button>

            {isExpanded && isOpen && (
                <div className="sidebar-menu-items">
                    {items.map(item => (
                        <MenuItem
                            key={item.id}
                            item={item}
                            menuId={menu.id}
                            isActive={activeSubItem === item.id}
                            onClick={onItemClick}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default function NewSidebar({ isOpen, onToggle, onNavigate, onOpenAdmin, onOpenUpgrade, onLogout }) {
    const { user } = useAuth();
    const { tier, isAdmin, isFree } = useUserTier();
    const { theme, changeTheme } = useTheme();
    const { language, changeLanguage, languages } = useLanguage();
    const {
        expandedMenus,
        toggleMenu,
        selectSubItem,
        activeSubItem,
        unlockHoi,
        hoiUnlocked
    } = useMenu();

    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [showHOIPassword, setShowHOIPassword] = useState(false);
    const [pendingNavigation, setPendingNavigation] = useState(null);

    // Determine if user is a student (simple check - can be enhanced)
    const isStudent = user && !isAdmin && (
        user.email?.toLowerCase().includes('student') ||
        user.phoneNumber?.startsWith('+919') // Students with phone auth
    );

    // Filter menus based on user role
    const getVisibleMenus = () => {
        const allMenus = Object.values(MENU_STRUCTURE);

        // Students only see student menu
        if (isStudent) {
            return allMenus.filter(menu => menu.id === 'student');
        }

        // All other users see all menus
        return allMenus;
    };

    const visibleMenus = getVisibleMenus();

    const handleItemClick = (menuId, itemId) => {
        // Special: HOI password opens modal instead of navigating
        if (itemId === 'hoi-password') {
            setShowHOIPassword(true);
            return;
        }

        const result = selectSubItem(menuId, itemId);

        if (result.requiresPassword) {
            setPendingNavigation({ menuId, itemId });
            setShowPasswordModal(true);
            return;
        }

        if (result.success && onNavigate) {
            onNavigate(menuId, itemId);
        }
    };

    const handlePasswordSubmit = (password) => {
        const success = unlockHoi(password);
        if (success && pendingNavigation) {
            selectSubItem(pendingNavigation.menuId, pendingNavigation.itemId);
            if (onNavigate) {
                onNavigate(pendingNavigation.menuId, pendingNavigation.itemId);
            }
            setPendingNavigation(null);
        }
        return success;
    };

    return (
        <>
            {/* Mobile backdrop overlay */}
            {isOpen && (
                <div
                    className="sidebar-backdrop"
                    onClick={onToggle}
                    aria-hidden="true"
                />
            )}

            <aside className={`new-sidebar ${isOpen ? 'open' : 'collapsed'}`}>
                {/* Header */}
                <div className="new-sidebar-header">
                    <div className="sidebar-logo">
                        <img src="/edunorm-logo.png" alt="EduNorm" className="logo-image" />
                        {isOpen && <span className="logo-text display-font">EduNorm</span>}
                    </div>
                </div>

                {/* User Info */}
                {isOpen && user && (
                    <div className="new-sidebar-user">
                        <div className="user-avatar">
                            {user.photoURL ? (
                                <img src={user.photoURL} alt="User" />
                            ) : (
                                <IconMap.studentProfile size={20} />
                            )}
                        </div>
                        <div className="user-info">
                            <span className="user-name">{user.displayName || user.email?.split('@')[0] || 'User'}</span>
                            <span className="user-email">{user.email || user.phoneNumber || ''}</span>
                        </div>
                        <span className={`tier-badge tier-${tier.toLowerCase()}`}>
                            {tier === 'ADMIN' && <ShieldIcon size={12} />}
                            {tier === 'PREMIUM' && <CrownIcon size={12} />}
                            {tier}
                        </span>
                        <button className="btn-icon btn-ghost logout-btn" onClick={onLogout} title="Logout">
                            <LogoutIcon size={18} />
                        </button>
                    </div>
                )}

                {/* Tier Actions - Don't show to students */}
                {isOpen && !isStudent && (
                    <div className="tier-actions">
                        {isAdmin && onOpenAdmin && (
                            <button className="tier-action-btn admin-btn" onClick={onOpenAdmin}>
                                <ShieldIcon size={16} />
                                Admin Panel
                            </button>
                        )}
                        {isFree && onOpenUpgrade && (
                            <button className="tier-action-btn upgrade-btn" onClick={onOpenUpgrade}>
                                <SparklesIcon size={16} />
                                Upgrade to Premium
                            </button>
                        )}
                    </div>
                )}

                {/* Theme & Language Selectors */}
                {isOpen && (
                    <div className="sidebar-settings">
                        <div className="setting-row">
                            <PaletteIcon size={16} />
                            <span>Theme:</span>
                            <select
                                value={theme || 'classic'}
                                onChange={(e) => changeTheme(e.target.value)}
                                className="theme-select"
                            >
                                <option value="classic">Classic</option>
                                <option value="modern">Modern</option>
                                <option value="dark">Dark</option>
                            </select>
                        </div>
                        <div className="setting-row">
                            <LanguageIcon size={16} />
                            <span>Language:</span>
                            <select
                                value={language || 'en'}
                                onChange={(e) => changeLanguage(e.target.value)}
                                className="theme-select"
                            >
                                {Object.entries(languages).map(([code, lang]) => (
                                    <option key={code} value={code}>
                                        {lang.flag} {lang.nativeName}
                                    </option>
                                ))}
                            </select>
                        </div>

                    </div>
                )}

                {/* Menu Sections */}
                <div className="new-sidebar-content">
                    <div className="menu-sections">
                        {visibleMenus.map(menu => (
                            <MenuSection
                                key={menu.id}
                                menu={menu}
                                isExpanded={expandedMenus.includes(menu.id)}
                                onToggle={toggleMenu}
                                onItemClick={handleItemClick}
                                activeSubItem={activeSubItem}
                                isOpen={isOpen}
                            />
                        ))}
                    </div>

                    {/* Help & Suggestions - always at bottom */}
                    {isOpen && (
                        <div className="sidebar-bottom-actions">
                            <button
                                className={`sidebar-help-btn ${activeSubItem === 'usage-instructions' ? 'active' : ''}`}
                                onClick={() => handleItemClick('other', 'usage-instructions')}
                                style={{ marginBottom: '8px' }}
                            >
                                <IconMap.bookOpen size={18} />
                                <span>Usage Instructions</span>
                            </button>
                            <button
                                className={`sidebar-help-btn ${activeSubItem === 'help-support' ? 'active' : ''}`}
                                onClick={() => handleItemClick('other', 'help-support')}
                            >
                                <IconMap.messageCircle size={18} />
                                <span>Help & Suggestions</span>
                            </button>
                        </div>
                    )}
                </div>

                <PasswordModal
                    isOpen={showPasswordModal}
                    onClose={() => {
                        setShowPasswordModal(false);
                        setPendingNavigation(null);
                    }}
                    onSubmit={handlePasswordSubmit}
                />
                <HOIPasswordModal
                    isOpen={showHOIPassword}
                    onClose={() => setShowHOIPassword(false)}
                    userEmail={user?.email || ''}
                />
            </aside>
        </>
    );
}
