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
    const [pageSize, setPageSize] = useState('A4');
    const [orientation, setOrientation] = useState('landscape');
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

    const handlePrint = async () => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert('Please allow popups for this site to print certificates.');
            return;
        }

        printWindow.document.write(`
            <html>
                <body style="display:flex;justify-content:center;align-items:center;height:100vh;font-family:sans-serif;">
                    <h2>Generating High-Quality Print... Please Wait...</h2>
                </body>
            </html>
        `);

        // Prepare Background Image
        let bgImage = '';
        const isImage = selectedTemplate.backgroundImage ? true : false;

        if (selectedTemplate.backgroundImage) {
            try {
                const response = await fetch(selectedTemplate.backgroundImage);
                const blob = await response.blob();
                bgImage = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result);
                    reader.readAsDataURL(blob);
                });
            } catch (error) {
                bgImage = new URL(selectedTemplate.backgroundImage, window.location.origin).href;
            }
        } else {
            bgImage = selectedTemplate.background;
        }

        // Calculate Dimensions (Standard real-world sizes in mm)
        const pageDims = {
            'A4': { w: 297, h: 210 },       // International Standard
            'Letter': { w: 279.4, h: 215.9 }, // US Standard (8.5 x 11 in)
            'Legal': { w: 355.6, h: 215.9 },  // Legal (8.5 x 14 in)
            'Diploma11x14': { w: 355.6, h: 279.4 }, // Large Diploma (11 x 14 in)
            'Frame8x10': { w: 254, h: 203.2 } // Standard Frame (8 x 10 in)
        };
        const dim = pageDims[pageSize] || pageDims['A4'];
        const width = orientation === 'landscape' ? dim.w : dim.h;
        const height = orientation === 'landscape' ? dim.h : dim.w;

        const printContent = certificateRef.current;
        const fontLink = "https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=Dancing+Script:wght@400;700&family=Great+Vibes&family=Lato:wght@400;700&family=Lora:ital,wght@0,400;0,700;1,400&family=Merriweather:wght@300;700&family=Montserrat:wght@400;700&family=Oswald:wght@400;700&family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Roboto:wght@400;700&display=swap";

        const printHTML = `
            <!DOCTYPE html>
            <html>
                <head>
                    <title>Certificate - ${student?.studentFirstName || 'Student'}</title>
                    <link href="${fontLink}" rel="stylesheet">
                    <style>
                        @page {
                            size: ${pageSize} ${orientation};
                            margin: 0;
                        }
                        
                        body { 
                            margin: 0; 
                            padding: 0; 
                            font-family: ${selectedTemplate.fontFamily || "'Montserrat', sans-serif"};
                            -webkit-print-color-adjust: exact;
                            print-color-adjust: exact;
                            background: white;
                        }
                        
                        .print-container {
                            width: ${width}mm;
                            height: ${height}mm;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            box-sizing: border-box;
                            overflow: hidden; /* Prevent spillover */
                        }

                        .certificate-print {
                            width: 100%;
                            height: 100%;
                            position: relative;
                            box-sizing: border-box;
                            border: 12px ${selectedTemplate.borderStyle === 'double' ? 'double' : 'solid'} ${selectedTemplate.primaryColor};
                            /* Gradient fallback if no image */
                            background: ${!isImage ? bgImage : 'white'} !important;
                            text-align: center;
                            display: flex;
                            flex-direction: column;
                            justify-content: center;
                            padding: 40px;
                            overflow: hidden;
                        }

                        /* 1. Background Image using img tag (see HTML below) */
                        
                        /* 2. Overlay Layer */
                        .bg-overlay {
                            position: absolute;
                            inset: 0;
                            background: ${selectedTemplate.backgroundOverlay || 'rgba(255, 255, 255, 0.85)'};
                            z-index: 1;
                        }

                        /* 3. Inner Border */
                        .inner-border {
                            position: absolute;
                            inset: 8px;
                            border: 2px solid ${selectedTemplate.secondaryColor};
                            pointer-events: none;
                            z-index: 2;
                        }

                        /* 4. Content Content */
                        .cert-content-layer {
                            position: relative;
                            z-index: 10;
                        }
                        
                        .cert-header { margin-bottom: 20px; }
                        .cert-icon { font-size: 50px; margin-bottom: 8px; }
                        .cert-category { 
                            font-size: 14px; 
                            text-transform: uppercase; 
                            letter-spacing: 4px; 
                            color: ${selectedTemplate.secondaryColor};
                            margin-bottom: 8px;
                        }
                        .cert-title { 
                            font-size: 42px; 
                            font-family: ${selectedTemplate.fontFamily || "'Playfair Display', serif"};
                            color: ${selectedTemplate.primaryColor}; 
                            margin: 10px 0;
                            font-weight: 700;
                            line-height: 1.2;
                        }
                        .cert-school { 
                            font-size: 18px; 
                            color: #666; 
                            margin: 0;
                        }
                        
                        .cert-body { margin: 30px 0; }
                        .presented-to { 
                            font-size: 16px; 
                            color: #888; 
                            font-style: italic;
                            margin-bottom: 10px;
                        }
                        .student-name { 
                            font-size: 48px; 
                            font-family: ${selectedTemplate.fontFamily || "'Playfair Display', serif"};
                            font-weight: 700; 
                            color: ${selectedTemplate.primaryColor};
                            border-bottom: 3px solid ${selectedTemplate.secondaryColor};
                            display: inline-block;
                            padding: 5px 40px;
                            margin: 10px 0 20px;
                            white-space: nowrap;
                        }
                        .class-info { 
                            font-size: 16px; 
                            color: #666; 
                            margin-bottom: 15px;
                        }
                        .event-name {
                            font-size: 20px;
                            font-weight: 600;
                            color: ${selectedTemplate.secondaryColor};
                            margin-bottom: 15px;
                        }
                        .achievement-text { 
                            font-size: 18px; 
                            color: #444; 
                            line-height: 1.6;
                            max-width: 80%;
                            margin: 0 auto;
                        }
                        
                        .cert-footer { 
                            display: flex; 
                            justify-content: space-between; 
                            align-items: flex-end;
                            margin-top: 40px;
                            padding-top: 20px;
                            width: 100%;
                        }
                        .signature-block { text-align: center; min-width: 150px; }
                        .signature-line { 
                            width: 100%; 
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

                        /* Hide original overlay elements */
                        .certificate-print::before, .certificate-print::after {
                            display: none;
                        }
                    </style>
                </head>
                <body>
                    <div class="print-container">
                        <div class="certificate-print">
                            <!-- 1. IMAGE TAG for Background (Zero issues with printing) -->
                            ${isImage ? `<img src="${bgImage}" style="position: absolute; top:0; left:0; width:100%; height:100%; object-fit: cover; z-index: 0;" />` : ''}

                            <!-- 2. Overlay Div -->
                            ${isImage ? `<div class="bg-overlay"></div>` : ''}

                            <!-- 3. Inner Border -->
                            <div class="inner-border"></div>
                            
                            <!-- 4. Content -->
                            <div class="cert-content-layer">
                                ${printContent.querySelector('.cert-header').outerHTML}
                                ${printContent.querySelector('.cert-body').outerHTML}
                                ${printContent.querySelector('.cert-footer').outerHTML}
                            </div>
                        </div>
                    </div>
                    <script>
                        window.onload = function() {
                            setTimeout(function() {
                                window.print();
                            }, 1000);
                        };
                    </script>
                </body>
            </html>
        `;

        printWindow.document.open();
        printWindow.document.write(printHTML);
        printWindow.document.close();
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

                            <div className="form-group">
                                <label>Print Settings</label>
                                <div className="form-row">
                                    <select
                                        value={pageSize}
                                        onChange={(e) => setPageSize(e.target.value)}
                                        style={{ padding: '10px', borderRadius: '10px', border: '1px solid #e0e0e0', fontSize: '0.9rem', width: '100%' }}
                                    >
                                        <option value="A4">A4 (Standard)</option>
                                        <option value="Letter">Letter (8.5" x 11")</option>
                                        <option value="Frame8x10">Frame (8" x 10")</option>
                                        <option value="Diploma11x14">Diploma (11" x 14")</option>
                                        <option value="Legal">Legal</option>
                                    </select>
                                    <select
                                        value={orientation}
                                        onChange={(e) => setOrientation(e.target.value)}
                                        style={{ padding: '10px', borderRadius: '10px', border: '1px solid #e0e0e0', fontSize: '0.9rem', width: '100%' }}
                                    >
                                        <option value="landscape">Landscape</option>
                                        <option value="portrait">Portrait</option>
                                    </select>
                                </div>
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
                                width: (orientation === 'landscape'
                                    ? ({ 'A4': 297, 'Letter': 279, 'Legal': 356, 'Frame8x10': 254, 'Diploma11x14': 356 }[pageSize] || 297)
                                    : ({ 'A4': 210, 'Letter': 216, 'Legal': 216, 'Frame8x10': 203, 'Diploma11x14': 279 }[pageSize] || 210)) * 2.4 + 'px',
                                height: (orientation === 'landscape'
                                    ? ({ 'A4': 210, 'Letter': 216, 'Legal': 216, 'Frame8x10': 203, 'Diploma11x14': 279 }[pageSize] || 210)
                                    : ({ 'A4': 297, 'Letter': 279, 'Legal': 356, 'Frame8x10': 254, 'Diploma11x14': 356 }[pageSize] || 297)) * 2.4 + 'px',
                                background: selectedTemplate.backgroundImage ? 'none' : selectedTemplate.background,
                                backgroundImage: selectedTemplate.backgroundImage ? `url('${selectedTemplate.backgroundImage}')` : 'none',
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                borderColor: selectedTemplate.primaryColor,
                                '--primary': selectedTemplate.primaryColor,
                                '--secondary': selectedTemplate.secondaryColor
                            }}
                        >
                            {/* Overlay for Preview */}
                            {selectedTemplate.backgroundImage && (
                                <div style={{
                                    position: 'absolute', inset: 0,
                                    background: selectedTemplate.backgroundOverlay || 'rgba(255, 255, 255, 0.85)',
                                    zIndex: 0
                                }} />
                            )}
                            <div style={{ position: 'relative', zIndex: 2 }}>
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
        </div>
    );
}
