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
        return await InfinitySync.universalPull(sid);
    },

    /**
     * Blind Summation
     * Privacy-preserving categorical statistics.
     */
    async blindStat(records, category) {
        return await InfinitySync.getSovereignStats(records, category);
    },

    /**
     * Force Synchronization
     * Manually triggers a full tri-layer sync.
     * Uses static named imports to avoid the dynamic-import default-export crash.
     */
    async forceSync() {
        // Use named exports directly — database.js has no default export
        const { exportAllData, importAllData } = await import('../../services/database');
        const data = await exportAllData();

        if (!data) throw new Error('exportAllData returned nothing — IndexedDB may be empty.');

        const yieldToMain = () => new Promise(resolve => setTimeout(resolve, 0));

        console.log(`🚀 SovereignBridge: Starting Force Sync (${data.students?.length || 0} students)...`);

        let syncCount = 0;
        let failCount = 0;

        if (data.settings) {
            try {
                await this.save('settings', { settings: data.settings });
                syncCount++;
            } catch (e) {
                console.warn('Settings sync warning:', e.message);
                failCount++;
            }
            await yieldToMain();
        }

        if (data.students && data.students.length > 0) {
            for (let i = 0; i < data.students.length; i += 10) {
                const chunk = data.students.slice(i, i + 10);
                const results = await Promise.allSettled(chunk.map(s => this.save('student', s)));
                syncCount += results.filter(r => r.status === 'fulfilled').length;
                failCount += results.filter(r => r.status === 'rejected').length;
                await yieldToMain();
                if (i % 50 === 0 && i > 0) console.log(`Syncing: ${i}/${data.students.length}...`);
            }
        }

        console.log(`✅ SovereignBridge: Force Sync Complete. ${syncCount} synced, ${failCount} failed.`);
        return { synced: syncCount, failed: failCount };
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
