import React from 'react';
import IdCard from './IdCard';
import '../Common/PrintStyles.css';

const IdCardPrintDocument = ({
    students,
    template,
    visibleFields,
    schoolName,
    schoolLogo,
    schoolContact,
    schoolAddress,
    schoolEmail
}) => {
    if (!students || students.length === 0) return null;

    return (
        <div className="print-page-a4" style={{ padding: '5mm' }}>
            <div className="id-card-grid">
                {students.map((student, index) => (
                    <div key={student.id || index} className="id-card-print-item">
                        <IdCard
                            student={student}
                            schoolName={schoolName}
                            schoolLogo={schoolLogo}
                            schoolContact={schoolContact}
                            schoolAddress={schoolAddress}
                            schoolEmail={schoolEmail}
                            template={template}
                            visibleFields={visibleFields}
                            backSide={false} // Force front side only as requested
                        />
                    </div>
                ))}
            </div>
            <div style={{
                position: 'absolute',
                bottom: '5mm',
                right: '5mm',
                fontSize: '8px',
                color: '#ccc'
            }}>
                Batch Print - {students.length} Cards
            </div>
        </div>
    );
};

export default IdCardPrintDocument;
