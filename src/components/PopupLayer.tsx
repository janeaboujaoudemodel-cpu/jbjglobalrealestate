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
import ModeSelectionModal from "@/components/ModeSelectionModal";
import { UserTasksPopupAlert } from "@/components/notifications/UserTasksPopupAlert";
import { usePrintMode } from "@/hooks/usePrintMode";

const PopupLayer = () => {
  const isPrintMode = usePrintMode();
  // Suppress all popups, banners, and overlays in baseline / print mode.
  if (isPrintMode) return null;
  // NOTE: InstallAppButton removed per user request - caused persistent 
  // "Open in app" prompt in Google search even after app deletion
  return (
    <>
      <CookiesConsentBanner />
      <LeadCapturePopup />
      <PropertyRecommendationPopup />
      <ModeSelectionModal />
      <UserTasksPopupAlert />
    </>
  );
};

export default PopupLayer;

