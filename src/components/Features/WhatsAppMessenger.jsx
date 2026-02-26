import React, { useState, useMemo } from 'react';
import { MessageCircle, X, Send, Users, Check, AlertCircle, Copy, ExternalLink } from 'lucide-react';
import './WhatsAppMessenger.css';

export default function WhatsAppMessenger({ isOpen, onClose, students, schoolName }) {
    const [selectedStudents, setSelectedStudents] = useState([]);
    const [messageTemplate, setMessageTemplate] = useState('');
    const [customMessage, setCustomMessage] = useState('');
    const [sendProgress, setSendProgress] = useState({ current: 0, total: 0 });
    const [isSending, setIsSending] = useState(false);

    const messageTemplates = [
        { id: 'fee_reminder', label: 'Fee Reminder', template: 'Dear Parent,\n\nThis is a reminder that the fee for {studentName} (Class {class}) is pending.\n\nPlease pay at the earliest.\n\nThank you,\n{schoolName}' },
        { id: 'attendance', label: 'Attendance Notice', template: 'Dear Parent,\n\nYour ward {studentName} was absent from school today.\n\nPlease ensure regular attendance.\n\nRegards,\n{schoolName}' },
        { id: 'meeting', label: 'Parent Meeting', template: 'Dear Parent,\n\nYou are invited for a Parent-Teacher meeting for {studentName}.\n\nDate: [Date]\nTime: [Time]\n\nYour presence is requested.\n\n{schoolName}' },
        { id: 'result', label: 'Result Announcement', template: 'Dear Parent,\n\nThe examination results for {studentName} are ready.\n\nPlease visit the school to collect the report card.\n\nRegards,\n{schoolName}' },
        { id: 'holiday', label: 'Holiday Notice', template: 'Dear Parent,\n\nThis is to inform you that the school will remain closed on [Date] for [Occasion].\n\nRegular classes will resume on [Date].\n\n{schoolName}' },
        { id: 'event', label: 'School Event', template: 'Dear Parent,\n\nYour ward {studentName} is participating in [Event Name].\n\nDate: [Date]\nTime: [Time]\nVenue: [Venue]\n\nYour support is appreciated!\n\n{schoolName}' },
        { id: 'custom', label: 'Custom Message', template: '' }
    ];

    const handleTemplateSelect = (templateId) => {
        setMessageTemplate(templateId);
        const template = messageTemplates.find(t => t.id === templateId);
        if (template && templateId !== 'custom') {
            setCustomMessage(template.template.replace('{schoolName}', schoolName || 'School'));
        }
    };

    const toggleStudent = (studentId) => {
        setSelectedStudents(prev =>
            prev.includes(studentId)
                ? prev.filter(id => id !== studentId)
                : [...prev, studentId]
        );
    };

    const selectAll = () => {
        if (selectedStudents.length === students.length) {
            setSelectedStudents([]);
        } else {
            setSelectedStudents(students.map(s => s.id));
        }
    };

    const getPersonalizedMessage = (student) => {
        return customMessage
            .replace(/{studentName}/g, student.studentFirstName || student.name || 'Student')
            .replace(/{class}/g, student.standard || 'N/A')
            .replace(/{grNo}/g, student.grNo || 'N/A');
    };

    const getWhatsAppUrl = (phone, message) => {
        const cleanPhone = phone.replace(/\D/g, '');
        const fullPhone = cleanPhone.startsWith('91') ? cleanPhone : `91${cleanPhone}`;
        return `https://wa.me/${fullPhone}?text=${encodeURIComponent(message)}`;
    };

    const handleSendMessages = async () => {
        const selectedStudentData = students.filter(s => selectedStudents.includes(s.id));
        const studentsWithPhone = selectedStudentData.filter(s =>
            s.fatherMobile || s.motherMobile || s.guardianMobile || s.emergencyContact
        );

        if (studentsWithPhone.length === 0) {
            alert('No students with phone numbers selected!');
            return;
        }

        setIsSending(true);
        setSendProgress({ current: 0, total: studentsWithPhone.length });

        for (let i = 0; i < studentsWithPhone.length; i++) {
            const student = studentsWithPhone[i];
            const phone = student.fatherMobile || student.motherMobile || student.guardianMobile || student.emergencyContact;
            const message = getPersonalizedMessage(student);
            const url = getWhatsAppUrl(phone, message);

            // Open WhatsApp in new tab
            window.open(url, '_blank');

            setSendProgress({ current: i + 1, total: studentsWithPhone.length });

            // Small delay between opening tabs
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        setIsSending(false);
    };

    const copyMessage = () => {
        navigator.clipboard.writeText(customMessage);
        alert('Message copied to clipboard!');
    };

    const studentsWithPhones = useMemo(() => {
        return students.filter(s =>
            s.fatherMobile || s.motherMobile || s.guardianMobile || s.emergencyContact
        );
    }, [students]);

    if (!isOpen) return null;

    return (
        <div className="whatsapp-overlay" onClick={onClose}>
            <div className="whatsapp-modal" onClick={e => e.stopPropagation()}>
                <div className="whatsapp-header">
                    <h2><MessageCircle size={24} /> Bulk WhatsApp Messenger</h2>
                    <span className="student-count">{students.length} Students</span>
                    <button className="close-btn" onClick={onClose}><X size={20} /></button>
                </div>

                <div className="whatsapp-content">
                    <div className="messenger-grid">
                        {/* Left: Student Selection */}
                        <div className="student-selection">
                            <div className="section-header">
                                <h3><Users size={18} /> Select Recipients</h3>
                                <button className="select-all-btn" onClick={selectAll}>
                                    {selectedStudents.length === students.length ? 'Deselect All' : 'Select All'}
                                </button>
                            </div>

                            <div className="phone-info">
                                <AlertCircle size={14} />
                                <span>{studentsWithPhones.length} of {students.length} have phone numbers</span>
                            </div>

                            <div className="student-list">
                                {students.map(student => {
                                    const phone = student.fatherMobile || student.motherMobile || student.guardianMobile || student.emergencyContact;
                                    const hasPhone = !!phone;
                                    return (
                                        <div
                                            key={student.id}
                                            className={`student-item ${selectedStudents.includes(student.id) ? 'selected' : ''} ${!hasPhone ? 'no-phone' : ''}`}
                                            onClick={() => hasPhone && toggleStudent(student.id)}
                                        >
                                            <div className="check-box">
                                                {selectedStudents.includes(student.id) && <Check size={14} />}
                                            </div>
                                            <div className="student-info">
                                                <span className="student-name">
                                                    {student.studentFirstName || student.name || 'Unknown'}
                                                </span>
                                                <span className="student-class">{student.standard}</span>
                                            </div>
                                            <span className={`phone-status ${hasPhone ? 'has-phone' : ''}`}>
                                                {hasPhone ? phone : 'No phone'}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Right: Message Composer */}
                        <div className="message-composer">
                            <h3>Compose Message</h3>

                            {/* Template Selection */}
                            <div className="template-grid">
                                {messageTemplates.map(template => (
                                    <button
                                        key={template.id}
                                        className={`template-btn ${messageTemplate === template.id ? 'active' : ''}`}
                                        onClick={() => handleTemplateSelect(template.id)}
                                    >
                                        {template.label}
                                    </button>
                                ))}
                            </div>

                            {/* Variables Info */}
                            <div className="variables-info">
                                <span>Available variables:</span>
                                <code>{'{studentName}'}</code>
                                <code>{'{class}'}</code>
                                <code>{'{grNo}'}</code>
                            </div>

                            {/* Message Input */}
                            <div className="message-input">
                                <textarea
                                    value={customMessage}
                                    onChange={e => setCustomMessage(e.target.value)}
                                    placeholder="Type your message here..."
                                    rows={8}
                                />
                                <button className="copy-btn" onClick={copyMessage}>
                                    <Copy size={16} /> Copy
                                </button>
                            </div>

                            {/* Preview */}
                            {selectedStudents.length > 0 && students.find(s => s.id === selectedStudents[0]) && (
                                <div className="message-preview">
                                    <h4>Preview (for first selected student):</h4>
                                    <div className="preview-bubble">
                                        {getPersonalizedMessage(students.find(s => s.id === selectedStudents[0]))}
                                    </div>
                                </div>
                            )}

                            {/* Send Progress */}
                            {isSending && (
                                <div className="send-progress">
                                    <div className="progress-bar">
                                        <div
                                            className="progress-fill"
                                            style={{ width: `${(sendProgress.current / sendProgress.total) * 100}%` }}
                                        />
                                    </div>
                                    <span>Sending {sendProgress.current} of {sendProgress.total}...</span>
                                </div>
                            )}

                            {/* Send Button */}
                            <button
                                className="send-btn"
                                onClick={handleSendMessages}
                                disabled={selectedStudents.length === 0 || !customMessage || isSending}
                            >
                                <Send size={20} />
                                Send to {selectedStudents.length} Parents
                                <ExternalLink size={14} />
                            </button>

                            <p className="disclaimer">
                                This will open WhatsApp Web for each contact. Make sure pop-ups are allowed.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
