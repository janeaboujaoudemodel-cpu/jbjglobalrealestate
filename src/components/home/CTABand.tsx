/**
 * CTABand Component - Master Blueprint Specification
 * "Ready to Get Started?" section - now uses the standardized DirectContactCTA
 */

import DirectContactCTA from "@/components/DirectContactCTA";

const CTABand = () => {
  return (
    <DirectContactCTA 
      title="Ready to Get Started?"
      subtitle="Connect with our expert team for personalized guidance."
      titleSize="premium"
      showSaveShare={true}
    />
  );
};

export default CTABand;
