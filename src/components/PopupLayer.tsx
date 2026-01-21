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

      {/* Floating install button (no duplicate popup - removed AppDownloadPopup) */}
      <InstallAppButton />
    </>
  );
};

export default PopupLayer;

