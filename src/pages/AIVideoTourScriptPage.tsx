import { SEOHead } from "@/components/SEOHead";
import AIVideoTourScript from "@/components/ai-tools/AIVideoTourScript";

const AIVideoTourScriptPage = () => {
  return (
    <>
      <SEOHead 
        title="AI Video Tour Script | JBJ Global Real Estate"
        description="Generate professional property video tour scripts with AI-powered content creation."
        canonicalPath="/ai-video-tour-script"
      />
      <div className="min-h-screen bg-background py-8 md:py-12">
        <div className="container mx-auto px-4 max-w-5xl">
          <AIVideoTourScript />
        </div>
      </div>
    </>
  );
};

export default AIVideoTourScriptPage;
