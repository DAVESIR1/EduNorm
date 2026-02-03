import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './Legal.css';

export default function TermsOfService() {
    const navigate = useNavigate();

    return (
        <div className="legal-page">
            <div className="legal-container">
                <button className="back-btn" onClick={() => navigate(-1)}>
                    <ArrowLeft size={20} />
                    Back
                </button>

                <h1>Terms of Service</h1>
                <p className="last-updated">Last updated: February 2026</p>

                <section>
                    <h2>1. Acceptance of Terms</h2>
                    <p>
                        By accessing and using MN School Sathi ("Service"), you accept and agree to be bound by
                        the terms and conditions of this agreement. If you do not agree to these terms, please
                        do not use our Service.
                    </p>
                </section>

                <section>
                    <h2>2. Description of Service</h2>
                    <p>
                        MN School Sathi is a school management application that allows users to:
                    </p>
                    <ul>
                        <li>Manage student records and information</li>
                        <li>Generate ID cards and documents</li>
                        <li>Maintain general registers and ledgers</li>
                        <li>Export data to various formats</li>
                    </ul>
                </section>

                <section>
                    <h2>3. User Accounts</h2>
                    <p>
                        You are responsible for maintaining the confidentiality of your account credentials
                        and for all activities that occur under your account. You agree to:
                    </p>
                    <ul>
                        <li>Provide accurate and complete registration information</li>
                        <li>Maintain and update your information as needed</li>
                        <li>Notify us immediately of any unauthorized use</li>
                    </ul>
                </section>

                <section>
                    <h2>4. User Tiers</h2>
                    <p>Our Service offers different user tiers:</p>
                    <ul>
                        <li><strong>Free Tier:</strong> Basic features with advertisements</li>
                        <li><strong>Premium Tier:</strong> Full features without advertisements</li>
                        <li><strong>Admin Tier:</strong> Full administrative access</li>
                    </ul>
                </section>

                <section>
                    <h2>5. Acceptable Use</h2>
                    <p>You agree not to:</p>
                    <ul>
                        <li>Use the Service for any unlawful purpose</li>
                        <li>Upload false or misleading information</li>
                        <li>Attempt to gain unauthorized access to our systems</li>
                        <li>Interfere with or disrupt the Service</li>
                        <li>Use automated means to access the Service without permission</li>
                    </ul>
                </section>

                <section>
                    <h2>6. Data Ownership</h2>
                    <p>
                        You retain ownership of all data you input into the Service. We do not claim ownership
                        of your content. By using the Service, you grant us a license to store and process
                        your data as necessary to provide the Service.
                    </p>
                </section>

                <section>
                    <h2>7. Advertisements</h2>
                    <p>
                        Free tier users will see advertisements. These ads are served by third-party advertising
                        networks. We are not responsible for the content of these advertisements.
                    </p>
                </section>

                <section>
                    <h2>8. Disclaimer of Warranties</h2>
                    <p>
                        The Service is provided "as is" without warranties of any kind, either express or implied.
                        We do not guarantee that the Service will be uninterrupted, error-free, or secure.
                    </p>
                </section>

                <section>
                    <h2>9. Limitation of Liability</h2>
                    <p>
                        To the maximum extent permitted by law, we shall not be liable for any indirect, incidental,
                        special, consequential, or punitive damages arising from your use of the Service.
                    </p>
                </section>

                <section>
                    <h2>10. Changes to Terms</h2>
                    <p>
                        We reserve the right to modify these terms at any time. Continued use of the Service
                        after changes constitutes acceptance of the modified terms.
                    </p>
                </section>

                <section>
                    <h2>11. Contact</h2>
                    <p>
                        For questions about these Terms, contact us at:
                        <a href="mailto:support@mnschoolsathi.com">support@mnschoolsathi.com</a>
                    </p>
                </section>
            </div>
        </div>
    );
}
