import { SEOHead } from "@/components/SEOHead";
import AILeadQualification from "@/components/ai-tools/AILeadQualification";

const AILeadQualificationPage = () => {
  return (
    <>
      <SEOHead 
        title="AI Lead Qualification | JBJ Global Real Estate"
        description="AI-powered lead scoring and qualification for real estate brokers. Get confidence scores, objection predictions, and recommended next actions."
        canonicalPath="/ai-lead-qualification"
      />
      <div className="min-h-screen bg-background py-8 md:py-12">
        <div className="container mx-auto px-4 max-w-5xl">
          <AILeadQualification />
        </div>
      </div>
    </>
  );
};

export default AILeadQualificationPage;
