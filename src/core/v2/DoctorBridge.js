/**
 * DoctorBridge - Browser-side error capture for the EduNorm Doctor tool.
 * 
 * ONLY activates if the Doctor server has been explicitly enabled.
 * Set localStorage.setItem('doctor_enabled', 'true') to enable.
 * This prevents ERR_CONNECTION_REFUSED noise when the server isn't running.
 */

const DOCTOR_SERVER = 'http://localhost:3001/log';

export const initDoctorBridge = () => {
    // Prevent multiple initializations
    if (window.__DOCTOR_BRIDGE_INITIALIZED__) return;
    window.__DOCTOR_BRIDGE_INITIALIZED__ = true;

    // Only activate if explicitly enabled — no guessing, no probing
    const enabled = localStorage.getItem('doctor_enabled') === 'true';
    if (!enabled) return;

    console.log('[DoctorBridge] Doctor mode enabled, capturing errors...');

    const relayLog = async (type, data) => {
        try {
            await fetch(DOCTOR_SERVER, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type,
                    timestamp: new Date().toISOString(),
                    user_agent: navigator.userAgent,
                    url: window.location.href,
                    ...data
                }),
                mode: 'cors'
            });
        } catch {
            // Server went away — disable
            localStorage.removeItem('doctor_enabled');
        }
    };

    window.addEventListener('error', (event) => {
        relayLog('browser-error', {
            message: event.message,
            source: event.filename,
            line: event.lineno,
            col: event.colno,
            stack: event.error?.stack
        });
    });

    window.addEventListener('unhandledrejection', (event) => {
        relayLog('browser-promise', {
            message: event.reason?.message || String(event.reason),
            stack: event.reason?.stack
        });
    });

    const originalConsoleError = console.error;
    console.error = (...args) => {
        originalConsoleError.apply(console, args);
        relayLog('browser-console', {
            message: args.map(arg => {
                if (arg instanceof Error) return arg.stack || arg.message;
                if (typeof arg === 'object') return JSON.stringify(arg);
                return String(arg);
            }).join(' ')
        });
    };

    relayLog('browser-init', { message: 'Bridge connected' });
};
