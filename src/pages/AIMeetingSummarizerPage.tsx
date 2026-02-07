import { SEOHead } from "@/components/SEOHead";
import { AIMeetingSummarizerPremium } from "@/components/ai-tools/premium";

const AIMeetingSummarizerPage = () => {
  return (
    <>
      <SEOHead 
        title="AI Meeting Summarizer | JBJ Global Real Estate"
        description="Automatically summarize meetings and extract action items with AI-powered analysis."
        canonicalPath="/ai-meeting-summarizer"
      />
      <AIMeetingSummarizerPremium />
    </>
  );
};

export default AIMeetingSummarizerPage;
