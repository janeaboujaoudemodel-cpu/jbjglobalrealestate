import { SEOHead } from "@/components/SEOHead";
import { AIPropertyAnalyzerPremium } from "@/components/ai-tools/premium";

const AIPropertyAnalyzerPage = () => {
  return (
    <>
      <SEOHead 
        title="AI Property Analyzer | JBJ Global Real Estate"
        description="Deep market analysis powered by AI. Get comprehensive property insights for Dubai real estate including price trends, investment metrics, and area comparisons."
        canonicalPath="/ai-property-analyzer"
      />
      <AIPropertyAnalyzerPremium />
    </>
  );
};

export default AIPropertyAnalyzerPage;
