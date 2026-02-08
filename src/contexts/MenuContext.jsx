import React, { createContext, useContext, useState, useCallback } from 'react';

const MenuContext = createContext(null);

// Define the 5 main menus with their sub-items
export const MENU_STRUCTURE = {
    school: {
        id: 'school',
        name: 'School',
        icon: 'school',
        color: '#3B82F6',
        items: [
            { id: 'school-profile', name: 'School Profile', icon: 'building', status: 'active' },
            { id: 'general-register', name: 'General Register', icon: 'grBook', status: 'active' },
            { id: 'student-profile', name: 'Student Profile', icon: 'studentProfile', status: 'active' },
            { id: 'certificate', name: 'Certificate', icon: 'certificate', status: 'active' },
            { id: 'id-card', name: 'ID Card', icon: 'idCard', status: 'active' },
            { id: 'teachers-profile', name: 'Teachers Profile', icon: 'users', status: 'active' },
            { id: 'custom-window', name: 'Create Custom Window', icon: 'plus', status: 'active' },
        ]
    },
    hoi: {
        id: 'hoi',
        name: 'HOI',
        fullName: 'Head of Institute',
        icon: 'crown',
        color: '#8B5CF6',
        protected: true,
        items: [
            { id: 'staff-info', name: 'Staff Info', icon: 'users', status: 'active' },
            { id: 'hoi-diary', name: 'HOI Diary', icon: 'bookOpen', status: 'active' },
            { id: 'class-management', name: 'Class Management', icon: 'calendar', status: 'active' },
            { id: 'custom-window-hoi', name: 'Create Custom Window', icon: 'plus', status: 'active' },
            { id: 'dead-stock', name: 'Dead Stock Register', icon: 'fileText', status: 'coming-soon' },
            { id: 'audit-register', name: 'Audit Register', icon: 'fileText', status: 'coming-soon' },
            { id: 'bill-register', name: 'Bill Register', icon: 'fileText', status: 'coming-soon' },
        ]
    },
    teacher: {
        id: 'teacher',
        name: 'Teacher',
        icon: 'users',
        color: '#10B981',
        items: [
            { id: 'special-features', name: 'Special Features', icon: 'sparkles', status: 'active' },
            { id: 'class-management-teacher', name: 'Class Management', icon: 'calendar', status: 'active' },
            { id: 'self-profile', name: 'Self Profile', icon: 'studentProfile', status: 'active' },
            { id: 'salary-book', name: 'Salary Book', icon: 'fileText', status: 'active' },
            { id: 'custom-window-teacher', name: 'Create Custom Window', icon: 'plus', status: 'active' },
        ]
    },
    student: {
        id: 'student',
        name: 'Student',
        icon: 'studentProfile',
        color: '#F59E0B',
        items: [
            { id: 'student-login', name: 'Student Login', icon: 'shield', status: 'active' },
            { id: 'student-view-profile', name: 'View Profile', icon: 'studentProfile', status: 'active' },
            { id: 'download-id-card', name: 'Download ID Card', icon: 'download', status: 'active' },
            { id: 'self-update', name: 'Self Update', icon: 'edit', status: 'coming-soon' },
            { id: 'download-certificate', name: 'Download Certificate', icon: 'certificate', status: 'coming-soon' },
            { id: 'qa-chat', name: 'Q&A Chat', icon: 'messageCircle', status: 'coming-soon' },
        ]
    },
    other: {
        id: 'other',
        name: 'Other',
        icon: 'menu',
        color: '#6B7280',
        items: [
            { id: 'news-circulars', name: 'News & Circulars', icon: 'fileText', status: 'coming-soon' },
            { id: 'programs-events', name: 'Programs & Events', icon: 'calendar', status: 'coming-soon' },
            { id: 'activity-gallery', name: 'Activity Gallery', icon: 'image', status: 'coming-soon' },
        ]
    }
};

export function MenuProvider({ children }) {
    const [activeMenu, setActiveMenu] = useState(null);
    const [activeSubItem, setActiveSubItem] = useState(null);
    const [expandedMenus, setExpandedMenus] = useState(['school']);
    const [hoiUnlocked, setHoiUnlocked] = useState(false);
    const [customWindows, setCustomWindows] = useState({
        school: [],
        hoi: [],
        teacher: []
    });

    // Toggle menu expansion
    const toggleMenu = useCallback((menuId) => {
        setExpandedMenus(prev => {
            if (prev.includes(menuId)) {
                return prev.filter(id => id !== menuId);
            } else {
                return [...prev, menuId];
            }
        });
    }, []);

    // Select a sub-item
    const selectSubItem = useCallback((menuId, itemId) => {
        // Check if HOI menu requires password
        if (menuId === 'hoi' && !hoiUnlocked) {
            return { requiresPassword: true };
        }

        setActiveMenu(menuId);
        setActiveSubItem(itemId);
        return { success: true };
    }, [hoiUnlocked]);

    // Unlock HOI with password
    const unlockHoi = useCallback((password) => {
        // TODO: Verify password against stored hash
        // For now, simple check
        const storedPassword = localStorage.getItem('hoi_password');
        if (!storedPassword || password === storedPassword) {
            setHoiUnlocked(true);
            return true;
        }
        return false;
    }, []);

    // Set HOI password
    const setHoiPassword = useCallback((password) => {
        localStorage.setItem('hoi_password', password);
        setHoiUnlocked(true);
    }, []);

    // Lock HOI
    const lockHoi = useCallback(() => {
        setHoiUnlocked(false);
    }, []);

    // Add custom window to a menu
    const addCustomWindow = useCallback((menuId, windowData) => {
        setCustomWindows(prev => ({
            ...prev,
            [menuId]: [...(prev[menuId] || []), {
                id: `custom-${Date.now()}`,
                ...windowData,
                status: 'active',
                isCustom: true
            }]
        }));
    }, []);

    // Remove custom window
    const removeCustomWindow = useCallback((menuId, windowId) => {
        setCustomWindows(prev => ({
            ...prev,
            [menuId]: (prev[menuId] || []).filter(w => w.id !== windowId)
        }));
    }, []);

    // Get all items for a menu (including custom windows)
    const getMenuItems = useCallback((menuId) => {
        const baseItems = MENU_STRUCTURE[menuId]?.items || [];
        const customItems = customWindows[menuId] || [];
        return [...baseItems, ...customItems];
    }, [customWindows]);

    return (
        <MenuContext.Provider value={{
            menus: MENU_STRUCTURE,
            activeMenu,
            activeSubItem,
            expandedMenus,
            hoiUnlocked,
            customWindows,
            toggleMenu,
            selectSubItem,
            unlockHoi,
            setHoiPassword,
            lockHoi,
            addCustomWindow,
            removeCustomWindow,
            getMenuItems
        }}>
            {children}
        </MenuContext.Provider>
    );
}

export function useMenu() {
    const context = useContext(MenuContext);
    if (!context) {
        throw new Error('useMenu must be used within a MenuProvider');
    }
    return context;
}

export default MenuContext;
