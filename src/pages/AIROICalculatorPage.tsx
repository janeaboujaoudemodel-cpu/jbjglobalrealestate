import { SEOHead } from "@/components/SEOHead";
import AIROICalculator from "@/components/ai-tools/AIROICalculator";

const AIROICalculatorPage = () => {
  return (
    <>
      <SEOHead 
        title="AI ROI Calculator | JBJ Global Real Estate"
        description="Calculate investment returns with AI-powered market predictions and rental yield analysis for Dubai properties."
        canonicalPath="/ai-roi-calculator"
      />
      <div className="min-h-screen bg-background py-8 md:py-12">
        <div className="container mx-auto px-4 max-w-5xl">
          <AIROICalculator />
        </div>
      </div>
    </>
  );
};

export default AIROICalculatorPage;
