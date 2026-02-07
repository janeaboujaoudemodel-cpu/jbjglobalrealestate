import { SEOHead } from "@/components/SEOHead";
import { AIPricePredictorPremium } from "@/components/ai-tools/premium";

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
