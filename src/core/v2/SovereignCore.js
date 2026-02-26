// src/core/v2/SovereignCore.js

export const SovereignCore = {

    SALT: "EDU_SOVEREIGN_2026_PROD",

    SYMBOL_MAP: ['@', '#', '$', '%', '^', '&', '*', '!', '~', '?'],

    // ─── Generate Searchable SHA-256 Hash (sid) ───────────────────────────────
    async getSearchHash(text) {
        if (!text) throw new Error('[SovereignCore] getSearchHash: input is null/undefined');
        const saltedInput = text.toString().toLowerCase() + this.SALT;
        const encoded = new TextEncoder().encode(saltedInput);
        const hashBuffer = await crypto.subtle.digest('SHA-256', encoded);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    },

    // ─── Sync Encrypt: 1 char → 4 symbol group ───────────────────────────────
    // Example: 'a' (97) → '@3^a' style encoding
    encrypt(text) {
        if (typeof text !== 'string') text = JSON.stringify(text);
        return text.split('').map(char => {
            const code = char.charCodeAt(0);
            const sym1 = this.SYMBOL_MAP[code % 10];
            const sym2 = this.SYMBOL_MAP[(code * 3) % 10];
            const num = (code * 7) % 100;
            return `${sym1}${num}${sym2}${char}`;
        }).join('|');
    },

    // ─── Decrypt: reverse of encrypt ─────────────────────────────────────────
    decrypt(encryptedText) {
        if (!encryptedText) return null;
        return encryptedText.split('|').map(group => {
            // Format: sym + num + sym + originalChar
            // originalChar is always the last character of the group
            return group[group.length - 1];
        }).join('');
    },

    // ─── Async wrapper (for future migration to real AES) ────────────────────
    async encryptAsync(text) {
        return Promise.resolve(this.encrypt(text));
    },

    async decryptAsync(encryptedText) {
        return Promise.resolve(this.decrypt(encryptedText));
    },

    // ─── Integrity Signature: hash of body + sid ─────────────────────────────
    async generateSignature(rawData, sid) {
        const payload = JSON.stringify(rawData) + sid + this.SALT;
        return await this.getSearchHash(payload);
    },

    // ─── BLIND TAG GENERATOR ──────────────────────────────────────────────────
    async getBlindTag(category, value) {
        if (!value) return "null";
        return await this.getSearchHash(`${category.toUpperCase()}:${value.toString().toLowerCase()}`);
    }
};

if (typeof window !== 'undefined') {
    window.SovereignCore = SovereignCore;
}

export default SovereignCore;
