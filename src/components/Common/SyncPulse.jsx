import React, { useState, useEffect, useRef, useCallback } from 'react';
import SyncEventBus from '../../services/SyncEventBus';
import './SyncPulse.css';

/**
 * SyncPulse — Living DNA Helix
 * Breathes with real sync events. Click to see recent activity.
 */

function timeAgo(ts) {
    const diff = Date.now() - ts;
    if (diff < 5000) return 'just now';
    if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    return `${Math.floor(diff / 3600000)}h ago`;
}

const EVENT_LABELS = {
    'sync:start': '🔄 Sync started',
    'sync:success': '✅ Sync complete',
    'sync:fail': '❌ Sync failed',
    'sync:layers': '📡 Layer update',
    'queue:add': '📥 Queued for sync',
    'queue:remove': '📤 Dequeued',
    'network:online': '🌐 Back online',
    'network:offline': '📡 Gone offline',
};

export default function SyncPulse() {
    const [status, setStatus] = useState('healthy'); // healthy | syncing | error
    const [showDropdown, setShowDropdown] = useState(false);
    const [recentEvents, setRecentEvents] = useState([]);
    const [ripples, setRipples] = useState([]);
    const rippleIdRef = useRef(0);
    const dropdownRef = useRef(null);

    // Subscribe to sync events
    useEffect(() => {
        const { EVENTS } = SyncEventBus;

        const unsubs = [
            SyncEventBus.on(EVENTS.SYNC_START, () => {
                setStatus('syncing');
            }),
            SyncEventBus.on(EVENTS.SYNC_SUCCESS, (data) => {
                setStatus('healthy');
                addRipple();
            }),
            SyncEventBus.on(EVENTS.SYNC_FAIL, () => {
                setStatus('error');
                // Auto-recover after 8 seconds
                setTimeout(() => setStatus(prev => prev === 'error' ? 'healthy' : prev), 8000);
            }),
            SyncEventBus.on(EVENTS.SYNC_LAYERS, (data) => {
                if (data.active >= 2) {
                    setStatus('healthy');
                    addRipple();
                } else if (data.active > 0) {
                    setStatus('syncing');
                } else {
                    setStatus('error');
                }
            }),
            SyncEventBus.on(EVENTS.OFFLINE, () => {
                setStatus('syncing');
            }),
            SyncEventBus.on(EVENTS.ONLINE, () => {
                setStatus('healthy');
                addRipple();
            }),
        ];

        return () => unsubs.forEach(u => u());
    }, []);

    // Refresh event list when dropdown opens
    useEffect(() => {
        if (showDropdown) {
            setRecentEvents(SyncEventBus.getRecentEvents(5));
        }
    }, [showDropdown]);

    // Close dropdown on outside click
    useEffect(() => {
        if (!showDropdown) return;
        const handleClick = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [showDropdown]);

    const addRipple = useCallback(() => {
        const id = ++rippleIdRef.current;
        setRipples(prev => [...prev, id]);
        setTimeout(() => {
            setRipples(prev => prev.filter(r => r !== id));
        }, 1000);
    }, []);

    const statusLabel = {
        healthy: 'All Systems Sovereign',
        syncing: 'Syncing...',
        error: 'Sync Disrupted',
    };

    const centerIcon = {
        healthy: '🧬',
        syncing: '⚡',
        error: '🔴',
    };

    const getEventDotClass = (event) => {
        if (event.includes('success') || event.includes('online') || event.includes('remove')) return 'dot-success';
        if (event.includes('fail') || event.includes('offline')) return 'dot-fail';
        return 'dot-info';
    };

    return (
        <div className="sync-pulse-container" ref={dropdownRef}>
            <div
                className={`sync-pulse-helix pulse-${status}`}
                onClick={() => setShowDropdown(!showDropdown)}
                title="Click to see sync activity"
            >
                <div className="helix-ring">
                    <div className="helix-center">{centerIcon[status]}</div>
                </div>
                {ripples.map(id => (
                    <div key={id} className="helix-ripple" />
                ))}
            </div>

            <div className={`sync-pulse-label label-${status}`}>
                {statusLabel[status]}
            </div>

            {showDropdown && (
                <div className="sync-events-dropdown">
                    {recentEvents.length === 0 ? (
                        <div className="sync-events-empty">No sync events yet</div>
                    ) : (
                        recentEvents.map(ev => (
                            <div key={ev.id} className="sync-event-item">
                                <div className={`sync-event-dot ${getEventDotClass(ev.event)}`} />
                                <span className="sync-event-text">
                                    {EVENT_LABELS[ev.event] || ev.event}
                                    {ev.data?.layers ? ` (${ev.data.layers}/3)` : ''}
                                </span>
                                <span className="sync-event-time">{timeAgo(ev.timestamp)}</span>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
}
