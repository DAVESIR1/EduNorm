import React, { useState, useEffect } from 'react';
import { useUndo } from '../../contexts/UndoContext';
import * as db from '../../services/database';
import { SaveIcon, CalendarIcon, UsersIcon, PlusIcon, TrashIcon, ClockIcon, PrinterIcon, ShareIcon, DownloadIcon } from '../Icons/CustomIcons';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';
import './ClassManagement.css';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DEFAULT_PERIODS = 8;

const ClassManagement = ({ isTeacherView = false }) => {
    const [standards, setStandards] = useState([]);
    const [staffList, setStaffList] = useState([]);
    const [selectedStandard, setSelectedStandard] = useState(null);
    const [teacherMapping, setTeacherMapping] = useState({});
    const [timeTables, setTimeTables] = useState({});
    const [numPeriods, setNumPeriods] = useState(DEFAULT_PERIODS);
    const [saving, setSaving] = useState(false);
    const [orientation, setOrientation] = useState('horizontal'); // 'horizontal' or 'vertical'
    const { recordAction } = useUndo();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [stds, staff, mappingRaw, tablesRaw] = await Promise.all([
                db.getAllStandards(),
                db.getSetting('staff_info_list'),
                db.getSetting('class_teacher_mapping'),
                db.getSetting('class_time_tables')
            ]);
            setStandards(stds || []);
            setStaffList(staff || []);
            setTeacherMapping(mappingRaw || {});
            setTimeTables(tablesRaw || {});

            const tables = tablesRaw || {};
            const maxPeriods = Object.values(tables).reduce((max, stdTable) => {
                if (!stdTable || typeof stdTable !== 'object') return max;
                const stdMax = Object.values(stdTable).reduce((m, dayTable) => {
                    return Math.max(m, Array.isArray(dayTable) ? dayTable.length : 0);
                }, 0);
                return Math.max(max, stdMax);
            }, DEFAULT_PERIODS);
            setNumPeriods(maxPeriods);

            if (stds && stds.length > 0 && !selectedStandard) {
                setSelectedStandard(stds[0].id);
            }
        } catch (error) {
            console.error('Failed to load class management data:', error);
        }
    };

    const handleTeacherChange = (standardId, teacherId) => {
        setTeacherMapping(prev => ({
            ...prev,
            [standardId]: teacherId
        }));
    };

    const handleTimeTableChange = (standardId, day, periodIndex, field, value) => {
        setTimeTables(prev => {
            const standardTable = prev[standardId] || {};
            const dayTable = standardTable[day] || [];
            const newDayTable = [...dayTable];

            // Ensure array is long enough
            while (newDayTable.length <= periodIndex) {
                newDayTable.push({ subject: '', teacher: '', time: '' });
            }

            newDayTable[periodIndex] = {
                ...newDayTable[periodIndex],
                [field]: value
            };

            return {
                ...prev,
                [standardId]: {
                    ...standardTable,
                    [day]: newDayTable
                }
            };
        });
    };

    const handleAddPeriod = () => {
        setNumPeriods(prev => prev + 1);
    };

    const handleInsertRemnant = (atIndex, targetDay) => {
        setTimeTables(prev => {
            const standardTable = prev[selectedStandard] || {};
            const newStandardTable = { ...standardTable };

            DAYS.forEach(day => {
                const dayTable = [...(standardTable[day] || [])];
                // Fill gaps until atIndex
                while (dayTable.length < atIndex) {
                    dayTable.push({ subject: '', teacher: '', time: '' });
                }
                // Insert Remnant only for the target day
                dayTable.splice(atIndex, 0, {
                    subject: day === targetDay ? 'Remnant' : '',
                    teacher: '',
                    time: ''
                });
                newStandardTable[day] = dayTable;
            });

            return {
                ...prev,
                [selectedStandard]: newStandardTable
            };
        });
        setNumPeriods(prev => prev + 1);
    };

    const handleRemovePeriod = (atIndex) => {
        if (!confirm('Are you sure you want to remove this row?')) return;

        setTimeTables(prev => {
            const standardTable = prev[selectedStandard] || {};
            const newStandardTable = { ...standardTable };

            DAYS.forEach(day => {
                const dayTable = [...(standardTable[day] || [])];
                if (dayTable.length > atIndex) {
                    dayTable.splice(atIndex, 1);
                }
                newStandardTable[day] = dayTable;
            });

            return {
                ...prev,
                [selectedStandard]: newStandardTable
            };
        });
        setNumPeriods(prev => Math.max(0, prev - 1));
    };

    const handleDownload = async (format) => {
        const element = document.querySelector('.timetable-grid');
        if (!element) return;

        // Add a temporary class to body for print-style capture
        document.body.classList.add('printing-active-timetable');

        // Wait a bit for CSS to apply
        await new Promise(resolve => setTimeout(resolve, 100));

        try {
            if (format === 'image') {
                const canvas = await html2canvas(element, {
                    scale: 2,
                    backgroundColor: '#ffffff',
                    onclone: (clonedDoc) => {
                        // Ensure buttons are hidden in the clone even if something goes wrong
                        const buttons = clonedDoc.querySelectorAll('.add-period-btn, .delete-row-btn, .add-remnant-btn, .timetable-actions');
                        buttons.forEach(btn => btn.style.display = 'none');
                    }
                });
                const link = document.createElement('a');
                link.download = `Timetable_${selectedStandard}_${new Date().getTime()}.png`;
                link.href = canvas.toDataURL('image/png');
                link.click();
            } else if (format === 'pdf') {
                const canvas = await html2canvas(element, {
                    scale: 2,
                    backgroundColor: '#ffffff',
                    onclone: (clonedDoc) => {
                        const buttons = clonedDoc.querySelectorAll('.add-period-btn, .delete-row-btn, .add-remnant-btn, .timetable-actions');
                        buttons.forEach(btn => btn.style.display = 'none');
                    }
                });
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF(orientation === 'horizontal' ? 'l' : 'p', 'mm', 'a4');
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = pdf.internal.pageSize.getHeight();
                const imgWidth = pdfWidth - 20;
                const imgHeight = (canvas.height * imgWidth) / canvas.width;
                pdf.addImage(imgData, 'PNG', 10, 10, imgWidth, imgHeight);
                pdf.save(`Timetable_${selectedStandard}.pdf`);
            } else if (format === 'excel') {
                // Excel doesn't need HTML capture hacks as it's data-only
                const currentTable = timeTables[selectedStandard] || {};
                const data = [];

                // Get all days and max periods
                const allDays = DAYS;

                Array.from({ length: numPeriods }).forEach((_, pIdx) => {
                    const row = { Period: `Period ${pIdx + 1}` };
                    allDays.forEach(day => {
                        row[day] = currentTable[day]?.[pIdx]?.subject || '-';
                    });
                    data.push(row);
                });

                const ws = XLSX.utils.json_to_sheet(data);
                const wb = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(wb, ws, "Timetable");
                XLSX.writeFile(wb, `Timetable_${selectedStandard}.xlsx`);
            }
        } finally {
            document.body.classList.remove('printing-active-timetable');
        }
    };

    const handleShare = async (method) => {
        const shareData = {
            title: `Timetable for ${selectedStandard}`,
            text: `Check out the timetable for ${selectedStandard} on EduNorm.`,
            url: window.location.href
        };

        if (method === 'share' && navigator.share) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                console.error('Share failed:', err);
            }
        } else {
            // Email fallback
            const email = "";
            const subject = encodeURIComponent(shareData.title);
            const body = encodeURIComponent(shareData.text + "\n\n" + shareData.url);
            window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
        }
    };

    const handlePrint = (mode) => {
        const printContent = document.querySelector('.management-main');
        if (!printContent) return;

        const originalTitle = document.title;
        document.title = `Time_Table_${selectedStandard}_${mode}`;

        // Add printing class to body to scope CSS
        document.body.classList.add(`printing-active-${mode}`);
        window.print();
        document.body.classList.remove(`printing-active-timetable`, `printing-active-full`);
        document.title = originalTitle;
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await Promise.all([
                db.setSetting('class_teacher_mapping', teacherMapping),
                db.setSetting('class_time_tables', timeTables)
            ]);

            recordAction({
                type: 'UPDATE_CLASS_MANAGEMENT',
                description: 'Updated class assignments and time tables',
                undo: async () => {
                    // Logic to restore previous state if needed
                    // For now, simple success message is enough
                }
            });
            alert('Settings saved successfully!');
        } catch (error) {
            console.error('Failed to save class management:', error);
            alert('Failed to save settings.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="class-management">
            <div className="management-sidebar">
                <h3>🏫 Standards / Classes</h3>
                <div className="standards-list">
                    {standards.map(std => (
                        <button
                            key={std.id}
                            className={`std-item ${selectedStandard === std.id ? 'active' : ''}`}
                            onClick={() => setSelectedStandard(std.id)}
                        >
                            {std.name || std.id}
                        </button>
                    ))}
                    {standards.length === 0 && <p className="empty-msg">No standards created yet</p>}
                </div>
            </div>

            <div className="management-main">
                {selectedStandard ? (() => {
                    const currentTable = timeTables[selectedStandard] || {};
                    return (
                        <>
                            <div className="management-header">
                                <div className="header-left">
                                    <h2>Class Management: {selectedStandard}</h2>
                                </div>
                                <div className="header-actions">
                                    <div className="print-dropdown">
                                        <button className="action-btn menu-btn">
                                            <PrinterIcon size={18} /> Print
                                        </button>
                                        <div className="dropdown-content">
                                            <button onClick={() => handlePrint('timetable')}>Time Table Only</button>
                                            <button onClick={() => handlePrint('full')}>Time Table + Teacher</button>
                                        </div>
                                    </div>
                                    <div className="print-dropdown">
                                        <button className="action-btn menu-btn" title="Download">
                                            <DownloadIcon size={18} /> Download
                                        </button>
                                        <div className="dropdown-content">
                                            <button onClick={() => handleDownload('pdf')}>PDF Document</button>
                                            <button onClick={() => handleDownload('image')}>Image (PNG)</button>
                                            <button onClick={() => handleDownload('excel')}>Excel Sheet</button>
                                        </div>
                                    </div>
                                    <div className="print-dropdown">
                                        <button className="action-btn menu-btn" title="Share">
                                            <ShareIcon size={18} /> Share
                                        </button>
                                        <div className="dropdown-content">
                                            <button onClick={() => handleShare('share')}>Nearby / Bluetooth</button>
                                            <button onClick={() => handleShare('email')}>Email</button>
                                        </div>
                                    </div>
                                    <button
                                        className={`action-btn menu-btn ${orientation === 'vertical' ? 'active' : ''}`}
                                        onClick={() => setOrientation(orientation === 'horizontal' ? 'vertical' : 'horizontal')}
                                        title="Switch Orientation"
                                    >
                                        {orientation === 'horizontal' ? 'Horizontal' : 'Vertical'}
                                    </button>
                                    <button
                                        className="save-btn"
                                        onClick={handleSave}
                                        disabled={saving}
                                    >
                                        <SaveIcon size={18} />
                                        {saving ? 'Saving...' : 'Save Changes'}
                                    </button>
                                </div>
                            </div>

                            {/* Class Teacher Section */}
                            <section className="management-section teacher-section">
                                <div className="section-title">
                                    <UsersIcon size={20} />
                                    <h3>Class Teacher Assignment</h3>
                                </div>
                                <div className="teacher-selector">
                                    <label>Assign Class Teacher:</label>
                                    <select
                                        value={teacherMapping[selectedStandard] || ''}
                                        onChange={(e) => handleTeacherChange(selectedStandard, e.target.value)}
                                        className="input-field"
                                    >
                                        <option value="">Select a teacher...</option>
                                        {staffList.map(staff => (
                                            <option key={staff.id} value={staff.id}>
                                                {staff.data?.name} ({staff.data?.designation})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </section>

                            {/* Time Table Section */}
                            <section className="management-section">
                                <div className="section-title">
                                    <CalendarIcon size={20} />
                                    <h3>Class Time Table</h3>
                                </div>
                                <div className="timetable-container">
                                    <table className="timetable-grid">
                                        <thead>
                                            <tr>
                                                <th>{orientation === 'horizontal' ? 'Period' : 'Day'}</th>
                                                {orientation === 'horizontal' ? (
                                                    DAYS.map(day => <th key={day}>{day}</th>)
                                                ) : (
                                                    Array.from({ length: numPeriods }).map((_, i) => (
                                                        <th key={i}>Period {i + 1}</th>
                                                    ))
                                                )}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {orientation === 'horizontal' ? (
                                                Array.from({ length: numPeriods }).map((_, periodIdx) => (
                                                    <React.Fragment key={periodIdx}>
                                                        <tr className="period-row">
                                                            <td className="period-label">
                                                                <div className="period-header">
                                                                    <span>Period {periodIdx + 1}</span>
                                                                    <button
                                                                        className="delete-row-btn"
                                                                        onClick={() => handleRemovePeriod(periodIdx)}
                                                                        title="Delete Period"
                                                                    >
                                                                        <TrashIcon size={14} />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                            {DAYS.map((day) => {
                                                                const cellData = currentTable[day]?.[periodIdx] || { subject: '', teacher: '', time: '' };
                                                                return (
                                                                    <td key={day}>
                                                                        <div className="timetable-cell">
                                                                            <input
                                                                                type="text"
                                                                                placeholder="Subject"
                                                                                value={cellData.subject || ''}
                                                                                onChange={(e) => handleTimeTableChange(selectedStandard, day, periodIdx, 'subject', e.target.value)}
                                                                                className="cell-input"
                                                                            />
                                                                            <select
                                                                                value={cellData.teacher || ''}
                                                                                onChange={(e) => handleTimeTableChange(selectedStandard, day, periodIdx, 'teacher', e.target.value)}
                                                                                className="cell-select"
                                                                            >
                                                                                <option value="">Teacher...</option>
                                                                                {staffList.map(staff => (
                                                                                    <option key={staff.id} value={staff.id}>{staff.data?.name || staff.name}</option>
                                                                                ))}
                                                                            </select>
                                                                            <div className="cell-time">
                                                                                <ClockIcon size={12} />
                                                                                <input
                                                                                    type="text"
                                                                                    placeholder="Time"
                                                                                    value={cellData.time || ''}
                                                                                    onChange={(e) => handleTimeTableChange(selectedStandard, day, periodIdx, 'time', e.target.value)}
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                    </td>
                                                                );
                                                            })}
                                                        </tr>
                                                        <tr className="remnant-row">
                                                            <td className="remnant-label"></td>
                                                            {DAYS.map((day) => (
                                                                <td key={day} className="remnant-gap">
                                                                    <button
                                                                        className="add-remnant-btn"
                                                                        onClick={() => handleInsertRemnant(periodIdx, day)}
                                                                        title={`Add break after ${day}`}
                                                                    >
                                                                        <PlusIcon size={12} />
                                                                    </button>
                                                                </td>
                                                            ))}
                                                        </tr>
                                                    </React.Fragment>
                                                ))
                                            ) : (
                                                DAYS.map((day) => (
                                                    <tr key={day} className="period-row">
                                                        <td className="period-label">{day}</td>
                                                        {Array.from({ length: numPeriods }).map((_, periodIdx) => {
                                                            const cellData = currentTable[day]?.[periodIdx] || { subject: '', teacher: '', time: '' };
                                                            return (
                                                                <td key={periodIdx}>
                                                                    <div className="timetable-cell">
                                                                        <input
                                                                            type="text"
                                                                            placeholder="Subject"
                                                                            value={cellData.subject || ''}
                                                                            onChange={(e) => handleTimeTableChange(selectedStandard, day, periodIdx, 'subject', e.target.value)}
                                                                            className="cell-input"
                                                                        />
                                                                        <select
                                                                            value={cellData.teacher || ''}
                                                                            onChange={(e) => handleTimeTableChange(selectedStandard, day, periodIdx, 'teacher', e.target.value)}
                                                                            className="cell-select"
                                                                        >
                                                                            <option value="">Teacher...</option>
                                                                            {staffList.map(staff => (
                                                                                <option key={staff.id} value={staff.id}>{staff.data?.name || staff.name}</option>
                                                                            ))}
                                                                        </select>
                                                                        <div className="cell-time">
                                                                            <ClockIcon size={12} />
                                                                            <input
                                                                                type="text"
                                                                                placeholder="Time"
                                                                                value={cellData.time || ''}
                                                                                onChange={(e) => handleTimeTableChange(selectedStandard, day, periodIdx, 'time', e.target.value)}
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                            );
                                                        })}
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                <div className="timetable-actions">
                                    <button className="add-period-btn" onClick={handleAddPeriod}>
                                        <PlusIcon size={18} /> Add More Period
                                    </button>
                                </div>
                            </section>
                        </>
                    );
                })() : (
                    <div className="no-selection">
                        <CalendarIcon size={48} />
                        <p>Select a standard from the sidebar to manage its profile and time table.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ClassManagement;
