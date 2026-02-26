import React, { useState, useMemo } from 'react';
import { X, Search, User, GraduationCap, Phone, Mail, Hash } from 'lucide-react';
import './SmartSearch.css';

export default function SmartSearch({ isOpen, onClose, students = [], onSelectStudent }) {
    const [query, setQuery] = useState('');
    const [selectedFilter, setSelectedFilter] = useState('all');

    const filters = [
        { id: 'all', label: 'All Fields', icon: Search },
        { id: 'name', label: 'Name', icon: User },
        { id: 'grNo', label: 'GR Number', icon: Hash },
        { id: 'class', label: 'Class', icon: GraduationCap },
        { id: 'contact', label: 'Contact', icon: Phone },
    ];

    const searchResults = useMemo(() => {
        if (!query.trim()) return [];

        const q = query.toLowerCase();
        return students.filter(student => {
            const name = (student.name || student.studentFirstName || '').toLowerCase();
            const grNo = (student.grNo || '').toLowerCase();
            const standard = (student.standard || '').toLowerCase();
            const contact = (student.fatherContact || student.motherContact || '').toLowerCase();
            const email = (student.email || '').toLowerCase();

            switch (selectedFilter) {
                case 'name':
                    return name.includes(q);
                case 'grNo':
                    return grNo.includes(q);
                case 'class':
                    return standard.includes(q);
                case 'contact':
                    return contact.includes(q) || email.includes(q);
                default:
                    return name.includes(q) || grNo.includes(q) ||
                        standard.includes(q) || contact.includes(q);
            }
        }).slice(0, 20); // Limit results
    }, [query, students, selectedFilter]);

    const handleSelect = (student) => {
        if (onSelectStudent) {
            onSelectStudent(student);
        }
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="smart-search-overlay" onClick={onClose}>
            <div className="smart-search-modal" onClick={e => e.stopPropagation()}>
                <div className="smart-search-header">
                    <div className="search-input-wrapper">
                        <Search size={20} />
                        <input
                            type="text"
                            className="smart-search-input"
                            placeholder="Search students by name, GR number, class..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            autoFocus
                        />
                        {query && (
                            <button className="clear-btn" onClick={() => setQuery('')}>
                                <X size={16} />
                            </button>
                        )}
                    </div>
                    <button className="close-modal-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="filter-tabs">
                    {filters.map(filter => (
                        <button
                            key={filter.id}
                            className={`filter-tab ${selectedFilter === filter.id ? 'active' : ''}`}
                            onClick={() => setSelectedFilter(filter.id)}
                        >
                            <filter.icon size={14} />
                            {filter.label}
                        </button>
                    ))}
                </div>

                <div className="search-results">
                    {!query.trim() ? (
                        <div className="search-hint">
                            <Search size={48} />
                            <p>Start typing to search students</p>
                            <span>Search across {students.length} students</span>
                        </div>
                    ) : searchResults.length === 0 ? (
                        <div className="no-results">
                            <p>No students found matching "{query}"</p>
                        </div>
                    ) : (
                        <>
                            <div className="results-header">
                                Found {searchResults.length} student{searchResults.length !== 1 ? 's' : ''}
                            </div>
                            {searchResults.map(student => (
                                <button
                                    key={student.id}
                                    className="result-item"
                                    onClick={() => handleSelect(student)}
                                >
                                    <div className="result-avatar">
                                        <User size={20} />
                                    </div>
                                    <div className="result-info">
                                        <div className="result-name">
                                            {student.name || student.studentFirstName || 'Student'}
                                        </div>
                                        <div className="result-meta">
                                            <span><Hash size={12} /> GR: {student.grNo || 'N/A'}</span>
                                            <span><GraduationCap size={12} /> {student.standard || 'N/A'}</span>
                                            {student.fatherContact && (
                                                <span><Phone size={12} /> {student.fatherContact}</span>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </>
                    )}
                </div>

                <div className="search-footer">
                    <span>Press <kbd>Esc</kbd> to close</span>
                </div>
            </div>
        </div>
    );
}
