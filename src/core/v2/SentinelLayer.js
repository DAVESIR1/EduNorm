
/**
 * EDUNORM V2: THE SENTINEL LAYER
 * Purpose: Self-healing code integrity & function restoration.
 * THE BIOLOGICAL GUARDIAN PATTERN.
 */

const Sentinel = (() => {
    // 1. THE MASTER DNA: Immutable snapshots of core functions (stringified)
    // We prioritize SovereignCore and InfinitySync as they are the life-blood.
    const MASTER_DNA = {
        SovereignCore: `
            const V2_CONFIG = { VERSION: "2.0.0", SALT: "EDU_SOVEREIGN_2026_PROD", SYMBOLS: ['@', '_', '-', '^', '!', '*'] };
            return {
                async getSearchHash(text) {
                    if (!text) return "";
                    const saltedInput = (text.toLowerCase() + V2_CONFIG.SALT);
                    const encoder = new TextEncoder();
                    const data = encoder.encode(saltedInput);
                    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
                    const hashArray = Array.from(new Uint8Array(hashBuffer));
                    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
                },
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
                    }
                    return prefix + body;
                },
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
                        if (code >= 97 && code <= 122) { const ent = symbols[Math.floor(Math.random() * symLen)]; body += sym + dig + ent + char; }
                        else if (code >= 65 && code <= 90) { const sym2 = symbols[Math.floor(Math.random() * symLen)]; body += sym + dig + sym2 + char; }
                        else if (code >= 48 && code <= 57) { body += "n" + dig + "z" + char; }
                        else { body += "s" + dig + "!" + char; }
                        if (i > 0 && i % 5000 === 0) await yieldToMain();
                    }
                    return prefix + body;
                },
                decrypt(cipher) {
                    if (!cipher || typeof cipher !== 'string') return cipher;
                    let text = cipher.startsWith("v2@") ? cipher.substring(3) : cipher;
                    const len = text.length;
                    const symbols = V2_CONFIG.SYMBOLS;
                    let result = '';
                    let i = 0;
                    while (i < len) {
                        const char = text[i];
                        if (char === 'n' || char === 's' || symbols.includes(char)) {
                            result += text[i + 3] || '';
                            i += 4;
                        } else {
                            result += char;
                            i++;
                        }
                    }
                    return result;
                }
            };
        `,
        MappingSystem: `
            return {
                blueprint: { identity: ['email', 'uid', 'grNo'], profile: ['name'], metadata: ['sid', 'ts'] },
                async mapToSovereign(rawInput) {
                    const sid = await window.SovereignCore.getSearchHash(rawInput.email || rawInput.grNo);
                    return {
                        header: { sid, v: "2.0.0", ts: Date.now() },
                        body: window.SovereignCore.encrypt(JSON.stringify(rawInput))
                    };
                }
            };
        `
    };

    const DNA_HASHES = {};
    let worker = null;

    return {
        boot() {
            console.log("🛡️ Sentinel Active: Monitoring Core Integrity...");
            this.generateChecksums();
            this.startWatchdog();
            this.initWorker();

            // Initial synthesis if missing (delayed to avoid false positive on load)
            setTimeout(() => {
                Object.keys(MASTER_DNA).forEach(key => {
                    if (!window[key]) this.repair(key);
                });

                // Trigger Genetic Sync (Cloud Backup of Master DNA)
                this.syncGeneticMaterial();
            }, 3000);
        },

        async syncGeneticMaterial() {
            try {
                // Genetic sync is optional — InfinitySync may not have syncMasterDNA
                const { default: InfinitySync } = await import('./InfinitySync.js');
                if (typeof InfinitySync.syncMasterDNA === 'function') {
                    await InfinitySync.syncMasterDNA(MASTER_DNA);
                    console.log("🧬 Sentinel: Genetic DNA synced to cloud mesh.");
                }
            } catch (e) {
                // Silent — genetic sync is non-critical
            }
        },

        getMutationPacket() {
            return JSON.stringify(MASTER_DNA);
        },

        /**
         * GENETIC VERSIONING: THE MUTATION PACKET
         * Updates the Master DNA without a page refresh.
         */
        mutate(packet) {
            console.log("🧬 Sentinel: Mutation Packet Received. Verifying...");
            try {
                const newDNA = JSON.parse(packet);
                // Simple validation: Ensure all core keys are present
                const required = ['SovereignCore', 'MappingSystem'];
                const hasAll = required.every(key => newDNA[key] && typeof newDNA[key] === 'string');

                if (hasAll) {
                    this.applyMutation(newDNA);
                    return true;
                } else {
                    console.error("❌ Mutation Refused: Incomplete DNA Packet.");
                    return false;
                }
            } catch (e) {
                console.error("❌ Mutation Refused: Invalid Packet Format.", e);
                return false;
            }
        },

        applyMutation(newDNA) {
            console.warn("🛡️ Sentinel: Re-coding Master DNA... (Mutation Applied)");
            Object.assign(MASTER_DNA, newDNA);
            this.generateChecksums();

            // Re-synthesize immediately to apply the new code
            Object.keys(MASTER_DNA).forEach(key => this.repair(key));

            // Re-sync to cloud to propagate the mutation
            this.syncGeneticMaterial();
        },

        generateChecksums() {
            Object.keys(MASTER_DNA).forEach(key => {
                DNA_HASHES[key] = btoa(MASTER_DNA[key]).substring(0, 32);
            });
        },

        initWorker() {
            try {
                // Use absolute path for worker in production or fix relative for Vite
                worker = new Worker(new URL('./SentinelWorker.js', import.meta.url));
                worker.postMessage({ type: 'BOOT' });

                // Heartbeat every 15 seconds (matches worker check interval)
                setInterval(() => {
                    if (worker) worker.postMessage({ type: 'HEARTBEAT' });
                }, 15000);

                worker.onmessage = (e) => {
                    if (e.data.type === 'CRITICAL_FAILURE') {
                        // Silenced — worker already logs a warning.
                        // Could add recovery logic here in the future.
                    }
                };
            } catch (e) {
                console.warn("Sentinel Worker could not be initialized:", e.message);
            }
        },

        /**
         * THE REPAIR MECHANISM (The "White Blood Cells")
         */
        repair(key) {
            // Only log at debug level — this is expected for ES module globals
            console.debug(`[Sentinel] Re-synthesizing ${key} (not on window — expected for ES modules)`);
            try {
                window[key] = new Function(MASTER_DNA[key])();
                console.log(`✅ ${key} has been successfully re-synthesized.`);
            } catch (e) {
                console.error(`❌ Synthesis Failure for ${key}:`, e);
            }
        },

        /**
         * THE WATCHDOG
         */
        startWatchdog() {
            setInterval(() => {
                Object.keys(MASTER_DNA).forEach(key => {
                    // Only repair if completely absent — never overwrite a real module
                    if (!window[key]) {
                        this.repair(key);
                    }
                });
            }, 10000); // 10s is sufficient for integrity checks
        }
    };
})();

// Initialize Guardian
if (typeof window !== 'undefined') {
    Sentinel.boot();
}

export default Sentinel;
