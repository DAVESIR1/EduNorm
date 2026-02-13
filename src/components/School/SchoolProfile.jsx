import React, { useState, useEffect } from 'react';
import { useUndo } from '../../contexts/UndoContext';
import * as db from '../../services/database';
import { SaveIcon, EditIcon, PrinterIcon, PlusIcon, TrashIcon } from '../Icons/CustomIcons';
import './SchoolProfile.css';

// Default facility fields
const DEFAULT_FACILITIES = [
    { id: 'start_date', label: 'School Start Date', type: 'date', value: '' },
    { id: 'area', label: 'Area (Square Meters)', type: 'number', value: '' },
    { id: 'buildings', label: 'Number of Buildings', type: 'number', value: '' },
    { id: 'rooms', label: 'Number of Rooms', type: 'number', value: '' },
    { id: 'boys_sanitation', label: 'Boys Sanitation Units', type: 'number', value: '' },
    { id: 'girls_sanitation', label: 'Girls Sanitation Units', type: 'number', value: '' },
    { id: 'drinking_water', label: 'Drinking Water Facility', type: 'select', options: ['Yes', 'No', 'Partial'], value: '' },
    { id: 'electricity', label: 'Electricity Facility', type: 'select', options: ['Yes', 'No', 'Partial'], value: '' },
    { id: 'computer_lab', label: 'Computer Lab', type: 'select', options: ['Yes', 'No', 'Partial'], value: '' },
    { id: 'smart_devices', label: 'Smart Device Facility', type: 'select', options: ['Yes', 'No', 'Partial'], value: '' },
    { id: 'library', label: 'Library Facility', type: 'select', options: ['Yes', 'No', 'Partial'], value: '' },
    { id: 'sports_equipment', label: 'Sports Equipment Count', type: 'number', value: '' },
    { id: 'drainage', label: 'Water Drainage Facility', type: 'select', options: ['Yes', 'No', 'Partial'], value: '' },
    { id: 'solar_power', label: 'Solar/Wind Power', type: 'select', options: ['Yes', 'No', 'Partial'], value: '' },
    { id: 'compound_wall', label: 'Compound Wall', type: 'select', options: ['Yes', 'No', 'Partial'], value: '' },
];

export default function SchoolProfile({
    schoolName, schoolContact, schoolEmail, schoolLogo,
    onSchoolNameChange, onSchoolContactChange, onSchoolEmailChange, onSchoolLogoChange,
    onSaveSettings
}) {
    const [facilities, setFacilities] = useState(DEFAULT_FACILITIES);
    const [customFields, setCustomFields] = useState([]);
    const [editMode, setEditMode] = useState(true);
    const [saving, setSaving] = useState(false);
    const [newFieldName, setNewFieldName] = useState('');
    const [showAddField, setShowAddField] = useState(false);
    const [schoolLandline, setSchoolLandline] = useState('');
    const [indexNumber, setIndexNumber] = useState('');
    const [udiseNumber, setUdiseNumber] = useState('');
    const [boardName, setBoardName] = useState('');
    const [principalSignature, setPrincipalSignature] = useState('');
    const { recordAction } = useUndo();

    // Split contact into mobile and landline on load
    useEffect(() => {
        loadData();
        // Parse landline from contact if stored as "mobile|landline"
        if (schoolContact && schoolContact.includes('|')) {
            const parts = schoolContact.split('|');
            onSchoolContactChange?.(parts[0]);
            setSchoolLandline(parts[1] || '');
        }
    }, []);

    const loadData = async () => {
        try {
            const saved = await db.getSetting('school_profile');
            if (saved) {
                if (saved.facilities) setFacilities(saved.facilities);
                if (saved.customFields) setCustomFields(saved.customFields);
                if (saved.schoolLandline) setSchoolLandline(saved.schoolLandline);
                if (saved.indexNumber) setIndexNumber(saved.indexNumber);
                if (saved.udiseNumber) setUdiseNumber(saved.udiseNumber);
                if (saved.boardName) setBoardName(saved.boardName);
                if (saved.principalSignature) setPrincipalSignature(saved.principalSignature);
            }
        } catch (error) {
            console.error('Failed to load school profile:', error);
        }
    };

    const handleLogoUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type and size
        if (!file.type.startsWith('image/')) {
            alert('Please select an image file (PNG, JPG, etc.)');
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            alert('Logo file must be less than 2MB');
            return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            onSchoolLogoChange?.(event.target.result);
        };
        reader.readAsDataURL(file);
    };

    const handleSignatureUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (!file.type.startsWith('image/')) { alert('Please use an image file'); return; }

        const reader = new FileReader();
        reader.onload = (ev) => setPrincipalSignature(ev.target.result);
        reader.readAsDataURL(file);
    };

    const handleFieldChange = (id, value) => {
        const oldValue = facilities.find(f => f.id === id)?.value;
        setFacilities(prev => prev.map(f =>
            f.id === id ? { ...f, value } : f
        ));

        // Record for undo
        recordAction({
            type: 'UPDATE_SCHOOL_PROFILE',
            description: `Changed ${facilities.find(f => f.id === id)?.label}`,
            undo: async () => {
                setFacilities(prev => prev.map(f =>
                    f.id === id ? { ...f, value: oldValue } : f
                ));
            },
            redo: async () => {
                setFacilities(prev => prev.map(f =>
                    f.id === id ? { ...f, value } : f
                ));
            }
        });
    };

    const handleCustomFieldChange = (id, value) => {
        setCustomFields(prev => prev.map(f =>
            f.id === id ? { ...f, value } : f
        ));
    };

    const handleAddField = () => {
        if (!newFieldName.trim()) return;

        const newField = {
            id: `custom_${Date.now()}`,
            label: newFieldName.trim(),
            type: 'text',
            value: '',
            isCustom: true
        };

        setCustomFields(prev => [...prev, newField]);
        setNewFieldName('');
        setShowAddField(false);

        recordAction({
            type: 'ADD_CUSTOM_FIELD',
            description: `Added field: ${newFieldName}`,
            undo: async () => {
                setCustomFields(prev => prev.filter(f => f.id !== newField.id));
            },
            redo: async () => {
                setCustomFields(prev => [...prev, newField]);
            }
        });
    };

    const handleRemoveField = (id) => {
        const field = customFields.find(f => f.id === id);
        setCustomFields(prev => prev.filter(f => f.id !== id));

        recordAction({
            type: 'REMOVE_CUSTOM_FIELD',
            description: `Removed field: ${field?.label}`,
            undo: async () => {
                setCustomFields(prev => [...prev, field]);
            },
            redo: async () => {
                setCustomFields(prev => prev.filter(f => f.id !== id));
            }
        });
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await db.setSetting('school_profile', {
                facilities,
                customFields,
                schoolLandline,
                indexNumber,
                udiseNumber,
                boardName,
                principalSignature,
                updatedAt: Date.now()
            });
            // Also save school info to main settings
            if (onSaveSettings) onSaveSettings();
            setEditMode(false);
            alert('School profile saved successfully!');
        } catch (error) {
            console.error('Failed to save:', error);
            alert('Failed to save. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const renderField = (field) => {
        if (!editMode) {
            return (
                <div className="field-value">
                    {field.value || <span className="empty">Not set</span>}
                </div>
            );
        }

        switch (field.type) {
            case 'select':
                return (
                    <select
                        value={field.value}
                        onChange={(e) => handleFieldChange(field.id, e.target.value)}
                        className="field-input"
                    >
                        <option value="">Select...</option>
                        {field.options?.map(opt => (
                            <option key={opt} value={opt}>{opt}</option>
                        ))}
                    </select>
                );
            case 'date':
                return (
                    <input
                        type="date"
                        value={field.value}
                        onChange={(e) => handleFieldChange(field.id, e.target.value)}
                        className="field-input"
                    />
                );
            case 'number':
                return (
                    <input
                        type="number"
                        value={field.value}
                        onChange={(e) => handleFieldChange(field.id, e.target.value)}
                        className="field-input"
                        min="0"
                    />
                );
            default:
                return (
                    <input
                        type="text"
                        value={field.value}
                        onChange={(e) => handleFieldChange(field.id, e.target.value)}
                        className="field-input"
                    />
                );
        }
    };

    return (
        <div className="school-profile">
            {/* Header */}
            <div className="profile-header">
                <div className="school-info">
                    {schoolLogo && (
                        <img src={schoolLogo} alt="School Logo" className="school-logo" />
                    )}
                    <div>
                        <h1>{schoolName || 'School Name'}</h1>
                        {schoolContact && <p>📞 {schoolContact}</p>}
                        {schoolEmail && <p>✉️ {schoolEmail}</p>}
                    </div>
                </div>
                <div className="header-actions">
                    {editMode ? (
                        <>
                            <button
                                className="action-btn save"
                                onClick={handleSave}
                                disabled={saving}
                            >
                                <SaveIcon size={18} />
                                {saving ? 'Saving...' : 'Save'}
                            </button>
                            <button
                                className="action-btn"
                                onClick={() => setEditMode(false)}
                            >
                                Cancel
                            </button>
                        </>
                    ) : (
                        <>
                            <button
                                className="action-btn"
                                onClick={() => setEditMode(true)}
                            >
                                <EditIcon size={18} />
                                Edit
                            </button>
                            <button
                                className="action-btn"
                                onClick={handlePrint}
                            >
                                <PrinterIcon size={18} />
                                Print
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* School Basic Info - Always Editable */}
            <div className="school-info-section">
                <h2>🏫 School Information</h2>
                <div className="school-info-grid">
                    {/* Logo Upload */}
                    <div className="logo-upload-card">
                        <label>School Logo</label>
                        <div className="logo-upload-area">
                            {schoolLogo ? (
                                <div className="logo-preview">
                                    <img src={schoolLogo} alt="School Logo" />
                                    <button className="change-logo-btn" onClick={() => document.getElementById('logo-upload-input').click()}>
                                        Change Logo
                                    </button>
                                </div>
                            ) : (
                                <div className="logo-placeholder" onClick={() => document.getElementById('logo-upload-input').click()}>
                                    <span className="upload-icon">📷</span>
                                    <span>Click to upload logo</span>
                                    <span className="upload-hint">PNG, JPG • Max 2MB</span>
                                </div>
                            )}
                            <input
                                id="logo-upload-input"
                                type="file"
                                accept="image/*"
                                onChange={handleLogoUpload}
                                style={{ display: 'none' }}
                            />
                        </div>
                    </div>

                    {/* School Name */}
                    <div className="info-field-card">
                        <label>School Name</label>
                        <input
                            type="text"
                            className="field-input"
                            value={schoolName || ''}
                            onChange={(e) => onSchoolNameChange?.(e.target.value)}
                            placeholder="Enter school name..."
                        />
                    </div>

                    {/* Mobile Contact */}
                    <div className="info-field-card">
                        <label>📱 Mobile Number</label>
                        <input
                            type="tel"
                            className="field-input"
                            value={schoolContact || ''}
                            onChange={(e) => onSchoolContactChange?.(e.target.value)}
                            placeholder="+91 98765 43210"
                        />
                    </div>

                    {/* Landline */}
                    <div className="info-field-card">
                        <label>📞 Landline Number</label>
                        <input
                            type="tel"
                            className="field-input"
                            value={schoolLandline}
                            onChange={(e) => setSchoolLandline(e.target.value)}
                            placeholder="0XX-XXXXXXXX"
                        />
                    </div>

                    {/* Email */}
                    <div className="info-field-card">
                        <label>✉️ School Email</label>
                        <input
                            type="email"
                            className="field-input"
                            value={schoolEmail || ''}
                            onChange={(e) => onSchoolEmailChange?.(e.target.value)}
                            placeholder="school@example.com"
                        />
                    </div>

                    {/* UDISE Number */}
                    <div className="info-field-card">
                        <label>🔢 UDISE Number</label>
                        <input
                            type="text"
                            className="field-input"
                            value={udiseNumber}
                            onChange={(e) => setUdiseNumber(e.target.value)}
                            placeholder="e.g. 24010100101"
                        />
                    </div>

                    {/* Index Number */}
                    <div className="info-field-card">
                        <label>📊 Index Number</label>
                        <input
                            type="text"
                            className="field-input"
                            value={indexNumber}
                            onChange={(e) => setIndexNumber(e.target.value)}
                            placeholder="e.g. 12.34.56"
                        />
                    </div>

                    {/* Board */}
                    <div className="info-field-card">
                        <label>🏛️ Board</label>
                        <input
                            type="text"
                            className="field-input"
                            value={boardName}
                            onChange={(e) => setBoardName(e.target.value)}
                            placeholder="e.g. GSEB / CBSE"
                        />
                    </div>

                    {/* Principal Signature */}
                    <div className="logo-upload-card">
                        <label>Principal Signature</label>
                        <div className="logo-upload-area" style={{ height: '100px' }}>
                            {principalSignature ? (
                                <div className="logo-preview">
                                    <img src={principalSignature} alt="Principal Signature" style={{ objectFit: 'contain' }} />
                                    <button className="change-logo-btn" onClick={() => document.getElementById('sig-upload-input').click()}>
                                        Change
                                    </button>
                                </div>
                            ) : (
                                <div className="logo-placeholder" onClick={() => document.getElementById('sig-upload-input').click()}>
                                    <span style={{ fontSize: '24px' }}>✍️</span>
                                    <span>Upload Signature</span>
                                </div>
                            )}
                            <input
                                id="sig-upload-input"
                                type="file"
                                accept="image/*"
                                onChange={handleSignatureUpload}
                                style={{ display: 'none' }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Facilities Grid */}
            <div className="facilities-section">
                <h2>📋 School Facilities & Information</h2>
                <div className="facilities-grid">
                    {facilities.map(field => (
                        <div key={field.id} className="facility-item">
                            <label>{field.label}</label>
                            {renderField(field)}
                        </div>
                    ))}
                </div>
            </div>

            {/* Custom Fields */}
            {(customFields.length > 0 || editMode) && (
                <div className="custom-fields-section">
                    <h2>➕ Additional Information</h2>
                    <div className="facilities-grid">
                        {customFields.map(field => (
                            <div key={field.id} className="facility-item">
                                <label>
                                    {field.label}
                                    {editMode && (
                                        <button
                                            className="remove-btn"
                                            onClick={() => handleRemoveField(field.id)}
                                        >
                                            <TrashIcon size={14} />
                                        </button>
                                    )}
                                </label>
                                {editMode ? (
                                    <input
                                        type="text"
                                        value={field.value}
                                        onChange={(e) => handleCustomFieldChange(field.id, e.target.value)}
                                        className="field-input"
                                    />
                                ) : (
                                    <div className="field-value">
                                        {field.value || <span className="empty">Not set</span>}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {editMode && (
                        <div className="add-field-area">
                            {showAddField ? (
                                <div className="add-field-form">
                                    <input
                                        type="text"
                                        value={newFieldName}
                                        onChange={(e) => setNewFieldName(e.target.value)}
                                        placeholder="Enter field name..."
                                        className="field-input"
                                        autoFocus
                                    />
                                    <button className="btn-primary" onClick={handleAddField}>
                                        Add
                                    </button>
                                    <button className="btn-secondary" onClick={() => setShowAddField(false)}>
                                        Cancel
                                    </button>
                                </div>
                            ) : (
                                <button
                                    className="add-field-btn"
                                    onClick={() => setShowAddField(true)}
                                >
                                    <PlusIcon size={18} />
                                    Add Custom Field
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
