import { SEOHead } from "@/components/SEOHead";
import AIObjectionHandler from "@/components/ai-tools/AIObjectionHandler";
import BrokerGuard from "@/components/BrokerGuard";

const AIObjectionHandlerPage = () => {
  return (
    <>
      <SEOHead 
        title="AI Objection Handler | JBJ Global Real Estate"
        description="Get AI-powered responses to buyer objections with empathetic, value-focused messaging."
        canonicalPath="/ai-objection-handler"
      />
      <div className="min-h-screen bg-background py-8 md:py-12">
        <div className="container mx-auto px-4 max-w-5xl">
          <AIObjectionHandler />
        </div>
      </div>
    </>
  );
};

export default AIObjectionHandlerPage;
