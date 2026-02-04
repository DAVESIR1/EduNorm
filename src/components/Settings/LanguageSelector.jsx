import React, { useState, useContext } from 'react';
import { Globe, ChevronDown, Check, Search } from 'lucide-react';
import LanguageContext from '../../contexts/LanguageContext';
import './LanguageSelector.css';

export default function LanguageSelector({ compact = false }) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    // Use context directly to avoid hook call issues
    const languageData = useContext(LanguageContext);

    // If no language context, don't render
    if (!languageData) {
        return null;
    }

    const { language, changeLanguage, languages, languageCategories, currentLanguage } = languageData;

    const filteredLanguages = Object.entries(languages).filter(([code, lang]) => {
        const query = searchQuery.toLowerCase();
        return lang.name.toLowerCase().includes(query) ||
            lang.nativeName.toLowerCase().includes(query) ||
            code.toLowerCase().includes(query);
    });

    const handleSelect = (code) => {
        changeLanguage(code);
        setIsOpen(false);
        setSearchQuery('');
    };

    return (
        <div className="language-selector">
            <button
                className={`language-trigger ${compact ? 'compact' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                <Globe size={compact ? 16 : 18} />
                {!compact && (
                    <>
                        <span className="current-lang">
                            {currentLanguage?.flag} {currentLanguage?.nativeName || 'English'}
                        </span>
                        <ChevronDown size={14} className={`chevron ${isOpen ? 'open' : ''}`} />
                    </>
                )}
            </button>

            {isOpen && (
                <>
                    <div className="language-overlay" onClick={() => setIsOpen(false)} />
                    <div className="language-dropdown">
                        <div className="language-search">
                            <Search size={16} />
                            <input
                                type="text"
                                placeholder="Search languages..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                autoFocus
                            />
                        </div>

                        <div className="language-list">
                            {searchQuery ? (
                                // Show filtered results
                                filteredLanguages.map(([code, lang]) => (
                                    <button
                                        key={code}
                                        className={`language-option ${language === code ? 'active' : ''}`}
                                        onClick={() => handleSelect(code)}
                                    >
                                        <span className="lang-flag">{lang.flag}</span>
                                        <span className="lang-name">{lang.name}</span>
                                        <span className="lang-native">{lang.nativeName}</span>
                                        {lang.variant && <span className="lang-badge">Mix</span>}
                                        {language === code && <Check size={16} className="check-icon" />}
                                    </button>
                                ))
                            ) : (
                                // Show categorized list
                                Object.entries(languageCategories).map(([catKey, category]) => (
                                    <div key={catKey} className="language-category">
                                        <div className="category-label">{category.label}</div>
                                        {category.languages.map(code => {
                                            const lang = languages[code];
                                            if (!lang) return null;
                                            return (
                                                <button
                                                    key={code}
                                                    className={`language-option ${language === code ? 'active' : ''}`}
                                                    onClick={() => handleSelect(code)}
                                                >
                                                    <span className="lang-flag">{lang.flag}</span>
                                                    <span className="lang-name">{lang.name}</span>
                                                    <span className="lang-native">{lang.nativeName}</span>
                                                    {lang.variant && <span className="lang-badge">Mix</span>}
                                                    {language === code && <Check size={16} className="check-icon" />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
