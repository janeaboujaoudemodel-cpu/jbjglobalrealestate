import { SEOHead } from "@/components/SEOHead";
import { AIToolStartGate } from "@/components/ai-tools/AIToolStartGate";
import { AIPropertyAnalyzerPremium } from "@/components/ai-tools/premium";
import { Wand2, Sliders } from "lucide-react";

const AIPropertyAnalyzerPage = () => (
  <>
    <SEOHead
      title="AI Property Analyzer | JBJ Global Real Estate"
      description="Deep market analysis powered by AI for Dubai real estate."
      canonicalPath="/ai-property-analyzer"
    />
    <AIToolStartGate
      headline="How would you like to analyse the property?"
      methods={[
        { key: "ai", eyebrow: "Fastest · AI-Assisted", title: "AI Analysis from Address", Icon: Wand2,
          desc: "Enter the property — AI compiles price trends, yield, comparables and investment metrics.",
          bullets: ["Live comparables", "Yield & ROI", "Investment score"], cta: "Analyse with AI" },
        { key: "manual", eyebrow: "Full Control · Manual", title: "Manual Property Details", Icon: Sliders,
          desc: "Enter specs yourself for full control over the analysis inputs.",
          bullets: ["Custom specs", "Own assumptions", "Editable output"], cta: "Enter manually" },
      ]}
    >
      <AIPropertyAnalyzerPremium />
    </AIToolStartGate>
  </>
);

export default AIPropertyAnalyzerPage;
