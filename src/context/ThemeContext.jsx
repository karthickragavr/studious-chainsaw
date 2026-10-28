import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
};

export const ThemeProvider = ({ children }) => {
    // 1. Determine Initial Theme
    const [theme, setTheme] = useState(() => {
        const savedTheme = localStorage.getItem('casino_theme');
        if (savedTheme) {
            return savedTheme; // User explicitly set a preference
        }

        // No saved preference, use OS system default
        if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'classic'; // Default fallback
    });

    // 2. Listen for System Theme Changes
    useEffect(() => {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        const handleChange = (e) => {
            // Only auto-switch if the user hasn't explicitly saved a preference
            if (!localStorage.getItem('casino_theme')) {
                setTheme(e.matches ? 'dark' : 'classic');
            }
        };

        // Add listener
        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, []);

    // 3. Apply Theme to Document
    useEffect(() => {
        // We do NOT set localStorage here automatically on every render,
        // otherwise we'd immediately override the system setting on first load!
        const root = document.documentElement;
        if (theme === 'classic') {
            root.classList.add('theme-classic');
        } else {
            root.classList.remove('theme-classic');
        }
    }, [theme]);

    // 4. Manual Toggle Function (Saves Preference)
    const toggleTheme = () => {
        setTheme(prev => {
            const newTheme = prev === 'dark' ? 'classic' : 'dark';
            localStorage.setItem('casino_theme', newTheme);
            return newTheme;
        });
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};
