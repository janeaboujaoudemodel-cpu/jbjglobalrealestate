import { SEOHead } from "@/components/SEOHead";
import { AIToolStartGate } from "@/components/ai-tools/AIToolStartGate";
import { AINeighborhoodInsightsPremium } from "@/components/ai-tools/premium";
import { Wand2, Sliders } from "lucide-react";

const AINeighborhoodInsightsPage = () => (
  <>
    <SEOHead
      title="AI Neighborhood Insights | JBJ Global Real Estate"
      description="Comprehensive AI-powered neighborhood analysis for Dubai."
      canonicalPath="/ai-neighborhood-insights"
    />
    <AIToolStartGate
      headline="How would you like to explore the neighborhood?"
      methods={[
        { key: "ai", eyebrow: "Fastest · AI-Assisted", title: "AI Insights by Area", Icon: Wand2,
          desc: "Pick a community — AI compiles livability, amenities, demographics and outlook.",
          bullets: ["Livability score", "Amenities map", "Future outlook"], cta: "Explore with AI" },
        { key: "manual", eyebrow: "Full Control · Manual", title: "Custom Insight Builder", Icon: Sliders,
          desc: "Choose metrics and priorities yourself for a bespoke neighborhood view.",
          bullets: ["Choose metrics", "Weight priorities", "Save as preset"], cta: "Build manually" },
      ]}
    >
      <AINeighborhoodInsightsPremium />
    </AIToolStartGate>
  </>
);

export default AINeighborhoodInsightsPage;
