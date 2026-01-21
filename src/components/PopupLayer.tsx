/**
 * PopupLayer - Centralized popup rendering
 *
 * Rules:
 * - Only ONE popup visible at a time (enforced by PopupCoordinator)
 * - No guided tours / onboarding step modals
 * - Install experience: small non-blocking banner + native browser prompt on click
 */

import CookiesConsentBanner from "@/components/CookiesConsentBanner";

const PopupLayer = () => {
  return (
    <>
      <CookiesConsentBanner />
    </>
  );
};

export default PopupLayer;

