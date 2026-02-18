import React, { useState, useEffect, useCallback, useMemo, Suspense, lazy } from 'react';
import NewSidebar from './components/Layout/NewSidebar';
import LoginPage from './components/Auth/LoginPage';
import { AdPlacement } from './components/Ads/AdBanner';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { UserTierProvider, useUserTier } from './contexts/UserTierContext';
import { LanguageProvider } from './contexts/LanguageContext';
import UndoRedoBar from './components/Common/UndoRedoBar';
import { MenuProvider, useMenu } from './contexts/MenuContext';
import ComponentErrorBoundary from './components/Common/ErrorBoundary';
import EduNormLogo from './components/Common/EduNormLogo';
import BrandLoader from './components/Common/BrandLoader';
import ParticleBackground from './components/Effects/ParticleBackground';
import { IconMap } from './components/Icons/CustomIcons';

// Lazy-loaded components for code splitting
const StepWizard = lazy(() => import('./components/DataEntry/StepWizard'));
import { DATA_FIELDS } from './components/DataEntry/StepWizard';
const ProfileViewer = lazy(() => import('./components/Profile/ProfileViewer'));
const GeneralRegister = lazy(() => import('./components/Ledger/GeneralRegister'));
const BackupRestore = lazy(() => import('./components/Backup/BackupRestore'));
const CloudBackup = lazy(() => import('./components/Backup/CloudBackup'));
const AdminPanel = lazy(() => import('./components/Admin/AdminPanel'));
const CertificateGenerator = lazy(() => import('./components/Features/CertificateGenerator'));
const AnalyticsDashboard = lazy(() => import('./components/Features/AnalyticsDashboard'));
const QRAttendance = lazy(() => import('./components/Features/QRAttendance'));
const SmartSearch = lazy(() => import('./components/Features/SmartSearch'));
const DocumentScanner = lazy(() => import('./components/Features/DocumentScanner'));
const VoiceInput = lazy(() => import('./components/Features/VoiceInput'));
const FamilyTree = lazy(() => import('./components/Features/FamilyTree'));
const ProgressTimeline = lazy(() => import('./components/Features/ProgressTimeline'));
const WhatsAppMessenger = lazy(() => import('./components/Features/WhatsAppMessenger'));
const PhotoEnhancement = lazy(() => import('./components/Features/PhotoEnhancement'));
const UpgradeModal = lazy(() => import('./components/Premium/UpgradeModal'));
const SchoolProfile = lazy(() => import('./components/School/SchoolProfile'));
const StaffInfo = lazy(() => import('./components/HOI/StaffInfo'));
const HOIDiary = lazy(() => import('./components/HOI/HOIDiary'));
const CustomWindowCreator = lazy(() => import('./components/Common/CustomWindowCreator'));
const ComingSoonPage = lazy(() => import('./components/Common/ComingSoonPage'));
const SalaryBook = lazy(() => import('./components/Teacher/SalaryBook'));
const TeacherProfile = lazy(() => import('./components/Teacher/TeacherProfile'));
const TeachersProfileList = lazy(() => import('./components/School/TeachersProfileList'));
const StudentLogin = lazy(() => import('./components/Student/StudentLogin'));
const CorrectionRequest = lazy(() => import('./components/Student/CorrectionRequest'));
const QAChat = lazy(() => import('./components/Student/QAChat'));
const StudentCertificates = lazy(() => import('./components/Student/StudentCertificates'));
const ClassManagement = lazy(() => import('./components/HOI/ClassManagement'));

const UsageInstructions = lazy(() => import('./components/Features/UsageInstructions'));
const StudentDashboard = lazy(() => import('./components/Student/StudentDashboard'));
import RoleSelectionModal from './components/Common/RoleSelectionModal';
import AdSense from './components/Common/AdSense';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import {
    useSettings,
    useStudents,
    useStandards,
    useCustomFields,
    useLedger
} from './hooks/useDatabase';
import * as db from './services/database';
import * as LocalBackupService from './services/LocalBackupService';
import * as MandatoryBackupService from './services/MandatoryBackupService';
import * as CloudSyncService from './services/CloudSyncService';
import * as RealTimeBackup from './services/RealTimeBackupService';
import { selfRepairCheck, isIPBlocked } from './services/SecurityManager';
import { Menu, Users, FileSpreadsheet, Sparkles, Download, Share2, Maximize2, Minimize2, Cloud, CloudOff, Check, Loader } from 'lucide-react';
import './App.css';

// Main App Content (wrapped in auth and tier providers)
function AppContent() {
    const { isAuthenticated, loading: authLoading, user, logout } = useAuth();
    const { tier, isAdmin, isFree, setShowUpgradeModal } = useUserTier();
    // State
    const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768);
    const [showProfile, setShowProfile] = useState(false);
    const [showLedger, setShowLedger] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [editingStudent, setEditingStudent] = useState(null);
    const [isReady, setIsReady] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
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

    // Role Selection Modal State
    const [showRoleSelection, setShowRoleSelection] = useState(false);

    useEffect(() => {
        // Show modal if user is logged in but hasn't selected a role OR hasn't completed verification
        if (isAuthenticated && user && (!user.role || !user.isVerified)) {
            setShowRoleSelection(true);
        } else {
            setShowRoleSelection(false);
        }
    }, [isAuthenticated, user]);

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
                if (showMenuContent) { setShowMenuContent(false); setMenuContentType(null); }
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [showMenuContent]);

    // Auto-sync on login + Initialize real-time backup
    useEffect(() => {
        const performAutoSync = async () => {
            if (user?.uid && isReady && !user.isOffline) {
                console.log('Starting auto-sync on login...');
                setSyncStatus({ type: 'syncing', message: 'Syncing with cloud...' });

                // Initialize real-time backup system
                RealTimeBackup.init(user.uid);

                // Listen for real-time backup status changes
                RealTimeBackup.onStatusChange((status) => {
                    if (status.type === 'syncing') {
                        setSyncStatus({ type: 'syncing', message: status.message });
                    } else if (status.type === 'success') {
                        setSyncStatus({ type: 'success', message: status.message });
                        setTimeout(() => setSyncStatus(null), 2000);
                    } else if (status.type === 'offline' || status.type === 'queued') {
                        setSyncStatus({ type: 'warning', message: status.message });
                        setTimeout(() => setSyncStatus(null), 3000);
                    } else if (status.type === 'error') {
                        setSyncStatus({ type: 'error', message: status.message });
                        setTimeout(() => setSyncStatus(null), 4000);
                    }
                });

                try {
                    // SAFETY CHECK: Force backup if version changed
                    await CloudSyncService.checkAndPerformSafetyBackup(user.uid);

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

        return () => {
            RealTimeBackup.cleanup();
        };
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
        // Trigger real-time backup
        RealTimeBackup.onDataChanged('settings');
        // Redundant safe backup to ensure settings like School Name/Logo are synced to R2/Cloud
        MandatoryBackupService.triggerBackupOnChange();
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
        // Trigger real-time backup
        RealTimeBackup.onDataChanged('student');
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

        // Modal-only items
        if (itemId === 'general-register') {
            setShowLedger(true);
            return;
        }
        if (itemId === 'student-profile' || itemId === 'id-card' || itemId === 'student-view-profile' || itemId === 'download-id-card') {
            setShowProfile(true);
            return;
        }
        if (itemId === 'certificate') {
            setShowCertificate(true);
            return;
        }
        if (itemId === 'backup-restore' || itemId === 'export-data' || itemId === 'import-data') {
            if (itemId === 'export-data') setBackupAction('export');
            if (itemId === 'import-data') setBackupAction('import');
            setShowBackup(true);
            return;
        }
        if (itemId === 'cloud-backup') {
            setShowCloudBackup(true);
            return;
        }
        if (itemId === 'upload-logo') {
            setMenuContentType('school-profile');
            setShowMenuContent(true);
            return;
        }

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
                return <ComponentErrorBoundary componentName="School Profile"><SchoolProfile
                    schoolName={schoolName}
                    schoolContact={schoolContact}
                    schoolEmail={schoolEmail}
                    schoolLogo={schoolLogo}
                    onSchoolNameChange={setSchoolName}
                    onSchoolContactChange={setSchoolContact}
                    onSchoolEmailChange={setSchoolEmail}
                    onSchoolLogoChange={setSchoolLogo}
                    onSaveSettings={handleSaveSettings}
                /></ComponentErrorBoundary>;
            case 'general-register':
            case 'student-profile':
            case 'certificate':
            case 'id-card':
                return null;
            case 'teachers-profile':
                return <ComponentErrorBoundary componentName="Teachers Profile List"><TeachersProfileList /></ComponentErrorBoundary>;
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
                return <ComponentErrorBoundary componentName="Staff Info"><StaffInfo /></ComponentErrorBoundary>;
            case 'hoi-diary':
                return <ComponentErrorBoundary componentName="HOI Diary"><HOIDiary /></ComponentErrorBoundary>;

            // Teacher menu items
            case 'self-profile':
                return <ComponentErrorBoundary componentName="Teacher Profile"><TeacherProfile /></ComponentErrorBoundary>;
            case 'salary-book':
                return <ComponentErrorBoundary componentName="Salary Book"><SalaryBook /></ComponentErrorBoundary>;
            case 'class-upgrade':
                return (
                    <ComponentErrorBoundary componentName="Class Upgrade">
                        <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
                            <h2 style={{ marginBottom: '8px', fontSize: '1.3rem' }}>⬆️ Class Upgrade</h2>
                            <p style={{ color: 'var(--gray-600)', marginBottom: '16px', fontSize: '0.9rem' }}>
                                One-tap upgrade your class to the next level. All students will be moved automatically.
                            </p>
                            {standards.length === 0 ? (
                                <p style={{ color: 'var(--gray-500)', textAlign: 'center', padding: '40px 0' }}>
                                    No classes found. Please create a class first in Class Management.
                                </p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {standards.map(std => {
                                        const name = std.name || std.id;
                                        // Try to extract the number for auto-suggestion
                                        const numMatch = name.match(/(\d+)/);
                                        const nextNum = numMatch ? parseInt(numMatch[1]) + 1 : null;
                                        const suggestedNext = nextNum ? name.replace(/\d+/, nextNum) : '';
                                        return (
                                            <div key={std.id} style={{
                                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                padding: '14px 16px', borderRadius: '12px',
                                                background: 'var(--bg-secondary, #f8fafc)',
                                                border: '1px solid var(--border-color, #e2e8f0)'
                                            }}>
                                                <span style={{ fontWeight: 600 }}>{name}</span>
                                                <button
                                                    className="btn btn-primary"
                                                    style={{ fontSize: '0.85rem', padding: '8px 16px' }}
                                                    onClick={async () => {
                                                        const newName = prompt(
                                                            `Upgrade "${name}" to:`,
                                                            suggestedNext || ''
                                                        );
                                                        if (newName && newName.trim()) {
                                                            try {
                                                                const count = await db.upgradeClass(std.id, newName.trim());
                                                                await addStandard({ id: newName.trim(), name: newName.trim() });
                                                                alert(`✅ Upgraded ${count} students from "${name}" → "${newName.trim()}"`);
                                                                setSelectedStandard(newName.trim());
                                                                await refreshStudents();
                                                                RealTimeBackup.onDataChanged('class_upgrade');
                                                            } catch (err) {
                                                                alert('Upgrade failed: ' + err.message);
                                                            }
                                                        }
                                                    }}
                                                >
                                                    ⬆️ {suggestedNext ? `→ ${suggestedNext}` : 'Upgrade'}
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </ComponentErrorBoundary>
                );
            case 'class-management':
            case 'class-management-teacher':
                return <ComponentErrorBoundary componentName="Class Management"><ClassManagement /></ComponentErrorBoundary>;

            // Student menu items
            case 'student-login':
                return <ComponentErrorBoundary componentName="Student Login"><StudentLogin onBack={() => { setShowMenuContent(false); setMenuContentType(null); }} /></ComponentErrorBoundary>;
            case 'student-view-profile':
                return null;
            case 'download-id-card':
                return null;
            case 'correction-request':
                return <ComponentErrorBoundary componentName="Correction Request"><CorrectionRequest studentData={user} onBack={() => { setShowMenuContent(false); setMenuContentType(null); }} /></ComponentErrorBoundary>;
            case 'certificate-download':
                // Show issued certificates for download (uploaded by teacher)
                return <ComponentErrorBoundary componentName="My Certificates"><StudentCertificates user={user} onBack={() => { setShowMenuContent(false); setMenuContentType(null); }} /></ComponentErrorBoundary>;
            case 'qa-chat':
                return <ComponentErrorBoundary componentName="Q&A Chat"><QAChat studentData={user} onBack={() => { setShowMenuContent(false); setMenuContentType(null); }} /></ComponentErrorBoundary>;

            // Coming Soon items
            case 'dead-stock':
            case 'audit-register':
            case 'bill-register':
            case 'news-circulars':
            case 'programs-events':
            case 'activity-gallery':
                return <ComingSoonPage featureId={menuContentType} onBack={() => { setShowMenuContent(false); setMenuContentType(null); }} />;

            // Data Management items
            case 'backup-restore':
            case 'cloud-backup':
                return null;
            case 'upload-logo':
            case 'export-data':
            case 'import-data':
                return null;

            // HOI Password - handled by sidebar directly, but add fallback
            case 'hoi-password':
                return null;

            // Usage Instructions
            case 'usage-instructions':
                return <UsageInstructions onBack={() => { setShowMenuContent(false); setMenuContentType(null); }} />;

            // Help & Support
            case 'help-support':
                return (
                    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
                        <h2 style={{ marginBottom: '8px', fontSize: '1.3rem' }}>💬 Help & Suggestions</h2>
                        <p style={{ color: 'var(--gray-600)', marginBottom: '16px', fontSize: '0.9rem' }}>
                            Have a question, bug report, or suggestion? Send us a message and we'll get back to you!
                        </p>
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            const subject = e.target.subject.value;
                            const message = e.target.message.value;
                            const email = user?.email || '';
                            const mailtoLink = `mailto:help@edunorm.in?subject=${encodeURIComponent('[EduNorm Support] ' + subject)}&body=${encodeURIComponent(message + '\n\n---\nFrom: ' + email)}`;
                            window.open(mailtoLink);
                        }} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            <input name="subject" className="input-field" placeholder="Subject (e.g. Bug Report, Feature Request)" required style={{ padding: '10px 14px' }} />
                            <textarea name="message" className="input-field" placeholder="Type your message here..." required rows={6} style={{ padding: '10px 14px', resize: 'vertical', minHeight: '120px' }} />
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                                    📧 Send to help@edunorm.in
                                </button>
                                <button type="button" className="btn" onClick={() => { setShowMenuContent(false); setMenuContentType(null); }}>
                                    Cancel
                                </button>
                            </div>
                            <p style={{ fontSize: '0.75rem', color: 'var(--gray-400)', textAlign: 'center' }}>
                                🔒 Your data is safe. We never share student information with anyone.
                            </p>
                        </form>
                    </div>
                );


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

    // Auth loading state - instantly visible
    if (authLoading) {
        return <BrandLoader message="Verifying credentials..." />;
    }




    // Show login page if not authenticated
    if (!isAuthenticated) {
        return <LoginPage />;
    }

    // Show Role Selection if role is missing (e.g. after Google Login)
    if (showRoleSelection) {
        return (
            <div className="app" data-theme={theme}>
                <RoleSelectionModal
                    isOpen={true}
                    onComplete={() => {
                        setShowRoleSelection(false);
                        window.location.reload(); // Reload to refresh menu/context logic
                    }}
                />
            </div>
        );
    }

    // Loading state
    if (!isReady) {
        return <BrandLoader message="Loading EduNorm..." />;
    }

    return (
        <div className="app" data-theme={theme}>
            <AdSense />
            {/* Background decorations - Hidden in Minimal Theme */}
            <ParticleBackground />
            {theme !== 'neon' && (
                <div className="app-decorations">
                    <div className="blob blob-1"></div>
                    <div className="blob blob-2"></div>
                    <div className="blob blob-3"></div>
                </div>
            )}

            {/* Sidebar toggle button - always visible */}
            {!sidebarOpen && (
                <button
                    className="mobile-sidebar-toggle"
                    onClick={() => setSidebarOpen(true)}
                    style={{
                        position: 'fixed',
                        top: '23px', /* Aligned with logo - pushed down 2x more */
                        left: '12px',
                        zIndex: 40,
                        padding: '8px',
                        background: 'transparent', /* Clean */
                        border: 'none', /* No border */
                        borderRadius: '8px',
                        boxShadow: 'none', /* No shadow */
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'var(--text-primary)'
                    }}
                    title="Open Menu"
                >
                    <Menu size={24} />
                </button>
            )}

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


                <header className="main-header">
                    <div className="header-left">
                        {students.length > 0 && (
                            <button className="btn btn-secondary total-count-btn">
                                <IconMap.users size={18} />
                                {students.length} Students
                            </button>
                        )}
                    </div>

                    <div className="header-brand">
                        <img src="/edunorm-logo.png" alt="EduNorm" style={{ width: 42, height: 42, borderRadius: 10, objectFit: 'contain' }} />
                        <EduNormLogo size="large" />
                    </div>

                    <div className="header-actions">
                        {user?.role !== 'student' && (
                            <>
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => setShowLedger(true)}
                                >
                                    <IconMap.grBook size={18} />
                                    View Register
                                </button>
                                <button
                                    className="btn btn-primary"
                                    onClick={() => setShowProfile(true)}
                                >
                                    <IconMap.users size={18} />
                                    Student Profile
                                </button>
                            </>
                        )}
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
                        <Suspense fallback={<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', gap: '10px' }}><span style={{ width: '24px', height: '24px', border: '3px solid #e2e8f0', borderTopColor: 'var(--primary, #7C3AED)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />Loading...</div>}>
                            {renderMenuContent()}
                        </Suspense>
                    </div>
                ) : (
                    /* Main Content Area: Admin gets Data Entry, Student gets Dashboard */
                    user?.role === 'student' ? (
                        <div className="student-dashboard-wrapper" style={{ padding: '20px' }}>
                            <Suspense fallback={<BrandLoader message="Loading Dashboard..." />}>
                                <StudentDashboard
                                    user={user}
                                    onLogout={logout}
                                    onNavigate={handleMenuNavigate}
                                />
                            </Suspense>
                        </div>
                    ) : (
                        /* Data Entry Form (Admin/Teacher) */
                        <div className="form-container">
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
                    )
                )
                }
            </main >

            {/* Profile Viewer Modal */}
            < ProfileViewer
                isOpen={showProfile}
                onClose={() => setShowProfile(false)}
                students={user?.role === 'student' ? [user] : ledger}
                standards={standards}
                schoolName={schoolName}
                settings={settings}
                schoolLogo={schoolLogo}
                schoolContact={schoolContact}
            />

            {/* General Register Modal */}
            < GeneralRegister
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
            {
                showAdmin && (
                    <AdminPanel
                        onClose={() => setShowAdmin(false)}
                        totalStudents={ledger.reduce((sum, s) => sum + (s.students?.length || 0), 0)}
                        totalStandards={standards.length}
                    />
                )
            }

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
            {
                (selectedStandard || showMenuContent) && (
                    <div className="bottom-ad-container">
                        <AdPlacement type="leaderboard" />
                    </div>
                )
            }

            {/* Undo/Redo floating bar */}
            <UndoRedoBar />

            {/* Footer */}
            <footer className="app-footer">
                <div className="footer-row">
                    <a href="mailto:help@edunorm.in">help@edunorm.in</a>
                    <span className="dot">·</span>
                    <a href="/privacy" target="_blank">Privacy</a>
                    <span className="dot">·</span>
                    <a href="/terms" target="_blank">Terms</a>
                    <span className="dot">·</span>
                    <span>© 2026 EduNorm</span>
                </div>
            </footer>
        </div >
    );
}

// App wrapper with AuthProvider, UserTierProvider, and LanguageProvider
function App() {
    return (
        <LanguageProvider>
            <AuthProvider>
                <UserTierProvider>
                    <MenuProvider>
                        <ThemeProvider>
                            <Suspense fallback={<BrandLoader message="Loading App..." />}>
                                <AppContent />
                                <UpgradeModal />
                            </Suspense>
                        </ThemeProvider>
                    </MenuProvider>
                </UserTierProvider>
            </AuthProvider>
        </LanguageProvider>
    );
}

export default App;
