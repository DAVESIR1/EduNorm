import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Mic, MicOff, X, Volume2, AlertCircle, Check, Loader, Languages } from 'lucide-react';
import './VoiceInput.css';

const SUPPORTED_LANGUAGES = [
    { code: 'en-IN', name: 'English (India)', flag: '🇮🇳' },
    { code: 'hi-IN', name: 'Hindi', flag: '🇮🇳' },
    { code: 'mr-IN', name: 'Marathi', flag: '🇮🇳' },
    { code: 'gu-IN', name: 'Gujarati', flag: '🇮🇳' },
    { code: 'ta-IN', name: 'Tamil', flag: '🇮🇳' },
    { code: 'te-IN', name: 'Telugu', flag: '🇮🇳' },
    { code: 'kn-IN', name: 'Kannada', flag: '🇮🇳' },
    { code: 'ml-IN', name: 'Malayalam', flag: '🇮🇳' },
    { code: 'bn-IN', name: 'Bengali', flag: '🇮🇳' },
    { code: 'pa-IN', name: 'Punjabi', flag: '🇮🇳' },
];

export default function VoiceInput({ isOpen, onClose, onVoiceData, targetField, fieldLabel }) {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [interimTranscript, setInterimTranscript] = useState('');
    const [selectedLanguage, setSelectedLanguage] = useState(SUPPORTED_LANGUAGES[0]);
    const [error, setError] = useState(null);
    const [isSupported, setIsSupported] = useState(true);
    const recognitionRef = useRef(null);

    useEffect(() => {
        // Check if speech recognition is supported
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setIsSupported(false);
            setError('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = selectedLanguage.code;

        recognition.onstart = () => {
            setIsListening(true);
            setError(null);
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognition.onerror = (event) => {
            setError(`Error: ${event.error}. Please try again.`);
            setIsListening(false);
        };

        recognition.onresult = (event) => {
            let finalTranscript = '';
            let interimText = '';

            for (let i = event.resultIndex; i < event.results.length; i++) {
                const result = event.results[i];
                if (result.isFinal) {
                    finalTranscript += result[0].transcript;
                } else {
                    interimText += result[0].transcript;
                }
            }

            if (finalTranscript) {
                setTranscript(prev => prev + (prev ? ' ' : '') + finalTranscript);
            }
            setInterimTranscript(interimText);
        };

        recognitionRef.current = recognition;

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
        };
    }, [selectedLanguage.code]);

    useEffect(() => {
        if (recognitionRef.current) {
            recognitionRef.current.lang = selectedLanguage.code;
        }
    }, [selectedLanguage]);

    const toggleListening = useCallback(() => {
        if (!recognitionRef.current) return;

        if (isListening) {
            recognitionRef.current.stop();
        } else {
            setTranscript('');
            setInterimTranscript('');
            try {
                recognitionRef.current.start();
            } catch (err) {
                // Already started
            }
        }
    }, [isListening]);

    const handleApply = () => {
        if (transcript && onVoiceData) {
            onVoiceData(targetField, transcript.trim());
            handleClose();
        }
    };

    const handleClose = () => {
        if (recognitionRef.current && isListening) {
            recognitionRef.current.stop();
        }
        setTranscript('');
        setInterimTranscript('');
        onClose();
    };

    const clearTranscript = () => {
        setTranscript('');
        setInterimTranscript('');
    };

    if (!isOpen) return null;

    return (
        <div className="voice-input-overlay" onClick={handleClose}>
            <div className="voice-input-modal" onClick={e => e.stopPropagation()}>
                <div className="voice-input-header">
                    <h2><Mic size={24} /> Voice Input</h2>
                    {fieldLabel && <span className="field-badge">For: {fieldLabel}</span>}
                    <button className="close-btn" onClick={handleClose}><X size={20} /></button>
                </div>

                <div className="voice-input-content">
                    {!isSupported ? (
                        <div className="not-supported">
                            <AlertCircle size={48} />
                            <p>{error}</p>
                        </div>
                    ) : (
                        <>
                            {/* Language Selector */}
                            <div className="language-selector">
                                <Languages size={20} />
                                <select
                                    value={selectedLanguage.code}
                                    onChange={(e) => {
                                        const lang = SUPPORTED_LANGUAGES.find(l => l.code === e.target.value);
                                        if (lang) setSelectedLanguage(lang);
                                    }}
                                >
                                    {SUPPORTED_LANGUAGES.map(lang => (
                                        <option key={lang.code} value={lang.code}>
                                            {lang.flag} {lang.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Microphone Button */}
                            <div className="mic-container">
                                <button
                                    className={`mic-button ${isListening ? 'active' : ''}`}
                                    onClick={toggleListening}
                                >
                                    {isListening ? (
                                        <>
                                            <div className="pulse-ring" />
                                            <div className="pulse-ring delay" />
                                            <MicOff size={48} />
                                        </>
                                    ) : (
                                        <Mic size={48} />
                                    )}
                                </button>
                                <p className="mic-hint">
                                    {isListening ? 'Tap to stop' : 'Tap to speak'}
                                </p>
                            </div>

                            {/* Transcript Display */}
                            <div className="transcript-box">
                                {transcript || interimTranscript ? (
                                    <>
                                        <span className="final-text">{transcript}</span>
                                        {interimTranscript && (
                                            <span className="interim-text">{interimTranscript}</span>
                                        )}
                                    </>
                                ) : (
                                    <span className="placeholder">
                                        {isListening ? (
                                            <>
                                                <Loader className="spin" size={16} />
                                                Listening...
                                            </>
                                        ) : (
                                            'Your spoken text will appear here'
                                        )}
                                    </span>
                                )}
                            </div>

                            {error && (
                                <div className="voice-error">
                                    <AlertCircle size={16} />
                                    {error}
                                </div>
                            )}

                            {/* Actions */}
                            <div className="voice-actions">
                                <button
                                    className="apply-btn"
                                    onClick={handleApply}
                                    disabled={!transcript}
                                >
                                    <Check size={20} /> Apply Text
                                </button>
                                <button className="clear-btn" onClick={clearTranscript}>
                                    Clear
                                </button>
                            </div>
                        </>
                    )}
                </div>

                <div className="voice-input-footer">
                    <Volume2 size={16} />
                    <p>Speak clearly for best results. Works offline!</p>
                </div>
            </div>
        </div>
    );
}
