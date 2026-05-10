import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Building2,
  ArrowRight,
  ArrowLeft,
  ArrowUpRight,
  CheckCircle,
  AlertTriangle,
  Calculator,
  FileText,
  Users,
  Percent,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import ComplianceDisclaimer from "@/components/ComplianceDisclaimer";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const MORTGAGE_FEATURES = [
  {
    icon: Calculator,
    title: "Pre-Approval Support",
    description: "Our mortgage partners help you understand your borrowing capacity before property search.",
  },
  {
    icon: Building2,
    title: "Multiple Bank Options",
    description: "Access to various UAE banks and their mortgage products for competitive comparison.",
  },
  {
    icon: Percent,
    title: "Rate Comparison",
    description: "Partners help compare fixed, variable, and hybrid rate options across lenders.",
  },
  {
    icon: FileText,
    title: "Islamic Financing",
    description: "Shariah-compliant financing options including Ijara and Murabaha products.",
  },
];

const PROCESS_STEPS = [
  {
    step: 1,
    title: "Request Introduction",
    description: "Submit your mortgage inquiry through our platform.",
  },
  {
    step: 2,
    title: "Partner Connection",
    description: "We connect you with a licensed mortgage broker or bank representative.",
  },
  {
    step: 3,
    title: "Direct Consultation",
    description: "You work directly with the partner on your application.",
  },
  {
    step: 4,
    title: "Approval & Closing",
    description: "Complete your mortgage under the partner's terms and conditions.",
  },
];

const PartnerMortgage = () => {
  const [consentChecked, setConsentChecked] = useState(false);
  const navigate = useNavigate();

  const handleRequestIntroduction = () => {
    if (!consentChecked) {
      toast.error("Please acknowledge the partner service disclaimer to continue.");
      return;
    }
    navigate("/contact?service=mortgage&type=partner");
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="pt-0">
        {/* Hero Section */}
        <section className="relative py-16 bg-gradient-to-b from-muted/50 to-background">
          <div className="container mx-auto px-4">
            {/* Back Link */}
            <Link 
              to="/partners" 
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-[#1A1A1A] transition-colors mb-8"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Partner Services
            </Link>

            {/* Compliance Banner */}
            <Alert className="bg-amber-500/10 border-amber-500/30 mb-8 max-w-4xl">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <AlertDescription className="text-foreground">
                <strong>Important:</strong> This service is provided by independent licensed partners.
                JBJ GLOBAL REAL ESTATE facilitates introductions only and does not provide mortgage services directly.
              </AlertDescription>
            </Alert>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-4xl"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-[#EFE6D6]/10 border border-[#B89555]/30 rounded-xl flex items-center justify-center">
                  <Building2 className="w-8 h-8 text-[#1A1A1A]" />
                </div>
                <div>
                  <h1 className="text-4xl md:text-5xl font-bold">Mortgage Partners</h1>
                  <p className="text-muted-foreground mt-2">Home financing through licensed mortgage brokers</p>
                </div>
              </div>

              <p className="text-lg text-muted-foreground leading-relaxed">
                Securing the right mortgage is crucial to your property purchase. We connect you with 
                licensed mortgage brokers and bank representatives who specialize in UAE property financing.
              </p>
            </motion.div>
          </div>
        </section>

        {/* What Partners Offer */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl font-bold mb-4">What Our Mortgage Partners Offer</h2>
              <p className="text-muted-foreground mb-12 max-w-2xl">
                Our vetted network of mortgage partners provides comprehensive financing guidance.
              </p>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {MORTGAGE_FEATURES.map((feature, index) => (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <Card className="h-full border-border/50 hover:border-[#B89555]/30 transition-colors">
                      <CardHeader>
                        <div className="w-12 h-12 bg-[#EFE6D6]/10 rounded-lg flex items-center justify-center mb-4">
                          <feature.icon className="w-6 h-6 text-[#1A1A1A]" />
                        </div>
                        <CardTitle className="text-lg">{feature.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">{feature.description}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* How JBJ Facilitates */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-4">How We Facilitate Introductions</h2>
              <p className="text-center text-muted-foreground mb-12">
                Our role is to connect you with the right mortgage professional for your needs.
              </p>
              
              <div className="grid md:grid-cols-4 gap-6">
                {PROCESS_STEPS.map((item) => (
                  <div key={item.step} className="text-center">
                    <div className="w-12 h-12 bg-[#EFE6D6] text-[#1A1A1A] rounded-full flex items-center justify-center mx-auto mb-4 text-xl font-bold">
                      {item.step}
                    </div>
                    <h3 className="font-semibold mb-2">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Educational Content */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold mb-8">Understanding UAE Mortgages</h2>
              
              <div className="space-y-6">
                <div className="bg-muted/30 p-6 rounded-xl">
                  <h3 className="font-semibold mb-3 text-lg">Eligibility Overview</h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-[#1A1A1A] mt-1 flex-shrink-0" />
                      UAE residents and non-residents can apply for mortgages
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-[#1A1A1A] mt-1 flex-shrink-0" />
                      Loan-to-value ratios vary based on property type and buyer status
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-[#1A1A1A] mt-1 flex-shrink-0" />
                      Documentation requirements differ by bank and buyer profile
                    </li>
                  </ul>
                </div>
                
                <div className="bg-muted/30 p-6 rounded-xl">
                  <h3 className="font-semibold mb-3 text-lg">General Considerations</h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-[#1A1A1A] mt-1 flex-shrink-0" />
                      Pre-approval strengthens your negotiating position
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-[#1A1A1A] mt-1 flex-shrink-0" />
                      Compare rates from multiple lenders before committing
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-[#1A1A1A] mt-1 flex-shrink-0" />
                      Understand all fees including processing, valuation, and insurance
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6]">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto">
              <Card className="border-[#B89555]/30 bg-[#FDFBF7] shadow-sm">
                <CardHeader className="text-center">
                  <div className="w-16 h-16 bg-[#1A1A1A] rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-[#1A1A1A]" />
                  </div>
                  <CardTitle className="text-2xl text-[#1A1A1A]">Request Partner Introduction</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-center text-[#1A1A1A]/70">
                    Ready to explore mortgage options? We'll connect you with a licensed mortgage professional 
                    who can assess your needs and guide you through the financing process.
                  </p>

                  {/* Consent Checkbox */}
                  <div className="flex items-start gap-3 p-4 bg-[#F7F2EA] rounded-lg border border-[#B89555]/30">
                    <Checkbox 
                      id="mortgage-consent" 
                      checked={consentChecked}
                      onCheckedChange={(checked) => setConsentChecked(checked as boolean)}
                    />
                    <Label htmlFor="mortgage-consent" className="text-sm text-[#1A1A1A]/70 cursor-pointer">
                      I understand this service is provided by an independent licensed partner. 
                      JBJ GLOBAL REAL ESTATE facilitates introductions only and does not provide mortgage services directly.
                    </Label>
                  </div>

                  <Button 
                    onClick={handleRequestIntroduction}
                    size="lg" 
                    variant="dark"
                    className="w-full"
                  >
                    Request Introduction to Licensed Partner
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Related Links */}
        <section className="py-12">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <h3 className="font-semibold mb-6">Related Resources</h3>
              <div className="flex flex-wrap gap-4">
                <Link to="/mortgage-calculator">
                  <Button variant="outline" size="sm">
                    <Calculator className="w-4 h-4 mr-2" />
                    Mortgage Calculator
                  </Button>
                </Link>
                <Link to="/buyer-guide">
                  <button className="relative inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold rounded-xl transition-all duration-300 bg-transparent border-2 border-[#1A1A1A] text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white">
                    <FileText className="w-4 h-4" />
                    Buyer Guide
                  </button>
                </Link>
                <Link to="/properties?transaction_type=buy">
                  <button className="relative inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold rounded-xl transition-all duration-300 bg-transparent border-2 border-[#1A1A1A] text-[#1A1A1A] hover:bg-[#1A1A1A] hover:text-white">
                    <Building2 className="w-4 h-4" />
                    Browse Properties
                    <ArrowUpRight className="w-3 h-3" />
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Compliance Disclaimer */}
        <section className="pb-12">
          <div className="container mx-auto px-4">
            <ComplianceDisclaimer variant="partners-intro" />
          </div>
        </section>
      </main>
    </div>
  );
};

export default PartnerMortgage;
