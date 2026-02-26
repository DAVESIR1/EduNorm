
import React, { useState, useEffect } from 'react';
import { Save, Edit, Printer, Plus, Trash, Camera, FileText } from 'lucide-react';
import { SchoolIcon, InfrastructureIcon } from '../../components/Icons/CustomIcons';
import SchoolLogic from './logic.js';
import * as db from '../../services/database';

/**
 * SOVEREIGN SCHOOL PROFILE: VIEW
 */
export function SchoolProfileView({
    schoolName, schoolContact, schoolEmail, schoolLogo,
    onSchoolNameChange, onSchoolContactChange, onSchoolEmailChange, onSchoolLogoChange,
    onSaveSettings
}) {
    const [facilities, setFacilities] = useState([]);
    const [customFields, setCustomFields] = useState([]);
    const [schoolLandline, setSchoolLandline] = useState('');
    const [udiseNumber, setUdiseNumber] = useState('');
    const [indexNumber, setIndexNumber] = useState('');
    const [boardName, setBoardName] = useState('');
    const [principalSignature, setPrincipalSignature] = useState('');
    const [fieldRenames, setFieldRenames] = useState({});
    const [hiddenFields, setHiddenFields] = useState([]);
    const [editMode, setEditMode] = useState(false);
    const [saving, setSaving] = useState(false);

    // Initial Load & Sync
    useEffect(() => {
        const load = async () => {
            const saved = await db.getSetting('school_profile');
            if (saved) {
                setFacilities(SchoolLogic.mergeFacilities(saved.facilities));
                setCustomFields(saved.customFields || []);
                setSchoolLandline(saved.schoolLandline || '');
                setUdiseNumber(saved.udiseNumber || '');
                setIndexNumber(saved.indexNumber || '');
                setBoardName(saved.boardName || '');
                setPrincipalSignature(saved.principalSignature || '');
                setFieldRenames(saved.fieldRenames || {});
                setHiddenFields(saved.hiddenFields || []);
            } else {
                setFacilities(SchoolLogic.mergeFacilities([]));
            }

            // If props exist but state is empty, favor props (App.jsx is the source of truth for core info)
            if (schoolContact || schoolLandline) {
                const { mobile, landline } = SchoolLogic.parseContact(schoolContact || schoolLandline);
                if (landline && !schoolLandline) setSchoolLandline(landline);
                if (mobile && schoolContact !== mobile) onSchoolContactChange?.(mobile);
            }
        };
        load();
    }, [schoolName, schoolContact, schoolEmail]); // React to prop changes from App.jsx

    const handleSave = async () => {
        setSaving(true);
        try {
            // MERGE with existing data to prevent overwriting App.jsx settings (schoolName, etc.)
            const existing = await db.getSetting('school_profile') || {};
            await db.setSetting('school_profile', {
                ...existing,
                facilities,
                customFields,
                schoolLandline,
                udiseNumber,
                indexNumber,
                boardName,
                principalSignature,
                fieldRenames,
                hiddenFields,
                updatedAt: Date.now()
            });

            // Sync mobile/landline to main contact
            const combinedContact = SchoolLogic.formatContact(schoolContact, schoolLandline);
            onSchoolContactChange?.(combinedContact);

            onSaveSettings?.();
            setEditMode(false);
            window.alert('School Profile Updated!');
        } catch (e) {
            window.alert('Save failed: ' + e.message);
        } finally {
            setSaving(false);
        }
    };

    const onLogoChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            const compressed = await SchoolLogic.compressImage(file);
            onSchoolLogoChange?.(compressed);
        }
    };

    const addCustomField = () => {
        setCustomFields(prev => [...prev, { id: `custom_${Date.now()}`, label: 'New Field', value: '' }]);
    };

    const updateCustomField = (id, key, value) => {
        setCustomFields(prev => prev.map(f => f.id === id ? { ...f, [key]: value } : f));
    };

    const removeCustomField = (id) => {
        if (window.confirm('Remove this custom field?')) {
            setCustomFields(prev => prev.filter(f => f.id !== id));
        }
    };

    const toggleVisibility = (fieldId) => {
        setHiddenFields(prev => prev.includes(fieldId) ? prev.filter(id => id !== fieldId) : [...prev, fieldId]);
    };

    const updateLabel = (fieldId, newLabel) => {
        setFieldRenames(prev => ({ ...prev, [fieldId]: newLabel }));
    };

    const renderLabel = (id, defaultLabel) => {
        const label = fieldRenames[id] || defaultLabel;
        if (!editMode) return <label>{label}</label>;

        return (
            <div className="label-edit-group">
                <input
                    className="label-input"
                    value={label}
                    onChange={e => updateLabel(id, e.target.value)}
                    placeholder={defaultLabel}
                />
                <button className={`btn-visibility ${hiddenFields.includes(id) ? 'hidden' : ''}`} onClick={() => toggleVisibility(id)}>
                    {hiddenFields.includes(id) ? <FileText size={14} style={{ opacity: 0.3 }} /> : <FileText size={14} />}
                </button>
            </div>
        );
    };

    return (
        <div className="school-profile-v2">
            <div className="profile-header">
                <div className="school-brand" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', width: '100%', gap: '1rem' }}>
                    <div className="logo-wrapper" onClick={() => editMode && document.getElementById('logo-up').click()}>
                        {schoolLogo ? <img src={schoolLogo} alt="Logo" /> : <div className="logo-placeholder"><Camera /></div>}
                        {editMode && <input type="file" id="logo-up" hidden onChange={onLogoChange} />}
                    </div>
                    <div>
                        <h1 className="gradient-text" style={{ textAlign: 'center' }}>{schoolName || 'Your School'}</h1>
                        <p className="dim-text" style={{ textAlign: 'center' }}>{udiseNumber ? `UDISE: ${udiseNumber}` : 'Global Education Registry'}</p>
                    </div>
                    {/* Edit/Save actions — always visible, centered below logo */}
                    <div style={{
                        display: 'flex',
                        flexDirection: 'row',
                        flexWrap: 'wrap',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: '10px',
                        marginTop: '4px',
                        width: '100%'
                    }}>
                        {editMode ? (
                            <button
                                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 22px', borderRadius: '12px', border: 'none', background: 'linear-gradient(135deg, #6366f1, #a855f7)', color: '#fff', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer' }}
                                onClick={handleSave}
                                disabled={saving}
                            >
                                <Save size={17} /> {saving ? 'Saving...' : 'Save Profile'}
                            </button>
                        ) : (
                            <button
                                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 22px', borderRadius: '12px', border: '2px solid #6366f1', background: 'transparent', color: '#6366f1', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer' }}
                                onClick={() => setEditMode(true)}
                            >
                                <Edit size={17} /> Edit Profile
                            </button>
                        )}
                        <button
                            style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 18px', borderRadius: '12px', border: '1px solid #e5e7eb', background: 'transparent', color: '#6b7280', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' }}
                            onClick={() => window.print()}
                        >
                            <Printer size={17} /> Print
                        </button>
                    </div>
                </div>
            </div>

            <div className="profile-grid">
                {/* Core Info */}
                <section className="card">
                    <h3 className="section-title">
                        <SchoolIcon size={24} className="icon-accent" />
                        <span>Campus Identity</span>
                    </h3>
                    <div className="input-group">
                        {renderLabel('schoolName', 'School Name')}
                        <input className="input-field" value={schoolName} onChange={e => onSchoolNameChange(e.target.value)} disabled={!editMode} />
                    </div>
                    {!editMode && hiddenFields.includes('schoolName') && null}

                    <div className="input-row">
                        {!hiddenFields.includes('udiseNumber') || editMode ? (
                            <div className="input-group">
                                {renderLabel('udiseNumber', 'UDISE No.')}
                                <input className="input-field" value={udiseNumber} onChange={e => setUdiseNumber(e.target.value)} disabled={!editMode} />
                            </div>
                        ) : null}

                        {!hiddenFields.includes('indexNumber') || editMode ? (
                            <div className="input-group">
                                {renderLabel('indexNumber', 'Index No.')}
                                <input className="input-field" value={indexNumber} onChange={e => setIndexNumber(e.target.value)} disabled={!editMode} />
                            </div>
                        ) : null}
                    </div>

                    {!hiddenFields.includes('boardName') || editMode ? (
                        <div className="input-group">
                            {renderLabel('boardName', 'Affiliation Board')}
                            <input className="input-field" value={boardName} onChange={e => setBoardName(e.target.value)} disabled={!editMode} />
                        </div>
                    ) : null}

                    <div className="input-row">
                        {!hiddenFields.includes('schoolEmail') || editMode ? (
                            <div className="input-group">
                                {renderLabel('schoolEmail', 'School Email')}
                                <input className="input-field" value={schoolEmail} onChange={e => onSchoolEmailChange(e.target.value)} disabled={!editMode} />
                            </div>
                        ) : null}

                        {!hiddenFields.includes('schoolContact') || editMode ? (
                            <div className="input-group">
                                {renderLabel('schoolContact', 'Contact / Landline')}
                                <input className="input-field" value={schoolLandline} onChange={e => setSchoolLandline(e.target.value)} disabled={!editMode} placeholder="Enter Landline..." />
                            </div>
                        ) : null}
                    </div>
                </section>

                {/* Facilities */}
                <section className="card">
                    <h3 className="section-title">
                        <InfrastructureIcon size={24} className="icon-secondary" />
                        <span>Infrastructure & Facilities</span>
                    </h3>
                    <div className="facilities-grid">
                        {facilities.filter(f => !hiddenFields.includes(f.id) || editMode).map(f => (
                            <div key={f.id} className={`input-group ${hiddenFields.includes(f.id) ? 'field-hidden' : ''}`}>
                                {renderLabel(f.id, f.label)}
                                {editMode ? (
                                    f.type === 'select' ? (
                                        <select
                                            className="input-field"
                                            value={f.value}
                                            onChange={e => setFacilities(prev => prev.map(item => item.id === f.id ? { ...item, value: e.target.value } : item))}
                                        >
                                            <option value="">Select...</option>
                                            {f.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                        </select>
                                    ) : (
                                        <input
                                            type={f.type}
                                            className="input-field"
                                            value={f.value}
                                            onChange={e => setFacilities(prev => prev.map(item => item.id === f.id ? { ...item, value: e.target.value } : item))}
                                        />
                                    )
                                ) : (
                                    <div className="value-display">{f.value || '-'}</div>
                                )}
                            </div>
                        ))}
                    </div>
                </section>

                {/* Custom Information */}
                <section className="card custom-fields-section">
                    <div className="section-header-flex">
                        <h3 className="section-title">
                            <FileText size={24} className="icon-primary" />
                            <span>Custom Information</span>
                        </h3>
                        {editMode && (
                            <button className="btn btn-icon-sm btn-ghost" onClick={addCustomField} title="Add Custom Field">
                                <Plus size={20} />
                            </button>
                        )}
                    </div>

                    <div className="facilities-grid">
                        {customFields.map(f => (
                            <div key={f.id} className="input-group custom-field-item">
                                {editMode ? (
                                    <div className="custom-field-edit-row">
                                        <div style={{ flex: 1 }}>
                                            <label>Field Name</label>
                                            <input
                                                className="input-field-sm"
                                                value={f.label}
                                                onChange={e => updateCustomField(f.id, 'label', e.target.value)}
                                            />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <label>Value</label>
                                            <input
                                                className="input-field-sm"
                                                value={f.value}
                                                onChange={e => updateCustomField(f.id, 'value', e.target.value)}
                                            />
                                        </div>
                                        <button className="btn-remove" onClick={() => removeCustomField(f.id)}>
                                            <Trash size={14} />
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <label>{f.label}</label>
                                        <div className="value-display">{f.value || '-'}</div>
                                    </>
                                )}
                            </div>
                        ))}
                        {customFields.length === 0 && !editMode && (
                            <p className="dim-text" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '20px' }}>
                                No custom information added yet.
                            </p>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
}

export default SchoolProfileView;
