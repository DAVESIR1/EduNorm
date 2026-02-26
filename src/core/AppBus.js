/**
 * APP BUS — EduNorm Universal Event Bridge
 *
 * THE GOLDEN RULE: Features NEVER import each other.
 *                  They ONLY communicate through AppBus.
 *
 * Usage:
 *   import AppBus from '../core/AppBus';
 *   AppBus.emit('student:saved', { grNo: '101' });
 *   AppBus.on('student:saved', (data) => { ... });
 *   AppBus.off('student:saved', myHandler);
 */

// ─── Typed Event Catalogue ────────────────────────────────────────────────────
// All events MUST be declared here. This is the contract between features.
export const APP_EVENTS = {
    // ── Data Events ─────────────────────────────────────────────
    STUDENT_SAVED: 'student:saved',       // { student }
    STUDENT_DELETED: 'student:deleted',     // { grNo }
    STUDENT_IMPORTED: 'student:imported',    // { count }
    SETTINGS_CHANGED: 'settings:changed',    // { key, value }
    STANDARD_CHANGED: 'standard:changed',    // { standard }

    // ── Backup Events ────────────────────────────────────────────
    BACKUP_REQUESTED: 'backup:requested',    // { userId }
    BACKUP_QUEUED: 'backup:queued',       // { queueId }
    BACKUP_COMPLETE: 'backup:complete',     // { synced, students }
    RESTORE_COMPLETE: 'restore:complete',    // { restored }

    // ── Navigation Events ────────────────────────────────────────
    NAVIGATE_TO: 'navigate:to',         // { featureId, params }
    MENU_OPENED: 'menu:opened',         // { menuId }

    // ── Auth Events ──────────────────────────────────────────────
    USER_LOGGED_IN: 'auth:login',          // { user }
    USER_LOGGED_OUT: 'auth:logout',         // {}

    // ── System Events ────────────────────────────────────────────
    SYNC_START: 'sync:start',          // {}
    SYNC_SUCCESS: 'sync:success',        // { layers }
    SYNC_FAIL: 'sync:fail',           // { error }
    APP_READY: 'app:ready',           // {}
};

// ─── Internal listener map ────────────────────────────────────────────────────
const _listeners = new Map();

function _getHandlers(event) {
    if (!_listeners.has(event)) _listeners.set(event, []);
    return _listeners.get(event);
}

// ─── AppBus API ───────────────────────────────────────────────────────────────
const AppBus = {
    /**
     * Subscribe to an event.
     * @returns {Function} unsubscribe function (call to remove the listener)
     */
    on(event, handler) {
        if (typeof handler !== 'function') throw new Error(`AppBus.on: handler must be a function (event: ${event})`);
        const handlers = _getHandlers(event);
        if (!handlers.includes(handler)) handlers.push(handler);

        // Return unsubscribe fn so callers can easily clean up
        return () => this.off(event, handler);
    },

    /**
     * Subscribe to an event exactly once.
     */
    once(event, handler) {
        const wrapper = (data) => { this.off(event, wrapper); handler(data); };
        return this.on(event, wrapper);
    },

    /**
     * Unsubscribe from an event.
     */
    off(event, handler) {
        if (!_listeners.has(event)) return;
        const handlers = _getHandlers(event);
        const idx = handlers.indexOf(handler);
        if (idx !== -1) handlers.splice(idx, 1);
    },

    /**
     * Emit an event to all subscribers.
     * Errors in handlers are caught so one bad handler can't break others.
     */
    emit(event, data) {
        const handlers = _getHandlers(event);
        if (handlers.length === 0) return;

        for (const handler of [...handlers]) { // copy to avoid mutation during iteration
            try {
                handler(data);
            } catch (err) {
                console.error(`[AppBus] Handler error on "${event}":`, err);
            }
        }
    },

    /** List all events with active subscribers (for debugging) */
    debug() {
        const active = {};
        for (const [event, handlers] of _listeners) {
            if (handlers.length > 0) active[event] = handlers.length;
        }
        console.table(active);
        return active;
    },
};

// Expose on window for debugging in DevTools
if (typeof window !== 'undefined') {
    window.AppBus = AppBus;
    window.APP_EVENTS = APP_EVENTS;
}

export default AppBus;
