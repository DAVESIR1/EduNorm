// src/core/v2/MappingSystem.js
import SovereignCore from './SovereignCore.js';

export const MappingSystem = {

    // ─── Sanitize: strip undefined/null fields ────────────────────────────────
    sanitize(obj) {
        return Object.fromEntries(
            Object.entries(obj).filter(([_, v]) => v !== null && v !== undefined && v !== '')
        );
    },

    // ─── Core Mapper: rawInput → Sovereign Envelope ───────────────────────────
    async mapToSovereign(rawInput) {
        if (!rawInput) {
            console.error('[MappingSystem] mapToSovereign: rawInput is null');
            return null;
        }

        // Resolve the primary search key (priority: email > grNo > id)
        const searchKey = rawInput.email || rawInput.grNo || rawInput.id;
        if (!searchKey) {
            console.error('[MappingSystem] mapToSovereign: no valid search key (email/grNo/id) found in rawInput');
            return null;
        }

        // Generate Blind Search Index
        const sid = await SovereignCore.getSearchHash(searchKey);

        const sanitized = this.sanitize(rawInput);

        const envelope = {
            header: {
                v: "2.0.0",
                sid: sid,
                ts: Date.now(),
                integrity: await SovereignCore.generateSignature(sanitized, sid)
            },
            body: await SovereignCore.encryptAsync(JSON.stringify(sanitized))
        };

        return envelope;
    },

    // ─── Reverse: Envelope → Raw (for reads) ─────────────────────────────────
    async mapFromSovereign(envelope) {
        if (!envelope || !envelope.body) return null;
        try {
            const decrypted = await SovereignCore.decryptAsync(envelope.body);
            return JSON.parse(decrypted);
        } catch (err) {
            console.error('[MappingSystem] mapFromSovereign failed:', err.message);
            return null;
        }
    }
};

export default MappingSystem;
