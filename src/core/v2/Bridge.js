import SovereignCore from './SovereignCore.js';
import MappingSystem from './MappingSystem.js';

/**
 * SOVEREIGN BRIDGE (Simplified)
 * Provides encryption/decryption utilities.
 * Sync is now handled by HybridSyncService.
 */

export const SovereignBridge = {
    status: 'READY',

    /**
     * Save — no-op now, sync handled by HybridSyncService
     */
    async save(type, data) {
        return true;
    },

    async getSearchKey(text) {
        return await SovereignCore.getSearchHash(text);
    },

    shield(text) {
        return SovereignCore.encrypt(text);
    },

    reveal(cipherText) {
        return SovereignCore.decrypt(cipherText);
    },

    getBlueprint() {
        return MappingSystem.blueprint;
    }
};

export default SovereignBridge;
