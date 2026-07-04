import { SEOHead } from "@/components/SEOHead";
import { AIToolStartGate } from "@/components/ai-tools/AIToolStartGate";
import { AIPricePredictorPremium } from "@/components/ai-tools/premium";
import { Wand2, Sliders } from "lucide-react";

const AIPricePredictorPage = () => (
  <>
    <SEOHead
      title="AI Price Predictor | JBJ Global Real Estate"
      description="AI-powered property price predictions for Dubai real estate."
      canonicalPath="/ai-price-predictor"
    />
    <AIToolStartGate
      headline="How would you like to predict the price?"
      methods={[
        { key: "ai", eyebrow: "Fastest · AI-Assisted", title: "AI Prediction from Address", Icon: Wand2,
          desc: "Enter a community, tower or unit — AI forecasts price, appreciation and best entry timing.",
          bullets: ["Live comparables", "Appreciation forecast", "Timing recommendation"], cta: "Predict with AI" },
        { key: "manual", eyebrow: "Full Control · Manual", title: "Custom Inputs", Icon: Sliders,
          desc: "Enter specific unit specs and constraints yourself for a bespoke prediction.",
          bullets: ["Custom specs", "Adjust weights", "See sensitivity"], cta: "Enter specs" },
      ]}
    >
      <AIPricePredictorPremium />
    </AIToolStartGate>
  </>
);

export default AIPricePredictorPage;
