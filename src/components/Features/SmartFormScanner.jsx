import React, { useState, useRef, useCallback } from 'react';
import { Camera, Upload, FileText, X, Check, AlertCircle, ScanLine } from 'lucide-react';
import './DocumentScanner.css'; // Re-use styles
import { DATA_FIELDS } from '../DataEntry/StepWizard';

export default function SmartFormScanner({ isOpen, onClose, onDataExtracted }) {
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
                video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } } // Higher res for full forms
            });
            streamRef.current = stream;
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
            setCameraActive(true);
            setError(null);
        } catch (err) {
            setError('Camera access denied. Please use file upload.');
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
            setImage(canvas.toDataURL('image/jpeg', 0.95)); // High quality
            stopCamera();
        }
    };

    const handleFileUpload = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => setImage(event.target.result);
            reader.readAsDataURL(file);
        }
    };

    // ─── Smart Parsing Logic ───
    const parseFormData = (text) => {
        const data = {};
        const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
        const lowerText = text.toLowerCase();

        // Helper to find value after a label
        const findValue = (labelKeywords, type) => {
            // regex: label followed by optional colon/space, capturing group until end of line
            // loose matching
            for (const keyword of labelKeywords) {
                // Try to find "Label: Value" pattern on a single line
                const regex = new RegExp(`${keyword}[:\\s\\-]+(.*?)$`, 'i');
                for (const line of lines) {
                    const match = line.match(regex);
                    if (match && match[1].trim().length > 1) {
                        return cleanValue(match[1].trim(), type);
                    }
                }
            }
            return null;
        };

        const cleanValue = (val, type) => {
            if (type === 'number' || type === 'tel') return val.replace(/\D/g, '');
            if (type === 'date') {
                // Try to normalize date to YYYY-MM-DD
                const dateMatch = val.match(/(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/);
                if (dateMatch) return `${dateMatch[3]}-${dateMatch[2].padStart(2, '0')}-${dateMatch[1].padStart(2, '0')}`;
                return val;
            }
            return val;
        };

        // Loop through all defined fields in StepWizard
        DATA_FIELDS.forEach(step => {
            step.fields.forEach(field => {
                // Key heuristics based on label and key
                const keywords = [
                    field.label.replace(/[()]/g, ''),
                    field.key.replace(/([A-Z])/g, ' $1') // camelCase to space
                ];

                // Add specific synonyms
                if (field.key === 'grNo') keywords.push('G.R. No', 'General Register No');
                if (field.key === 'dob') keywords.push('Date of Birth', 'Birth Date');

                const val = findValue(keywords, field.type);
                if (val) {
                    data[field.key] = val;
                }
            });
        });

        // Aadhaar Special Case (regex based search over whole text)
        const aadhaarMatch = text.match(/\d{4}\s?\d{4}\s?\d{4}/);
        if (aadhaarMatch && !data.aadharNumber) {
            data.aadharNumber = aadhaarMatch[0].replace(/\D/g, '');
        }

        return data;
    };

    const scanDocument = async () => {
        if (!image) return;
        setScanning(true);
        setProgress(0);

        try {
            const Tesseract = (await import('tesseract.js')).default;
            const result = await Tesseract.recognize(image, 'eng+hin', {
                logger: m => m.status === 'recognizing text' && setProgress(Math.round(m.progress * 100))
            });

            const parsed = parseFormData(result.data.text);
            const count = Object.keys(parsed).length;

            if (count === 0) {
                setError('No matching fields found. Ensure labels match the form (e.g. "Name:", "DOB:").');
            } else {
                setExtractedData({ parsed, count });
                setError(null);
            }
        } catch (err) {
            setError('Scan failed. Try again.');
            console.error(err);
        } finally {
            setScanning(false);
        }
    };

    const handleApply = () => {
        if (extractedData?.parsed) {
            onDataExtracted(extractedData.parsed);
            handleClose();
        }
    };

    const handleClose = () => {
        stopCamera();
        setImage(null);
        setExtractedData(null);
        setError(null);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="doc-scanner-overlay" onClick={handleClose} style={{ zIndex: 10000 }}>
            <div className="doc-scanner-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px' }}>
                <div className="doc-scanner-header">
                    <h2><ScanLine size={24} /> Smart Form Auto-Fill</h2>
                    <span className="scanner-badge">AI Powered</span>
                    <button className="close-btn" onClick={handleClose}><X size={20} /></button>
                </div>

                <div className="doc-scanner-content">
                    {!image && !cameraActive && (
                        <div className="scanner-options">
                            <div className="option-card" onClick={startCamera}>
                                <Camera size={48} />
                                <h3>Scan Paper Form</h3>
                                <p>Capture a filled admission form or certificate</p>
                            </div>
                            <div className="option-card" onClick={() => fileInputRef.current?.click()}>
                                <Upload size={48} />
                                <h3>Upload Image</h3>
                                <p>Select a photo from gallery</p>
                            </div>
                            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} hidden />
                        </div>
                    )}

                    {cameraActive && (
                        <div className="camera-view">
                            <video ref={videoRef} autoPlay playsInline style={{ maxHeight: '60vh' }} />
                            <canvas ref={canvasRef} hidden />
                            <div className="camera-controls">
                                <button className="capture-btn" onClick={captureImage}><Camera /> Capture</button>
                                <button className="cancel-btn" onClick={stopCamera}>Cancel</button>
                            </div>
                        </div>
                    )}

                    {image && (
                        <div className="preview-section" style={{ flexDirection: 'row', gap: '20px', alignItems: 'flex-start' }}>
                            <div className="image-preview" style={{ flex: 1 }}>
                                <img src={image} alt="Preview" />
                                {scanning && (
                                    <div className="scanning-overlay">
                                        <div className="spin" style={{ fontSize: '2rem' }}>⚙️</div>
                                        <p>Analyzing fields... {progress}%</p>
                                    </div>
                                )}
                            </div>

                            {!scanning && extractedData && (
                                <div className="results-section" style={{ flex: 1, maxHeight: '60vh', overflowY: 'auto' }}>
                                    <div className="success-banner" style={{ background: '#dcfce7', color: '#166534', padding: '10px', borderRadius: '8px', marginBottom: '10px' }}>
                                        <Check size={16} /> Found {extractedData.count} fields
                                    </div>
                                    <div className="extracted-fields">
                                        {Object.entries(extractedData.parsed).map(([key, val]) => (
                                            <div key={key} className="field-row">
                                                <span className="field-label" style={{ textTransform: 'capitalize' }}>{key.replace(/([A-Z])/g, ' $1')}</span>
                                                <span className="field-value">{val}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="result-actions">
                                        <button className="apply-btn" onClick={handleApply}>Auto-Fill Form</button>
                                        <button className="rescan-btn" onClick={() => { setImage(null); setExtractedData(null); }}>Scan Again</button>
                                    </div>
                                </div>
                            )}

                            {!scanning && !extractedData && (
                                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <button className="scan-btn" onClick={scanDocument}> <FileText /> Analyze Image </button>
                                </div>
                            )}
                        </div>
                    )}

                    {error && <div className="error-message">{error}</div>}
                </div>
            </div>
        </div>
    );
}
