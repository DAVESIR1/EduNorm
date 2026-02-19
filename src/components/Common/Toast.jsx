import React, { useState, useEffect, useCallback, useRef } from 'react';
import './Toast.css';

/**
 * Toast Notification System
 * Global, zero-config, sync-aware toasts.
 * Usage: import { toast } from './Toast';  toast.success('Saved!');
 */

// ─── Internal State ───
let toastSubscriber = null;
let toastIdCounter = 0;

// ─── Global Toast API ───
export const toast = {
    _emit(type, title, message, options = {}) {
        const id = ++toastIdCounter;
        const item = {
            id,
            type,
            title,
            message: typeof message === 'string' ? message : undefined,
            duration: options.duration ?? (type === 'offline' ? 0 : 4000),
            syncLayers: options.syncLayers ?? null,
            ...options,
        };
        if (typeof message !== 'string' && message !== undefined) {
            item.title = title;
            item.message = undefined;
            item.duration = message?.duration ?? item.duration;
        }
        toastSubscriber?.(item);
        return id;
    },

    success(title, message, options) {
        return this._emit('success', title, message, options);
    },
    error(title, message, options) {
        return this._emit('error', title, message, { duration: 6000, ...options });
    },
    warning(title, message, options) {
        return this._emit('warning', title, message, options);
    },
    info(title, message, options) {
        return this._emit('info', title, message, options);
    },
    sync(layers, total = 3) {
        return this._emit('sync', `Secured to ${layers}/${total} layers`, undefined, {
            syncLayers: { current: layers, total },
            duration: 3000,
        });
    },
    offline(message = 'You are offline. Changes will sync when connection returns.') {
        return this._emit('offline', '📡 Offline Mode', message, { duration: 0, persistent: true });
    },
    dismiss(id) {
        toastSubscriber?.({ __dismiss: id });
    },
};

// Sync ring mini-component
function SyncRing({ current, total }) {
    const radius = 11;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (current / total) * circumference;
    return (
        <div className="toast-sync-ring">
            <svg viewBox="0 0 28 28">
                <circle className="ring-bg" cx="14" cy="14" r={radius} />
                <circle
                    className="ring-progress"
                    cx="14" cy="14" r={radius}
                    style={{ strokeDashoffset: offset }}
                />
            </svg>
            <div className="ring-text">{current}/{total}</div>
        </div>
    );
}

// Icons per type
const TOAST_ICONS = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️',
    sync: '🔄',
    offline: '📡',
};

// ─── Toast Container Component ───
export default function ToastContainer() {
    const [toasts, setToasts] = useState([]);
    const timersRef = useRef({});

    // Subscribe to global emitter
    useEffect(() => {
        toastSubscriber = (item) => {
            if (item?.__dismiss) {
                // Dismiss specific toast
                setToasts(prev => prev.map(t =>
                    t.id === item.__dismiss ? { ...t, exiting: true } : t
                ));
                setTimeout(() => {
                    setToasts(prev => prev.filter(t => t.id !== item.__dismiss));
                }, 350);
                return;
            }
            setToasts(prev => [item, ...prev].slice(0, 5)); // max 5 visible
        };
        return () => { toastSubscriber = null; };
    }, []);

    // Auto-dismiss timers
    useEffect(() => {
        toasts.forEach(t => {
            if (t.duration > 0 && !t.exiting && !timersRef.current[t.id]) {
                timersRef.current[t.id] = setTimeout(() => {
                    setToasts(prev => prev.map(item =>
                        item.id === t.id ? { ...item, exiting: true } : item
                    ));
                    setTimeout(() => {
                        setToasts(prev => prev.filter(item => item.id !== t.id));
                        delete timersRef.current[t.id];
                    }, 350);
                }, t.duration);
            }
        });
    }, [toasts]);

    const handleDismiss = useCallback((id) => {
        if (timersRef.current[id]) {
            clearTimeout(timersRef.current[id]);
            delete timersRef.current[id];
        }
        setToasts(prev => prev.map(t =>
            t.id === id ? { ...t, exiting: true } : t
        ));
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 350);
    }, []);

    if (toasts.length === 0) return null;

    return (
        <div className="toast-container" role="alert" aria-live="polite">
            {toasts.map(t => (
                <div
                    key={t.id}
                    className={`toast-item toast-${t.type} ${t.exiting ? 'toast-exit' : ''}`}
                    onClick={() => handleDismiss(t.id)}
                >
                    <span className="toast-icon">{TOAST_ICONS[t.type]}</span>
                    <div className="toast-content">
                        <div className="toast-title">{t.title}</div>
                        {t.message && <div className="toast-message">{t.message}</div>}
                    </div>
                    {t.syncLayers && (
                        <SyncRing current={t.syncLayers.current} total={t.syncLayers.total} />
                    )}
                    <button className="toast-close" onClick={(e) => { e.stopPropagation(); handleDismiss(t.id); }}>
                        ✕
                    </button>
                </div>
            ))}
        </div>
    );
}
