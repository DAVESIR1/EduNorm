import React, { useState, useRef } from 'react';
import { CERTIFICATE_TEMPLATES, getTemplatesByCategory, getCategories, getTemplateById } from './CertificateTemplates';
import { Award, Printer as PrinterIcon, X, Download } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import './CertificateGenerator.css';

export default function CertificateGenerator({ isOpen, onClose, student, students = [], schoolName, schoolLogo }) {
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [selectedTemplate, setSelectedTemplate] = useState(CERTIFICATE_TEMPLATES[0]);
    const [title, setTitle] = useState(CERTIFICATE_TEMPLATES[0].defaultTitle);
    const [achievement, setAchievement] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [signatory, setSignatory] = useState('');
    const [eventName, setEventName] = useState('');
    const [signatureImage, setSignatureImage] = useState(null);
    const [certMode, setCertMode] = useState('individual'); // 'individual' or 'group'
    const [helperTeachers, setHelperTeachers] = useState([]);
    const [newHelper, setNewHelper] = useState('');
    const certificateRef = useRef(null);
    const signatureInputRef = useRef(null);

    const categories = getCategories();
    const filteredTemplates = getTemplatesByCategory(selectedCategory);

    const handleTemplateSelect = (template) => {
        setSelectedTemplate(template);
        setTitle(template.defaultTitle);
    };

    // Handle signature image upload
    const handleSignatureUpload = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => setSignatureImage(ev.target.result);
            reader.readAsDataURL(file);
        }
    };

    // Helper teacher management
    const addHelper = () => {
        if (newHelper.trim() && !helperTeachers.includes(newHelper.trim())) {
            setHelperTeachers(prev => [...prev, newHelper.trim()]);
            setNewHelper('');
        }
    };
    const removeHelper = (name) => setHelperTeachers(prev => prev.filter(t => t !== name));

    if (!isOpen) return null;

    const handlePrint = () => {
        const printContent = certificateRef.current;
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Certificate - ${student?.studentFirstName || 'Student'}</title>
                    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Montserrat:wght@400;600&display=swap" rel="stylesheet">
                    <style>
                        @page {
                            size: A4 landscape;
                            margin: 15mm;
                        }
                        
                        body { 
                            margin: 0; 
                            padding: 0; 
                            font-family: 'Montserrat', sans-serif;
                            -webkit-print-color-adjust: exact;
                            print-color-adjust: exact;
                        }
                        
                        .certificate-print {
                            width: 100%;
                            max-width: 900px;
                            margin: 0 auto;
                            padding: 50px;
                            border: 12px ${selectedTemplate.borderStyle === 'double' ? 'double' : 'solid'} ${selectedTemplate.primaryColor};
                            background: ${selectedTemplate.background};
                            text-align: center;
                            position: relative;
                            box-sizing: border-box;
                        }
                        
                        .certificate-print::before {
                            content: '';
                            position: absolute;
                            inset: 8px;
                            border: 2px solid ${selectedTemplate.secondaryColor};
                            pointer-events: none;
                        }
                        
                        .cert-header { margin-bottom: 30px; }
                        .cert-icon { font-size: 60px; margin-bottom: 10px; }
                        .cert-category { 
                            font-size: 14px; 
                            text-transform: uppercase; 
                            letter-spacing: 4px; 
                            color: ${selectedTemplate.secondaryColor};
                            margin-bottom: 10px;
                        }
                        .cert-title { 
                            font-size: 42px; 
                            font-family: 'Playfair Display', serif;
                            color: ${selectedTemplate.primaryColor}; 
                            margin: 10px 0;
                            font-weight: 700;
                        }
                        .cert-school { 
                            font-size: 18px; 
                            color: #666; 
                            margin: 0;
                        }
                        .cert-body { margin: 50px 0; }
                        .presented-to { 
                            font-size: 16px; 
                            color: #888; 
                            font-style: italic;
                            margin-bottom: 15px;
                        }
                        .student-name { 
                            font-size: 36px; 
                            font-family: 'Playfair Display', serif;
                            font-weight: 700; 
                            color: ${selectedTemplate.primaryColor};
                            border-bottom: 3px solid ${selectedTemplate.secondaryColor};
                            display: inline-block;
                            padding: 10px 50px;
                            margin: 15px 0 25px;
                        }
                        .class-info { 
                            font-size: 16px; 
                            color: #666; 
                            margin-bottom: 20px;
                        }
                        .event-name {
                            font-size: 18px;
                            font-weight: 600;
                            color: ${selectedTemplate.secondaryColor};
                            margin-bottom: 15px;
                        }
                        .achievement-text { 
                            font-size: 18px; 
                            color: #444; 
                            line-height: 1.8;
                            max-width: 600px;
                            margin: 0 auto;
                        }
                        .cert-footer { 
                            display: flex; 
                            justify-content: space-between; 
                            align-items: flex-end;
                            margin-top: 60px;
                            padding-top: 30px;
                        }
                        .signature-block { text-align: center; }
                        .signature-line { 
                            width: 180px; 
                            border-top: 2px solid ${selectedTemplate.primaryColor}; 
                            margin: 0 auto 8px;
                        }
                        .signature-label { 
                            font-size: 14px; 
                            color: #666;
                            margin: 0;
                        }
                        .date-block { text-align: center; }
                        .cert-date { 
                            font-size: 16px; 
                            color: ${selectedTemplate.primaryColor};
                            font-weight: 600;
                        }
                        .cert-logo {
                            width: 80px;
                            height: 80px;
                            object-fit: contain;
                        }
                    </style>
                </head>
                <body>${printContent.innerHTML}</body>
            </html>
        `);
        printWindow.document.close();
        printWindow.print();
    };

    const handleDownloadPDF = async () => {
        const element = certificateRef.current;
        if (!element) return;

        try {
            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                allowTaint: true
            });
            const imgData = canvas.toDataURL('image/png');

            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: 'a4'
            });

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const imgWidth = canvas.width;
            const imgHeight = canvas.height;
            const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
            const x = (pdfWidth - imgWidth * ratio) / 2;
            const y = (pdfHeight - imgHeight * ratio) / 2;

            pdf.addImage(imgData, 'PNG', x, y, imgWidth * ratio, imgHeight * ratio);
            pdf.save(`Certificate_${student?.studentFirstName || student?.name || 'Student'}.pdf`);
        } catch (error) {
            console.error('PDF download failed:', error);
            alert('Failed to download PDF. Please try again.');
        }
    };

    const getStudentName = () => {
        if (!student) return 'Student Name';
        return [student.studentFirstName, student.studentMiddleName, student.studentLastName]
            .filter(Boolean)
            .join(' ') || student.name || 'Student Name';
    };

    if (!isOpen) return null;

    return (
        <div className="cert-gen-overlay" onClick={onClose}>
            <div className="cert-gen-modal" onClick={e => e.stopPropagation()}>
                <div className="cert-gen-header" style={{ background: `linear-gradient(135deg, ${selectedTemplate.primaryColor} 0%, ${selectedTemplate.secondaryColor} 100%)` }}>
                    <h2><Award size={24} className="header-icon" /> Certificate Generator</h2>
                    <span className="template-count">{CERTIFICATE_TEMPLATES.length} Templates</span>
                    <button className="close-btn" onClick={onClose}><X size={20} /></button>
                </div>

                <div className="cert-gen-content">
                    {/* Left: Settings */}
                    <div className="cert-gen-settings">
                        {/* Category Tabs */}
                        <div className="category-tabs">
                            {categories.map(cat => (
                                <button
                                    key={cat}
                                    className={`cat-tab ${selectedCategory === cat ? 'active' : ''}`}
                                    onClick={() => setSelectedCategory(cat)}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>

                        {/* Template Grid */}
                        <div className="template-scroll">
                            <div className="template-grid-new">
                                {filteredTemplates.map(template => (
                                    <button
                                        key={template.id}
                                        className={`template-card ${selectedTemplate.id === template.id ? 'active' : ''}`}
                                        onClick={() => handleTemplateSelect(template)}
                                        style={{
                                            '--card-color': template.primaryColor,
                                            '--card-bg': template.accentColor
                                        }}
                                    >
                                        <span className="template-emoji">{template.icon}</span>
                                        <span className="template-label">{template.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Form Fields */}
                        <div className="cert-form">
                            <div className="form-group">
                                <label>Certificate Title</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="Certificate of Achievement"
                                />
                            </div>

                            <div className="form-group">
                                <label>Event Name (optional)</label>
                                <input
                                    type="text"
                                    value={eventName}
                                    onChange={(e) => setEventName(e.target.value)}
                                    placeholder="Annual Day 2026"
                                />
                            </div>

                            <div className="form-group">
                                <label>Achievement / Reason</label>
                                <textarea
                                    value={achievement}
                                    onChange={(e) => setAchievement(e.target.value)}
                                    placeholder="For outstanding performance in..."
                                    rows={3}
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Date</label>
                                    <input
                                        type="date"
                                        value={date}
                                        onChange={(e) => setDate(e.target.value)}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Signatory</label>
                                    <input
                                        type="text"
                                        value={signatory}
                                        onChange={(e) => setSignatory(e.target.value)}
                                        placeholder="Principal"
                                    />
                                </div>
                            </div>

                            {/* Signature Upload */}
                            <div className="form-group">
                                <label>Signature Image (optional)</label>
                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    <button
                                        type="button"
                                        className="print-btn-new"
                                        style={{ fontSize: '12px', padding: '6px 12px' }}
                                        onClick={() => signatureInputRef.current?.click()}
                                    >
                                        📷 Upload Signature
                                    </button>
                                    {signatureImage && (
                                        <button
                                            type="button"
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: '#ef4444' }}
                                            onClick={() => setSignatureImage(null)}
                                        >
                                            ✕ Remove
                                        </button>
                                    )}
                                </div>
                                <input
                                    ref={signatureInputRef}
                                    type="file"
                                    accept="image/*"
                                    style={{ display: 'none' }}
                                    onChange={handleSignatureUpload}
                                />
                                {signatureImage && (
                                    <img src={signatureImage} alt="Signature" style={{ maxWidth: '120px', maxHeight: '40px', marginTop: '4px', border: '1px solid #e2e8f0', borderRadius: '4px' }} />
                                )}
                            </div>

                            {/* Group / Individual Mode */}
                            <div className="form-group">
                                <label>Certificate Mode</label>
                                <select
                                    value={certMode}
                                    onChange={(e) => setCertMode(e.target.value)}
                                    style={{ padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '13px' }}
                                >
                                    <option value="individual">Individual Student</option>
                                    <option value="group">Group / Class</option>
                                </select>
                            </div>

                            {/* Helper Teachers */}
                            <div className="form-group">
                                <label>Event Helper Teachers</label>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                    <input
                                        type="text"
                                        value={newHelper}
                                        onChange={(e) => setNewHelper(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addHelper())}
                                        placeholder="Teacher name"
                                        style={{ flex: 1 }}
                                    />
                                    <button type="button" className="print-btn-new" style={{ fontSize: '12px', padding: '6px 10px' }} onClick={addHelper}>+ Add</button>
                                </div>
                                {helperTeachers.length > 0 && (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
                                        {helperTeachers.map(t => (
                                            <span key={t} style={{
                                                display: 'inline-flex', alignItems: 'center', gap: '4px',
                                                background: '#f0fdf4', color: '#166534', padding: '3px 8px',
                                                borderRadius: '12px', fontSize: '11px', fontWeight: 600,
                                                border: '1px solid #bbf7d0'
                                            }}>
                                                {t}
                                                <button
                                                    type="button"
                                                    onClick={() => removeHelper(t)}
                                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontSize: '12px', padding: 0, lineHeight: 1 }}
                                                >−</button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="cert-action-btns">
                                <button className="print-btn-new" onClick={handlePrint}>
                                    <PrinterIcon size={20} />
                                    Print
                                </button>
                                <button className="print-btn-new download-btn" onClick={handleDownloadPDF}>
                                    <Download size={20} />
                                    Download PDF
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Right: Preview */}
                    <div className="cert-preview-container">
                        <div
                            ref={certificateRef}
                            className="certificate-print"
                            style={{
                                background: selectedTemplate.background,
                                borderColor: selectedTemplate.primaryColor,
                                '--primary': selectedTemplate.primaryColor,
                                '--secondary': selectedTemplate.secondaryColor
                            }}
                        >
                            <div className="cert-header">
                                {schoolLogo && <img src={schoolLogo} alt="Logo" className="cert-logo" />}
                                <div className="cert-icon">{selectedTemplate.icon}</div>
                                <div className="cert-category">{selectedTemplate.category}</div>
                                <h1 className="cert-title" style={{ color: selectedTemplate.primaryColor }}>{title}</h1>
                                <p className="cert-school">{schoolName || 'School Name'}</p>
                            </div>

                            <div className="cert-body">
                                <p className="presented-to">This certificate is proudly presented to</p>
                                <h2 className="student-name" style={{
                                    color: selectedTemplate.primaryColor,
                                    borderColor: selectedTemplate.secondaryColor
                                }}>
                                    {getStudentName()}
                                </h2>
                                <p className="class-info">Class: {student?.standard || 'N/A'}</p>
                                {eventName && <p className="event-name" style={{ color: selectedTemplate.secondaryColor }}>{eventName}</p>}
                                {achievement && <p className="achievement-text">{achievement}</p>}
                            </div>

                            <div className="cert-footer">
                                <div className="signature-block">
                                    {signatureImage ? (
                                        <img src={signatureImage} alt="Signature" style={{ maxWidth: '120px', maxHeight: '35px', objectFit: 'contain' }} />
                                    ) : (
                                        <div className="signature-line" style={{ borderColor: selectedTemplate.primaryColor }}></div>
                                    )}
                                    <p className="signature-label">Class Teacher</p>
                                </div>
                                <div className="date-block">
                                    <p className="cert-date" style={{ color: selectedTemplate.primaryColor }}>
                                        {new Date(date).toLocaleDateString('en-IN', {
                                            day: 'numeric',
                                            month: 'long',
                                            year: 'numeric'
                                        })}
                                    </p>
                                    {helperTeachers.length > 0 && (
                                        <p style={{ fontSize: '10px', color: '#888', marginTop: '4px' }}>
                                            Helpers: {helperTeachers.join(', ')}
                                        </p>
                                    )}
                                </div>
                                <div className="signature-block">
                                    <div className="signature-line" style={{ borderColor: selectedTemplate.primaryColor }}></div>
                                    <p className="signature-label">{signatory || 'Principal'}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
