import React, { useState, useEffect } from 'react';
import * as db from '../../services/database';

/**
 * Correction Request Component
 * Students can flag incorrect data and submit correction requests
 * - Shows current data in red (wrong)
 * - Provides green input for correct data
 * - Sends request to HOI for approval
 */
export default function CorrectionRequest({ studentData, onBack }) {
    const [requests, setRequests] = useState([]);
    const [submitted, setSubmitted] = useState(false);
    const [existingRequests, setExistingRequests] = useState([]);

    // Fields that students can request corrections for
    const correctableFields = [
        { key: 'name', label: 'Full Name', value: studentData?.name || studentData?.nameEnglish },
        { key: 'nameLocal', label: 'Name (Local Language)', value: studentData?.nameLocal || studentData?.nameGujarati },
        { key: 'dateOfBirth', label: 'Date of Birth', value: studentData?.dateOfBirth },
        { key: 'fatherName', label: "Father's Name", value: studentData?.fatherName },
        { key: 'motherName', label: "Mother's Name", value: studentData?.motherName },
        { key: 'contactNumber', label: 'Contact Number', value: studentData?.contactNumber },
        { key: 'email', label: 'Email', value: studentData?.email },
        { key: 'address', label: 'Address', value: studentData?.address },
        { key: 'bloodGroup', label: 'Blood Group', value: studentData?.bloodGroup },
        { key: 'nationality', label: 'Nationality', value: studentData?.nationality },
        { key: 'religion', label: 'Religion', value: studentData?.religion },
        { key: 'category', label: 'Category', value: studentData?.category },
        { key: 'aadharNo', label: 'Aadhaar Number', value: studentData?.aadharNo || studentData?.aadhaarNo },
    ].filter(f => f.value); // Only show fields that have data

    // Load existing correction requests
    useEffect(() => {
        const loadRequests = async () => {
            try {
                const stored = await db.getSetting(`correction_requests_${studentData?.id}`);
                if (stored) {
                    setExistingRequests(Array.isArray(stored) ? stored : []);
                }
            } catch (e) {
                console.warn('Failed to load correction requests:', e);
            }
        };
        if (studentData?.id) loadRequests();
    }, [studentData?.id]);

    const toggleField = (key) => {
        setRequests(prev => {
            const existing = prev.find(r => r.fieldKey === key);
            if (existing) {
                return prev.filter(r => r.fieldKey !== key);
            }
            return [...prev, { fieldKey: key, correctedValue: '' }];
        });
    };

    const updateCorrectedValue = (key, value) => {
        setRequests(prev =>
            prev.map(r => r.fieldKey === key ? { ...r, correctedValue: value } : r)
        );
    };

    const handleSubmit = async () => {
        const validRequests = requests.filter(r => r.correctedValue.trim());
        if (validRequests.length === 0) {
            alert('Please select at least one field and enter the correct information.');
            return;
        }

        const correctionData = validRequests.map(r => {
            const field = correctableFields.find(f => f.key === r.fieldKey);
            return {
                fieldKey: r.fieldKey,
                fieldLabel: field?.label,
                currentValue: field?.value,
                correctedValue: r.correctedValue.trim(),
                status: 'pending', // pending, approved, rejected
                submittedAt: new Date().toISOString(),
                studentId: studentData?.id,
                studentName: studentData?.name || studentData?.nameEnglish,
            };
        });

        try {
            // Save to database for HOI to review
            const allRequests = [...existingRequests, ...correctionData];
            await db.updateSetting(`correction_requests_${studentData.id}`, allRequests);

            // Also save to a global correction queue
            const globalQueue = (await db.getSetting('correction_request_queue')) || [];
            await db.updateSetting('correction_request_queue', [...globalQueue, ...correctionData]);

            setSubmitted(true);
            setExistingRequests(allRequests);
        } catch (err) {
            alert('Failed to submit correction request. Please try again.');
            console.error('CorrectionRequest submit error:', err);
        }
    };

    if (!studentData) {
        return (
            <div style={{ padding: '20px', textAlign: 'center' }}>
                <p>Please login first to submit correction requests.</p>
                {onBack && <button className="btn btn-ghost" onClick={onBack}>← Back</button>}
            </div>
        );
    }

    if (submitted) {
        return (
            <div style={{ padding: '20px', maxWidth: '500px', margin: '0 auto', textAlign: 'center' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
                <h3>Correction Request Submitted!</h3>
                <p style={{ color: 'var(--gray-600)', marginTop: '8px' }}>
                    Your request has been sent to the HOI for review. You'll be notified once it's approved.
                </p>
                <button className="btn btn-primary" style={{ marginTop: '16px' }}
                    onClick={() => { setSubmitted(false); setRequests([]); }}>
                    Submit Another
                </button>
            </div>
        );
    }

    return (
        <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
            <h2 style={{ fontSize: '1.3rem', marginBottom: '4px' }}>📝 Data Correction Request</h2>
            <p style={{ color: 'var(--gray-600)', fontSize: '0.85rem', marginBottom: '16px' }}>
                Select incorrect fields, enter the correct information, and submit for HOI approval.
            </p>

            {/* Existing pending requests */}
            {existingRequests.filter(r => r.status === 'pending').length > 0 && (
                <div style={{
                    background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '10px',
                    padding: '12px', marginBottom: '16px', fontSize: '13px', color: '#c2410c'
                }}>
                    ⏳ You have {existingRequests.filter(r => r.status === 'pending').length} pending correction request(s)
                </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {correctableFields.map(field => {
                    const isSelected = requests.some(r => r.fieldKey === field.key);
                    const request = requests.find(r => r.fieldKey === field.key);

                    return (
                        <div key={field.key} style={{
                            border: `1.5px solid ${isSelected ? '#ef4444' : 'var(--border-color, #e2e8f0)'}`,
                            borderRadius: '12px', padding: '12px', transition: 'all 0.2s',
                            background: isSelected ? '#fef2f2' : 'var(--bg-secondary, #f8fafc)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div>
                                    <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--gray-500)', textTransform: 'uppercase' }}>
                                        {field.label}
                                    </span>
                                    <div style={{
                                        fontSize: '14px', fontWeight: 600, marginTop: '2px',
                                        color: isSelected ? '#dc2626' : 'var(--text-primary)',
                                        textDecoration: isSelected ? 'line-through' : 'none'
                                    }}>
                                        {field.value}
                                    </div>
                                </div>
                                <button
                                    className={`btn btn-sm ${isSelected ? 'btn-danger' : 'btn-outline'}`}
                                    style={{ fontSize: '11px', padding: '4px 10px' }}
                                    onClick={() => toggleField(field.key)}
                                >
                                    {isSelected ? '✕ Remove' : '⚠️ Wrong'}
                                </button>
                            </div>

                            {isSelected && (
                                <div style={{ marginTop: '8px' }}>
                                    <input
                                        type="text"
                                        className="input-field"
                                        placeholder="Enter correct information"
                                        value={request?.correctedValue || ''}
                                        onChange={(e) => updateCorrectedValue(field.key, e.target.value)}
                                        style={{
                                            width: '100%', padding: '8px 12px', fontSize: '14px',
                                            borderRadius: '8px', border: '1.5px solid #22c55e',
                                            background: '#f0fdf4', color: '#15803d', fontWeight: 600
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {requests.length > 0 && (
                <button className="btn btn-primary btn-lg"
                    style={{ width: '100%', marginTop: '16px' }}
                    onClick={handleSubmit}
                    disabled={requests.filter(r => r.correctedValue?.trim()).length === 0}
                >
                    📤 Submit Correction Request ({requests.filter(r => r.correctedValue?.trim()).length} field{requests.filter(r => r.correctedValue?.trim()).length !== 1 ? 's' : ''})
                </button>
            )}

            {onBack && (
                <button className="btn btn-ghost" style={{ width: '100%', marginTop: '8px' }} onClick={onBack}>
                    ← Back
                </button>
            )}
        </div>
    );
}
