
import { doc, setDoc, getDoc, getFirestore } from 'firebase/firestore';
import { db } from '../../config/firebase.js';
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { Storage } from 'megajs';
import MappingSystem from './MappingSystem.js';
import SovereignCore from './SovereignCore.js';

// Env Helper
const getEnv = (key) => {
    try { return import.meta.env[key] || process.env[key]; }
    catch (e) { return process.env[key]; }
};

export const InfinitySync = {
    _clients: { firestore: null, r2: null, mega: null },
    syncCount: 0,

    async getFirestore() { return db; },

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
                credentials: { accessKeyId: config.accessKeyId, secretAccessKey: config.secretAccessKey }
            }),
            bucket: config.bucket
        };
        return this._clients.r2;
    },

    async getMegaStorage() {
        if (this._clients.mega && this._clients.mega.ready) return this._clients.mega;
        const creds = { email: getEnv('VITE_MEGA_EMAIL'), password: getEnv('VITE_MEGA_PASS') };
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
     * UNIVERSAL SYNC: THE INFINITY BROADCAST
     */
    async universalSync(entityType, rawData) {
        // 1. Prepare Envelope (Fixed for Infinity Mesh)
        const envelope = await MappingSystem.mapToSovereign(rawData);
        if (!envelope) return false;

        // Add Mesh Metadata
        envelope.header.mesh_v = "1.0.0";
        envelope.header.sync_ts = Date.now();

        // 2. Tri-Layer Dispatch
        const layers = ['Firestore', 'R2', 'Mega'];
        const results = await Promise.all([
            this.dispatch('Firestore', envelope),
            this.dispatch('R2', envelope),
            this.dispatch('Mega', envelope)
        ]);

        const activeLayers = results.filter(Boolean).length;
        console.log(`📡 Infinity Mesh: ${activeLayers}/3 layers secured for ${entityType}.`);

        // Rule of Atomicity: Need at least 2 layers
        if (activeLayers < 2) {
            this.queueRetry(envelope);
        }

        // 3. Life-Pod Trigger (Every 10 syncs)
        this.syncCount++;
        if (this.syncCount % 10 === 0) {
            this.triggerLifePod(rawData);
        }

        return activeLayers >= 2;
    },

    async dispatch(layer, env) {
        try {
            if (layer === 'Firestore') return await this.pushToFirestore(env);
            if (layer === 'R2') return await this.pushToR2(env);
            if (layer === 'Mega') return await this.pushToMega(env);
            return false;
        } catch (err) {
            console.warn(`Mesh Warning: ${layer} layer failed.`, err.message);
            return false;
        }
    },

    async pushToFirestore(env) {
        const dbInstance = await this.getFirestore();
        if (!dbInstance) throw new Error("Firestore instance not available");
        await setDoc(doc(dbInstance, 'sovereign_data', env.header.sid), env);
        return true;
    },

    async pushToR2(env) {
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
    },

    async pushToMega(env) {
        const mega = await this.getMegaStorage();
        if (!mega) return false;
        let v2Folder = mega.root.children?.find(f => f.name === 'EduNorm_V2');
        if (!v2Folder) v2Folder = await mega.root.mkdir('EduNorm_V2');
        // Use TextEncoder instead of Buffer.from (Buffer is Node.js only, not available in browsers)
        const encoded = new TextEncoder().encode(JSON.stringify(env));
        await v2Folder.upload(`${env.header.sid}.enorm`, encoded).complete;
        return true;
    },

    /**
     * GENETIC SYNC: THE MASTER DNA BACKUP
     */
    async syncMasterDNA(dnaObject) {
        console.log("🧬 Genetic Sync: Backing up Master DNA to Mesh...");
        try {
            const sid = await SovereignCore.getSearchHash("SYSTEM_MASTER_DNA");
            const encryptedBody = await SovereignCore.encryptAsync(JSON.stringify(dnaObject));
            const env = {
                header: { sid, type: 'GENETIC_DNA', ts: Date.now(), v: "2.0.0" },
                body: encryptedBody
            };

            // Sync to all layers individually to prevent total failure
            const results = await Promise.allSettled([
                this.pushToFirestore(env).then(r => ({ layer: 'Firestore', success: r })),
                this.pushToR2(env).then(r => ({ layer: 'R2', success: r })),
                this.pushToMega(env).then(r => ({ layer: 'Mega', success: r }))
            ]);

            const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).map(r => r.value.layer);
            console.log(`🧬 Genetic Sync Status: ${successful.length}/3 layers secured. Layers: [${successful.join(', ')}]`);
            return successful.length > 0;
        } catch (err) {
            console.warn("Genetic Sync Error:", err.message);
            return false;
        }
    },

    /**
     * SELF-HEALING HEARTBEAT
     * Compares layers and repairs from Mega.nz (Gold Master)
     */
    async heartbeatSelfHeal(sid) {
        console.log(`💓 Heartbeat: Checking integrity for ${sid}...`);

        // Fetch from Mega (Absolute Truth)
        const megaData = await this.pullFromMega(sid);
        if (!megaData) return { success: false, reason: "Gold Master (Mega) unavailable" };

        // Check Firestore and R2
        const [fData, r2Data] = await Promise.all([
            this.pullFromFirestore(sid),
            this.pullFromR2(sid)
        ]);

        let healCount = 0;
        if (!fData || JSON.stringify(fData) !== JSON.stringify(megaData)) {
            console.log("Healing Firestore from Gold Master...");
            await this.pushToFirestore(megaData);
            healCount++;
        }
        if (!r2Data || JSON.stringify(r2Data) !== JSON.stringify(megaData)) {
            console.log("Healing R2 from Gold Master...");
            await this.pushToR2(megaData);
            healCount++;
        }

        return { success: true, healed: healCount };
    },

    async pullFromMega(sid) {
        try {
            const mega = await this.getMegaStorage();
            if (!mega) return null;
            const v2Folder = mega.root.children?.find(f => f.name === 'EduNorm_V2');
            const file = v2Folder?.children?.find(f => f.name === `${sid}.enorm`);
            if (!file) return null;
            const buffer = await file.downloadBuffer();
            return JSON.parse(buffer.toString());
        } catch (e) { return null; }
    },

    async pullFromFirestore(sid) {
        try {
            const db = await this.getFirestore();
            const snap = await getDoc(doc(db, 'sovereign_data', sid));
            return snap.exists() ? snap.data() : null;
        } catch (e) { return null; }
    },

    async pullFromR2(sid) {
        try {
            const r2 = await this.getR2Client();
            if (!r2) return null;
            const res = await r2.client.send(new GetObjectCommand({
                Bucket: r2.bucket, Key: `v2/${sid}.enorm`
            }));
            const streamToBuffer = (stream) => new Promise((resolve, reject) => {
                const chunks = [];
                stream.on("data", (chunk) => chunks.push(chunk));
                stream.on("end", () => resolve(Buffer.concat(chunks)));
            });
            const buffer = await streamToBuffer(res.Body);
            return JSON.parse(buffer.toString());
        } catch (e) { return null; }
    },

    async triggerLifePod(data) {
        try {
            const { LifePodGenerator } = await import('./LifePodGenerator.js');
            await LifePodGenerator.generate(data);
        } catch (e) { console.error("Life-Pod Trigger Failed", e); }
    },

    /**
     * UNIVERSAL PULL: THE RESTORATION BRIDGE
     * Fetches from the mesh, prioritizes Mega (Gold Master) if needed.
     */
    async universalPull(sid) {
        console.log(`📥 Infinity Mesh: Pulling data for ${sid}...`);

        // Try Mega (Gold Master) first as it's the safest source
        let data = await this.pullFromMega(sid);

        if (!data) {
            console.warn("Gold Master (Mega) missed. Failing over to R2/Firestore...");
            const [r2Data, fData] = await Promise.all([
                this.pullFromR2(sid),
                this.pullFromFirestore(sid)
            ]);
            data = r2Data || fData;
        }

        if (data && data.header && data.body) {
            try {
                // Decrypt polymorphic body
                const clearText = SovereignCore.decrypt(data.body);
                return JSON.parse(clearText);
            } catch (e) {
                console.error("DECRYPTION_FAILURE: Potential data corruption.", e);
                return null;
            }
        }

        return null;
    },

    queueRetry(envelope) {
        if (typeof localStorage === 'undefined') {
            console.warn(`[QUEUED] Node.js environment: Sync deferral saved to memory (Retry not persisted).`);
            return;
        }
        const key = `infinity_retry_${envelope.header.sid}`;
        localStorage.setItem(key, JSON.stringify(envelope));
    },

    /**
     * BLIND SUMMATION: Privacy-Preserving Stats
     * Aggregates counts for blind tags across a set of data.
     */
    async getSovereignStats(records, categoryKey) {
        const stats = {};
        for (const record of records) {
            const val = record[categoryKey];
            const tag = await SovereignCore.getBlindTag(categoryKey, val);
            stats[tag] = (stats[tag] || 0) + 1;
        }
        return stats;
    }
};

export default InfinitySync;
