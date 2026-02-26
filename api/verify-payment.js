// Vercel Serverless Function - Verify Razorpay Payment
// Securely verify payment signature to prevent fraud

import crypto from 'crypto';

export default async function handler(req, res) {
    // Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Check if Razorpay is configured
    if (!process.env.RAZORPAY_KEY_SECRET) {
        console.error('Razorpay secret not configured');
        return res.status(500).json({ error: 'Payment verification not configured' });
    }

    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            userId,
            planId
        } = req.body;

        // Validate required fields
        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
            return res.status(400).json({ error: 'Missing payment verification data' });
        }

        // Generate expected signature
        const body = razorpay_order_id + '|' + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(body.toString())
            .digest('hex');

        // Verify signature
        const isValid = expectedSignature === razorpay_signature;

        if (!isValid) {
            console.error('Invalid signature for payment:', razorpay_payment_id);
            return res.status(400).json({
                success: false,
                error: 'Payment verification failed'
            });
        }

        // Payment is verified! 
        // In production, you would:
        // 1. Update user's subscription status in database
        // 2. Send confirmation email
        // 3. Log the transaction

        console.log('Payment verified successfully:', {
            orderId: razorpay_order_id,
            paymentId: razorpay_payment_id,
            userId,
            planId
        });

        // TODO: Save subscription to Firebase
        // await saveSubscription(userId, planId, razorpay_payment_id);

        return res.status(200).json({
            success: true,
            message: 'Payment verified successfully!',
            paymentId: razorpay_payment_id,
            orderId: razorpay_order_id
        });

    } catch (error) {
        console.error('Payment verification error:', error);
        return res.status(500).json({
            success: false,
            error: 'Payment verification failed',
            message: error.message
        });
    }
}
