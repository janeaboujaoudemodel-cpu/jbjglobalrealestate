import { SEOHead } from "@/components/SEOHead";
import AITranslationHub from "@/components/ai-tools/AITranslationHub";

const AITranslationHubPage = () => {
  return (
    <>
      <SEOHead 
        title="AI Translation Hub | JBJ Global Real Estate"
        description="Translate real estate communications to any language instantly with AI-powered accuracy."
        canonicalPath="/ai-translation-hub"
      />
      <div className="min-h-screen bg-background py-8 md:py-12">
        <div className="container mx-auto px-4 max-w-5xl">
          <AITranslationHub />
        </div>
      </div>
    </>
  );
};

export default AITranslationHubPage;
