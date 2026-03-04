import React, { useState } from 'react';
import './ComingSoonPage.css';

const FEATURE_INFO = {
    'dead-stock': {
        title: 'Dead Stock Register',
        icon: '📦',
        emoji: '📦',
        color: '#f59e0b',
        description: 'Track and manage dead stock inventory, damaged items, and write-off records for your school.',
        preview: [
            '📋 Item-wise stock entry with quantity & condition',
            '🗑️ Write-off and disposal tracking',
            '📄 Dead Stock Register PDF export',
            '🔍 Search by item name, category, or date',
        ],
        eta: 'Coming in v2.1',
    },
    'audit-register': {
        title: 'Audit Register',
        icon: '📋',
        emoji: '🔍',
        color: '#6366f1',
        description: 'Maintain complete audit logs, inspection records, and government compliance documentation.',
        preview: [
            '📅 Date-wise audit entry',
            '👤 Auditor name and remarks',
            '✅ Compliance checklist',
            '📄 Audit report PDF generation',
        ],
        eta: 'Coming in v2.1',
    },
    'bill-register': {
        title: 'Bill Register',
        icon: '🧾',
        emoji: '💰',
        color: '#10b981',
        description: 'Record and track all bills, invoices, and payment receipts with vendor management.',
        preview: [
            '🧾 Bill entry with vendor details',
            '💳 Payment status tracking',
            '📊 Monthly expense summary',
            '📄 Bill register PDF export',
        ],
        eta: 'Coming in v2.1',
    },
    'news-circulars': {
        title: 'News & Circulars',
        icon: '📰',
        emoji: '📢',
        color: '#3b82f6',
        description: 'Publish and manage school news, government circulars, and important announcements.',
        preview: [
            '📰 Post news and circulars',
            '📂 Category-wise organization',
            '🔔 Push notification to parents',
            '📜 Archive and search past circulars',
        ],
        eta: 'Coming in v2.2',
    },
    'programs-events': {
        title: 'Programs & Events',
        icon: '🎉',
        emoji: '🎊',
        color: '#ec4899',
        description: 'Plan, organize, and manage school programs, cultural events, and annual celebrations.',
        preview: [
            '📅 Event calendar view',
            '🎨 Program planning with tasks',
            '👥 Participant & role management',
            '📷 Event photo gallery',
        ],
        eta: 'Coming in v2.2',
    },
    'activity-gallery': {
        title: 'Activity Gallery',
        icon: '🖼️',
        emoji: '🎨',
        color: '#8b5cf6',
        description: 'Showcase school activities, student achievements, and memorable moments in a beautiful gallery.',
        preview: [
            '🖼️ Photo gallery with albums',
            '🏆 Achievement showcase',
            '🔒 Role-based photo access',
            '📱 WhatsApp share support',
        ],
        eta: 'Coming in v2.2',
    },
};

export default function ComingSoonPage({ featureId, onBack }) {
    const [notified, setNotified] = useState(false);

    const info = FEATURE_INFO[featureId] || {
        title: featureId ? featureId.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) : 'Feature',
        icon: '🚧',
        emoji: '⚙️',
        color: '#6b7280',
        description: 'This feature is currently under active development and will be available soon.',
        preview: [
            'Under active development',
            'Available in a future update',
            'Stay tuned for announcements',
        ],
        eta: 'Coming Soon',
    };

    return (
        <div className="coming-soon-page">
            <div className="coming-soon-card">

                {/* Hero */}
                <div className="cs-hero" style={{ '--cs-color': info.color }}>
                    <div className="cs-icon-ring">
                        <span className="cs-emoji">{info.icon}</span>
                    </div>
                    <div className="cs-badge">🚧 {info.eta}</div>
                </div>

                <h2 className="cs-title">{info.title}</h2>
                <p className="cs-desc">{info.description}</p>

                {/* Preview features */}
                <div className="cs-preview">
                    <p className="cs-preview-title">What's coming:</p>
                    {info.preview.map((item, i) => (
                        <div key={i} className="cs-preview-item">
                            <span className="cs-check">✓</span>
                            <span>{item}</span>
                        </div>
                    ))}
                </div>

                {/* CTA buttons */}
                <div className="cs-actions">
                    {!notified ? (
                        <button
                            className="cs-notify-btn"
                            style={{ background: info.color }}
                            onClick={() => setNotified(true)}
                        >
                            🔔 Notify Me When Ready
                        </button>
                    ) : (
                        <div className="cs-notified">
                            ✅ You'll be notified when this feature launches!
                        </div>
                    )}
                    {onBack && (
                        <button className="cs-back-btn" onClick={onBack}>
                            ← Go Back
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
