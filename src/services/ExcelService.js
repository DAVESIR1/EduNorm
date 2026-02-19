import * as XLSX from 'xlsx';
import { DATA_FIELDS } from '../features/StudentManagement/types';

// Get all field definitions from DATA_FIELDS
const getAllFieldKeys = () => {
    const fields = [];
    DATA_FIELDS.forEach(step => {
        step.fields.forEach(field => {
            fields.push({
                key: field.key,
                label: field.label,
                type: field.type
            });
        });
    });
    return fields;
};

/**
 * Generate a blank Excel template with all column headers
 * @param {string} standard - Standard name for the sheet
 * @returns {Blob} Excel file blob
 */
export const generateBlankTemplate = (standard = 'Students') => {
    const fields = getAllFieldKeys();

    // Create headers array
    const headers = ['S.No.', ...fields.map(f => f.label)];

    // Create worksheet with headers only
    const ws = XLSX.utils.aoa_to_sheet([headers]);

    // Set column widths
    const colWidths = headers.map(h => ({ wch: Math.max(h.length + 2, 15) }));
    ws['!cols'] = colWidths;

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, standard || 'Students');

    // Add instructions sheet
    const instructions = [
        ['Student Data Entry Template - Instructions'],
        [''],
        ['1. Fill in the student data starting from row 2'],
        ['2. S.No. column will be auto-generated if left empty'],
        ['3. For date fields, use format: YYYY-MM-DD or DD/MM/YYYY'],
        ['4. For select fields like Ration Card Type, use: APL, BPL, AAY, or Other'],
        ['5. For KYC Status, use: Pending, Completed, or Not Applicable'],
        ['6. Save the file and upload back to the system'],
        [''],
        ['Field Types:'],
        ...fields.map(f => [`${f.label}: ${f.type}`])
    ];
    const wsInstructions = XLSX.utils.aoa_to_sheet(instructions);
    XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instructions');

    // Generate file
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    return new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
};

/**
 * Download blank template
 * @param {string} standard - Standard name
 */
export const downloadBlankTemplate = (standard) => {
    const blob = generateBlankTemplate(standard);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `student_template_${standard || 'blank'}_${new Date().toISOString().split('T')[0]}.xlsx`;
    link.click();
    URL.revokeObjectURL(url);
};

/**
 * Parse Excel file and extract student data
 * @param {File} file - Uploaded Excel file
 * @returns {Promise<Array>} Array of student objects
 */
export const parseExcelFile = async (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });

                // Get first sheet (skip Instructions if present)
                const sheetName = workbook.SheetNames.find(n => n !== 'Instructions') || workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];

                // Convert to JSON
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                if (jsonData.length < 2) {
                    throw new Error('No data found in the Excel file');
                }

                // Get headers from first row
                const headers = jsonData[0];
                const fields = getAllFieldKeys();

                // Map headers to field keys
                const headerToKey = {};
                headers.forEach((header, index) => {
                    if (header === 'S.No.') return; // Skip serial number
                    const field = fields.find(f => f.label.toLowerCase() === header?.toLowerCase?.());
                    if (field) {
                        headerToKey[index] = field.key;
                    }
                });

                // Parse data rows
                const students = [];
                for (let i = 1; i < jsonData.length; i++) {
                    const row = jsonData[i];
                    if (!row || row.length === 0) continue;

                    const student = {};
                    let hasData = false;

                    row.forEach((value, index) => {
                        const key = headerToKey[index];
                        if (key && value !== undefined && value !== null && value !== '') {
                            student[key] = String(value);
                            hasData = true;
                        }
                    });

                    if (hasData) {
                        students.push(student);
                    }
                }

                resolve(students);
            } catch (error) {
                reject(error);
            }
        };

        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsArrayBuffer(file);
    });
};

/**
 * Export students to Excel file
 * @param {Array} students - Array of student objects
 * @param {string} filename - Output filename
 */
export const exportToExcel = (students, filename = 'students_export') => {
    const fields = getAllFieldKeys();

    // Create headers
    const headers = ['S.No.', 'GR No.', ...fields.filter(f => f.key !== 'grNo').map(f => f.label)];

    // Create data rows
    const rows = students.map((student, index) => {
        const row = [index + 1, student.grNo || ''];
        fields.filter(f => f.key !== 'grNo').forEach(field => {
            let value = student[field.key] || '';
            // Skip file/document fields
            if (field.type === 'file' || field.type === 'documents') {
                value = value ? '[Uploaded]' : '';
            }
            row.push(value);
        });
        return row;
    });

    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);

    // Set column widths
    const colWidths = headers.map(h => ({ wch: Math.max(String(h).length + 2, 15) }));
    ws['!cols'] = colWidths;

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Students');

    // Download
    XLSX.writeFile(wb, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
};

/**
 * Export ledger-style data
 * @param {Array} ledger - Ledger data with numbered entries
 * @param {string} standard - Standard name
 */
export const exportLedger = (ledger, standard = 'All') => {
    const fields = getAllFieldKeys();

    // Ledger headers
    const headers = [
        'Ledger No.',
        'GR No.',
        'Student Name',
        'Standard',
        ...fields.filter(f => !['grNo', 'name', 'nameEnglish'].includes(f.key)).map(f => f.label)
    ];

    // Create data rows
    const rows = ledger.map(entry => {
        const row = [
            entry.ledgerNo || '',
            entry.grNo || '',
            entry.name || entry.nameEnglish || '',
            entry.standard || ''
        ];
        fields.filter(f => !['grNo', 'name', 'nameEnglish'].includes(f.key)).forEach(field => {
            let value = entry[field.key] || '';
            if (field.type === 'file' || field.type === 'documents') {
                value = value ? '[Uploaded]' : '';
            }
            row.push(value);
        });
        return row;
    });

    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    ws['!cols'] = headers.map(h => ({ wch: Math.max(String(h).length + 2, 12) }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'General Register');

    XLSX.writeFile(wb, `ledger_${standard}_${new Date().toISOString().split('T')[0]}.xlsx`);
};
