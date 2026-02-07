import { SEOHead } from "@/components/SEOHead";
import AIDocumentGenerator from "@/components/ai-tools/AIDocumentGenerator";

const AIDocumentGeneratorPage = () => {
  return (
    <>
      <SEOHead 
        title="AI Document Generator | JBJ Global Real Estate"
        description="Generate professional real estate documents from templates with AI-powered automation."
        canonicalPath="/ai-document-generator"
      />
      <div className="min-h-screen bg-background py-8 md:py-12">
        <div className="container mx-auto px-4 max-w-5xl">
          <AIDocumentGenerator />
        </div>
      </div>
    </>
  );
};

export default AIDocumentGeneratorPage;
