import React, { forwardRef } from 'react';
import './IdCard.css';

// 15 Premium Templates inspired by best modern ID card designs
const TEMPLATES = [
    { id: 'classic-elegant', name: 'Classic Elegant', icon: '🎓' },
    { id: 'modern-minimal', name: 'Modern Minimal', icon: '✨' },
    { id: 'colorful-fun', name: 'Colorful Fun', icon: '🌈' },
    { id: 'professional', name: 'Professional', icon: '💼' },
    { id: 'vintage-certificate', name: 'Vintage Certificate', icon: '🏆' },
    { id: 'gradient-wave', name: 'Gradient Wave', icon: '🌊' },
    { id: 'dark-premium', name: 'Dark Premium', icon: '🌙' },
    { id: 'sky-fresh', name: 'Sky Fresh', icon: '☁️' },
    { id: 'royal-gold', name: 'Royal Gold', icon: '👑' },
    { id: 'ocean-breeze', name: 'Ocean Breeze', icon: '🐋' },
    { id: 'cherry-blossom', name: 'Cherry Blossom', icon: '🌸' },
    { id: 'tech-future', name: 'Tech Future', icon: '💻' },
    { id: 'sports-dynamic', name: 'Sports Dynamic', icon: '⚽' },
    { id: 'creative-art', name: 'Creative Art', icon: '🎨' },
    { id: 'eco-nature', name: 'Eco Nature', icon: '🌿' }
];

// Available fields for customization
const AVAILABLE_FIELDS = [
    { id: 'grNo', label: 'GR Number', default: true },
    { id: 'rollNo', label: 'Roll Number', default: true },
    { id: 'standard', label: 'Class/Standard', default: true },
    { id: 'contact', label: 'Contact Number', default: true },
    { id: 'email', label: 'Email', default: false },
    { id: 'dob', label: 'Date of Birth', default: false },
    { id: 'fatherName', label: 'Father Name', default: false },
    { id: 'bloodGroup', label: 'Blood Group', default: false },
    { id: 'address', label: 'Address', default: false },
    { id: 'section', label: 'Section', default: false },
    { id: 'admissionDate', label: 'Admission Date', default: false }
];

// Default visible fields
const DEFAULT_VISIBLE_FIELDS = AVAILABLE_FIELDS.filter(f => f.default).map(f => f.id);

const IdCard = forwardRef(({
    student,
    schoolName,
    schoolLogo,
    schoolContact,
    schoolEmail,
    template = 'classic-elegant',
    visibleFields = DEFAULT_VISIBLE_FIELDS
}, ref) => {
    if (!student) return null;

    // Required fields - always displayed
    const studentName = student.name || student.nameEnglish || 'Student Name';
    const photo = student.studentPhoto;
    const logo = schoolLogo;
    const school = schoolName || 'School Name';

    // Field values with fallbacks
    const fieldValues = {
        grNo: { label: 'GR No.', value: student.grNo || '—' },
        rollNo: { label: 'Roll No.', value: student.rollNo || '—' },
        standard: { label: 'Class', value: student.standard || '—' },
        contact: { label: '📞', value: student.contactNumber || schoolContact || '—' },
        email: { label: '✉️', value: student.email || schoolEmail || '' },
        dob: { label: 'DOB', value: student.dateOfBirth || '—' },
        fatherName: { label: "Father's Name", value: student.fatherName || '—' },
        bloodGroup: { label: 'Blood', value: student.bloodGroup || '—' },
        address: { label: 'Address', value: student.address || '—' },
        section: { label: 'Section', value: student.section || '—' },
        admissionDate: { label: 'Admitted', value: student.admissionDate || '—' }
    };

    // Split visible fields into main fields and contact fields
    const mainFields = visibleFields.filter(f => !['contact', 'email'].includes(f));
    const contactFields = visibleFields.filter(f => ['contact', 'email'].includes(f));

    return (
        <div ref={ref} className={`id-card template-${template}`}>
            {/* Background Decorations */}
            <div className="id-bg-layer">
                <div className="id-bg-gradient"></div>
                <div className="id-bg-pattern"></div>
                <div className="id-bg-shape shape-1"></div>
                <div className="id-bg-shape shape-2"></div>
                <div className="id-bg-shape shape-3"></div>
                <div className="id-accent-bar"></div>
            </div>

            {/* Main Content */}
            <div className="id-content">
                {/* Top Section: School Info */}
                <header className="id-header">
                    <div className="id-logo-wrap">
                        {logo ? (
                            <img src={logo} alt="Logo" className="id-logo-img" />
                        ) : (
                            <div className="id-logo-default">🏫</div>
                        )}
                    </div>
                    <div className="id-school-text">
                        <h1 className="id-school-name">{school}</h1>
                        <div className="id-card-type">STUDENT IDENTITY CARD</div>
                    </div>
                </header>

                {/* Middle Section: Photo + Info */}
                <main className="id-main">
                    <div className="id-photo-section">
                        <div className="id-photo-container">
                            {photo ? (
                                <img src={photo} alt="Student" className="id-photo-img" />
                            ) : (
                                <div className="id-photo-empty">
                                    <span className="photo-icon">👤</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="id-info-section">
                        <div className="id-student-name">{studentName}</div>

                        <div className="id-fields">
                            {mainFields.map(fieldId => {
                                const field = fieldValues[fieldId];
                                if (!field || !field.value || field.value === '—') return null;
                                return (
                                    <div key={fieldId} className="id-field">
                                        <span className="field-label">{field.label}</span>
                                        <span className="field-value">{field.value}</span>
                                    </div>
                                );
                            })}
                        </div>

                        {contactFields.length > 0 && (
                            <div className="id-contact-info">
                                {contactFields.map(fieldId => {
                                    const field = fieldValues[fieldId];
                                    if (!field || !field.value || field.value === '—') return null;
                                    return (
                                        <div key={fieldId} className="contact-row">
                                            <span className="contact-icon">{field.label}</span>
                                            <span className="contact-text">{field.value}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </main>

                {/* Bottom Section: Footer */}
                <footer className="id-footer">
                    <div className="id-validity">
                        <span className="validity-label">Valid:</span>
                        <span className="validity-year">{new Date().getFullYear()}-{new Date().getFullYear() + 1}</span>
                    </div>
                    <div className="id-auth">
                        <div className="auth-line"></div>
                        <span className="auth-text">Authorized Signature</span>
                    </div>
                </footer>
            </div>
        </div>
    );
});

IdCard.displayName = 'IdCard';
export { TEMPLATES, AVAILABLE_FIELDS, DEFAULT_VISIBLE_FIELDS };
export default IdCard;

