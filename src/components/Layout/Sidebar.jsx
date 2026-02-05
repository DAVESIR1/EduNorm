import React, { useState, useRef } from 'react';
import {
    SchoolIcon, UsersIcon, BookOpenIcon, SettingsIcon, UserAddIcon, TrashIcon, EditIcon,
    SaveIcon, StudentProfileIcon, ArrowUpCircleIcon, ArrowDownCircleIcon, FileTextIcon,
    ShareIcon, ChevronLeftIcon, ChevronRightIcon, PlusIcon, XIcon, CheckIcon,
    UploadIcon, ImageIcon, PhoneIcon, MailIcon, ImportIcon, ExportIcon, CloudUploadIcon, CloudDownloadIcon,
    LogoutIcon, CrownIcon, ShieldIcon, SparklesIcon,
    AwardIcon, BarChartIcon, SunIcon, MoonIcon, RainbowIcon, QrCodeIcon, WandIcon,
    CameraIcon, MicIcon, GitBranchIcon, ClockIcon, MessageCircleIcon, ImageIcon as PhotoIcon
} from '../Icons/CustomIcons';
import './Sidebar.css';
import LanguageSelector from '../Settings/LanguageSelector';
import { useLanguage } from '../../contexts/LanguageContext';

export default function Sidebar({
    isOpen,
    onToggle,
    schoolName,
    setSchoolName,
    teacherName,
    setTeacherName,
    selectedStandard,
    setSelectedStandard,
    standards,
    onAddStandard,
    onSaveSettings,
    onOpenProfile,
    onUpgradeClass,
    onDowngradeClass,
    onGoToSheet,
    theme,
    onChangeTheme,
    onEditMode,
    editMode,
    onShare,
    onAddDataBox,
    onRemoveDataBox,
    onRenameDataBox,
    customFields,
    allFields = [],
    schoolLogo,
    setSchoolLogo,
    schoolContact,
    setSchoolContact,
    schoolEmail,
    setSchoolEmail,
    onImportExcel,
    user,
    onLogout,
    tier = 'FREE',
    isAdmin = false,
    isFree = true,
    onOpenAdmin,
    onOpenUpgrade,
    onOpenCertificate,
    onOpenAnalytics,
    onOpenQRAttendance,
    onOpenSmartSearch,
    onOpenCloudBackup,
    onOpenDocScanner,
    onOpenVoiceInput,
    onOpenFamilyTree,
    onOpenTimeline,
    onOpenWhatsApp,
    onOpenPhotoEnhance
}) {
    const [newStandard, setNewStandard] = useState('');
    const [showAddStandard, setShowAddStandard] = useState(false);
    const [showAddField, setShowAddField] = useState(false);
    const [newFieldName, setNewFieldName] = useState('');
    const [removeFieldId, setRemoveFieldId] = useState('');
    const [renameFieldId, setRenameFieldId] = useState('');
    const [renameFieldValue, setRenameFieldValue] = useState('');
    const logoInputRef = useRef(null);
    const { t } = useLanguage();

    const handleAddStandard = () => {
        if (newStandard.trim()) {
            onAddStandard({ id: newStandard, name: newStandard, section: 'A' });
            setNewStandard('');
            setShowAddStandard(false);
        }
    };

    const handleAddField = () => {
        if (newFieldName.trim()) {
            onAddDataBox({ name: newFieldName, type: 'text' });
            setNewFieldName('');
            setShowAddField(false);
        }
    };

    const handleLogoUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setSchoolLogo(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <>
            <aside className={`sidebar ${isOpen ? 'open' : 'collapsed'}`}>
                <div className="sidebar-header">
                    <div className="sidebar-logo">
                        <img src="/edunorm-logo.png" alt="EduNorm" className="logo-image" />
                        {isOpen && <span className="logo-text display-font">EduNorm</span>}
                    </div>
                    <button className="toggle-btn btn-icon btn-ghost" onClick={onToggle}>
                        {isOpen ? <ChevronLeftIcon size={20} /> : <ChevronRightIcon size={20} />}
                    </button>
                </div>

                {/* User Info */}
                {isOpen && user && (
                    <div className="sidebar-user">
                        <div className="user-avatar">
                            {user.photoURL ? (
                                <img src={user.photoURL} alt="User" />
                            ) : (
                                <StudentProfileIcon size={20} />
                            )}
                        </div>
                        <div className="user-info">
                            <span className="user-name">{user.displayName || user.email?.split('@')[0] || 'User'}</span>
                            <span className="user-email">{user.email || user.phoneNumber || ''}</span>
                        </div>
                        <span className={`tier-badge tier-${tier.toLowerCase()}`}>
                            {tier === 'ADMIN' && <ShieldIcon size={12} />}
                            {tier === 'PREMIUM' && <CrownIcon size={12} />}
                            {tier}
                        </span>
                        <button className="btn-icon btn-ghost logout-btn" onClick={onLogout} title="Logout">
                            <LogoutIcon size={18} />
                        </button>
                    </div>
                )}

                {/* Tier Actions */}
                {isOpen && (
                    <div className="tier-actions">
                        {isAdmin && onOpenAdmin && (
                            <button className="tier-action-btn admin-btn" onClick={onOpenAdmin}>
                                <ShieldIcon size={16} />
                                {t('sidebar.adminPanel', 'Admin Panel')}
                            </button>
                        )}
                        {isFree && onOpenUpgrade && (
                            <button className="tier-action-btn upgrade-btn" onClick={onOpenUpgrade}>
                                <SparklesIcon size={16} />
                                {t('sidebar.upgradeBtn', 'Upgrade to Premium')}
                            </button>
                        )}
                    </div>
                )}

                {isOpen && (
                    <div className="sidebar-content">
                        {/* School Logo Upload */}
                        <div className="sidebar-section">
                            <label className="sidebar-label">
                                <ImageIcon size={16} />
                                {t('sidebar.schoolLogo', 'School Logo')}
                            </label>
                            <div className="logo-upload-area">
                                {schoolLogo ? (
                                    <div className="logo-preview">
                                        <img src={schoolLogo} alt="School Logo" />
                                        <button
                                            className="remove-logo-btn"
                                            onClick={() => setSchoolLogo('')}
                                        >
                                            <XIcon size={14} />
                                        </button>
                                    </div>
                                ) : (
                                    <label className="upload-logo-btn">
                                        <input
                                            ref={logoInputRef}
                                            type="file"
                                            accept="image/*"
                                            onChange={handleLogoUpload}
                                            style={{ display: 'none' }}
                                        />
                                        <UploadIcon size={20} />
                                        <span>{t('sidebar.uploadLogo', 'Upload Logo')}</span>
                                    </label>
                                )}
                            </div>
                        </div>

                        {/* School Name */}
                        <div className="sidebar-section">
                            <label className="sidebar-label">
                                <SchoolIcon size={16} />
                                {t('sidebar.schoolName', 'School Name')}
                            </label>
                            <input
                                type="text"
                                className="input-field"
                                placeholder={t('placeholders.enterSchoolName', 'Enter school name...')}
                                value={schoolName}
                                onChange={(e) => setSchoolName(e.target.value)}
                            />
                        </div>

                        {/* School Contact */}
                        <div className="sidebar-section">
                            <label className="sidebar-label">
                                <PhoneIcon size={16} />
                                {t('sidebar.schoolContact', 'School Contact')}
                            </label>
                            <input
                                type="tel"
                                className="input-field"
                                placeholder={t('placeholders.schoolPhone', 'School phone number...')}
                                value={schoolContact || ''}
                                onChange={(e) => setSchoolContact(e.target.value)}
                            />
                        </div>

                        {/* School Email */}
                        <div className="sidebar-section">
                            <label className="sidebar-label">
                                <MailIcon size={16} />
                                {t('sidebar.schoolEmail', 'School Email')}
                            </label>
                            <input
                                type="email"
                                className="input-field"
                                placeholder={t('placeholders.schoolEmail', 'school@example.com')}
                                value={schoolEmail || ''}
                                onChange={(e) => setSchoolEmail(e.target.value)}
                            />
                        </div>

                        {/* Teacher Name */}
                        <div className="sidebar-section">
                            <label className="sidebar-label">
                                <UsersIcon size={16} />
                                {t('sidebar.teacherName', 'Teacher Name')}
                            </label>
                            <input
                                type="text"
                                className="input-field"
                                placeholder={t('placeholders.teacherName', 'Class teacher name...')}
                                value={teacherName}
                                onChange={(e) => setTeacherName(e.target.value)}
                            />
                        </div>

                        {/* Standard Selection */}
                        <div className="sidebar-section">
                            <label className="sidebar-label">
                                <BookOpenIcon size={16} />
                                {t('sidebar.standardClass', 'Standard / Class')}
                            </label>
                            <div className="flex gap-2">
                                <select
                                    className="input-field"
                                    value={selectedStandard}
                                    onChange={(e) => setSelectedStandard(e.target.value)}
                                >
                                    <option value="">{t('placeholders.selectStandard', 'Select Standard')}</option>
                                    {standards.map(std => (
                                        <option key={std.id} value={std.id}>{std.name}</option>
                                    ))}
                                </select>
                                <button
                                    className="btn btn-accent btn-icon"
                                    onClick={() => setShowAddStandard(!showAddStandard)}
                                >
                                    <PlusIcon size={18} />
                                </button>
                            </div>

                            {showAddStandard && (
                                <div className="inline-form animate-slide-up">
                                    <input
                                        type="text"
                                        className="input-field"
                                        placeholder={t('placeholders.standardExample', 'e.g. Standard 3-A')}
                                        value={newStandard}
                                        onChange={(e) => setNewStandard(e.target.value)}
                                    />
                                    <button className="btn btn-primary btn-sm" onClick={handleAddStandard}>
                                        <CheckIcon size={16} />
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="sidebar-divider" />

                        {/* Data Box Management */}
                        <div className="sidebar-section">
                            <label className="sidebar-label">
                                <SettingsIcon size={16} />
                                {t('sidebar.manageDataFields', 'Manage Data Fields')}
                            </label>

                            {/* Add New Field */}
                            <button
                                className="sidebar-action-btn"
                                onClick={() => setShowAddField(!showAddField)}
                            >
                                <UserAddIcon size={16} />
                                {t('sidebar.addNewDataBox', 'Add New Data Box')}
                            </button>

                            {showAddField && (
                                <div className="inline-form animate-slide-up">
                                    <input
                                        type="text"
                                        className="input-field"
                                        placeholder={t('placeholders.fieldName', 'Field name...')}
                                        value={newFieldName}
                                        onChange={(e) => setNewFieldName(e.target.value)}
                                    />
                                    <button className="btn btn-primary btn-sm" onClick={handleAddField}>
                                        <CheckIcon size={16} />
                                    </button>
                                </div>
                            )}

                            {/* Show added custom fields */}
                            {customFields.length > 0 && (
                                <div className="custom-fields-list">
                                    {customFields.map(f => (
                                        <div key={f.id} className="custom-field-item">
                                            <span>{f.name}</span>
                                            <button
                                                className="btn-icon-sm"
                                                onClick={() => onRemoveDataBox(f.id)}
                                            >
                                                <XIcon size={12} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Remove Field */}
                            <div className="field-action-row">
                                <select
                                    className="input-field small"
                                    value={removeFieldId}
                                    onChange={(e) => setRemoveFieldId(e.target.value)}
                                >
                                    <option value="">{t('sidebar.selectToRemove', 'Select to remove')}</option>
                                    {allFields.map(f => (
                                        <option key={f.key || f.id} value={f.key || f.id}>{f.label || f.name}</option>
                                    ))}
                                </select>
                                <button
                                    className="btn btn-ghost btn-icon danger"
                                    onClick={() => {
                                        if (removeFieldId) {
                                            onRemoveDataBox(removeFieldId);
                                            setRemoveFieldId('');
                                        }
                                    }}
                                    disabled={!removeFieldId}
                                >
                                    <XIcon size={16} />
                                </button>
                            </div>

                            {/* Rename Field */}
                            <div className="field-action-row">
                                <select
                                    className="input-field small"
                                    value={renameFieldId}
                                    onChange={(e) => setRenameFieldId(e.target.value)}
                                >
                                    <option value="">{t('sidebar.selectToRename', 'Select to rename')}</option>
                                    {allFields.map(f => (
                                        <option key={f.key || f.id} value={f.key || f.id}>{f.label || f.name}</option>
                                    ))}
                                </select>
                                <button
                                    className="btn btn-ghost btn-icon"
                                    onClick={() => {
                                        if (renameFieldId && renameFieldValue) {
                                            onRenameDataBox(renameFieldId, renameFieldValue);
                                            setRenameFieldId('');
                                            setRenameFieldValue('');
                                        }
                                    }}
                                >
                                    <EditIcon size={16} />
                                </button>
                            </div>
                            {renameFieldId && (
                                <div className="inline-form animate-slide-up">
                                    <input
                                        type="text"
                                        className="input-field small"
                                        placeholder={t('placeholders.newName', 'New name...')}
                                        value={renameFieldValue}
                                        onChange={(e) => setRenameFieldValue(e.target.value)}
                                    />
                                    <button
                                        className="btn btn-primary btn-sm"
                                        onClick={() => {
                                            if (renameFieldId && renameFieldValue) {
                                                onRenameDataBox(renameFieldId, renameFieldValue);
                                                setRenameFieldId('');
                                                setRenameFieldValue('');
                                            }
                                        }}
                                        disabled={!renameFieldValue}
                                    >
                                        <SaveIcon size={14} />
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="sidebar-divider" />

                        {/* Quick Actions */}
                        <div className="sidebar-section">
                            <label className="sidebar-label">{t('sidebar.quickActions', 'Quick Actions')}</label>

                            <button className="sidebar-action-btn primary" onClick={onSaveSettings}>
                                <SaveIcon size={16} />
                                {t('sidebar.saveSettings', 'Save Settings')}
                            </button>

                            <button className="sidebar-action-btn" onClick={onOpenProfile}>
                                <StudentProfileIcon size={16} />
                                {t('sidebar.studentProfile', 'Student Profile')}
                            </button>

                            <button className="sidebar-action-btn" onClick={onGoToSheet}>
                                <FileTextIcon size={16} />
                                {t('sidebar.goToSheet', 'Go to Sheet')}
                            </button>

                            <button className="sidebar-action-btn accent" onClick={onImportExcel}>
                                <ImportIcon size={16} />
                                {t('sidebar.importExcel', 'Import from Excel')}
                            </button>
                        </div>

                        <div className="sidebar-divider" />

                        {/* Phase 10: Unique Features */}
                        <div className="sidebar-section">
                            <label className="sidebar-label"><SparklesIcon size={14} /> {t('sidebar.specialFeatures', 'Special Features')}</label>

                            <button className="sidebar-action-btn gradient-btn" onClick={onOpenCertificate}>
                                <AwardIcon size={16} />
                                {t('sidebar.certificateGenerator', 'Certificate Generator')}
                            </button>

                            <button className="sidebar-action-btn gradient-btn" onClick={onOpenAnalytics}>
                                <BarChartIcon size={16} />
                                {t('sidebar.analyticsDashboard', 'Analytics Dashboard')}
                            </button>

                            <button className="sidebar-action-btn gradient-btn" onClick={onOpenQRAttendance}>
                                <QrCodeIcon size={16} />
                                {t('sidebar.qrAttendance', 'QR Attendance')}
                            </button>

                            <button className="sidebar-action-btn gradient-btn" onClick={onOpenSmartSearch}>
                                <WandIcon size={16} />
                                {t('sidebar.smartSearch', 'Smart Search')}
                            </button>

                            <button className="sidebar-action-btn gradient-btn" onClick={onOpenDocScanner}>
                                <CameraIcon size={16} />
                                {t('sidebar.docScanner', 'Document Scanner')}
                            </button>

                            <button className="sidebar-action-btn gradient-btn" onClick={onOpenVoiceInput}>
                                <MicIcon size={16} />
                                {t('sidebar.voiceInput', 'Voice Input')}
                            </button>

                            <button className="sidebar-action-btn gradient-btn" onClick={onOpenFamilyTree}>
                                <GitBranchIcon size={16} />
                                {t('sidebar.familyTree', 'Family Tree')}
                            </button>

                            <button className="sidebar-action-btn gradient-btn" onClick={onOpenTimeline}>
                                <ClockIcon size={16} />
                                {t('sidebar.progressTimeline', 'Progress Timeline')}
                            </button>

                            <button className="sidebar-action-btn gradient-btn" onClick={onOpenWhatsApp}>
                                <MessageCircleIcon size={16} />
                                {t('sidebar.whatsappMessenger', 'WhatsApp Messenger')}
                            </button>

                            <button className="sidebar-action-btn gradient-btn" onClick={onOpenPhotoEnhance}>
                                <PhotoIcon size={16} />
                                {t('sidebar.photoEnhance', 'Photo Enhancement')}
                            </button>
                        </div>

                        <div className="sidebar-divider" />

                        {/* Class Management */}
                        <div className="sidebar-section">
                            <label className="sidebar-label">{t('sidebar.classManagement', 'Class Management')}</label>

                            <button className="sidebar-action-btn success" onClick={onUpgradeClass}>
                                <ArrowUpCircleIcon size={16} />
                                {t('sidebar.upgradeClass', 'Upgrade Class')}
                            </button>

                            <button className="sidebar-action-btn warning" onClick={onDowngradeClass}>
                                <ArrowDownCircleIcon size={16} />
                                {t('sidebar.downgradeClass', 'Downgrade Class')}
                            </button>
                        </div>

                        <div className="sidebar-divider" />

                        {/* Theme */}
                        <div className="sidebar-section">
                            <label className="sidebar-label">{t('sidebar.appearance', 'Appearance')}</label>

                            <div className="theme-switcher">
                                <button
                                    className={`theme-btn ${theme === 'light' ? 'active' : ''}`}
                                    onClick={() => onChangeTheme('light')}
                                    title="Light"
                                >
                                    <SunIcon size={18} />
                                </button>
                                <button
                                    className={`theme-btn ${theme === 'dark' ? 'active' : ''}`}
                                    onClick={() => onChangeTheme('dark')}
                                    title="Dark"
                                >
                                    <MoonIcon size={18} />
                                </button>
                                <button
                                    className={`theme-btn ${theme === 'colorful' ? 'active' : ''}`}
                                    onClick={() => onChangeTheme('colorful')}
                                    title="Colorful"
                                >
                                    <RainbowIcon size={18} />
                                </button>
                            </div>

                            <div className="language-section">
                                <LanguageSelector />
                            </div>
                        </div>

                        <div className="sidebar-divider" />

                        {/* Data Management - Separate buttons */}
                        <div className="sidebar-section">
                            <label className="sidebar-label">{t('sidebar.dataManagement', 'Data Management')}</label>

                            <button className="sidebar-action-btn" onClick={() => onShare('export')}>
                                <ExportIcon size={16} />
                                {t('sidebar.exportData', 'Export Data')}
                            </button>

                            <button className="sidebar-action-btn" onClick={() => onShare('import')}>
                                <ImportIcon size={16} />
                                {t('sidebar.importData', 'Import Data')}
                            </button>

                            <button className="sidebar-action-btn" onClick={() => onShare('share')}>
                                <ShareIcon size={16} />
                                {t('sidebar.share', 'Share')}
                            </button>

                            <button className="sidebar-action-btn gradient-btn" onClick={onOpenCloudBackup}>
                                <CloudUploadIcon size={16} />
                                {t('sidebar.cloudBackup', 'Cloud Backup')}
                            </button>
                        </div>
                    </div>
                )}

                {/* Collapsed state icons */}
                {!isOpen && (
                    <div className="sidebar-collapsed-icons">
                        <button className="collapsed-icon tooltip" data-tooltip="School" onClick={onToggle}>
                            <SchoolIcon size={20} />
                        </button>
                        <button className="collapsed-icon tooltip" data-tooltip="Student Profile" onClick={onOpenProfile}>
                            <StudentProfileIcon size={20} />
                        </button>
                        <button className="collapsed-icon tooltip" data-tooltip="Sheets" onClick={onGoToSheet}>
                            <FileTextIcon size={20} />
                        </button>
                        <button className="collapsed-icon tooltip" data-tooltip="Settings">
                            <SettingsIcon size={20} />
                        </button>
                    </div>
                )}
            </aside>
        </>
    );
}
