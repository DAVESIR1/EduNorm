import React, { useState, useEffect, useCallback, useMemo, Suspense, lazy } from 'react';
import ToastContainer, { toast } from './components/Common/Toast';

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
import { UIEngine } from './core/v2/UIEngine';
import StudentLogic from './features/StudentManagement/logic';
import AppBus, { APP_EVENTS } from './core/AppBus.js';
import './core/registerFeatures.js'; // registers all feature manifests

// AppRouter: single place that maps menu items to components (sandbox-safe)
import { AppRouter } from './components/Layout/AppRouter';
import AdSense from './components/Common/AdSense';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import {
    useSettings,
    useStudents,
    useStandards,
    useCustomFields,
    useLedger
} from './hooks/useDatabase';
import ServiceLayer from './services/ServiceLayer.js';
import { selfRepairCheck, isIPBlocked } from './services/SecurityManager';
import './App.css';
import './styles/glassmorphism-force.css';

// Only shell-level lazy imports (the UpgradeModal and Identity wizard are
// truly at App shell level — all others live inside AppRouter)
const UpgradeModal = lazy(() => import('./components/Premium/UpgradeModal'));
const IdentityWizard = lazy(() => import('./features/Identity/view'));
const AdminPanel = lazy(() => import('./features/AdminDashboard/view'));
const StudentDashboard = lazy(() => import('./components/Student/StudentDashboard'));
const StepWizard = lazy(() => import('./components/DataEntry/StepWizard'));

// Main App Content (wrapped in auth and tier providers)
function AppContent() {
    const { isAuthenticated, loading: authLoading, user, logout } = useAuth();
    const { tier, isAdmin, isFree, setShowUpgradeModal } = useUserTier();
    // State — Shell-level only (layout/navigation)
    // Business modals are opened via AppBus.emit(NAVIGATE_TO), not with show* booleans.
    const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768);
    const [editMode, setEditMode] = useState(false);
    const [editingStudent, setEditingStudent] = useState(null);
    const [isReady, setIsReady] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showRoleSelection, setShowRoleSelection] = useState(false);
    const [showAdmin, setShowAdmin] = useState(false);

    // Menu state for 5-menu navigation
    const { activeMenu, activeSubItem, selectSubItem } = useMenu();
    const [showMenuContent, setShowMenuContent] = useState(false);
    const [menuContentType, setMenuContentType] = useState(null);

    useEffect(() => {
        // Show identity wizard if user is logged in but hasn't selected a role
        if (isAuthenticated && user && (!user.role || !user.isVerified)) {
            setShowRoleSelection(true);
        } else {
            setShowRoleSelection(false);
        }
    }, [isAuthenticated, user]);

    // AppBus NAVIGATE_TO — features request navigation through the bus.
    // App.jsx just sets menuContentType; AppRouter handles the rendering.
    useEffect(() => {
        const unsub = AppBus.on(APP_EVENTS.NAVIGATE_TO, ({ featureId, params }) => {
            if (featureId === 'admin') { setShowAdmin(true); return; }
            setMenuContentType(featureId);
            setShowMenuContent(true);
        });
        return unsub;
    }, []);

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



    // Save settings
    const handleSaveSettings = useCallback(async () => {
        // Individual keys for legacy support
        await updateSetting('schoolName', schoolName);
        await updateSetting('schoolLogo', schoolLogo);
        await updateSetting('schoolContact', schoolContact);
        await updateSetting('schoolEmail', schoolEmail);
        await updateSetting('teacherName', teacherName);
        await updateSetting('selectedStandard', selectedStandard);

        // Unified school_profile object - MERGE to prevent data loss (via ServiceLayer)
        const existingProfile = await ServiceLayer.getSetting('school_profile') || {};
        const unifiedProfile = {
            ...existingProfile,
            schoolName,
            schoolLogo,
            schoolContact,
            schoolEmail,
            updatedAt: new Date().toISOString()
        };
        await updateSetting('school_profile', unifiedProfile);


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


    }, [addStudent, updateStudent, editingStudent, selectedStandard, refreshStudents, refreshLedger]);


    // Class downgrade (via ServiceLayer)
    const handleDowngradeClass = useCallback(async () => {
        const previousStandard = students[0]?.previousStandard;
        if (previousStandard) {
            const confirm = window.confirm(`Downgrade to ${previousStandard}?`);
            if (confirm) {
                await ServiceLayer.upgradeClass(selectedStandard, previousStandard);
                setSelectedStandard(previousStandard);
                await refreshStudents();
            }
        } else {
            toast.warning('No previous standard found');
        }
    }, [selectedStandard, students, refreshStudents]);

    // Delete class/standard (via ServiceLayer)
    const handleDeleteStandard = useCallback(async (standardId) => {
        try {
            const studentsInClass = await ServiceLayer.getStudentsByStandard(standardId);
            for (const student of studentsInClass) {
                await ServiceLayer.deleteStudent(student.id);
            }
            await deleteStandard(standardId);
            setSelectedStandard('');
            await refreshStudents();
            toast.success(`Class "${standardId}" deleted with ${studentsInClass.length} students`);
        } catch (error) {
            console.error('Failed to delete class:', error);
            toast.error('Failed to delete class');
        }
    }, [deleteStandard, refreshStudents]);


    // Navigation handler — App.jsx only manages layout state (no feature-specific logic)
    const handleMenuNavigate = useCallback((menuId, itemId) => {
        setMenuContentType(itemId);
        setShowMenuContent(true);
    }, []);

    // Search — uses ServiceLayer (not direct db.*)
    const handleSearch = useCallback(async (query) => {
        setSearchQuery(query);
        if (query.trim()) {
            const results = await ServiceLayer.getAllStudents();
            const filtered = results
                .filter(s => JSON.stringify(s).toLowerCase().includes(query.toLowerCase()))
                .map((s, i) => ({ ...s, ledgerNo: i + 1 }));
            // Broadcast results via AppBus so any feature can pick them up
            AppBus.emit(APP_EVENTS.NAVIGATE_TO, { featureId: 'smart-search', params: { query, results: filtered } });
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

    // Import complete — broadcast data change so auto-backup fires
    const handleImportComplete = useCallback(async () => {
        await refreshStudents();
        await refreshLedger();
        AppBus.emit(APP_EVENTS.STUDENT_IMPORTED, { count: -1 }); // count unknown at shell level
    }, [refreshStudents, refreshLedger]);

    // Class upgrade handler — goes through ServiceLayer (never direct db.*)
    const handleUpgradeClass = useCallback(async () => {
        if (!selectedStandard) { toast.warning('Please select a standard first'); return; }
        const newStandard = prompt('Enter new standard name (e.g., "Standard 4-A"):');
        if (newStandard) {
            const count = await ServiceLayer.upgradeClass(selectedStandard, newStandard);
            toast.success(`Upgraded ${count} students to ${newStandard}`);
            await refreshStudents();
        }
    }, [selectedStandard, refreshStudents]);

    const handleAddDataBox = useCallback(async (fieldData) => {
        await addField(fieldData);
    }, [addField]);

    const handleRemoveDataBox = useCallback(async (fieldId) => {
        const customField = fields.find(f => f.id === parseInt(fieldId) || f.key === fieldId);
        if (customField) await deleteField(customField.id);
    }, [deleteField, fields]);

    const handleRenameDataBox = useCallback(async (fieldId, newName) => {
        const customField = fields.find(f => f.id === parseInt(fieldId) || f.key === fieldId);
        if (customField) {
            await updateField(customField.id, { name: newName });
        } else {
            const fieldRenames = settings.fieldRenames || {};
            fieldRenames[fieldId] = newName;
            await ServiceLayer.saveSetting('fieldRenames', fieldRenames);
        }
        toast.success(`Field renamed to "${newName}"`);
    }, [updateField, fields, settings.fieldRenames]);

    // Combine built-in and custom fields — delegates to feature logic
    const allFields = useMemo(() =>
        StudentLogic.getAllFields(settings.fieldRenames || {}, fields)
        , [fields, settings.fieldRenames]);


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
                        <EduNormLogo size="medium" />
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
                    <h2>Welcome back, {user?.displayName?.split(' ')[0] || user?.email?.split('@')[0] || 'User'}!</h2>
                    <p style={{ opacity: 0.7, marginBottom: '1.5rem' }}>Your data is protected by Phoenix Sync. 🔥</p>

                    {/* Menu Content or Main Dashboard */}
                    {showMenuContent && menuContentType ? (
                        <div className="menu-content-full-width">
                            <AppRouter
                                menuContentType={menuContentType}
                                onClose={() => { setShowMenuContent(false); setMenuContentType(null); }}
                                user={user}
                                ledger={ledger}
                                students={students}
                                standards={standards}
                                settings={settings}
                                selectedStandard={selectedStandard}
                                schoolName={schoolName}
                                schoolLogo={schoolLogo}
                                schoolContact={schoolContact}
                                schoolEmail={schoolEmail}
                                editingStudent={editingStudent}
                                searchQuery={searchQuery}
                                onSearch={setSearchQuery}
                                onUpdateStudent={updateStudent}
                                onRenameField={handleRenameDataBox}
                                onEditStudent={(student) => {
                                    setEditingStudent(student);
                                    setEditMode(true);
                                    setSelectedStandard(student.standard);
                                }}
                                onImportComplete={handleImportComplete}
                                onSchoolNameChange={setSchoolName}
                                onSchoolContactChange={setSchoolContact}
                                onSchoolEmailChange={setSchoolEmail}
                                onSchoolLogoChange={setSchoolLogo}
                                onSaveSettings={handleSaveSettings}
                                activeMenu={activeMenu}
                            />
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

                {/* Unified Footer Integrated into main flow */}
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

            {/* Right Panel */}
            <section className="glass-panel right-panel">
                <div style={{ marginTop: 'auto' }}>
                    <AdPlacement type="rectangle" />
                </div>
            </section>

            {
                showAdmin && (
                    <Suspense fallback={<BrandLoader message="Loading Admin Panel..." />}>
                        <AdminPanel
                            onClose={() => setShowAdmin(false)}
                            totalStudents={students.length}
                            totalStandards={standards?.length || 0}
                        />
                    </Suspense>
                )
            }

            <UpgradeModal />

            {/* Shell-level layout elements only */}
            <UndoRedoBar />
            <ToastContainer />

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
