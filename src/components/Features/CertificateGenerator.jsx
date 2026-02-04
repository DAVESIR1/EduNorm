import React, { useState, useRef } from 'react';
import { CERTIFICATE_TEMPLATES, getTemplatesByCategory, getCategories, getTemplateById } from './CertificateTemplates';
import { Award, Printer, X, Download } from 'lucide-react';
import './CertificateGenerator.css';

export default function CertificateGenerator({ isOpen, onClose, student, schoolName, schoolLogo }) {
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [selectedTemplate, setSelectedTemplate] = useState(CERTIFICATE_TEMPLATES[0]);
    const [title, setTitle] = useState(CERTIFICATE_TEMPLATES[0].defaultTitle);
    const [achievement, setAchievement] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [signatory, setSignatory] = useState('');
    const [eventName, setEventName] = useState('');
    const certificateRef = useRef(null);

    const categories = getCategories();
    const filteredTemplates = getTemplatesByCategory(selectedCategory);

    const handleTemplateSelect = (template) => {
        setSelectedTemplate(template);
        setTitle(template.defaultTitle);
    };

    if (!isOpen) return null;

    const handlePrint = () => {
        const printContent = certificateRef.current;
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <html>
                <head>
                    <title>Certificate - ${student?.studentFirstName || 'Student'}</title>
                    <style>
                        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&family=Montserrat:wght@400;600&display=swap');
                        
                        body { margin: 0; padding: 20px; font-family: 'Montserrat', sans-serif; }
                        
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

                            <button className="print-btn-new" onClick={handlePrint}>
                                <PrinterIcon size={20} />
                                Print Certificate
                            </button>
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
                                    <div className="signature-line" style={{ borderColor: selectedTemplate.primaryColor }}></div>
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
