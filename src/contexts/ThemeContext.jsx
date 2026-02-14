import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState('light');

    // Initialize theme from local storage
    useEffect(() => {
        const saved = localStorage.getItem('theme') || 'edutech'; // Default to EduTech
        setTheme(saved);
        document.documentElement.setAttribute('data-theme', saved);
        document.body.setAttribute('data-theme', saved); // Robustness
    }, []);

    // Change theme function
    const changeTheme = useCallback((newTheme) => {
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
        document.body.setAttribute('data-theme', newTheme);
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
