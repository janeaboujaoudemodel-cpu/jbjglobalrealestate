import { SEOHead } from "@/components/SEOHead";
import AIMeetingSummarizer from "@/components/ai-tools/AIMeetingSummarizer";

const AIMeetingSummarizerPage = () => {
  return (
    <>
      <SEOHead 
        title="AI Meeting Summarizer | JBJ Global Real Estate"
        description="Automatically summarize meetings and extract action items with AI-powered analysis."
        canonicalPath="/ai-meeting-summarizer"
      />
      <div className="min-h-screen bg-background py-8 md:py-12">
        <div className="container mx-auto px-4 max-w-5xl">
          <AIMeetingSummarizer />
        </div>
      </div>
    </>
  );
};

export default AIMeetingSummarizerPage;
