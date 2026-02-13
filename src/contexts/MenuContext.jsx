import React, { createContext, useContext, useState, useCallback } from 'react';

const MenuContext = createContext(null);

// Define the 5 main menus with their sub-items
export const MENU_STRUCTURE = {
    school: {
        id: 'school',
        name: 'School',
        nameKey: 'menu.school',
        icon: 'school',
        color: '#3B82F6',
        items: [
            { id: 'school-profile', name: 'School Profile', nameKey: 'sidebar.schoolInfo', icon: 'building', status: 'active' },
            { id: 'general-register', name: 'General Register', nameKey: 'nav.register', icon: 'grBook', status: 'active' },
            { id: 'student-profile', name: 'Student Profile', nameKey: 'sidebar.studentProfile', icon: 'studentProfile', status: 'active' },
            { id: 'certificate', name: 'Certificate', nameKey: 'sidebar.certificateGenerator', icon: 'certificate', status: 'active' },
            { id: 'id-card', name: 'ID Card', nameKey: 'profile.idCard', icon: 'idCard', status: 'active' },
            { id: 'teachers-profile', name: 'Teachers Profile', nameKey: 'sidebar.teacherName', icon: 'users', status: 'active' },
            { id: 'upload-logo', name: 'Upload Logo', nameKey: 'sidebar.uploadLogo', icon: 'image', status: 'active' },
            { id: 'custom-window', name: 'Create Custom Window', nameKey: 'sidebar.addNewDataBox', icon: 'plus', status: 'active' },
        ]
    },
    hoi: {
        id: 'hoi',
        name: 'HOI',
        nameKey: 'menu.hoi',
        fullName: 'Head of Institute',
        fullNameKey: 'menu.hoiFull',
        icon: 'crown',
        color: '#8B5CF6',
        protected: true,
        items: [
            { id: 'staff-info', name: 'Staff Info', nameKey: 'sidebar.staffInfo', icon: 'users', status: 'active' },
            { id: 'hoi-diary', name: 'HOI Diary', nameKey: 'sidebar.hoiDiary', icon: 'bookOpen', status: 'active' },
            { id: 'class-management', name: 'Class Management', nameKey: 'sidebar.classManagement', icon: 'calendar', status: 'active' },
            { id: 'correction-requests', name: 'Correction Requests', nameKey: 'sidebar.correctionRequests', icon: 'edit', status: 'active' },
            { id: 'custom-window-hoi', name: 'Create Custom Window', nameKey: 'sidebar.addNewDataBox', icon: 'plus', status: 'active' },
            { id: 'dead-stock', name: 'Dead Stock Register', nameKey: 'sidebar.deadStock', icon: 'fileText', status: 'coming-soon' },
            { id: 'audit-register', name: 'Audit Register', nameKey: 'sidebar.auditRegister', icon: 'fileText', status: 'coming-soon' },
            { id: 'bill-register', name: 'Bill Register', nameKey: 'sidebar.billRegister', icon: 'fileText', status: 'coming-soon' },
            { id: 'hoi-password', name: 'Set / Change Password', nameKey: 'sidebar.hoiPassword', icon: 'shield', status: 'active' },
        ]
    },
    teacher: {
        id: 'teacher',
        name: 'Teacher',
        nameKey: 'menu.teacher',
        icon: 'users',
        color: '#10B981',
        items: [
            { id: 'class-management-teacher', name: 'Class Management', nameKey: 'sidebar.classManagement', icon: 'calendar', status: 'active' },
            { id: 'class-upgrade', name: 'Class Upgrade', nameKey: 'sidebar.classUpgrade', icon: 'arrowUpCircle', status: 'active' },
            { id: 'self-profile', name: 'Self Profile', nameKey: 'sidebar.studentProfile', icon: 'studentProfile', status: 'active' },
            { id: 'salary-book', name: 'Salary Book', nameKey: 'sidebar.salaryBook', icon: 'fileText', status: 'active' },
            { id: 'custom-window-teacher', name: 'Create Custom Window', nameKey: 'sidebar.addNewDataBox', icon: 'plus', status: 'active' },
        ]
    },
    student: {
        id: 'student',
        name: 'Student',
        nameKey: 'menu.student',
        icon: 'studentProfile',
        color: '#F59E0B',
        items: [
            { id: 'student-login', name: 'Student Login', nameKey: 'auth.login', icon: 'shield', status: 'active' },
            { id: 'student-view-profile', name: 'View Profile', nameKey: 'profile.viewProfile', icon: 'studentProfile', status: 'active' },
            { id: 'download-id-card', name: 'Download ID Card', nameKey: 'profile.downloadPdf', icon: 'download', status: 'active' },
            { id: 'correction-request', name: 'Correction Request', nameKey: 'sidebar.correctionRequest', icon: 'edit', status: 'active' },
            { id: 'certificate-download', name: 'Certificate Download', nameKey: 'sidebar.certificateDownload', icon: 'certificate', status: 'active' },
            { id: 'qa-chat', name: 'Q&A Chat', nameKey: 'sidebar.qaChat', icon: 'messageCircle', status: 'active' },
        ]
    },
    other: {
        id: 'other',
        name: 'Other',
        nameKey: 'menu.other',
        icon: 'menu',
        color: '#6B7280',
        items: [
            { id: 'news-circulars', name: 'News & Circulars', nameKey: 'sidebar.newsCirculars', icon: 'fileText', status: 'coming-soon' },
            { id: 'programs-events', name: 'Programs & Events', nameKey: 'sidebar.programsEvents', icon: 'calendar', status: 'coming-soon' },
            { id: 'activity-gallery', name: 'Activity Gallery', nameKey: 'sidebar.activityGallery', icon: 'image', status: 'coming-soon' },
        ]
    },
    dataManagement: {
        id: 'dataManagement',
        name: 'Data Management',
        nameKey: 'menu.dataManagement',
        icon: 'database',
        color: '#EC4899',
        items: [
            { id: 'backup-restore', name: 'Data Import / Export', nameKey: 'sidebar.backupRestore', icon: 'download', status: 'active' },
            { id: 'cloud-backup', name: 'Cloud Backup', nameKey: 'sidebar.cloudBackup', icon: 'cloud', status: 'active' },
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

    // Toggle menu expansion - accordion behavior (auto-close others)
    const toggleMenu = useCallback((menuId) => {
        setExpandedMenus(prev => {
            if (prev.includes(menuId)) {
                // If clicking on already-open menu, close it
                return prev.filter(id => id !== menuId);
            } else {
                // Open this menu and close all others
                return [menuId];
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
        // Get stored password or use default
        const storedPassword = localStorage.getItem('hoi_password') || 'edunorm123';

        if (password === storedPassword) {
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
