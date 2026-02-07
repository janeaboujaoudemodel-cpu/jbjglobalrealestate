import { SEOHead } from "@/components/SEOHead";
import { AIFollowupSchedulerPremium } from "@/components/ai-tools/premium";

const AIFollowupSchedulerPage = () => {
  return (
    <>
      <SEOHead 
        title="AI Follow-up Scheduler | JBJ Global Real Estate"
        description="Smart AI-powered follow-up scheduling based on lead behavior and engagement patterns."
        canonicalPath="/ai-followup-scheduler"
      />
      <AIFollowupSchedulerPremium />
    </>
  );
};

export default AIFollowupSchedulerPage;
