import { SEOHead } from "@/components/SEOHead";
import { AIROICalculatorPremium } from "@/components/ai-tools/premium";

const AIROICalculatorPage = () => {
  return (
    <>
      <SEOHead 
        title="AI ROI Calculator | JBJ Global Real Estate"
        description="Calculate investment returns with AI-powered market predictions and rental yield analysis for Dubai properties."
        canonicalPath="/ai-roi-calculator"
      />
      <AIROICalculatorPremium />
    </>
  );
};

export default AIROICalculatorPage;
