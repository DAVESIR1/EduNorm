
import * as db from '../../services/database';
import { SovereignBridge } from '../../core/v2/Bridge';
import { exportToExcel, exportLedger, parseExcelFile, downloadBlankTemplate } from '../../services/ExcelService';

/**
 * SOVEREIGN SYNC & BACKUP: LOGIC
 */
export const SyncBackupLogic = {
    /**
     * Restore from Sovereign Infinity Mesh
     */
    async restoreFromCloud(sid) {
        const studentData = await SovereignBridge.restore(sid);
        if (studentData) {
            await db.saveStudent(studentData);
            return studentData;
        }
        return null;
    },

    /**
     * Triggers a manual sync of all local data to the Sovereign Cloud
     */
    async syncAll() {
        const data = await db.exportAllData();
        // Encrypt & Upload Students
        const students = data.students || [];
        const results = await Promise.all(students.map(s => SovereignBridge.save('student', s)));

        return {
            total: students.length,
            success: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success).length
        };
    },

    /**
     * Native Export to JSON
     */
    async exportJSON() {
        const data = await db.exportAllData();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `edunorm_sovereign_${Date.now()}.json`;
        link.click();
        URL.revokeObjectURL(url);
    },

    /**
     * Excel Export for General Register
     */
    exportExcel(ledger, type = 'full') {
        if (type === 'ledger') {
            exportLedger(ledger, 'Sovereign_Register');
        } else {
            exportToExcel(ledger, 'Sovereign_Students');
        }
    },

    /**
     * Parses and validates Excel for Import
     */
    async processExcelImport(file) {
        return await parseExcelFile(file);
    },

    /**
     * Restores entire DB from JSON
     */
    async restoreFromJSON(file) {
        const text = await file.text();
        const data = JSON.parse(text);
        if (!data.students && !data.standards && !data.settings) throw new Error("Invalid Sovereign Data Format");
        await db.importAllData(data);
    },

    downloadTemplate() {
        downloadBlankTemplate('Sovereign_Template');
    }
};

export default SyncBackupLogic;
