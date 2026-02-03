import React, { useEffect, useRef } from 'react';
import { useUserTier } from '../../contexts/UserTierContext';
import { X, Sparkles } from 'lucide-react';
import './AdBanner.css';

// Get AdSense config from environment variables
const ADSENSE_CLIENT_ID = import.meta.env.VITE_ADSENSE_CLIENT_ID || '';
const ADSENSE_SLOT_BANNER = import.meta.env.VITE_ADSENSE_SLOT_BANNER || '';
const ADSENSE_SLOT_LEADERBOARD = import.meta.env.VITE_ADSENSE_SLOT_LEADERBOARD || '';
const ADSENSE_SLOT_SIDEBAR = import.meta.env.VITE_ADSENSE_SLOT_SIDEBAR || '';

// Check if AdSense is configured
const isAdSenseConfigured = ADSENSE_CLIENT_ID && ADSENSE_CLIENT_ID !== 'ca-pub-XXXXXXXXXXXXXXXX';

export default function AdBanner({
    type = 'banner', // banner, sidebar, leaderboard, interstitial
    position = 'bottom', // top, bottom, sidebar
    showClose = false,
    onClose
}) {
    const { isFree, setShowUpgradeModal } = useUserTier();
    const adRef = useRef(null);
    const adLoadedRef = useRef(false);

    // Don't show ads to premium/admin users
    if (!isFree) return null;

    // Load AdSense ad when component mounts
    useEffect(() => {
        if (isAdSenseConfigured && adRef.current && !adLoadedRef.current) {
            try {
                // Push ad to adsbygoogle
                (window.adsbygoogle = window.adsbygoogle || []).push({});
                adLoadedRef.current = true;
            } catch (error) {
                console.log('AdSense ad load error:', error);
            }
        }
    }, []);

    const handleUpgrade = () => {
        setShowUpgradeModal(true);
    };

    // Get the appropriate ad slot based on type
    const getAdSlot = () => {
        switch (type) {
            case 'leaderboard':
                return ADSENSE_SLOT_LEADERBOARD || ADSENSE_SLOT_BANNER;
            case 'sidebar':
                return ADSENSE_SLOT_SIDEBAR || ADSENSE_SLOT_BANNER;
            default:
                return ADSENSE_SLOT_BANNER;
        }
    };

    // Different ad sizes for placeholders
    const adContent = {
        banner: {
            width: '100%',
            height: '90px',
            text: '📢 Advertisement Space',
            subtext: 'Upgrade to Premium to remove ads'
        },
        sidebar: {
            width: '160px',
            height: '600px',
            text: '📢 Ad',
            subtext: 'Go Premium'
        },
        leaderboard: {
            width: '100%',
            height: '90px',
            text: '📢 Your Ad Here - Contact for Advertising',
            subtext: 'Remove ads with Premium'
        },
        interstitial: {
            width: '100%',
            height: '250px',
            text: '📢 Support Our App',
            subtext: 'Upgrade to Premium for an ad-free experience!'
        }
    };

    const ad = adContent[type] || adContent.banner;
    const adSlot = getAdSlot();

    return (
        <div className={`ad-banner ad-${type} ad-position-${position}`} style={{ minHeight: ad.height }}>
            <div className="ad-content">
                <div className="ad-label">AD</div>

                {/* Real AdSense Ad */}
                {isAdSenseConfigured && adSlot ? (
                    <ins
                        ref={adRef}
                        className="adsbygoogle"
                        style={{ display: 'block' }}
                        data-ad-client={ADSENSE_CLIENT_ID}
                        data-ad-slot={adSlot}
                        data-ad-format="auto"
                        data-full-width-responsive="true"
                    />
                ) : (
                    /* Placeholder when AdSense not configured */
                    <div className="ad-placeholder">
                        <div className="ad-placeholder-inner">
                            <span className="ad-text">{ad.text}</span>
                            <span className="ad-subtext">{ad.subtext}</span>
                        </div>
                    </div>
                )}

                <button className="ad-upgrade-btn" onClick={handleUpgrade}>
                    <Sparkles size={14} />
                    Remove Ads
                </button>

                {showClose && onClose && (
                    <button className="ad-close-btn" onClick={onClose}>
                        <X size={16} />
                    </button>
                )}
            </div>
        </div>
    );
}

// Ad placement component for between content
export function AdPlacement({ type = 'banner' }) {
    const { isFree } = useUserTier();

    if (!isFree) return null;

    return (
        <div className="ad-placement">
            <AdBanner type={type} />
        </div>
    );
}
