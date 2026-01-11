/**
 * PopupLayer - Centralized popup rendering
 * 
 * This component renders ALL popups in a single location to prevent:
 * - Duplicate popup instances
 * - Z-index conflicts
 * - Overlapping UI elements
 * 
 * All popup visibility is managed by PopupCoordinatorContext
 */

import WelcomeModal from '@/components/WelcomeModal';
import RoleSelectionModal from '@/components/RoleSelectionModal';
import CookiesConsentBanner from '@/components/CookiesConsentBanner';
import AppDownloadPopup from '@/components/AppDownloadPopup';
import FreeToolsBanner from '@/components/FreeToolsBanner';
import LeadIntentModal from '@/components/LeadIntentModal';
import InstallAppButton from '@/components/InstallAppButton';

const PopupLayer = () => {
  return (
    <>
      {/* Priority 1: Welcome Modal - First-time visitors */}
      <WelcomeModal />
      
      {/* Priority 2: Role Selection - After welcome */}
      <RoleSelectionModal />
      
      {/* Priority 3: Lead Intent Modal */}
      <LeadIntentModal />
      
      {/* Priority 4: Cookies Consent */}
      <CookiesConsentBanner />
      
      {/* Priority 5: App Download Popup */}
      <AppDownloadPopup showOnLoad={true} delayMs={3000} />
      
      {/* Priority 6: Free Tools Banner */}
      <FreeToolsBanner />
      
      {/* Priority 7: Install App Button (always visible when applicable) */}
      <InstallAppButton />
    </>
  );
};

export default PopupLayer;
