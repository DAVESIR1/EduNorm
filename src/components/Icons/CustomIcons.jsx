import React from 'react';

// Custom SVG Icons with Minimal Colorful Line Style
// Each icon has its own signature color matching the reference style

export const StudentProfileIcon = ({ size = 24, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
        <path d="M24 8C19.5817 8 16 11.5817 16 16C16 20.4183 19.5817 24 24 24C28.4183 24 32 20.4183 32 16C32 11.5817 28.4183 8 24 8Z" stroke="#4A90A4" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M12 40V38C12 33.5817 15.5817 30 20 30H28C32.4183 30 36 33.5817 36 38V40" stroke="#4A90A4" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M24 4C21 4 19 6 19 8" stroke="#4A90A4" strokeWidth="2" strokeLinecap="round" />
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

export const SettingsIcon = ({ size = 24, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
        <circle cx="24" cy="24" r="6" stroke="#6B7280" strokeWidth="2.5" />
        <path d="M24 4V8M24 40V44M4 24H8M40 24H44M9.86 9.86L12.69 12.69M35.31 35.31L38.14 38.14M38.14 9.86L35.31 12.69M12.69 35.31L9.86 38.14" stroke="#6B7280" strokeWidth="2.5" strokeLinecap="round" />
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

export const EditIcon = ({ size = 24, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
        <path d="M8 40H16L38 18L30 10L8 32V40Z" stroke="#F59E0B" strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M26 14L34 22" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M34 6L42 14L38 18L30 10L34 6Z" stroke="#F59E0B" strokeWidth="2.5" strokeLinejoin="round" />
    </svg>
);

export const SaveIcon = ({ size = 24, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
        <path d="M8 8V40C8 42 10 44 12 44H36C38 44 40 42 40 40V14L34 8H12C10 8 8 10 8 12" stroke="#10B981" strokeWidth="2.5" strokeLinejoin="round" />
        <rect x="14" y="26" width="20" height="14" rx="2" stroke="#10B981" strokeWidth="2" />
        <path d="M16 8V18H28V8" stroke="#10B981" strokeWidth="2" />
    </svg>
);

export const MenuIcon = ({ size = 24, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
        <path d="M8 12H40M8 24H40M8 36H40" stroke="#6B7280" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
);

export const ChevronLeftIcon = ({ size = 24, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
        <path d="M30 12L18 24L30 36" stroke="#6B7280" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

export const ChevronRightIcon = ({ size = 24, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
        <path d="M18 12L30 24L18 36" stroke="#6B7280" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

export const PlusIcon = ({ size = 24, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
        <path d="M24 8V40M8 24H40" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
);

export const XIcon = ({ size = 24, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
        <path d="M12 12L36 36M36 12L12 36" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
);

export const CheckIcon = ({ size = 24, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
        <path d="M8 26L18 36L40 12" stroke="#10B981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

export const GlobeIcon = ({ size = 24, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
        <circle cx="24" cy="24" r="18" stroke="#3B82F6" strokeWidth="2.5" />
        <ellipse cx="24" cy="24" rx="8" ry="18" stroke="#3B82F6" strokeWidth="2" />
        <path d="M6 24H42M8 16H40M8 32H40" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" />
    </svg>
);

export const SearchIcon = ({ size = 24, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
        <circle cx="20" cy="20" r="12" stroke="#6B7280" strokeWidth="2.5" />
        <path d="M30 30L42 42" stroke="#6B7280" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
);

export const PrinterIcon = ({ size = 24, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
        <path d="M12 16V6H36V16" stroke="#6B7280" strokeWidth="2.5" strokeLinejoin="round" />
        <rect x="6" y="16" width="36" height="20" rx="2" stroke="#6B7280" strokeWidth="2.5" />
        <path d="M12 28H36V42H12V28Z" stroke="#6B7280" strokeWidth="2.5" />
        <circle cx="34" cy="22" r="2" fill="#6B7280" />
    </svg>
);

export const DownloadIcon = ({ size = 24, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
        <path d="M24 6V32" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M14 24L24 34L34 24" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M8 38H40" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
);

export const UploadIcon = ({ size = 24, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
        <path d="M24 32V6" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M14 14L24 4L34 14" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M8 38H40" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
);

export const MailIcon = ({ size = 24, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
        <rect x="4" y="10" width="40" height="28" rx="3" stroke="#EC4899" strokeWidth="2.5" />
        <path d="M4 14L24 28L44 14" stroke="#EC4899" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

export const PhoneIcon = ({ size = 24, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
        <path d="M10 8C10 6 12 4 14 4H18L22 14L18 18C18 18 22 26 30 30L34 26L44 30V34C44 36 42 38 40 38C20 38 10 28 10 8Z" stroke="#10B981" strokeWidth="2.5" strokeLinejoin="round" />
    </svg>
);

export const LogoutIcon = ({ size = 24, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
        <path d="M18 8H12C10 8 8 10 8 12V36C8 38 10 40 12 40H18" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M32 14L40 24L32 34" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M18 24H40" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
);

export const CrownIcon = ({ size = 24, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
        <path d="M6 16L12 34H36L42 16L32 24L24 10L16 24L6 16Z" stroke="#F59E0B" strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M12 38H36" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
);

export const ShieldIcon = ({ size = 24, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
        <path d="M24 4L8 12V24C8 34 16 42 24 44C32 42 40 34 40 24V12L24 4Z" stroke="#8B5CF6" strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M18 24L22 28L30 20" stroke="#8B5CF6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

export const SparklesIcon = ({ size = 24, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
        <path d="M24 4L28 16L40 20L28 24L24 36L20 24L8 20L20 16L24 4Z" stroke="#EC4899" strokeWidth="2.5" strokeLinejoin="round" />
        <circle cx="38" cy="8" r="3" stroke="#EC4899" strokeWidth="2" />
        <circle cx="10" cy="38" r="3" stroke="#EC4899" strokeWidth="2" />
    </svg>
);

export const BarChartIcon = ({ size = 24, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
        <path d="M8 8V40H40" stroke="#9B7ED9" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="14" y="24" width="6" height="12" rx="1" stroke="#9B7ED9" strokeWidth="2" />
        <rect x="24" y="16" width="6" height="20" rx="1" stroke="#9B7ED9" strokeWidth="2" />
        <rect x="34" y="20" width="6" height="16" rx="1" stroke="#9B7ED9" strokeWidth="2" />
    </svg>
);

export const ImageIcon = ({ size = 24, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
        <rect x="6" y="10" width="36" height="28" rx="3" stroke="#06B6D4" strokeWidth="2.5" />
        <circle cx="16" cy="20" r="4" stroke="#06B6D4" strokeWidth="2" />
        <path d="M6 34L16 24L26 34L32 28L42 38" stroke="#06B6D4" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

export const FileTextIcon = ({ size = 24, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
        <path d="M28 4H12C10 4 8 6 8 8V40C8 42 10 44 12 44H36C38 44 40 42 40 40V16L28 4Z" stroke="#4A90A4" strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M28 4V16H40" stroke="#4A90A4" strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M16 24H32M16 32H28" stroke="#4A90A4" strokeWidth="2" strokeLinecap="round" />
    </svg>
);

export const UsersIcon = ({ size = 24, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
        <circle cx="18" cy="14" r="6" stroke="#4A90A4" strokeWidth="2.5" />
        <path d="M6 38V36C6 32 9 28 14 28H22C27 28 30 32 30 36V38" stroke="#4A90A4" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="34" cy="16" r="4" stroke="#4A90A4" strokeWidth="2" />
        <path d="M36 28C40 28 42 31 42 34V36" stroke="#4A90A4" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
);

export const CalendarIcon = ({ size = 24, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
        <rect x="6" y="10" width="36" height="32" rx="3" stroke="#EF4444" strokeWidth="2.5" />
        <path d="M6 18H42" stroke="#EF4444" strokeWidth="2.5" />
        <path d="M14 6V14M34 6V14" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="16" cy="28" r="2" fill="#EF4444" />
        <circle cx="24" cy="28" r="2" fill="#EF4444" />
        <circle cx="32" cy="28" r="2" fill="#EF4444" />
    </svg>
);

export const AwardIcon = ({ size = 24, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
        <circle cx="24" cy="18" r="12" stroke="#E5A021" strokeWidth="2.5" />
        <path d="M18 28L16 44L24 40L32 44L30 28" stroke="#E5A021" strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M20 16L22 20H26L23 22L24 26L21 23L18 26L19 22L16 20H20L20 16Z" fill="#E5A021" />
    </svg>
);

export const TrophyIcon = ({ size = 24, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
        <path d="M14 8H34V20C34 26 30 32 24 32C18 32 14 26 14 20V8Z" stroke="#F59E0B" strokeWidth="2.5" />
        <path d="M14 12H8C8 18 10 22 14 22" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M34 12H40C40 18 38 22 34 22" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M24 32V38" stroke="#F59E0B" strokeWidth="2.5" />
        <path d="M16 42H32" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M18 38H30V42H18V38Z" stroke="#F59E0B" strokeWidth="2" />
    </svg>
);

export const SunIcon = ({ size = 24, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
        <circle cx="24" cy="24" r="8" stroke="#F59E0B" strokeWidth="2.5" />
        <path d="M24 4V10M24 38V44M4 24H10M38 24H44" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M9.86 9.86L14.1 14.1M33.9 33.9L38.14 38.14M38.14 9.86L33.9 14.1M14.1 33.9L9.86 38.14" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
);

export const MoonIcon = ({ size = 24, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
        <path d="M40 28C40 36.8 32.8 44 24 44C15.2 44 8 36.8 8 28C8 19.2 15.2 12 24 12C24 12 20 16 20 24C20 32 26 36 32 36C32 36 40 36 40 28Z" stroke="#8B5CF6" strokeWidth="2.5" strokeLinejoin="round" />
        <circle cx="36" cy="12" r="2" fill="#8B5CF6" />
        <circle cx="42" cy="18" r="1.5" fill="#8B5CF6" />
    </svg>
);

export const RainbowIcon = ({ size = 24, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
        <path d="M4 36C4 22.7 14.7 12 28 12C41.3 12 44 22.7 44 36" stroke="#EF4444" strokeWidth="3" strokeLinecap="round" fill="none" />
        <path d="M10 36C10 25.5 17.5 18 28 18C38.5 18 40 25.5 40 36" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round" fill="none" />
        <path d="M16 36C16 28.3 20.3 24 28 24C35.7 24 36 28.3 36 36" stroke="#10B981" strokeWidth="3" strokeLinecap="round" fill="none" />
        <path d="M22 36C22 31.1 23.1 30 28 30C32.9 30 32 31.1 32 36" stroke="#3B82F6" strokeWidth="3" strokeLinecap="round" fill="none" />
    </svg>
);

export const QrCodeIcon = ({ size = 24, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
        <rect x="6" y="6" width="14" height="14" rx="2" stroke="#3B82F6" strokeWidth="2.5" />
        <rect x="28" y="6" width="14" height="14" rx="2" stroke="#3B82F6" strokeWidth="2.5" />
        <rect x="6" y="28" width="14" height="14" rx="2" stroke="#3B82F6" strokeWidth="2.5" />
        <rect x="10" y="10" width="6" height="6" fill="#3B82F6" />
        <rect x="32" y="10" width="6" height="6" fill="#3B82F6" />
        <rect x="10" y="32" width="6" height="6" fill="#3B82F6" />
        <path d="M28 28H32V32H28V28Z" fill="#3B82F6" />
        <path d="M36 28H42V34" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" />
        <path d="M28 38H34V42H28V38Z" fill="#3B82F6" />
        <path d="M38 38H42V42H38V38Z" fill="#3B82F6" />
    </svg>
);

export const WandIcon = ({ size = 24, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
        <path d="M6 42L36 12L42 18L12 48" stroke="#EC4899" strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M32 16L36 12L42 18L38 22" stroke="#EC4899" strokeWidth="2.5" />
        <circle cx="38" cy="8" r="3" stroke="#EC4899" strokeWidth="2" />
        <circle cx="44" cy="14" r="2" stroke="#EC4899" strokeWidth="1.5" />
        <path d="M26 4L28 8L32 6L30 10L34 12L30 14L32 18L28 16L26 20L24 16L20 18L22 14L18 12L22 10L20 6L24 8L26 4Z" fill="#EC4899" />
    </svg>
);

export const ArrowUpCircleIcon = ({ size = 24, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
        <circle cx="24" cy="24" r="18" stroke="#10B981" strokeWidth="2.5" />
        <path d="M24 32V16" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M16 24L24 16L32 24" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

export const ArrowDownCircleIcon = ({ size = 24, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
        <circle cx="24" cy="24" r="18" stroke="#F59E0B" strokeWidth="2.5" />
        <path d="M24 16V32" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M16 24L24 32L32 24" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

export const BookOpenIcon = ({ size = 24, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
        <path d="M24 12V40" stroke="#F59E0B" strokeWidth="2" />
        <path d="M24 12C24 12 20 8 12 8C8 8 4 10 4 14V38C4 38 8 36 12 36C20 36 24 40 24 40" stroke="#F59E0B" strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M24 12C24 12 28 8 36 8C40 8 44 10 44 14V38C44 38 40 36 36 36C28 36 24 40 24 40" stroke="#F59E0B" strokeWidth="2.5" strokeLinejoin="round" />
    </svg>
);

export const CameraIcon = ({ size = 24, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
        <rect x="4" y="14" width="40" height="28" rx="4" stroke="#6366F1" strokeWidth="2.5" />
        <circle cx="24" cy="28" r="8" stroke="#6366F1" strokeWidth="2.5" />
        <path d="M16 14L18 8H30L32 14" stroke="#6366F1" strokeWidth="2.5" strokeLinejoin="round" />
        <circle cx="36" cy="20" r="2" fill="#6366F1" />
    </svg>
);

export const MicIcon = ({ size = 24, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
        <rect x="16" y="4" width="16" height="24" rx="8" stroke="#10B981" strokeWidth="2.5" />
        <path d="M8 24C8 32.8 15.2 40 24 40C32.8 40 40 32.8 40 24" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M24 40V46" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M16 46H32" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
);

export const GitBranchIcon = ({ size = 24, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
        <circle cx="12" cy="12" r="4" stroke="#F59E0B" strokeWidth="2.5" />
        <circle cx="12" cy="36" r="4" stroke="#F59E0B" strokeWidth="2.5" />
        <circle cx="36" cy="20" r="4" stroke="#F59E0B" strokeWidth="2.5" />
        <path d="M12 16V32" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M12 20C12 20 12 20 20 20C28 20 32 20 32 20" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
);

export const ClockIcon = ({ size = 24, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
        <circle cx="24" cy="24" r="18" stroke="#8B5CF6" strokeWidth="2.5" />
        <path d="M24 12V24L32 30" stroke="#8B5CF6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

export const MessageCircleIcon = ({ size = 24, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
        <path d="M44 22C44 30.8 35 38 24 38C21.3 38 18.7 37.5 16.4 36.6L6 42L9.4 33.2C6.4 30 4 26.2 4 22C4 13.2 13 6 24 6C35 6 44 13.2 44 22Z" stroke="#25D366" strokeWidth="2.5" strokeLinejoin="round" />
    </svg>
);

export const RotateCcwIcon = ({ size = 24, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
        <path d="M8 16C8 16 12 8 24 8C36 8 42 20 42 24C42 36 32 42 24 42C16 42 8 36 8 24" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M8 6V16H18" stroke="#3B82F6" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
);

export const RotateCwIcon = ({ size = 24, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
        <path d="M40 16C40 16 36 8 24 8C12 8 6 20 6 24C6 36 16 42 24 42C32 42 40 36 40 24" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" />
        <path d="M40 6V16H30" stroke="#10B981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
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
    palette: 'PaletteIcon',
    language: 'LanguageIcon',
};

// Palette Icon for theme selection
export const PaletteIcon = ({ size = 24, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
        <path d="M24 6C13.5 6 5 14.5 5 25C5 28.5 6 31.5 8 34C10 36.5 13.5 38 17 38H20C21 38 22 37 22 36V35C22 34.5 21.8 34 21.5 33.5C21.2 33 21 32.3 21 31.5C21 29.6 22.6 28 24.5 28H30C36.6 28 42 22.6 42 16C42 10.5 33.9 6 24 6Z" stroke="#E5A021" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="15" cy="18" r="2.5" fill="#E07B67" />
        <circle cx="12" cy="28" r="2.5" fill="#3D9970" />
        <circle cx="24" cy="14" r="2.5" fill="#4A90A4" />
        <circle cx="33" cy="18" r="2.5" fill="#9B7ED9" />
    </svg>
);

// Language/Globe Icon for language selection  
export const LanguageIcon = ({ size = 24, className = '' }) => (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" className={className}>
        <circle cx="24" cy="24" r="18" stroke="#4A90A4" strokeWidth="2.5" />
        <path d="M6 24H42" stroke="#4A90A4" strokeWidth="2" />
        <path d="M24 6C24 6 18 12 18 24C18 36 24 42 24 42" stroke="#4A90A4" strokeWidth="2" />
        <path d="M24 6C24 6 30 12 30 24C30 36 24 42 24 42" stroke="#4A90A4" strokeWidth="2" />
        <path d="M10 12C10 12 14 16 24 16C34 16 38 12 38 12" stroke="#4A90A4" strokeWidth="2" strokeLinecap="round" />
        <path d="M10 36C10 36 14 32 24 32C34 32 38 36 38 36" stroke="#4A90A4" strokeWidth="2" strokeLinecap="round" />
    </svg>
);

export default IconMap;

