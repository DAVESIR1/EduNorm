/**
 * SyncFailureModal.jsx
 *
 * Shown when sync cannot reach cloud. Guides user to restore from local JSON backup file.
 */

import React, { useState, useRef } from 'react';
import ServiceLayer from '../../services/ServiceLayer.js';
import './SyncFailureModal.css';

export default function SyncFailureModal({ onClose, onRestored }) {
    const [step, setStep] = useState('guide'); // guide | upload | success | error
    const [uploading, setUploading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [restoredCount, setRestoredCount] = useState(0);
    const fileInputRef = useRef(null);

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploading(true);
        setErrorMsg('');
        try {
            const text = await file.text();
            const data = JSON.parse(text);
            if (!data.students && !data.settings) throw new Error('Invalid backup file format');

            let count = 0;
            for (const student of (data.students || [])) {
                await ServiceLayer.saveStudent(student);
                count++;
            }
            const settings = data.settings || {};
            for (const [key, value] of Object.entries(settings)) {
                await ServiceLayer.saveSetting(key, value);
            }

            setRestoredCount(count);
            setStep('success');
        } catch (err) {
            setErrorMsg(err.message || 'File could not be restored. Please check the file.');
            setStep('error');
        }
        setUploading(false);
    };

    return (
        <div className="sfm-overlay">
            <div className="sfm-modal">
                {/* Header */}
                <div className="sfm-header">
                    <div className="sfm-icon">
                        {step === 'success' ? '✅' : step === 'error' ? '❌' : '⚠️'}
                    </div>
                    <div>
                        <h2 className="sfm-title">
                            {step === 'success' ? 'Data Restored!' :
                                step === 'error' ? 'Restore Failed' :
                                    'Sync Unavailable — Manual Restore'}
                        </h2>
                        <p className="sfm-subtitle">
                            {step === 'success'
                                ? `${restoredCount} records successfully restored from your backup file.`
                                : step === 'error'
                                    ? 'The file could not be read. Please try a different backup.'
                                    : 'Cloud sync is temporarily unreachable. Use a local backup file to restore your data.'}
                        </p>
                    </div>
                </div>

                {/* Success */}
                {step === 'success' && (
                    <div className="sfm-success-body">
                        <div className="sfm-success-icon">🎉</div>
                        <p>{restoredCount} students &amp; records are back.</p>
                        <p className="sfm-note">The app will reload to apply changes.</p>
                        <button
                            className="sfm-btn primary"
                            onClick={() => { onRestored?.(); setTimeout(() => window.location.reload(), 600); }}
                        >
                            Continue to App
                        </button>
                    </div>
                )}

                {/* Error */}
                {step === 'error' && (
                    <div className="sfm-error-body">
                        <p className="sfm-error-msg">{errorMsg}</p>
                        <div className="sfm-btn-row">
                            <button className="sfm-btn secondary" onClick={() => setStep('guide')}>
                                Try Again
                            </button>
                            <button className="sfm-btn ghost" onClick={onClose}>
                                Close
                            </button>
                        </div>
                    </div>
                )}

                {/* Main Guide */}
                {step === 'guide' && (
                    <>
                        <div className="sfm-steps">
                            <div className="sfm-step">
                                <div className="sfm-step-num">1</div>
                                <div className="sfm-step-content">
                                    <strong>Locate your backup file</strong>
                                    <p>Look for a file named <code>edunorm_backup_YYYY-MM-DD.json</code> in your Downloads folder or Google Drive → <em>EduNorm Backups</em> folder.</p>
                                </div>
                            </div>

                            <div className="sfm-step">
                                <div className="sfm-step-num">2</div>
                                <div className="sfm-step-content">
                                    <strong>Don't have a backup file?</strong>
                                    <p>Open Google Drive on another device → Find <em>EduNorm Backups → School_[code]</em> → Download <code>database.json</code></p>
                                </div>
                            </div>

                            <div className="sfm-step">
                                <div className="sfm-step-num">3</div>
                                <div className="sfm-step-content">
                                    <strong>Upload the file below</strong>
                                    <p>Click the button and select your backup file. Your data will be restored immediately.</p>
                                </div>
                            </div>
                        </div>

                        <div className="sfm-upload-zone">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".json"
                                hidden
                                onChange={handleFileUpload}
                            />
                            <button
                                className="sfm-btn primary"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploading}
                            >
                                {uploading ? (
                                    <><span className="sfm-spinner" /> Restoring...</>
                                ) : (
                                    <>📂 Choose Backup File (.json)</>
                                )}
                            </button>
                            <p className="sfm-upload-hint">Accepted: .json files exported from EduNorm</p>
                        </div>

                        <div className="sfm-footer">
                            <button className="sfm-btn ghost" onClick={onClose}>
                                I'll do this later
                            </button>
                            <p className="sfm-footer-note">
                                💡 Once sync is available again, your data will back up automatically.
                            </p>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
