import React, { useState, useRef, useCallback } from 'react';
import { ScanLine } from 'lucide-react';
import Tesseract from 'tesseract.js';

/**
 * Smart OCR Camera
 * - Lucide ScanLine icon (minimal, matching app design)
 * - Real camera access via MediaDevices API with user permission
 * - File upload fallback
 * - Auto-detect language (eng+hin), no prompts
 * - Smart text cleanup
 */
export default function OcrCamera({ onResult, label = '', style = {} }) {
    const [scanning, setScanning] = useState(false);
    const [progress, setProgress] = useState(0);
    const [showCamera, setShowCamera] = useState(false);
    const [cameraError, setCameraError] = useState('');
    const [showOptions, setShowOptions] = useState(false);

    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);
    const fileInputRef = useRef(null);

    // ─── Open real camera ───
    const openCamera = useCallback(async () => {
        setShowOptions(false);
        setCameraError('');
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
                    videoRef.current.play();
                }
            }, 100);
        } catch (err) {
            console.error('Camera access denied:', err);
            if (err.name === 'NotAllowedError') {
                setCameraError('Camera permission denied. Please allow camera access in your browser settings.');
            } else if (err.name === 'NotFoundError') {
                setCameraError('No camera found on this device.');
            } else {
                setCameraError('Could not access camera. Try uploading an image instead.');
            }
        }
    }, []);

    // ─── Capture photo from live camera ───
    const capturePhoto = useCallback(() => {
        if (!videoRef.current || !canvasRef.current) return;
        const video = videoRef.current;
        const canvas = canvasRef.current;
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0);
        const imageSrc = canvas.toDataURL('image/jpeg', 0.9);
        stopCamera();
        processImage(imageSrc);
    }, []);

    // ─── Stop camera stream ───
    const stopCamera = useCallback(() => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(t => t.stop());
            streamRef.current = null;
        }
        setShowCamera(false);
    }, []);

    // ─── Process image with Tesseract ───
    const processImage = useCallback(async (imageSrc) => {
        setScanning(true);
        setProgress(0);
        try {
            const result = await Tesseract.recognize(imageSrc, 'eng+hin', {
                logger: (m) => {
                    if (m.status === 'recognizing text') {
                        setProgress(Math.round(m.progress * 100));
                    }
                }
            });
            let text = result.data.text.trim();
            // Smart cleanup
            text = text
                .replace(/[|}{[\]\\<>]/g, '')
                .replace(/\n{3,}/g, '\n\n')
                .replace(/  +/g, ' ')
                .trim();

            if (text && onResult) {
                onResult(text);
            } else if (!text) {
                alert('No text found. Try a clearer image.');
            }
        } catch (err) {
            console.error('OCR error:', err);
            alert('Scan failed. Please try again.');
        } finally {
            setScanning(false);
            setProgress(0);
        }
    }, [onResult]);

    // ─── Handle file upload ───
    const handleFile = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            setShowOptions(false);
            const reader = new FileReader();
            reader.onload = (ev) => processImage(ev.target.result);
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
                background: 'rgba(0,0,0,0.9)', zIndex: 10000,
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
            }}>
                <div style={{
                    position: 'relative', width: '100%', maxWidth: '640px',
                    borderRadius: '12px', overflow: 'hidden', background: '#000'
                }}>
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        style={{ width: '100%', display: 'block', borderRadius: '12px' }}
                    />
                    {/* Scan frame guide */}
                    <div style={{
                        position: 'absolute', top: '15%', left: '10%', right: '10%', bottom: '15%',
                        border: '2px dashed rgba(124, 58, 237, 0.6)',
                        borderRadius: '8px', pointerEvents: 'none'
                    }} />
                </div>

                <div style={{ display: 'flex', gap: '16px', marginTop: '20px' }}>
                    <button
                        onClick={capturePhoto}
                        style={{
                            width: '64px', height: '64px', borderRadius: '50%',
                            background: 'white', border: '4px solid var(--primary, #7C3AED)',
                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                            transition: 'transform 0.1s'
                        }}
                        onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.9)'}
                        onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                        title="Capture"
                    >
                        <ScanLine size={28} color="var(--primary, #7C3AED)" />
                    </button>
                    <button
                        onClick={stopCamera}
                        style={{
                            padding: '12px 24px', borderRadius: '10px',
                            background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.3)',
                            color: 'white', cursor: 'pointer', fontSize: '14px', fontWeight: 600
                        }}
                    >
                        ✕ Close
                    </button>
                </div>

                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', marginTop: '12px' }}>
                    Position document inside the frame, then tap capture
                </p>

                <canvas ref={canvasRef} style={{ display: 'none' }} />
            </div>
        );
    }

    return (
        <span style={{ position: 'relative', display: 'inline-flex', marginLeft: '6px', ...style }}>
            <button
                type="button"
                onClick={() => setShowOptions(!showOptions)}
                title={`Scan ${label || 'text'}`}
                style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    padding: '2px', borderRadius: '4px', lineHeight: 0,
                    color: 'var(--gray-400, #9ca3af)',
                    transition: 'color 0.15s, transform 0.15s',
                    display: 'inline-flex', alignItems: 'center',
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

            {/* Minimal 2-option dropdown */}
            {showOptions && (
                <div style={{
                    position: 'absolute', top: '100%', right: 0, zIndex: 200,
                    background: 'white', borderRadius: '8px',
                    boxShadow: '0 6px 24px rgba(0,0,0,0.12)',
                    border: '1px solid var(--border-color, #e2e8f0)',
                    overflow: 'hidden', minWidth: '150px', marginTop: '4px'
                }}>
                    <button
                        type="button"
                        onClick={openCamera}
                        style={{
                            width: '100%', padding: '10px 14px',
                            border: 'none', background: 'none',
                            cursor: 'pointer', fontSize: '13px',
                            textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px',
                            color: 'var(--text-primary)', transition: 'background 0.1s'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-secondary, #f8fafc)'}
                        onMouseOut={(e) => e.currentTarget.style.background = 'none'}
                    >
                        <ScanLine size={15} /> Camera
                    </button>
                    <div style={{ height: '1px', background: 'var(--border-color, #e2e8f0)' }} />
                    <button
                        type="button"
                        onClick={() => { fileInputRef.current?.click(); }}
                        style={{
                            width: '100%', padding: '10px 14px',
                            border: 'none', background: 'none',
                            cursor: 'pointer', fontSize: '13px',
                            textAlign: 'left', display: 'flex', alignItems: 'center', gap: '8px',
                            color: 'var(--text-primary)', transition: 'background 0.1s'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-secondary, #f8fafc)'}
                        onMouseOut={(e) => e.currentTarget.style.background = 'none'}
                    >
                        🖼️ Upload Image
                    </button>
                </div>
            )}

            {/* Camera error message */}
            {cameraError && (
                <div style={{
                    position: 'fixed', top: '20px', left: '50%', transform: 'translateX(-50%)',
                    background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626',
                    padding: '12px 20px', borderRadius: '10px', fontSize: '13px',
                    zIndex: 10001, maxWidth: '400px', textAlign: 'center',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
                }}>
                    {cameraError}
                    <button
                        onClick={() => setCameraError('')}
                        style={{
                            display: 'block', margin: '8px auto 0', padding: '4px 12px',
                            border: 'none', background: '#dc2626', color: 'white',
                            borderRadius: '6px', cursor: 'pointer', fontSize: '12px'
                        }}
                    >
                        OK
                    </button>
                </div>
            )}

            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleFile}
            />
        </span>
    );
}
