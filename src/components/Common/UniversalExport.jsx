import React, { useState, useCallback, useRef } from 'react';
import './UniversalExport.css';

/**
 * Universal Export/Share component
 * Supports: PDF, Excel (CSV), TXT, JPEG export
 * Plus: Print preview, Email share, Download
 */
export default function UniversalExport({ data, title, columns, onClose }) {
    const [format, setFormat] = useState('pdf');
    const [paperSize, setPaperSize] = useState('a4');
    const [orientation, setOrientation] = useState('portrait');
    const [margins, setMargins] = useState('normal');
    const [includeHeader, setIncludeHeader] = useState(true);
    const [includeFooter, setIncludeFooter] = useState(true);
    const [exporting, setExporting] = useState(false);
    const [exportDone, setExportDone] = useState(false);
    const printRef = useRef(null);

    // Convert data to CSV
    const toCSV = useCallback(() => {
        if (!data || !data.length) return '';
        const cols = columns || Object.keys(data[0]);
        const header = cols.join(',');
        const rows = data.map(row =>
            cols.map(col => {
                const val = row[col] ?? '';
                return typeof val === 'string' && val.includes(',') ? `"${val}"` : val;
            }).join(',')
        );
        return [header, ...rows].join('\n');
    }, [data, columns]);

    // Convert data to TXT
    const toTXT = useCallback(() => {
        if (!data || !data.length) return '';
        const cols = columns || Object.keys(data[0]);
        const lines = data.map((row, i) => {
            const fields = cols.map(col => `${col}: ${row[col] ?? '—'}`).join(' | ');
            return `${i + 1}. ${fields}`;
        });
        return `${title || 'Export'}\n${'='.repeat(50)}\n${lines.join('\n')}`;
    }, [data, columns, title]);

    // Download file helper
    const downloadFile = (content, filename, mimeType) => {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    };

    // Export handler
    const handleExport = async () => {
        setExporting(true);
        try {
            const timestamp = new Date().toISOString().split('T')[0];
            const safeTitle = (title || 'export').replace(/[^a-zA-Z0-9]/g, '_');

            switch (format) {
                case 'csv':
                case 'excel':
                    downloadFile(toCSV(), `${safeTitle}_${timestamp}.csv`, 'text/csv;charset=utf-8;');
                    break;
                case 'txt':
                    downloadFile(toTXT(), `${safeTitle}_${timestamp}.txt`, 'text/plain;charset=utf-8;');
                    break;
                case 'pdf':
                    handlePrint();
                    break;
                case 'jpeg':
                    await exportAsImage();
                    break;
                default:
                    downloadFile(toCSV(), `${safeTitle}_${timestamp}.csv`, 'text/csv');
            }
            setExportDone(true);
            setTimeout(() => setExportDone(false), 3000);
        } catch (err) {
            console.error('Export failed:', err);
            alert('Export failed: ' + err.message);
        }
        setExporting(false);
    };

    // Print handler
    const handlePrint = () => {
        const printContent = generatePrintHTML();
        const printWindow = window.open('', '_blank', 'width=800,height=600');
        if (printWindow) {
            printWindow.document.write(printContent);
            printWindow.document.close();
            setTimeout(() => {
                printWindow.print();
                printWindow.close();
            }, 500);
        }
    };

    // Generate print-ready HTML
    const generatePrintHTML = () => {
        const cols = columns || (data?.length ? Object.keys(data[0]) : []);
        const marginMap = { none: '0', narrow: '10mm', normal: '20mm', wide: '30mm' };
        const marginValue = marginMap[margins] || '20mm';

        return `
<!DOCTYPE html>
<html>
<head>
<title>${title || 'Print'}</title>
<style>
    @page { size: ${paperSize} ${orientation}; margin: ${marginValue}; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a2e; }
    h1 { font-size: 20px; margin-bottom: 12px; color: #7C3AED; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th { background: #7C3AED; color: white; padding: 8px 10px; text-align: left; font-weight: 600; }
    td { padding: 6px 10px; border-bottom: 1px solid #e5e7eb; }
    tr:nth-child(even) { background: #f9fafb; }
    .footer { margin-top: 24px; font-size: 10px; color: #9ca3af; text-align: center; }
</style>
</head>
<body>
${includeHeader ? `<h1>${title || 'EduNorm Report'}</h1><p style="color:#6b7280;font-size:12px;">Generated: ${new Date().toLocaleString()}</p>` : ''}
<table>
    <thead><tr>${cols.map(c => `<th>${c}</th>`).join('')}</tr></thead>
    <tbody>
    ${(data || []).map(row =>
            `<tr>${cols.map(c => `<td>${row[c] ?? '—'}</td>`).join('')}</tr>`
        ).join('')}
    </tbody>
</table>
${includeFooter ? '<div class="footer">Generated by EduNorm — Smart School Management System</div>' : ''}
</body>
</html>`;
    };

    // Export as JPEG using canvas
    const exportAsImage = async () => {
        const printHTML = generatePrintHTML();
        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.left = '-9999px';
        iframe.style.width = '800px';
        iframe.style.height = '600px';
        document.body.appendChild(iframe);

        iframe.contentDocument.write(printHTML);
        iframe.contentDocument.close();

        await new Promise(r => setTimeout(r, 500));

        try {
            // Use html2canvas if available, else fallback to print
            if (window.html2canvas) {
                const canvas = await window.html2canvas(iframe.contentDocument.body);
                canvas.toBlob(blob => {
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${title || 'export'}.jpeg`;
                    a.click();
                    URL.revokeObjectURL(url);
                }, 'image/jpeg', 0.95);
            } else {
                // Fallback: just print
                handlePrint();
            }
        } finally {
            document.body.removeChild(iframe);
        }
    };

    // Share via email
    const handleEmailShare = () => {
        const body = toTXT();
        const subject = encodeURIComponent(title || 'EduNorm Export');
        const mailBody = encodeURIComponent(body.substring(0, 2000));
        window.open(`mailto:?subject=${subject}&body=${mailBody}`);
    };

    // Share via Web Share API
    const handleNativeShare = async () => {
        if (navigator.share) {
            try {
                const csvContent = toCSV();
                const blob = new Blob([csvContent], { type: 'text/csv' });
                const file = new File([blob], `${title || 'export'}.csv`, { type: 'text/csv' });
                await navigator.share({
                    title: title || 'EduNorm Export',
                    text: `${title} - ${data?.length || 0} records`,
                    files: [file]
                });
            } catch (err) {
                if (err.name !== 'AbortError') {
                    console.error('Share failed:', err);
                }
            }
        } else {
            handleEmailShare();
        }
    };

    // Copy to clipboard
    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(toTXT());
            setExportDone(true);
            setTimeout(() => setExportDone(false), 2000);
        } catch (err) {
            // Fallback
            const textarea = document.createElement('textarea');
            textarea.value = toTXT();
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            setExportDone(true);
            setTimeout(() => setExportDone(false), 2000);
        }
    };

    return (
        <div className="universal-export">
            <div className="export-header">
                <h3>📤 Export & Share</h3>
                {onClose && <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>}
            </div>

            {/* Format Selection */}
            <div className="export-section">
                <label className="section-label">Export Format</label>
                <div className="format-grid">
                    {[
                        { id: 'pdf', label: 'PDF', icon: '📄' },
                        { id: 'excel', label: 'Excel (CSV)', icon: '📊' },
                        { id: 'txt', label: 'Text', icon: '📝' },
                        { id: 'jpeg', label: 'Image (JPEG)', icon: '🖼️' }
                    ].map(f => (
                        <button
                            key={f.id}
                            className={`format-btn ${format === f.id ? 'active' : ''}`}
                            onClick={() => setFormat(f.id)}
                        >
                            <span className="format-icon">{f.icon}</span>
                            <span className="format-label">{f.label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Print Settings */}
            {(format === 'pdf' || format === 'jpeg') && (
                <div className="export-section">
                    <label className="section-label">Print Settings</label>
                    <div className="settings-row">
                        <div className="setting-group">
                            <label>Paper Size</label>
                            <select value={paperSize} onChange={e => setPaperSize(e.target.value)}>
                                <option value="a4">A4</option>
                                <option value="letter">Letter</option>
                                <option value="legal">Legal</option>
                                <option value="a3">A3</option>
                            </select>
                        </div>
                        <div className="setting-group">
                            <label>Orientation</label>
                            <select value={orientation} onChange={e => setOrientation(e.target.value)}>
                                <option value="portrait">Portrait</option>
                                <option value="landscape">Landscape</option>
                            </select>
                        </div>
                        <div className="setting-group">
                            <label>Margins</label>
                            <select value={margins} onChange={e => setMargins(e.target.value)}>
                                <option value="none">None</option>
                                <option value="narrow">Narrow</option>
                                <option value="normal">Normal</option>
                                <option value="wide">Wide</option>
                            </select>
                        </div>
                    </div>
                    <div className="settings-row">
                        <label className="checkbox-label">
                            <input type="checkbox" checked={includeHeader} onChange={e => setIncludeHeader(e.target.checked)} />
                            Include Header
                        </label>
                        <label className="checkbox-label">
                            <input type="checkbox" checked={includeFooter} onChange={e => setIncludeFooter(e.target.checked)} />
                            Include Footer
                        </label>
                    </div>
                </div>
            )}

            {/* Data Preview */}
            <div className="export-section">
                <label className="section-label">Preview ({data?.length || 0} records)</label>
                <div className="preview-table" ref={printRef}>
                    {data?.length > 0 ? (
                        <table>
                            <thead>
                                <tr>
                                    {(columns || Object.keys(data[0])).slice(0, 6).map((col, i) => (
                                        <th key={i}>{col}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {data.slice(0, 5).map((row, i) => (
                                    <tr key={i}>
                                        {(columns || Object.keys(data[0])).slice(0, 6).map((col, j) => (
                                            <td key={j}>{row[col] ?? '—'}</td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <p className="no-data">No data to export</p>
                    )}
                    {data?.length > 5 && <p className="more-rows">...and {data.length - 5} more rows</p>}
                </div>
            </div>

            {/* Action Buttons */}
            <div className="export-actions">
                <button
                    className="btn btn-primary btn-lg"
                    onClick={handleExport}
                    disabled={exporting || !data?.length}
                >
                    {exporting ? '⏳ Exporting...' : exportDone ? '✅ Done!' : `📥 Download ${format.toUpperCase()}`}
                </button>
                <button className="btn btn-outline" onClick={handlePrint} disabled={!data?.length}>
                    🖨️ Print
                </button>
                <button className="btn btn-outline" onClick={handleNativeShare} disabled={!data?.length}>
                    📤 Share
                </button>
                <button className="btn btn-outline" onClick={handleEmailShare} disabled={!data?.length}>
                    ✉️ Email
                </button>
                <button className="btn btn-outline" onClick={handleCopy} disabled={!data?.length}>
                    📋 Copy
                </button>
            </div>
        </div>
    );
}

export { UniversalExport };
