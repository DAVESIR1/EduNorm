import React, { useState, useRef, useCallback } from 'react';
import { Image, X, Wand2, Sun, Moon, Contrast, Eraser, Download, RotateCcw, Loader } from 'lucide-react';
import './PhotoEnhancement.css';

export default function PhotoEnhancement({ isOpen, onClose, onPhotoEnhanced, initialPhoto }) {
    const [image, setImage] = useState(initialPhoto || null);
    const [processedImage, setProcessedImage] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [filters, setFilters] = useState({
        brightness: 100,
        contrast: 100,
        saturation: 100,
        exposure: 0
    });
    const [backgroundRemoved, setBackgroundRemoved] = useState(false);
    const canvasRef = useRef(null);
    const fileInputRef = useRef(null);

    const handleFileUpload = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setImage(event.target.result);
                setProcessedImage(null);
                setBackgroundRemoved(false);
                resetFilters();
            };
            reader.readAsDataURL(file);
        }
    };

    const resetFilters = () => {
        setFilters({
            brightness: 100,
            contrast: 100,
            saturation: 100,
            exposure: 0
        });
    };

    const applyFilters = useCallback(() => {
        if (!image || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const img = new window.Image();

        img.onload = () => {
            // Set canvas size
            const maxSize = 800;
            let width = img.width;
            let height = img.height;

            if (width > maxSize || height > maxSize) {
                const ratio = Math.min(maxSize / width, maxSize / height);
                width *= ratio;
                height *= ratio;
            }

            canvas.width = width;
            canvas.height = height;

            // Apply CSS filters
            const filterString = `
                brightness(${filters.brightness + filters.exposure}%)
                contrast(${filters.contrast}%)
                saturate(${filters.saturation}%)
            `;

            ctx.filter = filterString;
            ctx.drawImage(img, 0, 0, width, height);

            setProcessedImage(canvas.toDataURL('image/jpeg', 0.95));
        };

        img.src = image;
    }, [image, filters]);

    const handleFilterChange = (filter, value) => {
        setFilters(prev => ({ ...prev, [filter]: value }));
    };

    const autoEnhance = () => {
        setFilters({
            brightness: 105,
            contrast: 110,
            saturation: 105,
            exposure: 5
        });
    };

    const removeBackground = async () => {
        if (!image) return;

        setIsProcessing(true);

        // Simulated background removal - in production, use remove.bg API or similar
        // For now, we'll just add a placeholder effect
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Create a simplified background removal effect
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        const img = new window.Image();

        img.onload = () => {
            const maxSize = 800;
            let width = img.width;
            let height = img.height;

            if (width > maxSize || height > maxSize) {
                const ratio = Math.min(maxSize / width, maxSize / height);
                width *= ratio;
                height *= ratio;
            }

            canvas.width = width;
            canvas.height = height;

            // Draw image
            ctx.drawImage(img, 0, 0, width, height);

            // Get image data
            const imageData = ctx.getImageData(0, 0, width, height);
            const data = imageData.data;

            // Simple background removal based on edge colors (approximate)
            // This is a basic algorithm - real implementation would use ML
            const cornerColors = [
                { r: data[0], g: data[1], b: data[2] },
                { r: data[(width - 1) * 4], g: data[(width - 1) * 4 + 1], b: data[(width - 1) * 4 + 2] },
                { r: data[(height - 1) * width * 4], g: data[(height - 1) * width * 4 + 1], b: data[(height - 1) * width * 4 + 2] },
                { r: data[((height - 1) * width + width - 1) * 4], g: data[((height - 1) * width + width - 1) * 4 + 1], b: data[((height - 1) * width + width - 1) * 4 + 2] }
            ];

            // Average corner color as background estimate
            const bgColor = {
                r: Math.round(cornerColors.reduce((sum, c) => sum + c.r, 0) / 4),
                g: Math.round(cornerColors.reduce((sum, c) => sum + c.g, 0) / 4),
                b: Math.round(cornerColors.reduce((sum, c) => sum + c.b, 0) / 4)
            };

            // Make similar colors transparent
            const tolerance = 60;
            for (let i = 0; i < data.length; i += 4) {
                const diff = Math.abs(data[i] - bgColor.r) +
                    Math.abs(data[i + 1] - bgColor.g) +
                    Math.abs(data[i + 2] - bgColor.b);

                if (diff < tolerance) {
                    data[i + 3] = 0; // Make transparent
                }
            }

            ctx.putImageData(imageData, 0, 0);
            setProcessedImage(canvas.toDataURL('image/png'));
            setBackgroundRemoved(true);
            setIsProcessing(false);
        };

        img.src = image;
    };

    const downloadImage = () => {
        const link = document.createElement('a');
        link.download = 'enhanced_photo.jpg';
        link.href = processedImage || image;
        link.click();
    };

    const applyToForm = () => {
        if (onPhotoEnhanced && (processedImage || image)) {
            onPhotoEnhanced(processedImage || image);
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="photo-enhance-overlay" onClick={onClose}>
            <div className="photo-enhance-modal" onClick={e => e.stopPropagation()}>
                <div className="photo-enhance-header">
                    <h2><Image size={24} /> Photo Enhancement</h2>
                    <span className="enhance-badge">ID Photo Ready</span>
                    <button className="close-btn" onClick={onClose}><X size={20} /></button>
                </div>

                <div className="photo-enhance-content">
                    <canvas ref={canvasRef} hidden />

                    {!image ? (
                        <div className="upload-section">
                            <div className="upload-box" onClick={() => fileInputRef.current?.click()}>
                                <Image size={48} />
                                <h3>Upload Photo</h3>
                                <p>Click or drag image to enhance</p>
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFileUpload}
                                hidden
                            />
                        </div>
                    ) : (
                        <div className="editor-grid">
                            {/* Preview */}
                            <div className="preview-section">
                                <div className="image-preview">
                                    {isProcessing && (
                                        <div className="processing-overlay">
                                            <Loader className="spin" size={48} />
                                            <p>Processing...</p>
                                        </div>
                                    )}
                                    <img
                                        src={processedImage || image}
                                        alt="Preview"
                                        style={{
                                            filter: !processedImage ? `
                                                brightness(${filters.brightness + filters.exposure}%)
                                                contrast(${filters.contrast}%)
                                                saturate(${filters.saturation}%)
                                            ` : 'none'
                                        }}
                                    />
                                </div>
                                <div className="preview-actions">
                                    <button className="action-btn" onClick={() => fileInputRef.current?.click()}>
                                        <Image size={18} /> Change Photo
                                    </button>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleFileUpload}
                                        hidden
                                    />
                                </div>
                            </div>

                            {/* Controls */}
                            <div className="controls-section">
                                {/* Quick Actions */}
                                <div className="quick-actions">
                                    <button className="quick-btn" onClick={autoEnhance}>
                                        <Wand2 size={18} />
                                        Auto Enhance
                                    </button>
                                    <button
                                        className={`quick-btn ${backgroundRemoved ? 'active' : ''}`}
                                        onClick={removeBackground}
                                        disabled={isProcessing}
                                    >
                                        <Eraser size={18} />
                                        Remove BG
                                    </button>
                                    <button className="quick-btn" onClick={resetFilters}>
                                        <RotateCcw size={18} />
                                        Reset
                                    </button>
                                </div>

                                {/* Sliders */}
                                <div className="filter-controls">
                                    <div className="filter-slider">
                                        <div className="slider-header">
                                            <Sun size={16} />
                                            <span>Brightness</span>
                                            <span className="slider-value">{filters.brightness}%</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="50"
                                            max="150"
                                            value={filters.brightness}
                                            onChange={e => handleFilterChange('brightness', parseInt(e.target.value))}
                                        />
                                    </div>

                                    <div className="filter-slider">
                                        <div className="slider-header">
                                            <Contrast size={16} />
                                            <span>Contrast</span>
                                            <span className="slider-value">{filters.contrast}%</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="50"
                                            max="150"
                                            value={filters.contrast}
                                            onChange={e => handleFilterChange('contrast', parseInt(e.target.value))}
                                        />
                                    </div>

                                    <div className="filter-slider">
                                        <div className="slider-header">
                                            <Moon size={16} />
                                            <span>Saturation</span>
                                            <span className="slider-value">{filters.saturation}%</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0"
                                            max="200"
                                            value={filters.saturation}
                                            onChange={e => handleFilterChange('saturation', parseInt(e.target.value))}
                                        />
                                    </div>

                                    <div className="filter-slider">
                                        <div className="slider-header">
                                            <Sun size={16} />
                                            <span>Exposure</span>
                                            <span className="slider-value">{filters.exposure > 0 ? '+' : ''}{filters.exposure}</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="-30"
                                            max="30"
                                            value={filters.exposure}
                                            onChange={e => handleFilterChange('exposure', parseInt(e.target.value))}
                                        />
                                    </div>
                                </div>

                                <button className="apply-filters-btn" onClick={applyFilters}>
                                    Apply Adjustments
                                </button>

                                {/* Final Actions */}
                                <div className="final-actions">
                                    <button className="download-btn" onClick={downloadImage}>
                                        <Download size={18} /> Download
                                    </button>
                                    <button className="use-btn" onClick={applyToForm}>
                                        Use This Photo
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className="photo-enhance-footer">
                    <Wand2 size={16} />
                    <span>Auto-enhance, fix lighting, and remove backgrounds</span>
                </div>
            </div>
        </div>
    );
}
