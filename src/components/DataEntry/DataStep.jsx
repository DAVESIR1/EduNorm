import React from 'react';
import InputField from './InputField';
import './DataStep.css';

export default function DataStep({ fields, formData, onChange }) {
    return (
        <div className="data-step">
            <div className="fields-grid">
                {fields.map((field, index) => (
                    <div
                        key={field.key}
                        className={`field-wrapper animate-slide-up`}
                        style={{ animationDelay: `${index * 50}ms` }}
                    >
                        <InputField
                            field={field}
                            value={formData[field.key] || ''}
                            onChange={(value) => onChange(field.key, value)}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}
