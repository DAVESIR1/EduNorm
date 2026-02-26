import React, { useState } from 'react';
import { Search, X, FileSpreadsheet, Download, ChevronUp, ChevronDown, Eye, Maximize2, Minimize2, Edit3 } from 'lucide-react';
import LedgerSearch from './LedgerSearch';
import './GeneralRegister.css';

export default function GeneralRegister({
    isOpen,
    onClose,
    ledger,
    onSearch,
    searchResults,
    searchQuery,
    onViewStudent,
    onEditStudent
}) {
    const [sortField, setSortField] = useState('ledgerNo');
    const [sortDir, setSortDir] = useState('asc');
    const [expandedRow, setExpandedRow] = useState(null);
    const [isMaximized, setIsMaximized] = useState(false);

    if (!isOpen) return null;

    const displayData = searchQuery ? searchResults : ledger;

    const sortedData = [...displayData].sort((a, b) => {
        let aVal = a[sortField];
        let bVal = b[sortField];

        if (typeof aVal === 'string') {
            aVal = aVal?.toLowerCase() || '';
            bVal = bVal?.toLowerCase() || '';
        }

        if (sortDir === 'asc') {
            return aVal > bVal ? 1 : -1;
        } else {
            return aVal < bVal ? 1 : -1;
        }
    });

    const handleSort = (field) => {
        if (sortField === field) {
            setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDir('asc');
        }
    };

    const SortIcon = ({ field }) => {
        if (sortField !== field) return null;
        return sortDir === 'asc' ? <ChevronUp size={14} /> : <ChevronDown size={14} />;
    };

    const handleExportCSV = () => {
        const headers = [
            'Ledger No.', 'GR No.', 'Name', 'Standard', 'Roll No.', 'Father Name', 'Mother Name',
            'Contact', 'Aadhar No.', 'Birthdate', 'Address', 'Bank Ac.', 'Ration No.'
        ];
        const rows = sortedData.map(s => [
            s.ledgerNo,
            s.grNo,
            s.name || s.nameEnglish,
            s.standard,
            s.rollNo,
            s.studentMiddleName,
            s.motherName,
            s.contactNumber,
            s.aadharNumber,
            s.studentBirthdate,
            s.address,
            s.bankAcNo,
            s.rationCardNumber
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(r => r.map(v => `"${v || ''}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'student_ledger.csv';
        link.click();
        URL.revokeObjectURL(url);
    };

    const toggleExpand = (id) => {
        setExpandedRow(expandedRow === id ? null : id);
    };

    return (
        <div className="ledger-overlay animate-fade-in" onClick={onClose}>
            <div
                className={`ledger-container ${isMaximized ? 'maximized' : ''}`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="ledger-header">
                    <div className="ledger-title">
                        <FileSpreadsheet size={28} />
                        <h2 className="display-font gradient-text">General Register</h2>
                        <span className="ledger-count badge badge-primary">{displayData.length} Students</span>
                    </div>
                    <div className="ledger-header-actions">
                        <button
                            className="btn btn-ghost btn-icon"
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsMaximized(!isMaximized);
                            }}
                            title={isMaximized ? 'Exit Fullscreen' : 'Fullscreen'}
                        >
                            {isMaximized ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                        </button>
                        <button className="btn btn-ghost btn-icon" onClick={onClose}>
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Search and Actions */}
                <div className="ledger-actions">
                    <LedgerSearch onSearch={onSearch} query={searchQuery} />
                    <button className="btn btn-secondary" onClick={handleExportCSV}>
                        <Download size={18} />
                        Export CSV
                    </button>
                </div>

                {/* Table */}
                <div className="ledger-table-wrapper">
                    <table className="ledger-table">
                        <thead>
                            <tr>
                                <th onClick={() => handleSort('ledgerNo')} className="sortable">
                                    No. <SortIcon field="ledgerNo" />
                                </th>
                                <th onClick={() => handleSort('grNo')} className="sortable">
                                    GR No. <SortIcon field="grNo" />
                                </th>
                                <th onClick={() => handleSort('name')} className="sortable">
                                    Student Name <SortIcon field="name" />
                                </th>
                                <th onClick={() => handleSort('standard')} className="sortable">
                                    Standard <SortIcon field="standard" />
                                </th>
                                <th onClick={() => handleSort('rollNo')} className="sortable">
                                    Roll No. <SortIcon field="rollNo" />
                                </th>
                                <th>Father Name</th>
                                <th>Mother Name</th>
                                <th>Contact</th>
                                <th>Aadhar No.</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedData.length > 0 ? (
                                sortedData.map((student, index) => {
                                    // Use ID if available, otherwise use index as fallback identifier
                                    const rowId = student.id || `row-${index}`;

                                    return (
                                        <React.Fragment key={rowId}>
                                            <tr
                                                className={`${index % 2 === 0 ? 'even' : 'odd'} ${expandedRow === rowId ? 'expanded' : ''}`}
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <td className="ledger-no">{student.ledgerNo}</td>
                                                <td className="gr-no">{student.grNo}</td>
                                                <td className="student-name">{student.name || student.nameEnglish || '-'}</td>
                                                <td>{student.standard}</td>
                                                <td>{student.rollNo}</td>
                                                <td>{student.studentMiddleName || '-'}</td>
                                                <td>{student.motherName || '-'}</td>
                                                <td>{student.contactNumber || '-'}</td>
                                                <td>{student.aadharNumber || '-'}</td>
                                                <td>
                                                    <div className="action-btns">
                                                        <button
                                                            className="action-btn view-btn"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                toggleExpand(rowId);
                                                            }}
                                                            title="View Details"
                                                        >
                                                            <Eye size={16} />
                                                        </button>
                                                        <button
                                                            className="action-btn edit-btn"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                if (onEditStudent) {
                                                                    onEditStudent(student);
                                                                    onClose();
                                                                }
                                                            }}
                                                            title="Edit Student"
                                                        >
                                                            <Edit3 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                            {expandedRow === rowId && (
                                                <tr className="expanded-row" onClick={(e) => e.stopPropagation()}>
                                                    <td colSpan="10">
                                                        <div className="expanded-details">
                                                            {/* Section 1: Basic Information */}
                                                            <div className="detail-section">
                                                                <h4>👤 Basic Information</h4>
                                                                <div className="detail-grid">
                                                                    <div className="detail-item"><span className="detail-label">GR No.</span><span className="detail-value">{student.grNo || '-'}</span></div>
                                                                    <div className="detail-item"><span className="detail-label">Name (Local)</span><span className="detail-value">{student.name || '-'}</span></div>
                                                                    <div className="detail-item"><span className="detail-label">Aapar ID Note</span><span className="detail-value">{student.aaparIdNote || '-'}</span></div>
                                                                    <div className="detail-item"><span className="detail-label">Name in English</span><span className="detail-value">{student.nameEnglish || '-'}</span></div>
                                                                    <div className="detail-item"><span className="detail-label">Udias English Name</span><span className="detail-value">{student.udiasEnglishName || '-'}</span></div>
                                                                    <div className="detail-item"><span className="detail-label">First Name</span><span className="detail-value">{student.studentFirstName || '-'}</span></div>
                                                                    <div className="detail-item"><span className="detail-label">Middle Name (Father)</span><span className="detail-value">{student.studentMiddleName || '-'}</span></div>
                                                                    <div className="detail-item"><span className="detail-label">Last Name (Surname)</span><span className="detail-value">{student.studentLastName || '-'}</span></div>
                                                                    <div className="detail-item"><span className="detail-label">Cast</span><span className="detail-value">{student.cast || '-'}</span></div>
                                                                </div>
                                                            </div>

                                                            {/* Section 2: Family Information */}
                                                            <div className="detail-section">
                                                                <h4>👨‍👩‍👧 Family Information</h4>
                                                                <div className="detail-grid">
                                                                    <div className="detail-item"><span className="detail-label">Mother Name</span><span className="detail-value">{student.motherName || '-'}</span></div>
                                                                    <div className="detail-item"><span className="detail-label">Father Aadhar Name</span><span className="detail-value">{student.fatherAadharName || '-'}</span></div>
                                                                    <div className="detail-item"><span className="detail-label">Mother Aadhar Name</span><span className="detail-value">{student.motherAadharName || '-'}</span></div>
                                                                    <div className="detail-item"><span className="detail-label">Father Aadhar Number</span><span className="detail-value">{student.fatherAadharNumber || '-'}</span></div>
                                                                    <div className="detail-item"><span className="detail-label">Mother Aadhar Number</span><span className="detail-value">{student.motherAadharNumber || '-'}</span></div>
                                                                    <div className="detail-item"><span className="detail-label">Contact Number</span><span className="detail-value">{student.contactNumber || '-'}</span></div>
                                                                    <div className="detail-item"><span className="detail-label">Father/Mother Death Note</span><span className="detail-value">{student.fatherMotherDeathNote || '-'}</span></div>
                                                                </div>
                                                            </div>

                                                            {/* Section 3: Identification */}
                                                            <div className="detail-section">
                                                                <h4>🪪 Identification</h4>
                                                                <div className="detail-grid">
                                                                    <div className="detail-item"><span className="detail-label">Student Birthdate</span><span className="detail-value">{student.studentBirthdate || '-'}</span></div>
                                                                    <div className="detail-item"><span className="detail-label">Aadhar Birthdate</span><span className="detail-value">{student.studentAadharBirthdate || '-'}</span></div>
                                                                    <div className="detail-item"><span className="detail-label">Udias Number</span><span className="detail-value">{student.udiasNumber || '-'}</span></div>
                                                                    <div className="detail-item"><span className="detail-label">Aadhar Number</span><span className="detail-value">{student.aadharNumber || '-'}</span></div>
                                                                    <div className="detail-item"><span className="detail-label">Aadhar English Name</span><span className="detail-value">{student.studentAadharEnglishName || '-'}</span></div>
                                                                    <div className="detail-item"><span className="detail-label">Aadhar Gujarati Name</span><span className="detail-value">{student.studentAadharGujaratiName || '-'}</span></div>
                                                                    <div className="detail-item"><span className="detail-label">PEN Number</span><span className="detail-value">{student.penNumber || '-'}</span></div>
                                                                    <div className="detail-item"><span className="detail-label">Aapar Number</span><span className="detail-value">{student.aaparNumber || '-'}</span></div>
                                                                </div>
                                                            </div>

                                                            {/* Section 4: Banking & Ration */}
                                                            <div className="detail-section">
                                                                <h4>🏦 Banking & Ration</h4>
                                                                <div className="detail-grid">
                                                                    <div className="detail-item"><span className="detail-label">Bank Ac. No.</span><span className="detail-value">{student.bankAcNo || '-'}</span></div>
                                                                    <div className="detail-item"><span className="detail-label">Name in Bank Ac.</span><span className="detail-value">{student.nameInBankAc || '-'}</span></div>
                                                                    <div className="detail-item"><span className="detail-label">Bank Branch</span><span className="detail-value">{student.bankBranchName || '-'}</span></div>
                                                                    <div className="detail-item"><span className="detail-label">Bank IFSC Code</span><span className="detail-value">{student.bankIfscCode || '-'}</span></div>
                                                                    <div className="detail-item"><span className="detail-label">Ration Card No.</span><span className="detail-value">{student.rationCardNumber || '-'}</span></div>
                                                                    <div className="detail-item"><span className="detail-label">Ration Card KYC</span><span className="detail-value">{student.rationCardKycStatus || '-'}</span></div>
                                                                    <div className="detail-item"><span className="detail-label">Student Ration No.</span><span className="detail-value">{student.studentRationNumber || '-'}</span></div>
                                                                    <div className="detail-item"><span className="detail-label">Ration Card Type</span><span className="detail-value">{student.rationCardType || '-'}</span></div>
                                                                </div>
                                                            </div>

                                                            {/* Section 5: Additional & Documents */}
                                                            <div className="detail-section">
                                                                <h4>📝 Additional Info & Admission</h4>
                                                                <div className="detail-grid">
                                                                    <div className="detail-item full-width"><span className="detail-label">Address</span><span className="detail-value">{student.address || '-'}</span></div>
                                                                    <div className="detail-item"><span className="detail-label">Birth Place</span><span className="detail-value">{student.birthPlace || '-'}</span></div>
                                                                    <div className="detail-item"><span className="detail-label">Birth Taluka</span><span className="detail-value">{student.birthTaluka || '-'}</span></div>
                                                                    <div className="detail-item"><span className="detail-label">Birth District</span><span className="detail-value">{student.birthDistrict || '-'}</span></div>
                                                                    <div className="detail-item"><span className="detail-label">Weight (kg)</span><span className="detail-value">{student.weight || '-'}</span></div>
                                                                    <div className="detail-item"><span className="detail-label">Height (cm)</span><span className="detail-value">{student.height || '-'}</span></div>
                                                                    <div className="detail-item"><span className="detail-label">Past Year Attendance</span><span className="detail-value">{student.pastYearAttendance ? `${student.pastYearAttendance}%` : '-'}</span></div>
                                                                    <div className="detail-item"><span className="detail-label">Past Year Exam Marks</span><span className="detail-value">{student.pastYearExamMarks || '-'}</span></div>
                                                                    <div className="detail-item"><span className="detail-label">Past Year %</span><span className="detail-value">{student.pastYearPercentage ? `${student.pastYearPercentage}%` : '-'}</span></div>
                                                                    <div className="detail-item"><span className="detail-label">School Admit Date</span><span className="detail-value">{student.schoolAdmitDate || '-'}</span></div>
                                                                    <div className="detail-item"><span className="detail-label">Class Admit Date</span><span className="detail-value">{student.classAdmitDate || '-'}</span></div>
                                                                    <div className="detail-item"><span className="detail-label">School Leave Date</span><span className="detail-value">{student.schoolLeaveDate || '-'}</span></div>
                                                                    <div className="detail-item full-width"><span className="detail-label">School Leave Note</span><span className="detail-value">{student.schoolLeaveNote || '-'}</span></div>
                                                                </div>
                                                            </div>

                                                            {/* Photo Section */}
                                                            {student.studentPhoto && (
                                                                <div className="detail-section">
                                                                    <h4>📷 Student Photo</h4>
                                                                    <div className="student-photo-preview">
                                                                        <img src={student.studentPhoto} alt="Student" />
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="10" className="empty-row">
                                        <span className="empty-icon">📋</span>
                                        <p>No students found</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
