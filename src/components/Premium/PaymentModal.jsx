import React, { useState } from 'react';
import { X, Crown, CheckCircle, Loader, Sparkles, Shield, Cloud, Zap } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import './PaymentModal.css';

// Pricing plans
const PLANS = [
    {
        id: 'pro_monthly',
        name: 'Pro',
        price: 99,
        period: 'month',
        popular: true,
        features: [
            'Unlimited students',
            'Cloud backup & sync',
            'No advertisements',
            'ID card customization',
            'Priority support'
        ]
    },
    {
        id: 'pro_yearly',
        name: 'Pro Yearly',
        price: 999,
        period: 'year',
        savings: '₹189',
        features: [
            'Everything in Pro',
            '2 months FREE',
            'Email support',
            'Early access to features'
        ]
    },
    {
        id: 'school_monthly',
        name: 'School',
        price: 499,
        period: 'month',
        features: [
            'Everything in Pro',
            'Multi-user access',
            'Advanced analytics',
            'Phone support',
            'Custom branding'
        ]
    }
];

export default function PaymentModal({ isOpen, onClose, onUpgradeSuccess }) {
    const { user } = useAuth();
    const [selectedPlan, setSelectedPlan] = useState('pro_monthly');
    const [status, setStatus] = useState('idle'); // idle, loading, success, error
    const [message, setMessage] = useState('');

    if (!isOpen) return null;

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

    const handlePayment = async () => {
        if (!user) {
            setStatus('error');
            setMessage('Please login to upgrade');
            return;
        }

        setStatus('loading');
        setMessage('Preparing payment...');

        try {
            // Load Razorpay SDK
            await loadRazorpayScript();

            // Create order on backend
            const response = await fetch('/api/create-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    planId: selectedPlan,
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
                                planId: selectedPlan
                            })
                        });

                        const verifyData = await verifyResponse.json();

                        if (verifyData.success) {
                            setStatus('success');
                            setMessage('🎉 Upgrade successful! Enjoy your premium features.');
                            if (onUpgradeSuccess) {
                                setTimeout(() => {
                                    onUpgradeSuccess();
                                    onClose();
                                }, 2000);
                            }
                        } else {
                            throw new Error(verifyData.error || 'Verification failed');
                        }
                    } catch (error) {
                        setStatus('error');
                        setMessage('Payment received but verification failed. Contact support.');
                    }
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
                        setStatus('idle');
                    }
                }
            };

            // Open Razorpay checkout
            const razorpay = new window.Razorpay(options);
            razorpay.on('payment.failed', function (response) {
                setStatus('error');
                setMessage(response.error.description || 'Payment failed');
            });
            razorpay.open();
            setStatus('idle');

        } catch (error) {
            console.error('Payment error:', error);
            setStatus('error');
            setMessage(error.message || 'Payment initialization failed');
        }
    };

    return (
        <div className="payment-overlay" onClick={onClose}>
            <div className="payment-modal" onClick={e => e.stopPropagation()}>
                <button className="payment-close" onClick={onClose}>
                    <X size={20} />
                </button>

                <div className="payment-header">
                    <Crown size={40} className="crown-icon" />
                    <h2>Upgrade to Premium</h2>
                    <p>Unlock all features and remove ads</p>
                </div>

                {/* Status Messages */}
                {status === 'loading' && (
                    <div className="payment-status loading">
                        <Loader size={32} className="spinner" />
                        <p>{message}</p>
                    </div>
                )}

                {status === 'success' && (
                    <div className="payment-status success">
                        <CheckCircle size={48} />
                        <p>{message}</p>
                    </div>
                )}

                {status === 'error' && (
                    <div className="payment-status error">
                        <p>{message}</p>
                        <button className="btn btn-ghost" onClick={() => setStatus('idle')}>
                            Try Again
                        </button>
                    </div>
                )}

                {status === 'idle' && (
                    <>
                        {/* Pricing Plans */}
                        <div className="pricing-plans">
                            {PLANS.map(plan => (
                                <div
                                    key={plan.id}
                                    className={`plan-card ${selectedPlan === plan.id ? 'selected' : ''} ${plan.popular ? 'popular' : ''}`}
                                    onClick={() => setSelectedPlan(plan.id)}
                                >
                                    {plan.popular && <span className="popular-badge">Most Popular</span>}
                                    {plan.savings && <span className="savings-badge">Save {plan.savings}</span>}

                                    <h3>{plan.name}</h3>
                                    <div className="plan-price">
                                        <span className="currency">₹</span>
                                        <span className="amount">{plan.price}</span>
                                        <span className="period">/{plan.period}</span>
                                    </div>

                                    <ul className="plan-features">
                                        {plan.features.map((feature, i) => (
                                            <li key={i}>
                                                <CheckCircle size={14} />
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>

                        {/* Benefits */}
                        <div className="premium-benefits">
                            <div className="benefit">
                                <Cloud size={20} />
                                <span>Secure cloud backup</span>
                            </div>
                            <div className="benefit">
                                <Shield size={20} />
                                <span>No ads, ever</span>
                            </div>
                            <div className="benefit">
                                <Zap size={20} />
                                <span>Faster performance</span>
                            </div>
                        </div>

                        {/* Payment Button */}
                        <button className="pay-btn" onClick={handlePayment}>
                            <Sparkles size={20} />
                            Pay ₹{PLANS.find(p => p.id === selectedPlan)?.price} - Upgrade Now
                        </button>

                        <p className="payment-note">
                            Secure payment via Razorpay. UPI, Cards, Wallets accepted.
                        </p>
                    </>
                )}
            </div>
        </div>
    );
}
