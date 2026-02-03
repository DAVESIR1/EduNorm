import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Sidebar from './components/Layout/Sidebar';
import StepWizard, { DATA_FIELDS } from './components/DataEntry/StepWizard';
import ProfileViewer from './components/Profile/ProfileViewer';
import GeneralRegister from './components/Ledger/GeneralRegister';
import BackupRestore from './components/Backup/BackupRestore';
import LoginPage from './components/Auth/LoginPage';
import AdminPanel from './components/Admin/AdminPanel';
import { AdPlacement } from './components/Ads/AdBanner';
import UpgradeModal from './components/Premium/UpgradeModal';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { UserTierProvider, useUserTier } from './contexts/UserTierContext';
import {
    useSettings,
    useStudents,
    useStandards,
    useCustomFields,
    useLedger,
    useTheme
} from './hooks/useDatabase';
import * as db from './services/database';
import { Menu, Users, FileSpreadsheet, Sparkles, Download, Share2, Maximize2, Minimize2 } from 'lucide-react';
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

    // Hooks
    const { settings, updateSetting, loading: settingsLoading } = useSettings();
    const { standards, addStandard, loading: standardsLoading } = useStandards();
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

    // Save settings
    const handleSaveSettings = useCallback(async () => {
        await updateSetting('schoolName', schoolName);
        await updateSetting('schoolLogo', schoolLogo);
        await updateSetting('schoolContact', schoolContact);
        await updateSetting('schoolEmail', schoolEmail);
        await updateSetting('teacherName', teacherName);
        await updateSetting('selectedStandard', selectedStandard);
        alert('Settings saved successfully!');
    }, [schoolName, schoolLogo, schoolContact, schoolEmail, teacherName, selectedStandard, updateSetting]);

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
    }, [addStudent, updateStudent, editingStudent, selectedStandard, refreshStudents, refreshLedger]);

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

    // Share/Export - opens backup modal
    const handleShare = useCallback(() => {
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
        }
        // Note: Built-in fields renaming could be stored in settings in future
    }, [updateField, fields]);

    // Combine built-in and custom fields for dropdown
    const allFields = useMemo(() => {
        const builtInFields = DATA_FIELDS.flatMap(step =>
            step.fields.map(f => ({ key: f.key, label: f.label, type: f.type, builtIn: true }))
        );
        const customFieldsList = fields.map(f => ({ key: f.id.toString(), label: f.name, type: f.type, builtIn: false }));
        return [...builtInFields, ...customFieldsList];
    }, [fields]);

    // Handle import from Excel (opens backup modal on import tab)
    const handleImportExcel = useCallback(() => {
        setShowBackup(true);
        // The BackupRestore modal will show the Import tab
    }, []);

    // Auth loading state
    if (authLoading) {
        return (
            <div className="loading-screen">
                <div className="loading-content">
                    <div className="loading-spinner animate-pulse">🔐</div>
                    <h2 className="display-font gradient-text">Authenticating...</h2>
                </div>
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
                    <h2 className="display-font gradient-text">Loading EduData...</h2>
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

            {/* Mobile menu button */}
            <button
                className="mobile-menu-btn btn btn-primary btn-icon"
                onClick={() => setSidebarOpen(true)}
            >
                <Menu size={24} />
            </button>

            {/* Sidebar */}
            <Sidebar
                isOpen={sidebarOpen}
                onToggle={() => setSidebarOpen(!sidebarOpen)}
                schoolName={schoolName}
                setSchoolName={setSchoolName}
                schoolLogo={schoolLogo}
                setSchoolLogo={setSchoolLogo}
                schoolContact={schoolContact}
                setSchoolContact={setSchoolContact}
                teacherName={teacherName}
                setTeacherName={setTeacherName}
                selectedStandard={selectedStandard}
                setSelectedStandard={setSelectedStandard}
                standards={standards}
                onAddStandard={addStandard}
                onSaveSettings={handleSaveSettings}
                onOpenProfile={() => setShowProfile(true)}
                onUpgradeClass={handleUpgradeClass}
                onDowngradeClass={handleDowngradeClass}
                onGoToSheet={() => setShowLedger(true)}
                theme={theme}
                onChangeTheme={changeTheme}
                onEditMode={handleEditMode}
                editMode={editMode}
                onShare={handleShare}
                onAddDataBox={handleAddDataBox}
                onRemoveDataBox={handleRemoveDataBox}
                onRenameDataBox={handleRenameDataBox}
                customFields={fields}
                allFields={allFields}
                schoolEmail={schoolEmail}
                setSchoolEmail={setSchoolEmail}
                onImportExcel={handleImportExcel}
                user={user}
                onLogout={logout}
                tier={tier}
                isAdmin={isAdmin}
                isFree={isFree}
                onOpenAdmin={() => setShowAdmin(true)}
                onOpenUpgrade={() => setShowUpgradeModal(true)}
            />

            {/* Main Content */}
            <main className={`main-content ${sidebarOpen ? 'sidebar-open' : 'sidebar-collapsed'}`}>
                {/* Header */}
                <header className="main-header">
                    <div className="header-info">
                        <h1 className="display-font gradient-text">
                            <Sparkles className="header-icon" size={28} />
                            MN School Sathi
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
                            View Ledger
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

                {/* Top Ad Banner - Non-intrusive, below header */}
                <div className="top-ad-wrapper">
                    <AdPlacement type="banner" />
                </div>

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

                {/* Data Entry Form */}
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
                                <span className="empty-icon animate-float">🏫</span>
                                <h2 className="display-font">Welcome to EduData!</h2>
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
            />

            {/* Admin Panel */}
            {showAdmin && (
                <AdminPanel
                    onClose={() => setShowAdmin(false)}
                    totalStudents={ledger.reduce((sum, s) => sum + (s.students?.length || 0), 0)}
                    totalStandards={standards.length}
                />
            )}

            {/* Ad Banner for Free Users */}
            <div className="bottom-ad-container">
                <AdPlacement type="leaderboard" />
            </div>

            {/* Footer with Legal Links */}
            <footer className="app-footer">
                <div className="footer-content">
                    <span>© 2026 MN School Sathi</span>
                    <div className="footer-links">
                        <a href="/privacy" target="_blank">Privacy Policy</a>
                        <span className="divider">|</span>
                        <a href="/terms" target="_blank">Terms of Service</a>
                    </div>
                </div>
            </footer>
        </div>
    );
}

// App wrapper with AuthProvider and UserTierProvider
function App() {
    return (
        <AuthProvider>
            <UserTierProvider>
                <AppContent />
                <UpgradeModal />
            </UserTierProvider>
        </AuthProvider>
    );
}

export default App;
