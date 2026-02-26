import React from 'react';

// Custom SVG Icons with Minimal Colorful Line Style
// Each icon has its own signature color matching the reference style

export const StudentProfileIcon = ({ size = 20, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} stroke="#9B7ED9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
        <circle cx="12" cy="7" r="4" />
    </svg>
);

export const IDCardIcon = ({ size = 24, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
        <rect x="4" y="10" width="40" height="28" rx="4" stroke="#3D9970" strokeWidth="2.5" />
        <circle cx="16" cy="22" r="5" stroke="#3D9970" strokeWidth="2" />
        <path d="M10 32C10 30 12 28 16 28C20 28 22 30 22 32" stroke="#3D9970" strokeWidth="2" strokeLinecap="round" />
        <path d="M28 18H38" stroke="#3D9970" strokeWidth="2" strokeLinecap="round" />
        <path d="M28 24H38" stroke="#3D9970" strokeWidth="2" strokeLinecap="round" />
        <path d="M28 30H34" stroke="#3D9970" strokeWidth="2" strokeLinecap="round" />
    </svg>
);

export const CertificateIcon = ({ size = 24, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
        <path d="M8 8H36V34C36 34 32 32 30 34L28 38L24 34L20 38L18 34C16 32 12 34 12 34V8" stroke="#E5A021" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M10 6H38C39 6 40 7 40 8V10" stroke="#E5A021" strokeWidth="2" strokeLinecap="round" />
        <circle cx="24" cy="18" r="6" stroke="#E5A021" strokeWidth="2" />
        <path d="M21 18L23 20L27 16" stroke="#E5A021" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M16 28H32" stroke="#E5A021" strokeWidth="2" strokeLinecap="round" />
    </svg>
);

export const GRBookIcon = ({ size = 24, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
        <path d="M8 10C8 8 10 6 12 6H22C24 6 24 8 24 10V40C24 42 22 44 22 44C20 42 12 42 12 42C10 42 8 40 8 38V10Z" stroke="#E07B67" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M40 10C40 8 38 6 36 6H26C24 6 24 8 24 10V40C24 42 26 44 26 44C28 42 36 42 36 42C38 42 40 40 40 38V10Z" stroke="#E07B67" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <text x="12" y="28" fontFamily="Arial" fontSize="10" fontWeight="bold" fill="#E07B67">GR</text>
    </svg>
);

export const StudentDataIcon = ({ size = 24, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
        <rect x="8" y="28" width="6" height="14" rx="1" stroke="#9B7ED9" strokeWidth="2" />
        <rect x="17" y="20" width="6" height="22" rx="1" stroke="#9B7ED9" strokeWidth="2" />
        <rect x="26" y="12" width="6" height="30" rx="1" stroke="#9B7ED9" strokeWidth="2" />
        <ellipse cx="39" cy="16" rx="5" ry="6" stroke="#9B7ED9" strokeWidth="2" />
        <ellipse cx="39" cy="26" rx="5" ry="6" stroke="#9B7ED9" strokeWidth="2" />
        <ellipse cx="39" cy="36" rx="5" ry="6" stroke="#9B7ED9" strokeWidth="2" />
    </svg>
);

export const HomeIcon = ({ size = 24, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
        <path d="M8 24L24 8L40 24" stroke="#4A90A4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M12 22V40H20V30H28V40H36V22" stroke="#4A90A4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

export const SettingsIcon = ({ size = 20, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
);

export const ExportIcon = ({ size = 24, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
        <path d="M24 8V30" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M16 16L24 8L32 16" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M8 32V38C8 40 10 42 12 42H36C38 42 40 40 40 38V32" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
);

export const ImportIcon = ({ size = 24, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
        <path d="M24 30V8" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M16 22L24 30L32 22" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M8 32V38C8 40 10 42 12 42H36C38 42 40 40 40 38V32" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
);

export const ShareIcon = ({ size = 24, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
        <circle cx="36" cy="12" r="5" stroke="#8B5CF6" strokeWidth="2.5" />
        <circle cx="12" cy="24" r="5" stroke="#8B5CF6" strokeWidth="2.5" />
        <circle cx="36" cy="36" r="5" stroke="#8B5CF6" strokeWidth="2.5" />
        <path d="M17 21L31 14M17 27L31 34" stroke="#8B5CF6" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
);

export const CloudUploadIcon = ({ size = 24, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
        <path d="M16 32C10 32 6 28 6 22C6 16 10 12 16 12C16 6 20 4 24 4C30 4 34 8 34 14C34 14 40 14 40 22C40 30 34 32 32 32" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M24 22V40" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M18 28L24 22L30 28" stroke="#059669" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

export const CloudDownloadIcon = ({ size = 24, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
        <path d="M16 32C10 32 6 28 6 22C6 16 10 12 16 12C16 6 20 4 24 4C30 4 34 8 34 14C34 14 40 14 40 22C40 30 34 32 32 32" stroke="#0EA5E9" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M24 40V22" stroke="#0EA5E9" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M18 34L24 40L30 34" stroke="#0EA5E9" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

export const SchoolIcon = ({ size = 24, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
        <path d="M24 4L4 16L24 28L44 16L24 4Z" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M10 20V36L24 44L38 36V20" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M44 16V32" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
);

export const UserAddIcon = ({ size = 24, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
        <circle cx="20" cy="14" r="8" stroke="#10B981" strokeWidth="2.5" />
        <path d="M6 40V38C6 33.5817 9.5817 30 14 30H26C30.4183 30 34 33.5817 34 38V40" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M40 18V30M34 24H46" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
);

export const TrashIcon = ({ size = 24, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
        <path d="M12 14H36L34 42H14L12 14Z" stroke="#EF4444" strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M8 14H40" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M18 14V10C18 8 20 6 22 6H26C28 6 30 8 30 10V14" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M20 20V34M24 20V34M28 20V34" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
);

export const EditIcon = ({ size = 20, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
);

export const SaveIcon = ({ size = 20, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
        <polyline points="17 21 17 13 7 13 7 21" />
        <polyline points="7 3 7 8 15 8" />
    </svg>
);

export const MenuIcon = ({ size = 20, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="3" y1="12" x2="21" y2="12" />
        <line x1="3" y1="6" x2="21" y2="6" />
        <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
);

export const ChevronLeftIcon = ({ size = 20, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="15 18 9 12 15 6" />
    </svg>
);

export const ChevronRightIcon = ({ size = 20, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="9 18 15 12 9 6" />
    </svg>
);

export const PlusIcon = ({ size = 20, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
);

export const XIcon = ({ size = 20, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

export const CheckIcon = ({ size = 20, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
    </svg>
);

export const GlobeIcon = ({ size = 20, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
);

export const SearchIcon = ({ size = 20, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
);

export const PrinterIcon = ({ size = 20, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="6 9 6 2 18 2 18 9" />
        <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
        <rect x="6" y="14" width="12" height="8" />
    </svg>
);

export const DownloadIcon = ({ size = 20, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
);

export const MaximizeIcon = ({ size = 20, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} stroke="#4A90A4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
    </svg>
);

export const MinimizeIcon = ({ size = 20, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} stroke="#4A90A4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
    </svg>
);

export const UploadIcon = ({ size = 20, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
);

export const MailIcon = ({ size = 20, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
        <polyline points="22,6 12,13 2,6" />
    </svg>
);

export const PhoneIcon = ({ size = 20, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
);

export const LogoutIcon = ({ size = 20, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
        <polyline points="16 17 21 12 16 7" />
        <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
);

export const CrownIcon = ({ size = 20, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m2 4 3 12h14l3-12-6 7-6-7-6 7-6-7z" style={{ fill: 'none' }} />
    </svg>
);

export const ShieldIcon = ({ size = 20, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
);

export const SparklesIcon = ({ size = 20, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    </svg>
);

export const BarChartIcon = ({ size = 20, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
);

export const ImageIcon = ({ size = 20, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
    </svg>
);

export const FileTextIcon = ({ size = 20, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
    </svg>
);

export const UsersIcon = ({ size = 20, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} stroke="#9B7ED9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
);

export const CalendarIcon = ({ size = 20, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
);

export const AwardIcon = ({ size = 20, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="7" />
        <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
    </svg>
);

export const TrophyIcon = ({ size = 20, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 21h8" />
        <path d="M12 17v4" />
        <path d="M7 4h10c.66 0 1.2.54 1.2 1.2v6.6c0 3.42-2.78 6.2-6.2 6.2s-6.2-2.78-6.2-6.2V5.2C5.8 4.54 6.34 4 7 4z" />
        <path d="M18.2 5.2c.66 0 1.2.54 1.2 1.2v.3c0 2.4-1.9 4.34-4.26 4.3h-.74" />
        <path d="M5.8 5.2C5.14 5.2 4.6 5.74 4.6 6.4v.3c0 2.4 1.9 4.34 4.26 4.3h.74" />
    </svg>
);

export const SunIcon = ({ size = 20, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="5" />
        <line x1="12" y1="1" x2="12" y2="3" />
        <line x1="12" y1="21" x2="12" y2="23" />
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
        <line x1="1" y1="12" x2="3" y2="12" />
        <line x1="21" y1="12" x2="23" y2="12" />
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
);

export const MoonIcon = ({ size = 20, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
);

export const RainbowIcon = ({ size = 20, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 17a10 10 0 0 0-20 0" />
        <path d="M6 17a6 6 0 0 1 12 0" />
        <path d="M10 17a2 2 0 0 1 4 0" />
    </svg>
);

export const QrCodeIcon = ({ size = 20, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <path d="M3 14h7v7H3z" />
    </svg>
);

export const WandIcon = ({ size = 20, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 4V2" />
        <path d="M15 16v-2" />
        <path d="M8 9h2" />
        <path d="M20 9h2" />
        <path d="M17.8 11.8 19 13" />
        <path d="M15 9h0" />
        <path d="M17.8 6.2 19 5" />
        <path d="m3 21 9-9" />
        <path d="M12.2 6.2 11 5" />
    </svg>
);

export const ArrowUpCircleIcon = ({ size = 20, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="16 12 12 8 8 12" />
        <line x1="12" y1="16" x2="12" y2="8" />
    </svg>
);

export const ArrowDownCircleIcon = ({ size = 20, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="8 12 12 16 16 12" />
        <line x1="12" y1="8" x2="12" y2="16" />
    </svg>
);

export const BookOpenIcon = ({ size = 20, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
);

export const CameraIcon = ({ size = 20, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
        <circle cx="12" cy="13" r="4" />
    </svg>
);

export const MicIcon = ({ size = 20, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <line x1="12" y1="19" x2="12" y2="23" />
        <line x1="8" y1="23" x2="16" y2="23" />
    </svg>
);

export const GitBranchIcon = ({ size = 20, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="6" y1="3" x2="6" y2="15" />
        <circle cx="18" cy="6" r="3" />
        <circle cx="6" cy="18" r="3" />
        <path d="M18 9a9 9 0 0 1-9 9" />
    </svg>
);

export const ClockIcon = ({ size = 20, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
    </svg>
);

export const MessageCircleIcon = ({ size = 20, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
);

export const RotateCcwIcon = ({ size = 20, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="1 4 1 10 7 10" />
        <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
    </svg>
);

export const RotateCwIcon = ({ size = 20, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 4 23 10 17 10" />
        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
);

export const InfrastructureIcon = ({ size = 24, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
        <path d="M4 42H44" stroke="#8B5CF6" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M8 42V14L24 6L40 14V42" stroke="#8B5CF6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M16 42V30H32V42" stroke="#8B5CF6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M16 20H20" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" />
        <path d="M28 20H32" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" />
        <path d="M16 26H20" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" />
        <path d="M28 26H32" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" />
    </svg>
);

// Palette Icon for theme selection
export const PaletteIcon = ({ size = 24, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
        <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
        <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
        <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
        <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
    </svg>
);

// Language/Globe Icon for language selection  
export const LanguageIcon = ({ size = 24, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
);

// Export all icons as a map for easy lookup
export const IconMap = {
    studentProfile: StudentProfileIcon,
    idCard: IDCardIcon,
    certificate: CertificateIcon,
    grBook: GRBookIcon,
    studentData: StudentDataIcon,
    home: HomeIcon,
    building: SchoolIcon,
    settings: SettingsIcon,
    export: ExportIcon,
    import: ImportIcon,
    share: ShareIcon,
    cloudUpload: CloudUploadIcon,
    cloudDownload: CloudDownloadIcon,
    school: SchoolIcon,
    userAdd: UserAddIcon,
    trash: TrashIcon,
    edit: EditIcon,
    save: SaveIcon,
    menu: MenuIcon,
    chevronLeft: ChevronLeftIcon,
    chevronRight: ChevronRightIcon,
    plus: PlusIcon,
    x: XIcon,
    check: CheckIcon,
    globe: GlobeIcon,
    search: SearchIcon,
    printer: PrinterIcon,
    download: DownloadIcon,
    upload: UploadIcon,
    mail: MailIcon,
    phone: PhoneIcon,
    logout: LogoutIcon,
    crown: CrownIcon,
    shield: ShieldIcon,
    sparkles: SparklesIcon,
    barChart: BarChartIcon,
    image: ImageIcon,
    fileText: FileTextIcon,
    users: UsersIcon,
    calendar: CalendarIcon,
    award: AwardIcon,
    trophy: TrophyIcon,
    sun: SunIcon,
    moon: MoonIcon,
    rainbow: RainbowIcon,
    qrCode: QrCodeIcon,
    wand: WandIcon,
    arrowUpCircle: ArrowUpCircleIcon,
    arrowDownCircle: ArrowDownCircleIcon,
    bookOpen: BookOpenIcon,
    camera: CameraIcon,
    mic: MicIcon,
    messageCircle: MessageCircleIcon,
    database: CloudDownloadIcon,
    cloud: CloudUploadIcon,
    palette: PaletteIcon,
    language: LanguageIcon,
    infrastructure: InfrastructureIcon,
    default: HomeIcon,
};

export default IconMap;

