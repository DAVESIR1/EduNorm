import React, { useState, useEffect } from 'react';
import {
    Cloud, UploadCloud, DownloadCloud, RefreshCw, CheckCircle,
    AlertCircle, X, Trash2, Clock, Download, LogIn, LogOut
} from 'lucide-react';
import {
    loadGoogleScripts, initTokenClient, isAuthenticated, requestAccessToken,
    signOut, backupToGoogleDrive, listBackupsFromGoogleDrive,
    restoreFromGoogleDrive, deleteBackupFromGoogleDrive, getLastBackupInfo,
    saveLocalBackup, getLocalBackup, hasLocalBackup
} from '../../services/GoogleDriveService';
import { exportAllData, importAllData } from '../../services/database';
import './DriveBackup.css';

export default function DriveBackup({ isOpen, onClose, onRestore }) {
    const [isConnected, setIsConnected] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [backups, setBackups] = useState([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [lastBackupInfo, setLastBackupInfo] = useState({});
    const [activeTab, setActiveTab] = useState('drive'); // 'drive' or 'local'

    useEffect(() => {
        if (isOpen) {
            checkConnection();
            setLastBackupInfo(getLastBackupInfo());
        }
    }, [isOpen]);

    const checkConnection = async () => {
        setIsConnected(isAuthenticated());
        if (isAuthenticated()) {
            await loadBackupsList();
        }
    };

    const handleConnect = async () => {
        setIsLoading(true);
        setError('');
        try {
            // Check if credentials are configured
            const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
            const apiKey = import.meta.env.VITE_GOOGLE_API_KEY;

            if (!clientId || !apiKey) {
                setError('⚠️ Google Drive integration requires API credentials. Please add VITE_GOOGLE_CLIENT_ID and VITE_GOOGLE_API_KEY to your .env file. Contact admin for credentials.');
                setIsLoading(false);
                return;
            }

            await loadGoogleScripts();
            initTokenClient(
                async () => {
                    setIsConnected(true);
                    await loadBackupsList();
                    setIsLoading(false);
                },
                (err) => {
                    setError('Failed to connect to Google Drive. Please try again.');
                    setIsLoading(false);
                }
            );
            await requestAccessToken();
        } catch (err) {
            setError('Failed to load Google services: ' + err.message);
            setIsLoading(false);
        }
    };

    const handleDisconnect = () => {
        signOut();
        setIsConnected(false);
        setBackups([]);
    };

    const loadBackupsList = async () => {
        try {
            const files = await listBackupsFromGoogleDrive();
            setBackups(files);
        } catch (err) {
            console.error('Failed to load backups:', err);
        }
    };

    const handleBackup = async () => {
        setIsLoading(true);
        setError('');
        setSuccess('');
        try {
            const data = await exportAllData();

            if (activeTab === 'drive') {
                await backupToGoogleDrive(data);
                await loadBackupsList();
                setSuccess('✅ Backup saved to Google Drive!');
            } else {
                saveLocalBackup(data);
                setSuccess('✅ Backup saved locally!');
            }

            setLastBackupInfo(getLastBackupInfo());
        } catch (err) {
            setError('Failed to create backup: ' + err.message);
        }
        setIsLoading(false);
    };

    const handleRestore = async (fileId = null) => {
        if (!window.confirm('⚠️ This will replace all current data. Are you sure?')) {
            return;
        }

        setIsLoading(true);
        setError('');
        setSuccess('');
        try {
            let data;

            if (activeTab === 'drive' && fileId) {
                data = await restoreFromGoogleDrive(fileId);
            } else if (activeTab === 'local') {
                data = getLocalBackup();
                if (!data) {
                    throw new Error('No local backup found');
                }
            }

            await importAllData(data);
            setSuccess('✅ Data restored successfully! Refreshing...');

            if (onRestore) {
                setTimeout(() => {
                    onRestore();
                    onClose();
                }, 1500);
            }
        } catch (err) {
            setError('Failed to restore: ' + err.message);
        }
        setIsLoading(false);
    };

    const handleDelete = async (fileId, fileName) => {
        if (!window.confirm(`Delete backup "${fileName}"?`)) {
            return;
        }

        setIsLoading(true);
        try {
            await deleteBackupFromGoogleDrive(fileId);
            await loadBackupsList();
            setSuccess('Backup deleted');
        } catch (err) {
            setError('Failed to delete backup');
        }
        setIsLoading(false);
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString();
    };

    const formatSize = (bytes) => {
        if (!bytes) return 'Unknown';
        const kb = bytes / 1024;
        return kb > 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb.toFixed(1)} KB`;
    };

    if (!isOpen) return null;

    return (
        <div className="drive-backup-overlay" onClick={onClose}>
            <div className="drive-backup-modal" onClick={e => e.stopPropagation()}>
                <div className="drive-backup-header">
                    <div className="drive-backup-title">
                        <Cloud size={24} />
                        <h2>Backup & Restore</h2>
                    </div>
                    <button className="close-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="drive-backup-tabs">
                    <button
                        className={`tab-btn ${activeTab === 'drive' ? 'active' : ''}`}
                        onClick={() => setActiveTab('drive')}
                    >
                        <Cloud size={16} />
                        Google Drive
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'local' ? 'active' : ''}`}
                        onClick={() => setActiveTab('local')}
                    >
                        <Download size={16} />
                        Local Storage
                    </button>
                </div>

                {/* Status Messages */}
                {error && (
                    <div className="status-message error">
                        <AlertCircle size={16} />
                        {error}
                    </div>
                )}
                {success && (
                    <div className="status-message success">
                        <CheckCircle size={16} />
                        {success}
                    </div>
                )}

                <div className="drive-backup-content">
                    {activeTab === 'drive' ? (
                        <>
                            {/* Google Drive Tab */}
                            {!isConnected ? (
                                <div className="connect-section">
                                    <Cloud size={48} className="cloud-icon" />
                                    <h3>Connect Google Drive</h3>
                                    <p>Backup your data securely to Google Drive</p>
                                    <button
                                        className="connect-btn"
                                        onClick={handleConnect}
                                        disabled={isLoading}
                                    >
                                        <LogIn size={18} />
                                        {isLoading ? 'Connecting...' : 'Connect to Google Drive'}
                                    </button>
                                </div>
                            ) : (
                                <>
                                    {/* Connected State */}
                                    <div className="connected-header">
                                        <span className="connected-badge">
                                            <CheckCircle size={14} />
                                            Connected
                                        </span>
                                        <button className="disconnect-btn" onClick={handleDisconnect}>
                                            <LogOut size={14} />
                                            Disconnect
                                        </button>
                                    </div>

                                    {/* Backup Actions */}
                                    <div className="backup-actions">
                                        <button
                                            className="action-btn backup"
                                            onClick={handleBackup}
                                            disabled={isLoading}
                                        >
                                            <UploadCloud size={20} />
                                            {isLoading ? 'Saving...' : 'Backup Now'}
                                        </button>
                                        <button
                                            className="action-btn refresh"
                                            onClick={loadBackupsList}
                                            disabled={isLoading}
                                        >
                                            <RefreshCw size={20} className={isLoading ? 'spin' : ''} />
                                            Refresh
                                        </button>
                                    </div>

                                    {/* Last Backup Info */}
                                    {lastBackupInfo.lastGDriveBackup && (
                                        <div className="last-backup-info">
                                            <Clock size={14} />
                                            Last backup: {formatDate(lastBackupInfo.lastGDriveBackup)}
                                        </div>
                                    )}

                                    {/* Backups List */}
                                    <div className="backups-list">
                                        <h4>Available Backups</h4>
                                        {backups.length === 0 ? (
                                            <p className="no-backups">No backups found</p>
                                        ) : (
                                            backups.map(backup => (
                                                <div key={backup.id} className="backup-item">
                                                    <div className="backup-info">
                                                        <span className="backup-name">{backup.name}</span>
                                                        <span className="backup-meta">
                                                            {formatDate(backup.createdTime)} • {formatSize(backup.size)}
                                                        </span>
                                                    </div>
                                                    <div className="backup-actions-inline">
                                                        <button
                                                            className="restore-btn"
                                                            onClick={() => handleRestore(backup.id)}
                                                            disabled={isLoading}
                                                        >
                                                            <DownloadCloud size={16} />
                                                            Restore
                                                        </button>
                                                        <button
                                                            className="delete-btn"
                                                            onClick={() => handleDelete(backup.id, backup.name)}
                                                            disabled={isLoading}
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </>
                            )}
                        </>
                    ) : (
                        <>
                            {/* Local Storage Tab */}
                            <div className="local-backup-section">
                                <Download size={48} className="local-icon" />
                                <h3>Local Backup</h3>
                                <p>Store backup in your browser's local storage</p>

                                <div className="backup-actions">
                                    <button
                                        className="action-btn backup"
                                        onClick={handleBackup}
                                        disabled={isLoading}
                                    >
                                        <Download size={20} />
                                        {isLoading ? 'Saving...' : 'Save Local Backup'}
                                    </button>
                                </div>

                                {lastBackupInfo.lastLocalBackup && (
                                    <div className="last-backup-info">
                                        <Clock size={14} />
                                        Last backup: {formatDate(lastBackupInfo.lastLocalBackup)}
                                    </div>
                                )}

                                {hasLocalBackup() && (
                                    <button
                                        className="action-btn restore-local"
                                        onClick={() => handleRestore()}
                                        disabled={isLoading}
                                    >
                                        <DownloadCloud size={20} />
                                        Restore from Local Backup
                                    </button>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
