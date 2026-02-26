import React, { useState, useMemo } from 'react';
import { GitBranch, Users, X, User, Heart, UserPlus, Trash2 } from 'lucide-react';
import './FamilyTree.css';

export default function FamilyTree({ isOpen, onClose, student, onUpdateFamily }) {
    const [familyMembers, setFamilyMembers] = useState(student?.familyMembers || []);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newMember, setNewMember] = useState({
        name: '',
        relation: 'sibling',
        age: '',
        occupation: '',
        education: ''
    });

    const relationTypes = [
        { value: 'father', label: 'Father', icon: '👨' },
        { value: 'mother', label: 'Mother', icon: '👩' },
        { value: 'grandfather_paternal', label: 'Grandfather (Paternal)', icon: '👴' },
        { value: 'grandmother_paternal', label: 'Grandmother (Paternal)', icon: '👵' },
        { value: 'grandfather_maternal', label: 'Grandfather (Maternal)', icon: '👴' },
        { value: 'grandmother_maternal', label: 'Grandmother (Maternal)', icon: '👵' },
        { value: 'sibling', label: 'Sibling', icon: '👧' },
        { value: 'uncle', label: 'Uncle', icon: '👨' },
        { value: 'aunt', label: 'Aunt', icon: '👩' },
        { value: 'guardian', label: 'Guardian', icon: '🧑' },
    ];

    const getRelationIcon = (relation) => {
        return relationTypes.find(r => r.value === relation)?.icon || '👤';
    };

    const getRelationLabel = (relation) => {
        return relationTypes.find(r => r.value === relation)?.label || relation;
    };

    const organizedFamily = useMemo(() => {
        const grandparents = familyMembers.filter(m =>
            m.relation.includes('grandfather') || m.relation.includes('grandmother')
        );
        const parents = familyMembers.filter(m =>
            m.relation === 'father' || m.relation === 'mother' || m.relation === 'guardian'
        );
        const unclesAunts = familyMembers.filter(m =>
            m.relation === 'uncle' || m.relation === 'aunt'
        );
        const siblings = familyMembers.filter(m => m.relation === 'sibling');

        return { grandparents, parents, unclesAunts, siblings };
    }, [familyMembers]);

    const handleAddMember = () => {
        if (!newMember.name.trim()) return;

        const member = {
            id: Date.now(),
            ...newMember
        };

        const updated = [...familyMembers, member];
        setFamilyMembers(updated);
        if (onUpdateFamily) {
            onUpdateFamily(updated);
        }
        setNewMember({ name: '', relation: 'sibling', age: '', occupation: '', education: '' });
        setShowAddForm(false);
    };

    const handleRemoveMember = (id) => {
        const updated = familyMembers.filter(m => m.id !== id);
        setFamilyMembers(updated);
        if (onUpdateFamily) {
            onUpdateFamily(updated);
        }
    };

    if (!isOpen) return null;

    const getStudentName = () => {
        if (!student) return 'Student';
        return [student.studentFirstName, student.studentMiddleName, student.studentLastName]
            .filter(Boolean)
            .join(' ') || student.name || 'Student';
    };

    return (
        <div className="family-tree-overlay" onClick={onClose}>
            <div className="family-tree-modal" onClick={e => e.stopPropagation()}>
                <div className="family-tree-header">
                    <h2><GitBranch size={24} /> Family Tree</h2>
                    <span className="student-badge">{getStudentName()}</span>
                    <button className="close-btn" onClick={onClose}><X size={20} /></button>
                </div>

                <div className="family-tree-content">
                    {/* Visual Tree */}
                    <div className="tree-visualization">
                        {/* Grandparents Row */}
                        {organizedFamily.grandparents.length > 0 && (
                            <div className="tree-level grandparents">
                                <div className="level-label">Grandparents</div>
                                <div className="members-row">
                                    {organizedFamily.grandparents.map(member => (
                                        <div key={member.id} className="member-card">
                                            <span className="member-icon">{getRelationIcon(member.relation)}</span>
                                            <span className="member-name">{member.name}</span>
                                            <span className="member-relation">{getRelationLabel(member.relation)}</span>
                                            <button
                                                className="remove-btn"
                                                onClick={() => handleRemoveMember(member.id)}
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                                <div className="tree-connector" />
                            </div>
                        )}

                        {/* Parents Row */}
                        <div className="tree-level parents">
                            <div className="level-label">Parents / Guardian</div>
                            <div className="members-row">
                                {organizedFamily.parents.length > 0 ? (
                                    organizedFamily.parents.map(member => (
                                        <div key={member.id} className="member-card parent-card">
                                            <span className="member-icon">{getRelationIcon(member.relation)}</span>
                                            <span className="member-name">{member.name}</span>
                                            <span className="member-relation">{getRelationLabel(member.relation)}</span>
                                            {member.occupation && (
                                                <span className="member-occupation">{member.occupation}</span>
                                            )}
                                            <button
                                                className="remove-btn"
                                                onClick={() => handleRemoveMember(member.id)}
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))
                                ) : (
                                    <div className="empty-slot">
                                        <UserPlus size={24} />
                                        <span>Add parents</span>
                                    </div>
                                )}
                            </div>
                            <div className="tree-connector" />
                        </div>

                        {/* Student (Center) */}
                        <div className="tree-level student-level">
                            <div className="student-node">
                                <div className="student-avatar">
                                    {student?.photo ? (
                                        <img src={student.photo} alt={getStudentName()} />
                                    ) : (
                                        <User size={32} />
                                    )}
                                </div>
                                <span className="student-name">{getStudentName()}</span>
                                <span className="student-label">Student</span>
                            </div>
                        </div>

                        {/* Siblings Row */}
                        {organizedFamily.siblings.length > 0 && (
                            <div className="tree-level siblings">
                                <div className="level-label">Siblings</div>
                                <div className="members-row">
                                    {organizedFamily.siblings.map(member => (
                                        <div key={member.id} className="member-card sibling-card">
                                            <span className="member-icon">{getRelationIcon(member.relation)}</span>
                                            <span className="member-name">{member.name}</span>
                                            {member.age && <span className="member-age">Age: {member.age}</span>}
                                            <button
                                                className="remove-btn"
                                                onClick={() => handleRemoveMember(member.id)}
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Uncles/Aunts on side */}
                        {organizedFamily.unclesAunts.length > 0 && (
                            <div className="extended-family">
                                <div className="level-label">Extended Family</div>
                                <div className="members-row">
                                    {organizedFamily.unclesAunts.map(member => (
                                        <div key={member.id} className="member-card extended-card">
                                            <span className="member-icon">{getRelationIcon(member.relation)}</span>
                                            <span className="member-name">{member.name}</span>
                                            <span className="member-relation">{getRelationLabel(member.relation)}</span>
                                            <button
                                                className="remove-btn"
                                                onClick={() => handleRemoveMember(member.id)}
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Add Member Form */}
                    {showAddForm ? (
                        <div className="add-member-form">
                            <h3><UserPlus size={20} /> Add Family Member</h3>
                            <div className="form-grid">
                                <div className="form-group">
                                    <label>Name</label>
                                    <input
                                        type="text"
                                        value={newMember.name}
                                        onChange={e => setNewMember({ ...newMember, name: e.target.value })}
                                        placeholder="Enter name"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Relation</label>
                                    <select
                                        value={newMember.relation}
                                        onChange={e => setNewMember({ ...newMember, relation: e.target.value })}
                                    >
                                        {relationTypes.map(r => (
                                            <option key={r.value} value={r.value}>
                                                {r.icon} {r.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Age</label>
                                    <input
                                        type="number"
                                        value={newMember.age}
                                        onChange={e => setNewMember({ ...newMember, age: e.target.value })}
                                        placeholder="Age"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Occupation</label>
                                    <input
                                        type="text"
                                        value={newMember.occupation}
                                        onChange={e => setNewMember({ ...newMember, occupation: e.target.value })}
                                        placeholder="Occupation"
                                    />
                                </div>
                            </div>
                            <div className="form-actions">
                                <button className="save-btn" onClick={handleAddMember}>
                                    <UserPlus size={18} /> Add Member
                                </button>
                                <button className="cancel-btn" onClick={() => setShowAddForm(false)}>
                                    Cancel
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button className="add-member-btn" onClick={() => setShowAddForm(true)}>
                            <UserPlus size={20} /> Add Family Member
                        </button>
                    )}
                </div>

                <div className="family-tree-footer">
                    <Users size={16} />
                    <span>{familyMembers.length} family members added</span>
                </div>
            </div>
        </div>
    );
}
