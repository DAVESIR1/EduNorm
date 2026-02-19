/**
 * EDUNORM V2: SOVEREIGN CORE v2.0.2
 * CONSOLIDATED CRYPTOGRAPHIC HEART
 * DEPRECATES: EnigmaEngine.js, Hasher.js
 */

export const V2_CONFIG = {
    VERSION: "2.0.0",
    SALT: "EDU_SOVEREIGN_2026_PROD", // Static salt for deterministic hashing
    SYMBOLS: ['@', '_', '-', '^', '!', '*'] // File-system safe symbols
};

export const SovereignCore = {
    /** 
     * THE RULE OF THE BLIND INDEX
     * Generate Searchable Hash (sid) using SHA-256 and Static Salt.
     */
    async getSearchHash(text) {
        if (!text) return "";
        const saltedInput = (text.toLowerCase() + V2_CONFIG.SALT);

        // Use WebCrypto API (Available in Node 18+ and Browsers)
        const cryptoApi = (typeof crypto !== 'undefined' && crypto.subtle)
            ? crypto
            : (typeof globalThis.crypto !== 'undefined' && globalThis.crypto.subtle)
                ? globalThis.crypto
                : null;

        if (cryptoApi && cryptoApi.subtle) {
            const encoder = new TextEncoder();
            const data = encoder.encode(saltedInput);
            const hashBuffer = await cryptoApi.subtle.digest('SHA-256', data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        }

        // Emergency Fallback (djb2 for environments without WebCrypto, e.g. some CI/CD)
        let hash = 5381;
        for (let i = 0; i < saltedInput.length; i++) {
            hash = ((hash << 5) + hash) + saltedInput.charCodeAt(i);
        }
        return (hash >>> 0).toString(16);
    },

    /** 
     * THE RULE OF POLYMORPHIC ENCRYPTION
     * Transforms 1 character into 3-4 random symbols.
     * The same student name looks different every time it is saved.
     */
    /** 
     * THE RULE OF POLYMORPHIC ENCRYPTION (OPTIMIZED)
     * Transforms 1 character into 4 characters.
     */
    encrypt(text) {
        if (!text) return "";
        const prefix = "v2@";
        const len = text.length;
        const symbols = V2_CONFIG.SYMBOLS;
        const symLen = symbols.length;

        let body = "";
        for (let i = 0; i < len; i++) {
            const char = text[i];
            const code = char.charCodeAt(0);

            // Fast random generation
            const sym = symbols[Math.floor(Math.random() * symLen)];
            const dig = Math.floor(Math.random() * 10);

            if (code >= 97 && code <= 122) { // a-z
                const ent = symbols[Math.floor(Math.random() * symLen)];
                body += sym + dig + ent + char;
            } else if (code >= 65 && code <= 90) { // A-Z
                const sym2 = symbols[Math.floor(Math.random() * symLen)];
                body += sym + dig + sym2 + char;
            } else if (code >= 48 && code <= 57) { // 0-9
                body += "n" + dig + "z" + char;
            } else {
                body += "s" + dig + "!" + char;
            }
        }
        return prefix + body;
    },

    /**
     * ASYNC POLYMORPHIC ENCRYPTION
     * Yields to main thread every 5000 characters to prevent UI hang.
     */
    async encryptAsync(text) {
        if (!text || text.length < 5000) return this.encrypt(text);

        const prefix = "v2@";
        const len = text.length;
        const symbols = V2_CONFIG.SYMBOLS;
        const symLen = symbols.length;
        const yieldToMain = () => new Promise(resolve => setTimeout(resolve, 0));

        let body = "";
        for (let i = 0; i < len; i++) {
            const char = text[i];
            const code = char.charCodeAt(0);
            const sym = symbols[Math.floor(Math.random() * symLen)];
            const dig = Math.floor(Math.random() * 10);

            if (code >= 97 && code <= 122) {
                const ent = symbols[Math.floor(Math.random() * symLen)];
                body += sym + dig + ent + char;
            } else if (code >= 65 && code <= 90) {
                const sym2 = symbols[Math.floor(Math.random() * symLen)];
                body += sym + dig + sym2 + char;
            } else if (code >= 48 && code <= 57) {
                body += "n" + dig + "z" + char;
            } else {
                body += "s" + dig + "!" + char;
            }

            if (i > 0 && i % 5000 === 0) {
                await yieldToMain();
            }
        }
        return prefix + body;
    },

    /**
     * ROBUST DECRYPTOR (OPTIMIZED)
     */
    decrypt(cipher) {
        if (!cipher || typeof cipher !== 'string') return cipher;
        let text = cipher.startsWith("v2@") ? cipher.substring(3) : cipher;
        const len = text.length;
        const symbols = V2_CONFIG.SYMBOLS;

        let result = '';
        let i = 0;
        while (i < len) {
            const char = text[i];
            // Polymorphic groups are always 4 chars in EduNorm V2
            // Group format: [Marker/Sym][Digit][Marker/Sym][ActualChar]
            if (char === 'n' || char === 's' || symbols.includes(char)) {
                result += text[i + 3] || '';
                i += 4;
            } else {
                result += char;
                i++;
            }
        }
        return result;
    },

    /**
     * BLIND TAG GENERATOR
     * Deterministic hashing for categories (e.g. Standard, Gender).
     * Used for "Blind Summation" statistics.
     */
    async getBlindTag(category, value) {
        if (!value) return "null";
        // Prefix with category to avoid collisions across fields
        return await this.getSearchHash(`${category.toUpperCase()}:${value.toString().toLowerCase()}`);
    }
};

if (typeof window !== 'undefined') {
    window.SovereignCore = SovereignCore;
}

export default SovereignCore;
