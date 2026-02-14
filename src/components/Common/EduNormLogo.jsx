import React from 'react';
import './EduNormLogo.css';

export default function EduNormLogo({ size = 'medium', className = '' }) {
    return (
        <div className={`brand-logo-container size-${size} ${className}`}>
            <span className="brand-letter letter-e">e</span>
            <span className="brand-letter letter-d">d</span>
            <span className="brand-letter letter-u">u</span>
            <span className="brand-letter letter-n">n</span>
            <span className="brand-letter letter-o">o</span>
            <span className="brand-letter letter-r">r</span>
            <span className="brand-letter letter-m">m</span>
            <div className="brand-dot dot-1"></div>
            <div className="brand-dot dot-2"></div>
        </div>
    );
}
