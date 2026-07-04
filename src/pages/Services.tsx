import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Briefcase, Building2, Key, ArrowRight, CheckCircle, ChevronRight,
  MessageSquare, AlertCircle, Calendar, FileText, Award, GraduationCap,
  Home, DollarSign, Globe, Megaphone, ClipboardCheck, Sparkles, Building,
  Palmtree, Wrench, Package
} from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { Card, CardContent } from "@/components/ui/card";
import CombinedContactNewsletter from "@/components/CombinedContactNewsletter";
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
    transition: { staggerChildren: 0.08 }
  }
};

// JBJ Global Real Estate — full curated service catalog (2-per-row layout)
const serviceCards = [
  {
    icon: GraduationCap,
    title: "Broker Academy",
    description: "Structured training and continuous development program for brokers — covering compliance, negotiation, market intelligence, and premium client handling.",
    includes: ["Curriculum modules", "Standards training", "Continuous education", "Certification pathway"],
    cta: "Explore Academy",
    link: "/broker-education"
  },
  {
    icon: Home,
    title: "Buy Property",
    description: "End-to-end buying advisory — from shortlist and viewings to negotiation, DLD paperwork, and handover coordination.",
    includes: ["Shortlist & viewings", "Negotiation support", "Offer & MOU handling", "Transfer coordination"],
    cta: "Start Buying",
    link: "/properties"
  },
  {
    icon: Key,
    title: "Rent Property",
    description: "Guided rental advisory for tenants — matching your brief, verifying the listing, and structuring a clean tenancy contract.",
    includes: ["Requirement briefing", "Listing verification", "Ejari & tenancy contract", "Move-in coordination"],
    cta: "Find a Rental",
    link: "/properties?type=rent"
  },
  {
    icon: DollarSign,
    title: "Sell Property",
    description: "Full-service selling advisory — valuation, marketing, buyer qualification, and transfer coordination handled end-to-end.",
    includes: ["Valuation & pricing", "Premium marketing", "Buyer qualification", "Transfer & DLD handling"],
    cta: "List Your Property",
    link: "/sell/valuation"
  },
  {
    icon: Award,
    title: "Golden Visa",
    description: "Coordination pathway for UAE 10-year Golden Visa applications through licensed specialists — property-backed, investor, or professional routes.",
    includes: ["Eligibility review", "Document preparation", "Application coordination", "Status tracking"],
    cta: "Check Eligibility",
    link: "/guides/golden-visa-uae"
  },
  {
    icon: Globe,
    title: "Schengen Visa",
    description: "Structured Schengen visa coordination for UAE residents — appointment booking, documentation, and travel-insurance readiness.",
    includes: ["Country routing", "Appointment booking", "Document checklist", "Travel insurance"],
    cta: "Request Support",
    link: "/contact"
  },
  {
    icon: Building2,
    title: "Company Setup",
    description: "Coordination pathway for UAE company formation — mainland, free-zone, and offshore — through licensed corporate specialists.",
    includes: ["Structure advisory", "License selection", "Documentation guidance", "Ongoing renewals"],
    cta: "Start Setup",
    link: "/partners/company-setup"
  },
  {
    icon: Megaphone,
    title: "Digital Marketing",
    description: "Performance marketing and content workflows for developers, brokers, and premium clients — lead capture, funnel design, and reporting.",
    includes: ["Paid media", "Content production", "Landing pages", "Weekly reporting"],
    cta: "Request Proposal",
    link: "/contact"
  },
  {
    icon: Calendar,
    title: "Event Management",
    description: "End-to-end event production for launches, exclusive previews, investor gatherings, and community activations.",
    includes: ["Venue sourcing", "Guest management", "Production & AV", "Post-event reporting"],
    cta: "Plan an Event",
    link: "/contact"
  },
  {
    icon: Briefcase,
    title: "Business Development",
    description: "Structured business development for developers and enterprise clients — partnerships, channel building, and pipeline growth.",
    includes: ["Market mapping", "Partnership outreach", "Deal pipelines", "Performance reporting"],
    cta: "Request Meeting",
    link: "/contact"
  },
  {
    icon: ClipboardCheck,
    title: "Project Management",
    description: "PMO-grade project management for real-estate initiatives — timelines, vendor coordination, and quality gates.",
    includes: ["Scope & timelines", "Vendor coordination", "Quality gates", "Executive reporting"],
    cta: "Request PMO",
    link: "/contact"
  },
  {
    icon: Sparkles,
    title: "Brand Development",
    description: "Brand identity and positioning for developers, family offices, and premium brokers — strategy, visual system, and rollout.",
    includes: ["Brand strategy", "Visual system", "Guidelines", "Launch rollout"],
    cta: "Start a Brand",
    link: "/contact"
  },
  {
    icon: MessageSquare,
    title: "Public Relations (PR)",
    description: "Editorial-grade PR and media relations — narrative building, journalist access, and reputation management.",
    includes: ["Narrative & angles", "Media relations", "Press releases", "Reputation monitoring"],
    cta: "Request PR",
    link: "/contact"
  },
  {
    icon: Building,
    title: "Commercial Leasing",
    description: "Commercial leasing advisory across Dubai — office, retail, F&B, and industrial — with tenant representation and negotiation.",
    includes: ["Requirement briefing", "Shortlist & tours", "Head-of-terms drafting", "Fit-out coordination"],
    cta: "Find Commercial Space",
    link: "/contact"
  },
  {
    icon: Key,
    title: "Property Management",
    description: "Operational support to protect your asset, reduce tenant friction, and keep occupancy stable — with structured reporting.",
    includes: ["Tenant coordination", "Maintenance handling", "Payment/renewal reminders", "Issue resolution"],
    cta: "Request Management",
    link: "/services/property-management"
  },
  {
    icon: Palmtree,
    title: "Holiday Homes",
    description: "Turnkey short-term rental operation — DTCM licensing, pricing, cleaning, guest messaging, and performance monitoring.",
    includes: ["DTCM licensing", "Dynamic pricing", "Housekeeping & linen", "Guest messaging"],
    cta: "Launch Holiday Home",
    link: "/services/short-term-rentals"
  },
  {
    icon: Wrench,
    title: "Snagging & Handover",
    description: "Structured, documented inspection to identify defects before you accept handover — with clear reporting and developer follow-up.",
    includes: ["Full unit inspection", "Defect documentation", "Snagging report", "Follow-up tracking"],
    cta: "Book Snagging",
    link: "/services/snagging"
  },
  {
    icon: FileText,
    title: "Conveyancing",
    description: "Independent conveyancing coordination for buyers and sellers — title checks, MOU, NOC, and DLD transfer handled cleanly.",
    includes: ["Title & liability check", "MOU drafting", "NOC & DLD transfer", "Escrow coordination"],
    cta: "Request Conveyancing",
    link: "/partners/legal"
  },
  {
    icon: Package,
    title: "Full Turnkey Solutions",
    description: "One coordinated program — buy, furnish, license, and operate — for investors who want a turnkey Dubai property experience.",
    includes: ["Acquisition + handover", "Furniture & fit-out", "Licensing & compliance", "Ongoing operations"],
    cta: "Request Turnkey",
    link: "/contact"
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
        className="relative grid place-items-center overflow-hidden min-h-[100svh] h-[100svh] w-full"
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
          className="relative z-10 mx-auto w-full max-w-5xl px-5 py-20 text-center flex min-h-[100svh] flex-col items-center justify-center"
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
            className="allow-white mx-auto text-center text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight"
            style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}
            variants={fadeInUp}
          >
            <span className="block">Explore JBJ</span>
            <span className="block">Services</span>
          </motion.h1>

          <motion.p
            data-no-contrast-guard
            className="allow-white text-base md:text-lg max-w-3xl mx-auto mb-0 text-center"
            style={{ color: "rgba(255,255,255,0.88)", WebkitTextFillColor: "rgba(255,255,255,0.88)" }}
            variants={fadeInUp}
          >
            A curated set of brokerage-adjacent services designed to simplify your property journey — delivered with premium coordination, clear process, and consistent standards.
          </motion.p>

          <motion.div variants={fadeInUp} className="flex flex-row flex-nowrap items-center justify-center gap-2.5 sm:gap-4 mt-28 md:mt-32 w-full">
            <Link
              to="/contact"
              data-no-contrast-guard
              className="jj-btn-ink-black inline-flex min-w-0 items-center justify-center gap-1.5 sm:gap-2 px-4 sm:px-7 py-3 sm:py-3.5 rounded-xl font-semibold text-[13px] sm:text-base whitespace-nowrap transition-transform hover:-translate-y-0.5"
            >
              <span>Request a Service</span>
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </Link>
            <Link
              to="/contact"
              data-no-contrast-guard
              className="jj-btn-ink-black inline-flex min-w-0 items-center justify-center gap-1.5 sm:gap-2 px-4 sm:px-7 py-3 sm:py-3.5 rounded-xl font-semibold text-[13px] sm:text-base whitespace-nowrap transition-transform hover:-translate-y-0.5"
            >
              <MessageSquare className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Contact Support</span>
            </Link>
          </motion.div>





        </motion.div>
      </section>




      {/* Service Cards Grid */}
      <section id="services-grid" data-surface="champagne" data-no-section-frame className="pt-16 pb-10 bg-[#F7F2EA]">
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
                className="max-w-2xl mx-auto text-center"
                style={{ color: "#1A1A1A", WebkitTextFillColor: "#1A1A1A" }}
              >
                Select a service to view the full process, requirements, and timelines.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-6 max-w-[1280px] mx-auto items-stretch">

              {serviceCards.map((service) => (
                <motion.div key={service.title} variants={fadeInUp} className="h-full">
                  <Link to={service.link} className="block h-full">
                    <Card className="jj-service-card-animated jj-card-inner transition-all group h-full min-h-[510px] flex flex-col">
                      <CardContent className="relative z-10 p-5 lg:p-6 flex h-full flex-col flex-1">
                        <div
                          data-surface="emerald"
                          data-no-contrast-guard
                          className="w-12 h-12 mb-4 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform"
                          style={{ background: "linear-gradient(135deg, #064E3B 0%, #042c1c 60%, #000000 100%)" }}
                        >
                          <service.icon className="w-6 h-6 allow-white" style={{ color: "#FFFFFF" }} />
                        </div>

                        <h3 className="font-semibold text-lg mb-2 min-h-[3.25rem] flex items-start" style={{ color: "#1A1A1A" }}>
                          {service.title}
                        </h3>
                        <p className="text-sm mb-4 min-h-[5.25rem]" style={{ color: "rgba(26,26,26,0.75)" }}>
                          {service.description}
                        </p>

                        <div className="bg-[#1A1A1A]/5 rounded-lg p-3 mb-4 min-h-[9.25rem]">
                          <p className="text-xs uppercase tracking-wider mb-2 font-semibold" style={{ color: "rgba(26,26,26,0.6)" }}>Includes</p>
                          <ul className="space-y-1">
                            {service.includes.map((item, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-xs" style={{ color: "rgba(26,26,26,0.85)" }}>
                                <CheckCircle data-no-contrast-guard className="jj-service-check w-3 h-3 flex-shrink-0 mt-0.5" style={{ color: "#064E3B" }} />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="mb-4 min-h-[1rem]" aria-hidden="true" />


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




      {/* Service Scope Clarification — light champagne card, ink text, emerald icons */}
      <section data-surface="champagne" data-no-section-frame className="pt-6 pb-10 bg-[#F7F2EA]">
        <div className="jj-layer-2">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="w-full px-4 sm:px-6 lg:px-8"
          >
            <motion.div className="text-center mb-8" variants={fadeInUp}>
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
                data-no-contrast-guard
                className="border shadow-xl overflow-hidden"
                style={{
                  background: "#FDFBF7",
                  borderColor: "rgba(6,78,59,0.15)",
                }}
              >
                <CardContent className="p-8" data-no-contrast-guard>
                  <p className="text-lg mb-8 text-center" style={{ color: "#1A1A1A" }}>
                    JBJ Global Real Estate is a licensed real estate brokerage authorized to buy, sell,
                    and rent properties in Dubai and the UAE.
                  </p>

                  <div className="grid md:grid-cols-2 gap-8">
                    {/* Our role includes */}
                    <div>
                      <h3 className="font-semibold text-lg mb-4 flex items-center gap-2" style={{ color: "#1A1A1A" }}>
                        <CheckCircle className="w-5 h-5" style={{ color: "#064E3B" }} />
                        Our role includes
                      </h3>
                      <ul className="space-y-3">
                        {scopeIncludes.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-3" style={{ color: "rgba(26,26,26,0.85)" }}>
                            <CheckCircle className="w-4 h-4 mt-1 flex-shrink-0" style={{ color: "#064E3B" }} />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* We do not provide */}
                    <div>
                      <h3 className="font-semibold text-lg mb-4 flex items-center gap-2" style={{ color: "#1A1A1A" }}>
                        <AlertCircle className="w-5 h-5" style={{ color: "#064E3B" }} />
                        We do not provide
                      </h3>
                      <ul className="space-y-3">
                        {scopeExcludes.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-3" style={{ color: "rgba(26,26,26,0.85)" }}>
                            <AlertCircle className="w-4 h-4 mt-1 flex-shrink-0" style={{ color: "#064E3B" }} />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t text-center" style={{ borderColor: "rgba(6,78,59,0.15)" }}>
                    <p className="text-sm" style={{ color: "rgba(26,26,26,0.7)" }}>
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

      {/* Footer Disclaimer — sits directly under the scope card */}
      <section data-surface="champagne" data-no-section-frame className="bg-[#F7F2EA] pt-2 pb-10">
        <div className="container mx-auto px-4 text-center">
          <p
            data-no-contrast-guard
            className="jj-disclaimer-card jj-emerald-border-animated text-sm max-w-3xl mx-auto rounded-2xl px-5 py-5"
            style={{ color: "#1A1A1A", WebkitTextFillColor: "#1A1A1A", background: "#FDFBF7" }}
          >
            JBJ Global Real Estate is a licensed real estate brokerage. Advisory support is provided
            within brokerage scope. Partner services are delivered independently under partner licenses.
          </p>
        </div>
      </section>

      {/* Not Sure Which Service — pushed to the very end, under the licensed-brokerage disclaimer */}
      <CombinedContactNewsletter
        id="not-sure-which-service"
        title="Not Sure Which Service You Need?"
        subtitle="Send one request and our team will route it to the right department."
        className="jj-band bg-[#F7F2EA] pt-6 pb-14"
      />



    </div>
  );
};

export default Services;