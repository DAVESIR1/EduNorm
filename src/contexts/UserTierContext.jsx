import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { getPlanInfo, activateProCode, checkExpiryReminder, getTrialDaysRemaining, hasFeature } from '../services/SubscriptionManager';

// Admin credentials (hardcoded for security)
const ADMIN_EMAIL = 'baraiyanitin220@gmail.com';
const ADMIN_PHONE = '+919737970647';

// User tier types
export const USER_TIERS = {
    FREE: 'FREE',
    PREMIUM: 'PREMIUM',
    ADMIN: 'ADMIN'
};

// Premium pricing
export const PREMIUM_PRICING = {
    monthly: { amount: 60, currency: '₹', period: 'month' },
    yearly: { amount: 600, currency: '₹', period: 'year', savings: '2 Months FREE!' }
};

// Premium features list
export const PREMIUM_FEATURES = [
    { icon: '🚫', title: 'No Advertisements', description: 'Enjoy an ad-free experience' },
    { icon: '⚡', title: 'Priority Support', description: '24/7 customer support' },
    { icon: '☁️', title: 'Cloud Backup', description: 'Auto backup to cloud storage' },
    { icon: '📊', title: 'Advanced Reports', description: 'Detailed analytics & exports' },
    { icon: '🎨', title: 'Premium Templates', description: 'Exclusive ID card designs' },
    { icon: '👥', title: 'Multi-User Access', description: 'Add team members' }
];

const UserTierContext = createContext(null);

export function UserTierProvider({ children }) {
    const { user, isAuthenticated } = useAuth();
    const [tier, setTier] = useState(USER_TIERS.FREE);
    const [isPremium, setIsPremium] = useState(false);
    const [premiumExpiry, setPremiumExpiry] = useState(null);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);

    // Determine user tier based on credentials
    useEffect(() => {
        if (!isAuthenticated || !user) {
            setTier(USER_TIERS.FREE);
            return;
        }

        // Check if user is admin (hardcoded credentials only — HOI is NOT admin)
        const isAdmin =
            user.email === ADMIN_EMAIL ||
            user.phoneNumber === ADMIN_PHONE;

        if (isAdmin) {
            setTier(USER_TIERS.ADMIN);
            setIsPremium(true);
            return;
        }

        // Check premium status from localStorage (in production, use backend)
        const premiumData = localStorage.getItem(`premium_${user.uid}`);
        if (premiumData) {
            try {
                const { expiry } = JSON.parse(premiumData);
                if (new Date(expiry) > new Date()) {
                    setTier(USER_TIERS.PREMIUM);
                    setIsPremium(true);
                    setPremiumExpiry(expiry);
                    return;
                }
            } catch (e) {
                console.error('Error parsing premium data:', e);
            }
        }

        setTier(USER_TIERS.FREE);
        setIsPremium(false);
    }, [user, isAuthenticated]);

    // Upgrade to premium (mock - in production, integrate payment gateway)
    const upgradeToPremium = (plan = 'monthly') => {
        if (!user) return false;

        const months = plan === 'yearly' ? 12 : 1;
        const expiry = new Date();
        expiry.setMonth(expiry.getMonth() + months);

        const premiumData = {
            expiry: expiry.toISOString(),
            plan,
            activatedAt: new Date().toISOString()
        };

        localStorage.setItem(`premium_${user.uid}`, JSON.stringify(premiumData));
        setTier(USER_TIERS.PREMIUM);
        setIsPremium(true);
        setPremiumExpiry(expiry.toISOString());
        setShowUpgradeModal(false);

        return true;
    };

    // Cancel premium
    const cancelPremium = () => {
        if (!user) return;
        localStorage.removeItem(`premium_${user.uid}`);
        setTier(USER_TIERS.FREE);
        setIsPremium(false);
        setPremiumExpiry(null);
    };

    // Grant premium to user (admin function)
    const grantPremium = (userId, months = 1) => {
        const expiry = new Date();
        expiry.setMonth(expiry.getMonth() + months);
        localStorage.setItem(`premium_${userId}`, JSON.stringify({
            expiry: expiry.toISOString(),
            plan: 'granted',
            activatedAt: new Date().toISOString()
        }));
    };

    // Subscription Manager integration
    const [trialDaysRemaining, setTrialDaysRemaining] = useState(null);
    const [expiryWarning, setExpiryWarning] = useState(null);

    // Check subscription status on mount
    useEffect(() => {
        const planInfo = getPlanInfo();
        if (planInfo.daysRemaining !== null) {
            setTrialDaysRemaining(planInfo.daysRemaining);
        }
        const reminder = checkExpiryReminder();
        if (reminder.expiringSoon || reminder.critical || reminder.expired) {
            setExpiryWarning(reminder);
        }
    }, [tier]);

    // Activate pro code
    const activateCode = useCallback((code, email) => {
        const result = activateProCode(code, email);
        if (result.success) {
            setTier(USER_TIERS.PREMIUM);
            setIsPremium(true);
            setPremiumExpiry(result.endDate);
        }
        return result;
    }, []);

    // Check feature access
    const checkFeature = useCallback((featureId) => {
        if (tier === USER_TIERS.ADMIN) return true;
        if (isPremium) return true;
        return hasFeature(featureId);
    }, [tier, isPremium]);

    const value = {
        tier,
        isPremium,
        isAdmin: tier === USER_TIERS.ADMIN,
        isFree: tier === USER_TIERS.FREE,
        premiumExpiry,
        showUpgradeModal,
        setShowUpgradeModal,
        upgradeToPremium,
        cancelPremium,
        grantPremium,
        activateCode,
        checkFeature,
        trialDaysRemaining,
        expiryWarning,
        features: PREMIUM_FEATURES,
        pricing: PREMIUM_PRICING
    };

    return (
        <UserTierContext.Provider value={value}>
            {children}
        </UserTierContext.Provider>
    );
}

export function useUserTier() {
    const context = useContext(UserTierContext);
    if (!context) {
        throw new Error('useUserTier must be used within a UserTierProvider');
    }
    return context;
}

export default UserTierContext;
