import { SEOHead } from "@/components/SEOHead";
import { AIPricePredictorPremium } from "@/components/ai-tools/premium";

/**
 * AI Price Predictor — standalone tool page.
 * Renders inside the existing unified emerald AIToolPremiumLayout
 * carried by AIPricePredictorPremium itself. Route was previously
 * looping back to /ai-hub; PASS-206 unblocks it.
 */
const AIPricePredictorPage = () => {
  return (
    <>
      <SEOHead
        title="AI Price Predictor | JBJ Global Real Estate"
        description="AI-powered property price predictions for Dubai real estate. Get market position analysis, appreciation forecasts, and investment timing recommendations."
        canonicalPath="/ai-price-predictor"
      />
      <AIPricePredictorPremium />
    </>
  );
};

export default AIPricePredictorPage;
