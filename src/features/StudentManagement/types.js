/**
 * @typedef {Object} Student
 * @property {string|number} id - Unique identifier (local or cloud)
 * @property {string|number} [ledgerNo] - Ledger number (UI generated)
 * @property {string} grNo - General Register Number
 * @property {string} [name] - Full name (local script)
 * @property {string} [nameEnglish] - Full name (English)
 * @property {string} standard - Class/Standard
 * @property {string|number} [rollNo] - Roll Number
 * @property {string} [studentMiddleName] - Father's Name
 * @property {string} [motherName] - Mother's Name
 * @property {string} [contactNumber] - Contact/Mobile
 * @property {string} [aadharNumber] - Aadhar Card Number
 * @property {string} [studentBirthdate] - Birthdate
 * @property {string} [address] - Residential Address
 * @property {string} [bankAcNo] - Bank Account Number
 * @property {string} [rationCardNumber] - Ration Card Number
 */

export const CSV_HEADERS = [
    'Ledger No.',
    'GR No.',
    'Name',
    'Standard',
    'Roll No.',
    'Father Name',
    'Mother Name',
    'Contact',
    'Aadhar No.',
    'Birthdate',
    'Address',
    'Bank Ac.',
    'Ration No.'
];

export const SORT_FIELDS = {
    LEDGER_NO: 'ledgerNo',
    GR_NO: 'grNo',
    NAME: 'name',
    STANDARD: 'standard',
    ROLL_NO: 'rollNo'
};

export const MIGRATION_STATES = {
    LEGACY: 'legacy',
    SOVEREIGN: 'sovereign',
    PENDING: 'pending'
};

/**
 * SOVEREIGN DATA DICTIONARY: 43+ DATA FIELDS
 */
export const DATA_FIELDS = [
    // Step 1: Basic Information (9 fields)
    {
        step: 1,
        title: 'Basic Information',
        icon: '👤',
        fields: [
            { key: 'grNo', label: 'GR No.', type: 'text', placeholder: '4-8 digits (e.g. 2205)', required: true },
            { key: 'name', label: 'Name (Local)', type: 'text', placeholder: 'Student full name', required: true },
            { key: 'aaparIdNote', label: 'Aapar ID Note', type: 'text', placeholder: 'Aapar ID note' },
            { key: 'nameEnglish', label: 'Name in English', type: 'text', placeholder: 'Name in English', required: true },
            { key: 'udiasEnglishName', label: 'Udias English Name', type: 'text', placeholder: 'Udias English name' },
            { key: 'studentFirstName', label: 'Student First Name', type: 'text', placeholder: 'First name', required: true },
            { key: 'studentMiddleName', label: 'Student Middle Name (Father)', type: 'text', placeholder: 'Father name' },
            { key: 'studentLastName', label: 'Student Last Name (Surname)', type: 'text', placeholder: 'Surname', required: true },
            { key: 'cast', label: 'Cast', type: 'text', placeholder: 'Cast' },
        ]
    },
    // Step 2: Family Information (7 fields)
    {
        step: 2,
        title: 'Family Information',
        icon: '👨‍👩‍👧',
        fields: [
            { key: 'motherName', label: 'Mother Name', type: 'text', placeholder: 'Mother full name' },
            { key: 'fatherAadharName', label: 'Father Aadhar Name', type: 'text', placeholder: 'As on Aadhar' },
            { key: 'motherAadharName', label: 'Mother Aadhar Name', type: 'text', placeholder: 'As on Aadhar' },
            { key: 'fatherAadharNumber', label: 'Father Aadhar Number', type: 'text', placeholder: '12 digit Aadhar' },
            { key: 'motherAadharNumber', label: 'Mother Aadhar Number', type: 'text', placeholder: '12 digit Aadhar' },
            { key: 'contactNumber', label: 'Contact Number', type: 'tel', placeholder: 'Mobile number', required: true },
            { key: 'fatherMotherDeathNote', label: 'Father/Mother Death Note', type: 'text', placeholder: 'If applicable' },
        ]
    },
    // Step 3: Identification (10 fields)
    {
        step: 3,
        title: 'Identification',
        icon: '🪪',
        fields: [
            { key: 'studentBirthdate', label: 'Student Birthdate', type: 'date', placeholder: '', required: true },
            { key: 'studentAadharBirthdate', label: 'Student Aadhar Birthdate', type: 'date', placeholder: '' },
            { key: 'udiasNumber', label: 'Udias Number', type: 'text', placeholder: 'Udias number' },
            { key: 'aadharNumber', label: 'Aadhar Number', type: 'text', placeholder: '12 digit Aadhar', required: true },
            { key: 'studentAadharEnglishName', label: 'Student Aadhar English Name', type: 'text', placeholder: 'As on Aadhar' },
            { key: 'studentAadharGujaratiName', label: 'Student Aadhar Gujarati Name', type: 'text', placeholder: 'As on Aadhar' },
            { key: 'penNumber', label: 'Pen Number', type: 'text', placeholder: 'PEN' },
            { key: 'aaparNumber', label: 'Aapar Number', type: 'text', placeholder: 'Aapar number' },
        ]
    },
    // Step 4: Banking & Ration (8 fields)
    {
        step: 4,
        title: 'Banking & Ration',
        icon: '🏦',
        fields: [
            { key: 'bankAcNo', label: 'Bank Ac. No.', type: 'text', placeholder: 'Account number' },
            { key: 'nameInBankAc', label: 'Name in Bank Ac.', type: 'text', placeholder: 'As on passbook' },
            { key: 'bankBranchName', label: 'Bank Branch Name', type: 'text', placeholder: 'Branch name' },
            { key: 'bankIfscCode', label: 'Bank IFSC Code', type: 'text', placeholder: 'IFSC code' },
            { key: 'rationCardNumber', label: 'Ration Card Number', type: 'text', placeholder: 'Ration card no.' },
            { key: 'rationCardKycStatus', label: 'Ration Card KYC Status', type: 'select', options: ['Pending', 'Completed', 'Not Applicable'] },
            { key: 'studentRationNumber', label: 'Student Ration Number', type: 'text', placeholder: 'Student ration no.' },
            { key: 'rationCardType', label: 'Ration Card Type', type: 'select', options: ['APL', 'BPL', 'AAY', 'Other'] },
        ]
    },
    // Step 5: Additional Info & Documents
    {
        step: 5,
        title: 'Additional & Documents',
        icon: '📝',
        fields: [
            { key: 'address', label: 'Address', type: 'textarea', placeholder: 'Complete address' },
            { key: 'birthPlace', label: 'Birth Place', type: 'text', placeholder: 'Place of birth' },
            { key: 'birthTaluka', label: 'Birth Taluka', type: 'text', placeholder: 'Taluka' },
            { key: 'birthDistrict', label: 'Birth District', type: 'text', placeholder: 'District' },
            { key: 'weight', label: 'Weight (kg)', type: 'number', placeholder: 'Weight in kg' },
            { key: 'height', label: 'Height (cm)', type: 'number', placeholder: 'Height in cm' },
            { key: 'pastYearAttendance', label: 'Past Year Attendance (%)', type: 'number', placeholder: 'Attendance %' },
            { key: 'pastYearExamMarks', label: 'Past Year Exam Marks', type: 'text', placeholder: 'Total marks' },
            { key: 'pastYearPercentage', label: 'Past Year %', type: 'number', placeholder: '%' },
            { key: 'schoolAdmitDate', label: 'School Admit Date', type: 'date', placeholder: '' },
            { key: 'classAdmitDate', label: 'Class/Standard Admit Date', type: 'date', placeholder: '' },
            { key: 'schoolLeaveDate', label: 'School Leave Date', type: 'date', placeholder: '' },
            { key: 'schoolLeaveNote', label: 'School Leave Note', type: 'textarea', placeholder: 'Reason for leaving' },
            { key: 'studentPhoto', label: 'Student Photo', type: 'file', accept: 'image/*' },
            { key: 'studentDocuments', label: 'Student Documents Vault', type: 'documents', placeholder: 'Upload documents' },
            { key: 'issuedCertificates', label: 'Issued Certificates (for Student Download)', type: 'documents', placeholder: 'Upload certificates here' },
        ]
    }
];

