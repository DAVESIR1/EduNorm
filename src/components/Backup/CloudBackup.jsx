import React, { useState, useEffect } from 'react';
import { X, Cloud, Upload, Download, CheckCircle, AlertCircle, Loader, History } from 'lucide-react';
import { backupToCloud, restoreFromCloud, checkBackupExists, getProviderInfo, getCurrentProvider } from '../../services/HybridStorageService';
import { useAuth } from '../../contexts/AuthContext';
import './CloudBackup.css';

import { uploadToMega } from '../../services/MegaBackupService';
import * as localDb from '../../services/database';

export default function CloudBackup({ isOpen, onClose, onRestoreComplete }) {
    const { user } = useAuth();
    const [status, setStatus] = useState('idle'); // idle, loading, success, error
    const [message, setMessage] = useState('');
    const [backupInfo, setBackupInfo] = useState(null);
    const [action, setAction] = useState('none'); // backup, restore

    useEffect(() => {
        if (isOpen) {
            checkExistingBackup();
            setStatus('idle');
            setMessage('');
        }
    }, [isOpen, user]);

    const checkExistingBackup = async () => {
        if (!user) return;
        try {
            const info = await checkBackupExists(user.uid);
            setBackupInfo(info);
        } catch (error) {
            console.error('Failed to check backup:', error);
        }
    };

    const handleBackup = async () => {
        if (!user) {
            setStatus('error');
            setMessage('Please login to backup data');
            return;
        }

        setAction('backup');
        setStatus('loading');
        setMessage('Encrypting and uploading data...');

        try {
            // Export all data
            const allData = await localDb.exportAllData();

            // Upload to Cloud
            const result = await backupToCloud(user.uid, allData);

            if (result.success) {
                setStatus('success');
                setMessage('Backup completed successfully!');
                checkExistingBackup(); // Refresh info
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Backup failed:', error);
            setStatus('error');
            setMessage(error.message || 'Backup failed');
        }
    };

    // NEW: Handle Mega Backup
    const handleMegaBackup = async () => {
        if (!user) {
            setStatus('error');
            setMessage('Please login to use analytics.');
            return;
        }

        setStatus('loading');
        setMessage('Connecting to Mega.nz Secure Cloud...');

        try {
            // 1. Gather Data
            const allData = await localDb.exportAllData();

            // 2. Get School Info (for folder naming)
            const schoolName = await localDb.getSetting('schoolName') || 'My_School';
            const schoolId = user.uid.slice(0, 6); // Use part of UID for uniqueness

            // 3. Upload
            setMessage(`Uploading to folder: ${schoolName}...`);
            const result = await uploadToMega(allData, schoolName, schoolId);

            if (result.success) {
                setStatus('success');
                setMessage(`Saved to Mega! Path: ${result.path}`);
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error('Mega Upload Failed:', error);
            if (error.message?.includes('megajs')) {
                setStatus('error');
                setMessage('Missing Dependency: Please run "npm install megajs"');
            } else {
                setStatus('error');
                setMessage('Mega Upload Failed: ' + error.message);
            }
        }
    };

    const handleRestore = async () => {
        console.log('CloudBackup: handleRestore called!', { user: !!user, backupInfo });

        if (!user) {
            alert('Please login to use cloud restore');
            setStatus('error');
            setMessage('Please login to use cloud restore');
            return;
        }

        if (!backupInfo?.exists) {
            alert('No backup found. Please create a backup first.');
            setStatus('error');
            setMessage('No backup found. Please create a backup first.');
            return;
        }

        // Skip confirmation - proceed directly with restore
        console.log('CloudBackup: Proceeding with restore...');

        setAction('restore');
        setStatus('loading');
        setMessage('Restoring your data...');

        try {
            console.log('CloudBackup: Calling restoreFromCloud...');
            const result = await restoreFromCloud(user.uid);
            console.log('CloudBackup: Restore result:', result);
            setStatus('success');
            setMessage(result.message + ' Auto-Syncing to Live Server...');

            // AUTO-RELAY to Live Server (Autonomous Sync)
            try {
                const { migrateToLiveServer } = await import('../../services/MigrationService');
                const migrationResult = await migrateToLiveServer();
                console.log('CloudBackup: Auto-Sync Success:', migrationResult);
                setMessage('Restore & Live Sync Complete! Reloading...');
            } catch (syncErr) {
                console.warn('CloudBackup: Auto-Sync Failed:', syncErr);

                // FALLBACK: If missing profile, ask user manually
                if (syncErr.message.includes('No School Profile') || syncErr.message.includes('configure school details')) {
                    const manualCode = prompt("Backup is missing School Code. Please enter it to finish Sync (e.g. 240...):");
                    if (manualCode) {
                        const manualName = prompt("Enter School Name:") || "My School";

                        try {
                            const db = await import('../../services/database');
                            await db.setSetting('school_profile', {
                                schoolName: manualName,
                                schoolCode: manualCode,
                                createdAt: new Date().toISOString()
                            });
                            setMessage('Saved School Details. Retrying Sync...');

                            // Retry Sync
                            const { migrateToLiveServer } = await import('../../services/MigrationService');
                            await migrateToLiveServer();
                            setMessage('Restore & Live Sync Complete! Reloading...');

                        } catch (retryErr) {
                            setMessage(`Sync Failed after manual entry: ${retryErr.message}`);
                            await new Promise(r => setTimeout(r, 4000));
                        }
                    } else {
                        setMessage(`Restore Complete but Sync Skipped (No Code).`);
                        await new Promise(r => setTimeout(r, 4000));
                    }
                } else {
                    // Show the ACTUAL error to the user so we can debug
                    setMessage(`Restore Complete but Sync Failed: ${syncErr.message}`);
                    await new Promise(r => setTimeout(r, 4000));
                }
            }

            // Reload the page
            window.location.reload();
        } catch (error) {
            console.error('CloudBackup: Restore error:', error);
            setStatus('error');
            setMessage(error.message || 'Restore failed');
        }
    };

    const formatDate = (date) => {
        if (!date) return 'Never';
        return new Date(date).toLocaleString('en-IN', {
            dateStyle: 'medium',
            timeStyle: 'short'
        });
    };

    if (!isOpen) return null;

    return (
        <div className="cloud-backup-overlay" onClick={onClose}>
            <div className="cloud-backup-modal" onClick={e => e.stopPropagation()}>
                <div className="cloud-backup-header">
                    <h2><Cloud size={24} /> Cloud Backup</h2>
                    <button className="close-btn" onClick={onClose}><X size={20} /></button>
                </div>

                <div className="cloud-backup-content">
                    {/* Status Display */}
                    {status === 'loading' && (
                        <div className="status-box loading">
                            <Loader size={40} className="spinner" />
                            <p>{message}</p>
                        </div>
                    )}

                    {status === 'success' && (
                        <div className="status-box success">
                            <CheckCircle size={40} />
                            <p>{message}</p>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="status-box error">
                            <AlertCircle size={40} />
                            <p>{message}</p>
                        </div>
                    )}

                    {/* Main Actions */}
                    {status === 'idle' && (
                        <>
                            <div className="backup-info">
                                <div className="info-card">
                                    <History size={20} />
                                    <div>
                                        <span className="label">Last Backup</span>
                                        <span className="value">
                                            {formatDate(backupInfo?.lastBackup)}
                                        </span>
                                    </div>
                                </div>
                                {backupInfo?.exists && (
                                    <div className="info-stats">
                                        <span>{backupInfo.studentCount || 0} Students</span>
                                        <span>{backupInfo.standardCount || 0} Classes</span>
                                    </div>
                                )}
                            </div>

                            <div className="action-buttons">
                                <button className="action-btn backup-btn" onClick={handleBackup}>
                                    <Upload size={22} />
                                    <div className="btn-text">
                                        <span className="btn-title">Firebase Backup</span>
                                        <span className="btn-desc">Fast • Encrypted</span>
                                    </div>
                                </button>

                                {/* Mega Backup Integration Removed - Now Automatic on Registration */}

                                <button
                                    className={`action-btn restore-btn ${!backupInfo?.exists ? 'disabled' : ''}`}
                                    onClick={handleRestore}
                                    disabled={!backupInfo?.exists}
                                >
                                    <Download size={22} />
                                    <div className="btn-text">
                                        <span className="btn-title">Restore</span>
                                        <span className="btn-desc">
                                            {backupInfo?.exists ? 'Get from Cloud' : 'No backup'}
                                        </span>
                                    </div>
                                </button>
                            </div>

                            <p className="cloud-note">
                                Your data is securely stored. Use <b>Mega.nz</b> for long-term folder-based storage.
                            </p>
                        </>
                    )}

                    {/* Reset button when done */}
                    {(status === 'success' || status === 'error') && (
                        <button
                            className="action-btn primary-btn"
                            onClick={() => setStatus('idle')}
                        >
                            Done
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
