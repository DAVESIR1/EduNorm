
import React, { useState } from 'react';
import { Download, Upload, Cloud, RefreshCw, X, FileJson, FileSpreadsheet, Share2 } from 'lucide-react';
import SyncBackupLogic from './logic.js';

/**
 * SOVEREIGN SYNC & BACKUP: VIEW
 */
export function SyncBackupView({ isOpen, onClose, ledger, selectedStandard, onImportComplete }) {
    const [activeTab, setActiveTab] = useState('cloud');
    const [syncing, setSyncing] = useState(false);
    const [importing, setImporting] = useState(false);

    if (!isOpen) return null;

    const handleSync = async () => {
        setSyncing(true);
        const res = await SyncBackupLogic.syncAll();
        alert(`Cloud Sync Complete: ${res.success} synced, ${res.failed} failed.`);
        setSyncing(false);
    };

    const handleRestore = async () => {
        const sid = prompt("Enter Student SID (Blind Index) to restore:");
        if (!sid) return;
        setSyncing(true);
        try {
            const data = await SyncBackupLogic.restoreFromCloud(sid);
            if (data) {
                alert(`✅ Successfully restored: ${data.name || 'Student Data'}`);
                onImportComplete?.();
            } else {
                alert("❌ Restore failed: Data not found in Sovereign Mesh.");
            }
        } catch (err) {
            alert("❌ Restoration error: " + err.message);
        } finally {
            setSyncing(false);
        }
    };

    const handleImport = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Use selectedStandard or prompt if missing
        let importStandard = selectedStandard;
        if (!importStandard) {
            importStandard = window.prompt("No class selected. Please enter a default Standard/Class for these students (e.g. '10-A'):", "");
            if (!importStandard) return;
        }

        setImporting(true);
        try {
            const students = await SyncBackupLogic.processExcelImport(file);
            if (students && students.length > 0) {
                // Ensure they have the correct standard
                const studentsToImport = students.map(s => ({
                    ...s,
                    standard: s.standard || importStandard
                }));

                const db = await import("../../services/database.js");
                await db.importAllData({ students: studentsToImport });

                alert(`✅ Successfully imported ${studentsToImport.length} students via Excel Smart-Merge.`);
                onImportComplete?.();
                window.location.reload();
            } else {
                alert("⚠ No student records found in the Excel file.");
            }
        } catch (err) {
            console.error("Excel Import Error:", err);
            alert("❌ Import failed: " + err.message);
        } finally {
            setImporting(false);
        }
    };

    return (
        <div className="sync-overlay" onClick={onClose}>
            <div className="sync-modal" onClick={e => e.stopPropagation()}>
                <header className="modal-header">
                    <div>
                        <h2>Data Sovereignty</h2>
                        <p className="subtitle">Universal Backups & Cloud Sync</p>
                    </div>
                    <button className="close-btn" onClick={onClose}><X /></button>
                </header>

                <nav className="sync-nav">
                    <button className={activeTab === 'cloud' ? 'active' : ''} onClick={() => setActiveTab('cloud')}><Cloud size={16} /> Cloud</button>
                    <button className={activeTab === 'local' ? 'active' : ''} onClick={() => setActiveTab('local')}><Download size={16} /> Local</button>
                    <button className={activeTab === 'transfer' ? 'active' : ''} onClick={() => setActiveTab('transfer')}><Share2 size={16} /> Transfer</button>
                </nav>

                <div className="sync-body">
                    {activeTab === 'cloud' && (
                        <div className="cloud-sync-area">
                            <div className="sync-card">
                                <div className="sync-status">
                                    <div className="pulse-dot"></div>
                                    <span>Real-time Protection Enabled</span>
                                </div>
                                <button className="btn btn-primary btn-block" onClick={handleSync} disabled={syncing}>
                                    <RefreshCw className={syncing ? 'spin' : ''} /> {syncing ? 'Syncing...' : 'Force Cloud Sync'}
                                </button>
                                <button
                                    className="btn btn-secondary btn-block"
                                    style={{ marginTop: '10px' }}
                                    onClick={handleRestore}
                                    disabled={syncing}
                                >
                                    <Download size={16} /> Restore from Cloud
                                </button>
                                <p className="hint">Pushes or retrieves data from encrypted R2, Mega & Firestore layers.</p>
                            </div>
                        </div>
                    )}

                    {activeTab === 'local' && (
                        <div className="local-backup-grid">
                            <button className="option-card" onClick={() => SyncBackupLogic.exportJSON()}>
                                <FileJson size={24} />
                                <span>Export JSON</span>
                            </button>
                            <button className="option-card" onClick={() => SyncBackupLogic.exportExcel(ledger)}>
                                <FileSpreadsheet size={24} />
                                <span>Export Excel</span>
                            </button>
                            <button className="option-card" onClick={() => SyncBackupLogic.downloadTemplate()}>
                                <Download size={24} />
                                <span>Template</span>
                            </button>
                            <label className="option-card">
                                <FileJson size={24} />
                                <span>JSON Restoration</span>
                                <input
                                    type="file"
                                    hidden
                                    onChange={async (e) => {
                                        const file = e.target.files[0];
                                        if (!file) return;
                                        if (!window.confirm("🧬 START SOVEREIGN JSON RESTORATION?\n\nThis will merge data from this file with zero-loss integrity. Proceed?")) return;

                                        setImporting(true);
                                        try {
                                            const db = await import("../../services/database.js");
                                            const text = await file.text();
                                            const data = JSON.parse(text);

                                            if (!data.students && !data.standards && !data.settings) {
                                                throw new Error("Invalid format: File does not contain students, standards, or settings.");
                                            }

                                            await db.importAllData(data);
                                            alert("✅ Restoration Success: Data merged via Zero-Loss Integrity.");
                                            onImportComplete?.();
                                            window.location.reload();
                                        } catch (err) {
                                            console.error("JSON Restoration Error:", err);
                                            alert("❌ Restoration failed: " + err.message);
                                        } finally {
                                            setImporting(false);
                                        }
                                    }}
                                    accept=".json"
                                />
                            </label>
                            <label className="option-card">
                                <Upload size={24} />
                                <span>Import Excel</span>
                                <input type="file" hidden onChange={handleImport} accept=".xlsx,.xls" />
                            </label>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default SyncBackupView;
