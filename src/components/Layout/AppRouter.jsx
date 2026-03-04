/**
 * APP ROUTER — EduNorm Content Router
 *
 * SANDBOX RULE: This file is the ONLY place that knows which component
 * maps to which menu item. App.jsx stays thin.
 *
 * When you add a new feature/menu item:
 *   1. Add its lazy import here
 *   2. Add its case here
 *   3. Done. App.jsx never needs to be touched.
 *
 * Props:
 *   menuContentType  — the current menu item ID (string)
 *   onClose          — callback to close the content panel
 *   user             — current auth user
 *   ledger           — all students (cross-standard)
 *   students         — students in selected standard
 *   standards        — list of standards
 *   settings         — app settings
 *   selectedStandard — currently selected standard
 *   schoolName       — school name string
 *   schoolLogo       — school logo URL
 *   schoolContact    — school contact
 *   schoolEmail      — school email
 *   editingStudent   — currently editing student (or null)
 *   searchQuery      — current search query
 *   onSearch         — search handler
 *   onUpdateStudent  — update student callback
 *   onRenameField    — rename field callback
 *   onEditStudent    — edit student callback (navigates back to form)
 *   onImportComplete — called after import finishes
 *   onSchoolNameChange    — setter
 *   onSchoolContactChange — setter
 *   onSchoolEmailChange   — setter
 *   onSchoolLogoChange    — setter
 *   onSaveSettings        — save handler
 *   activeMenu       — active menu group (for CustomWindowCreator)
 */

import React, { lazy, Suspense } from 'react';
import ComponentErrorBoundary from '../Common/ErrorBoundary';
import BrandLoader from '../Common/BrandLoader';
import { ROUTES } from '../../shared/constants/routes.js';

// ─── Lazy imports (all feature components live here, NOT in App.jsx) ───────────
const StepWizard = lazy(() => import('../DataEntry/StepWizard'));
const ProfileViewer = lazy(() => import('../../features/StudentManagement/Profile/ProfileViewer'));
const GeneralRegister = lazy(() => import('../../features/StudentManagement/view'));
const BackupRestore = lazy(() => import('../Backup/BackupRestore'));
const SyncBackupView = lazy(() => import('../../features/SyncBackup/view'));
const AdminPanel = lazy(() => import('../../features/AdminDashboard/view'));
const CertificateGenerator = lazy(() => import('../Features/CertificateGenerator'));
const AnalyticsDashboard = lazy(() => import('../Features/AnalyticsDashboard'));
const QRAttendance = lazy(() => import('../Features/QRAttendance'));
const SmartSearch = lazy(() => import('../Features/SmartSearch'));
const DocumentScanner = lazy(() => import('../Features/DocumentScanner'));
const VoiceInput = lazy(() => import('../Features/VoiceInput'));
const FamilyTree = lazy(() => import('../Features/FamilyTree'));
const ProgressTimeline = lazy(() => import('../Features/ProgressTimeline'));
const WhatsAppMessenger = lazy(() => import('../Features/WhatsAppMessenger'));
const PhotoEnhancement = lazy(() => import('../Features/PhotoEnhancement'));
const SchoolProfile = lazy(() => import('../../features/SchoolProfile/view'));
const StaffInfo = lazy(() => import('../HOI/StaffInfo'));
const HOIDiary = lazy(() => import('../HOI/HOIDiary'));
const CustomWindowCreator = lazy(() => import('../Common/CustomWindowCreator'));
const ComingSoonPage = lazy(() => import('../Common/ComingSoonPage'));
const SalaryBook = lazy(() => import('../Teacher/SalaryBook'));
const TeacherProfile = lazy(() => import('../Teacher/TeacherProfile'));
const StudentLogin = lazy(() => import('../Student/StudentLogin'));
const CorrectionRequest = lazy(() => import('../Student/CorrectionRequest'));
const QAChat = lazy(() => import('../Student/QAChat'));
const StudentCertificates = lazy(() => import('../Student/StudentCertificates'));
const ClassManagement = lazy(() => import('../HOI/ClassManagement'));
const UsageInstructions = lazy(() => import('../Features/UsageInstructions'));

// ─── Component ────────────────────────────────────────────────────────────────
export function AppRouter({
    menuContentType,
    onClose,
    user,
    ledger,
    students,
    standards,
    settings,
    selectedStandard,
    schoolName,
    schoolLogo,
    schoolContact,
    schoolEmail,
    editingStudent,
    searchQuery,
    onSearch,
    onUpdateStudent,
    onRenameField,
    onEditStudent,
    onImportComplete,
    onSchoolNameChange,
    onSchoolContactChange,
    onSchoolEmailChange,
    onSchoolLogoChange,
    onSaveSettings,
    activeMenu,
}) {
    if (!menuContentType) return null;

    const closeHandler = onClose || (() => { });

    const renderContent = () => {
        switch (menuContentType) {

            // ── School Menu ────────────────────────────────────────────────
            case ROUTES.SCHOOL_PROFILE:
            case ROUTES.UPLOAD_LOGO:
                return (
                    <ComponentErrorBoundary componentName="School Profile">
                        <SchoolProfile
                            schoolName={schoolName}
                            schoolContact={schoolContact}
                            schoolEmail={schoolEmail}
                            schoolLogo={schoolLogo}
                            onSchoolNameChange={onSchoolNameChange}
                            onSchoolContactChange={onSchoolContactChange}
                            onSchoolEmailChange={onSchoolEmailChange}
                            onSchoolLogoChange={onSchoolLogoChange}
                            onSaveSettings={onSaveSettings}
                        />
                    </ComponentErrorBoundary>
                );

            case ROUTES.GENERAL_REGISTER:
                return (
                    <ComponentErrorBoundary componentName="Student Ledger">
                        <GeneralRegister
                            isOpen={true}
                            isFullPage={true}
                            students={ledger}
                            onSearch={onSearch}
                            searchQuery={searchQuery}
                            onUpdateStudent={onUpdateStudent}
                            onRenameField={onRenameField}
                            fieldRenames={settings?.fieldRenames || {}}
                            onEditStudent={(student) => {
                                onEditStudent?.(student);
                                closeHandler();
                            }}
                            onClose={closeHandler}
                        />
                    </ComponentErrorBoundary>
                );

            case ROUTES.STUDENT_PROFILE:
            case ROUTES.ID_CARD:
                return (
                    <ComponentErrorBoundary componentName="Profile">
                        <ProfileViewer
                            isOpen={true}
                            isFullPage={true}
                            onClose={closeHandler}
                            students={user?.role === 'student' ? [user] : ledger}
                            standards={standards}
                            schoolName={schoolName}
                            settings={settings}
                            schoolLogo={schoolLogo}
                            schoolContact={schoolContact}
                            initialTab={menuContentType === ROUTES.ID_CARD ? 'id' : 'profile'}
                        />
                    </ComponentErrorBoundary>
                );

            case ROUTES.CERTIFICATE:
                return (
                    <ComponentErrorBoundary componentName="Certificate">
                        <CertificateGenerator
                            isOpen={true}
                            isFullPage={true}
                            onClose={closeHandler}
                            student={editingStudent || (students?.length > 0 ? students[0] : null)}
                            schoolName={schoolName}
                            schoolLogo={schoolLogo}
                        />
                    </ComponentErrorBoundary>
                );

            case ROUTES.SYNC_BACKUP:
                return (
                    <ComponentErrorBoundary componentName="Backup & Sync">
                        <SyncBackupView user={user} onClose={closeHandler} />
                    </ComponentErrorBoundary>
                );

            case ROUTES.DATA_EXPORT:
                return (
                    <ComponentErrorBoundary componentName="Data Import/Export">
                        <BackupRestore
                            isOpen={true}
                            isFullPage={true}
                            user={user}
                            onClose={closeHandler}
                            ledger={ledger}
                            standards={standards}
                            selectedStandard={selectedStandard}
                            onImportComplete={onImportComplete}
                        />
                    </ComponentErrorBoundary>
                );

            case ROUTES.TEACHERS_PROFILE:
                return (
                    <ComponentErrorBoundary componentName="Staff Info">
                        <StaffInfo />
                    </ComponentErrorBoundary>
                );

            // ── HOI Menu ──────────────────────────────────────────────────
            case ROUTES.STAFF_INFO:
                return (
                    <ComponentErrorBoundary componentName="Staff Info">
                        <StaffInfo />
                    </ComponentErrorBoundary>
                );

            case ROUTES.HOI_DIARY:
                return (
                    <ComponentErrorBoundary componentName="HOI Diary">
                        <HOIDiary />
                    </ComponentErrorBoundary>
                );

            case ROUTES.CLASS_MANAGEMENT:
            case ROUTES.CLASS_MANAGEMENT_TEACHER:
                return (
                    <ComponentErrorBoundary componentName="Class Management">
                        <ClassManagement />
                    </ComponentErrorBoundary>
                );

            case ROUTES.CLASS_UPGRADE:
                return (
                    <ComponentErrorBoundary componentName="Class Upgrade">
                        <ClassUpgradePanel
                            standards={standards}
                            onClose={closeHandler}
                        />
                    </ComponentErrorBoundary>
                );

            // ── Teacher Menu ──────────────────────────────────────────────
            case ROUTES.SELF_PROFILE:
                return (
                    <ComponentErrorBoundary componentName="Teacher Profile">
                        <TeacherProfile />
                    </ComponentErrorBoundary>
                );

            case ROUTES.SALARY_BOOK:
                return (
                    <ComponentErrorBoundary componentName="Salary Book">
                        <SalaryBook />
                    </ComponentErrorBoundary>
                );

            // ── Student Menu ──────────────────────────────────────────────
            case ROUTES.STUDENT_LOGIN:
                return (
                    <ComponentErrorBoundary componentName="Student Login">
                        <StudentLogin onBack={closeHandler} />
                    </ComponentErrorBoundary>
                );

            case ROUTES.CORRECTION_REQUEST:
                return (
                    <ComponentErrorBoundary componentName="Correction Request">
                        <CorrectionRequest studentData={user} onBack={closeHandler} />
                    </ComponentErrorBoundary>
                );

            case ROUTES.CERTIFICATE_DOWNLOAD:
                return (
                    <ComponentErrorBoundary componentName="My Certificates">
                        <StudentCertificates user={user} onBack={closeHandler} />
                    </ComponentErrorBoundary>
                );

            case ROUTES.QA_CHAT:
                return (
                    <ComponentErrorBoundary componentName="Q&A Chat">
                        <QAChat studentData={user} onBack={closeHandler} />
                    </ComponentErrorBoundary>
                );

            // ── Custom Windows ─────────────────────────────────────────────
            case ROUTES.CUSTOM_WINDOW:
            case ROUTES.CUSTOM_WINDOW_HOI:
            case ROUTES.CUSTOM_WINDOW_TEACHER:
                return (
                    <CustomWindowCreator
                        menuId={activeMenu}
                        onSave={closeHandler}
                        onCancel={closeHandler}
                    />
                );

            // ── Other ──────────────────────────────────────────────────────
            case ROUTES.USAGE_INSTRUCTIONS:
                return <UsageInstructions onBack={closeHandler} />;

            case ROUTES.HELP_SUPPORT:
                return <HelpSupportPanel user={user} onClose={closeHandler} />;

            // ── Feature Overlay Routes (previously stuck in App.jsx) ───────────────
            case ROUTES.SMART_SEARCH:
                return (
                    <ComponentErrorBoundary componentName="Smart Search">
                        <SmartSearch
                            isOpen={true}
                            onClose={closeHandler}
                            students={students || []}
                            onSelectStudent={(student) => {
                                closeHandler();
                            }}
                        />
                    </ComponentErrorBoundary>
                );

            case ROUTES.ANALYTICS:
                return (
                    <ComponentErrorBoundary componentName="Analytics">
                        <AnalyticsDashboard
                            isOpen={true}
                            onClose={closeHandler}
                            students={students || []}
                            standards={standards || []}
                            ledger={ledger || []}
                        />
                    </ComponentErrorBoundary>
                );

            case ROUTES.QR_ATTENDANCE:
                return (
                    <ComponentErrorBoundary componentName="QR Attendance">
                        <QRAttendance
                            isOpen={true}
                            onClose={closeHandler}
                            students={students || []}
                            schoolName={schoolName}
                        />
                    </ComponentErrorBoundary>
                );

            case ROUTES.WHATSAPP:
                return (
                    <ComponentErrorBoundary componentName="WhatsApp Messenger">
                        <WhatsAppMessenger
                            isOpen={true}
                            onClose={closeHandler}
                            students={students || []}
                            schoolName={schoolName}
                        />
                    </ComponentErrorBoundary>
                );

            case ROUTES.DOC_SCANNER:
                return (
                    <ComponentErrorBoundary componentName="Document Scanner">
                        <DocumentScanner
                            isOpen={true}
                            onClose={closeHandler}
                            onDataExtracted={(data) => console.log('[DocScanner] extracted:', data)}
                        />
                    </ComponentErrorBoundary>
                );

            case ROUTES.VOICE_INPUT:
                return (
                    <ComponentErrorBoundary componentName="Voice Input">
                        <VoiceInput
                            isOpen={true}
                            onClose={closeHandler}
                            onVoiceData={(data) => console.log('[VoiceInput]:', data)}
                        />
                    </ComponentErrorBoundary>
                );

            case ROUTES.FAMILY_TREE:
                return (
                    <ComponentErrorBoundary componentName="Family Tree">
                        <FamilyTree
                            isOpen={true}
                            onClose={closeHandler}
                            student={students?.[0] || null}
                        />
                    </ComponentErrorBoundary>
                );

            case ROUTES.PROGRESS_TIMELINE:
                return (
                    <ComponentErrorBoundary componentName="Progress Timeline">
                        <ProgressTimeline
                            isOpen={true}
                            onClose={closeHandler}
                            student={students?.[0] || null}
                        />
                    </ComponentErrorBoundary>
                );

            case ROUTES.PHOTO_ENHANCE:
                return (
                    <ComponentErrorBoundary componentName="Photo Enhancement">
                        <PhotoEnhancement
                            isOpen={true}
                            onClose={closeHandler}
                            onPhotoEnhanced={(photo) => console.log('[PhotoEnhancement]:', photo)}
                        />
                    </ComponentErrorBoundary>
                );

            // Coming Soon
            case ROUTES.DEAD_STOCK:
            case ROUTES.AUDIT_REGISTER:
            case ROUTES.BILL_REGISTER:
            case ROUTES.NEWS_CIRCULARS:
            case ROUTES.PROGRAMS_EVENTS:
            case ROUTES.ACTIVITY_GALLERY:
                return <ComingSoonPage featureId={menuContentType} onBack={closeHandler} />;

            default:
                return <ComingSoonPage featureId={menuContentType} onBack={closeHandler} />;
        }
    };

    return (
        <Suspense fallback={<BrandLoader message="Loading..." />}>
            {renderContent()}
        </Suspense>
    );
}

// ─── Inline sub-components (small, tightly coupled to routing only) ───────────

/**
 * Class Upgrade Panel — rendered when user clicks "Class Upgrade" in menu.
 * Extracted from App.jsx inline JSX.
 */
function ClassUpgradePanel({ standards = [], onClose }) {
    const { toast } = require('../Common/Toast').default || {};

    const handleUpgrade = async (std) => {
        const numMatch = (std.name || std.id).match(/(\d+)/);
        const nextNum = numMatch ? parseInt(numMatch[1]) + 1 : null;
        const suggestedNext = nextNum ? (std.name || std.id).replace(/\d+/, nextNum) : '';

        const newName = prompt(`Upgrade "${std.name || std.id}" to:`, suggestedNext || '');
        if (newName && newName.trim()) {
            try {
                // Use ServiceLayer — never direct db access from AppRouter
                const ServiceLayer = (await import('../../services/ServiceLayer.js')).default;
                const count = await ServiceLayer.upgradeClass(std.id, newName.trim());
                // Notify app via AppBus
                const { default: AppBus, APP_EVENTS } = await import('../../core/AppBus');
                AppBus.emit(APP_EVENTS.STANDARD_CHANGED, { from: std.id, to: newName.trim() });
                alert(`✅ Upgraded ${count} students from "${std.name || std.id}" → "${newName.trim()}"`);
            } catch (err) {
                alert('❌ Upgrade failed: ' + err.message);
            }
        }
    };

    return (
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
                                    onClick={() => handleUpgrade(std)}
                                >
                                    ⬆️ {suggestedNext ? `→ ${suggestedNext}` : 'Upgrade'}
                                </button>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

/**
 * Help & Support Panel — extracted from App.jsx inline JSX.
 */
function HelpSupportPanel({ user, onClose }) {
    const handleSubmit = (e) => {
        e.preventDefault();
        const subject = e.target.subject.value;
        const message = e.target.message.value;
        const email = user?.email || '';
        const mailtoLink = `mailto:help@edunorm.in?subject=${encodeURIComponent('[EduNorm Support] ' + subject)}&body=${encodeURIComponent(message + '\n\n---\nFrom: ' + email)}`;
        window.open(mailtoLink);
    };

    return (
        <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
            <h2 style={{ marginBottom: '8px', fontSize: '1.3rem' }}>💬 Help & Suggestions</h2>
            <p style={{ color: 'var(--gray-600)', marginBottom: '16px', fontSize: '0.9rem' }}>
                Have a question, bug report, or suggestion? Send us a message!
            </p>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <input name="subject" className="input-field" placeholder="Subject (e.g. Bug Report, Feature Request)" required style={{ padding: '10px 14px' }} />
                <textarea name="message" className="input-field" placeholder="Type your message here..." required rows={6} style={{ padding: '10px 14px', resize: 'vertical', minHeight: '120px' }} />
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                        📧 Send to help@edunorm.in
                    </button>
                    <button type="button" className="btn" onClick={onClose}>
                        Cancel
                    </button>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--gray-400)', textAlign: 'center' }}>
                    🔒 Your data is safe. We never share student information with anyone.
                </p>
            </form>
        </div>
    );
}

export default AppRouter;
