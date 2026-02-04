import React, { useState, useRef } from 'react';
import {
    School, Users, BookOpen, Settings, UserPlus, Trash2, Edit3,
    Save, User, ArrowUpCircle, ArrowDownCircle, FileText,
    Palette, Share2, ChevronLeft, ChevronRight, Plus, X, Check,
    Upload, Image, Phone, Mail, FileUp, FileDown, FolderUp, FolderDown,
    LogOut, Crown, Shield, Sparkles, UploadCloud, DownloadCloud,
    Award, BarChart2, Sun, Moon, Rainbow, QrCode, Wand2
} from 'lucide-react';
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
    onOpenAnalytics
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
                    <div className="sidebar-logo animate-float">
                        <span className="logo-icon">📚</span>
                        {isOpen && <span className="logo-text display-font">EduNorm</span>}
                    </div>
                    <button className="toggle-btn btn-icon btn-ghost" onClick={onToggle}>
                        {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
                    </button>
                </div>

                {/* User Info */}
                {isOpen && user && (
                    <div className="sidebar-user">
                        <div className="user-avatar">
                            {user.photoURL ? (
                                <img src={user.photoURL} alt="User" />
                            ) : (
                                <User size={20} />
                            )}
                        </div>
                        <div className="user-info">
                            <span className="user-name">{user.displayName || user.email?.split('@')[0] || 'User'}</span>
                            <span className="user-email">{user.email || user.phoneNumber || ''}</span>
                        </div>
                        <span className={`tier-badge tier-${tier.toLowerCase()}`}>
                            {tier === 'ADMIN' && <Shield size={12} />}
                            {tier === 'PREMIUM' && <Crown size={12} />}
                            {tier}
                        </span>
                        <button className="btn-icon btn-ghost logout-btn" onClick={onLogout} title="Logout">
                            <LogOut size={18} />
                        </button>
                    </div>
                )}

                {/* Tier Actions */}
                {isOpen && (
                    <div className="tier-actions">
                        {isAdmin && onOpenAdmin && (
                            <button className="tier-action-btn admin-btn" onClick={onOpenAdmin}>
                                <Shield size={16} />
                                Admin Panel
                            </button>
                        )}
                        {isFree && onOpenUpgrade && (
                            <button className="tier-action-btn upgrade-btn" onClick={onOpenUpgrade}>
                                <Sparkles size={16} />
                                Upgrade to Premium
                            </button>
                        )}
                    </div>
                )}

                {isOpen && (
                    <div className="sidebar-content">
                        {/* School Logo Upload */}
                        <div className="sidebar-section">
                            <label className="sidebar-label">
                                <Image size={16} className="icon-primary" />
                                School Logo
                            </label>
                            <div className="logo-upload-area">
                                {schoolLogo ? (
                                    <div className="logo-preview">
                                        <img src={schoolLogo} alt="School Logo" />
                                        <button
                                            className="remove-logo-btn"
                                            onClick={() => setSchoolLogo('')}
                                        >
                                            <X size={14} />
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
                                        <Upload size={20} />
                                        <span>Upload Logo</span>
                                    </label>
                                )}
                            </div>
                        </div>

                        {/* School Name */}
                        <div className="sidebar-section">
                            <label className="sidebar-label">
                                <School size={16} className="icon-accent" />
                                School Name
                            </label>
                            <input
                                type="text"
                                className="input-field"
                                placeholder="Enter school name..."
                                value={schoolName}
                                onChange={(e) => setSchoolName(e.target.value)}
                            />
                        </div>

                        {/* School Contact */}
                        <div className="sidebar-section">
                            <label className="sidebar-label">
                                <Phone size={16} className="icon-success" />
                                School Contact
                            </label>
                            <input
                                type="tel"
                                className="input-field"
                                placeholder="School phone number..."
                                value={schoolContact || ''}
                                onChange={(e) => setSchoolContact(e.target.value)}
                            />
                        </div>

                        {/* School Email */}
                        <div className="sidebar-section">
                            <label className="sidebar-label">
                                <Mail size={16} className="icon-secondary" />
                                School Email
                            </label>
                            <input
                                type="email"
                                className="input-field"
                                placeholder="school@example.com"
                                value={schoolEmail || ''}
                                onChange={(e) => setSchoolEmail(e.target.value)}
                            />
                        </div>

                        {/* Teacher Name */}
                        <div className="sidebar-section">
                            <label className="sidebar-label">
                                <Users size={16} className="icon-primary" />
                                Teacher Name
                            </label>
                            <input
                                type="text"
                                className="input-field"
                                placeholder="Class teacher name..."
                                value={teacherName}
                                onChange={(e) => setTeacherName(e.target.value)}
                            />
                        </div>

                        {/* Standard Selection */}
                        <div className="sidebar-section">
                            <label className="sidebar-label">
                                <BookOpen size={16} className="icon-warning" />
                                Standard / Class
                            </label>
                            <div className="flex gap-2">
                                <select
                                    className="input-field"
                                    value={selectedStandard}
                                    onChange={(e) => setSelectedStandard(e.target.value)}
                                >
                                    <option value="">Select Standard</option>
                                    {standards.map(std => (
                                        <option key={std.id} value={std.id}>{std.name}</option>
                                    ))}
                                </select>
                                <button
                                    className="btn btn-accent btn-icon"
                                    onClick={() => setShowAddStandard(!showAddStandard)}
                                >
                                    <Plus size={18} />
                                </button>
                            </div>

                            {showAddStandard && (
                                <div className="inline-form animate-slide-up">
                                    <input
                                        type="text"
                                        className="input-field"
                                        placeholder="e.g. Standard 3-A"
                                        value={newStandard}
                                        onChange={(e) => setNewStandard(e.target.value)}
                                    />
                                    <button className="btn btn-primary btn-sm" onClick={handleAddStandard}>
                                        <Check size={16} />
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="sidebar-divider" />

                        {/* Data Box Management */}
                        <div className="sidebar-section">
                            <label className="sidebar-label">
                                <Settings size={16} />
                                Manage Data Fields
                            </label>

                            {/* Add New Field */}
                            <button
                                className="sidebar-action-btn"
                                onClick={() => setShowAddField(!showAddField)}
                            >
                                <UserPlus size={16} />
                                Add New Data Box
                            </button>

                            {showAddField && (
                                <div className="inline-form animate-slide-up">
                                    <input
                                        type="text"
                                        className="input-field"
                                        placeholder="Field name..."
                                        value={newFieldName}
                                        onChange={(e) => setNewFieldName(e.target.value)}
                                    />
                                    <button className="btn btn-primary btn-sm" onClick={handleAddField}>
                                        <Check size={16} />
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
                                                <X size={12} />
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
                                    <option value="">Select to remove</option>
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
                                    <X size={16} />
                                </button>
                            </div>

                            {/* Rename Field */}
                            <div className="field-action-row">
                                <select
                                    className="input-field small"
                                    value={renameFieldId}
                                    onChange={(e) => setRenameFieldId(e.target.value)}
                                >
                                    <option value="">Select to rename</option>
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
                                    <Edit3 size={16} />
                                </button>
                            </div>
                            {renameFieldId && (
                                <input
                                    type="text"
                                    className="input-field small"
                                    placeholder="New name..."
                                    value={renameFieldValue}
                                    onChange={(e) => setRenameFieldValue(e.target.value)}
                                />
                            )}
                        </div>

                        <div className="sidebar-divider" />

                        {/* Quick Actions */}
                        <div className="sidebar-section">
                            <label className="sidebar-label">Quick Actions</label>

                            <button className="sidebar-action-btn primary" onClick={onSaveSettings}>
                                <Save size={16} />
                                Save Settings
                            </button>

                            <button className="sidebar-action-btn" onClick={onOpenProfile}>
                                <User size={16} />
                                Student Profile
                            </button>

                            <button className="sidebar-action-btn" onClick={onGoToSheet}>
                                <FileText size={16} />
                                Go to Sheet
                            </button>

                            <button className="sidebar-action-btn accent" onClick={onImportExcel}>
                                <FileUp size={16} />
                                Import from Excel
                            </button>
                        </div>

                        <div className="sidebar-divider" />

                        {/* Phase 10: Unique Features */}
                        <div className="sidebar-section">
                            <label className="sidebar-label"><Sparkles size={14} className="icon-accent" /> Special Features</label>

                            <button className="sidebar-action-btn gradient-btn" onClick={onOpenCertificate}>
                                <Award size={16} className="icon-accent" />
                                Certificate Generator
                            </button>

                            <button className="sidebar-action-btn gradient-btn" onClick={onOpenAnalytics}>
                                <BarChart2 size={16} className="icon-primary" />
                                Analytics Dashboard
                            </button>

                            <button className="sidebar-action-btn gradient-btn" onClick={() => alert('QR Generator coming soon!')}>
                                <QrCode size={16} className="icon-success" />
                                QR Attendance
                            </button>

                            <button className="sidebar-action-btn gradient-btn" onClick={() => alert('Smart Search coming soon!')}>
                                <Wand2 size={16} className="icon-secondary" />
                                Smart Search
                            </button>
                        </div>

                        <div className="sidebar-divider" />

                        {/* Class Management */}
                        <div className="sidebar-section">
                            <label className="sidebar-label">Class Management</label>

                            <button className="sidebar-action-btn success" onClick={onUpgradeClass}>
                                <ArrowUpCircle size={16} />
                                Upgrade Class
                            </button>

                            <button className="sidebar-action-btn warning" onClick={onDowngradeClass}>
                                <ArrowDownCircle size={16} />
                                Downgrade Class
                            </button>
                        </div>

                        <div className="sidebar-divider" />

                        {/* Theme */}
                        <div className="sidebar-section">
                            <label className="sidebar-label">Appearance</label>

                            <div className="theme-switcher">
                                <button
                                    className={`theme-btn ${theme === 'light' ? 'active' : ''}`}
                                    onClick={() => onChangeTheme('light')}
                                    title="Light"
                                >
                                    <Sun size={18} className="icon-accent" />
                                </button>
                                <button
                                    className={`theme-btn ${theme === 'dark' ? 'active' : ''}`}
                                    onClick={() => onChangeTheme('dark')}
                                    title="Dark"
                                >
                                    <Moon size={18} className="icon-primary" />
                                </button>
                                <button
                                    className={`theme-btn ${theme === 'colorful' ? 'active' : ''}`}
                                    onClick={() => onChangeTheme('colorful')}
                                    title="Colorful"
                                >
                                    <Rainbow size={18} className="icon-secondary" />
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
                                <FileDown size={16} className="icon-primary" />
                                Export Data
                            </button>

                            <button className="sidebar-action-btn" onClick={() => onShare('import')}>
                                <FileUp size={16} className="icon-success" />
                                Import Data
                            </button>

                            <button className="sidebar-action-btn" onClick={() => onShare('share')}>
                                <Share2 size={16} className="icon-secondary" />
                                Share
                            </button>

                            <button className="sidebar-action-btn success" onClick={() => onShare('backup')}>
                                <UploadCloud size={16} className="icon-accent" />
                                Backup to Drive
                            </button>

                            <button className="sidebar-action-btn accent" onClick={() => onShare('restore')}>
                                <DownloadCloud size={16} className="icon-warning" />
                                Restore from Drive
                            </button>
                        </div>
                    </div>
                )}

                {/* Collapsed state icons */}
                {!isOpen && (
                    <div className="sidebar-collapsed-icons">
                        <button className="collapsed-icon tooltip" data-tooltip="School" onClick={onToggle}>
                            <School size={20} />
                        </button>
                        <button className="collapsed-icon tooltip" data-tooltip="Student Profile" onClick={onOpenProfile}>
                            <User size={20} />
                        </button>
                        <button className="collapsed-icon tooltip" data-tooltip="Sheets" onClick={onGoToSheet}>
                            <FileText size={20} />
                        </button>
                        <button className="collapsed-icon tooltip" data-tooltip="Settings">
                            <Settings size={20} />
                        </button>
                    </div>
                )}
            </aside>
        </>
    );
}
