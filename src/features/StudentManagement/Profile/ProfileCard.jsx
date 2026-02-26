import React, { forwardRef } from 'react';
import './ProfileCard.css';

const ProfileCard = forwardRef(({
    student,
    template = 'classic',
    schoolName,
    schoolLogo,
    schoolContact
}, ref) => {
    if (!student) return null;

    // Group fields into sections for display
    const basicInfo = [
        { label: 'GR No.', value: student.grNo },
        { label: 'Name (Local)', value: student.name },
        { label: 'Name in English', value: student.nameEnglish },
        { label: 'Aapar ID Note', value: student.aaparIdNote },
        { label: 'Udias English Name', value: student.udiasEnglishName },
        { label: 'First Name', value: student.studentFirstName },
        { label: 'Middle Name (Father)', value: student.studentMiddleName },
        { label: 'Last Name (Surname)', value: student.studentLastName },
        { label: 'Cast', value: student.cast },
        { label: 'Standard', value: student.standard },
        { label: 'Roll No.', value: student.rollNo },
    ];

    const familyInfo = [
        { label: 'Mother Name', value: student.motherName },
        { label: 'Father Aadhar Name', value: student.fatherAadharName },
        { label: 'Mother Aadhar Name', value: student.motherAadharName },
        { label: 'Father Aadhar Number', value: student.fatherAadharNumber },
        { label: 'Mother Aadhar Number', value: student.motherAadharNumber },
        { label: 'Contact Number', value: student.contactNumber },
        { label: 'Father/Mother Death Note', value: student.fatherMotherDeathNote },
    ];

    const identificationInfo = [
        { label: 'Student Birthdate', value: student.studentBirthdate },
        { label: 'Aadhar Birthdate', value: student.studentAadharBirthdate },
        { label: 'Udias Number', value: student.udiasNumber },
        { label: 'Aadhar Number', value: student.aadharNumber },
        { label: 'Aadhar English Name', value: student.studentAadharEnglishName },
        { label: 'Aadhar Gujarati Name', value: student.studentAadharGujaratiName },
        { label: 'Pen Number', value: student.penNumber },
        { label: 'Aapar Number', value: student.aaparNumber },
    ];

    const bankingInfo = [
        { label: 'Bank Ac. No.', value: student.bankAcNo },
        { label: 'Name in Bank Ac.', value: student.nameInBankAc },
        { label: 'Bank Branch Name', value: student.bankBranchName },
        { label: 'Bank IFSC Code', value: student.bankIfscCode },
        { label: 'Ration Card Number', value: student.rationCardNumber },
        { label: 'Ration Card KYC Status', value: student.rationCardKycStatus },
        { label: 'Student Ration Number', value: student.studentRationNumber },
        { label: 'Ration Card Type', value: student.rationCardType },
    ];

    const additionalInfo = [
        { label: 'Address', value: student.address },
        { label: 'Birth Place', value: student.birthPlace },
        { label: 'Birth Taluka', value: student.birthTaluka },
        { label: 'Birth District', value: student.birthDistrict },
        { label: 'Weight (kg)', value: student.weight },
        { label: 'Height (cm)', value: student.height },
        { label: 'Past Year Attendance (%)', value: student.pastYearAttendance },
        { label: 'Past Year Exam Marks', value: student.pastYearExamMarks },
        { label: 'Past Year %', value: student.pastYearPercentage },
    ];

    const renderSection = (title, fields, icon) => (
        <div className="profile-section">
            <h3 className="section-title">
                <span className="section-icon">{icon}</span>
                {title}
            </h3>
            <div className="section-grid">
                {fields.map((field, idx) => (
                    <div key={idx} className="field-item">
                        <span className="field-label">{field.label}</span>
                        <span className="field-value">{field.value || '—'}</span>
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div ref={ref} className={`profile-card template-${template}`}>
            {/* Header */}
            <div className="profile-header">
                <div className="header-left">
                    {schoolLogo ? (
                        <img src={schoolLogo} alt="School Logo" className="school-logo" />
                    ) : (
                        <div className="school-logo-placeholder">🏫</div>
                    )}
                </div>
                <div className="header-center">
                    <h1 className="school-name">{schoolName || 'School Name'}</h1>
                    <h2 className="profile-title">Student Profile</h2>
                    {schoolContact && <p className="school-contact">📞 {schoolContact}</p>}
                </div>
                <div className="header-right">
                    {student.studentPhoto ? (
                        <img src={student.studentPhoto} alt="Student" className="student-photo" />
                    ) : (
                        <div className="student-photo-placeholder">👤</div>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className="profile-body">
                {renderSection('Basic Information', basicInfo, '👤')}
                {renderSection('Family Information', familyInfo, '👨‍👩‍👧')}
                {renderSection('Identification', identificationInfo, '🪪')}
                {renderSection('Banking & Ration', bankingInfo, '🏦')}
                {renderSection('Additional Information', additionalInfo, '📝')}
            </div>

            {/* Signatures */}
            <div className="profile-footer">
                <div className="signature-box">
                    <div className="signature-line"></div>
                    <p className="signature-label">Class Teacher</p>
                </div>
                <div className="signature-box">
                    <div className="signature-line"></div>
                    <p className="signature-label">Head of Institute</p>
                </div>
            </div>
        </div>
    );
});

ProfileCard.displayName = 'ProfileCard';
export default ProfileCard;
