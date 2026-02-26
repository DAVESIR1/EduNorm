import React from 'react';
import './TemplateSelector.css';

const TEMPLATES = [
    { id: 'classic', name: 'Classic Elegant', emoji: '📜', color: '#D4B5FF' },
    { id: 'modern', name: 'Modern Minimal', emoji: '✨', color: '#B5D4FF' },
    { id: 'colorful', name: 'Colorful Fun', emoji: '🌈', color: '#FFB5C5' },
    { id: 'professional', name: 'Professional', emoji: '💼', color: '#B5F5D8' },
    { id: 'vintage', name: 'Vintage Certificate', emoji: '🏆', color: '#FFD4B5' },
    { id: 'nature', name: 'Nature Theme', emoji: '🌿', color: '#98E8C0' },
    { id: 'space', name: 'Space Theme', emoji: '🚀', color: '#1a1a2e' },
    { id: 'rainbow', name: 'Rainbow Gradient', emoji: '🎨', color: '#FFB5B5' },
    { id: 'clouds', name: 'Soft Clouds', emoji: '☁️', color: '#E8D4FF' },
    { id: 'geometric', name: 'Geometric Modern', emoji: '🔷', color: '#98C0E8' },
];

export default function TemplateSelector({ selected, onSelect }) {
    return (
        <div className="template-selector-dropdown no-print">
            <label className="selector-label">🎨 Template:</label>
            <select
                className="input-field template-dropdown"
                value={selected}
                onChange={(e) => onSelect(e.target.value)}
            >
                {TEMPLATES.map(template => (
                    <option key={template.id} value={template.id}>
                        {template.emoji} {template.name}
                    </option>
                ))}
            </select>
        </div>
    );
}

export { TEMPLATES };
