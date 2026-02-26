
import { generateSecureCode, listGeneratedCodes, revokeCode } from '../../services/ProCodeService';

/**
 * SOVEREIGN ADMIN DASHBOARD: LOGIC
 */
export const AdminLogic = {
    /**
     * Generates a new pro code
     */
    async createProCode(duration, creatorEmail) {
        return await generateSecureCode(duration, creatorEmail);
    },

    /**
     * Lists all generated codes
     */
    async getCodes() {
        return await listGeneratedCodes();
    },

    /**
     * Revokes a specific code
     */
    async cancelCode(codeId) {
        return await revokeCode(codeId);
    },

    /**
     * Calculates Admin Stats
     */
    getStats(totalStudents, totalStandards, premiumCount = 0) {
        return [
            { label: 'Total Students', value: totalStudents, color: '#7c3aed' },
            { label: 'Standards', value: totalStandards, color: '#db2777' },
            { label: 'Premium Users', value: premiumCount, color: '#f59e0b' },
            { label: 'System Health', value: '100%', color: '#10b981' }
        ];
    }
};

export default AdminLogic;
