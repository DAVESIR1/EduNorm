import React, { useState, useRef } from 'react';
import { Upload, Image, X, Plus, File, Eye, Download } from 'lucide-react';
import OcrCamera from '../Common/OcrCamera';
import './InputField.css';

export default function InputField({ field, value, onChange }) {
    const [isFocused, setIsFocused] = useState(false);
    const [preview, setPreview] = useState(null);
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result);
                onChange(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const clearFile = () => {
        setPreview(null);
        onChange('');
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // Handle multiple document uploads
    const handleDocumentsChange = (e) => {
        const files = Array.from(e.target.files);
        const currentDocs = value || [];

        files.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const newDoc = {
                    id: Date.now() + Math.random(),
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    data: reader.result,
                    uploadedAt: new Date().toISOString()
                };
                onChange([...currentDocs, newDoc]);
            };
            reader.readAsDataURL(file);
        });
    };

    const removeDocument = (docId) => {
        const currentDocs = value || [];
        onChange(currentDocs.filter(d => d.id !== docId));
    };

    // Render documents vault (multiple file upload)
    if (field.type === 'documents') {
        const documents = value || [];
        return (
            <div className={`input-group documents-vault ${isFocused ? 'focused' : ''}`}>
                <label className="input-label">
                    <File size={16} />
                    {field.label}
                    <span className="doc-count badge badge-info">{documents.length} files</span>
                </label>

                <div className="documents-list">
                    {documents.map((doc, index) => (
                        <div key={doc.id || index} className="document-item">
                            <span className="doc-icon">📄</span>
                            <span className="doc-name">{doc.name}</span>
                            <span className="doc-size">{(doc.size / 1024).toFixed(1)} KB</span>
                            <button
                                type="button"
                                className="doc-action-btn view"
                                onClick={() => window.open(doc.data, '_blank')}
                                title="View"
                            >
                                <Eye size={14} />
                            </button>
                            <button
                                type="button"
                                className="doc-action-btn remove"
                                onClick={() => removeDocument(doc.id)}
                                title="Remove"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    ))}
                </div>

                <label className="upload-more-btn">
                    <input
                        type="file"
                        multiple
                        onChange={handleDocumentsChange}
                        className="file-input"
                    />
                    <Plus size={18} />
                    Add Documents
                </label>
            </div>
        );
    }

    // Render file input (single image)
    if (field.type === 'file') {
        return (
            <div className={`input-group ${isFocused ? 'focused' : ''}`}>
                <label className="input-label">
                    <Image size={16} />
                    {field.label}
                </label>

                <div className="file-upload-area">
                    {(preview || value) ? (
                        <div className="file-preview">
                            <img src={preview || value} alt="Preview" className="preview-image" />
                            <button type="button" className="clear-btn" onClick={clearFile}>
                                <X size={16} />
                            </button>
                        </div>
                    ) : (
                        <label className="upload-label">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept={field.accept || '*'}
                                onChange={handleFileChange}
                                className="file-input"
                            />
                            <Upload size={24} />
                            <span>Click to upload</span>
                        </label>
                    )}
                </div>
            </div>
        );
    }

    // Render select
    if (field.type === 'select') {
        return (
            <div className={`input-group ${isFocused ? 'focused' : ''}`}>
                <label className="input-label">{field.label}</label>
                <select
                    className="input-field"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                >
                    <option value="">Select...</option>
                    {field.options?.map(opt => (
                        <option key={opt} value={opt}>{opt}</option>
                    ))}
                </select>
            </div>
        );
    }

    // Helper to determine parsing type
    const getParsingType = () => {
        if (field.parsingType) return field.parsingType; // Manual override
        const label = (field.label || '').toLowerCase();
        const name = (field.name || '').toLowerCase();
        const type = (field.type || '').toLowerCase();

        if (name.includes('aadhaar') || label.includes('aadhaar')) return 'aadhaar';
        if (name.includes('pan') || label.includes('pan')) return 'pan';
        if (type === 'date' || name.includes('date') || label.includes('date') || name.includes('dob')) return 'date';
        if (type === 'number' || name.includes('mobile') || name.includes('phone') || name.includes('pin') || label.includes('mobile')) return 'number';
        if (name.includes('name') || label.includes('name')) return 'name';

        return ''; // Default text
    };

    const parsingType = getParsingType();

    // Render textarea
    if (field.type === 'textarea') {
        return (
            <div className={`input-group ${isFocused ? 'focused' : ''}`}>
                <label className="input-label">
                    {field.label}
                    <OcrCamera
                        onResult={(text) => onChange(value ? value + '\n' + text : text)}
                        label={field.label}
                        parsingType={parsingType}
                    />
                </label>
                <textarea
                    className="input-field textarea"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholder={field.placeholder}
                    rows={3}
                />
            </div>
        );
    }

    // Render standard input
    // We add AI Camera to text, number, date inputs
    const isTextLike = !field.type || ['text', 'number', 'date', 'email', 'tel'].includes(field.type);

    return (
        <div className={`input-group ${isFocused ? 'focused' : ''}`}>
            <label className="input-label">
                {field.label}
                {isTextLike && (
                    <OcrCamera
                        onResult={(text) => onChange(text)}
                        label={field.label}
                        parsingType={parsingType}
                    />
                )}
            </label>
            <input
                type={field.type || 'text'}
                className="input-field"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder={field.placeholder}
            />
        </div>
    );
}
