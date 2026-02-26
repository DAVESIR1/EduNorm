import React, { useState } from 'react';
import { useMenu, MENU_STRUCTURE } from '../../contexts/MenuContext';
import { IconMap } from '../Icons/CustomIcons';
import './MainMenu.css';

// Password modal for HOI access
function PasswordModal({ isOpen, onClose, onSubmit }) {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        const success = onSubmit(password);
        if (!success) {
            setError('Incorrect password');
        } else {
            setPassword('');
            setError('');
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="password-modal" onClick={e => e.stopPropagation()}>
                <h3>🔒 HOI Access</h3>
                <p>Enter password to access Head of Institute menu</p>
                <form onSubmit={handleSubmit}>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter password"
                        autoFocus
                    />
                    {error && <span className="error">{error}</span>}
                    <div className="modal-actions">
                        <button type="button" onClick={onClose} className="btn-secondary">
                            Cancel
                        </button>
                        <button type="submit" className="btn-primary">
                            Unlock
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// Coming Soon Badge
function ComingSoonBadge() {
    return <span className="coming-soon-badge">Coming Soon</span>;
}

// Menu Item Component
function MenuItem({ item, menuId, isActive, onClick }) {
    const isComingSoon = item.status === 'coming-soon';
    const IconComponent = IconMap[item.icon] || IconMap.fileText;

    return (
        <button
            className={`menu-item ${isActive ? 'active' : ''} ${isComingSoon ? 'disabled' : ''}`}
            onClick={() => !isComingSoon && onClick(menuId, item.id)}
            disabled={isComingSoon}
        >
            <IconComponent size={20} />
            <span className="item-name">{item.name}</span>
            {isComingSoon && <ComingSoonBadge />}
        </button>
    );
}

// Main Menu Section Component
function MenuSection({ menu, isExpanded, onToggle, onItemClick, activeSubItem }) {
    const { hoiUnlocked, getMenuItems } = useMenu();
    const IconComponent = IconMap[menu.icon] || IconMap.menu;
    const items = getMenuItems(menu.id);

    const isLocked = menu.protected && !hoiUnlocked;

    return (
        <div className={`menu-section ${isExpanded ? 'expanded' : ''}`}>
            <button
                className="menu-header"
                onClick={() => onToggle(menu.id)}
                style={{ '--menu-color': menu.color }}
            >
                <div className="menu-header-left">
                    <IconComponent size={24} />
                    <span className="menu-name">{menu.name}</span>
                    {menu.fullName && (
                        <span className="menu-fullname">({menu.fullName})</span>
                    )}
                </div>
                <div className="menu-header-right">
                    {isLocked && <span className="lock-icon">🔒</span>}
                    <span className={`chevron ${isExpanded ? 'rotated' : ''}`}>▼</span>
                </div>
            </button>

            {isExpanded && (
                <div className="menu-items">
                    {items.map(item => (
                        <MenuItem
                            key={item.id}
                            item={item}
                            menuId={menu.id}
                            isActive={activeSubItem === item.id}
                            onClick={onItemClick}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default function MainMenu({ onNavigate }) {
    const {
        expandedMenus,
        toggleMenu,
        selectSubItem,
        activeSubItem,
        unlockHoi,
        hoiUnlocked
    } = useMenu();

    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [pendingNavigation, setPendingNavigation] = useState(null);

    const handleItemClick = (menuId, itemId) => {
        const result = selectSubItem(menuId, itemId);

        if (result.requiresPassword) {
            setPendingNavigation({ menuId, itemId });
            setShowPasswordModal(true);
            return;
        }

        if (result.success && onNavigate) {
            onNavigate(menuId, itemId);
        }
    };

    const handlePasswordSubmit = (password) => {
        const success = unlockHoi(password);
        if (success && pendingNavigation) {
            selectSubItem(pendingNavigation.menuId, pendingNavigation.itemId);
            if (onNavigate) {
                onNavigate(pendingNavigation.menuId, pendingNavigation.itemId);
            }
            setPendingNavigation(null);
        }
        return success;
    };

    return (
        <div className="main-menu">
            <div className="menu-title">
                <h3>📚 Main Menu</h3>
            </div>

            <div className="menu-sections">
                {Object.values(MENU_STRUCTURE).map(menu => (
                    <MenuSection
                        key={menu.id}
                        menu={menu}
                        isExpanded={expandedMenus.includes(menu.id)}
                        onToggle={toggleMenu}
                        onItemClick={handleItemClick}
                        activeSubItem={activeSubItem}
                    />
                ))}
            </div>

            <PasswordModal
                isOpen={showPasswordModal}
                onClose={() => {
                    setShowPasswordModal(false);
                    setPendingNavigation(null);
                }}
                onSubmit={handlePasswordSubmit}
            />
        </div>
    );
}
