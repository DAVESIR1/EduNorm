import React, { useState, useEffect } from 'react';
import { X, Cloud, Upload, Download, CheckCircle, AlertCircle, Loader, History } from 'lucide-react';
import { backupToCloud, restoreFromCloud, checkBackupExists, getProviderInfo, getCurrentProvider } from '../../services/HybridStorageService';
import { useAuth } from '../../contexts/AuthContext';
import './CloudBackup.css';

export default function CloudBackup({ isOpen, onClose, onRestoreComplete }) {
    const { user } = useAuth();
    const [status, setStatus] = useState('idle'); // idle, loading, success, error
    const [message, setMessage] = useState('');
    const [backupInfo, setBackupInfo] = useState(null);
    const [action, setAction] = useState(null); // 'backup' or 'restore'
    const [isChecking, setIsChecking] = useState(false);

    // Check backup status when modal opens - only once
    useEffect(() => {
        if (isOpen && user && !isChecking && backupInfo === null) {
            checkExistingBackup();
        }
        // Reset state when modal closes
        if (!isOpen) {
            setStatus('idle');
            setMessage('');
            setBackupInfo(null);
        }
    }, [isOpen, user]);

    const checkExistingBackup = async () => {
        if (isChecking) return;
        setIsChecking(true);
        try {
            const info = await checkBackupExists(user?.uid);
            console.log('Backup info:', info);
            setBackupInfo(info || { exists: false });
        } catch (error) {
            console.error('Failed to check backup:', error);
            setBackupInfo({ exists: false, error: error.message });
        } finally {
            setIsChecking(false);
        }
    };

    const handleBackup = async () => {
        if (!user) {
            setStatus('error');
            setMessage('Please login to use cloud backup');
            return;
        }

        setAction('backup');
        setStatus('loading');
        setMessage('Backing up your data to cloud...');

        // Set a timeout of 30 seconds for cloud backup
        const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('timeout')), 30000);
        });

        try {
            console.log('Starting backup for user:', user.uid);

            // Race between actual backup and timeout
            const result = await Promise.race([
                backupToCloud(user.uid),
                timeoutPromise
            ]);

            console.log('Backup result:', result);

            if (result && result.success) {
                setStatus('success');
                setMessage(result.message || 'Backup completed successfully!');
                // Refresh backup info after short delay
                setTimeout(() => {
                    setBackupInfo(null);
                    checkExistingBackup();
                }, 500);
            } else {
                setStatus('error');
                setMessage(result?.message || 'Backup failed');
            }
        } catch (error) {
            console.error('Backup error:', error);

            if (error.message === 'timeout') {
                // Timeout occurred - show local backup message with more detail
                setStatus('success');
                setMessage('Data saved locally. Cloud sync is taking longer than expected - it may complete in the background.');
            } else if (error.message?.includes('permission') || error.message?.includes('PERMISSION')) {
                setStatus('error');
                setMessage('Cloud backup failed: Permission denied. Please contact support.');
            } else if (error.message?.includes('not configured')) {
                setStatus('error');
                setMessage('Firebase is not configured properly. Please contact support.');
            } else {
                setStatus('error');
                setMessage(error.message || 'Backup failed. Please try again.');
            }
        }
    };

    const handleRestore = async () => {
        if (!user) {
            setStatus('error');
            setMessage('Please login to use cloud restore');
            return;
        }

        if (!backupInfo?.exists) {
            setStatus('error');
            setMessage('No backup found. Please create a backup first.');
            return;
        }

        const confirmed = window.confirm(
            'This will replace your current data with the backup. Are you sure?'
        );

        if (!confirmed) return;

        setAction('restore');
        setStatus('loading');
        setMessage('Restoring your data...');

        try {
            const result = await restoreFromCloud(user.uid);
            setStatus('success');
            setMessage(result.message);
            if (onRestoreComplete) {
                setTimeout(() => {
                    onRestoreComplete();
                }, 1000);
            }
        } catch (error) {
            setStatus('error');
            setMessage(error.message);
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
                                    <Upload size={28} />
                                    <span className="btn-title">Backup to Cloud</span>
                                    <span className="btn-desc">Save all data securely</span>
                                </button>

                                <button
                                    className={`action-btn restore-btn ${!backupInfo?.exists ? 'disabled' : ''}`}
                                    onClick={handleRestore}
                                    disabled={!backupInfo?.exists}
                                >
                                    <Download size={28} />
                                    <span className="btn-title">Restore from Cloud</span>
                                    <span className="btn-desc">
                                        {backupInfo?.exists
                                            ? 'Restore your saved data'
                                            : 'No backup available'}
                                    </span>
                                </button>
                            </div>

                            <p className="cloud-note">
                                Your data is securely stored in Firebase Cloud.
                                You can access it from any device by logging in with the same account.
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
