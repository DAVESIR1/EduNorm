import React, { useState, useEffect } from 'react';
import { useMenu } from '../../contexts/MenuContext';
import * as db from '../../services/database';
import { SaveIcon, EditIcon, PrinterIcon, PlusIcon, TrashIcon } from '../Icons/CustomIcons';
import './CustomWindowCreator.css';

export default function CustomWindowCreator({ menuId, onSave, onCancel }) {
    const { addCustomWindow } = useMenu();
    const [windowName, setWindowName] = useState('');
    const [fields, setFields] = useState([
        { id: 1, name: '', value: '' }
    ]);
    const [saving, setSaving] = useState(false);

    const handleAddField = () => {
        setFields(prev => [
            ...prev,
            { id: Date.now(), name: '', value: '' }
        ]);
    };

    const handleRemoveField = (id) => {
        if (fields.length <= 1) return;
        setFields(prev => prev.filter(f => f.id !== id));
    };

    const handleFieldChange = (id, key, value) => {
        setFields(prev => prev.map(f =>
            f.id === id ? { ...f, [key]: value } : f
        ));
    };

    const handleSave = async () => {
        if (!windowName.trim()) {
            alert('Please enter a window name');
            return;
        }

        if (!fields.some(f => f.name.trim())) {
            alert('Please add at least one field with a name');
            return;
        }

        setSaving(true);
        try {
            const windowData = {
                name: windowName,
                icon: 'fileText',
                fields: fields.filter(f => f.name.trim()),
                createdAt: Date.now()
            };

            // Add to menu context
            addCustomWindow(menuId, windowData);

            // Save to database
            const existingWindows = await db.getSetting('custom_windows') || {};
            existingWindows[menuId] = existingWindows[menuId] || [];
            existingWindows[menuId].push(windowData);
            await db.setSetting('custom_windows', existingWindows);

            alert('Custom window created successfully!');
            if (onSave) onSave(windowData);
        } catch (error) {
            console.error('Failed to save custom window:', error);
            alert('Failed to create window. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="custom-window-creator">
            <div className="creator-header">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                    <div>
                        <h2>🪟 Create Custom Window</h2>
                        <p>Create your own data collection window with custom fields</p>
                    </div>
                </div>
            </div>

            {/* Window Name */}
            <div className="form-group">
                <label>Window / Menu Name</label>
                <input
                    type="text"
                    value={windowName}
                    onChange={(e) => setWindowName(e.target.value)}
                    placeholder="e.g., Equipment Inventory, Staff Records..."
                    className="input-field"
                />
            </div>

            {/* Fields */}
            <div className="fields-section">
                <h3>Data Fields</h3>
                <div className="fields-list">
                    {fields.map((field, index) => (
                        <div key={field.id} className="field-row">
                            <span className="field-number">{index + 1}</span>
                            <input
                                type="text"
                                value={field.name}
                                onChange={(e) => handleFieldChange(field.id, 'name', e.target.value)}
                                placeholder="Field Name (e.g., Item Name)"
                                className="input-field field-name"
                            />
                            <input
                                type="text"
                                value={field.value}
                                onChange={(e) => handleFieldChange(field.id, 'value', e.target.value)}
                                placeholder="Default Value (optional)"
                                className="input-field field-value"
                            />
                            <button
                                className="remove-field-btn"
                                onClick={() => handleRemoveField(field.id)}
                                disabled={fields.length <= 1}
                            >
                                <TrashIcon size={16} />
                            </button>
                        </div>
                    ))}
                </div>

                <button className="add-field-btn" onClick={handleAddField}>
                    <PlusIcon size={18} />
                    Add More Fields
                </button>
            </div>

            {/* Actions */}
            <div className="creator-actions">
                <button
                    className="btn-secondary"
                    onClick={onCancel}
                >
                    Cancel
                </button>
                <button
                    className="btn-primary"
                    onClick={handleSave}
                    disabled={saving}
                >
                    <SaveIcon size={18} />
                    {saving ? 'Creating...' : 'Create Window'}
                </button>
            </div>
        </div>
    );
}

// Component to view/edit a custom window's data
export function CustomWindowView({ window, menuId }) {
    const [data, setData] = useState({});
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadData();
    }, [window.id]);

    const loadData = async () => {
        const saved = await db.getSetting(`custom_window_${window.id}`);
        if (saved) setData(saved);
    };

    const handleChange = (fieldId, value) => {
        setData(prev => ({ ...prev, [fieldId]: value }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await db.setSetting(`custom_window_${window.id}`, {
                ...data,
                updatedAt: Date.now()
            });
            setEditing(false);
            alert('Saved successfully!');
        } catch (error) {
            console.error('Failed to save:', error);
            alert('Failed to save');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="custom-window-view">
            <div className="window-header">
                <h2>{window.name}</h2>
                <div className="window-actions" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {editing ? (
                        <>
                            <button className="btn-primary" onClick={handleSave} disabled={saving}>
                                <SaveIcon size={18} />
                                {saving ? 'Saving...' : 'Save'}
                            </button>
                            <button className="btn-secondary" onClick={() => setEditing(false)}>
                                Cancel
                            </button>
                        </>
                    ) : (
                        <>
                            <button className="btn-secondary" onClick={() => setEditing(true)}>
                                <EditIcon size={18} />
                                Edit
                            </button>
                            <button className="btn-secondary" onClick={() => window.print()}>
                                <PrinterIcon size={18} />
                                Print
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="window-fields">
                {window.fields?.map(field => (
                    <div key={field.id} className="field-item">
                        <label>{field.name}</label>
                        {editing ? (
                            <input
                                type="text"
                                value={data[field.id] || field.value || ''}
                                onChange={(e) => handleChange(field.id, e.target.value)}
                                className="input-field"
                            />
                        ) : (
                            <div className="field-display">
                                {data[field.id] || field.value || <span className="empty">Not set</span>}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
