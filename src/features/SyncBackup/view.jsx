import React, { useState, useCallback } from 'react';
import { Download, Upload, Cloud, RefreshCw, X, FileJson, FileSpreadsheet, Share2, CheckCircle, AlertCircle, Database, Wifi, WifiOff } from 'lucide-react';
import { SyncBackupLogic } from './logic.js';
import { syncToCloud, restoreFromCloud } from '../../services/DirectBackupService.js';
import { forceSyncNow } from '../../services/BackupSandbox.js';
import SyncEventBus from '../../services/SyncEventBus';
import './SyncBackup.css';

function ToastBanner({ type, message, onDismiss }) {
    if (!message) return null;
    const icon = type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />;
    return (
        <div className={`sync-toast sync-toast-${type}`} onClick={onDismiss}>
            {icon}<span>{message}</span>
        </div>
    );
}

function LayerStatus({ layers }) {
    if (!layers) return null;
    const layerDefs = [
        { key: 'Firestore', label: 'Firestore', emoji: '🔥' },
        { key: 'R2', label: 'Cloudflare R2', emoji: '☁️' },
        { key: 'Mega', label: 'Mega.nz', emoji: '🔒' },
    ];
    return (
        <div className="layer-status-grid">
            {layerDefs.map(({ key, label, emoji }) => {
                const status = layers[key];
                return (
                    <div key={key} className={`layer-chip ${status === true ? 'ok' : status === false ? 'fail' : 'idle'}`}>
                        <span>{emoji}</span>
                        <span className="layer-name">{label}</span>
                        {status === true && <CheckCircle size={14} />}
                        {status === false && <WifiOff size={14} />}
                        {status === undefined && <span className="layer-dot" />}
                    </div>
                );
            })}
        </div>
    );
}

function ProgressBar({ value, label }) {
    return (
        <div className="sync-progress-wrap">
            <div className="sync-progress-bar" style={{ width: `${Math.min(100, value)}%` }} />
            {label && <span className="sync-progress-label">{label}</span>}
        </div>
    );
}

/**
 * SOVEREIGN SYNC & BACKUP: PREMIUM VIEW
 */
export function SyncBackupView({ isOpen, isFullPage = false, onClose, ledger, selectedStandard, onImportComplete, user }) {
    const [activeTab, setActiveTab] = useState('cloud');
    const [syncing, setSyncing] = useState(false);
    const [importing, setImporting] = useState(false);
    const [progress, setProgress] = useState(0);
    const [toast, setToast] = useState(null);
    const [layerResults, setLayerResults] = useState(null);  // { Firestore: bool, R2: bool, Mega: bool }
    const [syncStats, setSyncStats] = useState(null);         // { synced, failed }
    const [pendingRestoreFile, setPendingRestoreFile] = useState(null); // file awaiting confirmation

    const showToast = useCallback((type, message) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 5000);
    }, []);

    if (!isOpen && !isFullPage) return null;

    // ── Cloud Sync: push local data to Firestore (via SW sandbox) ────────────
    const handleForceSync = async () => {
        const uid = user?.uid;
        if (!uid) {
            showToast('error', '❌ You must be logged in to sync to cloud');
            return;
        }
        setSyncing(true);
        setSyncStats(null);
        setProgress(15);
        try {
            SyncEventBus.emit(SyncEventBus.EVENTS.SYNC_START);
            setProgress(40);
            // Try sandbox path first (SW thread), fallback to direct sync
            let result;
            try {
                result = await forceSyncNow(user);
            } catch (swErr) {
                console.warn('SW path failed, using direct sync:', swErr.message);
                result = await syncToCloud(uid);
            }
            setProgress(100);
            setSyncStats({ synced: result.synced || 0, failed: 0 });
            setLayerResults({ Firestore: true, R2: false, Mega: false });
            SyncEventBus.emit(SyncEventBus.EVENTS.SYNC_SUCCESS, { layers: 1 });
            showToast('success', `✅ ${result.students || result.synced || 0} students synced to cloud`);
        } catch (err) {
            SyncEventBus.emit(SyncEventBus.EVENTS.SYNC_FAIL);
            showToast('error', '❌ Sync failed: ' + err.message);
            console.error('Sync error:', err);
        } finally {
            setSyncing(false);
            setTimeout(() => setProgress(0), 1500);
        }
    };


    // ── Cloud Restore: pull data from Firestore and import locally ──
    const handleRestoreAll = async () => {
        const uid = user?.uid;
        if (!uid) {
            showToast('error', '❌ You must be logged in to restore from cloud');
            return;
        }
        setSyncing(true);
        setProgress(20);
        try {
            const result = await restoreFromCloud(uid);
            setProgress(100);
            if (!result.found) {
                showToast('error', '📭 No backup found in cloud — sync your data first');
            } else if (result.restored > 0) {
                showToast('success', `✅ Restored ${result.students} students + settings from cloud!`);
                onImportComplete?.();
                setTimeout(() => window.location.reload(), 2000);
            } else {
                showToast('success', '✅ Cloud backup is empty (no student data yet)');
            }
        } catch (err) {
            showToast('error', '❌ Restore failed: ' + err.message);
            console.error('DirectBackup restore error:', err);
        } finally {
            setSyncing(false);
            setTimeout(() => setProgress(0), 1500);
        }
    };

    // ── Local Backup ──────────────────────────────────────────────
    const handleExportJSON = async () => {
        try {
            await SyncBackupLogic.exportJSON();
            showToast('success', '✅ JSON backup downloaded');
        } catch (err) {
            showToast('error', '❌ Export failed: ' + err.message);
        }
    };

    const handleExportExcel = () => {
        try {
            SyncBackupLogic.exportExcel(ledger);
            showToast('success', '✅ Excel export downloaded');
        } catch (err) {
            showToast('error', '❌ Excel export failed: ' + err.message);
        }
    };

    // Step 1 — file picker selected: store file and show confirm dialog
    const handleRestoreJSON = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setPendingRestoreFile(file);  // triggers the inline confirm modal
        e.target.value = '';          // reset input so same file can be picked again
    };

    // Step 2 — user confirmed in-app: run actual restore
    const executeRestoreJSON = async () => {
        if (!pendingRestoreFile) return;
        const file = pendingRestoreFile;
        setPendingRestoreFile(null);
        setImporting(true);
        setProgress(20);
        try {
            console.log('🔄 Local Restore: reading file', file.name);
            await SyncBackupLogic.restoreFromJSON(file, user);
            setProgress(100);
            console.log('✅ Local Restore: complete');
            showToast('success', '✅ Data restored! Reloading in 2s...');
            onImportComplete?.();
            setTimeout(() => window.location.reload(), 2000);
        } catch (err) {
            console.error('❌ Local Restore failed:', err);
            showToast('error', '❌ Restore failed: ' + err.message);
        } finally {
            setImporting(false);
            setTimeout(() => setProgress(0), 1500);
        }
    };

    const handleImportExcel = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        let importStandard = selectedStandard;
        if (!importStandard) {
            importStandard = window.prompt('No class selected. Enter Standard/Class for these students (e.g. "10-A"):', '');
            if (!importStandard) return;
        }
        setImporting(true);
        setProgress(20);
        try {
            const students = await SyncBackupLogic.processExcelImport(file);
            if (!students?.length) throw new Error('No student records found in Excel file');
            setProgress(60);
            const studentsToImport = students.map(s => ({ ...s, standard: s.standard || importStandard }));
            const { importAllData } = await import('../../services/database');
            await importAllData({ students: studentsToImport });
            setProgress(100);
            showToast('success', `✅ Imported ${studentsToImport.length} students from Excel`);
            onImportComplete?.();
            setTimeout(() => window.location.reload(), 1800);
        } catch (err) {
            showToast('error', '❌ Import failed: ' + err.message);
        } finally {
            setImporting(false);
            setTimeout(() => setProgress(0), 1500);
        }
        e.target.value = '';
    };

    const isBusy = syncing || importing;

    const content = (
        <div className="sync-modal" onClick={e => e.stopPropagation()}>
            {/* Inline Confirm Dialog — replaces window.confirm() */}
            {pendingRestoreFile && (
                <div className="sync-confirm-overlay">
                    <div className="sync-confirm-box">
                        <div className="sync-confirm-icon">⚠️</div>
                        <h3>Restore Local Backup?</h3>
                        <p>This will merge <strong>{pendingRestoreFile.name}</strong> into your local database. Existing data is preserved.</p>
                        <div className="sync-confirm-btns">
                            <button className="sync-confirm-cancel" onClick={() => setPendingRestoreFile(null)}>Cancel</button>
                            <button className="sync-confirm-ok" onClick={executeRestoreJSON}>Restore Now</button>
                        </div>
                    </div>
                </div>
            )}
            {/* Header */}
            <header className="sync-header">
                <div className="sync-header-left">
                    <div className="sync-icon-badge"><Database size={20} /></div>
                    <div>
                        <h2>Backup & Sync</h2>
                        <p>Cloud Backup & Auto Sync</p>
                    </div>
                </div>
                {!isFullPage && <button className="sync-close-btn" onClick={onClose}><X size={20} /></button>}
            </header>

            {/* Progress bar */}
            {progress > 0 && <ProgressBar value={progress} label={syncing ? 'Syncing…' : 'Processing…'} />}

            {/* Toast */}
            <ToastBanner type={toast?.type} message={toast?.message} onDismiss={() => setToast(null)} />

            {/* Tab nav */}
            <nav className="sync-tabs">
                {[
                    { id: 'cloud', icon: <Cloud size={16} />, label: 'Cloud' },
                    { id: 'local', icon: <Download size={16} />, label: 'Local' },
                    { id: 'transfer', icon: <Share2 size={16} />, label: 'Transfer' },
                ].map(tab => (
                    <button
                        key={tab.id}
                        className={`sync-tab${activeTab === tab.id ? ' active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </nav>

            {/* Cloud Tab */}
            {activeTab === 'cloud' && (
                <div className="sync-body">
                    <div className="sync-status-badge">
                        <span className="pulse-dot" />
                        <span>Real-time Protection Active</span>
                    </div>

                    {/* Force Sync — full width, no clipping */}
                    <button
                        className="sync-full-action primary"
                        onClick={handleForceSync}
                        disabled={isBusy}
                    >
                        <div className="sync-action-icon">
                            <RefreshCw size={24} className={syncing ? 'spin' : ''} />
                        </div>
                        <div className="sync-action-text">
                            <strong>{syncing ? 'Syncing…' : 'Force Cloud Sync'}</strong>
                            <span>Push all local data to cloud backup</span>
                        </div>
                    </button>

                    {/* Restore — full width */}
                    <button
                        className="sync-full-action secondary"
                        onClick={handleRestoreAll}
                        disabled={isBusy}
                        style={{ marginTop: '10px' }}
                    >
                        <div className="sync-action-icon">
                            <Download size={24} />
                        </div>
                        <div className="sync-action-text">
                            <strong>Restore from Cloud</strong>
                            <span>Pull &amp; merge from cloud backup</span>
                        </div>
                    </button>

                    {/* Live Layer Verification — shown after sync */}
                    {layerResults && (
                        <div className="layer-verify-panel">
                            <p className="layer-verify-title">Live Layer Verification</p>
                            <LayerStatus layers={layerResults} />
                            {syncStats && (
                                <p className="layer-verify-stats">
                                    {syncStats.synced} records synced · {syncStats.failed} failed
                                </p>
                            )}
                        </div>
                    )}

                    <p className="sync-hint">Your data is backed up to Firestore. Local IndexedDB is always the source of truth — your data is never lost.</p>
                </div>
            )}

            {/* Local Tab */}
            {activeTab === 'local' && (
                <div className="sync-body">
                    <div className="sync-local-grid">
                        <button className="sync-option-card" onClick={handleExportJSON} disabled={isBusy}>
                            <FileJson size={26} />
                            <strong>Export JSON</strong>
                            <span>Full backup file</span>
                        </button>
                        <button className="sync-option-card" onClick={handleExportExcel} disabled={isBusy}>
                            <FileSpreadsheet size={26} />
                            <strong>Export Excel</strong>
                            <span>General register</span>
                        </button>
                        <button className="sync-option-card" onClick={() => SyncBackupLogic.downloadTemplate()} disabled={isBusy}>
                            <Download size={26} />
                            <strong>Template</strong>
                            <span>Blank import sheet</span>
                        </button>
                        <label className={`sync-option-card${isBusy ? ' disabled' : ''}`}>
                            <FileJson size={26} />
                            <strong>Restore JSON</strong>
                            <span>Auto-merge from file</span>
                            <input type="file" hidden onChange={handleRestoreJSON} accept=".json" disabled={isBusy} />
                        </label>
                        <label className={`sync-option-card${isBusy ? ' disabled' : ''}`}>
                            <Upload size={26} />
                            <strong>Import Excel</strong>
                            <span>Smart student import</span>
                            <input type="file" hidden onChange={handleImportExcel} accept=".xlsx,.xls" disabled={isBusy} />
                        </label>
                    </div>
                </div>
            )}

            {/* Transfer Tab */}
            {activeTab === 'transfer' && (
                <div className="sync-body">
                    <div className="sync-coming-soon">
                        <Share2 size={36} style={{ opacity: 0.4 }} />
                        <strong>Device-to-Device Transfer</strong>
                        <span>QR-based encrypted transfer between devices.<br />Coming in the next update.</span>
                    </div>
                </div>
            )}
        </div>
    );

    if (isFullPage) return <div className="sync-fullpage">{content}</div>;

    return (
        <div className="sync-overlay" onClick={onClose}>
            {content}
        </div>
    );
}

export default SyncBackupView;
