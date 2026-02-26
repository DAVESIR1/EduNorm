import * as db from './database';

/**
 * RESTORATION SERVICE
 * Coordinats the multi-source data recovery operation.
 */
const RestorationService = {
    /**
     * Perform Full Zero-Loss Restoration
     */
    async performFullRestoration() {
        console.log('RestorationService: Starting Zero-Loss recovery...');
        const results = {
            mainBackup: null,
            recoveredStudents: null,
            summary: {}
        };

        if (this.isRestoring) {
            console.warn('RestorationService: Restoration already in progress.');
            return;
        }
        this.isRestoring = true;

        try {
            console.log('RestorationService: Loading public/backup_restore.json...');
            const mainBackupResponse = await fetch('/backup_restore.json');
            if (mainBackupResponse.ok) {
                const mainData = await mainBackupResponse.json();
                console.log(`RestorationService: Main Backup loaded (${mainData.students?.length} students). Syncing to DB...`);
                results.mainBackup = await db.importAllData(mainData);
            } else {
                console.warn('RestorationService: backup_restore.json NOT FOUND in public directory.');
                alert("⚠ Error: backup_restore.json not found in public folder. Restoration cannot proceed.");
                return results;
            }

            console.log('RestorationService: Loading public/recovered_students_12.json...');
            const recoveredResponse = await fetch('/recovered_students_12.json');
            if (recoveredResponse.ok) {
                const recoveredData = await recoveredResponse.json();
                const formattedRecovered = Array.isArray(recoveredData) ? { students: recoveredData } : recoveredData;
                await db.importAllData(formattedRecovered);
                console.log('RestorationService: Recovered students merged.');
            }

            const allStudents = await db.getAllStudents() || [];
            // getSetting already returns the unwrapped value (not {value: ...})
            const schoolProfile = await db.getSetting('school_profile') || {};

            results.summary = {
                totalStudents: allStudents.length,
                hasUdise: !!schoolProfile.udiseNumber,
                udise: schoolProfile.udiseNumber,
                timestamp: new Date().toISOString()
            };

            await yieldToMain();
            console.log('RestorationService: COMPLETED SUCCESSFULLY.', results.summary);
            return results;

        } catch (error) {
            console.error('RestorationService: FATAL ERROR:', error);
            alert("❌ Restoration Fatal Error: " + error.message);
            throw error;
        } finally {
            this.isRestoring = false;
        }
    }
};

const yieldToMain = () => new Promise(resolve => setTimeout(resolve, 0));

export default RestorationService;
