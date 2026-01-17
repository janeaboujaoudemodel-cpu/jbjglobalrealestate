import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Building2,
  Scale,
  Briefcase,
  Plane,
  ArrowRight,
  Shield,
  Users,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import GlobalHeader from "@/components/GlobalHeader";
import Footer from "@/components/Footer";
import ComplianceDisclaimer from "@/components/ComplianceDisclaimer";

const PARTNER_SERVICES = [
  {
    id: "mortgage",
    title: "Mortgage Partners",
    description: "Home financing through UAE-licensed mortgage brokers and banks",
    icon: Building2,
    href: "/partners/mortgage",
    features: [
      "Pre-approval guidance",
      "Multiple bank options",
      "Competitive rates comparison",
      "Islamic financing options",
    ],
  },
  {
    id: "legal",
    title: "Legal Partners",
    description: "Property legal services through licensed law firms",
    icon: Scale,
    href: "/partners/legal",
    features: [
      "Contract review",
      "Title deed verification",
      "Dispute resolution",
      "Corporate structuring",
    ],
  },
  {
    id: "company-setup",
    title: "Company Setup Partners",
    description: "Business formation through licensed corporate service providers",
    icon: Briefcase,
    href: "/partners/company-setup",
    features: [
      "Mainland company setup",
      "Free zone registration",
      "PRO services",
      "Banking introduction",
    ],
  },
  {
    id: "visa-services",
    title: "Visa Partners",
    description: "Visa and residency services through licensed immigration consultants",
    icon: Plane,
    href: "/partners/visa-services",
    features: [
      "Golden Visa guidance",
      "Investor visa support",
      "Family visa assistance",
      "Visa renewal coordination",
    ],
  },
];

const Partners = () => {
  return (
    <div className="min-h-screen bg-background">
      <GlobalHeader />
      
      <main className="pt-20">
        {/* Hero Section */}
        <section className="relative py-20 bg-gradient-to-b from-muted/50 to-background">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-4xl mx-auto text-center"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-gold/10 border border-gold/30 rounded-full mb-6">
                <Users className="w-4 h-4 text-gold" />
                <span className="text-sm font-medium text-gold">Licensed Partner Network</span>
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                Partner Services
              </h1>
              
              <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
                JBJ GLOBAL REAL ESTATE is licensed for{" "}
                <span className="text-gold font-semibold">BUY, SELL & RENT</span> only.
                For all other services, we connect you with independent licensed partners.
              </p>

              {/* Main Compliance Alert */}
              <Alert className="bg-amber-500/10 border-amber-500/30 max-w-3xl mx-auto">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                <AlertDescription className="text-left text-foreground">
                  <strong className="block mb-1">Important Disclosure</strong>
                  Mortgage, legal, visa, and corporate services are provided by independent licensed partners.
                  JBJ GLOBAL REAL ESTATE facilitates introductions only and does not provide these services directly.
                </AlertDescription>
              </Alert>
            </motion.div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-12">How Partner Introductions Work</h2>
              
              <div className="grid md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gold/10 border border-gold/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-gold">1</span>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Request Introduction</h3>
                  <p className="text-muted-foreground">
                    Tell us what service you need and we'll identify the right licensed partner.
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-gold/10 border border-gold/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-gold">2</span>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Partner Connection</h3>
                  <p className="text-muted-foreground">
                    We introduce you to a vetted, licensed partner who specializes in your needs.
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-16 h-16 bg-gold/10 border border-gold/30 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-gold">3</span>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Direct Engagement</h3>
                  <p className="text-muted-foreground">
                    You contract and transact directly with the partner under their terms.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Partner Services Grid */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-4">Our Partner Network</h2>
              <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
                Access trusted professionals through our curated network of licensed service providers.
              </p>
              
              <div className="grid md:grid-cols-2 gap-8">
                {PARTNER_SERVICES.map((service, index) => (
                  <motion.div
                    key={service.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <Card className="h-full hover:shadow-lg transition-shadow border-border/50 hover:border-gold/30">
                      <CardHeader>
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 bg-gold/10 rounded-lg flex items-center justify-center flex-shrink-0">
                            <service.icon className="w-6 h-6 text-gold" />
                          </div>
                          <div>
                            <CardTitle className="text-xl mb-2">{service.title}</CardTitle>
                            <CardDescription className="text-base">
                              {service.description}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2 mb-6">
                          {service.features.map((feature) => (
                            <li key={feature} className="flex items-center gap-2 text-sm text-muted-foreground">
                              <CheckCircle className="w-4 h-4 text-gold flex-shrink-0" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                        
                        <Link to={service.href}>
                          <Button className="w-full bg-gold hover:bg-gold/90 text-black">
                            Learn More
                            <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Trust & Compliance Section */}
        <section className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center justify-center gap-3 mb-8">
                <Shield className="w-8 h-8 text-gold" />
                <h2 className="text-3xl font-bold">Our Commitment</h2>
              </div>
              
              <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-background p-6 rounded-xl border border-border">
                  <h3 className="font-semibold mb-3 text-lg">Licensed Real Estate Brokerage</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    JBJ GLOBAL REAL ESTATE is a Dubai mainland brokerage licensed to BUY, SELL & RENT 
                    properties across the UAE. This is our core expertise and regulated activity.
                  </p>
                </div>
                
                <div className="bg-background p-6 rounded-xl border border-border">
                  <h3 className="font-semibold mb-3 text-lg">Partner Introductions</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    For mortgage, legal, visa, and corporate services, we facilitate introductions to 
                    independent licensed partners. Clients contract directly with partners under their terms.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-4">Need Assistance?</h2>
              <p className="text-muted-foreground mb-8">
                Whether you're buying, selling, renting, or need a partner introduction, 
                our team is here to help guide you through the process.
              </p>
              
              <div className="flex flex-wrap justify-center gap-4">
                <Link to="/properties">
                  <Button size="lg" className="bg-gold hover:bg-gold/90 text-black">
                    Browse Properties
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
                <Link to="/contact">
                  <Button size="lg" variant="outline">
                    Contact Us
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Compliance Disclaimer */}
        <section className="pb-12">
          <div className="container mx-auto px-4">
            <ComplianceDisclaimer variant="full" />
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Partners;
