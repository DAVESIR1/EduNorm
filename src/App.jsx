import React, { useState, useEffect, useCallback, useMemo } from 'react';
import NewSidebar from './components/Layout/NewSidebar';
import StepWizard, { DATA_FIELDS } from './components/DataEntry/StepWizard';
import ProfileViewer from './components/Profile/ProfileViewer';
import GeneralRegister from './components/Ledger/GeneralRegister';
import BackupRestore from './components/Backup/BackupRestore';
import CloudBackup from './components/Backup/CloudBackup';
import LoginPage from './components/Auth/LoginPage';
import AdminPanel from './components/Admin/AdminPanel';
import CertificateGenerator from './components/Features/CertificateGenerator';
import AnalyticsDashboard from './components/Features/AnalyticsDashboard';
import QRAttendance from './components/Features/QRAttendance';
import SmartSearch from './components/Features/SmartSearch';
import DocumentScanner from './components/Features/DocumentScanner';
import VoiceInput from './components/Features/VoiceInput';
import FamilyTree from './components/Features/FamilyTree';
import ProgressTimeline from './components/Features/ProgressTimeline';
import WhatsAppMessenger from './components/Features/WhatsAppMessenger';
import PhotoEnhancement from './components/Features/PhotoEnhancement';
import { AdPlacement } from './components/Ads/AdBanner';
import UpgradeModal from './components/Premium/UpgradeModal';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { UserTierProvider, useUserTier } from './contexts/UserTierContext';
import { LanguageProvider } from './contexts/LanguageContext';
import UndoRedoBar from './components/Common/UndoRedoBar';
import { useMenu } from './contexts/MenuContext';
import SchoolProfile from './components/School/SchoolProfile';
import StaffInfo from './components/HOI/StaffInfo';
import HOIDiary from './components/HOI/HOIDiary';
import CustomWindowCreator from './components/Common/CustomWindowCreator';
import ComingSoonPage from './components/Common/ComingSoonPage';
import SalaryBook from './components/Teacher/SalaryBook';
import TeacherProfile from './components/Teacher/TeacherProfile';
import TeachersProfileList from './components/School/TeachersProfileList';
import StudentLogin from './components/Student/StudentLogin';
import {
    useSettings,
    useStudents,
    useStandards,
    useCustomFields,
    useLedger,
    useTheme
} from './hooks/useDatabase';
import * as db from './services/database';
import * as LocalBackupService from './services/LocalBackupService';
import * as MandatoryBackupService from './services/MandatoryBackupService';
import * as CloudSyncService from './services/CloudSyncService';
import { selfRepairCheck, isIPBlocked } from './services/SecurityManager';
import { Menu, Users, FileSpreadsheet, Sparkles, Download, Share2, Maximize2, Minimize2, Cloud, CloudOff, Check, Loader } from 'lucide-react';
import './App.css';

// Main App Content (wrapped in auth and tier providers)
function AppContent() {
    const { isAuthenticated, loading: authLoading, user, logout } = useAuth();
    const { tier, isAdmin, isFree, setShowUpgradeModal } = useUserTier();
    // State
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [showProfile, setShowProfile] = useState(false);
    const [showLedger, setShowLedger] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [editingStudent, setEditingStudent] = useState(null);
    const [isReady, setIsReady] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isFormMaximized, setIsFormMaximized] = useState(false);
    const [showBackup, setShowBackup] = useState(false);
    const [showAdmin, setShowAdmin] = useState(false);
    const [showCertificate, setShowCertificate] = useState(false);
    const [showAnalytics, setShowAnalytics] = useState(false);
    const [showQRAttendance, setShowQRAttendance] = useState(false);
    const [showSmartSearch, setShowSmartSearch] = useState(false);
    const [showCloudBackup, setShowCloudBackup] = useState(false);
    const [showDocScanner, setShowDocScanner] = useState(false);
    const [showVoiceInput, setShowVoiceInput] = useState(false);
    const [showFamilyTree, setShowFamilyTree] = useState(false);
    const [showTimeline, setShowTimeline] = useState(false);
    const [showWhatsApp, setShowWhatsApp] = useState(false);
    const [showPhotoEnhance, setShowPhotoEnhance] = useState(false);
    const [backupAction, setBackupAction] = useState('export');
    const [syncStatus, setSyncStatus] = useState(null);

    // Menu state for 5-menu navigation
    const { activeMenu, activeSubItem, selectSubItem } = useMenu();
    const [showMenuContent, setShowMenuContent] = useState(false);
    const [menuContentType, setMenuContentType] = useState(null);

    // Hooks
    const { settings, updateSetting, loading: settingsLoading } = useSettings();
    const { standards, addStandard, deleteStandard, loading: standardsLoading } = useStandards();
    const { fields, addField, updateField, deleteField, loading: fieldsLoading } = useCustomFields();
    const { ledger, refreshLedger } = useLedger();
    const { theme, changeTheme } = useTheme();

    // Local state for sidebar inputs
    const [schoolName, setSchoolName] = useState('');
    const [schoolLogo, setSchoolLogo] = useState('');
    const [schoolContact, setSchoolContact] = useState('');
    const [schoolEmail, setSchoolEmail] = useState('');
    const [teacherName, setTeacherName] = useState('');
    const [selectedStandard, setSelectedStandard] = useState('');

    // Students for selected standard
    const {
        students,
        addStudent,
        updateStudent,
        refreshStudents,
        loading: studentsLoading
    } = useStudents(selectedStandard);

    // Initialize from settings
    useEffect(() => {
        if (!settingsLoading) {
            setSchoolName(settings.schoolName || '');
            setSchoolLogo(settings.schoolLogo || '');
            setSchoolContact(settings.schoolContact || '');
            setSchoolEmail(settings.schoolEmail || '');
            setTeacherName(settings.teacherName || '');
            setSelectedStandard(settings.selectedStandard || '');
            setIsReady(true);
        }
    }, [settings, settingsLoading]);

    // ESC key handler for maximized form and menu content
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                if (isFormMaximized) setIsFormMaximized(false);
                if (showMenuContent) { setShowMenuContent(false); setMenuContentType(null); }
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [isFormMaximized, showMenuContent]);

    // Auto-sync on login (like Google Contacts)
    useEffect(() => {
        const performAutoSync = async () => {
            if (user?.uid && isReady && !user.isOffline) {
                console.log('Starting auto-sync on login...');
                setSyncStatus({ type: 'syncing', message: 'Syncing with cloud...' });

                try {
                    const result = await CloudSyncService.autoSyncOnLogin(user.uid);
                    console.log('Auto-sync result:', result);

                    if (result.success) {
                        if (result.action === 'restored') {
                            setSyncStatus({
                                type: 'success',
                                message: `Restored ${result.studentCount || 0} students from cloud!`
                            });
                            // Refresh data after restore
                            await refreshStudents();
                            await refreshLedger();
                        } else if (result.action === 'backed_up' || result.action === 'first_backup') {
                            setSyncStatus({ type: 'success', message: 'Data synced to cloud!' });
                        } else {
                            setSyncStatus(null); // Nothing to show
                        }
                    }
                } catch (error) {
                    console.error('Auto-sync failed:', error);
                    setSyncStatus({ type: 'error', message: 'Sync failed - data safe locally' });
                }

                // Clear status after 3 seconds
                setTimeout(() => setSyncStatus(null), 3000);
            }
        };

        performAutoSync();
    }, [user?.uid, isReady]);

    // Initialize mandatory backup system
    useEffect(() => {
        const initBackupSystem = async () => {
            try {
                // Initialize mandatory backup (periodic, unload, visibility)
                MandatoryBackupService.initMandatoryBackup();

                // Run security self-repair on startup
                try {
                    selfRepairCheck();
                    const blocked = await isIPBlocked();
                    if (blocked) {
                        console.warn('Security: This IP is currently blocked.');
                    }
                } catch (secErr) {
                    console.warn('SecurityManager startup check skipped:', secErr.message);
                }

                // Check if version changed (potential data loss scenario)
                if (LocalBackupService.hasVersionChanged()) {
                    console.log('App version changed - checking for data recovery...');
                    const restoreResult = await MandatoryBackupService.restoreFromBackup(user?.uid);
                    if (restoreResult.success) {
                        console.log('Data restored from:', restoreResult.source);
                    }
                }

                // Create local backup always
                const allData = await db.exportAllData();
                if (allData && (allData.students?.length > 0 || allData.settings)) {
                    LocalBackupService.createLocalBackup(allData);
                }

                // Save current version
                LocalBackupService.saveAppVersion();

                console.log('Backup system initialized');
            } catch (error) {
                console.error('Backup system init failed:', error);
            }
        };

        if (isReady) {
            initBackupSystem();
        }

        return () => MandatoryBackupService.cleanup();
    }, [isReady, user?.uid]);

    // Save settings
    const handleSaveSettings = useCallback(async () => {
        await updateSetting('schoolName', schoolName);
        await updateSetting('schoolLogo', schoolLogo);
        await updateSetting('schoolContact', schoolContact);
        await updateSetting('schoolEmail', schoolEmail);
        await updateSetting('teacherName', teacherName);
        await updateSetting('selectedStandard', selectedStandard);
        // Trigger backup after settings change
        MandatoryBackupService.triggerBackupOnChange();
        // Schedule cloud backup
        if (user?.uid) CloudSyncService.scheduleBackup(user.uid);
        alert('Settings saved successfully!');
    }, [schoolName, schoolLogo, schoolContact, schoolEmail, teacherName, selectedStandard, updateSetting, user?.uid]);

    // Add new student
    const handleAddStudent = useCallback(async (studentData) => {
        if (editingStudent) {
            await updateStudent(editingStudent.id, studentData);
            setEditingStudent(null);
            setEditMode(false);
        } else {
            await addStudent({
                ...studentData,
                standard: selectedStandard
            });
        }
        await refreshStudents();
        await refreshLedger();
        // Trigger backup after student data change
        MandatoryBackupService.triggerBackupOnChange();
        // Schedule cloud backup
        if (user?.uid) CloudSyncService.scheduleBackup(user.uid);
    }, [addStudent, updateStudent, editingStudent, selectedStandard, refreshStudents, refreshLedger, user?.uid]);

    // Class upgrade
    const handleUpgradeClass = useCallback(async () => {
        if (!selectedStandard) {
            alert('Please select a standard first');
            return;
        }

        const newStandard = prompt('Enter new standard name (e.g., "Standard 4-A"):');
        if (newStandard) {
            const count = await db.upgradeClass(selectedStandard, newStandard);
            alert(`Upgraded ${count} students to ${newStandard}`);
            await addStandard({ id: newStandard, name: newStandard });
            setSelectedStandard(newStandard);
            await refreshStudents();
        }
    }, [selectedStandard, addStandard, refreshStudents]);

    // Class downgrade
    const handleDowngradeClass = useCallback(async () => {
        const previousStandard = students[0]?.previousStandard;
        if (previousStandard) {
            const confirm = window.confirm(`Downgrade to ${previousStandard}?`);
            if (confirm) {
                await db.upgradeClass(selectedStandard, previousStandard);
                setSelectedStandard(previousStandard);
                await refreshStudents();
            }
        } else {
            alert('No previous standard found');
        }
    }, [selectedStandard, students, refreshStudents]);

    // Delete class/standard
    const handleDeleteStandard = useCallback(async (standardId) => {
        try {
            // Delete all students in this class first
            const studentsInClass = await db.getStudentsByStandard(standardId);
            for (const student of studentsInClass) {
                await db.deleteStudent(student.id);
            }
            // Delete the standard
            await deleteStandard(standardId);
            // Reset selection
            setSelectedStandard('');
            await refreshStudents();
            alert(`Class "${standardId}" deleted with ${studentsInClass.length} students`);
        } catch (error) {
            console.error('Failed to delete class:', error);
            alert('Failed to delete class');
        }
    }, [deleteStandard, refreshStudents]);

    // Handle menu navigation from MainMenu component
    const handleMenuNavigate = useCallback((menuId, itemId) => {
        console.log('Menu navigate:', menuId, itemId);
        setMenuContentType(itemId);
        setShowMenuContent(true);
        // Close other modals when menu is opened
        setShowProfile(false);
        setShowLedger(false);
        setShowCertificate(false);
        setShowAnalytics(false);
        setShowCloudBackup(false);
    }, []);

    // Render menu content based on activeSubItem
    const renderMenuContent = () => {
        if (!showMenuContent || !menuContentType) return null;

        switch (menuContentType) {
            // School menu items
            case 'school-profile':
                return <SchoolProfile
                    schoolName={schoolName}
                    schoolContact={schoolContact}
                    schoolEmail={schoolEmail}
                    schoolLogo={schoolLogo}
                />;
            case 'general-register':
                setShowLedger(true);
                setShowMenuContent(false);
                return null;
            case 'student-profile':
                setShowProfile(true);
                setShowMenuContent(false);
                return null;
            case 'certificate':
                setShowCertificate(true);
                setShowMenuContent(false);
                return null;
            case 'id-card':
                // Open profile viewer which has ID card tab
                setShowProfile(true);
                setShowMenuContent(false);
                return null;
            case 'teachers-profile':
                return <TeachersProfileList />;
            case 'custom-window':
            case 'custom-window-hoi':
            case 'custom-window-teacher':
                return <CustomWindowCreator
                    menuId={activeMenu}
                    onSave={() => setShowMenuContent(false)}
                    onCancel={() => setShowMenuContent(false)}
                />;

            // HOI menu items
            case 'staff-info':
                return <StaffInfo />;
            case 'hoi-diary':
                return <HOIDiary />;

            // Teacher menu items
            case 'self-profile':
                return <TeacherProfile />;
            case 'salary-book':
                return <SalaryBook />;
            case 'special-features':
                return (
                    <div style={{ padding: '20px' }}>
                        <h2 style={{ marginBottom: '16px', fontSize: '1.5rem' }}>✨ Special Features</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                            {[
                                { icon: '📷', name: 'Document Scanner', key: 'doc-scanner', onClick: () => { setShowDocScanner(true); setShowMenuContent(false); } },
                                { icon: '🎙️', name: 'Voice Input', key: 'voice', onClick: () => { setShowVoiceInput(true); setShowMenuContent(false); } },
                                { icon: '📊', name: 'Analytics Dashboard', key: 'analytics', onClick: () => { setShowAnalytics(true); setShowMenuContent(false); } },
                                { icon: '📱', name: 'QR Attendance', key: 'qr', onClick: () => { setShowQRAttendance(true); setShowMenuContent(false); } },
                                { icon: '🔍', name: 'Smart Search', key: 'search', onClick: () => { setShowSmartSearch(true); setShowMenuContent(false); } },
                                { icon: '🖼️', name: 'Photo Enhancement', key: 'photo', onClick: () => { setShowPhotoEnhance(true); setShowMenuContent(false); } },
                                { icon: '👨‍👩‍👧', name: 'Family Tree', key: 'family', onClick: () => { setShowFamilyTree(true); setShowMenuContent(false); } },
                                { icon: '📈', name: 'Progress Timeline', key: 'timeline', onClick: () => { setShowTimeline(true); setShowMenuContent(false); } },
                                { icon: '💬', name: 'WhatsApp Messenger', key: 'whatsapp', onClick: () => { setShowWhatsApp(true); setShowMenuContent(false); } },
                            ].map(f => (
                                <button key={f.key} onClick={f.onClick} style={{
                                    display: 'flex', alignItems: 'center', gap: '10px', padding: '16px',
                                    borderRadius: '12px', border: '1px solid var(--border-color, #e2e8f0)',
                                    background: 'var(--bg-secondary, #f8fafc)', cursor: 'pointer',
                                    fontSize: '0.95rem', transition: 'all 0.2s',
                                }}>
                                    <span style={{ fontSize: '1.5rem' }}>{f.icon}</span>
                                    {f.name}
                                </button>
                            ))}
                        </div>
                    </div>
                );
            case 'class-management':
            case 'class-management-teacher':
                // Already handled by sidebar
                setShowMenuContent(false);
                return null;

            // Student menu items
            case 'student-login':
                return <StudentLogin onBack={() => { setShowMenuContent(false); setMenuContentType(null); }} />;
            case 'student-view-profile':
                setShowProfile(true);
                setShowMenuContent(false);
                return null;
            case 'download-id-card':
                // ID Card is part of the profile viewer
                setShowProfile(true);
                setShowMenuContent(false);
                return null;

            // Coming Soon items
            case 'dead-stock':
            case 'audit-register':
            case 'bill-register':
            case 'news-circulars':
            case 'programs-events':
            case 'activity-gallery':
            case 'self-update':
            case 'download-certificate':
            case 'qa-chat':
                return <ComingSoonPage featureId={menuContentType} onBack={() => { setShowMenuContent(false); setMenuContentType(null); }} />;

            default:
                return <ComingSoonPage featureId={menuContentType} onBack={() => { setShowMenuContent(false); setMenuContentType(null); }} />;
        }
    };

    // Search
    const handleSearch = useCallback(async (query) => {
        setSearchQuery(query);
        if (query.trim()) {
            const results = await db.searchStudents(query);
            setSearchResults(results.map((s, i) => ({ ...s, ledgerNo: i + 1 })));
        } else {
            setSearchResults([]);
        }
    }, []);

    // Edit mode toggle
    const handleEditMode = useCallback(() => {
        if (editMode) {
            setEditingStudent(null);
        }
        setEditMode(!editMode);
    }, [editMode]);

    // Share/Export - handles different backup actions
    const handleShare = useCallback((action) => {
        // 'backup' and 'restore' actions handled via sidebar CloudBackup button
        setBackupAction(action); // 'export', 'import', or 'share'
        setShowBackup(true);
    }, []);

    // Import complete callback
    const handleImportComplete = useCallback(async () => {
        await refreshStudents();
        await refreshLedger();
    }, [refreshStudents, refreshLedger]);

    const handleAddDataBox = useCallback(async (fieldData) => {
        await addField(fieldData);
    }, [addField]);

    const handleRemoveDataBox = useCallback(async (fieldId) => {
        // For custom fields, delete from database
        const customField = fields.find(f => f.id === parseInt(fieldId) || f.key === fieldId);
        if (customField) {
            await deleteField(customField.id);
        }
        // Note: Built-in fields can't be removed, just hidden in a future feature
    }, [deleteField, fields]);

    const handleRenameDataBox = useCallback(async (fieldId, newName) => {
        // For custom fields, update in database
        const customField = fields.find(f => f.id === parseInt(fieldId) || f.key === fieldId);
        if (customField) {
            await updateField(customField.id, { name: newName });
        } else {
            // For built-in fields, store rename mapping in settings
            const fieldRenames = settings.fieldRenames || {};
            fieldRenames[fieldId] = newName;
            await updateSetting('fieldRenames', fieldRenames);
        }
        // Trigger backup after field rename
        MandatoryBackupService.triggerBackupOnChange();
        alert(`Field renamed to "${newName}" successfully!`);
    }, [updateField, fields, settings.fieldRenames, updateSetting]);

    // Combine built-in and custom fields for dropdown (apply renames from settings)
    const allFields = useMemo(() => {
        const fieldRenames = settings.fieldRenames || {};
        const builtInFields = DATA_FIELDS.flatMap(step =>
            step.fields.map(f => ({
                key: f.key,
                label: fieldRenames[f.key] || f.label, // Use renamed label if exists
                type: f.type,
                builtIn: true
            }))
        );
        const customFieldsList = fields.map(f => ({ key: f.id.toString(), label: f.name, type: f.type, builtIn: false }));
        return [...builtInFields, ...customFieldsList];
    }, [fields, settings.fieldRenames]);

    // Handle import from Excel (opens backup modal on import tab)
    const handleImportExcel = useCallback(() => {
        setShowBackup(true);
        // The BackupRestore modal will show the Import tab
    }, []);

    // Auth loading state - instantly visible skeleton (no CSS variable dependency)
    if (authLoading) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#f8f9fa',
                flexDirection: 'column',
                gap: '16px'
            }}>
                <div className="auth-spinner" style={{
                    width: '48px',
                    height: '48px',
                    border: '4px solid #e5e7eb',
                    borderTop: '4px solid #7C3AED',
                    borderRadius: '50%',
                    animation: 'authSpin 0.8s linear infinite'
                }} />
                <p style={{ color: '#6b7280', fontSize: '14px', fontFamily: 'system-ui, sans-serif' }}>
                    Loading...
                </p>
                <style>{`
                    @keyframes authSpin {
                        to { transform: rotate(360deg); }
                    }
                    @media (prefers-color-scheme: dark) {
                        .auth-spinner { border-color: #374151 !important; border-top-color: #8B5CF6 !important; }
                    }
                `}</style>
            </div>
        );
    }


    // Show login page if not authenticated
    if (!isAuthenticated) {
        return <LoginPage />;
    }

    // Loading state
    if (!isReady) {
        return (
            <div className="loading-screen">
                <div className="loading-content">
                    <div className="loading-spinner animate-pulse">📚</div>
                    <h2 className="display-font gradient-text">Loading EduNorm...</h2>
                </div>
            </div>
        );
    }

    return (
        <div className="app" data-theme={theme}>
            {/* Background decorations */}
            <div className="app-decorations">
                <div className="blob blob-1"></div>
                <div className="blob blob-2"></div>
                <div className="blob blob-3"></div>
            </div>

            {/* Sidebar toggle button - always visible */}
            <button
                className="sidebar-toggle-btn"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                title={sidebarOpen ? 'Close Menu' : 'Open Menu'}
            >
                <Menu size={24} />
            </button>

            {/* New Sidebar with 5-Category Menu */}
            <NewSidebar
                isOpen={sidebarOpen}
                onToggle={() => setSidebarOpen(!sidebarOpen)}
                onNavigate={handleMenuNavigate}
                onOpenAdmin={() => setShowAdmin(true)}
                onOpenUpgrade={() => setShowUpgradeModal(true)}
                onLogout={logout}
            />

            {/* Main Content */}
            <main className={`main-content ${sidebarOpen ? 'sidebar-open' : 'sidebar-collapsed'}`}>
                {/* Cloud Sync Status Toast */}
                {syncStatus && (
                    <div className={`sync-toast sync-${syncStatus.type}`}>
                        {syncStatus.type === 'syncing' && <Loader size={16} className="spin" />}
                        {syncStatus.type === 'success' && <Check size={16} />}
                        {syncStatus.type === 'error' && <CloudOff size={16} />}
                        <span>{syncStatus.message}</span>
                    </div>
                )}
                {/* Header */}
                <header className="main-header">
                    <div className="header-info">
                        <h1 className="display-font gradient-text">
                            <img src="/edunorm-logo.png" alt="EduNorm" style={{ width: 32, height: 32, borderRadius: 8, marginRight: 8, verticalAlign: 'middle' }} />
                            EduNorm
                        </h1>
                        {selectedStandard && (
                            <div className="header-meta">
                                <span className="badge badge-primary">{selectedStandard}</span>
                                {teacherName && <span className="badge badge-info">Teacher: {teacherName}</span>}
                                <span className="badge badge-success">{students.length} Students</span>
                            </div>
                        )}
                    </div>

                    <div className="header-actions">
                        <button
                            className="btn btn-secondary"
                            onClick={() => setShowLedger(true)}
                        >
                            <FileSpreadsheet size={18} />
                            View Register
                        </button>
                        <button
                            className="btn btn-primary"
                            onClick={() => setShowProfile(true)}
                        >
                            <Users size={18} />
                            Student Profile
                        </button>
                    </div>
                </header>

                {/* Top Ad Banner - Only show when content is present */}
                {(selectedStandard || showMenuContent) && (
                    <div className="top-ad-wrapper">
                        <AdPlacement type="banner" />
                    </div>
                )}

                {/* Edit Mode Student Selector */}
                {editMode && selectedStandard && students.length > 0 && (
                    <div className="edit-mode-bar">
                        <span className="edit-mode-label">📝 Edit Mode Active - Select student to edit:</span>
                        <select
                            className="input-field"
                            value={editingStudent?.id || ''}
                            onChange={(e) => {
                                const student = students.find(s => s.id == e.target.value);
                                setEditingStudent(student || null);
                            }}
                        >
                            <option value="">Select student to edit...</option>
                            {students.map(s => (
                                <option key={s.id} value={s.id}>
                                    {s.name || s.nameEnglish} - GR: {s.grNo}
                                </option>
                            ))}
                        </select>
                        <button
                            className="btn btn-ghost"
                            onClick={() => {
                                setEditingStudent(null);
                                setEditMode(false);
                            }}
                        >
                            Cancel Edit
                        </button>
                    </div>
                )}

                {/* Menu Content - Shows when a menu item is selected */}
                {showMenuContent && menuContentType ? (
                    <div className="menu-content-area">
                        <button
                            className="btn btn-ghost menu-back-btn"
                            onClick={() => { setShowMenuContent(false); setMenuContentType(null); }}
                        >
                            ← Back to Main
                        </button>
                        {renderMenuContent()}
                    </div>
                ) : (
                    /* Data Entry Form */
                    <div className={`form-container ${isFormMaximized ? 'maximized' : ''}`}>
                        {selectedStandard && (
                            <button
                                className="form-maximize-btn btn btn-icon btn-ghost"
                                onClick={() => setIsFormMaximized(!isFormMaximized)}
                                title={isFormMaximized ? 'Minimize' : 'Maximize'}
                            >
                                {isFormMaximized ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                            </button>
                        )}
                        {selectedStandard ? (
                            <StepWizard
                                key={editingStudent?.id || 'new'}
                                onSave={handleAddStudent}
                                initialData={editingStudent || {}}
                                selectedStandard={selectedStandard}
                                customFields={fields}
                                onCancel={editingStudent ? () => setEditingStudent(null) : null}
                            />
                        ) : (
                            <div className="no-standard-selected fluffy-card">
                                <div className="empty-state">
                                    <img src="/edunorm-logo.png" alt="EduNorm" className="welcome-logo" />
                                    <h2 className="display-font">Welcome to EduNorm!</h2>
                                    <p>Please select or create a Standard/Class from the sidebar to start entering student data.</p>
                                    <div className="empty-steps">
                                        <div className="step-item">
                                            <span className="step-num">1</span>
                                            <span>Upload School Logo</span>
                                        </div>
                                        <div className="step-item">
                                            <span className="step-num">2</span>
                                            <span>Enter School Name</span>
                                        </div>
                                        <div className="step-item">
                                            <span className="step-num">3</span>
                                            <span>Add Teacher Name</span>
                                        </div>
                                        <div className="step-item">
                                            <span className="step-num">4</span>
                                            <span>Select or Create Standard</span>
                                        </div>
                                        <div className="step-item">
                                            <span className="step-num">5</span>
                                            <span>Start Adding Students!</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* Profile Viewer Modal */}
            <ProfileViewer
                isOpen={showProfile}
                onClose={() => setShowProfile(false)}
                students={ledger}
                standards={standards}
                schoolName={schoolName}
                settings={settings}
                schoolLogo={schoolLogo}
                schoolContact={schoolContact}
            />

            {/* General Register Modal */}
            <GeneralRegister
                isOpen={showLedger}
                onClose={() => setShowLedger(false)}
                ledger={ledger}
                onSearch={handleSearch}
                searchResults={searchResults}
                searchQuery={searchQuery}
                onEditStudent={(student) => {
                    setEditingStudent(student);
                    setEditMode(true);
                    setSelectedStandard(student.standard);
                }}
            />

            {/* Backup/Restore Modal */}
            <BackupRestore
                isOpen={showBackup}
                onClose={() => setShowBackup(false)}
                ledger={ledger}
                standards={standards}
                selectedStandard={selectedStandard}
                onImportComplete={handleImportComplete}
                initialTab={backupAction}
            />



            {/* Admin Panel */}
            {showAdmin && (
                <AdminPanel
                    onClose={() => setShowAdmin(false)}
                    totalStudents={ledger.reduce((sum, s) => sum + (s.students?.length || 0), 0)}
                    totalStandards={standards.length}
                />
            )}

            {/* Certificate Generator */}
            <CertificateGenerator
                isOpen={showCertificate}
                onClose={() => setShowCertificate(false)}
                student={editingStudent || (students.length > 0 ? students[0] : null)}
                schoolName={schoolName}
                schoolLogo={schoolLogo}
            />

            {/* Analytics Dashboard */}
            <AnalyticsDashboard
                isOpen={showAnalytics}
                onClose={() => setShowAnalytics(false)}
                students={students}
                standards={standards}
                ledger={ledger}
            />

            {/* QR Attendance */}
            <QRAttendance
                isOpen={showQRAttendance}
                onClose={() => setShowQRAttendance(false)}
                students={students}
                schoolName={schoolName}
            />

            {/* Smart Search */}
            <SmartSearch
                isOpen={showSmartSearch}
                onClose={() => setShowSmartSearch(false)}
                students={students}
                onSelectStudent={(student) => {
                    setEditingStudent(student);
                    setShowSmartSearch(false);
                }}
            />

            {/* Cloud Backup */}
            <CloudBackup
                isOpen={showCloudBackup}
                onClose={() => setShowCloudBackup(false)}
                onRestoreComplete={() => {
                    window.location.reload();
                }}
            />

            {/* Document Scanner */}
            <DocumentScanner
                isOpen={showDocScanner}
                onClose={() => setShowDocScanner(false)}
                onDataExtracted={(data) => {
                    console.log('Extracted data:', data);
                    // Can be used to prefill form data
                }}
            />

            {/* Voice Input */}
            <VoiceInput
                isOpen={showVoiceInput}
                onClose={() => setShowVoiceInput(false)}
                onVoiceData={(data) => {
                    console.log('Voice data:', data);
                }}
            />

            {/* Family Tree */}
            <FamilyTree
                isOpen={showFamilyTree}
                onClose={() => setShowFamilyTree(false)}
                student={editingStudent || (students.length > 0 ? students[0] : null)}
            />

            {/* Progress Timeline */}
            <ProgressTimeline
                isOpen={showTimeline}
                onClose={() => setShowTimeline(false)}
                student={editingStudent || (students.length > 0 ? students[0] : null)}
            />

            {/* WhatsApp Messenger */}
            <WhatsAppMessenger
                isOpen={showWhatsApp}
                onClose={() => setShowWhatsApp(false)}
                students={students}
                schoolName={schoolName}
            />

            {/* Photo Enhancement */}
            <PhotoEnhancement
                isOpen={showPhotoEnhance}
                onClose={() => setShowPhotoEnhance(false)}
                onPhotoEnhanced={(photo) => {
                    console.log('Enhanced photo:', photo);
                }}
            />

            {/* Ad Banner for Free Users - Only show when content is present */}
            {(selectedStandard || showMenuContent) && (
                <div className="bottom-ad-container">
                    <AdPlacement type="leaderboard" />
                </div>
            )}

            {/* Undo/Redo floating bar */}
            <UndoRedoBar />

            {/* Footer with Legal Links */}
            <footer className="app-footer">
                <div className="footer-content">
                    <span>© 2026 EduNorm</span>
                    <div className="footer-links">
                        <a href="/privacy" target="_blank">Privacy Policy</a>
                        <span className="divider">|</span>
                        <a href="/terms" target="_blank">Terms of Service</a>
                        <span className="divider">|</span>
                        <a href="mailto:help@edunorm.in">help@edunorm.in</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}

// App wrapper with AuthProvider, UserTierProvider, and LanguageProvider
function App() {
    return (
        <LanguageProvider>
            <AuthProvider>
                <UserTierProvider>
                    <AppContent />
                    <UpgradeModal />
                </UserTierProvider>
            </AuthProvider>
        </LanguageProvider>
    );
}

export default App;
