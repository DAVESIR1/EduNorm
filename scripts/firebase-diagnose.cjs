#!/usr/bin/env node
/**
 * Firebase Diagnostic Script
 * Checks what data exists in Firestore to debug sync/restore issues
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, getDoc } = require('firebase/firestore');

const firebaseConfig = {
    apiKey: 'AIzaSyBuMhiDfsx2OrKtL2Xy6YMDDZhBtqiNOrc',
    authDomain: 'mn-school-sathi.firebaseapp.com',
    projectId: 'mn-school-sathi',
    storageBucket: 'mn-school-sathi.firebasestorage.app',
    messagingSenderId: '555881375546',
    appId: '1:555881375546:web:9da21eddbda26c7e97d203',
};

async function diagnose() {
    console.log('🔍 Firebase Diagnostic — Checking what data exists in Firestore\n');

    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);

    // 1. Check known top-level collections
    const collectionsToCheck = [
        'backups',
        'sovereign_data',
        'students',
        'student',
        'settings',
        'standards',
        'schools',
        'users',
        'customFields',
    ];

    for (const colName of collectionsToCheck) {
        try {
            const colRef = collection(db, colName);
            const snap = await getDocs(colRef);
            if (!snap.empty) {
                console.log(`✅ Collection "${colName}": ${snap.size} documents`);
                // Show first 3 doc IDs and their top-level keys
                snap.docs.slice(0, 3).forEach(d => {
                    const data = d.data();
                    const keys = Object.keys(data);
                    const preview = keys.slice(0, 6).join(', ');
                    const sizeKB = Math.round(JSON.stringify(data).length / 1024);
                    console.log(`   📄 ${d.id} (${sizeKB}KB) — keys: [${preview}${keys.length > 6 ? ', ...' : ''}]`);
                });
                if (snap.size > 3) console.log(`   ... and ${snap.size - 3} more`);
            } else {
                console.log(`   Collection "${colName}": empty`);
            }
        } catch (e) {
            console.log(`   Collection "${colName}": ${e.message}`);
        }
    }

    // 2. Check nested backups structure: backups/{userId}/meta/data
    console.log('\n─── Checking backups sub-collections ───');
    try {
        const backupsSnap = await getDocs(collection(db, 'backups'));
        for (const userDoc of backupsSnap.docs) {
            console.log(`\n📂 backups/${userDoc.id}:`);

            // Check meta/data
            try {
                const metaSnap = await getDoc(doc(db, 'backups', userDoc.id, 'meta', 'data'));
                if (metaSnap.exists()) {
                    const meta = metaSnap.data();
                    console.log(`   📋 meta/data: ${meta.totalStudents || 0} students, ${meta.totalChunks || 0} chunks, synced: ${meta.syncedAt || 'unknown'}`);
                } else {
                    console.log(`   ⚠️  meta/data: does not exist`);
                }
            } catch (e) {
                console.log(`   meta: ${e.message}`);
            }

            // Check chunks
            try {
                const chunksSnap = await getDocs(collection(db, 'backups', userDoc.id, 'chunks'));
                console.log(`   📦 chunks: ${chunksSnap.size} chunks`);
                chunksSnap.docs.forEach(c => {
                    const data = c.data();
                    console.log(`      chunk ${c.id}: ${data.students?.length || 0} students`);
                });
            } catch (e) {
                console.log(`   chunks: ${e.message}`);
            }
        }
    } catch (e) {
        console.log(`   backups check failed: ${e.message}`);
    }

    console.log('\n✅ Diagnostic complete');
    process.exit(0);
}

diagnose().catch(e => { console.error('Diagnostic failed:', e); process.exit(1); });
