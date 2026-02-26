import React from 'react';

export default function IdentityWizard({ isOpen, onClose }) {
    if (!isOpen) return null;
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content fluffy-card" onClick={e => e.stopPropagation()} style={{ maxWidth: 500, margin: 'auto', marginTop: '15vh', padding: '2rem', textAlign: 'center' }}>
                <h2 className="gradient-text">Identity Wizard</h2>
                <p style={{ color: 'var(--text-muted)', marginTop: '1rem' }}>Coming soon...</p>
                <button className="btn btn-primary" onClick={onClose} style={{ marginTop: '1.5rem' }}>Close</button>
            </div>
        </div>
    );
}
