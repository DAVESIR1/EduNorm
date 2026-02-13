import React, { useState, useEffect, useRef } from 'react';
import * as db from '../../services/database';

/**
 * Q&A Chat Component
 * Students can ask questions to teachers with subject selection
 * Teachers see messages via notification and can reply
 */
export default function QAChat({ studentData, isTeacher = false, teacherName = '', onBack }) {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [subject, setSubject] = useState('');
    const [selectedTeacher, setSelectedTeacher] = useState('');
    const [teachers, setTeachers] = useState([]);
    const [sending, setSending] = useState(false);
    const chatEndRef = useRef(null);

    const subjects = [
        'Mathematics', 'Science', 'English', 'Hindi', 'Gujarati',
        'Social Science', 'Computer', 'Physical Education', 'Other'
    ];

    // Load teachers and messages
    useEffect(() => {
        const load = async () => {
            try {
                // Load teachers list
                const staffList = await db.getSetting('staff_list');
                if (staffList && Array.isArray(staffList)) {
                    setTeachers(staffList.map(s => s.name || s.teacherName).filter(Boolean));
                }

                // Load chat messages
                const chatKey = isTeacher
                    ? 'qa_chat_messages'
                    : `qa_chat_messages_${studentData?.id}`;
                const stored = await db.getSetting(chatKey);
                if (stored && Array.isArray(stored)) {
                    setMessages(stored);
                }
            } catch (e) {
                console.warn('QAChat: Failed to load data:', e);
            }
        };
        load();
    }, [studentData?.id, isTeacher]);

    // Auto-scroll to bottom
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (!newMessage.trim()) return;
        if (!isTeacher && !subject) {
            alert('Please select a subject');
            return;
        }

        setSending(true);
        const msg = {
            id: Date.now(),
            text: newMessage.trim(),
            subject: subject || 'Reply',
            from: isTeacher ? 'teacher' : 'student',
            senderName: isTeacher ? teacherName : (studentData?.name || 'Student'),
            teacherTo: selectedTeacher || '',
            studentId: studentData?.id,
            timestamp: new Date().toISOString(),
        };

        const updated = [...messages, msg];
        setMessages(updated);
        setNewMessage('');

        try {
            // Save for student
            await db.updateSetting(`qa_chat_messages_${studentData?.id}`, updated);
            // Save to global queue for teacher view
            const globalChat = (await db.getSetting('qa_chat_messages')) || [];
            await db.updateSetting('qa_chat_messages', [...globalChat, msg]);
        } catch (err) {
            console.error('QAChat: Failed to save message:', err);
        }
        setSending(false);
    };

    if (!studentData && !isTeacher) {
        return (
            <div style={{ padding: '20px', textAlign: 'center' }}>
                <p>Please login first to use Q&A Chat.</p>
                {onBack && <button className="btn btn-ghost" onClick={onBack}>← Back</button>}
            </div>
        );
    }

    return (
        <div style={{ padding: '16px', maxWidth: '600px', margin: '0 auto', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 200px)' }}>
            <div style={{ marginBottom: '12px' }}>
                <h2 style={{ fontSize: '1.2rem', margin: 0 }}>💬 Q&A Chat</h2>
                <p style={{ color: 'var(--gray-500)', fontSize: '0.8rem', margin: '2px 0 0' }}>
                    {isTeacher ? 'View and reply to student questions' : 'Ask your teacher a question'}
                </p>
            </div>

            {/* Messages */}
            <div style={{
                flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px',
                padding: '12px', background: 'var(--bg-secondary, #f8fafc)', borderRadius: '12px',
                border: '1px solid var(--border-color, #e2e8f0)', marginBottom: '12px'
            }}>
                {messages.length === 0 && (
                    <p style={{ textAlign: 'center', color: 'var(--gray-400)', padding: '40px 0', fontSize: '14px' }}>
                        {isTeacher ? 'No student questions yet.' : 'No messages yet. Ask your first question!'}
                    </p>
                )}
                {messages.map(msg => (
                    <div key={msg.id} style={{
                        alignSelf: msg.from === (isTeacher ? 'teacher' : 'student') ? 'flex-end' : 'flex-start',
                        maxWidth: '80%'
                    }}>
                        <div style={{
                            padding: '10px 14px', borderRadius: '14px', fontSize: '14px',
                            background: msg.from === 'student' ? '#ede9fe' : '#ecfdf5',
                            color: msg.from === 'student' ? '#6d28d9' : '#065f46',
                        }}>
                            <div style={{ fontSize: '10px', fontWeight: 700, marginBottom: '4px', opacity: 0.7 }}>
                                {msg.senderName} • {msg.subject}
                            </div>
                            {msg.text}
                        </div>
                        <div style={{ fontSize: '10px', color: 'var(--gray-400)', marginTop: '2px', textAlign: 'right' }}>
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                    </div>
                ))}
                <div ref={chatEndRef} />
            </div>

            {/* Input area */}
            {!isTeacher && (
                <div style={{ display: 'flex', gap: '6px', marginBottom: '8px', flexWrap: 'wrap' }}>
                    <select
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="input-field"
                        style={{ flex: 1, minWidth: '120px', padding: '8px', fontSize: '13px', borderRadius: '8px' }}
                    >
                        <option value="">Select Subject</option>
                        {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    {teachers.length > 0 && (
                        <select
                            value={selectedTeacher}
                            onChange={(e) => setSelectedTeacher(e.target.value)}
                            className="input-field"
                            style={{ flex: 1, minWidth: '120px', padding: '8px', fontSize: '13px', borderRadius: '8px' }}
                        >
                            <option value="">Any Teacher</option>
                            {teachers.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    )}
                </div>
            )}

            <div style={{ display: 'flex', gap: '8px' }}>
                <input
                    type="text"
                    className="input-field"
                    placeholder={isTeacher ? 'Type your reply...' : 'Type your question...'}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
                    style={{ flex: 1, padding: '10px 14px', borderRadius: '10px', fontSize: '14px' }}
                />
                <button
                    className="btn btn-primary"
                    onClick={handleSend}
                    disabled={sending || !newMessage.trim()}
                    style={{ padding: '10px 16px', borderRadius: '10px' }}
                >
                    {sending ? '⏳' : '📤'}
                </button>
            </div>

            {onBack && (
                <button className="btn btn-ghost" style={{ marginTop: '8px', fontSize: '13px' }} onClick={onBack}>
                    ← Back
                </button>
            )}
        </div>
    );
}
