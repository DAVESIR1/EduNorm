import React, { useState, useEffect } from 'react';
import { useUndo } from '../../contexts/UndoContext';
import * as db from '../../services/database';
import { SaveIcon, EditIcon, PrinterIcon, PlusIcon, TrashIcon, SearchIcon } from '../Icons/CustomIcons';
import './StaffInfo.css';

// Default staff fields
const DEFAULT_STAFF_FIELDS = [
    { id: 'name', label: 'Full Name', type: 'text', required: true },
    { id: 'designation', label: 'Designation', type: 'text', required: true },
    { id: 'birthdate', label: 'Birth Date', type: 'date' },
    { id: 'join_cader', label: 'Joining Date (Cader)', type: 'date' },
    { id: 'join_school', label: 'Joining Date (School)', type: 'date' },
    { id: 'degree', label: 'Study / Degree', type: 'text' },
    { id: 'mobile', label: 'Mobile Number', type: 'tel' },
    { id: 'email', label: 'Email ID', type: 'email' },
    { id: 'working_standard', label: 'Working in Standard', type: 'text' },
    { id: 'subject', label: 'Subject', type: 'text' },
    { id: 'blood_group', label: 'Blood Group', type: 'select', options: ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'] },
    { id: 'students_count', label: 'Students in Class', type: 'number' },
    { id: 'last_standard', label: 'Last Standard/Class', type: 'text' },
    { id: 'last_subject', label: 'Last Subject', type: 'text' },
    { id: 'gov_id', label: 'Government ID Number', type: 'text' },
    { id: 'address_id', label: 'Address ID Number', type: 'text' },
    { id: 'pension_no', label: 'Pension Number', type: 'text' },
    { id: 'eo', label: 'Extra Ordinary Capability', type: 'textarea' },
];

export default function StaffInfo() {
    const [staffList, setStaffList] = useState([]);
    const [selectedStaff, setSelectedStaff] = useState(null);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({});
    const [customFields, setCustomFields] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [saving, setSaving] = useState(false);
    const { recordAction } = useUndo();

    useEffect(() => {
        loadStaffList();
    }, []);

    const loadStaffList = async () => {
        try {
            const saved = await db.getSetting('staff_info_list') || [];
            setStaffList(saved);
        } catch (error) {
            console.error('Failed to load staff list:', error);
        }
    };

    const handleNewStaff = () => {
        setSelectedStaff(null);
        setFormData({});
        setCustomFields([]);
        setShowForm(true);
    };

    const handleEditStaff = (staff) => {
        setSelectedStaff(staff);
        setFormData(staff.data || {});
        setCustomFields(staff.customFields || []);
        setShowForm(true);
    };

    const handleDeleteStaff = async (staffId) => {
        const staff = staffList.find(s => s.id === staffId);
        const newList = staffList.filter(s => s.id !== staffId);
        setStaffList(newList);
        await db.setSetting('staff_info_list', newList);

        recordAction({
            type: 'DELETE_STAFF',
            description: `Deleted staff: ${staff?.data?.name}`,
            undo: async () => {
                const list = await db.getSetting('staff_info_list') || [];
                list.push(staff);
                await db.setSetting('staff_info_list', list);
                setStaffList(list);
            },
            redo: async () => {
                const list = await db.getSetting('staff_info_list') || [];
                const filtered = list.filter(s => s.id !== staffId);
                await db.setSetting('staff_info_list', filtered);
                setStaffList(filtered);
            }
        });
    };

    const handleFieldChange = (fieldId, value) => {
        setFormData(prev => ({ ...prev, [fieldId]: value }));
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
        if (!formData.name?.trim()) {
            alert('Please enter staff name');
            return;
        }

        setSaving(true);
        try {
            const staffData = {
                id: selectedStaff?.id || Date.now().toString(),
                data: formData,
                customFields: customFields.filter(f => f.label.trim()),
                updatedAt: Date.now()
            };

            let newList;
            if (selectedStaff) {
                newList = staffList.map(s => s.id === selectedStaff.id ? staffData : s);
            } else {
                newList = [...staffList, staffData];
            }

            await db.setSetting('staff_info_list', newList);
            setStaffList(newList);
            setShowForm(false);
            setSelectedStaff(null);

            recordAction({
                type: selectedStaff ? 'UPDATE_STAFF' : 'ADD_STAFF',
                description: `${selectedStaff ? 'Updated' : 'Added'} staff: ${formData.name}`,
                undo: async () => {
                    await db.setSetting('staff_info_list', staffList);
                    setStaffList(staffList);
                },
                redo: async () => {
                    await db.setSetting('staff_info_list', newList);
                    setStaffList(newList);
                }
            });
        } catch (error) {
            console.error('Failed to save:', error);
            alert('Failed to save. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    const filteredStaff = staffList.filter(s =>
        s.data?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.data?.designation?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const renderField = (field) => {
        if (field.type === 'select') {
            return (
                <select
                    value={formData[field.id] || ''}
                    onChange={(e) => handleFieldChange(field.id, e.target.value)}
                    className="input-field"
                >
                    <option value="">Select...</option>
                    {field.options?.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                    ))}
                </select>
            );
        }
        if (field.type === 'textarea') {
            return (
                <textarea
                    value={formData[field.id] || ''}
                    onChange={(e) => handleFieldChange(field.id, e.target.value)}
                    className="input-field textarea"
                    rows={3}
                />
            );
        }
        return (
            <input
                type={field.type}
                value={formData[field.id] || ''}
                onChange={(e) => handleFieldChange(field.id, e.target.value)}
                className="input-field"
                required={field.required}
            />
        );
    };

    // Staff List View
    if (!showForm) {
        return (
            <div className="staff-info">
                <div className="staff-header">
                    <h2>👥 Staff Information</h2>
                    <div className="header-actions">
                        <div className="search-box">
                            <SearchIcon size={18} />
                            <input
                                type="text"
                                placeholder="Search staff..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <button className="btn-primary" onClick={handleNewStaff}>
                            <PlusIcon size={18} />
                            Add Staff
                        </button>
                    </div>
                </div>

                {filteredStaff.length === 0 ? (
                    <div className="empty-state">
                        <p>No staff members found</p>
                        <button className="btn-primary" onClick={handleNewStaff}>
                            <PlusIcon size={18} />
                            Add First Staff Member
                        </button>
                    </div>
                ) : (
                    <div className="staff-grid">
                        {filteredStaff.map(staff => (
                            <div
                                key={staff.id}
                                className="staff-card"
                                onClick={() => handleEditStaff(staff)}
                            >
                                <div className="staff-avatar">
                                    {staff.data?.name?.[0]?.toUpperCase() || '?'}
                                </div>
                                <div className="staff-details">
                                    <h3>{staff.data?.name || 'Unknown'}</h3>
                                    <p>{staff.data?.designation || 'No designation'}</p>
                                    {staff.data?.mobile && <span>📞 {staff.data.mobile}</span>}
                                </div>
                                <button
                                    className="delete-btn"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (confirm(`Delete ${staff.data?.name}?`)) {
                                            handleDeleteStaff(staff.id);
                                        }
                                    }}
                                >
                                    <TrashIcon size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // Staff Form View
    return (
        <div className="staff-info">
            <div className="staff-header">
                <h2>{selectedStaff ? '✏️ Edit Staff' : '➕ Add New Staff'}</h2>
                <button className="btn-secondary" onClick={() => setShowForm(false)}>
                    ← Back to List
                </button>
            </div>

            <div className="staff-form">
                <div className="form-grid">
                    {DEFAULT_STAFF_FIELDS.map(field => (
                        <div key={field.id} className="form-group">
                            <label>
                                {field.label}
                                {field.required && <span className="required">*</span>}
                            </label>
                            {renderField(field)}
                        </div>
                    ))}
                </div>

                {/* Custom Fields */}
                <div className="custom-fields-section">
                    <h3>Additional Information</h3>
                    {customFields.map(field => (
                        <div key={field.id} className="custom-field-row">
                            <input
                                type="text"
                                value={field.label}
                                onChange={(e) => handleCustomFieldChange(field.id, 'label', e.target.value)}
                                placeholder="Field Name"
                                className="input-field"
                            />
                            <input
                                type="text"
                                value={field.value}
                                onChange={(e) => handleCustomFieldChange(field.id, 'value', e.target.value)}
                                placeholder="Value"
                                className="input-field"
                            />
                            <button
                                className="remove-btn"
                                onClick={() => handleRemoveCustomField(field.id)}
                            >
                                <TrashIcon size={16} />
                            </button>
                        </div>
                    ))}
                    <button className="add-field-btn" onClick={handleAddCustomField}>
                        <PlusIcon size={18} />
                        Add More Info
                    </button>
                </div>

                <div className="form-actions">
                    <button className="btn-secondary" onClick={() => setShowForm(false)}>
                        Cancel
                    </button>
                    <button
                        className="btn-primary"
                        onClick={handleSave}
                        disabled={saving}
                    >
                        <SaveIcon size={18} />
                        {saving ? 'Saving...' : 'Save'}
                    </button>
                </div>
            </div>
        </div>
    );
}
