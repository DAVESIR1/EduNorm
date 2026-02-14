import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { GraduationCap, BookOpen, School, Check } from 'lucide-react';
import './RoleSelectionModal.css';

export default function RoleSelectionModal({ isOpen, onComplete }) {
    const { user, updateProfile } = useAuth();
    const [selectedRole, setSelectedRole] = useState(null);
    const [loading, setLoading] = useState(false);
    const [rollNo, setRollNo] = useState('');

    if (!isOpen) return null;

    const handleConfirm = async () => {
        if (!selectedRole) return;
        if (selectedRole === 'student' && !rollNo.trim()) {
            alert('Please enter your Roll Number');
            return;
        }

        setLoading(true);
        try {
            const updates = {
                role: selectedRole,
                roleSelectedAt: new Date().toISOString()
            };
            if (selectedRole === 'student') {
                updates.rollNo = rollNo;
            }

            const result = await updateProfile(updates);
            if (result.success) {
                onComplete();
            } else {
                alert('Failed to save role: ' + result.error);
            }
        } catch (error) {
            console.error('Role selection error:', error);
            alert('An error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="role-modal-overlay">
            <div className="role-modal-content">
                <h2>🎓 Welcome to EduNorm</h2>
                <p>Please select your role to continue setup.</p>

                <div className="role-options-grid">
                    <div
                        className={`role-option ${selectedRole === 'student' ? 'selected' : ''}`}
                        onClick={() => setSelectedRole('student')}
                    >
                        <div className="role-icon-box">
                            <GraduationCap size={32} />
                        </div>
                        <h3>Student</h3>
                    </div>

                    <div
                        className={`role-option ${selectedRole === 'teacher' ? 'selected' : ''}`}
                        onClick={() => setSelectedRole('teacher')}
                    >
                        <div className="role-icon-box">
                            <BookOpen size={32} />
                        </div>
                        <h3>Teacher</h3>
                    </div>

                    <div
                        className={`role-option ${selectedRole === 'hoi' ? 'selected' : ''}`}
                        onClick={() => setSelectedRole('hoi')}
                    >
                        <div className="role-icon-box">
                            <School size={32} />
                        </div>
                        <h3>Head of Institute</h3>
                    </div>
                </div>

                {selectedRole === 'student' && (
                    <div className="role-input-group animate-fade-in">
                        <label>Roll Number / GR No.</label>
                        <input
                            type="text"
                            className="input-field"
                            placeholder="Enter your Roll No."
                            value={rollNo}
                            onChange={e => setRollNo(e.target.value)}
                        />
                    </div>
                )}

                <button
                    className="btn btn-primary btn-large confirm-role-btn"
                    disabled={!selectedRole || loading}
                    onClick={handleConfirm}
                >
                    {loading ? 'Saving...' : 'Continue to Dashboard'}
                    {!loading && <Check size={20} />}
                </button>
            </div>
        </div>
    );
}
