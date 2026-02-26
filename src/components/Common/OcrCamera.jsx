import React, { useState, useRef, useCallback } from 'react';
import { ScanLine, Image as ImageIcon, X, Camera } from 'lucide-react';

/**
 * Smart OCR Camera (Optimized)
 * - Lazy loads Tesseract.js (huge performance win)
 * - One-click to open camera (no dropdown overlapping issues)
 * - File upload option moved INSIDE the camera modal
 * - Auto-detects English & Hindi
 */
export default function OcrCamera({ onResult, label = '', style = {}, parsingType = '' }) {
    const [scanning, setScanning] = useState(false);
    const [progress, setProgress] = useState(0);
    const [showCamera, setShowCamera] = useState(false);
    const [cameraError, setCameraError] = useState('');
    const [initError, setInitError] = useState('');

    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const fileInputRef = useRef(null);

    // ─── Lazy load Tesseract and process ───
    const processImage = useCallback(async (imageSrc) => {
        setScanning(true);
        setProgress(0);
        setCameraError(''); // Clear error on new scan
        try {
            // Dynamic import to speed up app initial load
            const Tesseract = (await import('tesseract.js')).default;

            // Should we use 'hin' only for regional names? For now 'eng+hin' is safest.
            const result = await Tesseract.recognize(imageSrc, 'eng+hin', {
                logger: (m) => {
                    if (m.status === 'recognizing text') {
                        setProgress(Math.round(m.progress * 100));
                    }
                }
            });

            let text = result.data.text.trim();

            // ─── Smart Parsing Logic ───
            // Apply specific regex/cleaning based on the target field type
            if (parsingType) {
                text = parseText(text, parsingType);
            } else {
                // Default cleanup
                text = text
                    .replace(/[|}{[\]\\<>]/g, '')
                    .replace(/\n{3,}/g, '\n\n')
                    .replace(/  +/g, ' ')
                    .trim();
            }

            if (text && onResult) {
                onResult(text);
                stopCamera();
            } else if (!text) {
                alert('No relevant text found. Try a clearer image or closer view.');
            }
        } catch (err) {
            console.error('OCR error:', err);
            alert('Scan failed. Please try again.');
        } finally {
            setScanning(false);
            setProgress(0);
        }
    }, [onResult, parsingType]);

    // ─── Helper: Parse Text based on Type ───
    const parseText = (text, type) => {
        switch (type) {
            case 'aadhaar':
                // Extract 12 digits, ignoring spaces/hyphens
                const aadhaarMatch = text.match(/\d{4}\s?\d{4}\s?\d{4}/);
                return aadhaarMatch ? aadhaarMatch[0].replace(/\D/g, '') : '';

            case 'pan':
                // Extract PAN format: 5 letters, 4 digits, 1 letter
                const panMatch = text.match(/[A-Z]{5}[0-9]{4}[A-Z]{1}/);
                return panMatch ? panMatch[0] : '';

            case 'date':
                // Attempt to find DD/MM/YYYY or DD-MM-YYYY
                const dateMatch = text.match(/(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})/);
                if (dateMatch) {
                    const [_, d, m, y] = dateMatch;
                    // Return as YYYY-MM-DD for input[type="date"]
                    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
                }
                return '';

            case 'number':
                // Extract only numbers
                return text.replace(/\D/g, '');

            case 'name':
                // Remove common prefixes/suffixes, keep text
                return text.replace(/(Mr\.|Mrs\.|Shri|Smt\.|Dr\.)/gi, '').replace(/[0-9]/g, '').trim();

            default:
                return text;
        }
    };

    // ─── Open real camera ───
    const openCamera = useCallback(async () => {
        setCameraError('');
        setInitError('');
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
            });
            streamRef.current = stream;
            setShowCamera(true);
            // Attach stream to video after render
            setTimeout(() => {
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.play().catch(e => console.error("Play error:", e));
                }
            }, 100);
        } catch (err) {
            console.error('Camera access denied:', err);
            if (err.name === 'NotAllowedError') {
                setCameraError('Camera permission denied.');
            } else if (err.name === 'NotFoundError') {
                setCameraError('No camera found.');
            } else {
                setCameraError('Camera error. Try upload.');
            }
            setShowCamera(true); // Show modal even on error so user can use upload
        }
    }, []);

    // ─── Capture photo from live camera ───
    const capturePhoto = useCallback(() => {
        if (!videoRef.current || !canvasRef.current || !streamRef.current) return;
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0);
        const imageSrc = canvas.toDataURL('image/jpeg', 0.9);
        // Stop camera stream to freeze frame or cleanup
        stopCamera();
        // Process
        processImage(imageSrc);
    }, [processImage]);

    // ─── Stop camera stream ───
    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        }
        setShowCamera(false);
    }, []);

    // ─── Handle file upload ───
    const handleFile = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                stopCamera(); // Close camera view
                processImage(ev.target.result);
            };
            reader.readAsDataURL(file);
        }
        e.target.value = '';
    };

    // ─── Scanning state ───
    if (scanning) {
        return (
            <span style={{
                display: 'inline-flex', alignItems: 'center', gap: '4px',
                color: 'var(--primary, #7C3AED)', fontSize: '11px', fontWeight: 500,
                marginLeft: '6px', ...style
            }}>
                <span style={{
                    width: '12px', height: '12px',
                    border: '2px solid var(--primary-light, #c4b5fd)',
                    borderTopColor: 'var(--primary, #7C3AED)',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                    display: 'inline-block'
                }} />
                {progress}%
            </span>
        );
    }

    // ─── Camera viewfinder overlay ───
    if (showCamera) {
        return (
            <div style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                background: 'rgba(0,0,0,0.95)', zIndex: 10000,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
            }}>
                <div style={{
                    position: 'relative', width: '100%', maxWidth: '640px', maxHeight: '80vh',
                    borderRadius: '12px', overflow: 'hidden', background: '#000',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    {!cameraError ? (
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                        />
                    ) : (
                        <div style={{ padding: '40px', textAlign: 'center', color: 'white' }}>
                            <p style={{ color: '#ef4444', marginBottom: '10px' }}>{cameraError}</p>
                            <p style={{ fontSize: '0.9em', opacity: 0.8 }}>You can still upload an image.</p>
                        </div>
                    )}

                    {/* Scan frame guide */}
                    {!cameraError && (
                        <div style={{
                            position: 'absolute', top: '20%', left: '15%', right: '15%', bottom: '20%',
                            border: '2px dashed rgba(255, 255, 255, 0.5)',
                            borderRadius: '12px', pointerEvents: 'none',
                            boxShadow: '0 0 0 9999px rgba(0,0,0,0.5)' // Dim outside area
                        }} />
                    )}

                    {/* Close button top-right */}
                    <button
                        onClick={stopCamera}
                        style={{
                            position: 'absolute', top: '16px', right: '16px',
                            background: 'rgba(0,0,0,0.5)', border: 'none', color: 'white',
                            borderRadius: '50%', width: '36px', height: '36px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
                        }}
                    >
                        <X size={20} />
                    </button>
                </div>

                <div style={{ display: 'flex', gap: '32px', marginTop: '24px', alignItems: 'center' }}>

                    {/* Upload Option */}
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
                            background: 'none', border: 'none', color: 'white', cursor: 'pointer',
                            opacity: 0.8, transition: 'opacity 0.2s'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.opacity = 1}
                        onMouseOut={(e) => e.currentTarget.style.opacity = 0.8}
                    >
                        <div style={{
                            width: '48px', height: '48px', borderRadius: '50%',
                            background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <ImageIcon size={24} />
                        </div>
                        <span style={{ fontSize: '12px' }}>Upload</span>
                    </button>

                    {/* Capture Button (Main) */}
                    {!cameraError && (
                        <button
                            onClick={capturePhoto}
                            style={{
                                width: '72px', height: '72px', borderRadius: '50%',
                                background: 'white', border: '4px solid rgba(255,255,255,0.3)',
                                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: '0 0 20px rgba(255,255,255,0.2)',
                                transition: 'transform 0.1s'
                            }}
                            onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
                            onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        >
                            <div style={{ width: '60px', height: '60px', borderRadius: '50%', border: '2px solid black' }} />
                        </button>
                    )}

                    {/* Placeholder for symmetry or another option */}
                    <div style={{ width: '48px' }} />

                </div>

                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px', marginTop: '20px' }}>
                    {cameraError ? 'Upload an image to scan' : 'Place text within frame'}
                </p>

                <canvas ref={canvasRef} style={{ display: 'none' }} />
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleFile}
                />
            </div>
        );
    }

    // ─── Default Inline Icon ───
    // Directly opens camera on click - NO DROPDOWN
    return (
        <button
            type="button"
            onClick={openCamera}
            title={`Scan ${label || 'text'}`}
            style={{
                background: 'none', border: 'none', cursor: 'pointer',
                padding: '2px', borderRadius: '4px', lineHeight: 0,
                color: 'var(--gray-400, #9ca3af)',
                transition: 'color 0.15s, transform 0.15s',
                display: 'inline-flex', alignItems: 'center',
                marginLeft: '6px', ...style
            }}
            onMouseOver={(e) => {
                e.currentTarget.style.color = 'var(--primary, #7C3AED)';
                e.currentTarget.style.transform = 'scale(1.15)';
            }}
            onMouseOut={(e) => {
                e.currentTarget.style.color = 'var(--gray-400, #9ca3af)';
                e.currentTarget.style.transform = 'scale(1)';
            }}
        >
            <ScanLine size={14} strokeWidth={2} />
        </button>
    );
}
