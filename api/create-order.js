// Vercel Serverless Function - Create Razorpay Order
// This runs on the backend (server-side) for secure payment processing

import Razorpay from 'razorpay';

// Initialize Razorpay with secret keys (server-side only)
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

// Pricing tiers (in paise - 1 rupee = 100 paise)
const PLANS = {
    pro_monthly: {
        name: 'Pro Monthly',
        amount: 9900, // ₹99
        currency: 'INR',
        features: ['Unlimited students', 'Cloud backup', 'No ads']
    },
    pro_yearly: {
        name: 'Pro Yearly',
        amount: 99900, // ₹999 (save ₹189)
        currency: 'INR',
        features: ['Unlimited students', 'Cloud backup', 'No ads', '2 months free']
    },
    school_monthly: {
        name: 'School Monthly',
        amount: 49900, // ₹499
        currency: 'INR',
        features: ['Multi-user', 'Analytics', 'Priority support', 'All Pro features']
    }
};

export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Check if Razorpay is configured
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
        console.error('Razorpay keys not configured');
        return res.status(500).json({
            error: 'Payment service not configured',
            message: 'Please configure RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in environment variables'
        });
    }

    try {
        const { planId, userId, email } = req.body;

        // Validate plan
        const plan = PLANS[planId];
        if (!plan) {
            return res.status(400).json({ error: 'Invalid plan selected' });
        }

        // Create Razorpay order
        const order = await razorpay.orders.create({
            amount: plan.amount,
            currency: plan.currency,
            receipt: `edunorm_${userId}_${Date.now()}`,
            notes: {
                planId,
                userId,
                email,
                planName: plan.name
            }
        });

        // Return order details to frontend
        return res.status(200).json({
            success: true,
            order: {
                id: order.id,
                amount: order.amount,
                currency: order.currency
            },
            plan: {
                name: plan.name,
                features: plan.features
            },
            key: process.env.RAZORPAY_KEY_ID // Public key for frontend
        });

    } catch (error) {
        console.error('Error creating order:', error);
        return res.status(500).json({
            error: 'Failed to create payment order',
            message: error.message
        });
    }
}
