import React, { useState, useEffect, useCallback, useMemo, Suspense, lazy } from 'react';
import ToastContainer, { toast } from './components/Common/Toast';
import SyncPulse from './components/Common/SyncPulse';
import OfflineQueue from './components/Common/OfflineQueue';
import SyncEventBus from './services/SyncEventBus';
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
import { UIEngine } from './core/v2/UIEngine';
import { SovereignBridge } from './core/v2/Bridge';

import { DATA_FIELDS } from './features/StudentManagement/types';

// Lazy-loaded components for code splitting
const StepWizard = lazy(() => import('./components/DataEntry/StepWizard'));
const ProfileViewer = lazy(() => import('./components/Profile/ProfileViewer'));
const GeneralRegister = lazy(() => import('./features/StudentManagement/view'));
const BackupRestore = lazy(() => import('./features/SyncBackup/view'));
const CloudBackup = BackupRestore; // Same component, used in two places
const AdminPanel = lazy(() => import('./features/AdminDashboard/view'));
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
const SchoolProfile = lazy(() => import('./features/SchoolProfile/view'));
const StaffInfo = lazy(() => import('./components/HOI/StaffInfo'));
const HOIDiary = lazy(() => import('./components/HOI/HOIDiary'));
const CustomWindowCreator = lazy(() => import('./components/Common/CustomWindowCreator'));
const ComingSoonPage = lazy(() => import('./components/Common/ComingSoonPage'));
const SalaryBook = lazy(() => import('./components/Teacher/SalaryBook'));
const TeacherProfile = lazy(() => import('./components/Teacher/TeacherProfile'));
const StudentLogin = lazy(() => import('./components/Student/StudentLogin'));
const CorrectionRequest = lazy(() => import('./components/Student/CorrectionRequest'));
const QAChat = lazy(() => import('./components/Student/QAChat'));
const StudentCertificates = lazy(() => import('./components/Student/StudentCertificates'));
const ClassManagement = lazy(() => import('./components/HOI/ClassManagement'));

const UsageInstructions = lazy(() => import('./components/Features/UsageInstructions'));
const StudentDashboard = lazy(() => import('./components/Student/StudentDashboard'));
const IdentityWizard = lazy(() => import('./features/Identity/view'));
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

    // Sovereign Session & Data Check
    useEffect(() => {
        if (isAuthenticated && user?.uid) {
            console.log('Sovereign session active');
        }
    }, [isAuthenticated, user?.uid]);

    // Initialize sovereign backup check
    useEffect(() => {
        const initBackupSystem = async () => {
            try {
                // Initial check for data integrity
                const allData = await db.exportAllData();
                if (allData && (allData.students?.length > 0 || allData.settings)) {
                    console.log('Sovereign Backup system active');
                }
            } catch (error) {
                console.error('Backup system init failed:', error);
            }
        };

        if (isReady) {
            initBackupSystem();
        }
    }, [isReady]);

    // Save settings
    const handleSaveSettings = useCallback(async () => {
        // Individual keys for legacy support
        await updateSetting('schoolName', schoolName);
        await updateSetting('schoolLogo', schoolLogo);
        await updateSetting('schoolContact', schoolContact);
        await updateSetting('schoolEmail', schoolEmail);
        await updateSetting('teacherName', teacherName);
        await updateSetting('selectedStandard', selectedStandard);

        // Unified school_profile object - MERGE to prevent data loss
        const existingProfile = await db.getSetting('school_profile') || {};
        const unifiedProfile = {
            ...existingProfile,
            schoolName,
            schoolLogo,
            schoolContact,
            schoolEmail,
            updatedAt: new Date().toISOString()
        };
        await updateSetting('school_profile', unifiedProfile);

        // Sovereign Universal Save (Replaces RealTimeBackup & MandatorySync)
        await SovereignBridge.save('settings', {
            id: 'SYSTEM_SETTINGS',
            type: 'settings',
            schoolName, schoolLogo, schoolContact, schoolEmail, teacherName, selectedStandard,
            school_profile: unifiedProfile
        });

        toast.success('Settings saved!');
    }, [schoolName, schoolLogo, schoolContact, schoolEmail, teacherName, selectedStandard, updateSetting]);

    // Add new student
    const handleAddStudent = useCallback(async (studentData) => {
        const studentRecord = {
            ...studentData,
            standard: selectedStandard
        };

        if (editingStudent) {
            await updateStudent(editingStudent.id, studentRecord);
            setEditingStudent(null);
            setEditMode(false);
        } else {
            await addStudent(studentRecord);
        }

        await refreshStudents();
        await refreshLedger();

        // Sovereign Universal Save (Replaces RealTimeBackup)
        SovereignBridge.save('student', studentRecord);
    }, [addStudent, updateStudent, editingStudent, selectedStandard, refreshStudents, refreshLedger]);

    // Class upgrade
    const handleUpgradeClass = useCallback(async () => {
        if (!selectedStandard) {
            toast.warning('Please select a standard first');
            return;
        }

        const newStandard = prompt('Enter new standard name (e.g., "Standard 4-A"):');
        if (newStandard) {
            const count = await db.upgradeClass(selectedStandard, newStandard);
            toast.success(`Upgraded ${count} students to ${newStandard}`);
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
            toast.warning('No previous standard found');
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
            toast.success(`Class "${standardId}" deleted with ${studentsInClass.length} students`);
        } catch (error) {
            console.error('Failed to delete class:', error);
            toast.error('Failed to delete class');
        }
    }, [deleteStandard, refreshStudents]);

    // Handle menu navigation from MainMenu component
    const handleMenuNavigate = useCallback((menuId, itemId) => {
        console.log('Menu navigate:', menuId, itemId);

        // Content area items (render inside Bento feed)
        if (itemId === 'general-register' || itemId === 'student-profile' || itemId === 'id-card' || itemId === 'certificate' || itemId === 'backup-restore' || itemId === 'cloud-backup') {
            setMenuContentType(itemId);
            setShowMenuContent(true);
            // Close overlays
            setShowProfile(false);
            setShowLedger(false);
            setShowCertificate(false);
            setShowBackup(false);
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
                return <ComponentErrorBoundary componentName="Student Ledger"><GeneralRegister
                    isOpen={true}
                    isFullPage={true}
                    students={ledger}
                    onSearch={setSearchQuery}
                    searchQuery={searchQuery}
                    onUpdateStudent={updateStudent}
                    onRenameField={handleRenameDataBox}
                    fieldRenames={settings.fieldRenames || {}}
                    onEditStudent={(student) => {
                        setEditingStudent(student);
                        setEditMode(true);
                        setSelectedStandard(student.standard);
                        setShowMenuContent(false);
                    }}
                    onClose={() => setShowMenuContent(false)}
                /></ComponentErrorBoundary>;
            case 'student-profile':
            case 'id-card':
                return <ComponentErrorBoundary componentName="Profile"><ProfileViewer
                    isOpen={true}
                    isFullPage={true}
                    onClose={() => setShowMenuContent(false)}
                    students={user?.role === 'student' ? [user] : ledger}
                    standards={standards}
                    schoolName={schoolName}
                    settings={settings}
                    schoolLogo={schoolLogo}
                    schoolContact={schoolContact}
                    initialTab={menuContentType === 'id-card' ? 'id' : 'profile'}
                /></ComponentErrorBoundary>;
            case 'certificate':
                return <ComponentErrorBoundary componentName="Certificate"><CertificateGenerator
                    isOpen={true}
                    isFullPage={true}
                    onClose={() => setShowMenuContent(false)}
                    student={editingStudent || (students.length > 0 ? students[0] : null)}
                    schoolName={schoolName}
                    schoolLogo={schoolLogo}
                /></ComponentErrorBoundary>;
            case 'backup-restore':
                return <ComponentErrorBoundary componentName="Backup & Restore"><BackupRestore
                    isOpen={true}
                    isFullPage={true}
                    onClose={() => setShowMenuContent(false)}
                    ledger={ledger}
                    standards={standards}
                    selectedStandard={selectedStandard}
                    onImportComplete={handleImportComplete}
                /></ComponentErrorBoundary>;
            case 'teachers-profile':
                return <ComponentErrorBoundary componentName="Staff Info"><StaffInfo /></ComponentErrorBoundary>;
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
                                                                toast.success(`Upgraded ${count} students from "${name}" → "${newName.trim()}"`);
                                                                setSelectedStandard(newName.trim());
                                                                await refreshStudents();
                                                            } catch (err) {
                                                                toast.error('Upgrade failed', err.message);
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
        toast.success(`Field renamed to "${newName}"`);
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
                <Suspense fallback={<BrandLoader message="Loading Identity Wizard..." />}>
                    <IdentityWizard
                        isOpen={true}
                        onComplete={() => {
                            setShowRoleSelection(false);
                            window.location.reload(); // Reload to refresh menu/context logic
                        }}
                    />
                </Suspense>
            </div>
        );
    }

    // Loading state
    if (!isReady) {
        return <BrandLoader message="Loading EduNorm..." />;
    }

    return (
        <div className="bento-container" data-theme={theme}>
            <AdSense />
            {/* Background decorations - Subtle and controlled by theme */}
            <ParticleBackground />

            {/* Floating Glass Sidebar (side) */}
            <NewSidebar
                isOpen={sidebarOpen}
                onToggle={() => setSidebarOpen(!sidebarOpen)}
                onNavigate={handleMenuNavigate}
                onOpenAdmin={() => setShowAdmin(true)}
                onOpenUpgrade={() => setShowUpgradeModal(true)}
                onLogout={logout}
                theme={theme}
                toggleTheme={changeTheme}
            />

            {/* Main Feed Area (main) */}
            <main className="main-feed">
                <header className="nav-master">
                    <div className="nav-left">
                        {students.length > 0 && (
                            <div className="status-badge">
                                <span className="icon">👥</span>
                                <strong>{students.length}</strong> Students
                            </div>
                        )}
                    </div>

                    {/* Centered Branding */}
                    <div className="nav-brand" style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
                        <span style={{
                            background: 'linear-gradient(135deg, #6366f1, #a855f7, #ec4899)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            fontWeight: 800,
                            fontSize: '1.1rem',
                            letterSpacing: '0.05em',
                            fontFamily: "'Inter', system-ui, sans-serif"
                        }}>edunorm</span>
                    </div>

                    <div className="nav-right">
                        {user?.role !== 'student' && (
                            <div className="action-group" style={{ display: 'flex', gap: '1rem' }}>
                                <button
                                    className="btn-sovereign"
                                    onClick={() => handleMenuNavigate('school', 'general-register')}
                                >
                                    <span className="icon">📖</span>
                                    Register
                                </button>
                                <button
                                    className="btn-sovereign"
                                    onClick={() => handleMenuNavigate('school', 'student-profile')}
                                >
                                    <span className="icon">👤</span>
                                    Student Profile
                                </button>
                            </div>
                        )}
                    </div>
                </header>

                <div className="glass-panel" style={{ flex: 1, overflowY: 'auto' }}>
                    <h2>Welcome back, {user?.displayName?.split(' ')[0] || user?.email?.split('@')[0] || 'Sovereign'}!</h2>
                    <p style={{ opacity: 0.7, marginBottom: '1.5rem' }}>Everything is synced and sovereign.</p>

                    {/* Menu Content or Main Dashboard */}
                    {showMenuContent && menuContentType ? (
                        <div className="menu-content-full-width">
                            <Suspense fallback={<BrandLoader message="Loading..." />}>
                                {renderMenuContent()}
                            </Suspense>
                        </div>
                    ) : (
                        <div className="dashboard-grid">
                            {/* Main Content Area: Admin gets Data Entry, Student gets Dashboard */}
                            {user?.role === 'student' ? (
                                <Suspense fallback={<BrandLoader message="Loading Dashboard..." />}>
                                    <StudentDashboard
                                        user={user}
                                        onLogout={logout}
                                        onNavigate={handleMenuNavigate}
                                    />
                                </Suspense>
                            ) : (
                                /* Data Entry Form (Admin/Teacher) */
                                selectedStandard ? (
                                    <StepWizard
                                        key={editingStudent?.id || 'new'}
                                        onSave={handleAddStudent}
                                        initialData={editingStudent || {}}
                                        selectedStandard={selectedStandard}
                                        customFields={fields}
                                        onCancel={editingStudent ? () => setEditingStudent(null) : null}
                                    />
                                ) : (
                                    <div className="empty-state" style={{ textAlign: 'center', padding: '2rem' }}>
                                        <img src="/edunorm-logo.png" alt="EduNorm" className="welcome-logo" style={{ width: 80, marginBottom: '1rem' }} />
                                        <h2>Welcome to EduNorm!</h2>
                                        <p style={{ color: 'var(--text-soft)', marginBottom: '2rem' }}>Please select or create a Standard/Class from the sidebar to start entering student data.</p>

                                        <div className="sovereign-card" style={{ textAlign: 'left' }}>
                                            <h3>Setup Quick-Steps:</h3>
                                            <ul className="quick-steps-list">
                                                <li onClick={() => handleMenuNavigate('school', 'upload-logo')}>✨ 1. Upload School Logo</li>
                                                <li onClick={() => handleMenuNavigate('school', 'school-profile')}>🏫 2. Enter School Name</li>
                                                <li onClick={() => handleMenuNavigate('school', 'teachers-profile')}>👨‍🏫 3. Add Teacher Name</li>
                                                <li onClick={() => handleMenuNavigate('hoi', 'class-management')}>📚 4. Select or Create Standard</li>
                                                <li onClick={() => handleMenuNavigate('other', 'usage-instructions')}>🚀 5. Start Adding Students!</li>
                                            </ul>
                                        </div>
                                    </div>
                                )
                            )}
                        </div>
                    )}
                </div>

                {/* Unified Footer Integrated into glass flow */}
                <footer className="footer-glass" style={{ marginTop: 'auto', padding: '1rem', textAlign: 'center', opacity: 0.5, fontSize: '0.8rem' }}>
                    <div className="footer-row" style={{ display: 'flex', justifyContent: 'center', gap: '15px', alignItems: 'center' }}>
                        <a href="mailto:help@edunorm.in" style={{ color: 'inherit', textDecoration: 'none' }}>help@edunorm.in</a>
                        <span>·</span>
                        <a href="/privacy" target="_blank" style={{ color: 'inherit', textDecoration: 'none' }}>Privacy</a>
                        <span>·</span>
                        <a href="/terms" target="_blank" style={{ color: 'inherit', textDecoration: 'none' }}>Terms</a>
                        <span>·</span>
                        <span>© 2026 EduNorm</span>
                    </div>
                </footer>
            </main>

            {/* Sovereign Control Module (right) */}
            <section className="glass-panel right-panel">
                <div className="sovereign-card">
                    <SyncPulse />
                    <h3 style={{ marginTop: '8px' }}>Data Sovereignty</h3>
                    <button
                        className="nav-btn"
                        style={{ background: 'white', color: 'var(--accent)', width: '100%', justifyContent: 'center', fontWeight: 'bold' }}
                        onClick={async () => {
                            try {
                                setSyncStatus('syncing');
                                SyncEventBus.emit(SyncEventBus.EVENTS.SYNC_START);
                                await SovereignBridge.forceSync();
                                setSyncStatus('success');
                                SyncEventBus.emit(SyncEventBus.EVENTS.SYNC_SUCCESS, { layers: 3 });
                                toast.sync(3, 3);
                                setTimeout(() => setSyncStatus(null), 3000);
                            } catch (error) {
                                setSyncStatus('error');
                                SyncEventBus.emit(SyncEventBus.EVENTS.SYNC_FAIL);
                                toast.error('Sync failed', error.message);
                                setTimeout(() => setSyncStatus(null), 3000);
                            }
                        }}
                    >
                        {syncStatus === 'syncing' ? 'Syncing...' : syncStatus === 'success' ? '✅ Synced' : syncStatus === 'error' ? '❌ Sync Failed' : 'Force Cloud Sync'}
                    </button>
                </div>

                <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <h4>System Integrity</h4>
                    <div className="glass-panel" style={{ padding: '1rem', fontSize: '0.85rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span>IndexDB Storage</span>
                            <span style={{ color: 'var(--accent)' }}>Stable</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span>Encryption Key</span>
                            <span style={{ color: 'var(--accent)' }}>Verified</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span>Network Bridge</span>
                            <span style={{ color: 'var(--accent)' }}>Secure</span>
                        </div>
                    </div>
                </div>

                <div style={{ marginTop: 'auto' }}>
                    <AdPlacement type="rectangle" />
                </div>
            </section>

            <AnalyticsDashboard
                isOpen={showAnalytics}
                onClose={() => setShowAnalytics(false)}
                students={students}
                standards={standards}
                ledger={ledger}
            />

            <QRAttendance
                isOpen={showQRAttendance}
                onClose={() => setShowQRAttendance(false)}
                students={students}
                schoolName={schoolName}
            />

            <SmartSearch
                isOpen={showSmartSearch}
                onClose={() => setShowSmartSearch(false)}
                students={students}
                onSelectStudent={(student) => {
                    setEditingStudent(student);
                    setShowSmartSearch(false);
                }}
            />

            <CloudBackup
                isOpen={showCloudBackup}
                onClose={() => setShowCloudBackup(false)}
                onRestoreComplete={() => {
                    window.location.reload();
                }}
            />

            <DocumentScanner
                isOpen={showDocScanner}
                onClose={() => setShowDocScanner(false)}
                onDataExtracted={(data) => {
                    console.log('Extracted data:', data);
                }}
            />

            <VoiceInput
                isOpen={showVoiceInput}
                onClose={() => setShowVoiceInput(false)}
                onVoiceData={(data) => {
                    console.log('Voice data:', data);
                }}
            />

            <FamilyTree
                isOpen={showFamilyTree}
                onClose={() => setShowFamilyTree(false)}
                student={editingStudent || (students.length > 0 ? students[0] : null)}
            />

            <ProgressTimeline
                isOpen={showTimeline}
                onClose={() => setShowTimeline(false)}
                student={editingStudent || (students.length > 0 ? students[0] : null)}
            />

            <WhatsAppMessenger
                isOpen={showWhatsApp}
                onClose={() => setShowWhatsApp(false)}
                students={students}
                schoolName={schoolName}
            />

            <PhotoEnhancement
                isOpen={showPhotoEnhance}
                onClose={() => setShowPhotoEnhance(false)}
                onPhotoEnhanced={(photo) => {
                    console.log('Enhanced photo:', photo);
                }}
            />

            {showAdmin && (
                <Suspense fallback={<BrandLoader message="Loading Admin Panel..." />}>
                    <AdminPanel
                        onClose={() => setShowAdmin(false)}
                        totalStudents={students.length}
                        totalStandards={standards?.length || 0}
                    />
                </Suspense>
            )}

            <UpgradeModal />

            {/* Unified Layout Control Elements */}
            <UndoRedoBar />
            <ToastContainer />
            <OfflineQueue />
        </div>
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
                            </Suspense>
                        </ThemeProvider>
                    </MenuProvider>
                </UserTierProvider>
            </AuthProvider>
        </LanguageProvider>
    );
}

export default App;
