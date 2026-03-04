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

export function ProfileViewer({
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
        <div className="profile-viewer-overlay" style={{ backdropFilter: 'blur(12px)', backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 1000 }} onClick={onClose}>
            <div className="glass-panel profile-viewer-container" style={{
                maxWidth: '1200px',
                width: '95%',
                height: '92vh',
                padding: '0',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                border: '1px solid var(--glass-border)'
            }} onClick={e => e.stopPropagation()}>

                {/* Premium Header */}
                <div style={{
                    padding: '1.25rem 2rem',
                    background: 'var(--glass-bg-strong)',
                    borderBottom: '1px solid var(--glass-border)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    zIndex: 10
                }} className="no-print">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ padding: '8px', borderRadius: '12px', background: 'var(--primary)', color: 'white' }}>
                            {viewMode === 'idcard' ? <Plus size={20} /> : <Eye size={20} />}
                        </div>
                        <div>
                            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800' }} className="gradient-text">
                                {viewMode === 'idcard' ? 'ID Card Studio' : 'Student Dossier'}
                            </h2>
                            <p style={{ margin: 0, fontSize: '0.75rem', opacity: 0.6 }}>{selectedStudent?.name || 'Select a record'}</p>
                        </div>
                    </div>

                    <button className="btn-premium btn-premium-ghost" onClick={onClose} style={{ padding: '10px' }}>
                        <X size={20} />
                    </button>
                </div>

                {/* Dashboard Controls */}
                <div style={{
                    padding: '1rem 2rem',
                    background: 'var(--glass-bg)',
                    borderBottom: '1px solid var(--glass-border)',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '1.5rem',
                    alignItems: 'center'
                }} className="no-print">

                    {students.length > 1 && (
                        <div style={{ display: 'flex', gap: '1rem', flex: '1 1 auto' }}>
                            <div className="control-group" style={{ flex: 1, minWidth: '150px' }}>
                                <select
                                    className="input-field"
                                    style={{ width: '100%', borderRadius: '10px', padding: '8px 12px' }}
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
                                <div className="control-group" style={{ flex: 2, minWidth: '200px' }}>
                                    <select
                                        className="input-field"
                                        style={{ width: '100%', borderRadius: '10px', padding: '8px 12px' }}
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
                        </div>
                    )}

                    <div style={{
                        display: 'inline-flex',
                        background: 'rgba(0,0,0,0.1)',
                        padding: '4px',
                        borderRadius: '12px',
                        gap: '4px'
                    }}>
                        <button
                            className={`toggle-btn ${viewMode === 'profile' ? 'active' : ''}`}
                            onClick={() => { setViewMode('profile'); setBatchMode(false); }}
                            style={{
                                padding: '8px 16px',
                                borderRadius: '8px',
                                border: 'none',
                                background: viewMode === 'profile' ? 'var(--primary)' : 'transparent',
                                color: viewMode === 'profile' ? 'white' : 'inherit',
                                fontSize: '0.85rem',
                                fontWeight: '600',
                                transition: 'all 0.2s'
                            }}
                        >
                            📋 Profile
                        </button>
                        <button
                            className={`toggle-btn ${viewMode === 'idcard' ? 'active' : ''}`}
                            onClick={() => setViewMode('idcard')}
                            style={{
                                padding: '8px 16px',
                                borderRadius: '8px',
                                border: 'none',
                                background: viewMode === 'idcard' ? 'var(--primary)' : 'transparent',
                                color: viewMode === 'idcard' ? 'white' : 'inherit',
                                fontSize: '0.85rem',
                                fontWeight: '600',
                                transition: 'all 0.2s'
                            }}
                        >
                            🪪 ID Card
                        </button>
                    </div>

                    {viewMode === 'idcard' && (
                        <div style={{ position: 'relative' }} ref={optionsMenuRef}>
                            <button
                                className="btn-premium btn-premium-secondary"
                                onClick={() => setShowOptionsMenu(!showOptionsMenu)}
                                style={{ padding: '8px 14px' }}
                            >
                                <Settings size={16} />
                                <span>Export Options</span>
                                <ChevronDown size={14} style={{ transform: showOptionsMenu ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                            </button>
                            {showOptionsMenu && (
                                <div className="glass-panel" style={{
                                    position: 'absolute',
                                    top: '100%',
                                    right: 0,
                                    marginTop: '8px',
                                    width: '240px',
                                    padding: '1rem',
                                    zIndex: 100,
                                    border: '1px solid var(--glass-border)',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '12px'
                                }}>
                                    <div>
                                        <label style={{ fontSize: '0.75rem', opacity: 0.6, display: 'block', marginBottom: '4px' }}>Paper Size</label>
                                        <select
                                            className="input-field"
                                            style={{ width: '100%', fontSize: '0.8rem' }}
                                            value={paperSize}
                                            onChange={(e) => setPaperSize(e.target.value)}
                                        >
                                            {Object.entries(PAPER_SIZES).map(([key, size]) => (
                                                <option key={key} value={key}>{size.name} ({size.cards} cards)</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.75rem', opacity: 0.6, display: 'block', marginBottom: '4px' }}>Design Theme</label>
                                        <select
                                            className="input-field"
                                            style={{ width: '100%', fontSize: '0.8rem' }}
                                            value={idCardTemplate}
                                            onChange={(e) => setIdCardTemplate(e.target.value)}
                                        >
                                            {TEMPLATES.map(t => (
                                                <option key={t.id} value={t.id}>{t.icon} {t.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <hr style={{ border: 'none', borderTop: '1px solid var(--glass-border)', margin: '4px 0' }} />
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', cursor: 'pointer' }}>
                                        <input type="checkbox" checked={batchMode} onChange={(e) => setBatchMode(e.target.checked)} />
                                        <span>Multi-Entry Mode</span>
                                    </label>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', cursor: 'pointer' }}>
                                        <input type="checkbox" checked={showBackSide} onChange={(e) => setShowBackSide(e.target.checked)} />
                                        <span>Print Back Side</span>
                                    </label>
                                    <button
                                        className="btn-premium btn-premium-ghost"
                                        style={{ width: '100%', justifyContent: 'center', fontSize: '0.8rem' }}
                                        onClick={() => { setShowFieldCustomizer(!showFieldCustomizer); setShowOptionsMenu(false); }}
                                    >
                                        ⚙️ Customize Fields
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Main Viewport */}
                <div style={{ flex: 1, overflow: 'auto', background: 'var(--app-bg)', display: 'flex' }}>

                    {/* Sidebar for Batch Selection */}
                    {viewMode === 'idcard' && batchMode && (
                        <div style={{
                            width: '320px',
                            borderRight: '1px solid var(--glass-border)',
                            background: 'var(--glass-bg)',
                            display: 'flex',
                            flexDirection: 'column',
                            flexShrink: 0
                        }}>
                            <div style={{ padding: '1rem', borderBottom: '1px solid var(--glass-border)' }}>
                                <div className="search-box" style={{ background: 'rgba(0,0,0,0.05)', borderRadius: '10px', padding: '4px 12px' }}>
                                    <Search size={16} />
                                    <input
                                        type="text"
                                        placeholder="Filter list..."
                                        style={{ border: 'none', background: 'transparent', padding: '8px', fontSize: '0.9rem', width: '100%' }}
                                        value={grSearchQuery}
                                        onChange={(e) => setGrSearchQuery(e.target.value)}
                                    />
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
                                    <button className="btn-link" style={{ fontSize: '0.75rem' }} onClick={() => setSelectedGrNumbers(filteredStudents.map(s => s.grNo))}>All</button>
                                    <button className="btn-link" style={{ fontSize: '0.75rem' }} onClick={() => setSelectedGrNumbers([])}>None</button>
                                    <span style={{ fontSize: '0.75rem', fontWeight: '700' }}>{selectedGrNumbers.length} Selected</span>
                                </div>
                            </div>
                            <div style={{ flex: 1, overflow: 'auto', padding: '0.5rem' }}>
                                {filteredStudents
                                    .filter(s => !grSearchQuery || (s.name || '').toLowerCase().includes(grSearchQuery.toLowerCase()) || (s.grNo || '').includes(grSearchQuery))
                                    .map(s => (
                                        <div
                                            key={s.id}
                                            onClick={() => {
                                                if (selectedGrNumbers.includes(s.grNo)) setSelectedGrNumbers(prev => prev.filter(g => g !== s.grNo));
                                                else setSelectedGrNumbers(prev => [...prev, s.grNo]);
                                            }}
                                            style={{
                                                padding: '10px 12px',
                                                borderRadius: '10px',
                                                marginBottom: '4px',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '12px',
                                                background: selectedGrNumbers.includes(s.grNo) ? 'var(--primary-glow)' : 'transparent',
                                                border: '1px solid',
                                                borderColor: selectedGrNumbers.includes(s.grNo) ? 'var(--primary)' : 'transparent',
                                                transition: 'all 0.2s'
                                            }}
                                        >
                                            <input type="checkbox" checked={selectedGrNumbers.includes(s.grNo)} readOnly style={{ pointerEvents: 'none' }} />
                                            <div style={{ overflow: 'hidden' }}>
                                                <div style={{ fontSize: '0.85rem', fontWeight: '700', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{s.name || s.nameEnglish}</div>
                                                <div style={{ fontSize: '0.7rem', opacity: 0.6 }}>GR: {s.grNo} • Roll: {s.rollNo}</div>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    )}

                    {/* Content Area */}
                    <div style={{ flex: 1, padding: '2rem', display: 'flex', justifyContent: 'center' }}>
                        {viewMode === 'idcard' && batchMode && batchStudents.length > 0 ? (
                            <div ref={batchPrintRef} className={`id-card-print-sheet paper-${paperSize}`} style={{ background: 'white', padding: '10mm', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
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
                            <div style={{ width: '100%', maxWidth: viewMode === 'idcard' ? '450px' : '900px', animation: 'slideUp 0.4s ease' }}>
                                {viewMode === 'idcard' ? (
                                    <div className="glass-card" style={{ padding: '2rem', background: 'white' }}>
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
                                )}
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 0.5, gap: '1rem' }}>
                                <div style={{ fontSize: '4rem' }}>{batchMode ? '📚' : '👤'}</div>
                                <h3 style={{ margin: 0 }}>{batchMode ? 'Selection Required' : 'No Student Selected'}</h3>
                                <p>{batchMode ? 'Pick students from the sidebar to generate ID cards' : 'Choose a student from the dropdown to view details'}</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Actions */}
                <div style={{
                    padding: '1rem 2rem',
                    background: 'var(--glass-bg-strong)',
                    borderTop: '1px solid var(--glass-border)',
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '1rem'
                }} className="no-print">
                    {(selectedStudent || (batchMode && selectedGrNumbers.length > 0)) && (
                        <>
                            <button className="btn-premium btn-premium-secondary" onClick={() => setIsPrinting(true)}>
                                <Printer size={18} /> Print Now
                            </button>
                            <button className="btn-premium btn-premium-primary" onClick={handleDownloadPDF}>
                                <Download size={18} /> Export PDF
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Field Customizer Modal Overlay */}
            {showFieldCustomizer && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
                    <div className="glass-panel" ref={fieldCustomizerRef} style={{ maxWidth: '400px', width: '90%', padding: '2rem' }}>
                        <h3 style={{ margin: '0 0 1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}><Settings size={20} /> Field Customizer</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            {ID_CARD_FIELDS.map(field => (
                                <label key={field.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={visibleIdFields.includes(field.id)}
                                        onChange={(e) => {
                                            if (e.target.checked) setVisibleIdFields([...visibleIdFields, field.id]);
                                            else setVisibleIdFields(visibleIdFields.filter(f => f !== field.id));
                                        }}
                                    />
                                    {field.label}
                                </label>
                            ))}
                        </div>
                        <button className="btn-premium btn-premium-primary btn-block" style={{ marginTop: '2rem' }} onClick={() => setShowFieldCustomizer(false)}>Done</button>
                    </div>
                </div>
            )}
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
                                    batchMode
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

export default ProfileViewer;
