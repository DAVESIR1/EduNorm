import React, { useState } from 'react';
import { X, Crown, Check, Sparkles, Zap, Loader } from 'lucide-react';
import { useUserTier, PREMIUM_FEATURES, PREMIUM_PRICING } from '../../contexts/UserTierContext';
import { useAuth } from '../../contexts/AuthContext';
import './UpgradeModal.css';

// Plan IDs matching backend api/create-order.js
const PLAN_MAP = {
    monthly: 'pro_monthly',
    yearly: 'pro_yearly'
};

export default function UpgradeModal() {
    const {
        showUpgradeModal,
        setShowUpgradeModal,
        upgradeToPremium,
        pricing,
        features
    } = useUserTier();
    const { user } = useAuth();

    const [selectedPlan, setSelectedPlan] = useState('yearly');
    const [processing, setProcessing] = useState(false);
    const [status, setStatus] = useState(''); // '', 'loading', 'success', 'error'
    const [message, setMessage] = useState('');

    if (!showUpgradeModal) return null;

    // Load Razorpay SDK dynamically
    const loadRazorpayScript = () => {
        return new Promise((resolve, reject) => {
            if (window.Razorpay) {
                resolve(true);
                return;
            }
            const script = document.createElement('script');
            script.src = 'https://checkout.razorpay.com/v1/checkout.js';
            script.onload = () => resolve(true);
            script.onerror = () => reject(new Error('Failed to load Razorpay'));
            document.body.appendChild(script);
        });
    };

    const handleUpgrade = async () => {
        if (!user) {
            setStatus('error');
            setMessage('Please login to upgrade');
            return;
        }

        setProcessing(true);
        setStatus('loading');
        setMessage('Preparing payment...');

        try {
            // Load Razorpay SDK
            await loadRazorpayScript();

            // Create order on backend
            const planId = PLAN_MAP[selectedPlan];
            const response = await fetch('/api/create-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    planId,
                    userId: user.uid,
                    email: user.email
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to create order');
            }

            // Configure Razorpay checkout
            const options = {
                key: data.key,
                amount: data.order.amount,
                currency: data.order.currency,
                name: 'EduNorm',
                description: `${data.plan.name} Subscription`,
                image: '/logo192.png',
                order_id: data.order.id,
                handler: async function (response) {
                    // Payment successful - verify on backend
                    setMessage('Verifying payment...');

                    try {
                        const verifyResponse = await fetch('/api/verify-payment', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                                userId: user.uid,
                                planId
                            })
                        });

                        const verifyData = await verifyResponse.json();

                        if (verifyData.success) {
                            setStatus('success');
                            setMessage('🎉 Upgrade successful!');
                            upgradeToPremium(selectedPlan);
                            setTimeout(() => {
                                setShowUpgradeModal(false);
                            }, 2000);
                        } else {
                            throw new Error(verifyData.error || 'Verification failed');
                        }
                    } catch (error) {
                        setStatus('error');
                        setMessage('Payment received but verification failed. Contact support.');
                    }
                    setProcessing(false);
                },
                prefill: {
                    email: user.email || '',
                    name: user.displayName || ''
                },
                theme: {
                    color: '#6366f1'
                },
                modal: {
                    ondismiss: function () {
                        setStatus('');
                        setProcessing(false);
                    }
                }
            };

            // Open Razorpay checkout
            const razorpay = new window.Razorpay(options);
            razorpay.on('payment.failed', function (response) {
                setStatus('error');
                setMessage(response.error.description || 'Payment failed');
                setProcessing(false);
            });
            razorpay.open();
            setStatus('');

        } catch (error) {
            console.error('Payment error:', error);
            setStatus('error');
            setMessage(error.message || 'Payment initialization failed');
            setProcessing(false);
        }
    };

    const handleClose = () => {
        setShowUpgradeModal(false);
        setStatus('');
        setMessage('');
    };

    return (
        <div className="upgrade-overlay" onClick={handleClose}>
            <div className="upgrade-modal" onClick={e => e.stopPropagation()}>
                {/* Close Button */}
                <button className="upgrade-close" onClick={handleClose}>
                    <X size={24} />
                </button>

                {/* Header */}
                <div className="upgrade-header">
                    <div className="crown-icon">
                        <Crown size={40} />
                    </div>
                    <h2>Upgrade to Premium</h2>
                    <p>Unlock all features and remove ads</p>
                </div>

                {/* Status Messages */}
                {status === 'success' && (
                    <div className="upgrade-status success">
                        <Check size={32} />
                        <p>{message}</p>
                    </div>
                )}

                {status === 'error' && (
                    <div className="upgrade-status error">
                        <p>{message}</p>
                        <button className="btn btn-ghost" onClick={() => setStatus('')}>
                            Try Again
                        </button>
                    </div>
                )}

                {status !== 'success' && status !== 'error' && (
                    <>
                        {/* Pricing Plans */}
                        <div className="pricing-plans">
                            <div
                                className={`plan-card ${selectedPlan === 'monthly' ? 'selected' : ''}`}
                                onClick={() => setSelectedPlan('monthly')}
                            >
                                <div className="plan-name">Monthly</div>
                                <div className="plan-price">
                                    <span className="currency">{pricing.monthly.currency}</span>
                                    <span className="amount">{pricing.monthly.amount}</span>
                                    <span className="period">/{pricing.monthly.period}</span>
                                </div>
                            </div>

                            <div
                                className={`plan-card ${selectedPlan === 'yearly' ? 'selected' : ''}`}
                                onClick={() => setSelectedPlan('yearly')}
                            >
                                {pricing.yearly.savings && (
                                    <div className="plan-badge">Save {pricing.yearly.savings}</div>
                                )}
                                <div className="plan-name">Yearly</div>
                                <div className="plan-price">
                                    <span className="currency">{pricing.yearly.currency}</span>
                                    <span className="amount">{pricing.yearly.amount}</span>
                                    <span className="period">/{pricing.yearly.period}</span>
                                </div>
                            </div>
                        </div>

                        {/* Features List */}
                        <div className="premium-features">
                            <h3>Premium Features</h3>
                            <ul className="features-list">
                                {features.map((feature, index) => (
                                    <li key={index} className="feature-item">
                                        <span className="feature-icon">{feature.icon}</span>
                                        <div className="feature-info">
                                            <span className="feature-title">{feature.title}</span>
                                            <span className="feature-desc">{feature.description}</span>
                                        </div>
                                        <Check size={18} className="feature-check" />
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* CTA Button */}
                        <button
                            className="upgrade-btn"
                            onClick={handleUpgrade}
                            disabled={processing}
                        >
                            {processing ? (
                                <>
                                    <Loader className="spin" size={20} />
                                    {status === 'loading' ? message : 'Processing...'}
                                </>
                            ) : (
                                <>
                                    <Sparkles size={20} />
                                    Upgrade Now - {pricing[selectedPlan].currency}{pricing[selectedPlan].amount}
                                </>
                            )}
                        </button>

                        {/* Terms */}
                        <p className="upgrade-terms">
                            Secure payment via Razorpay • UPI, Cards, Wallets • Cancel anytime
                        </p>
                    </>
                )}
            </div>
        </div>
    );
}

