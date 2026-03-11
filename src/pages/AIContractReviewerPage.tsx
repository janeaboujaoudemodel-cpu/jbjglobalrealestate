import { SEOHead } from "@/components/SEOHead";
import { AIContractReviewerPremium } from "@/components/ai-tools/premium";

const AIContractReviewerPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(40,33%,98%)] via-[hsl(38,30%,93%)] to-[hsl(36,25%,88%)]">
      <SEOHead 
        title="AI Contract Reviewer | JBJ Global Real Estate"
        description="Review real estate contracts and highlight important clauses with AI-powered analysis."
        canonicalPath="/ai-contract-reviewer"
      />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <AIContractReviewerPremium />
      </div>
    </div>
  );
};

export default AIContractReviewerPage;
