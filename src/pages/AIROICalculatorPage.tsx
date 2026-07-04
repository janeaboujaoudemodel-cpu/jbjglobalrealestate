import { SEOHead } from "@/components/SEOHead";
import { AIToolStartGate } from "@/components/ai-tools/AIToolStartGate";
import { AIROICalculatorPremium } from "@/components/ai-tools/premium";
import { Wand2, Sliders } from "lucide-react";

const AIROICalculatorPage = () => (
  <>
    <SEOHead
      title="AI ROI Calculator | JBJ Global Real Estate"
      description="Calculate investment returns with AI-powered market predictions and rental yield analysis."
      canonicalPath="/ai-roi-calculator"
    />
    <AIToolStartGate
      headline="How would you like to calculate ROI?"
      methods={[
        { key: "ai", eyebrow: "Fastest · AI-Assisted", title: "AI ROI from Property", Icon: Wand2,
          desc: "Enter the property — AI predicts rent, appreciation and net yield with market data.",
          bullets: ["Auto rent estimate", "Appreciation forecast", "Net yield"], cta: "Calculate with AI" },
        { key: "manual", eyebrow: "Full Control · Manual", title: "Manual Inputs", Icon: Sliders,
          desc: "Enter price, rent, costs and horizon yourself for a fully controlled calculation.",
          bullets: ["Custom assumptions", "Adjust horizon", "Sensitivity view"], cta: "Enter manually" },
      ]}
    >
      <AIROICalculatorPremium />
    </AIToolStartGate>
  </>
);

export default AIROICalculatorPage;
