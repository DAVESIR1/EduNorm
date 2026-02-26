import React, { useState, useMemo } from 'react';
import { Clock, X, BookOpen, Award, TrendingUp, Calendar, Plus, Trash2, GraduationCap } from 'lucide-react';
import './ProgressTimeline.css';

export default function ProgressTimeline({ isOpen, onClose, student, onUpdateTimeline }) {
    const [milestones, setMilestones] = useState(student?.milestones || []);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newMilestone, setNewMilestone] = useState({
        title: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        type: 'academic',
        grade: ''
    });

    const milestoneTypes = [
        { value: 'academic', label: 'Academic Achievement', icon: '📚', color: '#6366f1' },
        { value: 'sports', label: 'Sports Achievement', icon: '🏆', color: '#10b981' },
        { value: 'arts', label: 'Arts & Culture', icon: '🎨', color: '#f59e0b' },
        { value: 'promotion', label: 'Class Promotion', icon: '📈', color: '#8b5cf6' },
        { value: 'award', label: 'Award/Recognition', icon: '🥇', color: '#ef4444' },
        { value: 'exam', label: 'Examination', icon: '📝', color: '#06b6d4' },
        { value: 'event', label: 'School Event', icon: '🎉', color: '#ec4899' },
        { value: 'other', label: 'Other', icon: '📌', color: '#64748b' },
    ];

    const getTypeInfo = (type) => {
        return milestoneTypes.find(t => t.value === type) || milestoneTypes[7];
    };

    const sortedMilestones = useMemo(() => {
        return [...milestones].sort((a, b) => new Date(b.date) - new Date(a.date));
    }, [milestones]);

    const handleAddMilestone = () => {
        if (!newMilestone.title.trim()) return;

        const milestone = {
            id: Date.now(),
            ...newMilestone,
            createdAt: new Date().toISOString()
        };

        const updated = [...milestones, milestone];
        setMilestones(updated);
        if (onUpdateTimeline) {
            onUpdateTimeline(updated);
        }
        setNewMilestone({
            title: '',
            description: '',
            date: new Date().toISOString().split('T')[0],
            type: 'academic',
            grade: ''
        });
        setShowAddForm(false);
    };

    const handleRemoveMilestone = (id) => {
        const updated = milestones.filter(m => m.id !== id);
        setMilestones(updated);
        if (onUpdateTimeline) {
            onUpdateTimeline(updated);
        }
    };

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const getYearFromDate = (dateStr) => {
        return new Date(dateStr).getFullYear();
    };

    const groupedByYear = useMemo(() => {
        const groups = {};
        sortedMilestones.forEach(m => {
            const year = getYearFromDate(m.date);
            if (!groups[year]) groups[year] = [];
            groups[year].push(m);
        });
        return groups;
    }, [sortedMilestones]);

    if (!isOpen) return null;

    const getStudentName = () => {
        if (!student) return 'Student';
        return [student.studentFirstName, student.studentMiddleName, student.studentLastName]
            .filter(Boolean)
            .join(' ') || student.name || 'Student';
    };

    return (
        <div className="timeline-overlay" onClick={onClose}>
            <div className="timeline-modal" onClick={e => e.stopPropagation()}>
                <div className="timeline-header">
                    <h2><Clock size={24} /> Progress Timeline</h2>
                    <span className="student-badge">{getStudentName()}</span>
                    <button className="close-btn" onClick={onClose}><X size={20} /></button>
                </div>

                <div className="timeline-content">
                    {/* Stats Summary */}
                    <div className="timeline-stats">
                        <div className="stat-card">
                            <BookOpen size={20} />
                            <span className="stat-value">{milestones.filter(m => m.type === 'academic').length}</span>
                            <span className="stat-label">Academic</span>
                        </div>
                        <div className="stat-card">
                            <Award size={20} />
                            <span className="stat-value">{milestones.filter(m => m.type === 'award').length}</span>
                            <span className="stat-label">Awards</span>
                        </div>
                        <div className="stat-card">
                            <TrendingUp size={20} />
                            <span className="stat-value">{milestones.filter(m => m.type === 'promotion').length}</span>
                            <span className="stat-label">Promotions</span>
                        </div>
                        <div className="stat-card">
                            <Calendar size={20} />
                            <span className="stat-value">{milestones.length}</span>
                            <span className="stat-label">Total</span>
                        </div>
                    </div>

                    {/* Timeline */}
                    <div className="timeline-container">
                        {Object.keys(groupedByYear).length === 0 ? (
                            <div className="empty-timeline">
                                <GraduationCap size={48} />
                                <h3>No milestones yet</h3>
                                <p>Start tracking the student's academic journey</p>
                            </div>
                        ) : (
                            Object.entries(groupedByYear).map(([year, items]) => (
                                <div key={year} className="year-group">
                                    <div className="year-marker">{year}</div>
                                    <div className="year-milestones">
                                        {items.map(milestone => {
                                            const typeInfo = getTypeInfo(milestone.type);
                                            return (
                                                <div
                                                    key={milestone.id}
                                                    className="milestone-card"
                                                    style={{ '--accent-color': typeInfo.color }}
                                                >
                                                    <div className="milestone-icon">{typeInfo.icon}</div>
                                                    <div className="milestone-content">
                                                        <div className="milestone-header">
                                                            <h4>{milestone.title}</h4>
                                                            <span className="milestone-date">{formatDate(milestone.date)}</span>
                                                        </div>
                                                        {milestone.description && (
                                                            <p className="milestone-desc">{milestone.description}</p>
                                                        )}
                                                        <div className="milestone-meta">
                                                            <span className="type-badge" style={{ background: typeInfo.color }}>
                                                                {typeInfo.label}
                                                            </span>
                                                            {milestone.grade && (
                                                                <span className="grade-badge">Grade: {milestone.grade}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <button
                                                        className="remove-btn"
                                                        onClick={() => handleRemoveMilestone(milestone.id)}
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Add Milestone Form */}
                    {showAddForm ? (
                        <div className="add-milestone-form">
                            <h3><Plus size={20} /> Add Milestone</h3>
                            <div className="form-grid">
                                <div className="form-group full">
                                    <label>Title</label>
                                    <input
                                        type="text"
                                        value={newMilestone.title}
                                        onChange={e => setNewMilestone({ ...newMilestone, title: e.target.value })}
                                        placeholder="e.g., Won Science Exhibition"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Type</label>
                                    <select
                                        value={newMilestone.type}
                                        onChange={e => setNewMilestone({ ...newMilestone, type: e.target.value })}
                                    >
                                        {milestoneTypes.map(t => (
                                            <option key={t.value} value={t.value}>
                                                {t.icon} {t.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Date</label>
                                    <input
                                        type="date"
                                        value={newMilestone.date}
                                        onChange={e => setNewMilestone({ ...newMilestone, date: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Grade/Score (optional)</label>
                                    <input
                                        type="text"
                                        value={newMilestone.grade}
                                        onChange={e => setNewMilestone({ ...newMilestone, grade: e.target.value })}
                                        placeholder="A+, 95%, etc."
                                    />
                                </div>
                                <div className="form-group full">
                                    <label>Description (optional)</label>
                                    <textarea
                                        value={newMilestone.description}
                                        onChange={e => setNewMilestone({ ...newMilestone, description: e.target.value })}
                                        placeholder="Additional details..."
                                        rows={2}
                                    />
                                </div>
                            </div>
                            <div className="form-actions">
                                <button className="save-btn" onClick={handleAddMilestone}>
                                    <Plus size={18} /> Add Milestone
                                </button>
                                <button className="cancel-btn" onClick={() => setShowAddForm(false)}>
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button className="add-milestone-btn" onClick={() => setShowAddForm(true)}>
                            <Plus size={20} /> Add Milestone
                        </button>
                    )}
                </div>

                <div className="timeline-footer">
                    <Clock size={16} />
                    <span>Track academic journey and achievements</span>
                </div>
            </div>
        </div>
    );
}
