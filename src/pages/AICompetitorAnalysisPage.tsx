import { SEOHead } from "@/components/SEOHead";
import AICompetitorAnalysis from "@/components/ai-tools/AICompetitorAnalysis";

const AICompetitorAnalysisPage = () => {
  return (
    <>
      <SEOHead 
        title="AI Competitor Analysis | JBJ Global Real Estate"
        description="Analyze competitor properties, pricing strategies, and market positioning with AI-powered insights."
        canonicalPath="/ai-competitor-analysis"
      />
      <div className="min-h-screen bg-background py-8 md:py-12">
        <div className="container mx-auto px-4 max-w-5xl">
          <AICompetitorAnalysis />
        </div>
      </div>
    </>
  );
};

export default AICompetitorAnalysisPage;
