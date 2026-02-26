import React, { useState } from 'react';
import { Download, Eye, FileText, AlertCircle } from 'lucide-react';

export default function StudentCertificates({ user, onBack }) {
    const certificates = user?.issuedCertificates || [];

    if (!user) return null;

    return (
        <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <FileText className="text-primary" />
                    My Certificates
                </h2>
                {onBack && (
                    <button className="btn btn-ghost" onClick={onBack}>
                        ← Back
                    </button>
                )}
            </div>

            {certificates.length === 0 ? (
                <div style={{
                    textAlign: 'center', padding: '60px 20px',
                    background: 'var(--bg-secondary, #f8fafc)', borderRadius: '16px',
                    border: '2px dashed var(--border-color, #e2e8f0)'
                }}>
                    <div style={{
                        width: '60px', height: '60px', background: '#e2e8f0',
                        borderRadius: '50%', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', margin: '0 auto 16px', color: '#64748b'
                    }}>
                        <FileText size={30} />
                    </div>
                    <h3 style={{ fontSize: '1.1rem', marginBottom: '8px', color: 'var(--text-primary)' }}>No Certificates Found</h3>
                    <p style={{ color: 'var(--gray-500)', maxWidth: '400px', margin: '0 auto' }}>
                        Your school has not issued any certificates yet.
                        Please contact your class teacher or the school administration.
                    </p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
                    {certificates.map((cert, index) => (
                        <div key={cert.id || index} className="card hover-elevate" style={{ padding: '0', overflow: 'hidden', border: '1px solid var(--border-color, #e2e8f0)' }}>
                            <div style={{
                                height: '140px', background: '#f1f5f9',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                borderBottom: '1px solid var(--border-color)'
                            }}>
                                {cert.type?.startsWith('image/') ? (
                                    <img src={cert.data} alt={cert.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                    <FileText size={48} color="#94a3b8" />
                                )}
                            </div>
                            <div style={{ padding: '16px' }}>
                                <h4 style={{ fontSize: '1rem', marginBottom: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={cert.name}>
                                    {cert.name}
                                </h4>
                                <p style={{ fontSize: '0.8rem', color: 'var(--gray-500)', marginBottom: '16px' }}>
                                    Issued: {new Date(cert.uploadedAt).toLocaleDateString()}
                                </p>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <button
                                        className="btn btn-outline btn-sm"
                                        style={{ flex: 1 }}
                                        onClick={() => window.open(cert.data, '_blank')}
                                    >
                                        <Eye size={14} /> View
                                    </button>
                                    <a
                                        href={cert.data}
                                        download={cert.name}
                                        className="btn btn-primary btn-sm"
                                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', textDecoration: 'none' }}
                                    >
                                        <Download size={14} /> Download
                                    </a>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
