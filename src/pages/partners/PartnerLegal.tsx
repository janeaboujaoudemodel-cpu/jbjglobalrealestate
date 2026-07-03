import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Scale,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  FileText,
  Users,
  Shield,
  Building,
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

const LEGAL_FEATURES = [
  {
    icon: FileText,
    title: "Contract Review",
    description: "Partners review sale and purchase agreements to protect your interests.",
  },
  {
    icon: Shield,
    title: "Title Verification",
    description: "Legal partners verify property ownership and encumbrance status.",
  },
  {
    icon: Scale,
    title: "Dispute Resolution",
    description: "Access to legal counsel for property-related disputes and negotiations.",
  },
  {
    icon: Building,
    title: "Corporate Structuring",
    description: "Legal advice on property ownership structures for investors.",
  },
];

const PROCESS_STEPS = [
  {
    step: 1,
    title: "Request Introduction",
    description: "Submit your legal service inquiry through our platform.",
  },
  {
    step: 2,
    title: "Partner Matching",
    description: "We connect you with a licensed law firm specializing in your needs.",
  },
  {
    step: 3,
    title: "Direct Engagement",
    description: "You engage directly with the law firm under their terms.",
  },
  {
    step: 4,
    title: "Legal Services",
    description: "The law firm handles your legal matters independently.",
  },
];

const PartnerLegal = () => {
  const [consentChecked, setConsentChecked] = useState(false);
  const navigate = useNavigate();

  const handleRequestIntroduction = () => {
    if (!consentChecked) {
      toast.error("Please acknowledge the partner service disclaimer to continue.");
      return;
    }
    navigate("/contact?service=legal&type=partner");
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
                <strong>Important:</strong> This service is provided by independent licensed law firms.
                JBJ GLOBAL REAL ESTATE facilitates introductions only and does not provide legal services directly.
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
                  <Scale className="w-8 h-8 text-[#1A1A1A]" />
                </div>
                <div>
                  <h1 className="text-4xl md:text-5xl font-bold">Legal Partners</h1>
                  <p className="text-muted-foreground mt-2">Property legal services through licensed law firms</p>
                </div>
              </div>

              <p className="text-lg text-muted-foreground leading-relaxed">
                Property transactions require proper legal oversight. We connect you with licensed 
                law firms that specialize in UAE real estate law and can protect your interests.
              </p>
            </motion.div>
          </div>
        </section>

        {/* What Partners Offer */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl font-bold mb-4">What Our Legal Partners Offer</h2>
              <p className="text-muted-foreground mb-12 max-w-2xl">
                Our network of legal partners provides comprehensive property law services.
              </p>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {LEGAL_FEATURES.map((feature, index) => (
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
                Our role is to connect you with the right legal professional for your needs.
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
              <h2 className="text-3xl font-bold mb-8">Legal Considerations in UAE Property</h2>
              
              <div className="space-y-6">
                <div className="bg-muted/30 p-6 rounded-xl">
                  <h3 className="font-semibold mb-3 text-lg">For Buyers</h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-[#1A1A1A] mt-1 flex-shrink-0" />
                      Contract review ensures all terms are clearly understood
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-[#1A1A1A] mt-1 flex-shrink-0" />
                      Title deed verification confirms clean ownership
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-[#1A1A1A] mt-1 flex-shrink-0" />
                      Due diligence protects against hidden liabilities
                    </li>
                  </ul>
                </div>
                
                <div className="bg-muted/30 p-6 rounded-xl">
                  <h3 className="font-semibold mb-3 text-lg">For Sellers</h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-[#1A1A1A] mt-1 flex-shrink-0" />
                      Proper documentation ensures smooth transfer
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-[#1A1A1A] mt-1 flex-shrink-0" />
                      Legal representation in negotiations
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-[#1A1A1A] mt-1 flex-shrink-0" />
                      Compliance with all regulatory requirements
                    </li>
                  </ul>
                </div>
                
                <div className="bg-muted/30 p-6 rounded-xl">
                  <h3 className="font-semibold mb-3 text-lg">For Investors</h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-[#1A1A1A] mt-1 flex-shrink-0" />
                      Corporate structuring advice for optimal ownership
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-[#1A1A1A] mt-1 flex-shrink-0" />
                      Multi-property portfolio legal management
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-[#1A1A1A] mt-1 flex-shrink-0" />
                      Cross-border legal considerations
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
                  <div className="w-16 h-16 bg-[#064E3B] rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl text-[#1A1A1A]">Request Partner Introduction</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="text-center text-[#1A1A1A]/70">
                    Need legal support for your property transaction? We'll connect you with a licensed 
                    law firm that specializes in UAE real estate law.
                  </p>

                  {/* Consent Checkbox */}
                  <div className="flex items-start gap-3 p-4 bg-[#F7F2EA] rounded-lg border border-[#B89555]/30">
                    <Checkbox
                      id="legal-consent"
                      checked={consentChecked}
                      onCheckedChange={(checked) => setConsentChecked(checked as boolean)}
                      className="mt-0.5 border-[#064E3B] data-[state=checked]:bg-[#064E3B] data-[state=checked]:border-[#064E3B] data-[state=checked]:text-white [&_svg]:text-white"
                    />
                    <Label htmlFor="legal-consent" className="text-sm text-[#1A1A1A]/80 cursor-pointer leading-relaxed">
                      I understand this service is provided by an independent licensed law firm. 
                      JBJ GLOBAL REAL ESTATE facilitates introductions only and does not provide legal services directly.
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

export default PartnerLegal;
