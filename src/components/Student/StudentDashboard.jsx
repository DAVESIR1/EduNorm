import React from 'react';
import './StudentLogin.css'; // Reusing existing styles for consistency

export default function StudentDashboard({ user, onLogout }) {
    if (!user) return null;

    // Helper to mask Aadhaar
    const displayAadhaar = (num) => {
        if (!num) return '';
        const clean = String(num).replace(/\D/g, '');
        return clean.replace(/(\d{4})(?=\d)/g, '$1 ');
    };

    return (
        <div className="student-login-container" style={{ minHeight: '100vh', background: 'var(--bg-secondary)', padding: '20px' }}>
            <div className="student-profile-view animate-fade-in" style={{ maxWidth: '800px', margin: '0 auto', background: 'var(--bg-primary)', padding: '2rem', borderRadius: '1rem', boxShadow: 'var(--shadow-lg)' }}>

                {/* Header Section */}
                <div className="profile-header" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem', borderBottom: '1px solid var(--border)', paddingBottom: '1.5rem' }}>
                    <div className="profile-photo-wrap" style={{ width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>
                        {user.studentPhoto ? (
                            <img src={user.studentPhoto} alt="Student" className="profile-photo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            <div className="profile-photo-placeholder">👤</div>
                        )}
                    </div>
                    <div className="profile-name-section" style={{ flex: 1 }}>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: '0 0 0.25rem 0' }}>{user.name || user.nameEnglish || 'Student'}</h2>
                        <span className="profile-class" style={{ display: 'block', color: 'var(--text-secondary)' }}>Class {user.standard || user.class || '—'} {user.division ? `(${user.division})` : ''}</span>
                        <span className="verified-badge" style={{ display: 'inline-block', marginTop: '0.5rem', padding: '0.25rem 0.5rem', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderRadius: '4px', fontSize: '0.8rem', fontWeight: '500' }}>✅ Student Account</span>
                    </div>
                    <button
                        className="btn btn-outline btn-sm"
                        onClick={() => {
                            if (window.confirm('Are you sure you want to logout?')) {
                                onLogout();
                                window.location.reload();
                            }
                        }}
                        style={{ padding: '0.5rem 1rem', border: '1px solid var(--border)', background: 'transparent', borderRadius: '6px', cursor: 'pointer' }}
                    >
                        Logout
                    </button>
                </div>

                {/* Profile Details Grid */}
                <div className="profile-details-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    {[
                        { label: 'GR Number', value: user.grNo },
                        { label: 'Roll Number', value: user.rollNo },
                        { label: 'Standard', value: user.standard },
                        { label: 'Division', value: user.division || user.section },
                        { label: 'Date of Birth', value: user.dateOfBirth || user.dob },
                        { label: "Father's Name", value: user.fatherName },
                        { label: "Mother's Name", value: user.motherName },
                        { label: 'Contact', value: user.contactNumber || user.mobile },
                        { label: 'Email', value: user.email },
                        { label: 'Blood Group', value: user.bloodGroup },
                        { label: 'Aadhaar', value: displayAadhaar(user.aadharNo || user.aadhaarNo || user.aadharNumber) },
                        { label: 'APAAR ID', value: user.apaarId || user.apaarNo },
                        { label: 'PEN', value: user.pen || user.penNo },
                        { label: 'School Code', value: user.schoolCode },
                    ].filter(item => item.value).map((item, i) => (
                        <div key={i} className="profile-detail-card" style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: '8px' }}>
                            <span className="detail-label" style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '0.25rem' }}>{item.label}</span>
                            <span className="detail-value" style={{ display: 'block', fontWeight: '500', wordBreak: 'break-word' }}>{item.value}</span>
                        </div>
                    ))}
                </div>

                {/* Actions */}
                <div className="profile-actions" style={{ marginTop: '2rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', paddingTop: '1.5rem', borderTop: '1px solid var(--border)' }}>
                    <button className="btn btn-primary" onClick={() => window.print()} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' }}>
                        <span>🖨️</span> Print Profile
                    </button>
                </div>

                <div style={{ marginTop: '2rem', textAlign: 'center', opacity: 0.6, fontSize: '0.9rem' }}>
                    <p>🔒 You are logged in as a Student. Access is restricted to your profile.</p>
                </div>
            </div>
        </div>
    );
}
