import React, { useState, useRef } from 'react';
import { X, Download, Printer, Image, CreditCard, ChevronDown } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import ProfileCard from './ProfileCard';
import IdCard, { TEMPLATES } from './IdCard';
import TemplateSelector from './TemplateSelector';
import './ProfileViewer.css';

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
    const [idCardTemplate, setIdCardTemplate] = useState('classic-blue');
    const [viewMode, setViewMode] = useState('profile'); // 'profile' or 'idcard'
    const profileRef = useRef(null);
    const idCardRef = useRef(null);

    if (!isOpen) return null;

    const filteredStudents = selectedStandard
        ? students.filter(s => s.standard === selectedStandard)
        : students;

    const handlePrint = () => {
        window.print();
    };

    const handleDownloadPDF = async () => {
        const element = viewMode === 'idcard' ? idCardRef.current : profileRef.current;
        if (!element) return;

        const canvas = await html2canvas(element, { scale: 2 });
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
            orientation: viewMode === 'idcard' ? 'landscape' : 'portrait',
            unit: 'px',
            format: [canvas.width, canvas.height]
        });
        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
        pdf.save(`${viewMode === 'idcard' ? 'ID_Card' : 'Profile'}_${selectedStudent?.name || 'Student'}.pdf`);
    };

    const handleDownloadImage = async () => {
        const element = viewMode === 'idcard' ? idCardRef.current : profileRef.current;
        if (!element) return;

        const canvas = await html2canvas(element, { scale: 2 });
        const link = document.createElement('a');
        link.download = `${viewMode === 'idcard' ? 'ID_Card' : 'Profile'}_${selectedStudent?.name || 'Student'}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    };

    return (
        <div className="profile-viewer-overlay animate-fade-in" onClick={onClose}>
            <div className="profile-viewer-container" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="profile-viewer-header">
                    <h2 className="display-font gradient-text">
                        {viewMode === 'idcard' ? '🪪 Student ID Card' : '👤 Student Profile'}
                    </h2>
                    <button className="btn btn-ghost btn-icon" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                {/* Controls */}
                <div className="profile-controls">
                    <div className="control-group">
                        <label>Standard:</label>
                        <select
                            className="input-field"
                            value={selectedStandard}
                            onChange={(e) => {
                                setSelectedStandard(e.target.value);
                                setSelectedStudent(null);
                            }}
                        >
                            <option value="">All Standards</option>
                            {standards.map(std => (
                                <option key={std.id} value={std.id}>{std.name}</option>
                            ))}
                        </select>
                    </div>

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

                    <div className="control-group view-toggle">
                        <button
                            className={`toggle-btn ${viewMode === 'profile' ? 'active' : ''}`}
                            onClick={() => setViewMode('profile')}
                        >
                            📋 Full Profile
                        </button>
                        <button
                            className={`toggle-btn ${viewMode === 'idcard' ? 'active' : ''}`}
                            onClick={() => setViewMode('idcard')}
                        >
                            🪪 ID Card
                        </button>
                    </div>
                </div>

                {/* Template Selector (only for full profile) */}
                {viewMode === 'profile' && (
                    <TemplateSelector
                        selected={template}
                        onSelect={setTemplate}
                    />
                )}

                {/* ID Card Template Selector (15 styles) */}
                {viewMode === 'idcard' && (
                    <div className="id-template-selector">
                        <label className="template-label">Choose ID Card Style:</label>
                        <div className="id-template-grid">
                            {TEMPLATES.map(t => (
                                <button
                                    key={t.id}
                                    className={`id-template-btn ${idCardTemplate === t.id ? 'active' : ''}`}
                                    onClick={() => setIdCardTemplate(t.id)}
                                    title={t.name}
                                >
                                    <span className="template-icon">{t.icon}</span>
                                    <span className="template-name">{t.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Profile/ID Card Display */}
                <div className="profile-display">
                    {selectedStudent ? (
                        viewMode === 'idcard' ? (
                            <IdCard
                                ref={idCardRef}
                                student={selectedStudent}
                                schoolName={schoolName}
                                schoolLogo={schoolLogo}
                                schoolContact={schoolContact}
                                template={idCardTemplate}
                            />
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
                            <span className="empty-icon animate-float">👆</span>
                            <p>Select a student to view their {viewMode === 'idcard' ? 'ID Card' : 'profile'}</p>
                        </div>
                    )}
                </div>

                {/* Export Actions */}
                {selectedStudent && (
                    <div className="export-actions">
                        <button className="btn btn-secondary" onClick={handlePrint}>
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
        </div>
    );
}
