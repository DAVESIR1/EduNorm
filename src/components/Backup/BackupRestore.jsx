import React, { useState, useRef, useEffect } from 'react';
import {
    X, Download, Upload, Share2, Mail, Cloud,
    Smartphone, FileJson, FileSpreadsheet, RefreshCw
} from 'lucide-react';
import * as db from '../../services/database';
import { downloadBlankTemplate, exportToExcel, exportLedger, parseExcelFile } from '../../services/ExcelService';
import './BackupRestore.css';

export default function BackupRestore({
    isOpen,
    onClose,
    ledger = [],
    standards = [],
    selectedStandard,
    onImportComplete,
    initialTab = 'export'
}) {
    const [activeTab, setActiveTab] = useState(initialTab);
    const [importing, setImporting] = useState(false);
    const [importPreview, setImportPreview] = useState(null);
    const [importError, setImportError] = useState('');
    const fileInputRef = useRef(null);
    const restoreInputRef = useRef(null);

    // Update activeTab when initialTab changes (on open)
    useEffect(() => {
        if (isOpen) {
            setActiveTab(initialTab);
        }
    }, [isOpen, initialTab]);

    if (!isOpen) return null;

    // Export JSON
    const handleExportJSON = async () => {
        try {
            const allData = await db.exportAllData();
            const dataWithMeta = {
                ...allData,
                exportedAt: new Date().toISOString(),
                version: '1.0'
            };
            const blob = new Blob([JSON.stringify(dataWithMeta, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `edunorm_backup_${new Date().toISOString().split('T')[0]}.json`;
            link.click();
            URL.revokeObjectURL(url);
            alert('✅ JSON backup exported successfully!');
        } catch (error) {
            console.error('Export failed:', error);
            alert('❌ Export failed. Please try again.');
        }
    };

    // Export Excel
    const handleExportExcel = () => {
        if (ledger.length === 0) {
            alert('No data to export');
            return;
        }
        exportToExcel(ledger, 'student_data');
        alert('✅ Excel file exported successfully!');
    };

    // Export Ledger
    const handleExportLedger = () => {
        if (ledger.length === 0) {
            alert('No data to export');
            return;
        }
        exportLedger(ledger, selectedStandard || 'All');
        alert('✅ Ledger exported successfully!');
    };

    // Download blank template
    const handleDownloadTemplate = () => {
        downloadBlankTemplate(selectedStandard || 'Students');
        alert('✅ Blank template downloaded!');
    };

    // Native Share
    const handleNativeShare = async () => {
        try {
            const allData = await db.exportAllData();
            const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
            const file = new File([blob], 'edunorm_backup.json', { type: 'application/json' });

            if (navigator.share && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    title: 'EduNorm Backup',
                    text: 'Student data backup from EduNorm',
                    files: [file]
                });
            } else {
                // Fallback - show sharing options manually
                alert('Native sharing not supported. Please use Export options instead.');
            }
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('Share failed:', error);
                alert('Sharing failed. Please try Export options.');
            }
        }
    };

    // Email share
    const handleEmailShare = async () => {
        try {
            const allData = await db.exportAllData();
            const summary = `
EduNorm Backup Summary:
- Date: ${new Date().toLocaleString()}
- Total Students: ${allData.students?.length || 0}
- Standards: ${allData.standards?.map(s => s.name).join(', ') || 'None'}

Note: For full data, please use the JSON export feature and attach the file to your email.
            `.trim();

            const subject = encodeURIComponent('EduNorm Backup - ' + new Date().toLocaleDateString());
            const body = encodeURIComponent(summary);
            window.open(`mailto:?subject=${subject}&body=${body}`);
        } catch (error) {
            console.error('Email failed:', error);
        }
    };

    // Import Excel
    const handleImportExcel = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setImporting(true);
        setImportError('');
        setImportPreview(null);

        try {
            const students = await parseExcelFile(file);
            if (students.length === 0) {
                setImportError('No valid student data found in the file');
            } else {
                setImportPreview(students);
            }
        } catch (error) {
            setImportError(error.message || 'Failed to parse Excel file');
        } finally {
            setImporting(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    // Confirm import
    const handleConfirmImport = async () => {
        if (!importPreview || !selectedStandard) return;

        setImporting(true);
        try {
            for (const student of importPreview) {
                await db.addStudent({
                    ...student,
                    standard: selectedStandard
                });
            }
            alert(`✅ Successfully imported ${importPreview.length} students!`);
            setImportPreview(null);
            onImportComplete?.();
            onClose();
        } catch (error) {
            console.error('Import failed:', error);
            alert('❌ Import failed: ' + error.message);
        } finally {
            setImporting(false);
        }
    };

    // Restore from JSON
    const handleRestoreJSON = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!window.confirm('⚠️ This will replace existing data. Are you sure?')) {
            if (restoreInputRef.current) restoreInputRef.current.value = '';
            return;
        }

        setImporting(true);
        try {
            const text = await file.text();
            const data = JSON.parse(text);

            // Validate backup structure
            if (!data.students && !data.settings && !data.standards) {
                throw new Error('Invalid backup file format');
            }

            await db.importData(data);
            alert('✅ Database restored successfully! Please refresh the page.');
            window.location.reload();
        } catch (error) {
            console.error('Restore failed:', error);
            alert('❌ Restore failed: ' + error.message);
        } finally {
            setImporting(false);
            if (restoreInputRef.current) restoreInputRef.current.value = '';
        }
    };

    return (
        <div className="backup-modal-overlay" onClick={onClose}>
            <div className="backup-modal" onClick={e => e.stopPropagation()}>
                <div className="backup-header">
                    <h2>📦 Share / Export / Backup</h2>
                    <button className="btn btn-icon btn-ghost" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                {/* Tabs */}
                <div className="backup-tabs">
                    <button
                        className={`tab-btn ${activeTab === 'export' ? 'active' : ''}`}
                        onClick={() => setActiveTab('export')}
                    >
                        <Download size={16} />
                        Export
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'import' ? 'active' : ''}`}
                        onClick={() => setActiveTab('import')}
                    >
                        <Upload size={16} />
                        Import
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'share' ? 'active' : ''}`}
                        onClick={() => setActiveTab('share')}
                    >
                        <Share2 size={16} />
                        Share
                    </button>
                    <button
                        className={`tab-btn ${activeTab === 'restore' ? 'active' : ''}`}
                        onClick={() => setActiveTab('restore')}
                    >
                        <RefreshCw size={16} />
                        Restore
                    </button>
                </div>

                <div className="backup-content">
                    {/* Export Tab */}
                    {activeTab === 'export' && (
                        <div className="backup-section">
                            <h3>Export Options</h3>
                            <div className="backup-grid">
                                <button className="backup-option" onClick={handleExportJSON}>
                                    <FileJson size={32} />
                                    <span>JSON Backup</span>
                                    <small>Full database backup</small>
                                </button>
                                <button className="backup-option" onClick={handleExportExcel}>
                                    <FileSpreadsheet size={32} />
                                    <span>Excel Export</span>
                                    <small>Student data as Excel</small>
                                </button>
                                <button className="backup-option" onClick={handleExportLedger}>
                                    <FileSpreadsheet size={32} />
                                    <span>Register Export</span>
                                    <small>General register format</small>
                                </button>
                                <button className="backup-option" onClick={handleDownloadTemplate}>
                                    <Download size={32} />
                                    <span>Blank Template</span>
                                    <small>Empty Excel for data entry</small>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Import Tab */}
                    {activeTab === 'import' && (
                        <div className="backup-section">
                            <h3>Import from Excel</h3>
                            {!selectedStandard && (
                                <div className="warning-box">
                                    ⚠️ Please select a Standard from sidebar before importing
                                </div>
                            )}

                            <div className="import-area">
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".xlsx,.xls"
                                    onChange={handleImportExcel}
                                    style={{ display: 'none' }}
                                />
                                <button
                                    className="btn btn-primary btn-lg"
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={importing || !selectedStandard}
                                >
                                    <Upload size={20} />
                                    {importing ? 'Processing...' : 'Select Excel File'}
                                </button>
                                <p className="import-hint">
                                    Upload an Excel file with student data.
                                    Use "Blank Template" from Export to get the correct format.
                                </p>
                            </div>

                            {importError && (
                                <div className="error-box">{importError}</div>
                            )}

                            {importPreview && (
                                <div className="import-preview">
                                    <h4>Preview ({importPreview.length} students found)</h4>
                                    <div className="preview-table">
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th>GR No.</th>
                                                    <th>Name</th>
                                                    <th>Contact</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {importPreview.slice(0, 5).map((s, i) => (
                                                    <tr key={i}>
                                                        <td>{s.grNo || '-'}</td>
                                                        <td>{s.name || s.nameEnglish || '-'}</td>
                                                        <td>{s.contactNumber || '-'}</td>
                                                    </tr>
                                                ))}
                                                {importPreview.length > 5 && (
                                                    <tr>
                                                        <td colSpan={3}>... and {importPreview.length - 5} more</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="preview-actions">
                                        <button
                                            className="btn btn-ghost"
                                            onClick={() => setImportPreview(null)}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            className="btn btn-accent"
                                            onClick={handleConfirmImport}
                                            disabled={importing}
                                        >
                                            {importing ? 'Importing...' : `Import ${importPreview.length} Students`}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Share Tab */}
                    {activeTab === 'share' && (
                        <div className="backup-section">
                            <h3>Share Data</h3>
                            <div className="backup-grid">
                                <button className="backup-option" onClick={handleNativeShare}>
                                    <Smartphone size={32} />
                                    <span>Quick Share</span>
                                    <small>Bluetooth, Nearby, Apps</small>
                                </button>
                                <button className="backup-option" onClick={handleEmailShare}>
                                    <Mail size={32} />
                                    <span>Email</span>
                                    <small>Send via email</small>
                                </button>
                                <button className="backup-option" onClick={() => {
                                    handleExportJSON();
                                    alert('Save the JSON file to Google Drive / Dropbox manually');
                                }}>
                                    <Cloud size={32} />
                                    <span>Cloud Drive</span>
                                    <small>Save to Google Drive</small>
                                </button>
                            </div>
                            <p className="share-note">
                                💡 Tip: Export JSON first, then upload to your preferred cloud storage.
                            </p>
                        </div>
                    )}

                    {/* Restore Tab */}
                    {activeTab === 'restore' && (
                        <div className="backup-section">
                            <h3>Restore Database</h3>
                            <div className="warning-box">
                                ⚠️ Restoring will replace all existing data. Make a backup first!
                            </div>

                            <div className="import-area">
                                <input
                                    ref={restoreInputRef}
                                    type="file"
                                    accept=".json"
                                    onChange={handleRestoreJSON}
                                    style={{ display: 'none' }}
                                />
                                <button
                                    className="btn btn-warning btn-lg"
                                    onClick={() => restoreInputRef.current?.click()}
                                    disabled={importing}
                                >
                                    <RefreshCw size={20} />
                                    {importing ? 'Restoring...' : 'Restore from JSON Backup'}
                                </button>
                                <p className="import-hint">
                                    Select a previously exported JSON backup file to restore all data.
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
