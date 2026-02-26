import React, { useState } from 'react';
import { Search, X } from 'lucide-react';
import './LedgerSearch.css';

export default function LedgerSearch({ onSearch, query }) {
    const [value, setValue] = useState(query || '');

    const handleSubmit = (e) => {
        e.preventDefault();
        onSearch(value);
    };

    const handleClear = () => {
        setValue('');
        onSearch('');
    };

    return (
        <form className="ledger-search" onSubmit={handleSubmit}>
            <div className="search-input-wrapper">
                <Search size={18} className="search-icon" />
                <input
                    type="text"
                    className="search-input"
                    placeholder="Search by name, GR no., or roll no..."
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                />
                {value && (
                    <button type="button" className="clear-btn" onClick={handleClear}>
                        <X size={16} />
                    </button>
                )}
            </div>
            <button type="submit" className="btn btn-primary">
                Search
            </button>
        </form>
    );
}
