import { TrendingUp } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { PremiumToolShell } from "@/components/tools/PremiumToolShell";
import { toolThemes } from "@/components/tools/toolThemes";
import { AIPricePredictorPremium } from "@/components/ai-tools/premium";

const AIPricePredictorPage = () => {
  return (
    <PremiumToolShell
      theme={toolThemes.emerald}
      eyebrowIcon={TrendingUp}
      eyebrow="AI-Powered Price Intelligence"
      title="AI Price Predictor"
      subtitle="AI-powered property price predictions with confidence bands, built on live DLD transaction data and market analysis."
    >
      <SEOHead
        title="AI Price Predictor | JBJ Global Real Estate"
        description="AI-powered property price predictions for Dubai real estate. Get market position analysis, appreciation forecasts, and investment timing recommendations."
        canonicalPath="/ai-price-predictor"
      />
      <AIPricePredictorPremium />
    </PremiumToolShell>
  );
};

export default AIPricePredictorPage;
