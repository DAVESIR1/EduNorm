import React from 'react';
import './ComingSoonPage.css';

const FEATURE_INFO = {
    'dead-stock': { title: 'Dead Stock Register', icon: '📦', description: 'Track and manage dead stock inventory, damaged items, and write-off records.' },
    'audit-register': { title: 'Audit Register', icon: '📋', description: 'Maintain audit logs, inspection records, and compliance documentation.' },
    'bill-register': { title: 'Bill Register', icon: '🧾', description: 'Record and track all bills, invoices, and payment receipts.' },
    'news-circulars': { title: 'News & Circulars', icon: '📰', description: 'Publish and manage school news, government circulars, and updates.' },
    'programs-events': { title: 'Programs & Events', icon: '🎉', description: 'Plan and organize school programs, events, and celebrations.' },
    'activity-gallery': { title: 'Activity Gallery', icon: '🖼️', description: 'Showcase school activities, achievements, and memorable moments.' },
    'self-update': { title: 'Self Update', icon: '✏️', description: 'Students can update their own profile information securely.' },
    'download-certificate': { title: 'Download Certificate', icon: '📜', description: 'Students can download their certificates directly.' },
    'qa-chat': { title: 'Q&A Chat', icon: '💬', description: 'Interactive Q&A chat between students, teachers, and administration.' },
};

export default function ComingSoonPage({ featureId, onBack }) {
    const info = FEATURE_INFO[featureId] || {
        title: 'Feature',
        icon: '🚧',
        description: 'This feature is currently under development.'
    };

    return (
        <div className="coming-soon-page">
            <div className="coming-soon-card">
                <div className="coming-soon-icon">{info.icon}</div>
                <h2>{info.title}</h2>
                <div className="coming-soon-badge">🚧 Coming Soon</div>
                <p className="coming-soon-desc">{info.description}</p>
                <div className="coming-soon-features">
                    <div className="feature-dot">
                        <span className="dot"></span>
                        <span>Under active development</span>
                    </div>
                    <div className="feature-dot">
                        <span className="dot"></span>
                        <span>Will be available in a future update</span>
                    </div>
                    <div className="feature-dot">
                        <span className="dot"></span>
                        <span>Stay tuned for announcements</span>
                    </div>
                </div>
                {onBack && (
                    <button className="btn-back" onClick={onBack}>
                        ← Back to Main
                    </button>
                )}
            </div>
        </div>
    );
}
