// Vercel Serverless Function - Send OTP via Email
// Uses GoDaddy Professional Email SMTP to send verification codes from help@edunorm.in

import nodemailer from 'nodemailer';

// Create SMTP transporter for GoDaddy Professional Email
const createTransporter = () => {
    return nodemailer.createTransport({
        host: 'smtpout.secureserver.net', // GoDaddy Professional Email SMTP
        port: 465,
        secure: true,
        auth: {
            user: process.env.SMTP_EMAIL || 'help@edunorm.in',
            pass: process.env.SMTP_PASSWORD || 'Nitin@220'
        },
        tls: {
            rejectUnauthorized: false
        }
    });
};

// Generate 6-digit OTP
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// In-memory OTP storage (resets per cold start in serverless)
// For production scale, use Redis or a database
const otpStore = new Map();

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { action, email, otp } = req.body;

        if (action === 'send') {
            // Generate and send OTP
            if (!email) {
                return res.status(400).json({ error: 'Email is required' });
            }

            const generatedOTP = generateOTP();
            const expiry = Date.now() + 10 * 60 * 1000; // 10 minutes

            // Store OTP with expiry
            otpStore.set(email, { otp: generatedOTP, expiry, attempts: 0 });

            // Send email via GoDaddy SMTP
            const transporter = createTransporter();

            const mailOptions = {
                from: '"EduNorm Support" <help@edunorm.in>',
                to: email,
                subject: '🔐 EduNorm - HOI Password Verification Code',
                html: `
                    <div style="font-family: 'Segoe UI', sans-serif; max-width: 500px; margin: 0 auto; padding: 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 16px;">
                        <div style="background: white; border-radius: 12px; padding: 30px; text-align: center;">
                            <h2 style="color: #1e1b4b; margin: 0 0 10px;">🎓 EduNorm</h2>
                            <p style="color: #6b7280; margin: 0 0 25px;">HOI Password Verification</p>
                            
                            <div style="background: #f3f4f6; border-radius: 12px; padding: 20px; margin: 20px 0;">
                                <p style="color: #374151; margin: 0 0 10px; font-size: 14px;">Your verification code is:</p>
                                <h1 style="font-size: 36px; letter-spacing: 8px; color: #7c3aed; margin: 0; font-weight: 700;">${generatedOTP}</h1>
                            </div>
                            
                            <p style="color: #9ca3af; font-size: 13px; margin: 15px 0 0;">
                                This code expires in 10 minutes.<br/>
                                If you didn't request this, please ignore this email.
                            </p>
                        </div>
                        <p style="color: rgba(255,255,255,0.7); text-align: center; font-size: 12px; margin-top: 15px;">
                            © 2026 EduNorm - Smart School Management
                        </p>
                    </div>
                `
            };

            await transporter.sendMail(mailOptions);

            return res.status(200).json({
                success: true,
                message: 'OTP sent successfully',
                expiresIn: '10 minutes'
            });

        } else if (action === 'verify') {
            // Verify OTP
            if (!email || !otp) {
                return res.status(400).json({ error: 'Email and OTP are required' });
            }

            const stored = otpStore.get(email);

            if (!stored) {
                return res.status(400).json({ error: 'No OTP found. Please request a new one.' });
            }

            if (Date.now() > stored.expiry) {
                otpStore.delete(email);
                return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
            }

            stored.attempts++;
            if (stored.attempts > 5) {
                otpStore.delete(email);
                return res.status(429).json({ error: 'Too many attempts. Please request a new OTP.' });
            }

            if (stored.otp !== otp) {
                return res.status(400).json({ error: 'Invalid OTP. Please try again.' });
            }

            // OTP verified - clean up
            otpStore.delete(email);

            return res.status(200).json({
                success: true,
                verified: true,
                message: 'OTP verified successfully'
            });

        } else {
            return res.status(400).json({ error: 'Invalid action. Use "send" or "verify".' });
        }

    } catch (error) {
        console.error('OTP Error:', error);
        return res.status(500).json({
            error: 'Failed to process OTP request',
            message: error.message
        });
    }
}
