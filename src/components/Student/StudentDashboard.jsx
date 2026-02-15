import React, { useState } from 'react';
import { Download, FileText, User, LogOut, Grid, List } from 'lucide-react';
import './StudentLogin.css';

export default function StudentDashboard({ user, onLogout, onNavigate }) {
    if (!user) return null;

    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list' for full details

    // Helper to mask Aadhaar
    const displayAadhaar = (num) => {
        if (!num) return '';
        const clean = String(num).replace(/\D/g, '');
        return clean.replace(/(\d{4})(?=\d)/g, '$1 ');
    };

    // Format key for display (camelCase to Title Case)
    const formatLabel = (key) => {
        return key
            .replace(/([A-Z])/g, ' $1') // Add space before caps
            .replace(/^./, (str) => str.toUpperCase()) // Capitalize first letter
            .trim();
    };

    // Fields to hide in the full list
    const excludedKeys = new Set([
        'uid', 'id', 'role', 'isVerified', 'schoolCode',
        'studentPhoto', 'createdAt', 'updatedAt',
        'emailVerified', 'stsTokenManager', 'apiKey',
        'appName', 'providerData', 'lastLoginAt',
        'isAnonymous'
    ]);

    // Get all valid fields
    const allFields = Object.entries(user)
        .filter(([key, value]) => {
            if (excludedKeys.has(key)) return false;
            if (value === null || value === undefined || value === '') return false;
            if (typeof value === 'object') return false;
            return true;
        })
        .sort(([keyA], [keyB]) => keyA.localeCompare(keyB));

    return (
        <div className="student-login-container" style={{ minHeight: '100vh', background: 'var(--bg-secondary)', padding: '20px' }}>
            <div className="student-profile-view animate-fade-in" style={{ maxWidth: '900px', margin: '0 auto', background: 'var(--bg-primary)', padding: '2rem', borderRadius: '1rem', boxShadow: 'var(--shadow-lg)' }}>

                {/* Header Section */}
                <div className="profile-header" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem', borderBottom: '1px solid var(--border)', paddingBottom: '1.5rem', flexWrap: 'wrap' }}>
                    <div className="profile-photo-wrap" style={{ width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>
                        {user.studentPhoto ? (
                            <img src={user.studentPhoto} alt="Student" className="profile-photo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            <div className="profile-photo-placeholder">👤</div>
                        )}
                    </div>
                    <div className="profile-name-section" style={{ flex: 1, minWidth: '200px' }}>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '0 0 0.25rem 0' }}>{user.name || user.nameEnglish || 'Student Account'}</h2>
                        <span className="profile-class" style={{ display: 'block', color: 'var(--text-secondary)' }}>
                            Class {user.standard || user.class || '—'} {user.division ? `(${user.division})` : ''}
                        </span>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
                            <span className="verified-badge" style={{ padding: '0.25rem 0.5rem', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderRadius: '4px', fontSize: '0.8rem', fontWeight: '500' }}>
                                ✅ Verified Student
                            </span>
                            <span className="verified-badge" style={{ padding: '0.25rem 0.5rem', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', borderRadius: '4px', fontSize: '0.8rem', fontWeight: '500' }}>
                                GR: {user.grNo}
                            </span>
                        </div>
                    </div>
                    <button
                        className="btn btn-outline btn-sm"
                        onClick={async () => {
                            if (window.confirm('Are you sure you want to logout?')) {
                                await onLogout();
                                window.location.reload();
                            }
                        }}
                        style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid var(--border)', background: 'transparent', borderRadius: '6px', cursor: 'pointer' }}
                    >
                        <LogOut size={16} /> Logout
                    </button>
                </div>

                {/* Quick Actions */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '2rem' }}>
                    <button
                        className="btn btn-secondary action-card"
                        onClick={() => onNavigate && onNavigate('student', 'download-id-card')}
                        style={{ padding: '15px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '12px', cursor: 'pointer' }}
                    >
                        <User size={24} color="var(--primary)" />
                        <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>ID Card</span>
                    </button>

                    <button
                        className="btn btn-secondary action-card"
                        onClick={() => onNavigate && onNavigate('student', 'certificate-download')}
                        style={{ padding: '15px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '12px', cursor: 'pointer' }}
                    >
                        <FileText size={24} color="#F59E0B" />
                        <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>Certificates</span>
                    </button>

                    <button
                        className="btn btn-secondary action-card"
                        onClick={() => onNavigate && onNavigate('student', 'correction-request')}
                        style={{ padding: '15px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '12px', cursor: 'pointer' }}
                    >
                        <span style={{ fontSize: '20px' }}>✏️</span>
                        <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>Request Edit</span>
                    </button>

                    <button
                        className="btn btn-secondary action-card"
                        onClick={() => onNavigate && onNavigate('student', 'qa-chat')}
                        style={{ padding: '15px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '12px', cursor: 'pointer' }}
                    >
                        <span style={{ fontSize: '20px' }}>💬</span>
                        <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>Q&A Chat</span>
                    </button>
                </div>

                {/* Profile Details Title */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>📄 Full Student Profile</h3>
                    <div style={{ display: 'flex', gap: '5px', background: 'var(--bg-secondary)', padding: '4px', borderRadius: '8px' }}>
                        <button
                            onClick={() => setViewMode('grid')}
                            style={{ padding: '6px', borderRadius: '6px', border: 'none', background: viewMode === 'grid' ? 'var(--bg-primary)' : 'transparent', boxShadow: viewMode === 'grid' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', cursor: 'pointer' }}
                            title="Grid View"
                        >
                            <Grid size={18} color={viewMode === 'grid' ? 'var(--primary)' : 'var(--text-secondary)'} />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            style={{ padding: '6px', borderRadius: '6px', border: 'none', background: viewMode === 'list' ? 'var(--bg-primary)' : 'transparent', boxShadow: viewMode === 'list' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none', cursor: 'pointer' }}
                            title="List View"
                        >
                            <List size={18} color={viewMode === 'list' ? 'var(--primary)' : 'var(--text-secondary)'} />
                        </button>
                    </div>
                </div>

                {/* Profile Details Grid */}
                <div className="profile-details-container">
                    {viewMode === 'grid' ? (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                            {allFields.map(([key, value]) => (
                                <div key={key} className="profile-detail-card animate-slide-up" style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px', borderLeft: '3px solid var(--primary-light, #e2e8f0)' }}>
                                    <span style={{ display: 'block', fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '0.25rem', letterSpacing: '0.5px' }}>
                                        {formatLabel(key)}
                                    </span>
                                    <span style={{ display: 'block', fontWeight: '500', wordBreak: 'break-word', color: 'var(--text-primary)' }}>
                                        {String(value)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: 'var(--border)', borderRadius: '8px', overflow: 'hidden' }}>
                            {allFields.map(([key, value]) => (
                                <div key={key} style={{ display: 'flex', background: 'var(--bg-primary)', padding: '12px 16px', gap: '20px' }}>
                                    <span style={{ width: '40%', minWidth: '150px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                        {formatLabel(key)}
                                    </span>
                                    <span style={{ flex: 1, fontWeight: '500', color: 'var(--text-primary)', wordBreak: 'break-word' }}>
                                        {String(value)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div style={{ marginTop: '2rem', textAlign: 'center', opacity: 0.6, fontSize: '0.9rem', padding: '20px' }}>
                    <p>🔒 You are logged in as a Student. Access is restricted to your profile.</p>
                </div>
            </div>
        </div>
    );
}
