import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import languages, { getTranslation, languageCategories } from '../i18n';

const LanguageContext = createContext(null);

const STORAGE_KEY = 'edunorm_language';

export function LanguageProvider({ children }) {
    const [language, setLanguage] = useState(() => {
        // Get from localStorage or browser preference
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved && languages[saved]) return saved;

        // Try browser language
        const browserLang = navigator.language?.split('-')[0];
        if (languages[browserLang]) return browserLang;

        return 'en';
    });

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, language);

        // Set RTL direction if needed
        const langData = languages[language];
        document.documentElement.dir = langData?.rtl ? 'rtl' : 'ltr';
        document.documentElement.lang = language;
    }, [language]);

    const changeLanguage = useCallback((langCode) => {
        if (languages[langCode]) {
            setLanguage(langCode);
        }
    }, []);

    // Translation function
    const t = useCallback((path, fallback = '') => {
        const result = getTranslation(language, path);
        return result !== path ? result : (fallback || path);
    }, [language]);

    // Get current language info
    const currentLanguage = languages[language] || languages.en;

    const value = {
        language,
        changeLanguage,
        t,
        languages,
        languageCategories,
        currentLanguage,
        isRTL: currentLanguage.rtl || false,
    };

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}

// HOC for class components
export function withLanguage(Component) {
    return function WrappedComponent(props) {
        const languageProps = useLanguage();
        return <Component {...props} {...languageProps} />;
    };
}

export default LanguageContext;
