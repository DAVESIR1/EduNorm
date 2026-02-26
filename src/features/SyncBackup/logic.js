
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
     * SMART RESTORE from JSON backup.
     * importAllData already handles: skip BINARY_STRIPPED, only fill empty fields,
     * never overwrite non-empty local data. This just parses + delegates + syncs cloud.
     */
    async restoreFromJSON(file, user) {
        const text = await file.text();
        const jsonData = JSON.parse(text);
        if (!jsonData.students && !jsonData.standards && !jsonData.settings) throw new Error("Invalid Data Format");

        console.log('🔄 Smart Restore: importing...',
            `${jsonData.students?.length || 0} students,`,
            `${jsonData.settings?.length || 0} settings`);

        // importAllData handles smart merge: only fills empty fields, never overwrites
        await db.importAllData(jsonData);

        // Sync to cloud so cloud+local are identical
        if (user?.uid) {
            try {
                const { syncToCloud } = await import('../../services/DirectBackupService.js');
                await syncToCloud(user.uid);
                console.log('✅ Smart Restore: Cloud synced — cloud+local identical');
            } catch (e) {
                console.warn('⚠️ Smart Restore: Cloud sync failed (data safe locally):', e.message);
            }
        }
    },

    downloadTemplate() {
        downloadBlankTemplate('Sovereign_Template');
    }
};

export default SyncBackupLogic;
