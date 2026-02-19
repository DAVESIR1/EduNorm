/**
 * SyncEventBus — Lightweight pub/sub for sync events
 * Used by SyncPulse, OfflineQueue, and Toast to react to real sync activity.
 */

const listeners = new Map();
let eventIdCounter = 0;

const SyncEventBus = {
    // Event types
    EVENTS: {
        SYNC_START: 'sync:start',
        SYNC_SUCCESS: 'sync:success',
        SYNC_FAIL: 'sync:fail',
        SYNC_LAYERS: 'sync:layers',
        QUEUE_ADD: 'queue:add',
        QUEUE_REMOVE: 'queue:remove',
        ONLINE: 'network:online',
        OFFLINE: 'network:offline',
    },

    // Recent events log (last 10)
    _recentEvents: [],

    on(event, callback) {
        if (!listeners.has(event)) listeners.set(event, new Set());
        listeners.get(event).add(callback);
        return () => listeners.get(event)?.delete(callback);
    },

    emit(event, data = {}) {
        const entry = {
            id: ++eventIdCounter,
            event,
            data,
            timestamp: Date.now(),
        };
        this._recentEvents = [entry, ...this._recentEvents].slice(0, 10);

        listeners.get(event)?.forEach(cb => {
            try { cb(data, entry); } catch (e) { console.warn('SyncEventBus error:', e); }
        });
    },

    getRecentEvents(count = 5) {
        return this._recentEvents.slice(0, count);
    },

    // Network monitoring — auto-emit online/offline
    _networkInitialized: false,
    initNetworkMonitor() {
        if (this._networkInitialized || typeof window === 'undefined') return;
        this._networkInitialized = true;

        window.addEventListener('online', () => {
            this.emit(this.EVENTS.ONLINE);
        });
        window.addEventListener('offline', () => {
            this.emit(this.EVENTS.OFFLINE);
        });
    },
};

// Auto-init network monitor
if (typeof window !== 'undefined') {
    SyncEventBus.initNetworkMonitor();
}

export default SyncEventBus;
