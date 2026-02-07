import { SEOHead } from "@/components/SEOHead";
import AIFollowupScheduler from "@/components/ai-tools/AIFollowupScheduler";

const AIFollowupSchedulerPage = () => {
  return (
    <>
      <SEOHead 
        title="AI Follow-up Scheduler | JBJ Global Real Estate"
        description="Smart AI-powered follow-up scheduling based on lead behavior and engagement patterns."
        canonicalPath="/ai-followup-scheduler"
      />
      <div className="min-h-screen bg-background py-8 md:py-12">
        <div className="container mx-auto px-4 max-w-5xl">
          <AIFollowupScheduler />
        </div>
      </div>
    </>
  );
};

export default AIFollowupSchedulerPage;
