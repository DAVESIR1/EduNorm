
(async () => {
    console.log("--- TRIGGERING SYNC ---");
    try {
        const AUTH_PATH = '/node_modules/.vite/deps/firebase_auth.js?v=cf4df36c';
        const { signInWithEmailAndPassword } = await import(AUTH_PATH);
        const dbConfig = await import('/src/config/firebase.js');
        const auth = dbConfig.auth;

        console.log("Logging in...");
        const userCred = await signInWithEmailAndPassword(auth, 'dathakvs@gmail.com', 'Prarthna@440');
        const user = userCred.user;
        console.log("Logged in:", user.uid);

        // Import CloudSyncService
        // Note: The file we just edited is src/services/CloudSyncService.js
        const syncService = await import('/src/services/CloudSyncService.js');

        console.log("Forcing Backup...");
        const result = await syncService.forceBackup(user.uid);
        console.log("Backup Result:", result);

        return result;
    } catch (e) {
        console.error("Sync Error:", e);
        return "Error: " + e.message;
    }
})();
