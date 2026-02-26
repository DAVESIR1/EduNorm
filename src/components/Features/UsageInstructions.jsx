import React, { useState, useEffect } from 'react';
import * as db from '../../services/database';

/**
 * Usage Instructions Page
 * - Language toggle (English/Hindi/Gujarati)
 * - All menu/submenu descriptions
 * - Data safety messaging
 * - What's New auto-popup
 * - PDF download capability
 */

const WHATS_NEW = [
    {
        version: '3.0', date: '2026-02-14', items: [
            '🤖 Smart AI Form Scanner: Auto-fill entire student forms from a single photo',
            '📷 Context-Aware Camera: Intelligently extracts Aadhaar, names, and dates',
            '🛡️ Robust Admin Backup: Automated, encrypted cloud backup for 100% data safety',
            '⚡ Offline-First Mode: Work without internet, auto-sync when online',
        ]
    },
    {
        version: '2.5', date: '2026-02-13', items: [
            'Government ID-based Student Login (Aadhaar, APAAR, Child UID)',
            'Real-time auto-backup with offline queue',
            'AI OCR Camera for document scanning',
            'Student Correction Request system',
            'Q&A Chat between students and teachers',
            'Certificate signature upload & group mode',
            'ID Card DISE code support',
        ]
    },
    {
        version: '2.0', date: '2026-01-20', items: [
            'Cloud backup & restore (Firebase + R2)',
            'Certificate Generator with 20+ templates',
            'ID Card Generator with 15 templates',
            'Salary Book management',
            'Multi-language support (EN/HI/GU)',
        ]
    },
];

const CONTENT = {
    en: {
        title: 'Usage Instructions',
        subtitle: 'Complete guide to using EduNorm',
        dataSafety: {
            title: '🔒 YOUR DATA IS 100% SAFE',
            points: [
                'We backup all your data with an END-TO-END ENCRYPTION system.',
                'No one can use it anytime anywhere. It is a foolproof system for your data safety.',
                'Even the app/website developers CANNOT open or read your data.',
                'Your data is encrypted with your own password before it leaves your device.',
                'Worry-free data safety: Only YOU hold the keys to your data.',
                'Multi-layer backup (Firebase + Cloudflare R2 + Admin Vault) ensures no data loss.',
            ]
        },
        menus: [
            {
                name: '🏫 School',
                desc: 'Manage school settings, profile, logo, and class structure.',
                items: [
                    { name: 'School Profile', desc: 'View and edit school name, contact, email, and address' },
                    { name: 'Upload Logo', desc: 'Upload or change your school logo (appears on ID cards & certificates)' },
                    { name: 'Class Setup', desc: 'Create and manage class/standard sections' },
                    { name: 'Teachers List', desc: 'View all registered teaching staff profiles' },
                ]
            },
            {
                name: '📋 Data Management',
                desc: 'Enter, view, edit, and search student records.',
                items: [
                    { name: 'Data Entry', desc: 'Add new student records with all details (name, DOB, parent info, ID numbers)' },
                    { name: 'Smart Scanner', desc: '✨ NEW: Auto-fill forms by scanning a paper document' },
                    { name: 'Student List', desc: 'View all students with search, filter, and sort options' },
                    { name: 'Edit Student', desc: 'Update existing student information' },
                    { name: 'Delete Student', desc: 'Remove student records (with confirmation)' },
                ]
            },
            {
                name: '🎓 Student',
                desc: 'Student self-service portal for viewing profile and requesting corrections.',
                items: [
                    { name: 'Student Login', desc: 'Login with government ID (Aadhaar/APAAR/Child UID) + OTP verification' },
                    { name: 'View Profile', desc: 'See all personal and academic information' },
                    { name: 'Download ID Card', desc: 'Generate and download student identity card' },
                    { name: 'Correction Request', desc: 'Flag incorrect data and submit correction for HOI approval' },
                    { name: 'Certificate Download', desc: 'Download earned certificates and achievements' },
                    { name: 'Q&A Chat', desc: 'Ask questions to teachers with subject selection' },
                ]
            },
            {
                name: '👨‍🏫 Teacher',
                desc: 'Teacher tools for class management, salary tracking, and student upgrades.',
                items: [
                    { name: 'Teacher Profile', desc: 'View and manage teaching staff information' },
                    { name: 'Salary Book', desc: 'Track salary payments, advances, and deductions' },
                    { name: 'Class Management', desc: 'Assign class teachers and manage class rosters' },
                    { name: 'Class Upgrade', desc: 'One-tap class progression (e.g., Class 1→2, 2→3)' },
                ]
            },
            {
                name: '🔐 HOI (Restricted)',
                desc: 'Head of Institution menu. Requires password verification for access.',
                items: [
                    { name: 'HOI Diary', desc: 'Private notes and diary entries for the principal' },
                    { name: 'Staff Management', desc: 'Add, edit, and manage all staff records' },
                    { name: 'Approve Corrections', desc: 'Review and approve/reject student data correction requests' },
                ]
            },
            {
                name: '💾 Backup & Restore',
                desc: 'Data backup, restore, import and export tools.',
                items: [
                    { name: 'Data Import / Export', desc: 'Export data to Excel/CSV or import from files' },
                    { name: 'Cloud Backup', desc: 'Manual backup to cloud (auto-backup runs in real-time)' },
                    { name: 'Restore from Cloud', desc: 'Download and restore your latest cloud backup' },
                ]
            },
        ],
        whatsNew: "What's New",
        download: 'Download as PDF',
        langLabel: 'Language',
    },
    hi: {
        title: 'उपयोग निर्देश',
        subtitle: 'EduNorm उपयोग की पूरी गाइड',
        dataSafety: {
            title: '🔒 आपका डेटा सुरक्षित है',
            points: [
                'सभी डेटा पहले आपके डिवाइस पर सुरक्षित रूप से स्टोर होता है',
                'क्लाउड पर एन्क्रिप्टेड बैकअप (AES-256 एन्क्रिप्शन)',
                'ऑनलाइन होने पर रियल-टाइम ऑटो-सिंक',
                'ऑफ़लाइन मोड: डेटा स्थानीय रूप से सहेजा जाता है',
                'मल्टी-लेयर बैकअप: Firebase + R2 क्लाउड',
                'केवल आप अपने लॉगिन से स्कूल डेटा एक्सेस कर सकते हैं',
            ]
        },
        menus: [
            {
                name: '🏫 स्कूल',
                desc: 'स्कूल सेटिंग्स, प्रोफाइल और क्लास संरचना प्रबंधित करें।',
                items: [
                    { name: 'स्कूल प्रोफ़ाइल', desc: 'स्कूल का नाम, संपर्क, ईमेल और पता देखें और संपादित करें' },
                    { name: 'लोगो अपलोड', desc: 'स्कूल का लोगो अपलोड या बदलें' },
                    { name: 'क्लास सेटअप', desc: 'कक्षा/मानक बनाएं और प्रबंधित करें' },
                    { name: 'शिक्षक सूची', desc: 'सभी पंजीकृत शिक्षकों की प्रोफ़ाइल देखें' },
                ]
            },
            {
                name: '📋 डेटा प्रबंधन',
                desc: 'छात्र रिकॉर्ड दर्ज, देखें, संपादित और खोजें।',
                items: [
                    { name: 'डेटा प्रविष्टि', desc: 'नए छात्र रिकॉर्ड सभी विवरणों के साथ जोड़ें' },
                    { name: 'छात्र सूची', desc: 'खोज, फ़िल्टर और सॉर्ट के साथ सभी छात्र देखें' },
                    { name: 'छात्र संपादित', desc: 'मौजूदा छात्र जानकारी अपडेट करें' },
                    { name: 'छात्र हटाएं', desc: 'छात्र रिकॉर्ड हटाएं (पुष्टि के साथ)' },
                ]
            },
        ],
        whatsNew: 'नया क्या है',
        download: 'PDF के रूप में डाउनलोड करें',
        langLabel: 'भाषा',
    },
    gu: {
        title: 'ઉપયોગ સૂચનાઓ',
        subtitle: 'EduNorm ઉપયોગ માટે સંપૂર્ણ માર્ગદર્શિકા',
        dataSafety: {
            title: '🔒 તમારો ડેટા સુરક્ષિત છે',
            points: [
                'બધો ડેટા પ્રથમ તમારા ઉપકરણ પર સુરક્ષિત રીતે સંગ્રહિત થાય છે',
                'ક્લાઉડ પર એન્ક્રિપ્ટેડ બેકઅપ (AES-256)',
                'ઓનલાઈન હોય ત્યારે રિયલ-ટાઇમ ઓટો-સિંક',
                'ઓફલાઈન મોડ: ડેટા સ્થાનિક રીતે સાચવવામાં આવે છે',
                'મલ્ટી-લેયર બેકઅપ: Firebase + R2 ક્લાઉડ',
                'ફક્ત તમે તમારા લોગઇનથી શાળાનો ડેટા ઍક્સેસ કરી શકો છો',
            ]
        },
        menus: [
            {
                name: '🏫 શાળા',
                desc: 'શાળા સેટિંગ્સ, પ્રોફાઇલ અને વર્ગ માળખું સંચાલિત કરો.',
                items: [
                    { name: 'શાળા પ્રોફાઇલ', desc: 'શાળાનું નામ, સંપર્ક, ઇમેઇલ અને સરનામું જુઓ' },
                    { name: 'લોગો અપલોડ', desc: 'શાળાનો લોગો અપલોડ કરો અથવા બદલો' },
                    { name: 'વર્ગ સેટઅપ', desc: 'વર્ગ/ધોરણ બનાવો અને સંચાલિત કરો' },
                    { name: 'શિક્ષક યાદી', desc: 'બધા નોંધાયેલા શિક્ષકોની પ્રોફાઇલ જુઓ' },
                ]
            },
        ],
        whatsNew: "શું નવું છે",
        download: 'PDF તરીકે ડાઉનલોડ કરો',
        langLabel: 'ભાષા',
    }
};

export default function UsageInstructions({ onBack }) {
    const [lang, setLang] = useState('en');
    const [showWhatsNew, setShowWhatsNew] = useState(false);
    const [hasSeenWhatsNew, setHasSeenWhatsNew] = useState(true);

    const t = CONTENT[lang] || CONTENT.en;

    // Check if user has seen the latest "What's New"
    useEffect(() => {
        const checkWhatsNew = async () => {
            try {
                const seen = await db.getSetting('whats_new_seen_version');
                if (seen !== WHATS_NEW[0].version) {
                    setShowWhatsNew(true);
                    setHasSeenWhatsNew(false);
                }
            } catch (e) {
                console.warn('UsageInstructions: Could not check whats new:', e);
            }
        };
        checkWhatsNew();
    }, []);

    const dismissWhatsNew = async () => {
        setShowWhatsNew(false);
        try {
            await db.updateSetting('whats_new_seen_version', WHATS_NEW[0].version);
            setHasSeenWhatsNew(true);
        } catch (e) { /* ignore */ }
    };

    const handleDownloadPDF = () => {
        // Use browser print to generate PDF
        window.print();
    };

    return (
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
            {/* What's New Popup */}
            {showWhatsNew && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', zIndex: 1000,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '20px'
                }}>
                    <div style={{
                        background: 'white', borderRadius: '16px', padding: '24px',
                        maxWidth: '500px', width: '100%', maxHeight: '80vh', overflowY: 'auto',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
                    }}>
                        <h2 style={{ fontSize: '1.3rem', marginBottom: '16px' }}>🎉 {t.whatsNew} v{WHATS_NEW[0].version}</h2>
                        {WHATS_NEW[0].items.map((item, i) => (
                            <div key={i} style={{
                                display: 'flex', gap: '8px', alignItems: 'flex-start',
                                padding: '8px 0', borderBottom: i < WHATS_NEW[0].items.length - 1 ? '1px solid #f1f5f9' : 'none'
                            }}>
                                <span style={{ color: '#22c55e', fontWeight: 700 }}>✓</span>
                                <span style={{ fontSize: '14px', color: '#334155' }}>{item}</span>
                            </div>
                        ))}
                        <button
                            className="btn btn-primary btn-lg"
                            style={{ width: '100%', marginTop: '16px' }}
                            onClick={dismissWhatsNew}
                        >
                            Got it! 👍
                        </button>
                    </div>
                </div>
            )}

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                    <h1 style={{ fontSize: '1.5rem', fontWeight: 700, margin: 0 }}>📖 {t.title}</h1>
                    <p style={{ color: 'var(--gray-500)', margin: '4px 0 0', fontSize: '0.85rem' }}>{t.subtitle}</p>
                </div>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ fontSize: '12px', color: 'var(--gray-500)' }}>{t.langLabel}:</span>
                    {['en', 'hi', 'gu'].map(l => (
                        <button
                            key={l}
                            onClick={() => setLang(l)}
                            style={{
                                padding: '4px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600,
                                border: `1.5px solid ${lang === l ? 'var(--primary, #7C3AED)' : '#d1d5db'}`,
                                background: lang === l ? 'var(--primary, #7C3AED)' : 'white',
                                color: lang === l ? 'white' : '#374151',
                                cursor: 'pointer', transition: 'all 0.15s'
                            }}
                        >
                            {l === 'en' ? 'EN' : l === 'hi' ? 'हिं' : 'ગુ'}
                        </button>
                    ))}
                </div>
            </div>

            {/* What's New Banner */}
            {!hasSeenWhatsNew && (
                <button
                    onClick={() => setShowWhatsNew(true)}
                    style={{
                        width: '100%', padding: '12px 16px', borderRadius: '10px',
                        border: '1px solid #bfdbfe', background: '#eff6ff',
                        cursor: 'pointer', textAlign: 'left', marginBottom: '16px',
                        color: '#1e40af', fontSize: '14px', fontWeight: 600
                    }}
                >
                    🆕 {t.whatsNew} v{WHATS_NEW[0].version} — Click to see updates!
                </button>
            )}

            {/* Data Safety */}
            <div style={{
                background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px',
                padding: '16px', marginBottom: '20px'
            }}>
                <h3 style={{ fontSize: '1rem', marginBottom: '10px', color: '#166534' }}>{t.dataSafety.title}</h3>
                <ul style={{ margin: 0, paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {t.dataSafety.points.map((p, i) => (
                        <li key={i} style={{ fontSize: '13px', color: '#15803d' }}>{p}</li>
                    ))}
                </ul>
            </div>

            {/* Menu Descriptions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {t.menus.map((menu, i) => (
                    <details key={i} style={{
                        background: 'var(--bg-secondary, #f8fafc)',
                        border: '1px solid var(--border-color, #e2e8f0)',
                        borderRadius: '12px', overflow: 'hidden'
                    }}>
                        <summary style={{
                            padding: '14px 16px', cursor: 'pointer', fontWeight: 700,
                            fontSize: '1rem', color: 'var(--text-primary)',
                            listStyle: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                        }}>
                            {menu.name}
                            <span style={{ fontSize: '12px', color: 'var(--gray-500)', fontWeight: 400 }}>{menu.desc}</span>
                        </summary>
                        <div style={{ padding: '0 16px 16px' }}>
                            {menu.items.map((item, j) => (
                                <div key={j} style={{
                                    padding: '8px 12px', borderLeft: '3px solid var(--primary, #7C3AED)',
                                    marginBottom: '6px', background: 'white', borderRadius: '0 8px 8px 0'
                                }}>
                                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{item.name}</div>
                                    <div style={{ fontSize: '12px', color: 'var(--gray-500)', marginTop: '2px' }}>{item.desc}</div>
                                </div>
                            ))}
                        </div>
                    </details>
                ))}
            </div>

            {/* Version History */}
            <div style={{ marginTop: '24px', padding: '16px', background: 'var(--bg-secondary, #f8fafc)', borderRadius: '12px', border: '1px solid var(--border-color, #e2e8f0)' }}>
                <h3 style={{ fontSize: '1rem', marginBottom: '12px' }}>📋 {t.whatsNew}</h3>
                {WHATS_NEW.map((release, i) => (
                    <div key={i} style={{ marginBottom: '12px' }}>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--primary, #7C3AED)' }}>
                            v{release.version} — {new Date(release.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                        <ul style={{ margin: '4px 0 0', paddingLeft: '18px' }}>
                            {release.items.map((item, j) => (
                                <li key={j} style={{ fontSize: '12px', color: 'var(--gray-600)', lineHeight: 1.6 }}>{item}</li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '12px', marginTop: '20px', flexWrap: 'wrap' }}>
                <button className="btn btn-primary" onClick={handleDownloadPDF}>
                    📄 {t.download}
                </button>
                {onBack && (
                    <button className="btn btn-ghost" onClick={onBack}>← Back</button>
                )}
            </div>
        </div>
    );
}
