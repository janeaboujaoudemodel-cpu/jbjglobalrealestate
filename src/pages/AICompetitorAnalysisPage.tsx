import { SEOHead } from "@/components/SEOHead";
import { AICompetitorAnalysisPremium } from "@/components/ai-tools/premium";

const AICompetitorAnalysisPage = () => {
  return (
    <>
      <SEOHead 
        title="AI Competitor Analysis | JBJ Global Real Estate"
        description="Analyze competitor properties, pricing strategies, and market positioning with AI-powered insights."
        canonicalPath="/ai-competitor-analysis"
      />
      <AICompetitorAnalysisPremium />
    </>
  );
};

export default AICompetitorAnalysisPage;
