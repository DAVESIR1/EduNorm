import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Save, Check, ScanLine } from 'lucide-react';
import SmartFormScanner from '../Features/SmartFormScanner';
import DataStep from './DataStep';
import { DATA_FIELDS } from '../../features/StudentManagement/types';
import './StepWizard.css';

// Define all 43 data fields + Document Vault grouped into 5 steps


export default function StepWizard({
    onSave,
    initialData = {},
    selectedStandard,
    customFields = [],
    onCancel
}) {
    const [currentStep, setCurrentStep] = useState(1);
    const [formData, setFormData] = useState(initialData);
    const [saving, setSaving] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [showScanner, setShowScanner] = useState(false);

    const handleSmartScan = (scannedData) => {
        setFormData(prev => ({ ...prev, ...scannedData }));
        setShowScanner(false);
    };

    // Update form data when initialData changes (e.g. selecting different student)
    React.useEffect(() => {
        setFormData(initialData);
    }, [initialData]);

    const totalSteps = DATA_FIELDS.length + (customFields.length > 0 ? 1 : 0);
    const currentStepData = DATA_FIELDS.find(s => s.step === currentStep);

    // Add custom fields as extra step
    const customStep = customFields.length > 0 ? {
        step: DATA_FIELDS.length + 1,
        title: 'Custom Fields',
        icon: '✨',
        fields: customFields.map(f => ({
            key: `custom_${f.id}`,
            label: f.name,
            type: f.type || 'text',
            placeholder: `Enter ${f.name}`
        }))
    } : null;

    const activeStepData = currentStep <= DATA_FIELDS.length
        ? currentStepData
        : customStep;

    const handleFieldChange = (key, value) => {
        setFormData(prev => ({ ...prev, [key]: value }));
    };

    const handleNext = () => {
        // Validation Logic
        const currentFields = activeStepData?.fields || [];
        const missingFields = currentFields.filter(field => {
            if (field.required && !formData[field.key]) {
                return true;
            }
            return false;
        });

        if (missingFields.length > 0) {
            alert(`Please fill in required fields: ${missingFields.map(f => f.label).join(', ')}`);
            return;
        }

        if (currentStep < totalSteps) {
            setCurrentStep(prev => prev + 1);
        }
    };

    const handlePrev = () => {
        if (currentStep > 1) {
            setCurrentStep(prev => prev - 1);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await onSave({
                ...formData,
                standard: selectedStandard
            });
            setShowSuccess(true);
            setTimeout(() => {
                setShowSuccess(false);
                setFormData({});
                setCurrentStep(1);
            }, 2000);
        } catch (error) {
            console.error('Failed to save:', error);
        } finally {
            setSaving(false);
        }
    };

    const progress = (currentStep / totalSteps) * 100;

    return (
        <div className="step-wizard">
            <SmartFormScanner
                isOpen={showScanner}
                onClose={() => setShowScanner(false)}
                onDataExtracted={handleSmartScan}
            />
            {/* Header with progress */}
            <div className="wizard-header">
                <div className="wizard-title">
                    <span className="wizard-icon animate-bounce">{activeStepData?.icon}</span>
                    <div>
                        <h2 className="display-font gradient-text">{activeStepData?.title}</h2>
                        <p className="wizard-subtitle">Step {currentStep} of {totalSteps}</p>
                    </div>
                </div>

                <button
                    className="btn btn-sm btn-outline-primary"
                    onClick={() => setShowScanner(true)}
                    style={{ marginLeft: 'auto', marginRight: '10px', display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px' }}
                >
                    <ScanLine size={16} /> Auto-Fill Form
                </button>


                <div className="wizard-progress">
                    <div className="progress-bar">
                        <div
                            className="progress-fill"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                    <span className="progress-text">{Math.round(progress)}% Complete</span>
                </div>
            </div>

            {/* Step indicators */}
            <div className="step-indicator">
                {[...Array(totalSteps)].map((_, i) => (
                    <div
                        key={i}
                        className={`step-dot ${i + 1 === currentStep ? 'active' : ''} ${i + 1 < currentStep ? 'completed' : ''}`}
                        onClick={() => setCurrentStep(i + 1)}
                    />
                ))}
            </div>

            {/* Form fields */}
            <div className="wizard-content">
                {activeStepData && (
                    <DataStep
                        fields={activeStepData.fields}
                        formData={formData}
                        onChange={handleFieldChange}
                    />
                )}
            </div>

            {/* Navigation buttons */}
            <div className="wizard-footer">
                <button
                    className="btn btn-outline"
                    onClick={handlePrev}
                    disabled={currentStep === 1}
                >
                    <ChevronLeft size={20} />
                    Previous
                </button>

                <div className="wizard-actions">
                    {onCancel && (
                        <button className="btn btn-ghost" onClick={onCancel}>
                            Cancel
                        </button>
                    )}

                    {currentStep < totalSteps ? (
                        <button className="btn btn-primary btn-lg" onClick={handleNext}>
                            Save & Next
                            <ChevronRight size={20} />
                        </button>
                    ) : (
                        <button
                            className="btn btn-accent btn-lg"
                            onClick={handleSave}
                            disabled={saving}
                        >
                            {saving ? (
                                <>Saving...</>
                            ) : showSuccess ? (
                                <>
                                    <Check size={20} />
                                    Saved!
                                </>
                            ) : (
                                <>
                                    <Save size={20} />
                                    Save Student
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>

            {/* Success overlay */}
            {showSuccess && (
                <div className="success-overlay animate-fade-in">
                    <div className="success-content">
                        <div className="success-icon animate-bounce">✅</div>
                        <h3 className="display-font">Student Saved!</h3>
                        <p>Data has been saved successfully</p>
                    </div>
                </div>
            )}
        </div>
    );
}
