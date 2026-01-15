/**
 * PopupLayer - Centralized popup rendering
 * 
 * ALL auto-popups on first load are DISABLED to ensure:
 * - Smooth scrolling experience
 * - No overlapping UI elements
 * - No blocking modals
 * 
 * Install prompt triggers only via user action (native browser prompt).
 * No GuidedTour, no WelcomeModal, no AppDownloadPopup on auto-load.
 */

import CookiesConsentBanner from '@/components/CookiesConsentBanner';
import InstallAppButton from '@/components/InstallAppButton';

const PopupLayer = () => {
  return (
    <>
      {/* Only essential non-blocking popups remain */}
      
      {/* Cookies Consent - Required for compliance, non-blocking banner */}
      <CookiesConsentBanner />
      
      {/* Install App Button - Small floating button, one-click install when browser supports */}
      <InstallAppButton />
    </>
  );
};

export default PopupLayer;
