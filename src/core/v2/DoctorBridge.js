/**
 * DoctorBridge - Browser-side error capture for the EduNorm Doctor tool.
 * 
 * Intercepts console errors, unhandled exceptions, and promise rejections
 * and sends them to the local Doctor server.
 */

const DOCTOR_SERVER = 'http://localhost:3001/log';

export const initDoctorBridge = () => {
    // Prevent multiple initializations
    if (window.__DOCTOR_BRIDGE_INITIALIZED__) return;
    window.__DOCTOR_BRIDGE_INITIALIZED__ = true;

    console.log('[DoctorBridge] Initializing live error capture...');

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
        } catch (e) {
            // Silently fail if doctor server is not running
        }
    };

    // 1. Capture Uncaught Exceptions
    window.addEventListener('error', (event) => {
        relayLog('browser-error', {
            message: event.message,
            source: event.filename,
            line: event.lineno,
            col: event.colno,
            stack: event.error?.stack
        });
    });

    // 2. Capture Unhandled Promise Rejections
    window.addEventListener('unhandledrejection', (event) => {
        relayLog('browser-promise', {
            message: event.reason?.message || String(event.reason),
            stack: event.reason?.stack
        });
    });

    // 3. Intercept console.error
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

    // Initial heart-beat
    relayLog('browser-init', { message: 'Bridge connected' });
};
