import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Building2,
  Scale,
  Briefcase,
  Plane,
  ArrowRight,
  ArrowUpRight,
  Shield,
  Users,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
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
    <div className="min-h-screen bg-black">
      <GlobalHeader />
      
      <main className="pt-20">
        {/* Hero Section - 3-Layer System */}
        <section className="relative py-20 bg-black">
          <div className="jj-layer-2">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-4xl mx-auto text-center"
            >
              <button className="group inline-flex items-center gap-2 bg-gradient-to-r from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 rounded-full px-5 py-2.5 mb-6 shadow-sm transition-all hover:shadow-md hover:border-gold cursor-default">
                <Users className="w-4 h-4 text-gold group-hover:text-black transition-colors" />
                <span className="text-gold group-hover:text-black transition-colors font-semibold">Licensed Partner Network</span>
              </button>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-black">
                Partner <span className="text-gold">Services</span>
              </h1>
              
              <p className="text-xl text-zinc-600 mb-8 leading-relaxed">
                JBJ GLOBAL REAL ESTATE is licensed for{" "}
                <span className="text-gold font-semibold">BUY, SELL & RENT</span> only.
                For all other services, we connect you with independent licensed partners.
              </p>

              {/* Main Compliance Alert */}
              <div className="jj-card-inner rounded-xl p-6 max-w-3xl mx-auto border-2 border-gold/40">
                <div className="flex items-start gap-4">
                  <div className="jj-icon-box-active w-10 h-10 rounded-lg flex-shrink-0">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <strong className="block mb-1 text-black">Important Disclosure</strong>
                    <p className="text-zinc-600 text-sm">
                      Mortgage, legal, visa, and corporate services are provided by independent licensed partners.
                      JBJ GLOBAL REAL ESTATE facilitates introductions only and does not provide these services directly.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* How It Works - 3-Layer System */}
        <section className="py-16 bg-black">
          <div className="jj-layer-2">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-12 text-black">How Partner Introductions <span className="text-gold">Work</span></h2>
              
              <div className="grid md:grid-cols-3 gap-8">
                {[
                  { num: 1, title: "Request Introduction", desc: "Tell us what service you need and we'll identify the right licensed partner." },
                  { num: 2, title: "Partner Connection", desc: "We introduce you to a vetted, licensed partner who specializes in your needs." },
                  { num: 3, title: "Direct Engagement", desc: "You contract and transact directly with the partner under their terms." },
                ].map((step) => (
                  <div key={step.num} className="text-center">
                    <div className="w-16 h-16 jj-icon-box-active rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-2xl font-bold text-black">{step.num}</span>
                    </div>
                    <h3 className="text-xl font-semibold mb-2 text-black">{step.title}</h3>
                    <p className="text-zinc-600">{step.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Partner Services Grid - 3-Layer System */}
        <section className="py-20 bg-black">
          <div className="jj-layer-2">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl font-bold text-center mb-4 text-black">Our Partner <span className="text-gold">Network</span></h2>
              <p className="text-center text-zinc-600 mb-12 max-w-2xl mx-auto">
                Access trusted professionals through our curated network of licensed service providers.
              </p>
              
              <div className="grid md:grid-cols-2 gap-8">
                {PARTNER_SERVICES.map((service, index) => (
                  <motion.div
                    key={service.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="jj-card-inner p-6 hover:border-gold hover:shadow-lg transition-all duration-300"
                  >
                    <div className="flex items-start gap-4 mb-4">
                      <div className="jj-icon-box-active w-12 h-12 rounded-lg flex-shrink-0">
                        <service.icon className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold text-black mb-2">{service.title}</h3>
                        <p className="text-zinc-600">{service.description}</p>
                      </div>
                    </div>
                    
                    <ul className="space-y-2 mb-6">
                      {service.features.map((feature) => (
                        <li key={feature} className="flex items-center gap-2 text-sm text-zinc-600">
                          <CheckCircle className="w-4 h-4 text-gold flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                    
                    <Link to={service.href}>
                      <Button variant="primary" className="w-full">
                        Learn More
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Trust & Compliance Section - 3-Layer System */}
        <section className="py-16 bg-black">
          <div className="jj-layer-2">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center justify-center gap-3 mb-8">
                <div className="jj-icon-box-active w-10 h-10 rounded-lg">
                  <Shield className="w-5 h-5" />
                </div>
                <h2 className="text-3xl font-bold text-black">Our <span className="text-gold">Commitment</span></h2>
              </div>
              
              <div className="grid md:grid-cols-2 gap-8">
                <div className="jj-card-inner p-6">
                  <h3 className="font-semibold mb-3 text-lg text-black">Licensed Real Estate Brokerage</h3>
                  <p className="text-zinc-600 text-sm leading-relaxed">
                    JBJ GLOBAL REAL ESTATE is a Dubai mainland brokerage licensed to BUY, SELL & RENT 
                    properties across the UAE. This is our core expertise and regulated activity.
                  </p>
                </div>
                
                <div className="jj-card-inner p-6">
                  <h3 className="font-semibold mb-3 text-lg text-black">Partner Introductions</h3>
                  <p className="text-zinc-600 text-sm leading-relaxed">
                    For mortgage, legal, visa, and corporate services, we facilitate introductions to 
                    independent licensed partners. Clients contract directly with partners under their terms.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section - 3-Layer System */}
        <section className="py-16 md:py-20 bg-black">
          <div className="jj-layer-2">
            <div className="max-w-[1100px] mx-auto">
              {/* INNER CARD (Champagne) */}
              <div className="jj-card-inner p-8 md:p-12 text-center border-2 border-gold/50">
                <h2 className="text-2xl md:text-3xl font-bold text-black mb-4">Need <span className="text-gold">Assistance?</span></h2>
                <p className="text-zinc-600 mb-8 max-w-xl mx-auto">
                  Whether you're buying, selling, renting, or need a partner introduction, 
                  our team is here to help guide you through the process.
                </p>
                
                <div className="flex flex-wrap justify-center gap-4">
                  <Link to="/properties">
                    <Button variant="primary" size="lg" className="px-8">
                      <span className="text-black">Browse</span>
                      <span className="text-gold ml-1">Properties</span>
                      <ArrowUpRight className="w-5 h-5 ml-2 text-black" />
                    </Button>
                  </Link>
                  <Link to="/contact">
                    <Button variant="secondary" size="lg" className="px-8">
                      Contact Us
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Compliance Disclaimer - 3-Layer System */}
        <section className="py-12 bg-black">
          <div className="jj-layer-2">
            <div className="max-w-4xl mx-auto">
              <div className="jj-card-inner rounded-lg p-6">
                <ComplianceDisclaimer variant="full" />
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Partners;