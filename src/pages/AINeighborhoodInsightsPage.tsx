import { SEOHead } from "@/components/SEOHead";
import AINeighborhoodInsights from "@/components/ai-tools/AINeighborhoodInsights";

const AINeighborhoodInsightsPage = () => {
  return (
    <>
      <SEOHead 
        title="AI Neighborhood Insights | JBJ Global Real Estate"
        description="Comprehensive AI-powered neighborhood analysis for Dubai. Explore livability scores, amenities, demographics, and future development insights."
        canonicalPath="/ai-neighborhood-insights"
      />
      <div className="min-h-screen bg-background py-8 md:py-12">
        <div className="container mx-auto px-4 max-w-5xl">
          <AINeighborhoodInsights />
        </div>
      </div>
    </>
  );
};

export default AINeighborhoodInsightsPage;
