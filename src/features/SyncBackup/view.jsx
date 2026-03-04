/**
 * SyncBackup Feature View
 * Primary: Google Drive (Cloud-First Sync)
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
    Cloud,
    HardDrive,
    RefreshCcw,
    Shield,
    ArrowUp,
    ArrowDown,
    Info,
    Loader2,
    Palette,
    Sparkles,
    FileJson,
    FileSpreadsheet,
    Sun
} from 'lucide-react';
import './SyncBackup.css';

// ── Drive OAuth helper ────────────────────────────────────────────────────────
function connectGoogleDrive() {
    return new Promise((resolve, reject) => {
        const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
        if (!CLIENT_ID) { reject(new Error('VITE_GOOGLE_CLIENT_ID not set in .env')); return; }

        const doAuth = () => {
            const tc = window.google.accounts.oauth2.initTokenClient({
                client_id: CLIENT_ID,
                scope: 'https://www.googleapis.com/auth/drive.file',
                callback: (response) => {
                    if (response.error) {
                        reject(new Error(response.error_description || response.error));
                        return;
                    }
                    localStorage.setItem('gdriveToken', response.access_token);
                    localStorage.setItem('gdriveTokenExpiry', String(Date.now() + response.expires_in * 1000));
                    resolve(response.access_token);
                },
            });
            tc.requestAccessToken({ prompt: 'consent' });
        };

        if (window.google?.accounts?.oauth2) { doAuth(); return; }

        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.onload = () => setTimeout(doAuth, 200);
        script.onerror = () => reject(new Error('Failed to load Google Identity Services'));
        document.head.appendChild(script);
    });
}

export default function SyncBackupView({ user, onClose }) {
    const [status, setStatus] = useState(SyncService.getStatus());
    const [driveConnected, setDriveConnected] = useState(driveIsAuthenticated());
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const msgTimer = useRef(null);

    useEffect(() => {
        const unsub = SyncService.subscribe(setStatus);
        setDriveConnected(driveIsAuthenticated());
        return unsub;
    }, []);

    const showMsg = useCallback((m) => {
        setMessage(m);
        clearTimeout(msgTimer.current);
        msgTimer.current = setTimeout(() => setMessage(''), 6000);
    }, []);

    // ── Actions ─────────────────────────────────────────────────────────────

    const handleConnectDrive = useCallback(async () => {
        setLoading(true);
        setMessage('');
        try {
            await connectGoogleDrive();
            setDriveConnected(true);
            showMsg('✅ Google Drive connected!');
            await SyncService.init(user);
        } catch (err) {
            showMsg(`❌ Drive connection failed: ${err.message}`);
        } finally {
            setLoading(false);
        }
    }, [user, showMsg]);

    const handleDisconnectDrive = useCallback(() => {
        driveSignOut();
        setDriveConnected(false);
        showMsg('Google Drive disconnected.');
    }, [showMsg]);

    const handleRestoreDrive = useCallback(async () => {
        if (SyncService.getStatus().state === 'syncing') {
            showMsg('⚠️ Another sync is in progress...');
            return;
        }
        if (!window.confirm('⚠️ This will overwrite local data with the Drive backup. Continue?')) return;
        setLoading(true);

        try {
            if (!driveIsAuthenticated()) {
                showMsg('🔐 Connecting to Google Drive first...');
                await connectGoogleDrive();
                setDriveConnected(true);
            }

            showMsg('⏳ Fetching cloud data...');
            const result = await SyncService.restoreFromDrive(user);

            if (result.success) {
                AppBus.emit(APP_EVENTS.SETTINGS_CHANGED, { source: 'restore' });
                AppBus.emit(APP_EVENTS.STUDENT_IMPORTED, { count: result.count, source: 'drive' });
                showMsg(`✅ Restored ${result.count} records!`);
                setTimeout(() => AppBus.emit(APP_EVENTS.SETTINGS_CHANGED, { source: 'restore-final' }), 800);
            } else {
                showMsg(`❌ ${result.error || 'Restore failed'}`);
            }
        } catch (err) {
            showMsg(`❌ ${err.message}`);
        } finally {
            setLoading(false);
        }
    }, [user, showMsg]);

    const handleBackupNow = useCallback(async () => {
        if (SyncService.getStatus().state === 'syncing') {
            showMsg('⚠️ Sync already in progress...');
            return;
        }
        setLoading(true);
        const result = await SyncService.backupNow(user);
        showMsg(result.success ? '✅ Backup complete!' : `❌ ${result.error}`);
        setLoading(false);
    }, [user, showMsg]);

    const handleToggleAutoSync = useCallback(async () => {
        const newVal = !status.isAutoSync;
        await SyncService.updateConfig({ isAutoSync: newVal });
        showMsg(newVal ? '🚀 Auto-sync enabled' : '⏸️ Auto-sync disabled');
    }, [status.isAutoSync, showMsg]);

    const isSyncing = status.state === 'syncing';

    return (
        <div className="sb-page">
            <div className="sb-header">
                <div className="sb-title-row">
                    <Cloud size={24} className="sb-icon" />
                    <div>
                        <h1 className="sb-title">Backup &amp; Sync</h1>
                        <p className="sb-subtitle">Cloud-First Architecture</p>
                    </div>
                </div>
                {onClose && <button className="sb-close" onClick={onClose}>✕</button>}
            </div>

            {message && (
                <div className={`sb-banner ${message.startsWith('❌') ? 'error' : 'success'}`}>
                    {message}
                </div>
            )}

            <div className="glass-panel" style={{ padding: '0', overflow: 'hidden', marginTop: '1rem' }}>
                {/* Header Area */}
                <div style={{
                    padding: '2rem',
                    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(168, 85, 247, 0.05))',
                    borderBottom: '1px solid var(--glass-border)',
                    textAlign: 'center'
                }}>
                    <div style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '20px',
                        background: 'var(--primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 1rem',
                        boxShadow: '0 8px 16px rgba(0,0,0,0.1)'
                    }}>
                        <Cloud className="text-white" size={32} />
                    </div>
                    <h2 style={{ margin: '0', fontSize: '1.5rem', fontWeight: '800' }}>Google Drive Recovery</h2>
                    <p style={{ opacity: 0.7, marginTop: '0.4rem', fontSize: '0.9rem' }}>Protecting {user?.schoolCode || 'your'} data</p>
                </div>

                <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    {/* Connection Status Card */}
                    <div className="glass-card" style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '1.25rem',
                        background: driveConnected ? 'rgba(16, 185, 129, 0.05)' : 'var(--glass-bg-strong)'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{
                                padding: '10px',
                                borderRadius: '12px',
                                background: driveConnected ? 'rgba(16, 185, 129, 0.1)' : 'rgba(107, 114, 128, 0.1)'
                            }}>
                                <HardDrive size={22} color={driveConnected ? '#10b981' : '#6b7280'} />
                            </div>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1rem' }}>Cloud Connectivity</h3>
                                <p style={{ margin: '2px 0 0', fontSize: '0.85rem', opacity: 0.7 }}>
                                    {driveConnected ? 'Connected & Ready' : 'Disconnected'}
                                </p>
                            </div>
                        </div>

                        <button
                            disabled={loading}
                            onClick={driveConnected ? handleDisconnectDrive : handleConnectDrive}
                            className={`btn-premium ${driveConnected ? 'btn-premium-secondary' : 'btn-premium-primary'}`}
                        >
                            {loading ? <Loader2 size={16} className="animate-spin" /> : driveConnected ? <RefreshCcw size={16} /> : <Cloud size={16} />}
                            <span style={{ marginLeft: 8 }}>{driveConnected ? 'Disconnect' : 'Connect'}</span>
                        </button>
                    </div>

                    {driveConnected && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                            {/* Auto Sync Settings */}
                            <div className="glass-card" style={{ padding: '1.25rem' }}>
                                <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem', fontSize: '0.95rem' }}>
                                    <Shield size={16} color="var(--primary)" />
                                    Auto-Protection
                                </h4>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px', background: 'rgba(0,0,0,0.03)', borderRadius: '10px' }}>
                                    <span style={{ fontSize: '0.9rem' }}>Real-time Sync</span>
                                    <div
                                        className={`status-badge ${status.isAutoSync ? 'sync-success' : ''}`}
                                        style={{ cursor: 'pointer', padding: '4px 10px', fontSize: '0.75rem' }}
                                        onClick={handleToggleAutoSync}
                                    >
                                        {status.isAutoSync ? 'ON' : 'OFF'}
                                    </div>
                                </div>
                                <p style={{ fontSize: '0.75rem', opacity: 0.6, marginTop: '0.8rem' }}>
                                    Syncs automatically after every change to ensure zero data loss.
                                </p>
                            </div>

                            {/* Manual Controls */}
                            <div className="glass-card" style={{ padding: '1.25rem' }}>
                                <h4 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1rem', fontSize: '0.95rem' }}>
                                    <RefreshCcw size={16} color="#6366f1" />
                                    Manual Sync
                                </h4>
                                <div style={{ display: 'flex', gap: '8px' }}>
                                    <button
                                        onClick={handleBackupNow}
                                        disabled={loading || isSyncing}
                                        className="btn-premium btn-premium-primary"
                                        style={{ flex: 1, padding: '10px' }}
                                    >
                                        {isSyncing ? <Loader2 size={14} className="animate-spin" /> : <ArrowUp size={14} />}
                                        <span style={{ marginLeft: 4 }}>Backup</span>
                                    </button>
                                    <button
                                        onClick={handleRestoreDrive}
                                        disabled={loading || isSyncing}
                                        className="btn-premium btn-premium-secondary"
                                        style={{ flex: 1, padding: '10px' }}
                                    >
                                        {isSyncing ? <Loader2 size={14} className="animate-spin" /> : <ArrowDown size={14} />}
                                        <span style={{ marginLeft: 4 }}>Restore</span>
                                    </button>
                                </div>
                                <p style={{ fontSize: '0.75rem', opacity: 0.6, marginTop: '0.8rem', textAlign: 'center' }}>
                                    Last Sync: {lastSyncText}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Info Box */}
                    <div style={{
                        padding: '1rem',
                        borderRadius: '12px',
                        border: '1px solid rgba(245, 158, 11, 0.2)',
                        background: 'rgba(245, 158, 11, 0.05)',
                        display: 'flex',
                        gap: '10px'
                    }}>
                        <Info size={16} color="#f59e0b" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-soft)', lineHeight: '1.4' }}>
                            <strong>Security Note:</strong> Your data is stored in your private Google Drive.
                            EduNorm does not store any school data on our servers.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
