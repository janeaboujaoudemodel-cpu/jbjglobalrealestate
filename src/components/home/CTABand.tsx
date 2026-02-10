/**
 * CTABand Component - Master Blueprint Specification
 * "Ready to Get Started?" section - now uses the standardized DirectContactCTA
 */

import DirectContactCTA from "@/components/DirectContactCTA";
import { useLanguage } from "@/contexts/LanguageContext";

const CTABand = () => {
  const { t } = useLanguage();
  return (
    <DirectContactCTA 
      title={t('cta.readyToStart', 'Ready to Get Started?')}
      subtitle={t('cta.readySubtitle', 'Connect with our expert team for personalized guidance.')}
      titleSize="premium"
      showSaveShare={true}
    />
  );
};

export default CTABand;
