import { SEOHead } from "@/components/SEOHead";
import { AIToolStartGate } from "@/components/ai-tools/AIToolStartGate";
import { AIMarketReportPremium } from "@/components/ai-tools/premium";
import { Wand2, Sliders } from "lucide-react";

const AIMarketReportPage = () => (
  <>
    <SEOHead
      title="AI Market Report | JBJ Global Real Estate"
      description="Generate comprehensive AI-powered market analysis reports for Dubai real estate."
      canonicalPath="/ai-market-report"
    />
    <AIToolStartGate
      headline="How would you like to build the market report?"
      methods={[
        { key: "ai", eyebrow: "Fastest · AI-Assisted", title: "AI Report from Area", Icon: Wand2,
          desc: "Pick a community — AI compiles pricing, yield, supply and demand into a client-ready report.",
          bullets: ["Live DLD data", "Client-ready PDF", "Auto-charts"], cta: "Generate report" },
        { key: "manual", eyebrow: "Full Control · Manual", title: "Custom Report Builder", Icon: Sliders,
          desc: "Pick every section and metric yourself for a fully bespoke report.",
          bullets: ["Choose sections", "Custom metrics", "Own branding"], cta: "Build manually" },
      ]}
    >
      <AIMarketReportPremium />
    </AIToolStartGate>
  </>
);

export default AIMarketReportPage;
