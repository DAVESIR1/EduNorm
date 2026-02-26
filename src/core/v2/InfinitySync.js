// src/core/v2/InfinitySync.js
import { doc, setDoc, getDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../../config/firebase.js';
import MappingSystem from './MappingSystem.js';
import SovereignCore from './SovereignCore.js';

// ─── Env Helper (browser-safe — uses import.meta.env, NOT process.env) ─────
const getEnv = (key) => {
    try { return import.meta.env?.[key] || undefined; }
    catch (e) { return undefined; }
};

// ─── R2 Client (lazy-init, only if credentials exist) ──────────────────────
let _r2Client = null;
async function getR2Client() {
    if (_r2Client) return _r2Client;
    const endpoint = getEnv('VITE_R2_ENDPOINT');
    const accessKeyId = getEnv('VITE_R2_ACCESS_KEY_ID');
    const secretAccessKey = getEnv('VITE_R2_SECRET_ACCESS_KEY');
    if (!endpoint || !accessKeyId || !secretAccessKey) {
        console.warn('[InfinitySync] R2 not configured — layer disabled');
        return null;
    }
    try {
        const { S3Client } = await import('@aws-sdk/client-s3');
        _r2Client = new S3Client({
            region: 'auto',
            endpoint,
            credentials: { accessKeyId, secretAccessKey }
        });
        return _r2Client;
    } catch (e) {
        console.warn('[InfinitySync] R2 SDK not available:', e.message);
        return null;
    }
}

const R2_BUCKET = getEnv('VITE_R2_BUCKET_NAME') || 'edunorm';

// ─── Retry Queue (in-memory) ───────────────────────────────────────────────
const retryQueue = [];

export const InfinitySync = {

    // ─── Main Entry: Sync rawData to all 3 layers ────────────────────────────
    async universalSync(entityType, rawData) {
        // 1. Build Sovereign Envelope
        const envelope = await MappingSystem.mapToSovereign(rawData);
        if (!envelope) {
            console.error('[InfinitySync] universalSync aborted: envelope generation failed');
            return false;
        }

        // 2. Tri-Layer Dispatch (each layer is isolated)
        const results = await Promise.all([
            this.dispatch('Firestore', envelope, entityType),
            this.dispatch('R2', envelope, entityType),
            this.dispatch('Mega', envelope, entityType)
        ]);

        const activeLayers = results.filter(Boolean).length;
        console.log(`[InfinitySync] Layers succeeded: ${activeLayers}/3`);

        // If less than 1 layer succeeded, queue for retry
        if (activeLayers < 1) {
            console.warn('[InfinitySync] All layers failed — queuing for retry');
            this.queueRetry(envelope, entityType);
        }

        return activeLayers >= 1;
    },

    // ─── Dispatcher ──────────────────────────────────────────────────────────
    async dispatch(layer, envelope, entityType = 'entity') {
        try {
            switch (layer) {
                case 'Firestore': return await this.pushToFirestore(envelope, entityType);
                case 'R2': return await this.pushToR2(envelope);
                case 'Mega': return await this.pushToMega(envelope);
                default: return false;
            }
        } catch (err) {
            console.error(`[InfinitySync] dispatch(${layer}) error:`, err.message);
            return false;
        }
    },

    // ─── Layer 1: Firestore ──────────────────────────────────────────────────
    async pushToFirestore(envelope, entityType) {
        if (!db) { console.warn('[InfinitySync] Firestore not configured'); return false; }
        const docRef = doc(db, entityType, envelope.header.sid);
        await setDoc(docRef, {
            header: envelope.header,
            body: envelope.body,
            _updated: Date.now()
        }, { merge: true });
        console.log('[InfinitySync] Firestore: OK', envelope.header.sid);
        return true;
    },

    async pullFromFirestore(sid, entityType) {
        if (!db) return null;
        const docRef = doc(db, entityType, sid);
        const snap = await getDoc(docRef);
        if (!snap.exists()) return null;
        return MappingSystem.mapFromSovereign(snap.data());
    },

    // Pull ALL documents from a Firestore collection
    async pullAllFromFirestore(entityType = 'sovereign_data') {
        if (!db) return [];
        try {
            const colRef = collection(db, entityType);
            const snap = await getDocs(colRef);
            const results = [];
            for (const docSnap of snap.docs) {
                try {
                    const data = docSnap.data();
                    const decoded = await MappingSystem.mapFromSovereign(data);
                    if (decoded) results.push(decoded);
                } catch (e) {
                    console.warn('[InfinitySync] Failed to decode doc', docSnap.id, e.message);
                }
            }
            return results;
        } catch (e) {
            console.error('[InfinitySync] pullAllFromFirestore failed:', e.message);
            return [];
        }
    },

    // ─── Layer 2: Cloudflare R2 ──────────────────────────────────────────────
    async pushToR2(envelope) {
        const client = await getR2Client();
        if (!client) return false;
        try {
            const { PutObjectCommand } = await import('@aws-sdk/client-s3');
            const key = `sovereign/${envelope.header.sid}.json`;
            await client.send(new PutObjectCommand({
                Bucket: R2_BUCKET,
                Key: key,
                Body: JSON.stringify(envelope),
                ContentType: 'application/json'
            }));
            console.log('[InfinitySync] R2: OK', key);
            return true;
        } catch (e) {
            console.warn('[InfinitySync] R2 push failed:', e.message);
            return false;
        }
    },

    async pullFromR2(sid) {
        const client = await getR2Client();
        if (!client) return null;
        try {
            const { GetObjectCommand } = await import('@aws-sdk/client-s3');
            const response = await client.send(new GetObjectCommand({
                Bucket: R2_BUCKET,
                Key: `sovereign/${sid}.json`
            }));
            const str = await response.Body.transformToString();
            return MappingSystem.mapFromSovereign(JSON.parse(str));
        } catch (e) {
            console.warn('[InfinitySync] R2 pull failed:', e.message);
            return null;
        }
    },

    // ─── Layer 3: Mega ───────────────────────────────────────────────────────
    async pushToMega(envelope) {
        // Mega layer not yet connected — returns false (honest)
        console.warn('[InfinitySync] Mega: not connected');
        return false;
    },

    // ─── Retry Queue ─────────────────────────────────────────────────────────
    queueRetry(envelope, entityType) {
        retryQueue.push({ envelope, entityType, queuedAt: Date.now() });
        console.log(`[InfinitySync] Retry queue length: ${retryQueue.length}`);
        setTimeout(() => this.flushRetryQueue(), 30000);
    },

    async flushRetryQueue() {
        if (retryQueue.length === 0) return;
        console.log(`[InfinitySync] Flushing retry queue: ${retryQueue.length} items`);
        const items = [...retryQueue];
        retryQueue.length = 0;
        for (const item of items) {
            const results = await Promise.all([
                this.dispatch('Firestore', item.envelope, item.entityType),
                this.dispatch('R2', item.envelope, item.entityType),
            ]);
            if (results.filter(Boolean).length < 1) {
                retryQueue.push({ ...item, retries: (item.retries || 0) + 1 });
            }
        }
    },

    // ─── Universal Read (tries all layers, returns first success) ────────────
    async universalRead(sid, entityType = 'entity') {
        const layers = [
            () => this.pullFromFirestore(sid, entityType),
            () => this.pullFromR2(sid)
        ];
        for (const attempt of layers) {
            try {
                const result = await attempt();
                if (result) return result;
            } catch (err) {
                console.warn('[InfinitySync] Read layer failed, trying next:', err.message);
            }
        }
        return null;
    }
};

export default InfinitySync;
