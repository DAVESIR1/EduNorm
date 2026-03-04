/**
 * ROUTES — EduNorm Navigation Constants
 *
 * Single source of truth for all menu content type IDs.
 * AppRouter, NewSidebar, and any feature that emits NAVIGATE_TO
 * should import from here instead of using magic strings.
 *
 * Rule: NEVER use raw string literals like 'general-register' in code.
 *       Always use ROUTES.GENERAL_REGISTER.
 */

export const ROUTES = {
    // ── School ────────────────────────────────────────────────────
    SCHOOL_PROFILE: 'school-profile',
    GENERAL_REGISTER: 'general-register',
    STUDENT_PROFILE: 'student-profile',
    ID_CARD: 'id-card',
    CERTIFICATE: 'certificate',
    DATA_EXPORT: 'data-export',
    UPLOAD_LOGO: 'upload-logo',
    TEACHERS_PROFILE: 'teachers-profile',

    // ── HOI ───────────────────────────────────────────────────────
    STAFF_INFO: 'staff-info',
    HOI_DIARY: 'hoi-diary',
    CLASS_MANAGEMENT: 'class-management',
    CLASS_MANAGEMENT_TEACHER: 'class-management-teacher',
    CLASS_UPGRADE: 'class-upgrade',

    // ── Teacher ───────────────────────────────────────────────────
    SELF_PROFILE: 'self-profile',
    SALARY_BOOK: 'salary-book',

    // ── Student ───────────────────────────────────────────────────
    STUDENT_LOGIN: 'student-login',
    CORRECTION_REQUEST: 'correction-request',
    CERTIFICATE_DOWNLOAD: 'certificate-download',
    QA_CHAT: 'qa-chat',

    // ── Other ─────────────────────────────────────────────────────
    SYNC_BACKUP: 'sync-backup',
    DATA_EXPORT: 'data-export',
    USAGE_INSTRUCTIONS: 'usage-instructions',
    HELP_SUPPORT: 'help-support',
    ADMIN: 'admin',        // special: opens AdminPanel overlay
    SMART_SEARCH: 'smart-search',

    // ── Custom Windows ────────────────────────────────────────────
    CUSTOM_WINDOW: 'custom-window',
    CUSTOM_WINDOW_HOI: 'custom-window-hoi',
    CUSTOM_WINDOW_TEACHER: 'custom-window-teacher',

    // ── Coming Soon ──────────────────────────────────────────────────────
    DEAD_STOCK: 'dead-stock',
    AUDIT_REGISTER: 'audit-register',
    BILL_REGISTER: 'bill-register',
    NEWS_CIRCULARS: 'news-circulars',
    PROGRAMS_EVENTS: 'programs-events',
    ACTIVITY_GALLERY: 'activity-gallery',

    // ── Feature Overlays (previously inline in App.jsx) ────────────────────
    SMART_SEARCH: 'smart-search',
    ANALYTICS: 'analytics',
    QR_ATTENDANCE: 'qr-attendance',
    WHATSAPP: 'whatsapp',
    DOC_SCANNER: 'doc-scanner',
    VOICE_INPUT: 'voice-input',
    FAMILY_TREE: 'family-tree',
    PROGRESS_TIMELINE: 'progress-timeline',
    PHOTO_ENHANCE: 'photo-enhance',
};

export default ROUTES;
