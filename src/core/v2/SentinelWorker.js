
/**
 * EDUNORM V2: SENTINEL WORKER (OFF-THREAD GUARDIAN)
 * Reduced aggression — only flags truly frozen threads (>45s).
 * Only warns once per freeze episode to avoid console spam.
 */

let lastHeartbeat = Date.now();
let checkInterval = null;
let _warnedThisCycle = false; // Only warn once per freeze

self.onmessage = (e) => {
    if (e.data.type === 'HEARTBEAT') {
        lastHeartbeat = Date.now();
        _warnedThisCycle = false; // Reset on heartbeat
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

        // Only flag if truly frozen (>45 seconds with no heartbeat) and only once
        if (diff > 45000 && !_warnedThisCycle) {
            console.warn("🛡️ Sentinel: Main thread may be unresponsive (>" + Math.round(diff / 1000) + "s).");
            self.postMessage({ type: 'CRITICAL_FAILURE', reason: 'UNRESPONSIVE' });
            _warnedThisCycle = true; // Don't spam
        }
    }, 20000); // Check every 20s instead of 15s
}
