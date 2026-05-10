import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Briefcase,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  Building2,
  Users,
  FileText,
  CreditCard,
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

const COMPANY_FEATURES = [
  {
    icon: Building2,
    title: "Mainland Company Setup",
    description: "Partners assist with Dubai mainland LLC formation and licensing.",
  },
  {
    icon: Briefcase,
    title: "Free Zone Registration",
    description: "Access to various UAE free zones through licensed corporate service providers.",
  },
  {
    icon: FileText,
    title: "PRO Services",
    description: "Government liaison services for document processing and approvals.",
  },
  {
    icon: CreditCard,
    title: "Banking Introduction",
    description: "Partners facilitate corporate bank account opening procedures.",
  },
];

const PROCESS_STEPS = [
  {
    step: 1,
    title: "Request Introduction",
    description: "Submit your company setup inquiry through our platform.",
  },
  {
    step: 2,
    title: "Partner Matching",
    description: "We connect you with a licensed corporate service provider.",
  },
  {
    step: 3,
    title: "Consultation",
    description: "You discuss your requirements directly with the partner.",
  },
  {
    step: 4,
    title: "Formation & Licensing",
    description: "The partner handles your company formation under their terms.",
  },
];

const PartnerCompanySetup = () => {
  const [consentChecked, setConsentChecked] = useState(false);
  const navigate = useNavigate();

  const handleRequestIntroduction = () => {
    if (!consentChecked) {
      toast.error("Please acknowledge the partner service disclaimer to continue.");
      return;
    }
    navigate("/contact?service=company-setup&type=partner");
  };

  return (
    <div className="min-h-screen bg-background">
      <main>
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
                <strong>Important:</strong> This service is provided by independent licensed corporate service providers.
                JBJ GLOBAL REAL ESTATE facilitates introductions only and does not provide company formation services directly.
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
                  <Briefcase className="w-8 h-8 text-[#1A1A1A]" />
                </div>
                <div>
                  <h1 className="text-4xl md:text-5xl font-bold">Company Setup Partners</h1>
                  <p className="text-muted-foreground mt-2">Business formation through licensed service providers</p>
                </div>
              </div>

              <p className="text-lg text-muted-foreground leading-relaxed">
                Whether you're establishing a property investment vehicle or relocating your business to the UAE, 
                we connect you with licensed corporate service providers who specialize in company formation.
              </p>
            </motion.div>
          </div>
        </section>

        {/* What Partners Offer */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl font-bold mb-4">What Our Corporate Partners Offer</h2>
              <p className="text-muted-foreground mb-12 max-w-2xl">
                Our network of corporate service providers handles all aspects of business formation.
              </p>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {COMPANY_FEATURES.map((feature, index) => (
                  <motion.div
                    key={feature.title}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <Card className="icon-tile h-full border-border/50 hover:border-[#B89555]/30 transition-colors">
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
                Our role is to connect you with the right corporate service provider for your needs.
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
              <h2 className="text-3xl font-bold mb-8">Company Formation in the UAE</h2>
              
              <div className="space-y-6">
                <div className="bg-muted/30 p-6 rounded-xl">
                  <h3 className="font-semibold mb-3 text-lg">Mainland Companies</h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-[#1A1A1A] mt-1 flex-shrink-0" />
                      Trade anywhere in the UAE without restrictions
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-[#1A1A1A] mt-1 flex-shrink-0" />
                      Access to government contracts and local markets
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-[#1A1A1A] mt-1 flex-shrink-0" />
                      100% foreign ownership now available in many sectors
                    </li>
                  </ul>
                </div>
                
                <div className="bg-muted/30 p-6 rounded-xl">
                  <h3 className="font-semibold mb-3 text-lg">Free Zone Companies</h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-[#1A1A1A] mt-1 flex-shrink-0" />
                      100% foreign ownership guaranteed
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-[#1A1A1A] mt-1 flex-shrink-0" />
                      Simplified setup procedures
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-[#1A1A1A] mt-1 flex-shrink-0" />
                      Industry-specific zones for specialized activities
                    </li>
                  </ul>
                </div>
                
                <div className="bg-muted/30 p-6 rounded-xl">
                  <h3 className="font-semibold mb-3 text-lg">For Property Investors</h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-[#1A1A1A] mt-1 flex-shrink-0" />
                      Corporate ownership structures for property portfolios
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-[#1A1A1A] mt-1 flex-shrink-0" />
                      Holding company options for asset protection
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-[#1A1A1A] mt-1 flex-shrink-0" />
                      Professional advice on optimal structuring
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
                    Looking to establish a business in the UAE? We'll connect you with a licensed 
                    corporate service provider who can guide you through the formation process.
                  </p>

                  {/* Consent Checkbox */}
                  <div className="flex items-start gap-3 p-4 bg-[#F7F2EA] rounded-lg border border-[#B89555]/30">
                    <Checkbox 
                      id="company-consent" 
                      checked={consentChecked}
                      onCheckedChange={(checked) => setConsentChecked(checked as boolean)}
                    />
                    <Label htmlFor="company-consent" className="text-sm text-[#1A1A1A]/70 cursor-pointer">
                      I understand this service is provided by an independent licensed corporate service provider. 
                      JBJ GLOBAL REAL ESTATE facilitates introductions only and does not provide company formation services directly.
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

export default PartnerCompanySetup;
