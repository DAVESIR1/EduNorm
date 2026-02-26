
import { SORT_FIELDS } from './types.js';

/**
 * EDUNORM V2: STUDENT MANAGEMENT LOGIC
 * Decoupled from UI and Database.
 */

export const StudentLogic = {
    /**
     * Sorts student data based on field and direction
     */
    sort(data, field, direction = 'asc') {
        if (!Array.isArray(data)) return [];

        return [...data].sort((a, b) => {
            let aVal = a[field];
            let bVal = b[field];

            // Normalize strings for comparison
            if (typeof aVal === 'string') {
                aVal = aVal.toLowerCase();
                bVal = (bVal || '').toLowerCase();
            }

            if (direction === 'asc') {
                return aVal > bVal ? 1 : -1;
            } else {
                return aVal < bVal ? 1 : -1;
            }
        });
    },

    /**
     * Search students locally (Fuzzy)
     */
    search(data, query) {
        if (!query) return data;
        const q = query.toLowerCase();

        return data.filter(student => {
            return (
                student.name?.toLowerCase().includes(q) ||
                student.nameEnglish?.toLowerCase().includes(q) ||
                student.grNo?.toString().includes(q) ||
                student.rollNo?.toString().includes(q) ||
                student.contactNumber?.toString().includes(q) ||
                student.aadharNumber?.toString().includes(q)
            );
        });
    },

    /**
     * Generates CSV string from student array
     */
    generateCSV(students) {
        const headers = [
            'Ledger No.', 'GR No.', 'Name', 'Standard', 'Roll No.',
            'Father Name', 'Mother Name', 'Contact', 'Aadhar No.',
            'Birthdate', 'Address', 'Bank Ac.', 'Ration No.'
        ];

        const rows = students.map(s => [
            s.ledgerNo || '',
            s.grNo || '',
            s.name || s.nameEnglish || '',
            s.standard || '',
            s.rollNo || '',
            s.studentMiddleName || '',
            s.motherName || '',
            s.contactNumber || '',
            s.aadharNumber || '',
            s.studentBirthdate || '',
            s.address || '',
            s.bankAcNo || '',
            s.rationCardNumber || ''
        ]);

        return [
            headers.join(','),
            ...rows.map(r => r.map(v => `"${v}"`).join(','))
        ].join('\n');
    },

    /**
     * Assigns ledger numbers based on GR sort
     */
    applyLedgerNumbers(students) {
        const sorted = [...students].sort((a, b) => {
            const grA = parseInt(a.grNo) || 0;
            const grB = parseInt(b.grNo) || 0;
            return grA - grB;
        });

        return sorted.map((s, i) => ({
            ...s,
            ledgerNo: i + 1
        }));
    }
};

export default StudentLogic;
