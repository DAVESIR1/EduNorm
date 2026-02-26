/**
 * SecurityManager Service
 * Phase 4: IP tracking, admin alerts, unauthorized access detection
 */

const SECURITY_STORAGE_KEY = 'edunorm_security_log';
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
const BLOCKED_IPS_KEY = 'edunorm_blocked_ips';

// Get client IP (best effort via external service)
async function getClientIP() {
    try {
        const response = await fetch('https://api.ipify.org?format=json', { signal: AbortSignal.timeout(5000) });
        const data = await response.json();
        return data.ip || 'unknown';
    } catch {
        return 'unknown';
    }
}

// Get device fingerprint
function getDeviceFingerprint() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('fingerprint', 2, 2);
    const dataUrl = canvas.toDataURL();

    const fp = [
        navigator.userAgent,
        navigator.language,
        screen.width + 'x' + screen.height,
        new Date().getTimezoneOffset(),
        dataUrl.slice(-50)
    ].join('|');

    // Simple hash
    let hash = 0;
    for (let i = 0; i < fp.length; i++) {
        const chr = fp.charCodeAt(i);
        hash = ((hash << 5) - hash) + chr;
        hash |= 0;
    }
    return Math.abs(hash).toString(36);
}

// Get security log
function getSecurityLog() {
    try {
        return JSON.parse(localStorage.getItem(SECURITY_STORAGE_KEY) || '[]');
    } catch {
        return [];
    }
}

// Save security log (keep last 100 entries)
function saveSecurityLog(log) {
    const trimmed = log.slice(-100);
    localStorage.setItem(SECURITY_STORAGE_KEY, JSON.stringify(trimmed));
}

// Get blocked IPs
function getBlockedIPs() {
    try {
        return JSON.parse(localStorage.getItem(BLOCKED_IPS_KEY) || '[]');
    } catch {
        return [];
    }
}

// Log a security event
export async function logSecurityEvent(type, details = {}) {
    const log = getSecurityLog();
    const ip = details.ip || await getClientIP();

    const event = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5),
        type, // 'login', 'login_failed', 'logout', 'data_export', 'backup', 'restore', 'password_change', 'suspicious'
        timestamp: new Date().toISOString(),
        ip,
        device: getDeviceFingerprint(),
        userAgent: navigator.userAgent.slice(0, 100),
        ...details
    };

    log.push(event);
    saveSecurityLog(log);

    // Check for suspicious activity
    await checkSuspiciousActivity(log, ip);

    return event;
}

// Check for suspicious activity patterns
async function checkSuspiciousActivity(log, currentIP) {
    const recentEvents = log.filter(e => {
        const age = Date.now() - new Date(e.timestamp).getTime();
        return age < LOCKOUT_DURATION;
    });

    // Check failed login attempts
    const failedLogins = recentEvents.filter(e => e.type === 'login_failed' && e.ip === currentIP);

    if (failedLogins.length >= MAX_LOGIN_ATTEMPTS) {
        // Block this IP
        blockIP(currentIP, 'Too many failed login attempts');
        return { blocked: true, reason: 'Too many failed attempts' };
    }

    // Check for multiple IPs in short time
    const uniqueIPs = new Set(recentEvents.filter(e => e.type === 'login').map(e => e.ip));
    if (uniqueIPs.size > 5) {
        // Alert admin
        await sendAdminAlert('Multiple IPs detected', {
            ips: Array.from(uniqueIPs),
            count: uniqueIPs.size
        });
    }

    return { blocked: false };
}

// Block an IP address
export function blockIP(ip, reason = '') {
    const blocked = getBlockedIPs();
    if (!blocked.find(b => b.ip === ip)) {
        blocked.push({
            ip,
            reason,
            blockedAt: new Date().toISOString(),
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24hrs
        });
        localStorage.setItem(BLOCKED_IPS_KEY, JSON.stringify(blocked));
    }
}

// Unblock an IP
export function unblockIP(ip) {
    const blocked = getBlockedIPs().filter(b => b.ip !== ip);
    localStorage.setItem(BLOCKED_IPS_KEY, JSON.stringify(blocked));
}

// Check if current IP is blocked
export async function isIPBlocked() {
    const blocked = getBlockedIPs();
    const now = new Date();

    // Clean expired blocks
    const activeBlocks = blocked.filter(b => new Date(b.expiresAt) > now);
    if (activeBlocks.length !== blocked.length) {
        localStorage.setItem(BLOCKED_IPS_KEY, JSON.stringify(activeBlocks));
    }

    const currentIP = await getClientIP();
    return activeBlocks.find(b => b.ip === currentIP) || null;
}

// Send admin alert (stores locally, could be extended to email/push)
export async function sendAdminAlert(title, details = {}) {
    const alerts = getAdminAlerts();
    alerts.push({
        id: Date.now().toString(36),
        title,
        details,
        timestamp: new Date().toISOString(),
        read: false
    });
    localStorage.setItem('edunorm_admin_alerts', JSON.stringify(alerts.slice(-50)));

    // Log to console for debugging
    console.warn(`🚨 SECURITY ALERT: ${title}`, details);
}

// Get admin alerts
export function getAdminAlerts() {
    try {
        return JSON.parse(localStorage.getItem('edunorm_admin_alerts') || '[]');
    } catch {
        return [];
    }
}

// Mark alert as read
export function markAlertRead(alertId) {
    const alerts = getAdminAlerts();
    const alert = alerts.find(a => a.id === alertId);
    if (alert) {
        alert.read = true;
        localStorage.setItem('edunorm_admin_alerts', JSON.stringify(alerts));
    }
}

// Get login history
export function getLoginHistory(limit = 20) {
    const log = getSecurityLog();
    return log
        .filter(e => e.type === 'login' || e.type === 'login_failed' || e.type === 'logout')
        .slice(-limit)
        .reverse();
}

// Security self-repair: detect and fix corrupted data
export async function selfRepairCheck() {
    const issues = [];

    try {
        // Check localStorage integrity
        const keys = ['edunorm_security_log', 'edunorm_blocked_ips', 'edunorm_admin_alerts'];
        for (const key of keys) {
            const raw = localStorage.getItem(key);
            if (raw) {
                try {
                    JSON.parse(raw);
                } catch {
                    localStorage.removeItem(key);
                    issues.push(`Repaired corrupted data: ${key}`);
                }
            }
        }

        // Check for stale blocks (> 7 days)
        const blocked = getBlockedIPs();
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const cleaned = blocked.filter(b => new Date(b.blockedAt) > weekAgo);
        if (cleaned.length !== blocked.length) {
            localStorage.setItem(BLOCKED_IPS_KEY, JSON.stringify(cleaned));
            issues.push(`Cleaned ${blocked.length - cleaned.length} stale IP blocks`);
        }
    } catch (err) {
        issues.push(`Self-repair error: ${err.message}`);
    }

    return { ok: issues.length === 0, issues };
}

export default {
    logSecurityEvent,
    isIPBlocked,
    blockIP,
    unblockIP,
    sendAdminAlert,
    getAdminAlerts,
    markAlertRead,
    getLoginHistory,
    selfRepairCheck,
    getClientIP,
    getDeviceFingerprint
};
