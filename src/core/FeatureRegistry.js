/**
 * FEATURE REGISTRY — EduNorm Bond Layer
 *
 * Every feature registers itself here. AppShell reads this to:
 *   - Build the sidebar menu automatically
 *   - Lazy-load the correct component on navigation
 *   - Wire up AppBus event handlers
 *
 * TO ADD A NEW FEATURE:
 *   1. Create src/features/YourFeature/manifest.js
 *   2. Import and register it here
 *   3. Done. App.jsx doesn't need touching.
 *
 * TO REMOVE A FEATURE:
 *   1. Remove its import line below
 *   2. Done. Nothing else breaks.
 */

import AppBus, { APP_EVENTS } from './AppBus.js';

// ─── Feature Manifest Shape ───────────────────────────────────────────────────
// Each feature must export an object matching this shape:
//
// {
//   id:        string,           // unique key, used for routing
//   name:      string,           // display name in menu
//   icon:      string,           // emoji or lucide icon name
//   group:     string,           // sidebar group: 'school'|'hoi'|'teacher'|'other'
//   order:     number,           // position in the sidebar group
//   roles:     string[],         // who can see it: ['admin','hoi','teacher','any']
//   component: () => Promise,    // dynamic import of the view component
//   onEvents?: Record<string, Function>, // AppBus events this feature reacts to
// }

const _registry = new Map();   // id → manifest
const _groups = new Map();   // group → manifest[]

// ─── Register ─────────────────────────────────────────────────────────────────
function register(manifest) {
    const required = ['id', 'name', 'group', 'component'];
    for (const key of required) {
        if (!manifest[key]) throw new Error(`FeatureRegistry: manifest missing "${key}" (feature: ${manifest.id || '?'})`);
    }

    if (_registry.has(manifest.id)) {
        console.warn(`FeatureRegistry: "${manifest.id}" is already registered — skipping duplicate`);
        return;
    }

    _registry.set(manifest.id, manifest);

    // Add to group
    if (!_groups.has(manifest.group)) _groups.set(manifest.group, []);
    _groups.get(manifest.group).push(manifest);
    _groups.get(manifest.group).sort((a, b) => (a.order || 99) - (b.order || 99));

    // Wire AppBus event handlers declared in the manifest
    if (manifest.onEvents) {
        for (const [event, handler] of Object.entries(manifest.onEvents)) {
            AppBus.on(event, handler);
        }
    }

    console.log(`[FeatureRegistry] Registered: ${manifest.id} (group: ${manifest.group})`);
}

// ─── Query ────────────────────────────────────────────────────────────────────
function get(id) {
    return _registry.get(id) || null;
}

function getGroup(group) {
    return _groups.get(group) || [];
}

function getAll() {
    return Array.from(_registry.values());
}

function getAllGroups() {
    return Object.fromEntries(_groups);
}

/** Filter features visible to a given role */
function getForRole(role) {
    return getAll().filter(f => {
        const roles = f.roles || ['any'];
        return roles.includes('any') || roles.includes(role);
    });
}

/** Load a feature's component (returns the lazy-loaded React component factory) */
async function loadComponent(id) {
    const manifest = get(id);
    if (!manifest) throw new Error(`FeatureRegistry: no feature found for id "${id}"`);
    return manifest.component;
}

// ─── Auto-Backup Bond ─────────────────────────────────────────────────────────
// Global rule: whenever ANY feature emits a data change event,
// trigger an automatic backup queue. Features don't need to know about backup.
const DATA_CHANGE_EVENTS = [
    APP_EVENTS.STUDENT_SAVED,
    APP_EVENTS.STUDENT_DELETED,
    APP_EVENTS.STUDENT_IMPORTED,
    APP_EVENTS.SETTINGS_CHANGED,
    APP_EVENTS.STANDARD_CHANGED,
];

let _backupHandler = null;

function setAutoBackupHandler(handler) {
    // Remove old handler first
    if (_backupHandler) {
        DATA_CHANGE_EVENTS.forEach(e => AppBus.off(e, _backupHandler));
    }
    _backupHandler = handler;
    DATA_CHANGE_EVENTS.forEach(e => AppBus.on(e, handler));
    console.log('[FeatureRegistry] Auto-backup wired to all data change events');
}

// ─── Export ───────────────────────────────────────────────────────────────────
const FeatureRegistry = {
    register,
    get,
    getGroup,
    getAll,
    getAllGroups,
    getForRole,
    loadComponent,
    setAutoBackupHandler,
};

if (typeof window !== 'undefined') {
    window.FeatureRegistry = FeatureRegistry;
}

export default FeatureRegistry;
