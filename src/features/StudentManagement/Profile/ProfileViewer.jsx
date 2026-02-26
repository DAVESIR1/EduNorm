import React, { useState, useRef, useMemo, useEffect } from 'react';
import { X, Download, Printer, Image, Search, Plus, Minus, ChevronDown, Settings } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import ProfileCard from './ProfileCard';
import IdCard, { TEMPLATES, ID_CARD_FIELDS, DEFAULT_VISIBLE_FIELDS } from './IdCard';
import PrintFrame from '../../../components/Common/PrintFrame';
import TemplateSelector from './TemplateSelector';
import PrintPortal from '../../../components/Common/PrintPortal';
import DocumentPrintView from './DocumentPrintView';
import IdCardPrintDocument from './IdCardPrintDocument';
import './ProfileViewer.css';

// Paper size configurations with cards per page
const PAPER_SIZES = {
    a4: { name: 'A4', width: 210, height: 297, cols: 2, rows: 5, cards: 10 },
    letter: { name: 'Letter', width: 216, height: 279, cols: 2, rows: 5, cards: 10 },
    legal: { name: 'Legal', width: 216, height: 356, cols: 2, rows: 6, cards: 12 },
    a5: { name: 'A5', width: 148, height: 210, cols: 1, rows: 3, cards: 3 }
};

export default function ProfileViewer({
    isOpen,
    onClose,
    students,
    standards,
    schoolName,
    settings,
    schoolLogo,
    schoolContact
}) {
    const [selectedStandard, setSelectedStandard] = useState('');
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [template, setTemplate] = useState('classic');
    const [idCardTemplate, setIdCardTemplate] = useState('classic-elegant');
    const [viewMode, setViewMode] = useState('profile'); // 'profile' or 'idcard'
    const [paperSize, setPaperSize] = useState('a4');
    const [batchMode, setBatchMode] = useState(false);
    const [selectedGrNumbers, setSelectedGrNumbers] = useState([]);
    const [grSearchQuery, setGrSearchQuery] = useState('');
    const [visibleIdFields, setVisibleIdFields] = useState(DEFAULT_VISIBLE_FIELDS);
    const [showOptionsMenu, setShowOptionsMenu] = useState(false);
    const [showBackSide, setShowBackSide] = useState(false);
    const [showFieldCustomizer, setShowFieldCustomizer] = useState(false);
    const [isPrinting, setIsPrinting] = useState(false);
    const profileRef = useRef(null);
    const idCardRef = useRef(null);
    const batchPrintRef = useRef(null);
    const optionsMenuRef = useRef(null); // Ref for options menu
    const fieldCustomizerRef = useRef(null); // Ref for field customizer

    // Close Menus on Click Outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            // Close Options Menu
            if (optionsMenuRef.current && !optionsMenuRef.current.contains(event.target)) {
                setShowOptionsMenu(false);
            }
            // Close Field Customizer
            if (fieldCustomizerRef.current && !fieldCustomizerRef.current.contains(event.target)) {
                setShowFieldCustomizer(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Auto-select if only one student (Student View)
    useEffect(() => {
        if (students.length === 1) {
            const t = setTimeout(() => {
                setSelectedStandard(students[0].standard);
                setSelectedStudent(students[0]);
            }, 0);
            return () => clearTimeout(t);
        }
    }, [students]);

    // Calculate filtered students (needs to be before useMemo that depends on it)
    const filteredStudents = useMemo(() => {
        return selectedStandard
            ? students.filter(s => s.standard === selectedStandard)
            : students;
    }, [selectedStandard, students]);

    // Get students by GR numbers for batch printing
    const batchStudents = useMemo(() => {
        return selectedGrNumbers
            .map(gr => students.find(s => s.grNo === gr))
            .filter(Boolean);
    }, [selectedGrNumbers, students]);

    // Filter students for GR search
    const grSearchResults = useMemo(() => {
        if (!grSearchQuery.trim()) return [];
        const query = grSearchQuery.toLowerCase();
        return filteredStudents
            .filter(s =>
                s.grNo?.toLowerCase().includes(query) ||
                (s.name || s.nameEnglish || '').toLowerCase().includes(query)
            )
            .slice(0, 10);
    }, [grSearchQuery, filteredStudents]);

    if (!isOpen) return null;

    const addToGrSelection = (grNo) => {
        if (!selectedGrNumbers.includes(grNo)) {
            setSelectedGrNumbers([...selectedGrNumbers, grNo]);
        }
        setGrSearchQuery('');
    };

    const removeFromGrSelection = (grNo) => {
        setSelectedGrNumbers(selectedGrNumbers.filter(g => g !== grNo));
    };

    const handlePrint = () => {
        // Add print class to body for print-specific styles
        document.body.classList.add('printing-profile');
        window.print();
        // Remove class after print dialog closes
        setTimeout(() => {
            document.body.classList.remove('printing-profile');
        }, 1000);
    };

    const handleDownloadPDF = async () => {
        const element = batchMode && batchStudents.length > 0
            ? batchPrintRef.current
            : (viewMode === 'idcard' ? idCardRef.current : profileRef.current);
        if (!element) return;

        const canvas = await html2canvas(element, {
            scale: 2,
            useCORS: true,
            allowTaint: true
        });
        const imgData = canvas.toDataURL('image/png');

        const paper = PAPER_SIZES[paperSize];
        const pdf = new jsPDF({
            orientation: paper.width > paper.height ? 'landscape' : 'portrait',
            unit: 'mm',
            format: [paper.width, paper.height]
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        const imgWidth = canvas.width;
        const imgHeight = canvas.height;
        const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);

        pdf.addImage(imgData, 'PNG', 0, 0, imgWidth * ratio, imgHeight * ratio);
        pdf.save(`${batchMode ? 'ID_Cards_Batch' : (viewMode === 'idcard' ? 'ID_Card' : 'Profile')}_${selectedStudent?.name || 'Student'}.pdf`);
    };

    const handleDownloadImage = async () => {
        const element = batchMode && batchStudents.length > 0
            ? batchPrintRef.current
            : (viewMode === 'idcard' ? idCardRef.current : profileRef.current);
        if (!element) return;

        const canvas = await html2canvas(element, {
            scale: 2,
            useCORS: true,
            allowTaint: true
        });
        const link = document.createElement('a');
        link.download = `${batchMode ? 'ID_Cards_Batch' : (viewMode === 'idcard' ? 'ID_Card' : 'Profile')}_${selectedStudent?.name || 'Student'}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    };

    const paper = PAPER_SIZES[paperSize];
    const maxCardsPerPage = paper.cards;

    return (
        <div className="profile-viewer-overlay animate-fade-in" onClick={onClose}>
            <div className="profile-viewer-container" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="profile-viewer-header no-print">
                    <h2 className="display-font gradient-text">
                        {viewMode === 'idcard' ? '🪪 ID Card' : '👤 Profile'}
                    </h2>
                    <div className="header-actions">
                        <button className="btn btn-ghost btn-icon btn-sm" onClick={onClose}>
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Controls */}
                <div className="profile-controls no-print">
                    {/* Hide selection controls if only one student (Student Logged In) */}
                    {students.length > 1 && (
                        <>
                            <div className="control-group">
                                <label>Standard:</label>
                                <select
                                    className="input-field"
                                    value={selectedStandard}
                                    onChange={(e) => {
                                        setSelectedStandard(e.target.value);
                                        setSelectedStudent(null);
                                        setSelectedGrNumbers([]);
                                    }}
                                >
                                    <option value="">All Standards</option>
                                    {standards.map(std => (
                                        <option key={std.id} value={std.id}>{std.name}</option>
                                    ))}
                                </select>
                            </div>

                            {!batchMode && (
                                <div className="control-group">
                                    <label>Student:</label>
                                    <select
                                        className="input-field"
                                        value={selectedStudent?.id || ''}
                                        onChange={(e) => {
                                            const student = filteredStudents.find(s => s.id == e.target.value);
                                            setSelectedStudent(student);
                                        }}
                                    >
                                        <option value="">Select Student</option>
                                        {filteredStudents.map(s => (
                                            <option key={s.id} value={s.id}>
                                                {s.name || s.nameEnglish} - GR: {s.grNo}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </>
                    )}

                    <div className="control-group view-toggle">
                        <button
                            className={`toggle-btn ${viewMode === 'profile' ? 'active' : ''}`}
                            onClick={() => { setViewMode('profile'); setBatchMode(false); }}
                        >
                            📋 Profile
                        </button>
                        <button
                            className={`toggle-btn ${viewMode === 'idcard' ? 'active' : ''}`}
                            onClick={() => setViewMode('idcard')}
                        >
                            🪪 ID
                        </button>
                    </div>

                    {/* Options Menu for ID Card */}
                    {viewMode === 'idcard' && (
                        <div className="options-menu-container" ref={optionsMenuRef}>
                            <button
                                className="btn btn-ghost btn-sm options-trigger"
                                onClick={() => setShowOptionsMenu(!showOptionsMenu)}
                            >
                                <Settings size={16} />
                                Options
                                <ChevronDown size={14} className={showOptionsMenu ? 'rotated' : ''} />
                            </button>
                            {showOptionsMenu && (
                                <div className="options-dropdown">
                                    <div className="option-item">
                                        <label>📄 Paper:</label>
                                        <select
                                            className="input-field input-sm"
                                            value={paperSize}
                                            onChange={(e) => setPaperSize(e.target.value)}
                                        >
                                            {Object.entries(PAPER_SIZES).map(([key, size]) => (
                                                <option key={key} value={key}>
                                                    {size.name} ({size.cards})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="option-item">
                                        <label>🎨 Template:</label>
                                        <select
                                            className="input-field input-sm"
                                            value={idCardTemplate}
                                            onChange={(e) => setIdCardTemplate(e.target.value)}
                                        >
                                            {TEMPLATES.map(t => (
                                                <option key={t.id} value={t.id}>
                                                    {t.icon} {t.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="option-item">
                                        <label className="checkbox-label">
                                            <input
                                                type="checkbox"
                                                checked={batchMode}
                                                onChange={(e) => setBatchMode(e.target.checked)}
                                            />
                                            🔢 Batch Print
                                        </label>
                                    </div>
                                    <div className="option-item">
                                        <label className="checkbox-label">
                                            <input
                                                type="checkbox"
                                                checked={showBackSide}
                                                onChange={(e) => setShowBackSide(e.target.checked)}
                                            />
                                            🔄 Print Back Side
                                        </label>
                                    </div>
                                    <div className="option-item">
                                        <button
                                            className="btn btn-ghost btn-sm full-width"
                                            onClick={() => {
                                                setShowFieldCustomizer(!showFieldCustomizer);
                                                setShowOptionsMenu(false); // Close parent menu
                                            }}
                                        >
                                            ⚙️ Customize Fields
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Field Customizer Popup */}
                {showFieldCustomizer && (
                    <div className="field-customizer-panel no-print" ref={fieldCustomizerRef}>
                        <div className="field-checkboxes">
                            {ID_CARD_FIELDS.map(field => (
                                <label key={field.id} className="field-checkbox">
                                    <input
                                        type="checkbox"
                                        checked={visibleIdFields.includes(field.id)}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setVisibleIdFields([...visibleIdFields, field.id]);
                                            } else {
                                                setVisibleIdFields(visibleIdFields.filter(f => f !== field.id));
                                            }
                                        }}
                                    />
                                    {field.label}
                                </label>
                            ))}
                        </div>
                    </div>
                )}

                {/* Batch Student Selection (Replaces Search) */}
                {viewMode === 'idcard' && batchMode && (
                    <div className="batch-selection-container no-print">
                        <div className="batch-toolbar">
                            <div className="search-box">
                                <Search size={16} />
                                <input
                                    type="text"
                                    placeholder="Search students..."
                                    value={grSearchQuery}
                                    onChange={(e) => setGrSearchQuery(e.target.value)}
                                />
                            </div>
                            <div className="selection-actions">
                                <button
                                    className="btn btn-xs btn-outline"
                                    onClick={() => setSelectedGrNumbers(filteredStudents.map(s => s.grNo))}
                                >
                                    Select All ({filteredStudents.length})
                                </button>
                                <button
                                    className="btn btn-xs btn-outline"
                                    onClick={() => setSelectedGrNumbers([])}
                                >
                                    Clear Selection
                                </button>
                                <button
                                    className="btn btn-xs btn-outline btn-error"
                                    onClick={() => {
                                        setBatchMode(false);
                                        setSelectedGrNumbers([]);
                                    }}
                                >
                                    Exit Batch
                                </button>
                                <span className="selection-count">
                                    {selectedGrNumbers.length} Selected
                                </span>
                            </div>
                        </div>

                        <div className="batch-grid-list">
                            {/* Filter based on search query if exists, else show all filteredStudents */}
                            {filteredStudents
                                .filter(s => !grSearchQuery ||
                                    (s.name && s.name.toLowerCase().includes(grSearchQuery.toLowerCase())) ||
                                    (s.nameEnglish && s.nameEnglish.toLowerCase().includes(grSearchQuery.toLowerCase())) ||
                                    (s.grNo && s.grNo.includes(grSearchQuery))
                                )
                                .map(s => (
                                    <label key={s.id} className={`batch-item ${selectedGrNumbers.includes(s.grNo) ? 'selected' : ''}`}>
                                        <input
                                            type="checkbox"
                                            checked={selectedGrNumbers.includes(s.grNo)}
                                            onChange={(e) => {
                                                if (e.target.checked) {
                                                    setSelectedGrNumbers(prev => [...prev, s.grNo]);
                                                } else {
                                                    setSelectedGrNumbers(prev => prev.filter(g => g !== s.grNo));
                                                }
                                            }}
                                        />
                                        <div className="batch-info">
                                            <div className="name">{s.name || s.nameEnglish}</div>
                                            <div className="meta">GR: {s.grNo} | Roll: {s.rollNo}</div>
                                        </div>
                                    </label>
                                ))}
                        </div>
                    </div>
                )}

                {/* Template Selector (only for full profile) */}
                {viewMode === 'profile' && (
                    <TemplateSelector
                        selected={template}
                        onSelect={setTemplate}
                    />
                )}



                {/* Profile/ID Card Display */}
                <div className="profile-display">
                    {/* Batch ID Card Print View */}
                    {viewMode === 'idcard' && batchMode && batchStudents.length > 0 ? (
                        <div
                            ref={batchPrintRef}
                            className={`id-card-print-sheet paper-${paperSize}`}
                        >
                            {batchStudents.map((student, idx) => (
                                <IdCard
                                    key={student.grNo || idx}
                                    student={student}
                                    schoolName={schoolName}
                                    schoolLogo={schoolLogo}
                                    schoolContact={schoolContact}
                                    schoolAddress={settings?.schoolAddress}
                                    template={idCardTemplate}
                                    visibleFields={visibleIdFields}
                                    backSide={showBackSide}
                                />
                            ))}
                        </div>
                    ) : selectedStudent ? (
                        viewMode === 'idcard' ? (
                            <div className="id-card-preview-wrap">
                                <IdCard
                                    ref={idCardRef}
                                    student={selectedStudent}
                                    schoolName={schoolName}
                                    schoolLogo={schoolLogo}
                                    schoolContact={schoolContact}
                                    schoolAddress={settings?.schoolAddress}
                                    template={idCardTemplate}
                                    visibleFields={visibleIdFields}
                                    backSide={showBackSide}
                                />
                            </div>
                        ) : (
                            <ProfileCard
                                ref={profileRef}
                                student={selectedStudent}
                                template={template}
                                schoolName={schoolName}
                                schoolLogo={schoolLogo}
                                schoolContact={schoolContact}
                            />
                        )
                    ) : (
                        <div className="no-selection">
                            <span className="empty-icon">👆</span>
                            <p>
                                {batchMode
                                    ? 'Search and select students by GR number above'
                                    : `Select a student to view their ${viewMode === 'idcard' ? 'ID Card' : 'profile'}`
                                }
                            </p>
                        </div>
                    )}
                </div>

                {/* Export Actions */}
                {(selectedStudent || (batchMode && batchStudents.length > 0)) && (
                    <div className="export-actions no-print">
                        <button className="btn btn-secondary" onClick={() => setIsPrinting(true)}>
                            <Printer size={18} />
                            Print
                        </button>
                        <button className="btn btn-primary" onClick={handleDownloadPDF}>
                            <Download size={18} />
                            Download PDF
                        </button>
                        <button className="btn btn-accent" onClick={handleDownloadImage}>
                            <Image size={18} />
                            Save as Image
                        </button>
                    </div>
                )}
            </div>

            {/* IN-PAGE PRINT OVERLAY (Replaces Portal) */}
            {/* IN-PAGE PRINT FRAME (Invisible) */}
            {isPrinting && (
                <PrintFrame
                    onAfterPrint={() => setIsPrinting(false)}
                    title={`Print_${viewMode}_${new Date().getTime()}`}
                >
                    <div className="print-content-root">
                        {viewMode === 'idcard' ? (
                            <IdCardPrintDocument
                                students={
                                    viewMode === 'idcard' && batchMode
                                        ? (selectedGrNumbers.length > 0
                                            ? batchStudents.filter(s => selectedGrNumbers.includes(s.grNo))
                                            : batchStudents)
                                        : [selectedStudent].filter(Boolean)
                                }
                                template={idCardTemplate}
                                visibleFields={visibleIdFields}
                                schoolName={schoolName}
                                schoolLogo={schoolLogo}
                                schoolContact={schoolContact}
                                schoolEmail={settings?.email}
                                schoolAddress={settings?.address || settings?.schoolAddress}
                            />
                        ) : (
                            <DocumentPrintView
                                student={selectedStudent}
                                schoolName={schoolName}
                                schoolLogo={schoolLogo}
                                schoolContact={schoolContact}
                                schoolEmail={settings?.email}
                            />
                        )}
                    </div>
                </PrintFrame>
            )}
        </div>
    );
}

// Force Rebuild 123
