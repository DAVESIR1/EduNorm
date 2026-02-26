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
const ID_CARD_FIELDS = [
    // --- Step 1: Basic Information ---
    { id: 'grNo', label: 'GR No.', default: true },
    { id: 'name', label: 'Name (Local)', default: false },
    { id: 'nameEnglish', label: 'Name in English', default: true },
    { id: 'studentFirstName', label: 'First Name', default: false },
    { id: 'studentMiddleName', label: 'Middle Name (Father)', default: false },
    { id: 'studentLastName', label: 'Last Name (Surname)', default: false },
    { id: 'udiasEnglishName', label: 'Udias English Name', default: false },
    { id: 'aaparIdNote', label: 'Aapar ID Note', default: false },
    { id: 'cast', label: 'Cast', default: false },

    // --- Standard Items ---
    { id: 'standard', label: 'Standard', default: true },
    { id: 'rollNo', label: 'Roll No.', default: true },
    { id: 'section', label: 'Section', default: false },
    { id: 'stream', label: 'Stream', default: false },

    // --- Step 2: Family Information ---
    { id: 'motherName', label: 'Mother Name', default: false },
    { id: 'fatherAadharName', label: 'Father Aadhar Name', default: false },
    { id: 'motherAadharName', label: 'Mother Aadhar Name', default: false },
    { id: 'fatherAadharNumber', label: 'Father Aadhar Number', default: false },
    { id: 'motherAadharNumber', label: 'Mother Aadhar Number', default: false },
    { id: 'contactNumber', label: 'Contact Number', default: true },
    { id: 'fatherMotherDeathNote', label: 'Father/Mother Death Note', default: false },

    // --- Step 3: Identification ---
    { id: 'studentBirthdate', label: 'Student Birthdate', default: true },
    { id: 'studentAadharBirthdate', label: 'Aadhar Birthdate', default: false },
    { id: 'udiasNumber', label: 'Udias Number', default: false },
    { id: 'aadharNumber', label: 'Aadhar Number', default: false },
    { id: 'studentAadharEnglishName', label: 'Aadhar English Name', default: false },
    { id: 'studentAadharGujaratiName', label: 'Aadhar Gujarati Name', default: false },
    { id: 'penNumber', label: 'Pen Number', default: false },
    { id: 'aaparNumber', label: 'Aapar Number', default: false },

    // --- Step 4: Banking & Ration ---
    { id: 'bankAcNo', label: 'Bank Ac. No.', default: false },
    { id: 'nameInBankAc', label: 'Name in Bank Ac.', default: false },
    { id: 'bankBranchName', label: 'Bank Branch Name', default: false },
    { id: 'bankIfscCode', label: 'Bank IFSC Code', default: false },
    { id: 'rationCardNumber', label: 'Ration Card Number', default: false },
    { id: 'rationCardKycStatus', label: 'Ration Card KYC Status', default: false },
    { id: 'studentRationNumber', label: 'Student Ration Number', default: false },
    { id: 'rationCardType', label: 'Ration Card Type', default: false },

    // --- Step 5: Additional Info ---
    { id: 'address', label: 'Address', default: true },
    { id: 'birthPlace', label: 'Birth Place', default: false },
    { id: 'birthTaluka', label: 'Birth Taluka', default: false },
    { id: 'birthDistrict', label: 'Birth District', default: false },
    { id: 'weight', label: 'Weight (kg)', default: false },
    { id: 'height', label: 'Height (cm)', default: false },
    { id: 'bloodGroup', label: 'Blood Group', default: false },
    { id: 'pastYearAttendance', label: 'Past Year Attendance (%)', default: false },
    { id: 'pastYearExamMarks', label: 'Past Year Exam Marks', default: false },
    { id: 'pastYearPercentage', label: 'Past Year %', default: false },
    { id: 'schoolAdmitDate', label: 'School Admit Date', default: false },
    { id: 'classAdmitDate', label: 'Class/Standard Admit Date', default: false },
    { id: 'schoolLeaveDate', label: 'School Leave Date', default: false },
    { id: 'schoolLeaveNote', label: 'School Leave Note', default: false },
];

// Default visible fields
const DEFAULT_VISIBLE_FIELDS = ID_CARD_FIELDS.filter(f => f.default).map(f => f.id);

const IdCard = forwardRef(({
    student,
    schoolName,
    schoolLogo,
    schoolContact,
    schoolEmail,
    diseCode,
    signatureImage,
    template = 'classic-elegant',
    visibleFields = DEFAULT_VISIBLE_FIELDS,
    backSide = false,
    schoolAddress = ''
}, ref) => {
    if (!student) return null;

    // Back Side Render
    if (backSide) {
        return (
            <div ref={ref} className={`id-card template-${template} back-side`}>
                <div className="id-bg-layer">
                    <div className="id-bg-gradient"></div>
                    <div className="id-bg-pattern"></div>
                    <div className="id-accent-bar"></div>
                </div>

                <div className="id-content back-content" style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '15px', textAlign: 'center', justifyContent: 'space-between' }}>
                    <div className="back-header" style={{ borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
                        <h3 style={{ margin: 0, fontSize: '14px', color: 'var(--primary-color)' }}>{schoolName || 'School Name'}</h3>
                        <p style={{ margin: 0, fontSize: '10px', color: '#666' }}>Student Identity Card</p>
                    </div>

                    <div className="back-body" style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: '10px' }}>
                        <div className="terms-container" style={{ textAlign: 'left', fontSize: '8px', color: '#444', width: '100%' }}>
                            <h4 style={{ margin: '0 0 5px 0', fontSize: '10px' }}>Terms & Conditions</h4>
                            <ul style={{ margin: 0, padding: '0 0 0 15px', lineHeight: '1.4' }}>
                                <li>This card is the property of the school.</li>
                                <li>Transfer of this card to another person is strictly prohibited.</li>
                                <li>Report loss of this card immediately to the school authority.</li>
                                <li>This card must be presented upon request.</li>
                            </ul>
                        </div>

                        <div className="school-address" style={{ fontSize: '9px', color: '#444', marginTop: '10px' }}>
                            <p style={{ margin: '2px 0' }}><strong>Address:</strong> {schoolAddress || 'School Address not available'}</p>
                            <p style={{ margin: '2px 0' }}><strong>Contact:</strong> {schoolContact || '—'} | {schoolEmail || '—'}</p>
                        </div>

                        <div className="qr-placeholder" style={{ marginTop: '10px' }}>
                            <img
                                src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${student.grNo || '0000'}`}
                                alt="QR"
                                style={{ width: '60px', height: '60px' }}
                            />
                        </div>
                    </div>

                    <div className="back-footer" style={{ borderTop: '1px solid #eee', paddingTop: '5px' }}>
                        <p style={{ fontSize: '8px', color: '#888', margin: 0 }}>If found, please return to the school address above.</p>
                    </div>
                </div>
            </div>
        );
    }

    // Required fields
    const displayTitleName = student.nameEnglish || student.name || 'Student Name';
    const photo = student.studentPhoto;
    const logo = schoolLogo;
    const school = schoolName || 'School Name';

    // Field values with rigorous fallbacks
    const fieldValues = {
        // --- Step 1 ---
        grNo: { label: 'GR No.', value: student.grNo || '—' },
        name: { label: 'Name (Loc)', value: student.name || '—' },
        nameEnglish: { label: 'Name (Eng)', value: student.nameEnglish || '—' },
        studentFirstName: { label: 'First Name', value: student.studentFirstName || '—' },
        studentMiddleName: { label: 'Father Name', value: student.studentMiddleName || '—' },
        studentLastName: { label: 'Surname', value: student.studentLastName || '—' },
        udiasEnglishName: { label: 'UDISE Name', value: student.udiasEnglishName || '—' },
        aaparIdNote: { label: 'APAAR Note', value: student.aaparIdNote || '—' },
        cast: { label: 'Caste', value: student.cast || '—' },

        // --- Standard ---
        standard: { label: 'Class', value: student.standard || '—' },
        section: { label: 'Section', value: student.section || '—' },
        rollNo: { label: 'Roll No.', value: student.rollNo || '—' },
        stream: { label: 'Stream', value: student.stream || '—' },

        // --- Step 2 ---
        motherName: { label: 'Mother', value: student.motherName || '—' },
        fatherAadharName: { label: 'Fa. Aadhar Nm', value: student.fatherAadharName || '—' },
        motherAadharName: { label: 'Mo. Aadhar Nm', value: student.motherAadharName || '—' },
        fatherAadharNumber: { label: 'Fa. Aadhar No', value: student.fatherAadharNumber || '—' },
        motherAadharNumber: { label: 'Mo. Aadhar No', value: student.motherAadharNumber || '—' },
        contactNumber: { label: 'Contact', value: student.contactNumber || student.contact || '—' },
        fatherMotherDeathNote: { label: 'Death Note', value: student.fatherMotherDeathNote || '—' },

        // --- Step 3 ---
        studentBirthdate: { label: 'DOB', value: student.studentBirthdate || student.dateOfBirth || student.dob || '—' },
        studentAadharBirthdate: { label: 'DOB (Aadhar)', value: student.studentAadharBirthdate || '—' },
        udiasNumber: { label: 'UDISE', value: student.udiasNumber || '—' },
        aadharNumber: { label: 'Aadhaar', value: student.aadharNumber || student.aadharNo || '—' },
        studentAadharEnglishName: { label: 'Adhr Nm(E)', value: student.studentAadharEnglishName || '—' },
        studentAadharGujaratiName: { label: 'Adhr Nm(G)', value: student.studentAadharGujaratiName || '—' },
        penNumber: { label: 'PEN', value: student.penNumber || '—' },
        aaparNumber: { label: 'APAAR', value: student.aaparNumber || '—' },

        // --- Step 4 ---
        bankAcNo: { label: 'Bank A/c', value: student.bankAcNo || '—' },
        nameInBankAc: { label: 'Bank Name', value: student.nameInBankAc || '—' },
        bankBranchName: { label: 'Branch', value: student.bankBranchName || '—' },
        bankIfscCode: { label: 'IFSC', value: student.bankIfscCode || '—' },
        rationCardNumber: { label: 'Ration No', value: student.rationCardNumber || '—' },
        rationCardKycStatus: { label: 'Ration KYC', value: student.rationCardKycStatus || '—' },
        studentRationNumber: { label: 'St. Ration', value: student.studentRationNumber || '—' },
        rationCardType: { label: 'Ration Type', value: student.rationCardType || '—' },

        // --- Step 5 ---
        address: { label: 'Address', value: student.address || '—' },
        birthPlace: { label: 'Birth Place', value: student.birthPlace || '—' },
        birthTaluka: { label: 'Taluka', value: student.birthTaluka || '—' },
        birthDistrict: { label: 'District', value: student.birthDistrict || '—' },
        weight: { label: 'Weight', value: student.weight || '—' },
        height: { label: 'Height', value: student.height || '—' },
        bloodGroup: { label: 'Blood Grp', value: student.bloodGroup || '—' },
        pastYearAttendance: { label: 'Attendance', value: student.pastYearAttendance || '—' },
        pastYearExamMarks: { label: 'Marks', value: student.pastYearExamMarks || '—' },
        pastYearPercentage: { label: '%', value: student.pastYearPercentage || '—' },
        schoolAdmitDate: { label: 'Sch. Admit', value: student.schoolAdmitDate || '—' },
        classAdmitDate: { label: 'Cls. Admit', value: student.classAdmitDate || '—' },
        schoolLeaveDate: { label: 'Leave Date', value: student.schoolLeaveDate || '—' },
        schoolLeaveNote: { label: 'Leave Note', value: student.schoolLeaveNote || '—' },
    };

    const contactKeys = ['contactNumber', 'email', 'fatherContact'];
    const mainFields = visibleFields.filter(f => !contactKeys.includes(f));
    const contactFieldsList = visibleFields.filter(f => contactKeys.includes(f));

    return (
        <div ref={ref} className={`id-card template-${template}`}>
            <div className="id-bg-layer">
                <div className="id-bg-gradient"></div>
                <div className="id-bg-pattern"></div>
                <div className="id-bg-shape shape-1"></div>
                <div className="id-bg-shape shape-2"></div>
                <div className="id-bg-shape shape-3"></div>
                <div className="id-accent-bar"></div>
            </div>

            <div className="id-content">
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
                        <div className="id-school-contact-header" style={{ fontSize: '7px', opacity: 0.8, marginTop: '2px', display: 'flex', gap: '5px', justifyContent: 'center' }}>
                            {schoolContact && <span>📞 {schoolContact}</span>}
                            {schoolEmail && <span>✉️ {schoolEmail}</span>}
                        </div>
                    </div>
                </header>

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
                        <div className="id-student-name">{displayTitleName}</div>

                        <div className="id-fields">
                            {mainFields.map(fieldId => {
                                const field = fieldValues[fieldId];
                                if (!field) return null;
                                return (
                                    <div key={fieldId} className="id-field">
                                        <span className="field-label">{field.label}</span>
                                        <span className="field-value">{field.value}</span>
                                    </div>
                                );
                            })}
                        </div>

                        {contactFieldsList.length > 0 && (
                            <div className="id-contact-info">
                                {contactFieldsList.map(fieldId => {
                                    const field = fieldValues[fieldId];
                                    if (!field) return null;
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

                <footer className="id-footer">
                    <div className="id-validity">
                        <span className="validity-label">Valid:</span>
                        <span className="validity-year">{new Date().getFullYear()}-{new Date().getFullYear() + 1}</span>
                        {diseCode && (
                            <span className="id-dise-code">DISE: {diseCode}</span>
                        )}
                    </div>
                    <div className="id-auth">
                        {signatureImage ? (
                            <img src={signatureImage} alt="Signature" className="id-signature-img" />
                        ) : (
                            <div className="auth-line"></div>
                        )}
                        <span className="auth-text">Authorized Signature</span>
                    </div>
                </footer>

                {(schoolContact || schoolEmail) && (
                    <div style={{
                        position: 'absolute', bottom: '2px', left: 0, right: 0,
                        textAlign: 'center', fontSize: '8px', color: '#64748b',
                        background: 'rgba(255,255,255,0.9)', padding: '2px 0'
                    }}>
                        {schoolContact && `📞 ${schoolContact} `}
                        {schoolEmail && `✉️ ${schoolEmail}`}
                    </div>
                )}
            </div>
        </div>
    );
});

IdCard.displayName = 'IdCard';
export { TEMPLATES, ID_CARD_FIELDS, DEFAULT_VISIBLE_FIELDS };
export default IdCard;
