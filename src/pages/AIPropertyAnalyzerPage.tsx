import { SEOHead } from "@/components/SEOHead";
import AIPropertyAnalyzer from "@/components/ai-tools/AIPropertyAnalyzer";

const AIPropertyAnalyzerPage = () => {
  return (
    <>
      <SEOHead 
        title="AI Property Analyzer | JBJ Global Real Estate"
        description="Deep market analysis powered by AI. Get comprehensive property insights for Dubai real estate including price trends, investment metrics, and area comparisons."
        canonicalPath="/ai-property-analyzer"
      />
      <div className="min-h-screen bg-background py-8 md:py-12">
        <div className="container mx-auto px-4 max-w-5xl">
          <AIPropertyAnalyzer />
        </div>
      </div>
    </>
  );
};

export default AIPropertyAnalyzerPage;
