/**
 * PopupLayer - Centralized popup rendering
 *
 * Rules:
 * - Only ONE popup visible at a time (enforced by PopupCoordinator)
 * - No guided tours / onboarding step modals
 * - Install experience: small non-blocking banner + native browser prompt on click
 */

import CookiesConsentBanner from "@/components/CookiesConsentBanner";
import AppDownloadPopup from "@/components/AppDownloadPopup";
import InstallAppButton from "@/components/InstallAppButton";

const PopupLayer = () => {
  return (
    <>
      <CookiesConsentBanner />

      {/* Small non-blocking install banner (no guide) */}
      <AppDownloadPopup variant="compact" showOnLoad delayMs={3500} />

      {/* Floating install button (also no guide) */}
      <InstallAppButton />
    </>
  );
};

export default PopupLayer;

