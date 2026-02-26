import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
    getSyncStatus, subscribe, backupAll, restoreAll,
    downloadLocalBackup, restoreFromLocalFile, getDriveFolderLink,
    isPhoenixConfigured, markPhoenixConfigured, snoozeReminder,
    shouldShowReminder, getPhoenixHealth,
} from '../../services/HybridSyncService';
import {
    isAuthenticated as isDriveAuth, loadGoogleScripts, requestAccessToken, signOut as driveSignOut,
    listBackupsFromGoogleDrive, deleteBackupFromGoogleDrive,
} from '../../services/GoogleDriveService';
import './PhoenixSync.css';

// ─── Onboarding Modal ────────────────────────────────────────────

function OnboardingModal({ onSetup, onSkip, loading }) {
    const [step, setStep] = useState('welcome'); // welcome | consequences

    if (step === 'consequences') {
        return (
            <div className="phoenix-overlay">
                <div className="phoenix-modal consequences">
                    <div className="modal-icon">⚠️</div>
                    <h2>Without Backup Protection</h2>
                    <ul className="consequence-list">
                        <li>❌ If you clear browser data, <strong>all student records are lost forever</strong></li>
                        <li>❌ If your device breaks, <strong>no recovery is possible</strong></li>
                        <li>❌ If you switch devices, <strong>data won't transfer</strong></li>
                        <li>❌ No protection against accidental deletion</li>
                    </ul>
                    <p className="consequence-note">We'll remind you in 3 days. You can always set up from Data Management menu.</p>
                    <div className="modal-actions">
                        <button className="btn-phoenix setup" onClick={onSetup} disabled={loading}>
                            {loading ? '⏳ Connecting...' : '🔥 I\'ll Set Up Now'}
                        </button>
                        <button className="btn-phoenix skip" onClick={() => { snoozeReminder(3); onSkip(); }}>
                            I Understand the Risk
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="phoenix-overlay">
            <div className="phoenix-modal welcome">
                <div className="modal-icon">🔥</div>
                <h2>Protect Your Data Forever</h2>
                <p className="modal-subtitle">Phoenix Sync makes your data immortal — even if your device is lost.</p>

                <div className="setup-steps">
                    <div className="step-item">
                        <span className="step-num">1</span>
                        <span>Connect your Google Drive (one-time, 10 seconds)</span>
                    </div>
                    <div className="step-item">
                        <span className="step-num">2</span>
                        <span>Your data auto-backs up in the background, always</span>
                    </div>
                    <div className="step-item">
                        <span className="step-num">3</span>
                        <span>Login from any device — your data follows you</span>
                    </div>
                </div>

                <div className="modal-actions">
                    <button className="btn-phoenix setup" onClick={onSetup} disabled={loading}>
                        {loading ? '⏳ Connecting...' : '🔥 Set Up Phoenix Sync'}
                    </button>
                    <button className="btn-phoenix skip" onClick={() => setStep('consequences')}>
                        Maybe Later
                    </button>
                </div>
            </div>
        </div>
    );
}

// ─── Health Bar ──────────────────────────────────────────────────

function HealthBar({ health }) {
    const color = health >= 75 ? '#10b981' : health >= 50 ? '#f59e0b' : '#ef4444';
    return (
        <div className="health-bar-container">
            <div className="health-bar" style={{ width: `${health}%`, background: color }} />
            <span className="health-label">{health}%</span>
        </div>
    );
}

// ─── Layer Status ────────────────────────────────────────────────

function LayerStatus({ layers }) {
    const icons = { indexeddb: '💾', localstorage: '🧬', firebase: '☁️', drive: '📁' };
    return (
        <div className="layer-grid">
            {Object.entries(layers).map(([key, info]) => (
                <div key={key} className={`layer-item ${info.active ? 'active' : 'inactive'}`}>
                    <span className="layer-icon">{icons[key]}</span>
                    <span className="layer-label">{info.label}</span>
                    <span className={`layer-dot ${info.active ? 'green' : 'grey'}`} />
                </div>
            ))}
        </div>
    );
}

// ─── Main PhoenixSync Component ──────────────────────────────────

export default function PhoenixSync({ isFullPage = false, onClose }) {
    const { user } = useAuth();
    const [status, setStatusState] = useState(getSyncStatus());
    const [health, setHealth] = useState(getPhoenixHealth());
    const [loading, setLoading] = useState('');
    const [driveConnected, setDriveConnected] = useState(isDriveAuth());
    const [backups, setBackups] = useState([]);
    const [folderLink, setFolderLink] = useState(null);
    const [toast, setToast] = useState(null);
    const [activeTab, setActiveTab] = useState('sync');
    const [showOnboarding, setShowOnboarding] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        const unsub = subscribe((s) => {
            setStatusState(s);
            setHealth(getPhoenixHealth());
        });
        if (!isPhoenixConfigured() && shouldShowReminder()) {
            setShowOnboarding(true);
        }
        return unsub;
    }, []);

    useEffect(() => {
        if (driveConnected) loadBackups();
        setHealth(getPhoenixHealth());
    }, [driveConnected]);

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 4000);
    };

    const loadBackups = async () => {
        try {
            const list = await listBackupsFromGoogleDrive();
            setBackups(list);
            const link = await getDriveFolderLink();
            setFolderLink(link);
        } catch (_) { }
    };

    const handleConnectDrive = async () => {
        setLoading('connect');
        try {
            await loadGoogleScripts();
            await requestAccessToken();
            setDriveConnected(true);
            markPhoenixConfigured();
            setShowOnboarding(false);
            await loadBackups();
            if (user) {
                try {
                    const { getAllStudents } = await import('../../services/database');
                    const students = await getAllStudents();

                    if (students.length === 0) {
                        console.log('🧬 Phoenix: Local empty on connect. Attempting Smart Restore...');
                        setLoading('restore');
                        const result = await restoreAll(user);
                        if (result?.count > 0) {
                            showToast(`🔥 Reborn! Restored ${result.count} students from ${result.source}`);
                            setTimeout(() => window.location.reload(), 1500);
                            return;
                        }
                    } else {
                        await backupAll(user);
                    }
                } catch (e) { console.warn('Smart sync failed:', e); }
            }
            showToast('🔥 Phoenix Sync activated! Your data is immortal.');
        } catch (e) {
            showToast('Connection failed: ' + e.message, 'error');
        }
        setLoading('');
    };

    const handleDisconnect = () => {
        driveSignOut();
        setDriveConnected(false);
        setBackups([]);
        showToast('Google Drive disconnected', 'info');
    };

    const handleBackup = async () => {
        setLoading('backup');
        try {
            await backupAll(user);
            await loadBackups();
            showToast('🔥 Backup complete!');
        } catch (e) { showToast('Backup failed: ' + e.message, 'error'); }
        setLoading('');
    };

    const handleRestore = async () => {
        if (!window.confirm('This will merge cloud data with your local data. Continue?')) return;
        setLoading('restore');
        try {
            const result = await restoreAll(user);
            showToast(`Restored ${result.count} students from ${result.source}`);
            setTimeout(() => window.location.reload(), 1500);
        } catch (e) { showToast('Restore failed: ' + e.message, 'error'); }
        setLoading('');
    };

    const handleLocalDownload = async () => {
        try { await downloadLocalBackup(); showToast('Downloaded!'); }
        catch (_) { showToast('Download failed', 'error'); }
    };

    const handleLocalRestore = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setLoading('local');
        try {
            const result = await restoreFromLocalFile(file);
            showToast(`Restored ${result.count} students`);
            setTimeout(() => window.location.reload(), 1500);
        } catch (_) { showToast('Import failed', 'error'); }
        setLoading('');
    };

    const handleDelete = async (fileId, name) => {
        if (!window.confirm(`Delete "${name}"?`)) return;
        try {
            await deleteBackupFromGoogleDrive(fileId);
            setBackups(b => b.filter(f => f.id !== fileId));
            showToast('Deleted');
        } catch (_) { showToast('Delete failed', 'error'); }
    };

    const statusColors = { idle: '#6b7280', syncing: '#3b82f6', success: '#10b981', warning: '#f59e0b', error: '#ef4444', phoenix: '#f97316' };
    const statusIcons = { idle: '⏸️', syncing: '🔄', success: '✅', warning: '⚠️', error: '❌', phoenix: '🔥' };

    // ─── Onboarding (shown as overlay) ──────────────────────────
    if (showOnboarding) {
        return (
            <OnboardingModal
                onSetup={handleConnectDrive}
                onSkip={() => setShowOnboarding(false)}
                loading={loading === 'connect'}
            />
        );
    }

    const content = (
        <div className="phoenix-container">
            {/* Header */}
            <div className="phoenix-header">
                <div className="header-left">
                    <h2>🔥 Phoenix Sync</h2>
                    <HealthBar health={health.health} />
                </div>
                {onClose && <button className="phoenix-close" onClick={onClose}>✕</button>}
            </div>

            {/* Status */}
            <div className="phoenix-status" style={{ borderLeftColor: statusColors[status.state] }}>
                <span className={`status-icon ${status.state === 'syncing' ? 'spin' : ''}`}>{statusIcons[status.state]}</span>
                <span className="status-msg">{status.message || 'Ready'}</span>
            </div>

            {/* Tabs */}
            <div className="phoenix-tabs">
                {[
                    { id: 'sync', label: '☁️ Cloud Sync' },
                    { id: 'local', label: '💾 Local' },
                    { id: 'status', label: '📊 Health' },
                ].map(tab => (
                    <button key={tab.id} className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="phoenix-body">
                {activeTab === 'sync' && (
                    <>
                        <section className="phoenix-section">
                            <h3>Google Drive</h3>
                            {driveConnected ? (
                                <div className="drive-row">
                                    <span className="dot green" /> Connected
                                    {folderLink && <a href={folderLink} target="_blank" rel="noreferrer" className="drive-link">Open ↗</a>}
                                    <button className="btn-sm ghost" onClick={handleDisconnect}>Disconnect</button>
                                </div>
                            ) : (
                                <button className="btn-phoenix connect" onClick={handleConnectDrive} disabled={loading === 'connect'}>
                                    {loading === 'connect' ? '⏳ Connecting...' : '🔌 Connect Google Drive'}
                                </button>
                            )}
                        </section>

                        <section className="phoenix-section">
                            <div className="action-row">
                                <button className="btn-phoenix backup" onClick={handleBackup} disabled={!!loading}>
                                    {loading === 'backup' ? '⏳ ...' : '⬆️ Backup Now'}
                                </button>
                                <button className="btn-phoenix restore" onClick={handleRestore} disabled={!!loading}>
                                    {loading === 'restore' ? '⏳ ...' : '⬇️ Restore'}
                                </button>
                            </div>
                            {status.lastDriveSync && <p className="meta">Drive: {new Date(status.lastDriveSync).toLocaleString()}</p>}
                            {status.lastFirebaseSync && <p className="meta">Firebase: {new Date(status.lastFirebaseSync).toLocaleString()}</p>}
                        </section>

                        {backups.length > 0 && (
                            <section className="phoenix-section">
                                <h3>Drive Backups</h3>
                                <div className="backup-list">
                                    {backups.slice(0, 8).map(b => (
                                        <div key={b.id} className="backup-row">
                                            <div>
                                                <div className="backup-name">{b.name}</div>
                                                <div className="backup-meta">{new Date(b.createdTime || b.modifiedTime).toLocaleString()}</div>
                                            </div>
                                            <button className="btn-del" onClick={() => handleDelete(b.id, b.name)}>🗑️</button>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}
                    </>
                )}

                {activeTab === 'local' && (
                    <section className="phoenix-section">
                        <h3>Local Backup</h3>
                        <p className="section-desc">Download your data as a JSON file, or restore from a previously downloaded file.</p>
                        <div className="action-row">
                            <button className="btn-phoenix local" onClick={handleLocalDownload}>📥 Download JSON</button>
                            <button className="btn-phoenix local" onClick={() => fileInputRef.current?.click()} disabled={loading === 'local'}>
                                {loading === 'local' ? '⏳...' : '📤 Upload JSON'}
                            </button>
                            <input ref={fileInputRef} type="file" accept=".json" hidden onChange={handleLocalRestore} />
                        </div>
                    </section>
                )}

                {activeTab === 'status' && (
                    <>
                        <section className="phoenix-section">
                            <h3>Protection Layers</h3>
                            <LayerStatus layers={health.layers} />
                        </section>

                        <section className="phoenix-section">
                            <h3>Engine Status</h3>
                            <div className="stat-grid">
                                <div className="stat-item">
                                    <span className="stat-label">Heartbeat</span>
                                    <span className={`stat-value ${health.heartbeatActive ? 'green' : 'red'}`}>
                                        {health.heartbeatActive ? '🫀 Active' : '💤 Inactive'}
                                    </span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-label">Auto-Backup</span>
                                    <span className={`stat-value ${health.autoBackupActive ? 'green' : 'red'}`}>
                                        {health.autoBackupActive ? '🔄 Running (5min)' : '⏹️ Off'}
                                    </span>
                                </div>
                                <div className="stat-item">
                                    <span className="stat-label">Retry Queue</span>
                                    <span className="stat-value">{health.retryQueueLength} pending</span>
                                </div>
                                {health.ashSeed && (
                                    <>
                                        <div className="stat-item">
                                            <span className="stat-label">Students Protected</span>
                                            <span className="stat-value">{health.ashSeed.studentCount}</span>
                                        </div>
                                        <div className="stat-item">
                                            <span className="stat-label">Last Ash Seed</span>
                                            <span className="stat-value">{new Date(health.ashSeed.timestamp).toLocaleString()}</span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </section>
                    </>
                )}
            </div>

            {toast && <div className={`phoenix-toast ${toast.type}`}>{toast.msg}</div>}
        </div>
    );

    if (isFullPage) return <div className="phoenix-fullpage-wrapper">{content}</div>;

    return (
        <div className="phoenix-overlay" onClick={onClose}>
            <div className="phoenix-panel" onClick={e => e.stopPropagation()}>
                {content}
            </div>
        </div>
    );
}
