import { SEOHead } from "@/components/SEOHead";
import AIMarketReport from "@/components/ai-tools/AIMarketReport";

const AIMarketReportPage = () => {
  return (
    <>
      <SEOHead 
        title="AI Market Report | JBJ Global Real Estate"
        description="Generate comprehensive AI-powered market analysis reports for Dubai real estate."
        canonicalPath="/ai-market-report"
      />
      <div className="min-h-screen bg-background py-8 md:py-12">
        <div className="container mx-auto px-4 max-w-5xl">
          <AIMarketReport />
        </div>
      </div>
    </>
  );
};

export default AIMarketReportPage;
