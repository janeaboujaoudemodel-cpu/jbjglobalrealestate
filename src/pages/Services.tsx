import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Briefcase, Users, Building2, Key,
  ArrowRight, CheckCircle, ChevronRight, MessageSquare, AlertCircle,
  ClipboardCheck, Calendar, Coins, FileText, Calculator, Award
} from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { PremiumHeroButton } from "@/components/ui/premium-hero-button";
import { Card, CardContent } from "@/components/ui/card";
import servicesHeroVideoAsset from "@/assets/videos/services-hero.mp4.asset.json";
const servicesHeroVideo = servicesHeroVideoAsset.url;

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

// All 12 service cards as specified
const serviceCards = [
  {
    icon: ClipboardCheck,
    title: "Snagging & Handover Inspection",
    description: "A structured, documented inspection to identify defects before you accept handover — with clear reporting and follow-up tracking.",
    includes: [
      "Unit inspection before handover",
      "Defect identification & documentation",
      "Snagging report packaging",
      "Follow-up checklist tracking"
    ],
    cta: "Book Snagging",
    link: "/services/snagging"
  },
  {
    icon: Key,
    title: "Property Management",
    description: "Operational support to protect your asset, reduce tenant friction, and keep occupancy stable — with structured reporting.",
    includes: [
      "Tenant coordination",
      "Maintenance coordination",
      "Payment/renewal reminders",
      "Issue logging & resolution"
    ],
    cta: "Request Management",
    link: "/services/property-management"
  },
  {
    icon: Calendar,
    title: "Short-Term Rentals & Holiday Homes",
    description: "A structured setup and operating workflow for short-term stays — from readiness checklist to performance monitoring.",
    includes: [
      "Eligibility & readiness checklist",
      "Setup workflow coordination",
      "Guest messaging & cleaning",
      "Performance monitoring"
    ],
    cta: "Request Setup",
    link: "/services/short-term-rentals"
  },
  {
    icon: Coins,
    title: "Currency Exchange Support",
    description: "Coordination support for buyers transferring funds across borders — with clear routing and documentation readiness.",
    includes: [
      "Transfer coordination",
      "Partner introductions",
      "Documentation guidance",
      "Process transparency"
    ],
    cta: "Request Support",
    link: "/services/currency-exchange"
  },
  {
    icon: Briefcase,
    title: "Concierge Convenience Services",
    description: "Operational help around your property journey — scheduling, coordination, and time-saving logistics.",
    includes: [
      "Appointment scheduling",
      "Document collection",
      "Utility coordination",
      "Move-in assistance"
    ],
    cta: "Request Concierge",
    link: "/services/concierge"
  },
  {
    icon: Building2,
    title: "Company Setup Support",
    description: "A coordination pathway for company setup through licensed specialists — structured, documented, and guided.",
    includes: [
      "Partner introductions",
      "Documentation guidance",
      "Process coordination",
      "Status updates"
    ],
    cta: "Request Setup",
    link: "/services/company-setup"
  },
  {
    icon: FileText,
    title: "Signature Collection (JBJ)",
    description: "A controlled internal signature-request workflow for JBJ documents — tracked, timestamped, and auditable.",
    includes: [
      "Request submission",
      "Status tracking",
      "Document management",
      "Audit trail"
    ],
    cta: "Submit Request",
    link: "/services/signature-collection"
  },
  {
    icon: Calculator,
    title: "AI Calculators & Tools",
    description: "Decision support tools designed for clarity — using structured inputs and transparent outputs.",
    includes: [
      "Mortgage calculator",
      "Property evaluator",
      "ROI calculator",
      "AI-powered analysis"
    ],
    cta: "Open Tools",
    link: "/ai-hub"
  },
  {
    icon: Award,
    title: "Broker Certification (Internal)",
    description: "An internal training and standards program created by JBJ Global Real Estate for our broker partner network.",
    includes: [
      "Curriculum modules",
      "Standards training",
      "Certification issuance",
      "Ongoing education"
    ],
    note: "This is an internal program and does not grant external licensing status.",
    cta: "View Program",
    link: "/services/broker-certification"
  },
  {
    icon: AlertCircle,
    title: "Complaint Procedures",
    description: "A structured pathway to raise issues, track outcomes, and ensure accountability — with clear escalation steps.",
    includes: [
      "Issue submission",
      "Ticket tracking",
      "Escalation ladder",
      "Resolution updates"
    ],
    cta: "Submit Complaint",
    link: "/services/complaint-procedures"
  },
  {
    icon: MessageSquare,
    title: "Customer Happiness Center",
    description: "Fast routing, clear answers, and structured support — with ticket tracking and direct contact options.",
    includes: [
      "Support ticket creation",
      "Direct contact options",
      "Response tracking",
      "Resolution support"
    ],
    cta: "Create Ticket",
    link: "/services/customer-happiness-center"
  },
  {
    icon: Users,
    title: "Testimonials",
    description: "Verified client feedback and outcomes — presented with clarity and respect for privacy.",
    includes: [
      "Client testimonials",
      "Video testimonials",
      "Success stories",
      "Feedback submission"
    ],
    cta: "Read Stories",
    link: "/services/testimonials"
  }
];

// Service scope
const scopeIncludes = [
  "Brokerage coordination",
  "Market navigation",
  "Process support"
];

const scopeExcludes = [
  "Legal services",
  "Mortgage brokerage",
  "Financial or investment guarantees"
];

const Services = () => {
  return (
    <div data-brand-emerald-page data-marketing-page className="min-h-screen" style={{ background: "#010806" }}>
      <SEOHead 
        title="Real Estate Services | JBJ Global Real Estate"
        description="A curated set of brokerage-adjacent services designed to simplify your property journey — delivered with premium coordination, clear process, and consistent standards."
        keywords="Dubai real estate services, snagging, property management, short-term rentals, currency exchange, concierge, company setup"
        canonicalPath="/services"
      />

      {/* Hero Section — pure emerald-black gradient, fullscreen */}
      <section
        data-brand-hero
        data-hero-dark
        data-surface="emerald"
        data-no-contrast-guard
        className="relative flex items-center justify-center overflow-hidden min-h-screen w-full"
        style={{ background: "linear-gradient(135deg, #064E3B 0%, #042c1c 55%, #000000 100%)" }}
      >
        <video
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          poster="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 9'><rect width='16' height='9' fill='%23042c1c'/></svg>"
          className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-luminosity"
        >
          <source src={servicesHeroVideo} type="video/mp4" />
        </video>
        <div
          className="absolute inset-0"
          aria-hidden="true"
          style={{ background: "linear-gradient(180deg, rgba(4,44,28,0.55) 0%, rgba(0,0,0,0.75) 100%)" }}
        />

        <motion.div
          className="relative z-10 container mx-auto px-4 py-16 text-center max-w-4xl flex flex-col items-center justify-center"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <motion.div
            data-no-contrast-guard
            className="allow-white flex items-center justify-center gap-2 mb-6"
            variants={fadeInUp}
          >
            <Briefcase className="w-6 h-6 allow-white" style={{ color: "#FFFFFF" }} />
            <span className="text-sm uppercase tracking-[0.3em]" style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}>
              Services
            </span>
          </motion.div>

          <motion.h1
            data-no-contrast-guard
            className="allow-white text-4xl md:text-5xl lg:text-6xl font-bold mb-4"
            style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}
            variants={fadeInUp}
          >
            Explore JBJ Services
          </motion.h1>

          <motion.p
            data-no-contrast-guard
            className="allow-white text-base md:text-lg max-w-3xl mx-auto mb-16 md:mb-20"
            style={{ color: "rgba(255,255,255,0.88)", WebkitTextFillColor: "rgba(255,255,255,0.88)" }}
            variants={fadeInUp}
          >
            A curated set of brokerage-adjacent services designed to simplify your property journey — delivered with premium coordination, clear process, and consistent standards.
          </motion.p>

          <motion.div variants={fadeInUp} className="flex flex-wrap justify-center gap-4 mt-4">
            <PremiumHeroButton href="/contact" icon={ArrowRight}>
              Request a Service
            </PremiumHeroButton>
            <Link
              to="/contact"
              data-no-contrast-guard
              data-allow-dark-cta
              className="allow-white inline-flex items-center gap-2 px-6 py-3 border-2 border-white/40 !text-white font-semibold rounded-lg hover:bg-white/10 transition-colors"
              style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}
            >
              <MessageSquare className="w-5 h-5 allow-white" style={{ color: "#FFFFFF" }} />
              <span style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}>Contact Support</span>
            </Link>
          </motion.div>
        </motion.div>
      </section>




      {/* Service Cards Grid */}
      <section id="services-grid" className="py-20 bg-[#F7F2EA]">
        <div className="jj-layer-2">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="w-full px-4 sm:px-6 lg:px-8"
          >
            <motion.div className="text-center mb-12" variants={fadeInUp}>
              <span
                data-no-contrast-guard
                className="text-xs uppercase tracking-[0.3em] mb-4 block font-semibold"
                style={{ color: "#1A1A1A", WebkitTextFillColor: "#1A1A1A" }}
              >
                Our Service Library
              </span>
              <h2
                data-no-contrast-guard
                className="text-3xl md:text-4xl font-bold mb-4"
                style={{ color: "#1A1A1A", WebkitTextFillColor: "#1A1A1A" }}
              >
                Select a Service
              </h2>
              <p
                data-no-contrast-guard
                className="max-w-2xl mx-auto"
                style={{ color: "rgba(26,26,26,0.75)", WebkitTextFillColor: "rgba(26,26,26,0.75)" }}
              >
                Select a service to view the full process, requirements, and timelines.
              </p>
            </motion.div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {serviceCards.map((service) => (
                <motion.div key={service.title} variants={fadeInUp}>
                  <Link to={service.link} className="block h-full">
                    <Card className="jj-card-inner transition-all group h-full flex flex-col">
                      <CardContent className="p-6 flex flex-col flex-1">
                        <div
                          data-surface="emerald"
                          data-no-contrast-guard
                          className="w-12 h-12 mb-4 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"
                          style={{ background: "linear-gradient(135deg, #064E3B 0%, #042c1c 60%, #000000 100%)" }}
                        >
                          <service.icon className="w-6 h-6 allow-white" style={{ color: "#FFFFFF" }} />
                        </div>

                        <h3 className="font-semibold text-lg mb-2" style={{ color: "#1A1A1A" }}>
                          {service.title}
                        </h3>
                        <p className="text-sm mb-4 flex-1" style={{ color: "rgba(26,26,26,0.75)" }}>
                          {service.description}
                        </p>

                        <div className="bg-[#1A1A1A]/5 rounded-lg p-3 mb-4">
                          <p className="text-xs uppercase tracking-wider mb-2 font-semibold" style={{ color: "rgba(26,26,26,0.6)" }}>Includes</p>
                          <ul className="space-y-1">
                            {service.includes.map((item, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-xs" style={{ color: "rgba(26,26,26,0.85)" }}>
                                <CheckCircle className="w-3 h-3 flex-shrink-0 mt-0.5" style={{ color: "#064E3B" }} />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {service.note && (
                          <div className="bg-[#EFE6D6]/40 rounded-lg p-2 mb-4">
                            <p className="text-xs italic" style={{ color: "rgba(26,26,26,0.65)" }}>
                              {service.note}
                            </p>
                          </div>
                        )}

                        <div className="flex items-center gap-1 text-sm font-semibold mt-auto pt-4 border-t border-[#1A1A1A]/10" style={{ color: "#064E3B" }}>
                          {service.cta}
                          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>

          </motion.div>
        </div>
      </section>

      {/* Service Request Strip */}
      <section className="py-16 bg-[#F7F2EA]">
        <div className="jj-layer-2">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="w-full px-4 sm:px-6 lg:px-8"
          >
            <Card className="jj-card-inner max-w-4xl mx-auto">
              <CardContent className="p-8 text-center">
                <motion.div variants={fadeInUp}>
                  <h2 className="text-2xl md:text-3xl font-bold mb-4 text-[#1A1A1A]">
                    Not sure which service you need?
                  </h2>
                  <p className="text-[#1A1A1A]/70 max-w-xl mx-auto mb-6">
                    Send one request and our team will route it to the right department.
                  </p>
                  <div className="flex flex-wrap justify-center gap-4">
                    <Button variant="primary" size="lg" asChild>
                      <Link to="/contact">
                        <MessageSquare className="w-5 h-5 mr-2" />
                        Open Service Request
                      </Link>
                    </Button>
                    <Button variant="outline" size="lg" asChild>
                      <Link to="/contact">
                        Speak to Support
                      </Link>
                    </Button>
                  </div>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>

      {/* Service Scope Clarification */}
      <section className="py-20 bg-[#F7F2EA]">
        <div className="jj-layer-2">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="w-full px-4 sm:px-6 lg:px-8"
          >
            <motion.div className="text-center mb-12" variants={fadeInUp}>
              <span
                data-no-contrast-guard
                className="text-xs uppercase tracking-[0.3em] mb-4 block font-semibold"
                style={{ color: "#1A1A1A", WebkitTextFillColor: "#1A1A1A" }}
              >
                Service Scope
              </span>
              <h2
                data-no-contrast-guard
                className="text-3xl md:text-4xl font-bold mb-4"
                style={{ color: "#1A1A1A", WebkitTextFillColor: "#1A1A1A" }}
              >
                How Our Services Work
              </h2>
            </motion.div>


            <motion.div 
              className="max-w-4xl mx-auto"
              variants={fadeInUp}
            >
              <Card
                data-surface="emerald"
                data-no-contrast-guard
                className="border-0 shadow-2xl overflow-hidden"
                style={{ background: "linear-gradient(135deg, #064E3B 0%, #042c1c 55%, #010806 100%)" }}
              >
                <CardContent className="p-8" data-no-contrast-guard>
                  <p className="text-lg mb-8 text-center allow-white" style={{ color: "rgba(255,255,255,0.9)", WebkitTextFillColor: "rgba(255,255,255,0.9)" }}>
                    JBJ Global Real Estate is a licensed real estate brokerage authorized to buy, sell, 
                    and rent properties in Dubai and the UAE.
                  </p>
                  
                  <div className="grid md:grid-cols-2 gap-8">
                    {/* Our role includes */}
                    <div>
                      <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 allow-white" style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}>
                        <CheckCircle className="w-5 h-5 allow-white" style={{ color: "#FFFFFF" }} />
                        Our role includes
                      </h3>
                      <ul className="space-y-3">
                        {scopeIncludes.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-3 allow-white" style={{ color: "rgba(255,255,255,0.8)", WebkitTextFillColor: "rgba(255,255,255,0.8)" }}>
                            <span className="allow-white" style={{ color: "#FFFFFF" }}>•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    {/* We do not provide */}
                    <div>
                      <h3 className="font-semibold text-lg mb-4 flex items-center gap-2 allow-white" style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}>
                        <AlertCircle className="w-5 h-5 allow-white" style={{ color: "#FFFFFF" }} />
                        We do not provide
                      </h3>
                      <ul className="space-y-3">
                        {scopeExcludes.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-3 allow-white" style={{ color: "rgba(255,255,255,0.8)", WebkitTextFillColor: "rgba(255,255,255,0.8)" }}>
                            <span className="allow-white" style={{ color: "#FFFFFF" }}>•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  
                  <div className="mt-8 pt-6 border-t border-white/15 text-center">
                    <p className="text-sm allow-white" style={{ color: "rgba(255,255,255,0.7)", WebkitTextFillColor: "rgba(255,255,255,0.7)" }}>
                      Where regulated services are required, we introduce independent licensed partners. 
                      Clients contract directly with those partners.
                    </p>
                  </div>
                </CardContent>
              </Card>

            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer Disclaimer — champagne band, ink text (section bg is auto-remapped on marketing pages) */}
      <section className="bg-[#F7F2EA] py-8 border-t border-[#1A1A1A]/10">
        <div className="container mx-auto px-4 text-center">
          <p className="text-[#1A1A1A]/80 text-sm max-w-3xl mx-auto">
            JBJ Global Real Estate is a licensed real estate brokerage. Advisory support is provided
            within brokerage scope. Partner services are delivered independently under partner licenses.
          </p>
        </div>
      </section>
    </div>
  );
};

export default Services;