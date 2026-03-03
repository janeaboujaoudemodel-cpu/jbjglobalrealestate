/**
 * CTABand Component - Master Blueprint Specification
 * "Ready to Get Started?" section - now uses the standardized DirectContactCTA
 */

import CombinedContactNewsletter from "@/components/CombinedContactNewsletter";
import { useLanguage } from "@/contexts/LanguageContext";

const CTABand = () => {
  const { t } = useLanguage();
  return (
    <CombinedContactNewsletter
      title={t('cta.readyToStart', 'Ready to Get Started?')}
      subtitle={t('cta.readySubtitle', 'Connect with our expert team for personalized guidance.')}
    />
  );
};

export default CTABand;
