import { doc, setDoc } from 'firebase/firestore';
import { db } from '../../config/firebase.js';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { Storage } from 'megajs';
import MappingSystem from './MappingSystem.js';

// Env Helper (browser-safe — no process.env references)
const getEnv = (key) => {
    try { return import.meta.env?.[key] || undefined; }
    catch (e) { return undefined; }
};

export const SovereignSync = {
    // Shared clients (cached)
    _clients: { firestore: null, r2: null, mega: null },

    async getFirestore() {
        return db;
    },

    async getR2Client() {
        if (this._clients.r2) return this._clients.r2;
        const config = {
            accountId: getEnv('VITE_R2_ACCOUNT_ID'),
            accessKeyId: getEnv('VITE_R2_ACCESS_KEY_ID'),
            secretAccessKey: getEnv('VITE_R2_SECRET_ACCESS_KEY'),
            bucket: getEnv('VITE_R2_BUCKET_NAME') || 'edunorm-backups'
        };
        if (!config.accountId || !config.accessKeyId) return null;

        this._clients.r2 = {
            client: new S3Client({
                region: 'auto',
                endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
                credentials: {
                    accessKeyId: config.accessKeyId,
                    secretAccessKey: config.secretAccessKey
                }
            }),
            bucket: config.bucket
        };
        return this._clients.r2;
    },

    async getMegaStorage() {
        if (this._clients.mega && this._clients.mega.ready) return this._clients.mega;
        const creds = {
            email: getEnv('VITE_MEGA_EMAIL'),
            password: getEnv('VITE_MEGA_PASS')
        };
        if (!creds.email || !creds.password) return null;

        return new Promise((resolve) => {
            try {
                const s = new Storage(creds);
                s.on('ready', () => { this._clients.mega = s; resolve(s); });
                s.on('error', (e) => { console.error("Mega Init Error", e); resolve(null); });
            } catch (e) { resolve(null); }
        });
    },

    /** 
     * The "Never-Fail" Save 
     * Simultaneously pushes to Firestore (Hot), R2 (Solid), and Mega (Deep)
     */
    async universalSave(type, rawData) {
        const envelope = await MappingSystem.mapToSovereign(rawData);

        if (!envelope) return false;

        try {
            // Simultaneous Trigger
            const [layer1, layer2, layer3] = await Promise.all([
                this.pushToFirestore(envelope),
                this.pushToR2(envelope),
                this.pushToMega(envelope)
            ]);

            const successCount = [layer1, layer2, layer3].filter(Boolean).length;

            if (successCount < 2) {
                throw new Error(`CRITICAL: Atomicity Failed ($ {successCount}/3).`);
            }

            console.log(`✅ [Sovereign v2] ${type} secured across ${successCount} layers.`);
            return true;
        } catch (err) {
            console.error("❌ Universal Sync Failure. Preserving locally.", err);
            this.preserveLocally(envelope);
            return false;
        }
    },

    async pushToFirestore(env) {
        try {
            const db = await this.getFirestore();
            await setDoc(doc(db, 'sovereign_data', env.header.sid), env);
            return true;
        } catch (e) {
            console.warn("L1 (Firestore) Sync Failed", e.message);
            return false;
        }
    },

    async pushToR2(env) {
        try {
            const r2 = await this.getR2Client();
            if (!r2) return false;

            const command = new PutObjectCommand({
                Bucket: r2.bucket,
                Key: `v2/${env.header.sid}.enorm`,
                Body: JSON.stringify(env),
                ContentType: 'application/enorm'
            });

            await r2.client.send(command);
            return true;
        } catch (e) {
            console.warn("L2 (R2) Sync Failed", e.message);
            return false;
        }
    },

    async pushToMega(env) {
        try {
            const mega = await this.getMegaStorage();
            if (!mega) return false;

            // Simple folder structure: EduNorm_V2/{sid}.enorm
            let v2Folder = mega.root.children?.find(f => f.name === 'EduNorm_V2');
            if (!v2Folder) v2Folder = await mega.root.mkdir('EduNorm_V2');

            const encoded = new TextEncoder().encode(JSON.stringify(env));
            await v2Folder.upload(`${env.header.sid}.enorm`, encoded).complete;
            return true;
        } catch (e) {
            console.warn("L3 (Mega) Sync Failed", e.message);
            return false;
        }
    },

    preserveLocally(envelope) {
        try {
            const key = `v2_retry_${envelope.header.sid}`;
            localStorage.setItem(key, JSON.stringify(envelope));
            console.warn(`[QUEUED] Sync deferred to background: ${key}`);
        } catch (e) { }
    },

    /**
     * SELF-HEALING: Background Queue Processor
     * Scans local storage for failed syncs and retries them.
     */
    async processQueue() {
        if (typeof localStorage === 'undefined') return;

        const keys = Object.keys(localStorage).filter(k => k.startsWith('v2_retry_'));
        if (keys.length === 0) return;

        console.log(`[SOVEREIGN_RECOVERY] Found ${keys.length} items in sync queue.`);

        for (const key of keys) {
            try {
                const envelope = JSON.parse(localStorage.getItem(key));
                // Attempt direct layers without re-mapping (it's already an envelope)
                const [l1, l2, l3] = await Promise.all([
                    this.pushToFirestore(envelope),
                    this.pushToR2(envelope),
                    this.pushToMega(envelope)
                ]);

                if ([l1, l2, l3].filter(Boolean).length >= 2) {
                    localStorage.removeItem(key);
                    console.log(`[SOVEREIGN_RECOVERY] Item ${key} synced and cleared.`);
                }
            } catch (e) {
                console.error(`[SOVEREIGN_RECOVERY] Retry failed for ${key}`, e);
            }
        }
    },

    /**
     * Start the sync monitor heartbeat
     */
    initSyncMonitor() {
        // Run immediately on init, then every 2 minutes
        this.processQueue();
        setInterval(() => this.processQueue(), 120000);
    }
};

// NOTE: Auto-init removed. InfinitySync.js handles the retry queue.
// Call SovereignSync.initSyncMonitor() explicitly if needed for legacy support.

export default SovereignSync;
