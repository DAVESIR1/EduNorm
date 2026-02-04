import React, { useMemo } from 'react';
import {
    BarChart3, Users, TrendingUp, PieChart, Calendar,
    GraduationCap, UserCheck, X, ArrowUp, ArrowDown
} from 'lucide-react';
import './AnalyticsDashboard.css';

export default function AnalyticsDashboard({ isOpen, onClose, students = [], standards = [] }) {
    // Calculate analytics
    const analytics = useMemo(() => {
        if (!students.length) {
            return {
                totalStudents: 0,
                byClass: [],
                byGender: { male: 0, female: 0, other: 0 },
                byCategory: {},
                recentAdmissions: 0,
                averagePerClass: 0
            };
        }

        // Students per class
        const byClass = standards.map(std => ({
            name: std.name || std,
            count: students.filter(s => s.standard === (std.name || std)).length
        })).sort((a, b) => b.count - a.count);

        // Gender distribution
        const byGender = students.reduce((acc, s) => {
            const gender = (s.gender || '').toLowerCase();
            if (gender.includes('male') && !gender.includes('female')) acc.male++;
            else if (gender.includes('female')) acc.female++;
            else acc.other++;
            return acc;
        }, { male: 0, female: 0, other: 0 });

        // Category distribution
        const byCategory = students.reduce((acc, s) => {
            const cat = s.category || s.cast || 'Unknown';
            acc[cat] = (acc[cat] || 0) + 1;
            return acc;
        }, {});

        // Recent admissions (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentAdmissions = students.filter(s => {
            if (!s.admissionDate && !s.createdAt) return false;
            const date = new Date(s.admissionDate || s.createdAt);
            return date >= thirtyDaysAgo;
        }).length;

        return {
            totalStudents: students.length,
            byClass,
            byGender,
            byCategory,
            recentAdmissions,
            averagePerClass: standards.length ? Math.round(students.length / standards.length) : 0
        };
    }, [students, standards]);

    if (!isOpen) return null;

    const genderTotal = analytics.byGender.male + analytics.byGender.female + analytics.byGender.other;
    const malePercent = genderTotal ? Math.round((analytics.byGender.male / genderTotal) * 100) : 0;
    const femalePercent = genderTotal ? Math.round((analytics.byGender.female / genderTotal) * 100) : 0;

    return (
        <div className="analytics-overlay" onClick={onClose}>
            <div className="analytics-modal" onClick={e => e.stopPropagation()}>
                <div className="analytics-header">
                    <h2><BarChart3 size={24} /> Analytics Dashboard</h2>
                    <button className="close-btn" onClick={onClose}><X size={20} /></button>
                </div>

                <div className="analytics-content">
                    {/* Key Metrics */}
                    <div className="metrics-grid">
                        <div className="metric-card primary">
                            <div className="metric-icon"><Users size={24} /></div>
                            <div className="metric-info">
                                <span className="metric-value">{analytics.totalStudents}</span>
                                <span className="metric-label">Total Students</span>
                            </div>
                        </div>

                        <div className="metric-card success">
                            <div className="metric-icon"><GraduationCap size={24} /></div>
                            <div className="metric-info">
                                <span className="metric-value">{standards.length}</span>
                                <span className="metric-label">Classes</span>
                            </div>
                        </div>

                        <div className="metric-card warning">
                            <div className="metric-icon"><TrendingUp size={24} /></div>
                            <div className="metric-info">
                                <span className="metric-value">{analytics.averagePerClass}</span>
                                <span className="metric-label">Avg per Class</span>
                            </div>
                        </div>

                        <div className="metric-card info">
                            <div className="metric-icon"><Calendar size={24} /></div>
                            <div className="metric-info">
                                <span className="metric-value">{analytics.recentAdmissions}</span>
                                <span className="metric-label">New (30 days)</span>
                            </div>
                        </div>
                    </div>

                    <div className="charts-grid">
                        {/* Class Distribution */}
                        <div className="chart-card">
                            <h3><PieChart size={18} /> Students by Class</h3>
                            <div className="class-bars">
                                {analytics.byClass.slice(0, 8).map((cls, idx) => (
                                    <div key={cls.name} className="class-bar-item">
                                        <span className="class-name">{cls.name}</span>
                                        <div className="bar-container">
                                            <div
                                                className="bar-fill"
                                                style={{
                                                    width: `${(cls.count / Math.max(...analytics.byClass.map(c => c.count))) * 100}%`,
                                                    animationDelay: `${idx * 0.1}s`
                                                }}
                                            />
                                        </div>
                                        <span className="class-count">{cls.count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Gender Distribution */}
                        <div className="chart-card">
                            <h3><UserCheck size={18} /> Gender Distribution</h3>
                            <div className="gender-chart">
                                <div className="gender-visual">
                                    <div
                                        className="gender-segment male"
                                        style={{ width: `${malePercent}%` }}
                                    />
                                    <div
                                        className="gender-segment female"
                                        style={{ width: `${femalePercent}%` }}
                                    />
                                </div>
                                <div className="gender-legend">
                                    <div className="legend-item">
                                        <span className="legend-dot male" />
                                        <span>Male</span>
                                        <strong>{analytics.byGender.male}</strong>
                                        <span>({malePercent}%)</span>
                                    </div>
                                    <div className="legend-item">
                                        <span className="legend-dot female" />
                                        <span>Female</span>
                                        <strong>{analytics.byGender.female}</strong>
                                        <span>({femalePercent}%)</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Category Distribution */}
                        <div className="chart-card full-width">
                            <h3><BarChart3 size={18} /> Category Distribution</h3>
                            <div className="category-tags">
                                {Object.entries(analytics.byCategory)
                                    .sort((a, b) => b[1] - a[1])
                                    .slice(0, 12)
                                    .map(([cat, count]) => (
                                        <div key={cat} className="category-tag">
                                            <span className="cat-name">{cat}</span>
                                            <span className="cat-count">{count}</span>
                                        </div>
                                    ))
                                }
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
