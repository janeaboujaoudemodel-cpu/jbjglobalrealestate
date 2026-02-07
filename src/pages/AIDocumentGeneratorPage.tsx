import { SEOHead } from "@/components/SEOHead";
import { AIDocumentGeneratorPremium } from "@/components/ai-tools/premium";

const AIDocumentGeneratorPage = () => {
  return (
    <>
      <SEOHead 
        title="AI Document Generator | JBJ Global Real Estate"
        description="Generate professional real estate documents from templates with AI-powered automation."
        canonicalPath="/ai-document-generator"
      />
      <AIDocumentGeneratorPremium />
    </>
  );
};

export default AIDocumentGeneratorPage;
