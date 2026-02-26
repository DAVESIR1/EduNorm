import React, { useState, useEffect, useCallback, useRef } from 'react';
import SyncEventBus from '../../services/SyncEventBus';
import { toast } from './Toast';
import './OfflineQueue.css';

/**
 * OfflineQueue — Floating Action Button + slide-up panel
 * Shows pending sync items. Only visible when items are queued.
 */

function timeAgo(ts) {
    const diff = Date.now() - ts;
    if (diff < 60000) return 'just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
}

function getQueuedItems() {
    if (typeof localStorage === 'undefined') return [];
    const items = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('infinity_retry_')) {
            try {
                const data = JSON.parse(localStorage.getItem(key));
                items.push({
                    key,
                    sid: data.header?.sid || key.replace('infinity_retry_', ''),
                    type: data.header?.type || 'unknown',
                    timestamp: data.header?.sync_ts || data.header?.ts || Date.now(),
                    data,
                });
            } catch (e) { /* skip corrupted */ }
        }
    }
    // Sort oldest first
    return items.sort((a, b) => a.timestamp - b.timestamp);
}

export default function OfflineQueue() {
    const [items, setItems] = useState([]);
    const [showPanel, setShowPanel] = useState(false);
    const [syncingIds, setSyncingIds] = useState(new Set());
    const [syncedIds, setSyncedIds] = useState(new Set());
    const pollRef = useRef(null);

    // Scan localStorage for queued items
    const scanQueue = useCallback(() => {
        const queued = getQueuedItems();
        setItems(queued);
    }, []);

    // Initial scan + poll every 5s
    useEffect(() => {
        scanQueue();
        pollRef.current = setInterval(scanQueue, 5000);
        return () => clearInterval(pollRef.current);
    }, [scanQueue]);

    // Listen for queue events
    useEffect(() => {
        const { EVENTS } = SyncEventBus;

        const unsubs = [
            SyncEventBus.on(EVENTS.QUEUE_ADD, () => {
                scanQueue();
            }),
            SyncEventBus.on(EVENTS.QUEUE_REMOVE, (data) => {
                if (data?.sid) {
                    setSyncedIds(prev => new Set([...prev, data.sid]));
                    setTimeout(() => {
                        setSyncedIds(prev => {
                            const next = new Set(prev);
                            next.delete(data.sid);
                            return next;
                        });
                        scanQueue();
                    }, 700);
                }
            }),
        ];

        return () => unsubs.forEach(u => u());
    }, [scanQueue]);

    // Retry a specific item
    const handleRetry = useCallback(async (item) => {
        setSyncingIds(prev => new Set([...prev, item.sid]));

        try {
            // Dynamic import to avoid circular deps
            const { InfinitySync } = await import('../../core/v2/InfinitySync.js');

            const results = await Promise.all([
                InfinitySync.dispatch('Firestore', item.data).catch(() => false),
                InfinitySync.dispatch('R2', item.data).catch(() => false),
                InfinitySync.dispatch('Mega', item.data).catch(() => false),
            ]);

            const active = results.filter(Boolean).length;

            if (active >= 2) {
                // Success — remove from queue
                localStorage.removeItem(item.key);
                SyncEventBus.emit(SyncEventBus.EVENTS.QUEUE_REMOVE, { sid: item.sid });
                SyncEventBus.emit(SyncEventBus.EVENTS.SYNC_SUCCESS, { layers: active });
                toast.sync(active, 3);
            } else if (active > 0) {
                toast.warning('Partial sync', `Only ${active}/3 layers reached. Will retry.`);
            } else {
                toast.error('Sync failed', 'Could not reach any cloud layer. Check your connection.');
            }
        } catch (err) {
            toast.error('Retry failed', err.message);
        } finally {
            setSyncingIds(prev => {
                const next = new Set(prev);
                next.delete(item.sid);
                return next;
            });
        }
    }, []);

    // Don't render if no items
    if (items.length === 0) return null;

    const ONE_HOUR = 3600000;
    const ONE_DAY = 86400000;

    return (
        <>
            {/* FAB */}
            <button
                className="offline-queue-fab"
                onClick={() => setShowPanel(!showPanel)}
                title={`${items.length} items pending sync`}
            >
                📡
                <span className="queue-badge">{items.length}</span>
            </button>

            {/* Panel */}
            {showPanel && (
                <div className="offline-queue-panel">
                    <div className="queue-panel-header">
                        <span className="queue-panel-title">
                            📡 Pending Sync
                            <span style={{ opacity: 0.5, fontWeight: 400, fontSize: '0.8rem' }}>
                                ({items.length})
                            </span>
                        </span>
                        <button className="queue-panel-close" onClick={() => setShowPanel(false)}>✕</button>
                    </div>

                    <div className="queue-list">
                        {items.map(item => {
                            const age = Date.now() - item.timestamp;
                            const isStale = age > ONE_HOUR && age <= ONE_DAY;
                            const isUrgent = age > ONE_DAY;
                            const isSyncing = syncingIds.has(item.sid);
                            const isSynced = syncedIds.has(item.sid);

                            return (
                                <div
                                    key={item.key}
                                    className={`queue-item ${isStale ? 'item-stale' : ''} ${isUrgent ? 'item-urgent' : ''} ${isSyncing ? 'item-syncing' : ''} ${isSynced ? 'item-synced' : ''}`}
                                >
                                    <span className="queue-item-icon">
                                        {item.type === 'settings' ? '⚙️' : item.type === 'GENETIC_DNA' ? '🧬' : '👤'}
                                    </span>
                                    <div className="queue-item-content">
                                        <div className="queue-item-title">
                                            {item.type === 'settings' ? 'Settings' :
                                                item.type === 'GENETIC_DNA' ? 'DNA Backup' :
                                                    `Record ${item.sid.substring(0, 8)}...`}
                                        </div>
                                        <div className="queue-item-meta">
                                            {timeAgo(item.timestamp)}
                                            {isUrgent && ' • ⚠️ Over 24h old!'}
                                            {isStale && !isUrgent && ' • Aging'}
                                        </div>
                                    </div>
                                    {!isSyncing && !isSynced && (
                                        <button
                                            className="queue-item-retry"
                                            onClick={(e) => { e.stopPropagation(); handleRetry(item); }}
                                        >
                                            🔄 Retry
                                        </button>
                                    )}
                                    {isSyncing && (
                                        <span style={{ fontSize: '0.75rem', color: '#818cf8' }}>Syncing...</span>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {items.length > 20 && (
                        <div className="queue-battery-warning">
                            🔋 Large queue ({items.length} items). Consider syncing on Wi-Fi to save battery.
                        </div>
                    )}
                </div>
            )}
        </>
    );
}
