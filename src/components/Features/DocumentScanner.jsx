import React, { useState, useRef, useCallback } from 'react';
import { Camera, Upload, FileText, X, Loader, Check, AlertCircle, Scan } from 'lucide-react';
// import Tesseract from 'tesseract.js'; // Removed static import
import './DocumentScanner.css';

export default function DocumentScanner({ isOpen, onClose, onDataExtracted }) {
    const [image, setImage] = useState(null);
    const [scanning, setScanning] = useState(false);
    const [progress, setProgress] = useState(0);
    const [extractedData, setExtractedData] = useState(null);
    const [error, setError] = useState(null);
    const [cameraActive, setCameraActive] = useState(false);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const fileInputRef = useRef(null);
    const streamRef = useRef(null);

    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        setCameraActive(false);
    }, []);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            setCameraActive(true);
            setError(null);
        } catch (err) {
            setError('Camera access denied. Please use file upload instead.');
        }
    };

    const captureImage = () => {
        if (videoRef.current && canvasRef.current) {
            const canvas = canvasRef.current;
            const video = videoRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(video, 0, 0);
            const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
            setImage(dataUrl);
            stopCamera();
        }
    };

    const handleFileUpload = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setImage(event.target.result);
                setError(null);
            };
            reader.readAsDataURL(file);
        }
    };

    const parseAadhaarData = (text) => {
        const data = {};

        // Extract Aadhaar number (12 digits with optional spaces)
        const aadhaarMatch = text.match(/\d{4}\s?\d{4}\s?\d{4}/);
        if (aadhaarMatch) {
            data.aadhaarNo = aadhaarMatch[0].replace(/\s/g, '');
        }

        // Extract DOB
        const dobPatterns = [
            /DOB[:\s]*(\d{2}[\/\-]\d{2}[\/\-]\d{4})/i,
            /Date of Birth[:\s]*(\d{2}[\/\-]\d{2}[\/\-]\d{4})/i,
            /(\d{2}[\/\-]\d{2}[\/\-]\d{4})/
        ];
        for (const pattern of dobPatterns) {
            const match = text.match(pattern);
            if (match) {
                data.dob = match[1];
                break;
            }
        }

        // Extract Gender
        if (/\bMale\b/i.test(text)) data.gender = 'Male';
        else if (/\bFemale\b/i.test(text)) data.gender = 'Female';

        // Extract Name (usually first capitalized line after "Government of India")
        const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 2);
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            // Skip government text and common headers
            if (/government|india|aadhaar|unique|identification/i.test(line)) continue;
            // Name is usually all caps or title case
            if (/^[A-Z][a-z]+(\s[A-Z][a-z]+)+$/.test(line) || /^[A-Z\s]+$/.test(line)) {
                if (line.length > 3 && line.length < 50) {
                    data.name = line.split(' ').map(w =>
                        w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
                    ).join(' ');
                    break;
                }
            }
        }

        // Extract Address (usually after "Address:" or contains village/district)
        const addressMatch = text.match(/Address[:\s]*([\s\S]*?)(?=\d{4}\s?\d{4}\s?\d{4}|$)/i);
        if (addressMatch) {
            data.address = addressMatch[1].replace(/\n/g, ', ').trim().slice(0, 200);
        }

        // Extract Father's Name
        const fatherMatch = text.match(/(?:S\/O|D\/O|C\/O|Father)[:\s]*([A-Za-z\s]+)/i);
        if (fatherMatch) {
            data.fatherName = fatherMatch[1].trim();
        }

        return data;
    };

    const scanDocument = async () => {
        if (!image) return;

        setScanning(true);
        setProgress(0);
        setError(null);

        try {
            const Tesseract = (await import('tesseract.js')).default;
            const result = await Tesseract.recognize(image, 'eng+hin', {
                logger: (m) => {
                    if (m.status === 'recognizing text') {
                        setProgress(Math.round(m.progress * 100));
                    }
                }
            });

            const extractedText = result.data.text;
            const parsed = parseAadhaarData(extractedText);

            setExtractedData({
                raw: extractedText,
                parsed
            });
        } catch (err) {
            setError('Failed to scan document. Please try with a clearer image.');
        } finally {
            setScanning(false);
        }
    };

    const applyData = () => {
        if (extractedData?.parsed && onDataExtracted) {
            onDataExtracted(extractedData.parsed);
            handleClose();
        }
    };

    const handleClose = () => {
        stopCamera();
        setImage(null);
        setExtractedData(null);
        setError(null);
        setProgress(0);
        onClose();
    };

    const resetScan = () => {
        setImage(null);
        setExtractedData(null);
        setError(null);
        setProgress(0);
    };

    if (!isOpen) return null;

    return (
        <div className="doc-scanner-overlay" onClick={handleClose}>
            <div className="doc-scanner-modal" onClick={e => e.stopPropagation()}>
                <div className="doc-scanner-header">
                    <h2><Scan size={24} /> AI Document Scanner</h2>
                    <span className="scanner-badge">OCR Powered</span>
                    <button className="close-btn" onClick={handleClose}><X size={20} /></button>
                </div>

                <div className="doc-scanner-content">
                    {!image && !cameraActive && (
                        <div className="scanner-options">
                            <div className="option-card" onClick={startCamera}>
                                <Camera size={48} />
                                <h3>Scan with Camera</h3>
                                <p>Use device camera to scan Aadhaar or documents</p>
                            </div>
                            <div className="option-card" onClick={() => fileInputRef.current?.click()}>
                                <Upload size={48} />
                                <h3>Upload Image</h3>
                                <p>Choose an image file from your device</p>
                            </div>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFileUpload}
                                hidden
                            />
                        </div>
                    )}

                    {cameraActive && (
                        <div className="camera-view">
                            <video ref={videoRef} autoPlay playsInline />
                            <canvas ref={canvasRef} hidden />
                            <div className="camera-overlay">
                                <div className="scan-frame" />
                            </div>
                            <div className="camera-controls">
                                <button className="capture-btn" onClick={captureImage}>
                                    <Camera size={32} />
                                    Capture
                                </button>
                                <button className="cancel-btn" onClick={stopCamera}>Cancel</button>
                            </div>
                        </div>
                    )}

                    {image && !extractedData && (
                        <div className="preview-section">
                            <div className="image-preview">
                                <img src={image} alt="Document preview" />
                                {scanning && (
                                    <div className="scanning-overlay">
                                        <Loader className="spin" size={48} />
                                        <p>Scanning... {progress}%</p>
                                        <div className="progress-bar">
                                            <div className="progress-fill" style={{ width: `${progress}%` }} />
                                        </div>
                                    </div>
                                )}
                            </div>
                            {!scanning && (
                                <div className="preview-actions">
                                    <button className="scan-btn" onClick={scanDocument}>
                                        <FileText size={20} /> Extract Data
                                    </button>
                                    <button className="retake-btn" onClick={resetScan}>
                                        <Camera size={20} /> Retake
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {extractedData && (
                        <div className="results-section">
                            <h3><Check size={20} /> Extracted Information</h3>
                            <div className="extracted-fields">
                                {extractedData.parsed.name && (
                                    <div className="field-row">
                                        <span className="field-label">Name</span>
                                        <span className="field-value">{extractedData.parsed.name}</span>
                                    </div>
                                )}
                                {extractedData.parsed.fatherName && (
                                    <div className="field-row">
                                        <span className="field-label">Father's Name</span>
                                        <span className="field-value">{extractedData.parsed.fatherName}</span>
                                    </div>
                                )}
                                {extractedData.parsed.dob && (
                                    <div className="field-row">
                                        <span className="field-label">Date of Birth</span>
                                        <span className="field-value">{extractedData.parsed.dob}</span>
                                    </div>
                                )}
                                {extractedData.parsed.gender && (
                                    <div className="field-row">
                                        <span className="field-label">Gender</span>
                                        <span className="field-value">{extractedData.parsed.gender}</span>
                                    </div>
                                )}
                                {extractedData.parsed.aadhaarNo && (
                                    <div className="field-row">
                                        <span className="field-label">Aadhaar No</span>
                                        <span className="field-value">{extractedData.parsed.aadhaarNo}</span>
                                    </div>
                                )}
                                {extractedData.parsed.address && (
                                    <div className="field-row full-width">
                                        <span className="field-label">Address</span>
                                        <span className="field-value">{extractedData.parsed.address}</span>
                                    </div>
                                )}
                                {Object.keys(extractedData.parsed).length === 0 && (
                                    <div className="no-data">
                                        <AlertCircle size={32} />
                                        <p>Could not extract structured data. Please ensure the image is clear.</p>
                                    </div>
                                )}
                            </div>
                            <div className="result-actions">
                                <button className="apply-btn" onClick={applyData} disabled={Object.keys(extractedData.parsed).length === 0}>
                                    <Check size={20} /> Apply to Form
                                </button>
                                <button className="rescan-btn" onClick={resetScan}>
                                    <Camera size={20} /> Scan Another
                                </button>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="error-message">
                            <AlertCircle size={20} />
                            {error}
                        </div>
                    )}
                </div>

                <div className="doc-scanner-footer">
                    <p>Supported: Aadhaar Card, Birth Certificate, School Documents</p>
                </div>
            </div>
        </div>
    );
}
