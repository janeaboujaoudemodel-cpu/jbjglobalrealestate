import { SEOHead } from "@/components/SEOHead";
import AIPricePredictor from "@/components/ai-tools/AIPricePredictor";

const AIPricePredictorPage = () => {
  return (
    <>
      <SEOHead 
        title="AI Price Predictor | JBJ Global Real Estate"
        description="AI-powered property price predictions for Dubai real estate. Get market position analysis, appreciation forecasts, and investment timing recommendations."
        canonicalPath="/ai-price-predictor"
      />
      <div className="min-h-screen bg-background py-8 md:py-12">
        <div className="container mx-auto px-4 max-w-5xl">
          <AIPricePredictor />
        </div>
      </div>
    </>
  );
};

export default AIPricePredictorPage;
