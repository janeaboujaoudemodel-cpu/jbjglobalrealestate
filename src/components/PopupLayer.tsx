/**
 * PopupLayer - Centralized popup rendering
 *
 * Rules:
 * - Only ONE popup visible at a time (enforced by PopupCoordinator)
 * - No guided tours / onboarding step modals
 * - PWA install prompts DISABLED - user complained about persistent "Open in app" in browser
 * - LeadCapturePopup DISABLED — user feedback: the full-screen rectangular
 *   "Application" popup was hiding the hero with faded titles. Project pages
 *   already expose Download Brochure + Register Interest CTAs, and the
 *   non-blocking PropertyRecommendationPopup handles behavior-based outreach.
 */

import CookiesConsentBanner from "@/components/CookiesConsentBanner";
import PropertyRecommendationPopup from "@/components/PropertyRecommendationPopup";
import { UserTasksPopupAlert } from "@/components/notifications/UserTasksPopupAlert";
import { usePrintMode } from "@/hooks/usePrintMode";

const PopupLayer = () => {
  const isPrintMode = usePrintMode();
  // Suppress all popups, banners, and overlays in baseline / print mode.
  if (isPrintMode) return null;
  return (
    <>
      <CookiesConsentBanner />
      <PropertyRecommendationPopup />
      <UserTasksPopupAlert />
    </>
  );
};

export default PopupLayer;


