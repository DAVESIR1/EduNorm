import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './Legal.css';

export default function PrivacyPolicy() {
    const navigate = useNavigate();

    return (
        <div className="legal-page">
            <div className="legal-container">
                <button className="back-btn" onClick={() => navigate(-1)}>
                    <ArrowLeft size={20} />
                    Back
                </button>

                <h1>Privacy Policy</h1>
                <p className="last-updated">Last updated: February 2026</p>

                <section>
                    <h2>1. Information We Collect</h2>
                    <p>
                        EduNorm ("we", "our", or "us") collects information you provide directly to us, including:
                    </p>
                    <ul>
                        <li>Account information (email address, phone number)</li>
                        <li>Student records and school data you enter</li>
                        <li>Usage data and preferences</li>
                    </ul>
                </section>

                <section>
                    <h2>2. How We Use Your Information</h2>
                    <p>We use the information we collect to:</p>
                    <ul>
                        <li>Provide, maintain, and improve our services</li>
                        <li>Process and store your school records securely</li>
                        <li>Send you technical notices and support messages</li>
                        <li>Respond to your comments and questions</li>
                    </ul>
                </section>

                <section>
                    <h2>3. Data Storage and Security</h2>
                    <p>
                        Your data is stored securely using Firebase services with encryption at rest and in transit.
                        We implement appropriate security measures to protect against unauthorized access, alteration,
                        disclosure, or destruction of your data.
                    </p>
                </section>

                <section>
                    <h2>4. Third-Party Services</h2>
                    <p>We use the following third-party services:</p>
                    <ul>
                        <li><strong>Firebase:</strong> For authentication and data storage</li>
                        <li><strong>Google AdSense:</strong> For displaying advertisements (free tier users only)</li>
                    </ul>
                    <p>
                        These services may collect information as described in their respective privacy policies.
                    </p>
                </section>

                <section>
                    <h2>5. Advertising</h2>
                    <p>
                        We display advertisements to users on our free tier. These ads are served by Google AdSense
                        and may use cookies to personalize ads based on your interests. You can opt out of personalized
                        advertising by visiting <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer">Google Ads Settings</a>.
                    </p>
                </section>

                <section>
                    <h2>6. Your Rights</h2>
                    <p>You have the right to:</p>
                    <ul>
                        <li>Access your personal data</li>
                        <li>Correct inaccurate data</li>
                        <li>Request deletion of your data</li>
                        <li>Export your data</li>
                    </ul>
                </section>

                <section>
                    <h2>7. Children's Privacy</h2>
                    <p>
                        Our service is intended for use by school administrators and teachers. We do not knowingly
                        collect personal information from children under 13 without parental consent.
                    </p>
                </section>

                <section>
                    <h2>8. Changes to This Policy</h2>
                    <p>
                        We may update this privacy policy from time to time. We will notify you of any changes by
                        posting the new policy on this page.
                    </p>
                </section>

                <section>
                    <h2>9. Contact Us</h2>
                    <p>
                        If you have any questions about this Privacy Policy, please contact us at:
                        <a href="mailto:support@edunorm.com">support@edunorm.com</a>
                    </p>
                </section>
            </div>
        </div>
    );
}
