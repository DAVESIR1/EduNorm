/**
 * EDUNORM V2: SOVEREIGN LEGACY BRIDGE
 * DEPRECATES: MigrationService.js
 * PHILOSOPHY: Scans legacy data, migrates to Sovereign format, then retires old code.
 */

import { SovereignBridge } from './Bridge.js';

export const LegacyBridge = {
    /**
     * Call this when the app starts or a migration is triggered.
     * It scans for old data, migrates it, then deletes the old version.
     */
    async migrateOldData(oldDataArray, type) {
        console.warn(`🚀 Starting V2 Migration for ${type}. Converting Legacy to Sovereign...`);

        const results = {
            total: oldDataArray.length,
            success: 0,
            failed: 0
        };

        for (const oldItem of oldDataArray) {
            try {
                // Determine if item is already Sovereign v2
                if (oldItem.header && oldItem.header.v === "2.0.0") {
                    console.log(`Skipping already migrated item: ${oldItem.header.sid}`);
                    results.success++;
                    continue;
                }

                const success = await SovereignBridge.save(type, oldItem);

                if (success) {
                    results.success++;
                    // Logic: Mark local copy as migrated or delete if safe
                    console.log(`Migration complete for: ${oldItem.id || oldItem.grNo || 'record'}`);
                } else {
                    results.failed++;
                }
            } catch (err) {
                console.error(`Migration error for item:`, err);
                results.failed++;
            }
        }

        console.log(`📊 Migration Summary [${type}]:`, results);
        return results;
    }
};

export default LegacyBridge;
