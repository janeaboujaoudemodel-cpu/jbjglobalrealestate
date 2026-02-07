import { SEOHead } from "@/components/SEOHead";
import { AIVideoTourScriptPremium } from "@/components/ai-tools/premium";

const AIVideoTourScriptPage = () => {
  return (
    <>
      <SEOHead 
        title="AI Video Tour Script | JBJ Global Real Estate"
        description="Generate professional property video tour scripts with AI-powered content creation."
        canonicalPath="/ai-video-tour-script"
      />
      <AIVideoTourScriptPremium />
    </>
  );
};

export default AIVideoTourScriptPage;
