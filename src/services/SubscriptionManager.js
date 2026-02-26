/**
 * SubscriptionManager Service
 * Phase 5: Trial management, Pro codes, device binding, payment tracking
 */

const SUB_STORAGE_KEY = 'edunorm_subscription';
const TRIAL_DAYS = 30;
const MAX_DEVICES = 5;
const FREE_STUDENT_LIMIT = 50;

// Initialize or get subscription data
export function getSubscription() {
    try {
        const data = JSON.parse(localStorage.getItem(SUB_STORAGE_KEY) || 'null');
        if (!data) {
            // First time — initialize free trial
            return initializeTrial();
        }
        return data;
    } catch {
        return initializeTrial();
    }
}

// Initialize free trial
function initializeTrial() {
    const deviceId = generateDeviceId();
    const sub = {
        plan: 'trial',
        status: 'active',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000).toISOString(),
        studentLimit: FREE_STUDENT_LIMIT,
        devices: [{ id: deviceId, addedAt: new Date().toISOString(), name: getDeviceName() }],
        maxDevices: 1, // Trial = 1 device
        features: {
            cloudBackup: false,
            export: true,
            idCard: true,
            certificate: true,
            security: false,
            analytics: false,
            whatsapp: false,
            bulkActions: false
        },
        payments: [],
        proCode: null,
        email: null
    };
    saveSubscription(sub);
    return sub;
}

// Save subscription
function saveSubscription(sub) {
    localStorage.setItem(SUB_STORAGE_KEY, JSON.stringify(sub));
}

// Generate a unique device ID
function generateDeviceId() {
    const parts = [
        navigator.userAgent.slice(0, 30),
        screen.width + 'x' + screen.height,
        navigator.language,
        new Date().getTimezoneOffset()
    ];
    let hash = 0;
    const str = parts.join('|');
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0;
    }
    return 'dev_' + Math.abs(hash).toString(36);
}

// Get device name
function getDeviceName() {
    const ua = navigator.userAgent;
    if (/mobile/i.test(ua)) return 'Mobile Device';
    if (/tablet/i.test(ua)) return 'Tablet';
    if (/windows/i.test(ua)) return 'Windows PC';
    if (/mac/i.test(ua)) return 'Mac';
    if (/linux/i.test(ua)) return 'Linux PC';
    return 'Unknown Device';
}

// Check if trial is active
export function isTrialActive() {
    const sub = getSubscription();
    if (sub.plan !== 'trial') return false;
    return new Date(sub.endDate) > new Date();
}

// Get days remaining in trial
export function getTrialDaysRemaining() {
    const sub = getSubscription();
    if (sub.plan !== 'trial') return 0;
    const remaining = Math.ceil((new Date(sub.endDate) - new Date()) / (24 * 60 * 60 * 1000));
    return Math.max(0, remaining);
}

// Check if plan is pro/premium
export function isPro() {
    const sub = getSubscription();
    return sub.plan === 'pro' || sub.plan === 'premium';
}

// Get current plan info
export function getPlanInfo() {
    const sub = getSubscription();
    return {
        plan: sub.plan,
        status: sub.status,
        studentLimit: sub.plan === 'pro' ? Infinity : sub.studentLimit,
        daysRemaining: sub.plan === 'trial' ? getTrialDaysRemaining() : null,
        features: sub.features,
        deviceCount: sub.devices?.length || 1,
        maxDevices: sub.plan === 'pro' ? MAX_DEVICES : 1,
        endDate: sub.endDate
    };
}

// Check feature access
export function hasFeature(featureId) {
    const sub = getSubscription();

    // Pro users get everything
    if (sub.plan === 'pro' || sub.plan === 'premium') return true;

    // Trial users — check feature map
    return sub.features?.[featureId] ?? false;
}

// Check student limit
export function canAddStudent(currentCount) {
    const sub = getSubscription();
    if (sub.plan === 'pro' || sub.plan === 'premium') return true;
    return currentCount < (sub.studentLimit || FREE_STUDENT_LIMIT);
}

// Activate Pro with code (using Firestore verification)
export async function activateProCode(code, email) {
    if (!code || !email) {
        return { success: false, error: 'Code and email are required' };
    }

    // Import ProCodeService dynamically to avoid circular dependency
    const { verifyAndActivateCode } = await import('./ProCodeService');

    // Verify code with Firestore
    const verificationResult = await verifyAndActivateCode(code, email);

    if (!verificationResult.success) {
        return verificationResult;
    }

    // Code verified - activate subscription
    const sub = getSubscription();
    const deviceId = generateDeviceId();

    sub.plan = 'pro';
    sub.status = 'active';
    sub.startDate = new Date().toISOString();
    sub.endDate = verificationResult.endDate;
    sub.studentLimit = Infinity;
    sub.maxDevices = MAX_DEVICES;
    sub.proCode = code;
    sub.email = email;
    sub.features = {
        cloudBackup: true,
        export: true,
        idCard: true,
        certificate: true,
        security: true,
        analytics: true,
        whatsapp: true,
        bulkActions: true
    };

    // Register device if not already
    if (!sub.devices.find(d => d.id === deviceId)) {
        if (sub.devices.length >= MAX_DEVICES) {
            return { success: false, error: `Maximum ${MAX_DEVICES} devices already activated` };
        }
        sub.devices.push({ id: deviceId, addedAt: new Date().toISOString(), name: getDeviceName() });
    }

    sub.payments.push({
        type: 'pro_code',
        code,
        date: new Date().toISOString(),
        duration: verificationResult.duration,
        daysValid: verificationResult.daysValid
    });

    saveSubscription(sub);
    return {
        success: true,
        plan: 'pro',
        endDate: sub.endDate,
        duration: verificationResult.duration,
        daysValid: verificationResult.daysValid
    };
}

// Record UPI payment
export function recordPayment(transactionId, amount, plan = 'monthly') {
    const sub = getSubscription();
    const duration = plan === 'yearly' ? 365 : 30;

    sub.plan = 'pro';
    sub.status = 'active';
    sub.startDate = new Date().toISOString();
    sub.endDate = new Date(Date.now() + duration * 24 * 60 * 60 * 1000).toISOString();
    sub.studentLimit = Infinity;
    sub.maxDevices = MAX_DEVICES;
    sub.features = {
        cloudBackup: true,
        export: true,
        idCard: true,
        certificate: true,
        security: true,
        analytics: true,
        whatsapp: true,
        bulkActions: true
    };

    sub.payments.push({
        type: 'upi',
        transactionId,
        amount,
        plan,
        date: new Date().toISOString(),
        duration
    });

    saveSubscription(sub);
    return { success: true, plan: 'pro', endDate: sub.endDate };
}

// Change email (for subscription binding)
export function changeEmail(newEmail) {
    const sub = getSubscription();
    sub.email = newEmail;
    saveSubscription(sub);
    return { success: true };
}

// Get payment history
export function getPaymentHistory() {
    const sub = getSubscription();
    return sub.payments || [];
}

// Check subscription expiry and send reminder
export function checkExpiryReminder() {
    const sub = getSubscription();
    const daysLeft = Math.ceil((new Date(sub.endDate) - new Date()) / (24 * 60 * 60 * 1000));

    if (daysLeft <= 0) {
        return { expired: true, message: 'Your subscription has expired. Please renew to continue using Pro features.' };
    }
    if (daysLeft <= 7) {
        return { expiringSoon: true, daysLeft, message: `Your subscription expires in ${daysLeft} day${daysLeft > 1 ? 's' : ''}. Renew now!` };
    }
    if (daysLeft <= 3) {
        return { critical: true, daysLeft, message: `⚠️ Only ${daysLeft} day${daysLeft > 1 ? 's' : ''} left! Renew immediately.` };
    }

    return { ok: true, daysLeft };
}

// Remove a device
export function removeDevice(deviceId) {
    const sub = getSubscription();
    sub.devices = sub.devices.filter(d => d.id !== deviceId);
    saveSubscription(sub);
    return { success: true, remaining: sub.devices.length };
}

// Reset to free plan
export function resetToFree() {
    const sub = getSubscription();
    sub.plan = 'trial';
    sub.status = 'expired';
    sub.studentLimit = FREE_STUDENT_LIMIT;
    sub.maxDevices = 1;
    sub.features = {
        cloudBackup: false,
        export: true,
        idCard: true,
        certificate: true,
        security: false,
        analytics: false,
        whatsapp: false,
        bulkActions: false
    };
    saveSubscription(sub);
}

export default {
    getSubscription,
    isTrialActive,
    getTrialDaysRemaining,
    isPro,
    getPlanInfo,
    hasFeature,
    canAddStudent,
    activateProCode,
    recordPayment,
    changeEmail,
    getPaymentHistory,
    checkExpiryReminder,
    removeDevice,
    resetToFree
};
