import { SEOHead } from "@/components/SEOHead";
import { AITranslationHubPremium } from "@/components/ai-tools/premium";

const AITranslationHubPage = () => {
  return (
    <>
      <SEOHead 
        title="AI Translation Hub | JBJ Global Real Estate"
        description="Translate real estate communications to any language instantly with AI-powered accuracy."
        canonicalPath="/ai-translation-hub"
      />
      <AITranslationHubPremium />
    </>
  );
};

export default AITranslationHubPage;
