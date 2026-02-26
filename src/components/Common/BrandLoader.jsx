import React from 'react';
import EduNormLogo from '../Common/EduNormLogo';
import './BrandLoader.css';

export default function BrandLoader({ message = "Loading..." }) {
    return (
        <div className="brand-loader-container">
            <div className="brand-loader-content">
                <h1 className="brand-text-reveal">EduNorm</h1>
            </div>
        </div>
    );
}
