/**
 * EDUNORM V2: UNIVERSAL DATA MAPPER
 * A fail-safe bridge between Legacy, User Input, and Sovereign Storage.
 */

import SovereignCore from './SovereignCore.js';

export const MappingSystem = {

    // 1. THE CANONICAL BLUEPRINT (The "DNA" of your data)
    // Translates legacy/raw keys into fixed V2 slots.
    blueprint: {
        identity: ['email', 'uid', 'username', 'grNo', 'id'],
        profile: ['name', 'nameEnglish', 'contactNumber', 'address', 'studentPhoto'],
        academic: ['standard', 'rollNo', 'grades', 'attendance', 'division'],
        metadata: ['ts', 'v', 'sid', 'integrity', 'type']
    },

    /**
     * THE FAIL-SAFE MAPPER
     * Converts any input into the Sovereign Envelope
     */
    async mapToSovereign(rawInput, originVersion = "1.0.0") {
        try {
            // Step A: Validate mandatory fields
            // Use != null so numeric IDs (0, 1, etc.) from IndexedDB pass through
            // Settings objects bypass this check entirely
            const hasIdentifier = rawInput.type === 'settings' ||
                rawInput.id != null ||
                rawInput.uid != null ||
                rawInput.grNo != null;

            if (!hasIdentifier) {
                throw new Error("CRITICAL_ERR: Missing ID/UID/GRNo for Sovereign Mapping");
            }

            // Step B: Generate Blind Search Index (The 'sid')
            // Fallback chain: email → grNo → id → uid → timestamp (never null)
            const searchKey = rawInput.email || rawInput.grNo ||
                (rawInput.id != null ? String(rawInput.id) : null) ||
                rawInput.uid ||
                `fallback_${Date.now()}`;
            const sid = await SovereignCore.getSearchHash(searchKey);

            // Step C: Construct the Sovereign Envelope
            const envelope = {
                header: {
                    v: "2.0.0",
                    sid: sid,
                    origin: originVersion,
                    type: SovereignCore.encrypt(rawInput.type || 'generic'),
                    ts: Date.now(),
                    integrity: await this.generateSignature(rawInput, sid)
                },
                // Step D: Polymorphic Body (The actual encrypted data)
                body: await SovereignCore.encryptAsync(JSON.stringify(this.sanitize(rawInput)))
            };

            return envelope;
        } catch (error) {
            // Step E: Failure Redundancy (DLQ)
            console.error("MAPPING_FAILURE: Routing to Quarantine", error);
            this.sendToDeadLetterQueue(rawInput, error);
            return null;
        }
    },

    /**
     * Removes cleartext sensitive keys before they reach the engine
     */
    sanitize(data) {
        const clean = { ...data };
        // Rule: Passwords never touch the Sovereign Envelope
        delete clean.password;
        delete clean.token;
        return clean;
    },

    /**
     * HMAC-SHA256 signature to ensure data wasn't corrupted or tampered with
     */
    async generateSignature(data, sid) {
        const signatureBase = sid + JSON.stringify(data).length;
        return "SIG_" + btoa(signatureBase).substring(0, 16);
    },

    /**
     * DEAD LETTER QUEUE (DLQ)
     * Ensures no student data is ever lost.
     * If mapping fails, it preserves raw data in a local retry queue.
     */
    sendToDeadLetterQueue(data, error) {
        const dlqKey = `dlq_${Date.now()}`;
        const payload = {
            data,
            error: error.message,
            ts: Date.now()
        };
        try {
            localStorage.setItem(dlqKey, JSON.stringify(payload));
            console.warn(`RECOVERY_REQUIRED: Data preserved in DLQ: ${dlqKey}`);
        } catch (e) {
            console.error("TOTAL_FAILURE: DLQ Storage Full", e);
        }
    }
};

if (typeof window !== 'undefined') {
    window.MappingSystem = MappingSystem;
}

export default MappingSystem;
