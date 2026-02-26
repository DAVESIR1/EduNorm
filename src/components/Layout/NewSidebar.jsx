import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useMenu } from '../../contexts/MenuContext';
import { IconMap, PaletteIcon, LanguageIcon } from '../Icons/CustomIcons';
import { useAuth } from '../../contexts/AuthContext';
import { useUserTier } from '../../contexts/UserTierContext';
import { LogoutIcon, ShieldIcon, CrownIcon, SparklesIcon } from '../Icons/CustomIcons';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Sun, Palette, FileJson, FileSpreadsheet, Loader2 } from 'lucide-react';
import './NewSidebar.css';
import EduNormLogo from '../Common/EduNormLogo';

/* ── Password Modals (preserved) ── */
function PasswordModal({ isOpen, onClose, onSubmit }) {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        const success = onSubmit(password);
        if (!success) setError('Incorrect password');
        else { setPassword(''); setError(''); onClose(); }
    };

    if (!isOpen) return null;
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="password-modal" onClick={e => e.stopPropagation()}>
                <h3>🔒 HOI Access</h3>
                <p>Enter password to access Head of Institute menu</p>
                <form onSubmit={handleSubmit}>
                    <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter password" autoFocus className="input-field" />
                    {error && <span className="error-msg">{error}</span>}
                    <div className="modal-actions">
                        <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
                        <button type="submit" className="btn btn-primary">Unlock</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function HOIPasswordModal({ isOpen, onClose, userEmail }) {
    const [step, setStep] = useState('set');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const storageKey = `edunorm_hoi_password_${userEmail}`;

    const handleAction = (e) => {
        e.preventDefault();
        setError(''); setSuccess('');
        const savedHash = localStorage.getItem(storageKey);

        if (!savedHash || step === 'set') {
            if (!newPassword || newPassword.length < 4) { setError('Password must be at least 4 characters'); return; }
            if (newPassword !== confirmPassword) { setError('Passwords do not match'); return; }
            localStorage.setItem(storageKey, btoa(newPassword));
            setSuccess('✅ HOI Password has been set!');
            setTimeout(() => { onClose(); setSuccess(''); }, 1500);
        } else if (step === 'change') {
            if (currentPassword !== atob(savedHash)) { setError('Current password is incorrect'); return; }
            if (!newPassword || newPassword.length < 4) { setError('New password must be at least 4 characters'); return; }
            if (newPassword !== confirmPassword) { setError('Passwords do not match'); return; }
            localStorage.setItem(storageKey, btoa(newPassword));
            setSuccess('✅ Password changed!');
            setTimeout(() => { onClose(); setSuccess(''); }, 1500);
        }
    };

    if (!isOpen) return null;
    const hasExistingPassword = !!localStorage.getItem(storageKey);

    return (
        <div className="password-modal-overlay" onClick={onClose}>
            <div className="password-modal-content" onClick={e => e.stopPropagation()}>
                <h3 style={{ marginBottom: '1rem' }}>🔐 HOI Password Management</h3>
                {hasExistingPassword && (
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '1rem', justifyContent: 'center' }}>
                        <button className={`btn btn-sm ${step === 'set' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => { setStep('set'); setError(''); setSuccess(''); }}>Reset</button>
                        <button className={`btn btn-sm ${step === 'change' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => { setStep('change'); setError(''); setSuccess(''); }}>Change</button>
                    </div>
                )}
                <form onSubmit={handleAction} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {step === 'change' && hasExistingPassword && (
                        <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} placeholder="Current Password" className="input-field" autoFocus />
                    )}
                    <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder={step === 'change' ? 'New Password' : 'Set Password'} className="input-field" autoFocus={step === 'set'} />
                    <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirm Password" className="input-field" />
                    {error && <span style={{ color: '#ef4444' }}>{error}</span>}
                    {success && <span style={{ color: '#10b981', fontWeight: '600' }}>{success}</span>}
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
                        <button type="submit" className="btn btn-primary">{step === 'change' ? 'Change' : 'Set Password'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function ComingSoonBadge() {
    return <span className="soon-badge">SOON</span>;
}

/* ── Main Sidebar Component ── */
export default function NewSidebar({ isOpen, onToggle, onNavigate, onOpenAdmin, onOpenUpgrade, onLogout }) {
    const { user } = useAuth();
    const { isAdmin, isFree } = useUserTier();
    const { theme, changeTheme } = useTheme();
    const { menus, selectSubItem, activeSubItem, unlockHoi } = useMenu();
    const { getMenuItems } = useMenu();

    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [showHOIPassword, setShowHOIPassword] = useState(false);
    const [pendingNavigation, setPendingNavigation] = useState(null);
    const [hoveredMenu, setHoveredMenu] = useState(null);
    const [isRestoring, setIsRestoring] = useState(false);
    const [isImporting, setIsImporting] = useState(false);

    // Hover delay refs to prevent flicker
    const hoverTimeout = useRef(null);

    // Reactive mobile detection
    const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth < 768);
    useEffect(() => {
        const mq = window.matchMedia('(max-width: 767px)');
        const handler = (e) => setIsMobile(e.matches);
        mq.addEventListener('change', handler);
        setIsMobile(mq.matches);
        return () => mq.removeEventListener('change', handler);
    }, []);

    const handleMouseEnter = useCallback((menuId) => {
        if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
        setHoveredMenu(menuId);
    }, []);

    const handleMouseLeave = useCallback(() => {
        // 150ms delay before closing — prevents flicker when moving between icon and flyout
        hoverTimeout.current = setTimeout(() => setHoveredMenu(null), 150);
    }, []);

    // Toggle for mobile tap
    const handleIconClick = useCallback((menuId) => {
        setHoveredMenu(prev => prev === menuId ? null : menuId);
    }, []);

    // Close flyout when tapping outside on mobile
    useEffect(() => {
        if (!hoveredMenu) return;
        const handleTapOutside = (e) => {
            if (!e.target.closest('.rail-icon-group') && !e.target.closest('.rail-flyout')) {
                setHoveredMenu(null);
            }
        };
        document.addEventListener('pointerdown', handleTapOutside);
        return () => document.removeEventListener('pointerdown', handleTapOutside);
    }, [hoveredMenu]);

    const visibleMenus = Object.values(menus);

    const handleItemClick = useCallback((menuId, itemId) => {
        if (itemId === 'hoi-password') {
            setShowHOIPassword(true);
            setHoveredMenu(null);
            return;
        }
        const result = selectSubItem(menuId, itemId);
        if (result.requiresPassword) {
            setPendingNavigation({ menuId, itemId });
            setShowPasswordModal(true);
            setHoveredMenu(null);
            return;
        }
        if (result.success && onNavigate) {
            onNavigate(menuId, itemId);
            setHoveredMenu(null); // Close flyout after navigation
        }
    }, [selectSubItem, onNavigate]);

    const handleAutoRestore = async () => {
        setHoveredMenu(null);
        if (!window.confirm("🧬 START SOVEREIGN JSON RESTORATION?\n\nThis will merge data from known backups with zero-loss integrity. Proceed?")) return;
        setIsRestoring(true);
        try {
            const RestorationService = (await import('../../services/RestorationService')).default;
            const results = await RestorationService.performFullRestoration();
            if (results) {
                import('../Common/Toast').then(m => m.toast.success(`Restored ${results.summary.totalStudents} students`));
                setTimeout(() => window.location.reload(), 1500);
            }
        } catch (err) {
            console.error("Restoration Error:", err);
            import('../Common/Toast').then(m => m.toast.error('Restoration failed'));
        } finally { setIsRestoring(false); }
    };

    const handleExcelImport = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setHoveredMenu(null);
        let importStandard = window.prompt("Enter default Standard/Class (e.g. '10-A'):", "");
        if (!importStandard) return;
        setIsImporting(true);
        try {
            const SyncBackupLogic = (await import('../../features/SyncBackup/logic')).default;
            const db = await import('../../services/database');
            const students = await SyncBackupLogic.processExcelImport(file);
            if (students?.length > 0) {
                const studentsToImport = students.map(s => ({ ...s, standard: s.standard || importStandard }));
                await db.importAllData({ students: studentsToImport });
                import('../Common/Toast').then(m => m.toast.success(`Imported ${studentsToImport.length} students`));
                setTimeout(() => window.location.reload(), 1500);
            } else {
                import('../Common/Toast').then(m => m.toast.warning('No students found'));
            }
        } catch (err) {
            console.error("Excel Import Error:", err);
            import('../Common/Toast').then(m => m.toast.error('Import failed'));
        } finally { setIsImporting(false); }
    };

    const handlePasswordSubmit = (password) => {
        const success = unlockHoi(password);
        if (success && pendingNavigation) {
            selectSubItem(pendingNavigation.menuId, pendingNavigation.itemId);
            if (onNavigate) onNavigate(pendingNavigation.menuId, pendingNavigation.itemId);
            setPendingNavigation(null);
        }
        return success;
    };

    return (
        <>
            <aside className="sidebar-rail" style={{ gridArea: 'side' }}>
                {/* Logo */}
                <div className="rail-logo" title="EduNorm v2">
                    <img src="/edunorm-logo.png" alt="EduNorm" style={{ width: 36, height: 36, objectFit: 'contain', borderRadius: 8 }} />
                </div>

                {/* Menu Icons */}
                <nav className="rail-nav">
                    {visibleMenus.map(menu => {
                        const SectionIcon = IconMap[menu.icon] || IconMap[menu.id] || IconMap.default;
                        const items = getMenuItems(menu.id);
                        const isActive = items.some(item => item.id === activeSubItem);

                        return (
                            <div
                                key={menu.id}
                                className="rail-icon-group"
                                onMouseEnter={isMobile ? undefined : () => handleMouseEnter(menu.id)}
                                onMouseLeave={isMobile ? undefined : handleMouseLeave}
                            >
                                <button
                                    className={`rail-icon ${isActive ? 'active' : ''}`}
                                    title={menu.name}
                                    style={{ '--menu-color': menu.color }}
                                    onClick={() => handleIconClick(menu.id)}
                                >
                                    <SectionIcon size={22} />
                                </button>

                                {hoveredMenu === menu.id && (
                                    <div className="rail-flyout">
                                        <div className="flyout-inner">
                                            <div className="flyout-header" style={{ '--header-color': menu.color }}>
                                                <SectionIcon size={16} style={{ color: menu.color }} />
                                                <span>{menu.name}</span>
                                            </div>
                                            <div className="flyout-items">
                                                {items.map(item => {
                                                    const ItemIcon = IconMap[item.icon] || IconMap[item.id] || IconMap.default;
                                                    const isComingSoon = item.status === 'coming-soon';
                                                    return (
                                                        <button
                                                            key={item.id}
                                                            className={`flyout-btn ${activeSubItem === item.id ? 'active' : ''}`}
                                                            onClick={() => !isComingSoon && handleItemClick(menu.id, item.id)}
                                                            disabled={isComingSoon}
                                                        >
                                                            <ItemIcon size={16} />
                                                            <span>{item.name}</span>
                                                            {isComingSoon && <ComingSoonBadge />}
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </nav>

                {/* Bottom Tools */}
                <div className="rail-bottom">
                    {/* Tools flyout */}
                    <div
                        className="rail-icon-group"
                        onMouseEnter={isMobile ? undefined : () => handleMouseEnter('tools')}
                        onMouseLeave={isMobile ? undefined : handleMouseLeave}
                    >
                        <button className="rail-icon" title="Tools" onClick={() => handleIconClick('tools')}>
                            <FileJson size={20} />
                        </button>
                        {hoveredMenu === 'tools' && (
                            <div className="rail-flyout flyout-bottom">
                                <div className="flyout-inner">
                                    <div className="flyout-header" style={{ '--header-color': '#6366f1' }}>
                                        <FileJson size={16} style={{ color: '#6366f1' }} />
                                        <span>Sovereign Tools</span>
                                    </div>
                                    <div className="flyout-items">
                                        <button className="flyout-btn" onClick={handleAutoRestore} disabled={isRestoring}>
                                            {isRestoring ? <Loader2 size={16} className="animate-spin" /> : <FileJson size={16} />}
                                            <span>{isRestoring ? 'Restoring...' : 'Auto-Restore (JSON)'}</span>
                                        </button>
                                        <label className="flyout-btn" style={{ cursor: 'pointer' }}>
                                            {isImporting ? <Loader2 size={16} className="animate-spin" /> : <FileSpreadsheet size={16} />}
                                            <span>{isImporting ? 'Importing...' : 'Import from Excel'}</span>
                                            <input type="file" hidden accept=".xlsx,.xls" onChange={handleExcelImport} />
                                        </label>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Theme Toggle */}
                    <button
                        className="rail-icon"
                        title={theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                        onClick={() => changeTheme(theme === 'dark' ? 'light' : 'dark')}
                    >
                        {theme === 'dark' ? <Sun size={20} /> : <Palette size={20} />}
                    </button>

                    {/* User Avatar */}
                    {user && (
                        <div
                            className="rail-icon-group"
                            onMouseEnter={isMobile ? undefined : () => handleMouseEnter('user')}
                            onMouseLeave={isMobile ? undefined : handleMouseLeave}
                        >
                            <button
                                className={`rail-icon ${isAdmin ? 'rail-admin-avatar' : 'rail-avatar'}`}
                                title={user.displayName || user.email?.split('@')[0]}
                                onClick={() => handleIconClick('user')}
                            >
                                {isAdmin ? (
                                    <ShieldIcon size={22} />
                                ) : user.photoURL ? (
                                    <img src={user.photoURL} alt="" />
                                ) : (
                                    <IconMap.studentProfile size={20} />
                                )}
                            </button>
                            {hoveredMenu === 'user' && (
                                <div className="rail-flyout flyout-bottom">
                                    <div className="flyout-inner">
                                        <div className="flyout-header" style={{ '--header-color': '#6366f1' }}>
                                            <IconMap.studentProfile size={16} style={{ color: '#6366f1' }} />
                                            <span>{user.displayName || user.email?.split('@')[0] || 'User'}</span>
                                        </div>
                                        <div className="flyout-items">
                                            <div className="flyout-email">{user.email}</div>
                                            {isAdmin && (
                                                <button className="flyout-btn" onClick={() => { setHoveredMenu(null); onOpenAdmin?.(); }}>
                                                    <ShieldIcon size={16} /><span>Admin Panel</span>
                                                </button>
                                            )}
                                            {isFree && onOpenUpgrade && (
                                                <button className="flyout-btn flyout-accent" onClick={() => { setHoveredMenu(null); onOpenUpgrade(); }}>
                                                    <SparklesIcon size={16} /><span>Upgrade Pro</span>
                                                </button>
                                            )}
                                            <button className="flyout-btn flyout-danger" onClick={onLogout}>
                                                <LogoutIcon size={16} /><span>Logout</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </aside>

            <PasswordModal
                isOpen={showPasswordModal}
                onClose={() => { setShowPasswordModal(false); setPendingNavigation(null); }}
                onSubmit={handlePasswordSubmit}
            />
            <HOIPasswordModal
                isOpen={showHOIPassword}
                onClose={() => setShowHOIPassword(false)}
                userEmail={user?.email || ''}
            />
        </>
    );
}
