import { SEOHead } from "@/components/SEOHead";
import { AIContractReviewerPremium } from "@/components/ai-tools/premium";

const AIContractReviewerPage = () => {
  return (
    <>
      <SEOHead 
        title="AI Contract Reviewer | JBJ Global Real Estate"
        description="Review real estate contracts and highlight important clauses with AI-powered analysis."
        canonicalPath="/ai-contract-reviewer"
      />
      <AIContractReviewerPremium />
    </>
  );
};

export default AIContractReviewerPage;

