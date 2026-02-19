
import React, { useState, useMemo } from 'react';
import { FileSpreadsheet, X, Download, Share2, ChevronUp, ChevronDown, Eye, Edit3, Search } from 'lucide-react';
import { StudentLogic } from './logic.js';
import { SORT_FIELDS, DATA_FIELDS } from './types.js';

// Feature-specific components
import UniversalExport from '../../components/Common/UniversalExport';

/**
 * SOVEREIGN STUDENT MANAGEMENT: VIEW
 * Unified UI for Ledger and Search.
 */
export function StudentLedgerView({
    isOpen,
    onClose,
    students = [],
    onEditStudent,
    onUpdateStudent,
    onRenameField,
    fieldRenames = {},
    searchQuery,
    onSearch,
    isFullPage = false
}) {
    const [sort, setSort] = useState({ field: SORT_FIELDS.LEDGER_NO, dir: 'asc' });
    const [expandedRow, setExpandedRow] = useState(null);
    const [showExportPanel, setShowExportPanel] = useState(false);
    const [editingValue, setEditingValue] = useState(null); // { id: studentId, key: fieldKey, value: currentValue }
    const [editingLabel, setEditingLabel] = useState(null); // { key: fieldKey, label: currentLabel }

    // 1. Process Data (Memoized for performance)
    const processedData = useMemo(() => {
        let data = StudentLogic.applyLedgerNumbers(students);
        if (searchQuery) {
            data = StudentLogic.search(data, searchQuery);
        }
        return StudentLogic.sort(data, sort.field, sort.dir);
    }, [students, searchQuery, sort]);

    if (!isOpen && !isFullPage) return null;

    const handleSort = (field) => {
        setSort(prev => ({
            field,
            dir: (prev.field === field && prev.dir === 'asc') ? 'desc' : 'asc'
        }));
    };

    const handleDownloadCSV = () => {
        const csv = StudentLogic.generateCSV(processedData);
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `edunorm_ledger_${Date.now()}.csv`;
        a.click();
    };

    const stats = useMemo(() => {
        const total = students.length;
        if (total === 0) return null;

        const aadhar = students.filter(s => s.aadharNumber && s.aadharNumber.trim().length === 12).length;
        const bank = students.filter(s => s.bankAcNo && s.bankAcNo.trim().length > 5).length;
        const pen = students.filter(s => s.penNumber && s.penNumber.trim().length > 0).length;
        const photo = students.filter(s => s.studentPhoto).length;

        const standardsCount = new Set(students.map(s => s.standard)).size;

        const castes = {};
        students.forEach(s => {
            if (s.cast) castes[s.cast] = (castes[s.cast] || 0) + 1;
        });

        // Attendance stats logic: detect if data is percentage or day count
        const attendances = students.map(s => parseFloat(s.pastYearAttendance)).filter(v => !isNaN(v));
        let avgAttendance = 0;
        let isPercentage = true;

        if (attendances.length > 0) {
            const sum = attendances.reduce((a, b) => a + b, 0);
            avgAttendance = Math.round(sum / attendances.length);
            // If average is > 100, it's likely days present, not %
            if (avgAttendance > 100) isPercentage = false;
        }

        return {
            total,
            aadharPct: Math.round((aadhar / total) * 100),
            bankPct: Math.round((bank / total) * 100),
            penPct: Math.round((pen / total) * 100),
            photoPct: Math.round((photo / total) * 100),
            standardsCount,
            avgAttendance,
            isAttendancePercentage: isPercentage,
            castes: Object.entries(castes).sort((a, b) => b[1] - a[1]).slice(0, 3)
        };
    }, [students]);

    const handleValueUpdate = async (id, key, newValue) => {
        await onUpdateStudent?.(id, { [key]: newValue });
        setEditingValue(null);
    };

    const handleLabelUpdate = async (key, newLabel) => {
        await onRenameField?.(key, newLabel);
        setEditingLabel(null);
    };

    const content = (
        <div className={isFullPage ? "ledger-container-static" : "ledger-container"} onClick={e => e.stopPropagation()}>

            {/* Header Section */}
            <div className="ledger-header">
                <div className="ledger-title">
                    <FileSpreadsheet size={28} />
                    <h2 className="display-font gradient-text">Student Ledger</h2>
                    <span className="ledger-count badge badge-primary">{processedData.length} Records</span>
                </div>
                {!isFullPage && <button className="btn btn-ghost btn-icon" onClick={onClose}><X size={24} /></button>}
            </div>

            {/* Stats Summary Bar */}
            {stats && (
                <div className="ledger-stats-bar">
                    <div className="stat-card total">
                        <span className="stat-label">Total Students</span>
                        <div className="stat-value-group">
                            <span className="stat-value">{stats.total}</span>
                            <span className="stat-sub">{stats.standardsCount} Classes</span>
                        </div>
                    </div>
                    <div className="stat-card aadhar">
                        <span className="stat-label">Aadhar Coverage</span>
                        <span className="stat-value">{stats.aadharPct}%</span>
                        <div className="stat-progress-bg"><div className="stat-progress-fill" style={{ width: `${stats.aadharPct}%` }}></div></div>
                    </div>
                    <div className="stat-card bank">
                        <span className="stat-label">Bank Coverage</span>
                        <span className="stat-value">{stats.bankPct}%</span>
                        <div className="stat-progress-bg"><div className="stat-progress-fill" style={{ width: `${stats.bankPct}%` }}></div></div>
                    </div>
                    <div className="stat-card documents">
                        <span className="stat-label">PEN & Photo Sync</span>
                        <div className="stat-mini-grid">
                            <div className="stat-mini"><span>PEN:</span> <strong>{stats.penPct}%</strong></div>
                            <div className="stat-mini"><span>Photo:</span> <strong>{stats.photoPct}%</strong></div>
                        </div>
                    </div>
                    <div className="stat-card attendance">
                        <span className="stat-label">{stats.isAttendancePercentage ? 'Avg Attendance' : 'Avg Present Days'}</span>
                        <span className="stat-value">{stats.avgAttendance}{stats.isAttendancePercentage ? '%' : ''}</span>
                        <div className="stat-progress-bg">
                            <div
                                className="stat-progress-fill"
                                style={{
                                    width: `${Math.min(100, stats.isAttendancePercentage ? stats.avgAttendance : (stats.avgAttendance / 2.2))}%`,
                                    background: '#f59e0b'
                                }}
                            ></div>
                        </div>
                    </div>
                    <div className="stat-card castes">
                        <span className="stat-label">Top Categories</span>
                        <div className="stat-list">
                            {stats.castes.map(([name, count]) => (
                                <div key={name} className="stat-list-item">
                                    <span>{name}:</span>
                                    <strong>{count}</strong>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Toolbar */}
            <div className="ledger-actions">
                <div className="search-box">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Search records..."
                        value={searchQuery}
                        onChange={(e) => onSearch(e.target.value)}
                        className="search-input"
                    />
                </div>
                <div className="action-btns">
                    <button className="btn btn-secondary" onClick={handleDownloadCSV}>
                        <Download size={18} /> Export CSV
                    </button>
                    <button className="btn btn-outline" onClick={() => setShowExportPanel(!showExportPanel)}>
                        <Share2 size={18} /> Multi-Export
                    </button>
                </div>
            </div>

            {/* Export Panel Overlay */}
            {showExportPanel && (
                <UniversalExport
                    data={processedData}
                    title="Student Ledger"
                    columns={['ledgerNo', 'grNo', 'name', 'standard', 'rollNo', 'contactNumber']}
                    onClose={() => setShowExportPanel(false)}
                />
            )}

            {/* Main Table */}
            <div className="ledger-table-wrapper">
                <table className="ledger-table">
                    <thead>
                        <tr>
                            <th onClick={() => handleSort(SORT_FIELDS.GR_NO)}>GR No. {sort.field === SORT_FIELDS.GR_NO && (sort.dir === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}</th>
                            <th onClick={() => handleSort(SORT_FIELDS.NAME)}>Student Name {sort.field === SORT_FIELDS.NAME && (sort.dir === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}</th>
                            <th>Aadhar No.</th>
                            <th>Aadhar Name (English)</th>
                            <th>AAPAR ID</th>
                            <th>Contact No.</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {processedData.map((s, idx) => (
                            <React.Fragment key={s.id || idx}>
                                <tr className={idx % 2 === 0 ? 'even' : 'odd'}>
                                    <td className="gr-no">{s.grNo}</td>
                                    <td className="student-name">{s.name || s.nameEnglish || '-'}</td>
                                    <td>{s.aadharNumber || '-'}</td>
                                    <td>{s.studentAadharEnglishName || '-'}</td>
                                    <td>{s.aaparNumber || '-'}</td>
                                    <td>{s.contactNumber || '-'}</td>
                                    <td className="action-cell">
                                        <button className="action-btn view-btn" onClick={() => setExpandedRow(expandedRow === s.id ? null : s.id)} title="View All Details"><Eye size={16} /></button>
                                        <button className="action-btn edit-btn" onClick={() => onEditStudent?.(s)} title="Full Edit"><Edit3 size={16} /></button>
                                    </td>
                                </tr>
                                {expandedRow === s.id && (
                                    <tr className="expanded-row">
                                        <td colSpan="7">
                                            <div className="expanded-details-full">
                                                {DATA_FIELDS.flatMap(step => step.fields).map(field => {
                                                    const isEditingVal = editingValue?.id === s.id && editingValue?.key === field.key;
                                                    const isEditingLab = editingLabel?.key === field.key;
                                                    const displayLabel = fieldRenames[field.key] || field.label;

                                                    return (
                                                        <div key={field.key} className="detail-item">
                                                            <div className="detail-label-container">
                                                                {isEditingLab ? (
                                                                    <input
                                                                        type="text"
                                                                        value={editingLabel.label}
                                                                        autoFocus
                                                                        className="inline-edit-input"
                                                                        onChange={(e) => setEditingLabel({ ...editingLabel, label: e.target.value })}
                                                                        onBlur={() => handleLabelUpdate(field.key, editingLabel.label)}
                                                                        onKeyDown={(e) => e.key === 'Enter' && handleLabelUpdate(field.key, editingLabel.label)}
                                                                    />
                                                                ) : (
                                                                    <>
                                                                        <span className="detail-label">{displayLabel}:</span>
                                                                        <button className="btn-rename-pill" onClick={() => setEditingLabel({ key: field.key, label: displayLabel })}>
                                                                            <Edit3 size={10} /> Edit
                                                                        </button>
                                                                    </>
                                                                )}
                                                            </div>
                                                            <div className="detail-value-container">
                                                                {isEditingVal ? (
                                                                    <input
                                                                        type={field.type === 'number' ? 'number' : 'text'}
                                                                        value={editingValue.value}
                                                                        autoFocus
                                                                        className="inline-edit-input"
                                                                        onChange={(e) => setEditingValue({ ...editingValue, value: e.target.value })}
                                                                        onBlur={() => handleValueUpdate(s.id, field.key, editingValue.value)}
                                                                        onKeyDown={(e) => e.key === 'Enter' && handleValueUpdate(s.id, field.key, editingValue.value)}
                                                                    />
                                                                ) : (
                                                                    <span className="detail-value" onClick={() => setEditingValue({ id: s.id, key: field.key, value: s[field.key] || '' })}>
                                                                        {s[field.key] || <span className="placeholder">empty</span>}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>

        </div>
    );

    if (isFullPage) return content;

    return (
        <div className="ledger-overlay animate-fade-in" onClick={onClose}>
            {content}
        </div>
    );
}

export default StudentLedgerView;
