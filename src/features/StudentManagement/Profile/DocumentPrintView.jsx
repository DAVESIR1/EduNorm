import React from 'react';
import '../../../components/Common/PrintStyles.css';

// Reusing the detailed field list logic but optimizing for flat document layout
const DocumentPrintView = ({ student, schoolName, schoolLogo, schoolContact, schoolEmail }) => {
    if (!student) return null;

    const renderField = (label, value) => (
        <div className="doc-field">
            <span className="doc-label">{label}</span>
            <span className="doc-value">{value || '—'}</span>
        </div>
    );

    return (
        <div className="print-page-a4">
            {/* Header */}
            <header className="doc-header">
                {schoolLogo ? (
                    <img src={schoolLogo} alt="Logo" className="doc-logo" />
                ) : (
                    <div className="doc-logo" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #ccc' }}>🏫</div>
                )}

                <div className="doc-school-info">
                    <h1 className="doc-school-name">{schoolName || 'School Name'}</h1>
                    <div className="doc-school-contact">
                        {schoolContact && <span>📞 {schoolContact}</span>}
                        {schoolContact && schoolEmail && <span> | </span>}
                        {schoolEmail && <span>✉️ {schoolEmail}</span>}
                    </div>
                    <div className="doc-title">Student Profile</div>
                </div>

                {student.studentPhoto ? (
                    <img src={student.studentPhoto} alt="Student" className="doc-photo" />
                ) : (
                    <div className="doc-photo" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>👤</div>
                )}
            </header>

            {/* Content Body */}

            {/* 1. Identity & Academic */}
            <section className="doc-section">
                <h3 className="doc-section-title">Academic & Identity</h3>
                <div className="doc-grid">
                    {renderField('GR Number', student.grNo)}
                    {renderField('Roll Number', student.rollNo)}
                    {renderField('Class / Standard', student.standard)}
                    {renderField('Section', student.section)}
                    {renderField('Stream', student.stream)}
                    {renderField('Admission Date', student.admissionDate)}
                    {renderField('House / Team', student.house)}
                    {renderField('Current Academic Year', new Date().getFullYear())}
                </div>
            </section>

            {/* 2. Personal Information */}
            <section className="doc-section">
                <h3 className="doc-section-title">Personal Information</h3>
                <div className="doc-grid">
                    {renderField('Full Name (English)', student.nameEnglish || student.name)}
                    {renderField('Native Name', student.name)}
                    {renderField('Date of Birth', student.dateOfBirth || student.dob)}
                    {renderField('Gender', student.gender)}
                    {renderField('Blood Group', student.bloodGroup)}
                    {renderField('Mother Tongue', student.motherTongue)}
                    {renderField('Nationality', student.nationality)}
                    {renderField('Religion', student.religion)}
                    {renderField('Caste', student.caste)}
                    {renderField('Category', student.category)}
                    {renderField('Birth Place', student.birthPlace)}
                </div>
            </section>

            {/* 3. Contact Details */}
            <section className="doc-section">
                <h3 className="doc-section-title">Contact Information</h3>
                <div className="doc-grid" style={{ gridTemplateColumns: '1fr' }}> {/* Full width for address */}
                    {renderField('Permanent Address', student.address)}
                </div>
                <div className="doc-grid" style={{ marginTop: '10px' }}>
                    {renderField('City / Village', student.city)}
                    {renderField('Pincode', student.pincode)}
                    {renderField('Student Mobile', student.contactNumber)}
                    {renderField('Student Email', student.email)}
                    {renderField('Transport Route', student.transportRoute)}
                    {renderField('Vehicle Number', student.vehicleNo)}
                </div>
            </section>

            {/* 4. Family Details */}
            <section className="doc-section">
                <h3 className="doc-section-title">Parent / Guardian Details</h3>
                <div className="doc-grid">
                    {renderField("Father's Name", student.fatherName)}
                    {renderField("Mother's Name", student.motherName)}
                    {renderField("Parent Contact", student.fatherContact || student.parentContact)}
                    {renderField("Father's Occupation", student.fatherOccupation)}
                    {renderField("Mother's Occupation", student.motherOccupation)}
                    {renderField("Annual Income", student.annualIncome)}
                    {renderField("Father Aadhar", student.fatherAadharNumber)}
                    {renderField("Mother Aadhar", student.motherAadharNumber)}
                </div>
            </section>

            {/* 5. Government IDs & Banking */}
            <section className="doc-section">
                <h3 className="doc-section-title">Official IDs & Banking</h3>
                <div className="doc-grid">
                    {renderField("Student Aadhaar No.", student.aadharNo || student.aadhaarNo)}
                    {renderField("APAAR ID", student.apaarId)}
                    {renderField("PEN (UDISE+)", student.penId)}
                    {renderField("Samagra ID", student.samagraId)}
                    {renderField("Bank Account No.", student.bankAccountNo || student.bankAccount)}
                    {renderField("IFSC Code", student.ifscCode)}
                    {renderField("Bank Name", student.bankName)}
                    {renderField("Branch", student.bankBranchName)}
                </div>
            </section>

            {/* 6. Health & Other */}
            <section className="doc-section">
                <h3 className="doc-section-title">Health & Additional Info</h3>
                <div className="doc-grid">
                    {renderField("Height", student.height)}
                    {renderField("Weight", student.weight)}
                    {renderField("Vision", student.vision)}
                    {renderField("Dental Hygiene", student.dental)}
                    {renderField("Allergies / Medical", student.allergies)}
                    {renderField("Library Card No.", student.libraryCard)}
                </div>
            </section>

            {/* Footer Signatures */}
            <footer style={{ marginTop: '40px', display: 'flex', justifyContent: 'space-between', paddingTop: '20px' }}>
                <div style={{ textAlign: 'center', minWidth: '150px' }}>
                    <div style={{ borderBottom: '1px solid #333', marginBottom: '5px', height: '1px' }}></div>
                    <span style={{ fontSize: '12px', fontWeight: '600' }}>Class Teacher</span>
                </div>
                <div style={{ textAlign: 'center', minWidth: '150px' }}>
                    <div style={{ borderBottom: '1px solid #333', marginBottom: '5px', height: '1px' }}></div>
                    <span style={{ fontSize: '12px', fontWeight: '600' }}>Principal / HOI</span>
                </div>
            </footer>

            <div style={{ marginTop: '20px', fontSize: '10px', color: '#999', textAlign: 'center' }}>
                Generated on {new Date().toLocaleDateString()} | EduNorm School Management System
            </div>
        </div>
    );
};

export default DocumentPrintView;
