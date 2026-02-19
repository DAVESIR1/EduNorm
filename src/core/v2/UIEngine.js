/**
 * EDUNORM V2: THEME & LAYOUT ENGINE
 * PHILOSOPHY: Fluid Response, Persistent Theme, 0-FOUC.
 */

export const UIEngine = {
    /**
     * Initialize Theme & Layout
     * Prevents Flash of Unstyled Content (FOUC).
     */
    init() {
        // 1. Persistent Theme Check
        const theme = localStorage.getItem('enorm_theme') || 'light';
        document.documentElement.setAttribute('data-theme', theme);

        // 2. Body Visibility
        if (document.body) {
            document.body.style.visibility = "visible";
        }

        // 3. Layout Brain
        this.smartMenuAdjustment();

        console.log(`🚀 Bento-Glass UI Initialized [Theme: ${theme}]`);
    },

    /**
     * Logic: If nav-items > 8, auto-collapse into Categories or shrink to prevent overlapping.
     */
    smartMenuAdjustment() {
        const navItems = document.querySelectorAll('.nav-item');
        const sidebar = document.querySelector('.sidebar');
        if (navItems.length > 8 && sidebar) {
            sidebar.classList.add('compact-mode');
        }
    },

    /**
     * Toggle between Light and Dark modes
     */
    toggleTheme() {
        const current = document.documentElement.getAttribute('data-theme');
        const target = current === 'light' ? 'dark' : 'light';

        document.documentElement.setAttribute('data-theme', target);
        localStorage.setItem('enorm_theme', target);

        console.log(`🌓 Theme switched to: ${target}`);
        return target;
    },

    /**
     * Get Current Theme
     */
    getTheme() {
        return document.documentElement.getAttribute('data-theme') || 'light';
    }
};

export default UIEngine;
