import React, { useState, useEffect, useMemo } from 'react';
import { Shield, X, Key, Copy, Trash2, Check, Star, Users, FileText, Crown, BarChart3, ChevronRight, Gift } from 'lucide-react';
import { AdminLogic } from './logic.js';
import { useUserTier } from '../../contexts/UserTierContext';
import { useAuth } from '../../contexts/AuthContext';
import './AdminDashboard.css';

/**
 * SOVEREIGN ADMIN DASHBOARD: VIEW
 */
export function AdminDashboardView({ onClose, totalStudents = 0, totalStandards = 0 }) {
    const { isAdmin, grantPremium } = useUserTier();
    const { user } = useAuth();

    const [grantEmail, setGrantEmail] = useState('');
    const [grantMonths, setGrantMonths] = useState(1);
    const [codeDuration, setCodeDuration] = useState('monthly');
    const [generatedCode, setGeneratedCode] = useState('');
    const [codeList, setCodeList] = useState([]);
    const [copied, setCopied] = useState(false);
    const [loadingCodes, setLoadingCodes] = useState(false);

    const loadCodes = async () => {
        setLoadingCodes(true);
        const codes = await AdminLogic.getCodes();
        setCodeList(codes);
        setLoadingCodes(false);
    };

    // 1. Load Data
    useEffect(() => {
        if (isAdmin) {
            const timer = setTimeout(() => loadCodes(), 0);
            return () => clearTimeout(timer);
        }
    }, [isAdmin]);

    // 2. Computed Stats
    const stats = useMemo(() => AdminLogic.getStats(totalStudents, totalStandards, 0), [totalStudents, totalStandards]);

    const handleGenerate = async () => {
        const res = await AdminLogic.createProCode(codeDuration, user?.email);
        if (res.success) {
            setGeneratedCode(res.code);
            loadCodes();
        }
    };

    const handleCopy = (code) => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (!isAdmin) return <div className="admin-access-denied">Access Denied</div>;

    return (
        <div className="admin-overlay" onClick={onClose}>
            <div className="admin-modal" onClick={e => e.stopPropagation()}>

                <header className="admin-header">
                    <div className="header-badge"><Shield size={20} /> ADMIN</div>
                    <button className="close-btn" onClick={onClose}><X /></button>
                </header>

                <div className="admin-content">
                    {/* Stats */}
                    <div className="stats-grid">
                        {stats.map(s => (
                            <div key={s.label} className="stat-pill" style={{ '--color': s.color }}>
                                <div className="stat-dot"></div>
                                <div className="stat-body">
                                    <div className="stat-val">{s.value}</div>
                                    <div className="stat-name">{s.label}</div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pro Code Gen */}
                    <section className="admin-card">
                        <h3><Key size={18} /> PRO Code Generator</h3>
                        <div className="gen-tool">
                            <select className="select-field" value={codeDuration} onChange={e => setCodeDuration(e.target.value)}>
                                <option value="monthly">Monthly (30 Days)</option>
                                <option value="yearly">Yearly (365 Days)</option>
                            </select>
                            <button className="btn btn-primary" onClick={handleGenerate}>Generate</button>
                        </div>
                        {generatedCode && (
                            <div className="code-result">
                                <code>{generatedCode}</code>
                                <button className="btn-icon" onClick={() => handleCopy(generatedCode)}>
                                    {copied ? <Check size={16} /> : <Copy size={16} />}
                                </button>
                            </div>
                        )}
                    </section>

                    {/* Code Registry */}
                    <div className="registry-wrapper">
                        <h4>Active Registry ({codeList.length})</h4>
                        <div className="table-mini">
                            <table>
                                <thead>
                                    <tr><th>Code</th><th>Status</th><th>Used By</th><th>Actions</th></tr>
                                </thead>
                                <tbody>
                                    {codeList.map(c => (
                                        <tr key={c.id}>
                                            <td><code>{c.code}</code></td>
                                            <td><span className={`status ${c.isUsed ? 'used' : 'free'} `}>{c.isUsed ? 'USED' : 'ACTIVE'}</span></td>
                                            <td>{c.usedBy || '-'}</td>
                                            <td>
                                                <button onClick={() => handleCopy(c.code)}><Copy size={14} /></button>
                                                {!c.isUsed && <button onClick={() => AdminLogic.cancelCode(c.id).then(loadCodes)}><Trash2 size={14} /></button>}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}

export default AdminDashboardView;
