import React, { useState, useEffect } from 'react';
import * as db from '../../services/database';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

export default function CorrectionRequestList() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(null);

    useEffect(() => {
        loadRequests();
    }, []);

    const loadRequests = async () => {
        setLoading(true);
        try {
            const queue = await db.getSetting('correction_request_queue') || [];
            // Sort by date desc
            queue.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
            setRequests(queue);
        } catch (err) {
            console.error('Failed to load correction requests:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (request, status) => {
        if (!confirm(`Are you sure you want to ${status.toUpperCase()} this request?`)) return;

        setProcessing(request);
        try {
            // 1. Update Student Data if Approved
            if (status === 'approved') {
                const student = await db.getStudent(request.studentId);
                if (student) {
                    await db.updateStudent(request.studentId, {
                        [request.fieldKey]: request.correctedValue
                    });
                }
            }

            // 2. Update Global Queue
            const updatedQueue = requests.map(r => {
                if (r.studentId === request.studentId && r.fieldKey === request.fieldKey && r.submittedAt === request.submittedAt) {
                    return { ...r, status, reviewedAt: new Date().toISOString() };
                }
                return r;
            });
            await db.setSetting('correction_request_queue', updatedQueue);

            // 3. Update Student's Personal List
            const studentRequests = await db.getSetting(`correction_requests_${request.studentId}`) || [];
            const updatedStudentRequests = studentRequests.map(r => {
                if (r.fieldKey === request.fieldKey && r.status === 'pending') {
                    return { ...r, status, reviewedAt: new Date().toISOString() };
                }
                return r;
            });
            await db.setSetting(`correction_requests_${request.studentId}`, updatedStudentRequests);

            setRequests(updatedQueue);
            alert(`Request ${status} successfully!`);
        } catch (err) {
            console.error('Failed to process request:', err);
            alert('Failed to process request. Please try again.');
        } finally {
            setProcessing(null);
        }
    };

    const pendingRequests = requests.filter(r => r.status === 'pending');
    const historyRequests = requests.filter(r => r.status !== 'pending');

    if (loading) return <div className="p-4 text-center">Loading requests...</div>;

    return (
        <div className="correction-list" style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h2 style={{ margin: 0 }}>📝 Correction Requests</h2>
                <button className="btn btn-outline btn-sm" onClick={loadRequests}>🔄 Refresh</button>
            </div>

            {pendingRequests.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', background: '#f8fafc', borderRadius: '12px', marginBottom: '20px' }}>
                    <p style={{ color: '#64748b' }}>No pending correction requests</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
                    {pendingRequests.map((req, i) => (
                        <div key={i} style={{
                            background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px',
                            padding: '16px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                                <div>
                                    <h4 style={{ margin: '0 0 4px 0' }}>{req.studentName}</h4>
                                    <span style={{ fontSize: '12px', color: '#64748b' }}>
                                        {new Date(req.submittedAt).toLocaleDateString()} at {new Date(req.submittedAt).toLocaleTimeString()}
                                    </span>
                                </div>
                                <span style={{
                                    fontSize: '11px', padding: '4px 8px', borderRadius: '12px',
                                    background: '#fff7ed', color: '#c2410c', fontWeight: 600, height: 'fit-content'
                                }}>
                                    Warning: Changes Data
                                </span>
                            </div>

                            <div style={{
                                display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '12px', alignItems: 'center',
                                background: '#f8fafc', padding: '12px', borderRadius: '8px', marginBottom: '16px'
                            }}>
                                <div>
                                    <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>Field</div>
                                    <div style={{ fontWeight: 600 }}>{req.fieldLabel || req.fieldKey}</div>
                                </div>
                                <div style={{ fontSize: '20px', color: '#cbd5e1' }}>→</div>
                                <div>
                                    <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase' }}>Requested Value</div>
                                    <div style={{ fontWeight: 600, color: '#16a34a' }}>{req.correctedValue}</div>
                                    <div style={{ fontSize: '11px', color: '#ef4444', textDecoration: 'line-through' }}>{req.currentValue}</div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                <button
                                    className="btn btn-outline btn-danger btn-sm"
                                    onClick={() => handleAction(req, 'rejected')}
                                    disabled={!!processing}
                                >
                                    <XCircle size={16} /> Reject
                                </button>
                                <button
                                    className="btn btn-primary btn-sm"
                                    onClick={() => handleAction(req, 'approved')}
                                    disabled={!!processing}
                                >
                                    <CheckCircle size={16} /> Approve & Update
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {historyRequests.length > 0 && (
                <div>
                    <h3 style={{ fontSize: '16px', color: '#64748b', marginBottom: '12px' }}>History</h3>
                    <div style={{ opacity: 0.7 }}>
                        {historyRequests.map((req, i) => (
                            <div key={i} style={{
                                padding: '12px', borderBottom: '1px solid #f1f5f9',
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                            }}>
                                <div>
                                    <span style={{ fontWeight: 600 }}>{req.studentName}</span>
                                    <span style={{ margin: '0 8px', color: '#cbd5e1' }}>|</span>
                                    <span>{req.fieldLabel}</span>
                                </div>
                                <span style={{
                                    fontSize: '12px', fontWeight: 600,
                                    color: req.status === 'approved' ? '#16a34a' : '#ef4444'
                                }}>
                                    {req.status.toUpperCase()}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
