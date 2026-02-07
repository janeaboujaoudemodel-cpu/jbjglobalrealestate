import { SEOHead } from "@/components/SEOHead";
import { AILeadQualificationPremium } from "@/components/ai-tools/premium";

const AILeadQualificationPage = () => {
  return (
    <>
      <SEOHead 
        title="AI Lead Qualification | JBJ Global Real Estate"
        description="AI-powered lead scoring and qualification for real estate brokers. Get confidence scores, objection predictions, and recommended next actions."
        canonicalPath="/ai-lead-qualification"
      />
      <AILeadQualificationPremium />
    </>
  );
};

export default AILeadQualificationPage;
