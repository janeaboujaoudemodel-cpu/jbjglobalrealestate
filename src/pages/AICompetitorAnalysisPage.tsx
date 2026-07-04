import { SEOHead } from "@/components/SEOHead";
import { AIToolStartGate } from "@/components/ai-tools/AIToolStartGate";
import { AICompetitorAnalysisPremium } from "@/components/ai-tools/premium";
import { Wand2, Sliders } from "lucide-react";

const AICompetitorAnalysisPage = () => (
  <>
    <SEOHead
      title="AI Competitor Analysis | JBJ Global Real Estate"
      description="Analyze competitor properties, pricing strategies, and market positioning with AI-powered insights."
      canonicalPath="/ai-competitor-analysis"
    />
    <AIToolStartGate
      headline="How would you like to analyse competitors?"
      methods={[
        { key: "ai", eyebrow: "Fastest · AI-Assisted", title: "Run AI Analysis", Icon: Wand2,
          desc: "Provide your community or a competitor URL — AI benchmarks pricing, positioning and marketing gaps.",
          bullets: ["Auto-pulls market data", "Ranks pricing gaps", "Suggests positioning"], cta: "Analyse with AI" },
        { key: "manual", eyebrow: "Full Control · Manual", title: "Enter Competitors Manually", Icon: Sliders,
          desc: "Add specific competitor listings and criteria to compare against your own.",
          bullets: ["Choose your own set", "Custom criteria", "Edit any field"], cta: "Enter manually" },
      ]}
    >
      <AICompetitorAnalysisPremium />
    </AIToolStartGate>
  </>
);

export default AICompetitorAnalysisPage;
