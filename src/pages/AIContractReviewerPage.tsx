import { SEOHead } from "@/components/SEOHead";
import AIContractReviewer from "@/components/ai-tools/AIContractReviewer";

const AIContractReviewerPage = () => {
  return (
    <>
      <SEOHead 
        title="AI Contract Reviewer | JBJ Global Real Estate"
        description="Review real estate contracts and highlight important clauses with AI-powered analysis."
        canonicalPath="/ai-contract-reviewer"
      />
      <div className="min-h-screen bg-background py-8 md:py-12">
        <div className="container mx-auto px-4 max-w-5xl">
          <AIContractReviewer />
        </div>
      </div>
    </>
  );
};

export default AIContractReviewerPage;
