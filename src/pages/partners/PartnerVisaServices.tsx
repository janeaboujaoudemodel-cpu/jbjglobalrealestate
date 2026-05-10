import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Plane,
  ArrowRight,
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  Award,
  Users,
  Globe,
  Clock,
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

const VISA_FEATURES = [
  {
    icon: Award,
    title: "Golden Visa Guidance",
    description: "Partners guide you through UAE Golden Visa eligibility and application requirements.",
  },
  {
    icon: Users,
    title: "Investor Visa Support",
    description: "Visa services for property investors meeting UAE investment thresholds.",
  },
  {
    icon: Globe,
    title: "Family Visa Assistance",
    description: "Sponsorship and family reunification visa coordination through licensed providers.",
  },
  {
    icon: Clock,
    title: "Visa Renewal",
    description: "Partners assist with visa renewal and status maintenance procedures.",
  },
];

const PROCESS_STEPS = [
  {
    step: 1,
    title: "Request Introduction",
    description: "Submit your visa inquiry through our platform.",
  },
  {
    step: 2,
    title: "Partner Matching",
    description: "We connect you with a licensed immigration consultant.",
  },
  {
    step: 3,
    title: "Eligibility Assessment",
    description: "The partner reviews your situation and advises on options.",
  },
  {
    step: 4,
    title: "Application Process",
    description: "The partner manages your application under their terms.",
  },
];

const PartnerVisaServices = () => {
  const [consentChecked, setConsentChecked] = useState(false);
  const navigate = useNavigate();

  const handleRequestIntroduction = () => {
    if (!consentChecked) {
      toast.error("Please acknowledge the partner service disclaimer to continue.");
      return;
    }
    navigate("/contact?service=visa&type=partner");
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
                <strong>Important:</strong> This service is provided by independent licensed immigration consultants.
                JBJ GLOBAL REAL ESTATE facilitates introductions only and does not provide visa services directly.
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
                  <Plane className="w-8 h-8 text-[#1A1A1A]" />
                </div>
                <div>
                  <h1 className="text-4xl md:text-5xl font-bold">Visa Partners</h1>
                  <p className="text-muted-foreground mt-2">Visa and residency services through licensed consultants</p>
                </div>
              </div>

              <p className="text-lg text-muted-foreground leading-relaxed">
                Property ownership in the UAE can open doors to residency options. We connect you with 
                licensed immigration consultants who specialize in investor visas and residency permits.
              </p>
            </motion.div>
          </div>
        </section>

        {/* What Partners Offer */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl font-bold mb-4">What Our Visa Partners Offer</h2>
              <p className="text-muted-foreground mb-12 max-w-2xl">
                Our network of immigration consultants provides comprehensive visa and residency support.
              </p>
              
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {VISA_FEATURES.map((feature, index) => (
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
                Our role is to connect you with the right immigration professional for your needs.
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
              <h2 className="text-3xl font-bold mb-8">UAE Visa & Residency Overview</h2>
              
              <div className="space-y-6">
                <div className="bg-muted/30 p-6 rounded-xl">
                  <h3 className="font-semibold mb-3 text-lg">Golden Visa</h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-[#1A1A1A] mt-1 flex-shrink-0" />
                      Long-term residency for investors, entrepreneurs, and specialized talents
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-[#1A1A1A] mt-1 flex-shrink-0" />
                      Property investment thresholds apply for eligibility
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-[#1A1A1A] mt-1 flex-shrink-0" />
                      Family sponsorship benefits included
                    </li>
                  </ul>
                </div>
                
                <div className="bg-muted/30 p-6 rounded-xl">
                  <h3 className="font-semibold mb-3 text-lg">Property Investor Visa</h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-[#1A1A1A] mt-1 flex-shrink-0" />
                      Residency based on property investment value
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-[#1A1A1A] mt-1 flex-shrink-0" />
                      Multiple investment options available
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-[#1A1A1A] mt-1 flex-shrink-0" />
                      Renewable visa validity periods
                    </li>
                  </ul>
                </div>
                
                <div className="bg-muted/30 p-6 rounded-xl">
                  <h3 className="font-semibold mb-3 text-lg">General Considerations</h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-[#1A1A1A] mt-1 flex-shrink-0" />
                      Requirements and thresholds are subject to government regulations
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-[#1A1A1A] mt-1 flex-shrink-0" />
                      Professional assessment recommended before property purchase
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-[#1A1A1A] mt-1 flex-shrink-0" />
                      Processing times vary based on application type
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-[#FDFBF7]">
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
                    Interested in UAE residency through property investment? We'll connect you with a 
                    licensed immigration consultant who can assess your eligibility and guide you through the process.
                  </p>

                  {/* Consent Checkbox */}
                  <div className="flex items-start gap-3 p-4 bg-[#F7F2EA] rounded-lg border border-[#B89555]/30">
                    <Checkbox 
                      id="visa-consent" 
                      checked={consentChecked}
                      onCheckedChange={(checked) => setConsentChecked(checked as boolean)}
                    />
                    <Label htmlFor="visa-consent" className="text-sm text-[#1A1A1A]/70 cursor-pointer">
                      I understand this service is provided by an independent licensed immigration consultant. 
                      JBJ GLOBAL REAL ESTATE facilitates introductions only and does not provide visa services directly.
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
                <Link to="/properties?transaction_type=buy">
                  <Button variant="outline" size="sm">
                    Browse Investment Properties
                  </Button>
                </Link>
                <Link to="/buyer-guide">
                  <Button variant="outline" size="sm">
                    Buyer Guide
                  </Button>
                </Link>
                <Link to="/partners/company-setup">
                  <Button variant="outline" size="sm">
                    Company Setup Partners
                  </Button>
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

export default PartnerVisaServices;
