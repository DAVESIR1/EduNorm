import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState('light');

    // Initialize theme from local storage
    useEffect(() => {
        const saved = localStorage.getItem('enorm_theme') || 'light';
        setTheme(saved);
        document.documentElement.setAttribute('data-theme', saved);
        if (saved === 'dark') {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
    }, []);

    // Change theme function
    const changeTheme = useCallback((newTheme) => {
        setTheme(newTheme);
        localStorage.setItem('enorm_theme', newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
        if (newTheme === 'dark') {
            document.body.classList.add('dark-mode');
        } else {
            document.body.classList.remove('dark-mode');
        }
    }, []);

    const value = {
        theme,
        changeTheme
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}

export default ThemeContext;
