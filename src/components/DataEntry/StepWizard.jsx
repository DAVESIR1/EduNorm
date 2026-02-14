import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Save, Check, ScanLine } from 'lucide-react';
import SmartFormScanner from '../Features/SmartFormScanner';
import DataStep from './DataStep';
import './StepWizard.css';

// Define all 43 data fields + Document Vault grouped into 5 steps
export const DATA_FIELDS = [
    // Step 1: Basic Information (9 fields)
    {
        step: 1,
        title: 'Basic Information',
        icon: '👤',
        fields: [
            { key: 'grNo', label: 'GR No.', type: 'text', placeholder: '4-8 digits (e.g. 2205)', required: true },
            { key: 'name', label: 'Name (Local)', type: 'text', placeholder: 'Student full name', required: true },
            { key: 'aaparIdNote', label: 'Aapar ID Note', type: 'text', placeholder: 'Aapar ID note' },
            { key: 'nameEnglish', label: 'Name in English', type: 'text', placeholder: 'Name in English', required: true },
            { key: 'udiasEnglishName', label: 'Udias English Name', type: 'text', placeholder: 'Udias English name' },
            { key: 'studentFirstName', label: 'Student First Name', type: 'text', placeholder: 'First name', required: true },
            { key: 'studentMiddleName', label: 'Student Middle Name (Father)', type: 'text', placeholder: 'Father name' },
            { key: 'studentLastName', label: 'Student Last Name (Surname)', type: 'text', placeholder: 'Surname', required: true },
            { key: 'cast', label: 'Cast', type: 'text', placeholder: 'Cast' },
        ]
    },
    // Step 2: Family Information (7 fields)
    {
        step: 2,
        title: 'Family Information',
        icon: '👨‍👩‍👧',
        fields: [
            { key: 'motherName', label: 'Mother Name', type: 'text', placeholder: 'Mother full name' },
            { key: 'fatherAadharName', label: 'Father Aadhar Name', type: 'text', placeholder: 'As on Aadhar' },
            { key: 'motherAadharName', label: 'Mother Aadhar Name', type: 'text', placeholder: 'As on Aadhar' },
            { key: 'fatherAadharNumber', label: 'Father Aadhar Number', type: 'text', placeholder: '12 digit Aadhar' },
            { key: 'motherAadharNumber', label: 'Mother Aadhar Number', type: 'text', placeholder: '12 digit Aadhar' },
            { key: 'contactNumber', label: 'Contact Number', type: 'tel', placeholder: 'Mobile number', required: true },
            { key: 'fatherMotherDeathNote', label: 'Father/Mother Death Note', type: 'text', placeholder: 'If applicable' },
        ]
    },
    // Step 3: Identification (10 fields)
    {
        step: 3,
        title: 'Identification',
        icon: '🪪',
        fields: [
            { key: 'studentBirthdate', label: 'Student Birthdate', type: 'date', placeholder: '', required: true },
            { key: 'studentAadharBirthdate', label: 'Student Aadhar Birthdate', type: 'date', placeholder: '' },
            { key: 'udiasNumber', label: 'Udias Number', type: 'text', placeholder: 'Udias number' },
            { key: 'aadharNumber', label: 'Aadhar Number', type: 'text', placeholder: '12 digit Aadhar', required: true },
            { key: 'studentAadharEnglishName', label: 'Student Aadhar English Name', type: 'text', placeholder: 'As on Aadhar' },
            { key: 'studentAadharGujaratiName', label: 'Student Aadhar Gujarati Name', type: 'text', placeholder: 'As on Aadhar' },
            { key: 'penNumber', label: 'Pen Number', type: 'text', placeholder: 'PEN' },
            { key: 'aaparNumber', label: 'Aapar Number', type: 'text', placeholder: 'Aapar number' },
        ]
    },
    // Step 4: Banking & Ration (8 fields)
    {
        step: 4,
        title: 'Banking & Ration',
        icon: '🏦',
        fields: [
            { key: 'bankAcNo', label: 'Bank Ac. No.', type: 'text', placeholder: 'Account number' },
            { key: 'nameInBankAc', label: 'Name in Bank Ac.', type: 'text', placeholder: 'As on passbook' },
            { key: 'bankBranchName', label: 'Bank Branch Name', type: 'text', placeholder: 'Branch name' },
            { key: 'bankIfscCode', label: 'Bank IFSC Code', type: 'text', placeholder: 'IFSC code' },
            { key: 'rationCardNumber', label: 'Ration Card Number', type: 'text', placeholder: 'Ration card no.' },
            { key: 'rationCardKycStatus', label: 'Ration Card KYC Status', type: 'select', options: ['Pending', 'Completed', 'Not Applicable'] },
            { key: 'studentRationNumber', label: 'Student Ration Number', type: 'text', placeholder: 'Student ration no.' },
            { key: 'rationCardType', label: 'Ration Card Type', type: 'select', options: ['APL', 'BPL', 'AAY', 'Other'] },
        ]
    },
    // Step 5: Additional Info & Documents (15 fields - including 4 new admission/leaving fields)
    {
        step: 5,
        title: 'Additional & Documents',
        icon: '📝',
        fields: [
            { key: 'address', label: 'Address', type: 'textarea', placeholder: 'Complete address' },
            { key: 'birthPlace', label: 'Birth Place', type: 'text', placeholder: 'Place of birth' },
            { key: 'birthTaluka', label: 'Birth Taluka', type: 'text', placeholder: 'Taluka' },
            { key: 'birthDistrict', label: 'Birth District', type: 'text', placeholder: 'District' },
            { key: 'weight', label: 'Weight (kg)', type: 'number', placeholder: 'Weight in kg' },
            { key: 'height', label: 'Height (cm)', type: 'number', placeholder: 'Height in cm' },
            { key: 'pastYearAttendance', label: 'Past Year Attendance (%)', type: 'number', placeholder: 'Attendance %' },
            { key: 'pastYearExamMarks', label: 'Past Year Exam Marks', type: 'text', placeholder: 'Total marks' },
            { key: 'pastYearPercentage', label: 'Past Year %', type: 'number', placeholder: '%' },
            { key: 'schoolAdmitDate', label: 'School Admit Date', type: 'date', placeholder: '' },
            { key: 'classAdmitDate', label: 'Class/Standard Admit Date', type: 'date', placeholder: '' },
            { key: 'schoolLeaveDate', label: 'School Leave Date', type: 'date', placeholder: '' },
            { key: 'schoolLeaveNote', label: 'School Leave Note', type: 'textarea', placeholder: 'Reason for leaving' },
            { key: 'studentPhoto', label: 'Student Photo', type: 'file', accept: 'image/*' },
            { key: 'studentDocuments', label: 'Student Documents Vault', type: 'documents', placeholder: 'Upload documents' },
        ]
    }
];

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
                    style={{ marginLeft: 'auto', marginRight: '20px', display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px' }}
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
