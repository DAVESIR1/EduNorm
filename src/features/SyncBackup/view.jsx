/**
 * SyncBackup Feature View
 * Primary: Google Drive (Cloud-First Sync)
 */

import React, { useEffect, useState, useCallback, useRef } from 'react';
import SyncService from '../../services/SyncService.js';
import AppBus, { APP_EVENTS } from '../../core/AppBus.js';
import {
    isAuthenticated as driveIsAuthenticated,
    signOut as driveSignOut,
} from '../../services/GoogleDriveService.js';
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
            showMsg('✅ Google Drive connected! Checking cloud data...');
            // Pull-First check after connection
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
                showMsg(`✅ Restored ${result.count} records! Refreshing...`);
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

    const statusColor = { idle: '#22c55e', syncing: '#f59e0b', error: '#ef4444' }[status.state] || '#6b7280';
    const lastSyncText = status.lastSync ? new Date(status.lastSync).toLocaleString() : 'Never';

    return (
        <div className="sb-page">
            <div className="sb-header">
                <div className="sb-title-row">
                    <span className="sb-icon">☁️</span>
                    <div>
                        <h1 className="sb-title">Backup &amp; Sync</h1>
                        <p className="sb-subtitle">Cloud-First Architecture (Google Drive)</p>
                    </div>
                </div>
                {onClose && <button className="sb-close" onClick={onClose}>✕</button>}
            </div>

            {message && (
                <div className={`sb-banner ${message.startsWith('❌') ? 'error' : 'success'}`}>
                    {message}
                </div>
            )}

            <div className="sb-card sb-status-card">
                <div className="sb-status-dot" style={{ background: statusColor }} />
                <div>
                    <div className="sb-status-label">
                        {status.state === 'syncing' ? '⏳ Syncing...' : '✅ Ready'}
                    </div>
                    <div className="sb-status-msg">{status.message}</div>
                    <div className="sb-status-time">Last sync: {lastSyncText}</div>
                </div>
            </div>

            <div className="sb-card">
                <div className="sb-card-head">
                    <span className="sb-card-icon">🗂</span>
                    <div>
                        <div className="sb-card-title">Google Drive</div>
                        <div className="sb-card-sub">Single Source of Truth</div>
                    </div>
                    <span className={`sb-badge ${driveConnected ? 'connected' : 'disconnected'}`}>
                        {driveConnected ? 'Connected' : 'Not connected'}
                    </span>
                </div>

                <div className="sb-card-body">
                    <p className="sb-info">
                        Stores everything in <strong>EduNorm Backups / {user?.schoolCode || 'School'}/</strong>.
                    </p>
                    <div className="sb-btn-row">
                        {driveConnected ? (
                            <div className="sync-actions" style={{ display: 'flex', gap: 8 }}>
                                <button className="sb-btn primary" disabled={loading} onClick={handleBackupNow}>
                                    {loading ? '⏳ ...' : '⬆️ Backup Now'}
                                </button>
                                <button className="sb-btn secondary" disabled={loading} onClick={handleRestoreDrive}>
                                    Restore from Drive
                                </button>
                                <button className="sb-btn ghost" disabled={loading} onClick={handleDisconnectDrive}>
                                    Disconnect
                                </button>
                            </div>
                        ) : (
                            <div style={{ display: 'flex', gap: 8 }}>
                                <button className="sb-btn primary" onClick={handleConnectDrive} disabled={loading}>
                                    🔗 Connect Google Drive
                                </button>
                                <button className="sb-btn secondary" onClick={handleRestoreDrive} disabled={loading}>
                                    ⬇️ Restore (auto-connect)
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="sb-footer">
                <p>🔄 Auto-backup every 5 min. Data changes trigger backup within 30 sec.</p>
                <p>📁 Drive folder: EduNorm Backups / {user?.schoolCode || 'YourSchool'}</p>
            </div>
        </div>
    );
}
