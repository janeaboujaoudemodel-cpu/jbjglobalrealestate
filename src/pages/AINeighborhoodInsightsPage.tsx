import { SEOHead } from "@/components/SEOHead";
import { AINeighborhoodInsightsPremium } from "@/components/ai-tools/premium";

const AINeighborhoodInsightsPage = () => {
  return (
    <>
      <SEOHead 
        title="AI Neighborhood Insights | JBJ Global Real Estate"
        description="Comprehensive AI-powered neighborhood analysis for Dubai. Explore livability scores, amenities, demographics, and future development insights."
        canonicalPath="/ai-neighborhood-insights"
      />
      <AINeighborhoodInsightsPremium />
    </>
  );
};

export default AINeighborhoodInsightsPage;
