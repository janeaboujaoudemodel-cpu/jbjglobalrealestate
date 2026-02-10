/**
 * PopupLayer - Centralized popup rendering
 *
 * Rules:
 * - Only ONE popup visible at a time (enforced by PopupCoordinator)
 * - No guided tours / onboarding step modals
 * - PWA install prompts DISABLED - user complained about persistent "Open in app" in browser
 */

import CookiesConsentBanner from "@/components/CookiesConsentBanner";
import LeadCapturePopup from "@/components/LeadCapturePopup";
import PropertyRecommendationPopup from "@/components/PropertyRecommendationPopup";

const PopupLayer = () => {
  // NOTE: InstallAppButton removed per user request - caused persistent 
  // "Open in app" prompt in Google search even after app deletion
  return (
    <>
      <CookiesConsentBanner />
      <LeadCapturePopup />
      <PropertyRecommendationPopup />
    </>
  );
};

export default PopupLayer;

