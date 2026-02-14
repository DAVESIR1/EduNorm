import React, { useState, useEffect, useCallback } from 'react';
import { useUndo } from '../../contexts/UndoContext';
import * as db from '../../services/database';
import { SaveIcon, EditIcon, TrashIcon, PlusIcon, SearchIcon, PrinterIcon } from '../Icons/CustomIcons';
import './TeachersProfileList.css';

const DEFAULT_FIELDS = [
    { id: 'teacherCode', label: 'Teacher Code / ID', type: 'text', required: true },
    { id: 'name', label: 'Full Name', type: 'text', required: true },
    { id: 'govId', label: 'Government ID (Aadhar/PAN)', type: 'text', required: true },
    { id: 'designation', label: 'Designation', type: 'text' },
    { id: 'subject', label: 'Subject', type: 'text' },
    { id: 'qualification', label: 'Qualification', type: 'text' },
    { id: 'experience', label: 'Experience (Years)', type: 'number' },
    { id: 'mobile', label: 'Mobile', type: 'tel' },
    { id: 'email', label: 'Email', type: 'email' },
    { id: 'joinDate', label: 'Joining Date', type: 'date' },
    { id: 'address', label: 'Address', type: 'textarea' },
];

export default function TeachersProfileList() {
    const [teachers, setTeachers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({});
    const [photoUrl, setPhotoUrl] = useState('');
    const [saving, setSaving] = useState(false);
    const { recordAction } = useUndo();

    useEffect(() => { loadTeachers(); }, []);

    const loadTeachers = async () => {
        try {
            const saved = await db.getSetting('school_teachers_list') || [];
            setTeachers(saved);
        } catch (err) {
            console.error('Failed to load teachers:', err);
        }
    };

    const saveTeachers = async (newList) => {
        await db.setSetting('school_teachers_list', newList);
        setTeachers(newList);
    };

    const handleAdd = () => {
        setFormData({});
        setPhotoUrl('');
        setEditingId(null);
        setShowForm(true);
    };

    const handleEdit = (teacher) => {
        setFormData(teacher.data || {});
        setPhotoUrl(teacher.photoUrl || '');
        setEditingId(teacher.id);
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this teacher profile?')) return;
        const oldList = [...teachers];
        const newList = teachers.filter(t => t.id !== id);
        await saveTeachers(newList);

        recordAction({
            type: 'DELETE_TEACHER',
            description: 'Deleted teacher profile',
            undo: async () => { await saveTeachers(oldList); },
            redo: async () => { await saveTeachers(newList); }
        });
    };

    const handleSave = async () => {
        if (!formData.name?.trim()) { alert('Name is required'); return; }
        setSaving(true);
        try {
            const oldList = [...teachers];
            let newList;

            if (editingId) {
                newList = teachers.map(t =>
                    t.id === editingId ? { ...t, data: formData, photoUrl, updatedAt: Date.now() } : t
                );
            } else {
                newList = [...teachers, {
                    id: Date.now().toString(),
                    data: formData,
                    photoUrl,
                    createdAt: Date.now()
                }];
            }

            await saveTeachers(newList);
            setShowForm(false);
            setEditingId(null);

            recordAction({
                type: editingId ? 'UPDATE_TEACHER' : 'ADD_TEACHER',
                description: `${editingId ? 'Updated' : 'Added'} teacher: ${formData.name}`,
                undo: async () => { await saveTeachers(oldList); },
                redo: async () => { await saveTeachers(newList); }
            });
        } catch (err) {
            console.error('Save failed:', err);
            alert('Failed to save');
        } finally {
            setSaving(false);
        }
    };

    const handlePhotoUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setPhotoUrl(reader.result);
            reader.readAsDataURL(file);
        }
    };

    const filtered = teachers.filter(t => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return Object.values(t.data || {}).some(v => String(v).toLowerCase().includes(q));
    });

    // Add/Edit Form
    if (showForm) {
        return (
            <div className="teachers-list">
                <div className="form-panel">
                    <h3>{editingId ? '✏️ Edit Teacher' : '➕ Add Teacher'}</h3>

                    <div className="photo-upload-area">
                        {photoUrl ? (
                            <img src={photoUrl} alt="Teacher" className="teacher-photo-preview" />
                        ) : (
                            <div className="photo-placeholder-sm">📷</div>
                        )}
                        <label className="upload-label">
                            <input type="file" accept="image/*" onChange={handlePhotoUpload} hidden />
                            Choose Photo
                        </label>
                    </div>

                    <div className="form-grid">
                        {DEFAULT_FIELDS.map(field => (
                            <div key={field.id} className={`form-field ${field.type === 'textarea' ? 'full-width' : ''}`}>
                                <label>{field.label}{field.required && ' *'}</label>
                                {field.type === 'textarea' ? (
                                    <textarea
                                        value={formData[field.id] || ''}
                                        onChange={e => setFormData(p => ({ ...p, [field.id]: e.target.value }))}
                                        className="input-field"
                                        rows={3}
                                    />
                                ) : (
                                    <input
                                        type={field.type}
                                        value={formData[field.id] || ''}
                                        onChange={e => setFormData(p => ({ ...p, [field.id]: e.target.value }))}
                                        className="input-field"
                                    />
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="form-actions">
                        <button className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                        <button className="btn-primary" onClick={handleSave} disabled={saving}>
                            <SaveIcon size={16} /> {saving ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="teachers-list">
            <div className="list-header">
                <h2>👩‍🏫 Teachers Directory</h2>
                <div className="list-controls">
                    <div className="search-box">
                        <SearchIcon size={16} />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            placeholder="Search teachers..."
                            className="input-field"
                        />
                    </div>
                    <button className="btn-primary" onClick={handleAdd}>
                        <PlusIcon size={16} /> Add Teacher
                    </button>
                </div>
            </div>

            {filtered.length === 0 ? (
                <div className="empty-state">
                    <p>{teachers.length === 0 ? '👆 Add your first teacher' : 'No teachers match your search'}</p>
                </div>
            ) : (
                <div className="teachers-grid">
                    {filtered.map(teacher => (
                        <div key={teacher.id} className="teacher-card">
                            <div className="card-photo">
                                {teacher.photoUrl ? (
                                    <img src={teacher.photoUrl} alt={teacher.data?.name} />
                                ) : (
                                    <div className="card-photo-placeholder">👤</div>
                                )}
                            </div>
                            <div className="card-info">
                                <h4>{teacher.data?.name || 'Unknown'} <span className="teacher-code-badge">{teacher.data?.teacherCode}</span></h4>
                                <p className="card-designation">{teacher.data?.designation || 'Teacher'}</p>
                                {teacher.data?.subject && <p className="card-subject">📚 {teacher.data.subject}</p>}
                                {teacher.data?.mobile && <p className="card-mobile">📱 {teacher.data.mobile}</p>}
                                {teacher.data?.qualification && <p className="card-qual">🎓 {teacher.data.qualification}</p>}
                            </div>
                            <div className="card-actions">
                                <button className="btn-icon-sm" onClick={() => handleEdit(teacher)} title="Edit">
                                    <EditIcon size={16} />
                                </button>
                                <button className="btn-icon-sm danger" onClick={() => handleDelete(teacher.id)} title="Delete">
                                    <TrashIcon size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <div className="list-footer">
                <span>{filtered.length} teacher{filtered.length !== 1 ? 's' : ''}</span>
            </div>
        </div>
    );
}
