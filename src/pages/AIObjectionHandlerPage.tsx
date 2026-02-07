import { SEOHead } from "@/components/SEOHead";
import { AIObjectionHandlerPremium } from "@/components/ai-tools/premium";

const AIObjectionHandlerPage = () => {
  return (
    <>
      <SEOHead 
        title="AI Objection Handler | JBJ Global Real Estate"
        description="Get AI-powered responses to buyer objections with empathetic, value-focused messaging."
        canonicalPath="/ai-objection-handler"
      />
      <AIObjectionHandlerPremium />
    </>
  );
};

export default AIObjectionHandlerPage;
