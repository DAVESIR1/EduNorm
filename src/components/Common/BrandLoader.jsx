import React from 'react';
import EduNormLogo from '../Common/EduNormLogo';
import './BrandLoader.css';

export default function BrandLoader({ message = "Loading..." }) {
    return (
        <div className="brand-loader-container">
            <div className="brand-loader-content">
                <div className="logo-wrapper pulse-animation">
                    <EduNormLogo size="large" />
                </div>
                <h1 className="brand-text-reveal">EduNorm</h1>
                <p className="loading-message">{message}</p>
                <div className="loader-bar">
                    <div className="loader-progress"></div>
                </div>
            </div>
        </div>
    );
}
