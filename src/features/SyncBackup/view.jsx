
import React, { useState, useCallback } from 'react';
import { Download, Upload, Cloud, RefreshCw, X, FileJson, FileSpreadsheet, Share2, CheckCircle, AlertCircle, Database } from 'lucide-react';
import { SyncBackupLogic } from './logic.js';
import { SovereignBridge } from '../../core/v2/Bridge';
import SyncEventBus from '../../services/SyncEventBus';
import './SyncBackup.css';

function ToastBanner({ type, message, onDismiss }) {
    if (!message) return null;
    const icon = type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />;
    return (
        <div className={`sync-toast sync-toast-${type}`} onClick={onDismiss}>
            {icon}
            <span>{message}</span>
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
export function SyncBackupView({ isOpen, isFullPage = false, onClose, ledger, selectedStandard, onImportComplete }) {
    const [activeTab, setActiveTab] = useState('cloud');
    const [syncing, setSyncing] = useState(false);
    const [importing, setImporting] = useState(false);
    const [progress, setProgress] = useState(0);
    const [toast, setToast] = useState(null);

    const showToast = useCallback((type, message) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 4000);
    }, []);

    if (!isOpen && !isFullPage) return null;

    // ── Cloud Sync ────────────────────────────────────────────────
    const handleForceSync = async () => {
        setSyncing(true);
        setProgress(10);
        try {
            SyncEventBus.emit(SyncEventBus.EVENTS.SYNC_START);
            setProgress(40);
            const result = await SovereignBridge.forceSync();
            setProgress(100);
            SyncEventBus.emit(SyncEventBus.EVENTS.SYNC_SUCCESS, { layers: 3 });
            showToast('success', `✅ Sync complete — ${result?.synced || 0} records secured across 3 layers`);
        } catch (err) {
            SyncEventBus.emit(SyncEventBus.EVENTS.SYNC_FAIL);
            showToast('error', '❌ Sync failed: ' + err.message);
        } finally {
            setSyncing(false);
            setTimeout(() => setProgress(0), 1500);
        }
    };

    const handleRestoreAll = async () => {
        if (!window.confirm('🔄 RESTORE FROM CLOUD\n\nThis will pull all your data from the encrypted cloud mesh and merge it with local data. Continue?')) return;
        setSyncing(true);
        setProgress(20);
        try {
            const res = await SyncBackupLogic.syncAll();
            setProgress(100);
            showToast('success', `✅ Cloud restore complete — ${res.success || 0} records pulled`);
            onImportComplete?.();
        } catch (err) {
            showToast('error', '❌ Restore failed: ' + err.message);
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

    const handleRestoreJSON = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (!window.confirm('🧬 SOVEREIGN JSON RESTORE\n\nThis merges file data with zero-loss integrity. Proceed?')) return;
        setImporting(true);
        setProgress(20);
        try {
            await SyncBackupLogic.restoreFromJSON(file);
            setProgress(100);
            showToast('success', '✅ Data restored successfully! Reloading...');
            onImportComplete?.();
            setTimeout(() => window.location.reload(), 1800);
        } catch (err) {
            showToast('error', '❌ Restore failed: ' + err.message);
        } finally {
            setImporting(false);
            setTimeout(() => setProgress(0), 1500);
        }
        e.target.value = '';
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
            {/* Header */}
            <header className="sync-header">
                <div className="sync-header-left">
                    <div className="sync-icon-badge"><Database size={20} /></div>
                    <div>
                        <h2>Data Sovereignty</h2>
                        <p>Universal Backups &amp; Cloud Sync</p>
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
                    <div className="sync-action-grid">
                        <button className="sync-action-card primary" onClick={handleForceSync} disabled={isBusy}>
                            <RefreshCw size={28} className={syncing ? 'spin' : ''} />
                            <strong>{syncing ? 'Syncing…' : 'Force Cloud Sync'}</strong>
                            <span>Push all data to Firestore, R2 &amp; Mega</span>
                        </button>
                        <button className="sync-action-card secondary" onClick={handleRestoreAll} disabled={isBusy}>
                            <Download size={28} />
                            <strong>Restore from Cloud</strong>
                            <span>Pull &amp; merge from encrypted mesh</span>
                        </button>
                    </div>
                    <p className="sync-hint">Your data is encrypted and distributed across 3 independent cloud layers for maximum resilience.</p>
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
