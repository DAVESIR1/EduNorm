
/**
 * EDUNORM V2: SENTINEL WORKER (OFF-THREAD GUARDIAN)
 * Reduced aggression — only flags truly frozen threads (>30s).
 */

let lastHeartbeat = Date.now();
let checkInterval = null;

self.onmessage = (e) => {
    if (e.data.type === 'HEARTBEAT') {
        lastHeartbeat = Date.now();
    }

    if (e.data.type === 'BOOT') {
        console.log("🛡️ Sentinel Worker: Off-thread Watchdog Active.");
        startWatchdog();
    }
};

function startWatchdog() {
    if (checkInterval) clearInterval(checkInterval);

    checkInterval = setInterval(() => {
        const now = Date.now();
        const diff = now - lastHeartbeat;

        // Only flag if truly frozen (>30 seconds with no heartbeat)
        if (diff > 30000) {
            console.warn("🛡️ Sentinel: Main thread may be unresponsive (>" + Math.round(diff / 1000) + "s).");
            self.postMessage({ type: 'CRITICAL_FAILURE', reason: 'UNRESPONSIVE' });
            // Reset to avoid spam — wait another full cycle
            lastHeartbeat = Date.now();
        }
    }, 15000); // Check every 15s instead of 5s
}
