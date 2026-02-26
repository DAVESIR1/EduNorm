import SovereignCore from './SovereignCore.js';
import InfinitySync from './InfinitySync.js';
import LegacyBridge from './MigrationEngine.js';
import MappingSystem from './MappingSystem.js';
import SyncEventBus from '../../services/SyncEventBus.js';

/**
 * SOVEREIGN BRIDGE: THE SELF-HEALING ROUTER
 * Final interface for all EduNorm UI components.
 * PHILOSOPHY: 0-Knowledge, Circuit Breaker, Fail-Safe.
 */

export const SovereignBridge = {
    status: 'READY',
    isReadOnly: false,

    /**
     * Universal Save Protocol
     * BROADCAST: Tri-Layer Mesh.
     */
    async save(type, data) {
        if (this.isReadOnly) throw new Error("SYSTEM_LOCKED: Read-only mode active (Circuit Breaker).");
        SyncEventBus.emit(SyncEventBus.EVENTS.SYNC_START, { type });
        try {
            const result = await InfinitySync.universalSync(type, data);
            if (result) {
                SyncEventBus.emit(SyncEventBus.EVENTS.SYNC_SUCCESS, { type });
            } else {
                SyncEventBus.emit(SyncEventBus.EVENTS.SYNC_FAIL, { type });
            }
            return result;
        } catch (err) {
            SyncEventBus.emit(SyncEventBus.EVENTS.SYNC_FAIL, { type, error: err.message });
            throw err;
        }
    },

    /**
     * Search Wrapper
     * Converts a cleartext search query into a Sovereign Blind Index (sid).
     */
    async getSearchKey(text) {
        return await SovereignCore.getSearchHash(text);
    },

    /**
     * Identity Shield
     * Encrypts a single field with the Sovereign prefix (v2@).
     */
    shield(text) {
        return SovereignCore.encrypt(text);
    },

    /**
     * Identity Reveal
     * Decrypts shielded data for UI display.
     */
    reveal(cipherText) {
        return SovereignCore.decrypt(cipherText);
    },

    /**
     * Start Background Migration
     * Migrates cluster of legacy data to Sovereign Tri-Layer.
     */
    async migrate(oldData, type) {
        try {
            return await LegacyBridge.migrateOldData(oldData, type);
        } catch (e) {
            this.isReadOnly = true;
            console.error("CIRCUIT_BREAKER: Migration integrity failure.", e);
            throw e;
        }
    },

    /**
     * Restoration Protocol
     * Pulls data from the strongest mesh layer (Gold Master prioritizing).
     */
    async restore(sid) {
        return await InfinitySync.universalRead(sid);
    },

    /**
     * Blind Summation
     * Privacy-preserving categorical statistics.
     */
    async blindStat(records, category) {
        console.warn('[SovereignBridge] blindStat not yet implemented');
        return { total: records?.length || 0 };
    },

    /**
     * Force Synchronization
     * Manually triggers a full tri-layer sync.
     */
    async forceSync() {
        const { exportAllData } = await import('../../services/database');
        const data = await exportAllData();

        if (!data) throw new Error('exportAllData returned nothing — IndexedDB may be empty.');

        const yieldToMain = () => new Promise(resolve => setTimeout(resolve, 0));
        let syncCount = 0;
        let failCount = 0;

        const safeSave = async (type, payload) => {
            try { await this.save(type, payload); syncCount++; }
            catch (e) { console.warn(`Sync failed [${type}]:`, e.message); failCount++; }
        };

        console.log(`🚀 SovereignBridge.forceSync: ${data.students?.length || 0} students, ${data.standards?.length || 0} standards, ${data.settings?.length || 0} settings`);

        // 1. Settings (single envelope)
        if (data.settings?.length > 0) {
            await safeSave('settings', { type: 'settings', id: 'school_settings', settings: data.settings });
            await yieldToMain();
        }

        // 2. Standards (single envelope)
        if (data.standards?.length > 0) {
            await safeSave('standards', { type: 'standards', id: 'school_standards', standards: data.standards });
            await yieldToMain();
        }

        // 3. Custom Fields (single envelope)
        if (data.customFields?.length > 0) {
            await safeSave('customFields', { type: 'customFields', id: 'school_customFields', customFields: data.customFields });
            await yieldToMain();
        }

        // 4. Students (batched, 10 at a time)
        if (data.students?.length > 0) {
            for (let i = 0; i < data.students.length; i += 10) {
                const chunk = data.students.slice(i, i + 10);
                const results = await Promise.allSettled(
                    chunk.map(s => this.save('student', { ...s, type: 'student' }))
                );
                syncCount += results.filter(r => r.status === 'fulfilled').length;
                failCount += results.filter(r => r.status === 'rejected').length;
                await yieldToMain();
            }
        }

        console.log(`✅ SovereignBridge.forceSync done. synced=${syncCount}, failed=${failCount}`);
        return { synced: syncCount, failed: failCount };
    },

    /**
     * Restore from Cloud
     * Pulls ALL encrypted records from Firestore, decrypts them,
     * and imports into local IndexedDB.
     */
    async restoreFromCloud() {
        console.log('🔄 SovereignBridge.restoreFromCloud: Starting...');

        const records = await InfinitySync.pullAllFromFirestore('sovereign_data');

        if (!records || records.length === 0) {
            console.log('📥 No cloud records found.');
            return { restored: 0, skipped: 0 };
        }

        const students = [];
        const settings = [];
        const standards = [];
        const customFields = [];
        let skipped = 0;

        for (const record of records) {
            if (!record || typeof record !== 'object') { skipped++; continue; }

            const t = record.type;

            if (t === 'settings' && Array.isArray(record.settings)) {
                settings.push(...record.settings);
            } else if (t === 'standards' && Array.isArray(record.standards)) {
                standards.push(...record.standards);
            } else if (t === 'customFields' && Array.isArray(record.customFields)) {
                customFields.push(...record.customFields);
            } else if (t === 'student') {
                // Normalise grNo — some records store it as gr_no
                const { type, ...studentData } = record;
                if (!studentData.grNo && studentData.gr_no) studentData.grNo = studentData.gr_no;
                students.push(studentData);
            } else {
                // Unknown — try to detect by shape
                if (record.settings) settings.push(...(Array.isArray(record.settings) ? record.settings : [record]));
                else if (record.standards) standards.push(...(Array.isArray(record.standards) ? record.standards : [record]));
                else if (record.grNo || record.gr_no || record.name) {
                    const { type, ...sd } = record;
                    if (!sd.grNo && sd.gr_no) sd.grNo = sd.gr_no;
                    students.push(sd);
                } else { skipped++; }
            }
        }

        console.log(`📥 Parsed: ${students.length} students, ${settings.length} settings, ${standards.length} standards, ${customFields.length} customFields, ${skipped} skipped`);

        const { importAllData } = await import('../../services/database');
        await importAllData({
            students: students.length > 0 ? students : undefined,
            settings: settings.length > 0 ? settings : undefined,
            standards: standards.length > 0 ? standards : undefined,
            customFields: customFields.length > 0 ? customFields : undefined,
        });

        const total = students.length + settings.length + standards.length + customFields.length;
        console.log(`✅ SovereignBridge.restoreFromCloud: ${total} records imported.`);
        return { restored: total, skipped };
    },


    /**
     * Mapping Blueprint
     * Accessible to UI for validation or field-level mapping.
     */
    getBlueprint() {
        return MappingSystem.blueprint;
    }
};

export default SovereignBridge;
