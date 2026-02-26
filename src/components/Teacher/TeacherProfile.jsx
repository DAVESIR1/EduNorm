import React, { useState, useEffect } from 'react';
import { useUndo } from '../../contexts/UndoContext';
import * as db from '../../services/database';
import { SaveIcon, EditIcon, PrinterIcon, UserAddIcon, PlusIcon, TrashIcon } from '../Icons/CustomIcons';
import './TeacherProfile.css';

const PROFILE_FIELDS = [
    { id: 'name', label: 'Full Name', type: 'text', required: true },
    { id: 'designation', label: 'Designation', type: 'text' },
    { id: 'subject', label: 'Subject Taught', type: 'text' },
    { id: 'qualification', label: 'Qualification / Degree', type: 'text' },
    { id: 'experience', label: 'Years of Experience', type: 'number' },
    { id: 'birthdate', label: 'Date of Birth', type: 'date' },
    { id: 'joinDate', label: 'Joining Date', type: 'date' },
    { id: 'mobile', label: 'Mobile Number', type: 'tel' },
    { id: 'email', label: 'Email', type: 'email' },
    { id: 'address', label: 'Address', type: 'textarea' },
    { id: 'blood_group', label: 'Blood Group', type: 'select', options: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'] },
    { id: 'emergency_contact', label: 'Emergency Contact', type: 'tel' },
    { id: 'aadhar', label: 'Aadhar / ID Number', type: 'text' },
    { id: 'pan', label: 'PAN Number', type: 'text' },
    { id: 'bank_account', label: 'Bank Account No.', type: 'text' },
    { id: 'ifsc', label: 'IFSC Code', type: 'text' },
];

export default function TeacherProfile() {
    const [profileData, setProfileData] = useState({});
    const [editing, setEditing] = useState(false);
    const [customFields, setCustomFields] = useState([]);
    const [saving, setSaving] = useState(false);
    const [photoUrl, setPhotoUrl] = useState('');
    const { recordAction } = useUndo();

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const saved = await db.getSetting('teacher_self_profile') || {};
            setProfileData(saved.data || {});
            setCustomFields(saved.customFields || []);
            setPhotoUrl(saved.photoUrl || '');
        } catch (error) {
            console.error('Failed to load profile:', error);
        }
    };

    const handleFieldChange = (fieldId, value) => {
        setProfileData(prev => ({ ...prev, [fieldId]: value }));
    };

    const handlePhotoUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setPhotoUrl(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const handleAddCustomField = () => {
        setCustomFields(prev => [
            ...prev,
            { id: `custom_${Date.now()}`, label: '', value: '' }
        ]);
    };

    const handleCustomFieldChange = (id, key, value) => {
        setCustomFields(prev => prev.map(f =>
            f.id === id ? { ...f, [key]: value } : f
        ));
    };

    const handleRemoveCustomField = (id) => {
        setCustomFields(prev => prev.filter(f => f.id !== id));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const oldProfile = await db.getSetting('teacher_self_profile') || {};
            const newProfile = {
                data: profileData,
                customFields: customFields.filter(f => f.label.trim()),
                photoUrl,
                updatedAt: Date.now()
            };

            await db.setSetting('teacher_self_profile', newProfile);
            setEditing(false);

            recordAction({
                type: 'UPDATE_TEACHER_PROFILE',
                description: 'Updated teacher profile',
                undo: async () => {
                    await db.setSetting('teacher_self_profile', oldProfile);
                    setProfileData(oldProfile.data || {});
                    setCustomFields(oldProfile.customFields || []);
                    setPhotoUrl(oldProfile.photoUrl || '');
                },
                redo: async () => {
                    await db.setSetting('teacher_self_profile', newProfile);
                    setProfileData(newProfile.data);
                    setCustomFields(newProfile.customFields);
                    setPhotoUrl(newProfile.photoUrl);
                }
            });
        } catch (error) {
            console.error('Failed to save:', error);
            alert('Failed to save profile');
        } finally {
            setSaving(false);
        }
    };

    const handlePrint = () => window.print();

    const renderField = (field) => {
        if (!editing) {
            return (
                <span className="field-value">
                    {profileData[field.id] || <em className="empty-val">Not set</em>}
                </span>
            );
        }

        if (field.type === 'select') {
            return (
                <select value={profileData[field.id] || ''} onChange={(e) => handleFieldChange(field.id, e.target.value)} className="input-field">
                    <option value="">Select...</option>
                    {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
            );
        }
        if (field.type === 'textarea') {
            return <textarea value={profileData[field.id] || ''} onChange={(e) => handleFieldChange(field.id, e.target.value)} className="input-field textarea" rows={3} />;
        }
        return <input type={field.type} value={profileData[field.id] || ''} onChange={(e) => handleFieldChange(field.id, e.target.value)} className="input-field" />;
    };

    return (
        <div className="teacher-profile">
            <div className="profile-header">
                <h2>👤 My Profile</h2>
                <div className="header-actions">
                    {editing ? (
                        <>
                            <button className="btn-secondary" onClick={() => { setEditing(false); loadProfile(); }}>Cancel</button>
                            <button className="btn-primary" onClick={handleSave} disabled={saving}>
                                <SaveIcon size={16} /> {saving ? 'Saving...' : 'Save'}
                            </button>
                        </>
                    ) : (
                        <>
                            <button className="btn-secondary" onClick={handlePrint}>
                                <PrinterIcon size={16} /> Print
                            </button>
                            <button className="btn-primary" onClick={() => setEditing(true)}>
                                <EditIcon size={16} /> Edit
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="profile-card">
                {/* Photo Section */}
                <div className="photo-section">
                    <div className="photo-wrapper">
                        {photoUrl ? (
                            <img src={photoUrl} alt="Profile" className="profile-photo" />
                        ) : (
                            <div className="photo-placeholder">
                                <UserAddIcon size={40} />
                            </div>
                        )}
                        {editing && (
                            <label className="photo-upload-btn">
                                <input type="file" accept="image/*" onChange={handlePhotoUpload} hidden />
                                📷 Change Photo
                            </label>
                        )}
                    </div>
                    <h3 className="profile-name">{profileData.name || 'Your Name'}</h3>
                    <p className="profile-designation">{profileData.designation || 'Designation'}</p>
                </div>

                {/* Profile Details */}
                <div className="profile-details">
                    <div className="details-grid">
                        {PROFILE_FIELDS.map(field => (
                            <div key={field.id} className="detail-item">
                                <label>{field.label}</label>
                                {renderField(field)}
                            </div>
                        ))}
                    </div>

                    {/* Custom Fields */}
                    {(customFields.length > 0 || editing) && (
                        <div className="custom-section">
                            <h4>Additional Information</h4>
                            {customFields.map(field => (
                                <div key={field.id} className="custom-field-row">
                                    {editing ? (
                                        <>
                                            <input type="text" value={field.label} onChange={(e) => handleCustomFieldChange(field.id, 'label', e.target.value)} placeholder="Field Name" className="input-field" />
                                            <input type="text" value={field.value} onChange={(e) => handleCustomFieldChange(field.id, 'value', e.target.value)} placeholder="Value" className="input-field" />
                                            <button className="remove-btn" onClick={() => handleRemoveCustomField(field.id)}>
                                                <TrashIcon size={14} />
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <span className="custom-label">{field.label}</span>
                                            <span className="custom-value">{field.value || 'Not set'}</span>
                                        </>
                                    )}
                                </div>
                            ))}
                            {editing && (
                                <button className="add-field-btn" onClick={handleAddCustomField}>
                                    <PlusIcon size={16} /> Add More Info
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
