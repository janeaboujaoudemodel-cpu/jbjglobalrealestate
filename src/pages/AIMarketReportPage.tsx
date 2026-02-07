import { SEOHead } from "@/components/SEOHead";
import { AIMarketReportPremium } from "@/components/ai-tools/premium";

const AIMarketReportPage = () => {
  return (
    <>
      <SEOHead 
        title="AI Market Report | JBJ Global Real Estate"
        description="Generate comprehensive AI-powered market analysis reports for Dubai real estate."
        canonicalPath="/ai-market-report"
      />
      <AIMarketReportPremium />
    </>
  );
};

export default AIMarketReportPage;
