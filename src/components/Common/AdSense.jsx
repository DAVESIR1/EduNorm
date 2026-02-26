import React, { useEffect } from 'react';

/**
 * AdSense Component
 * Logic-heavy component that loads AdSense script Silently.
 * Handles Ad-Blockers without scary console errors.
 */
const AdSense = () => {
    useEffect(() => {
        // Skip loading AdSense on localhost to avoid "ERR_BLOCKED_BY_CLIENT" console noise
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            console.debug('AdSense: Silenced on localhost.');
            return;
        }

        // Check if script is already loaded
        if (window.adsbygoogle) return;

        try {
            const script = document.createElement('script');
            script.async = true;
            script.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4450849387101119";
            script.crossOrigin = "anonymous";

            // Handle loading errors (like Ad-Blockers) silently
            script.onerror = () => {
                console.log('AdSense: Script blocked by client (normal behavior with Ad-Blocker).');
            };

            document.head.appendChild(script);

            // Also add the meta tag dynamically
            const meta = document.createElement('meta');
            meta.name = "google-adsense-account";
            meta.content = "ca-pub-4450849387101119";
            document.head.appendChild(meta);

        } catch (e) {
            // Silent catch
        }
    }, []);

    return null; // This component doesn't render anything itself
};

export default AdSense;
