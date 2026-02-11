import React, { useState, useEffect } from 'react';
import {
    Shield, Users, FileText, Settings, BarChart3,
    Crown, Gift, X, ChevronRight, Star, Key, Copy, Trash2, Check
} from 'lucide-react';
import { generateSecureCode, listGeneratedCodes, revokeCode } from '../../services/ProCodeService';
import { useUserTier } from '../../contexts/UserTierContext';
import { useAuth } from '../../contexts/AuthContext';
import './AdminPanel.css';

export default function AdminPanel({ onClose, totalStudents = 0, totalStandards = 0 }) {
    const { isAdmin, grantPremium } = useUserTier();
    const { user } = useAuth();
    const [grantEmail, setGrantEmail] = useState('');
    const [grantMonths, setGrantMonths] = useState(1);
    const [grantMessage, setGrantMessage] = useState('');

    // Pro Code Generator state
    const [codeDuration, setCodeDuration] = useState('monthly');
    const [generatedCode, setGeneratedCode] = useState('');
    const [codeList, setCodeList] = useState([]);
    const [copied, setCopied] = useState(false);
    const [loadingCodes, setLoadingCodes] = useState(false);

    // Load existing codes on mount
    useEffect(() => {
        loadCodes();
    }, []);

    const loadCodes = async () => {
        setLoadingCodes(true);
        const codes = await listGeneratedCodes();
        setCodeList(codes);
        setLoadingCodes(false);
    };

    const handleGenerateCode = async () => {
        const result = await generateSecureCode(codeDuration, user?.email);
        if (result.success) {
            setGeneratedCode(result.code);
            await loadCodes(); // Refresh list
        } else {
            alert('Error: ' + result.error);
        }
    };

    const handleCopyCode = (code) => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleRevokeCode = async (codeId) => {
        if (!confirm('Are you sure you want to revoke this code?')) return;
        const result = await revokeCode(codeId);
        if (result.success) {
            await loadCodes();
        } else {
            alert('Error: ' + result.error);
        }
    };

    // Only allow admin access
    if (!isAdmin) {
        return (
            <div className="admin-panel-overlay">
                <div className="admin-panel access-denied">
                    <Shield size={48} className="denied-icon" />
                    <h2>Access Denied</h2>
                    <p>You don't have permission to access the Admin Panel.</p>
                    <button className="btn btn-primary" onClick={onClose}>
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    const stats = [
        { icon: <Users size={24} />, label: 'Total Students', value: totalStudents, color: '#7c3aed' },
        { icon: <FileText size={24} />, label: 'Standards', value: totalStandards, color: '#db2777' },
        { icon: <Crown size={24} />, label: 'Premium Users', value: 0, color: '#f59e0b' },
        { icon: <Star size={24} />, label: 'App Rating', value: '4.8', color: '#10b981' }
    ];

    const handleGrantPremium = () => {
        if (!grantEmail.trim()) {
            setGrantMessage('Please enter a user ID');
            return;
        }

        // In production, this would search for user by email and grant premium
        // For now, using the email as a mock user ID
        grantPremium(grantEmail.trim(), grantMonths);
        setGrantMessage(`Premium granted for ${grantMonths} month(s) to ${grantEmail}`);
        setGrantEmail('');
    };

    return (
        <div className="admin-panel-overlay" onClick={onClose}>
            <div className="admin-panel" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="admin-header">
                    <div className="admin-title">
                        <Shield size={28} />
                        <div>
                            <h2>Admin Panel</h2>
                            <span className="admin-email">{user?.email}</span>
                        </div>
                    </div>
                    <button className="btn-icon btn-ghost" onClick={onClose}>
                        <X size={24} />
                    </button>
                </div>

                {/* Stats Grid */}
                <div className="admin-stats">
                    {stats.map((stat, index) => (
                        <div key={index} className="stat-card" style={{ '--stat-color': stat.color }}>
                            <div className="stat-icon">{stat.icon}</div>
                            <div className="stat-info">
                                <span className="stat-value">{stat.value}</span>
                                <span className="stat-label">{stat.label}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Quick Actions */}
                <div className="admin-section">
                    <h3>Quick Actions</h3>
                    <div className="admin-actions">
                        <button className="action-card">
                            <Gift size={20} />
                            <span>Grant Premium</span>
                            <ChevronRight size={16} />
                        </button>
                        <button className="action-card">
                            <Settings size={20} />
                            <span>App Settings</span>
                            <ChevronRight size={16} />
                        </button>
                        <button className="action-card">
                            <BarChart3 size={20} />
                            <span>View Analytics</span>
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>

                {/* Pro Code Generator Section */}
                <div className="admin-section">
                    <h3>
                        <Key size={18} />
                        Pro Code Generator
                    </h3>
                    <div className="code-generator">
                        <div className="generator-form">
                            <select
                                className="input-field"
                                value={codeDuration}
                                onChange={e => setCodeDuration(e.target.value)}
                            >
                                <option value="monthly">Monthly (30 days)</option>
                                <option value="yearly">Yearly (365 days)</option>
                            </select>
                            <button className="btn btn-primary" onClick={handleGenerateCode}>
                                <Key size={16} />
                                Generate Code
                            </button>
                        </div>

                        {generatedCode && (
                            <div className="generated-code-display">
                                <code className="code-text">{generatedCode}</code>
                                <button
                                    className="btn btn-secondary"
                                    onClick={() => handleCopyCode(generatedCode)}
                                >
                                    {copied ? <Check size={16} /> : <Copy size={16} />}
                                    {copied ? 'Copied!' : 'Copy'}
                                </button>
                            </div>
                        )}

                        {/* Code List Table */}
                        <div className="code-list">
                            <h4>Generated Codes ({codeList.length})</h4>
                            {loadingCodes ? (
                                <p>Loading codes...</p>
                            ) : codeList.length === 0 ? (
                                <p className="no-codes">No codes generated yet</p>
                            ) : (
                                <div className="code-table">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>Code</th>
                                                <th>Duration</th>
                                                <th>Created</th>
                                                <th>Status</th>
                                                <th>Used By</th>
                                                <th>Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {codeList.map(code => (
                                                <tr key={code.id}>
                                                    <td>
                                                        <code className="code-cell">{code.code}</code>
                                                    </td>
                                                    <td>
                                                        <span className="duration-badge">
                                                            {code.duration === 'monthly' ? '30 days' : '365 days'}
                                                        </span>
                                                    </td>
                                                    <td className="date-cell">
                                                        {new Date(code.createdAt).toLocaleDateString()}
                                                    </td>
                                                    <td>
                                                        <span className={`status-badge ${code.isUsed ? 'used' : 'unused'}`}>
                                                            {code.isUsed ? '✓ Used' : '○ Unused'}
                                                        </span>
                                                    </td>
                                                    <td className="email-cell">
                                                        {code.usedBy || '—'}
                                                    </td>
                                                    <td className="actions-cell">
                                                        <button
                                                            className="btn-icon btn-ghost"
                                                            onClick={() => handleCopyCode(code.code)}
                                                            title="Copy code"
                                                        >
                                                            <Copy size={14} />
                                                        </button>
                                                        {!code.isUsed && (
                                                            <button
                                                                className="btn-icon btn-ghost"
                                                                onClick={() => handleRevokeCode(code.id)}
                                                                title="Revoke code"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Grant Premium Section */}
                <div className="admin-section">
                    <h3>
                        <Crown size={18} />
                        Grant Premium Access
                    </h3>
                    <div className="grant-form">
                        <input
                            type="text"
                            className="input-field"
                            placeholder="User ID or Email"
                            value={grantEmail}
                            onChange={e => setGrantEmail(e.target.value)}
                        />
                        <select
                            className="input-field"
                            value={grantMonths}
                            onChange={e => setGrantMonths(Number(e.target.value))}
                        >
                            <option value={1}>1 Month</option>
                            <option value={3}>3 Months</option>
                            <option value={6}>6 Months</option>
                            <option value={12}>12 Months</option>
                        </select>
                        <button className="btn btn-primary" onClick={handleGrantPremium}>
                            <Gift size={16} />
                            Grant
                        </button>
                    </div>
                    {grantMessage && (
                        <p className="grant-message">{grantMessage}</p>
                    )}
                </div>

                {/* Admin Info */}
                <div className="admin-footer">
                    <p>Logged in as Admin • All access granted</p>
                </div>
            </div>
        </div>
    );
}
