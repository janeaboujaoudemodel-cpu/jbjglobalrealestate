import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { 
  Building2, 
  TrendingUp, 
  UserCheck, 
  FileCheck, 
  ClipboardCheck,
  Users,
  ArrowRight,
  CheckCircle2,
  BarChart3,
  Shield,
  Home,
  Briefcase,
  Globe,
  Layers,
  HelpCircle,
  ArrowUpRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PremiumHeroButton } from "@/components/ui/premium-hero-button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SEOHead } from "@/components/SEOHead";

// Import hero video
import rentalAdvisoryHeroVideo from "@/assets/videos/dubai-rental-hero.mp4";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const advisoryServices = [
  {
    icon: BarChart3,
    title: "Rental Market Positioning",
    description: "We analyze current rental demand, comparable properties, and seasonal trends to position your property accurately in the market.",
    items: [
      "Area-specific rental benchmarking",
      "Unit-type demand analysis",
      "Furnished vs. unfurnished strategy",
      "Cheque structure optimization (1–12 cheques)"
    ]
  },
  {
    icon: TrendingUp,
    title: "Rental Yield & Income Strategy",
    description: "Rental decisions should support both income stability and long-term capital value.",
    items: [
      "Expected gross & net rental yield analysis",
      "Long-term vs. short-term leasing strategy",
      "Vacancy risk assessment",
      "Rent escalation planning within RERA limits"
    ]
  },
  {
    icon: UserCheck,
    title: "Tenant Qualification & Risk Control",
    description: "Selecting the right tenant is critical. We apply structured screening to protect your property and income stream.",
    items: [
      "Employment & income verification",
      "Visa & Emirates ID validation",
      "Previous landlord reference checks",
      "Lease suitability assessment"
    ]
  },
  {
    icon: FileCheck,
    title: "Lease Structuring & Compliance",
    description: "We ensure all leasing documentation complies fully with Dubai rental regulations.",
    items: [
      "Lease agreement review & structuring",
      "Ejari registration coordination",
      "RERA-compliant rent increase guidance",
      "Notice period & renewal advisory"
    ]
  },
  {
    icon: ClipboardCheck,
    title: "Handover & Move-In Advisory",
    description: "A clear handover reduces disputes and future maintenance issues.",
    items: [
      "Move-in condition checklist",
      "Inventory & meter documentation",
      "Key, access card & parking allocation",
      "Tenant onboarding coordination"
    ]
  }
];

const targetAudience = [
  { icon: Building2, label: "Landlords with single or multiple units" },
  { icon: TrendingUp, label: "Investors seeking rental income optimization" },
  { icon: Globe, label: "Overseas landlords managing remotely" },
  { icon: Home, label: "First-time landlords requiring guidance" },
  { icon: Layers, label: "Portfolio landlords with multiple assets" }
];

const whyJBJ = [
  "Licensed UAE brokerage",
  "Market-driven pricing methodology",
  "Strong tenant screening standards",
  "Transparent advisory process",
  "Aligned with long-term investor outcomes"
];

const RentalAdvisory = () => {
  return (
    <>
      <SEOHead
        title="Rental Advisory Services | JBJ Global Real Estate"
        description="Professional rental advisory for landlords and property investors in Dubai. Expert guidance from pricing strategy to tenant placement."
        canonicalPath="/services/rental-advisory"
      />

      {/* HERO SECTION - Full-screen with video background */}
      <section className="jj-hero-fullscreen relative flex items-center justify-center overflow-hidden">
        {/* Video Background */}
        <div className="absolute inset-0 bg-black">
          <video
            className="absolute inset-0 w-full h-full object-cover"
            src={rentalAdvisoryHeroVideo}
            muted
            playsInline
            autoPlay
            loop
            preload="metadata"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black" />
        </div>
        
        {/* Floating gold accent orbs */}
        <div className="absolute top-1/4 left-10 w-64 h-64 bg-gold/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-gold/15 rounded-full blur-[120px] pointer-events-none" />

        {/* Content */}
        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            {/* Label */}
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full mb-6 border border-gold/40 bg-black/30 backdrop-blur-md">
              <Briefcase className="w-4 h-4 text-gold" />
              <span className="text-gold font-semibold text-xs uppercase tracking-[0.2em]">
                Rental Advisory
              </span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-[-0.02em]">
              Rental Advisory Services
            </h1>
            
            <p className="text-zinc-300 text-base md:text-lg max-w-2xl mx-auto leading-relaxed mb-10">
              Maximize rental performance and minimize risk. Expert guidance from pricing strategy to tenant placement.
            </p>
            
            {/* Hero CTA Buttons - Using PremiumHeroButton for consistency */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <PremiumHeroButton href="/seller-listing">
                List Your Property
              </PremiumHeroButton>
              <PremiumHeroButton href="/contact?service=rental-advisory">
                Speak to an Advisor
              </PremiumHeroButton>
            </div>
          </motion.div>
        </div>
        
        {/* Scroll indicator */}
        <motion.div 
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.6 }}
        >
          <span className="text-gold/60 text-xs tracking-widest uppercase">Explore</span>
          <div className="w-[1px] h-12 bg-gradient-to-b from-gold/60 to-transparent" />
        </motion.div>
      </section>

      {/* What Rental Advisory Covers */}
      <section className="bg-black py-20">
        <div className="jj-layer-2">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="max-w-6xl mx-auto"
          >
            <motion.h2
              variants={fadeInUp}
              className="text-3xl md:text-4xl font-bold text-black text-center mb-12"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              What Rental Advisory Covers
            </motion.h2>
            
            <div className="space-y-6">
              {advisoryServices.map((service, index) => (
                <motion.div
                  key={index}
                  variants={fadeInUp}
                  className="jj-card-inner"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 w-12 h-12 bg-black border border-gold rounded-xl flex items-center justify-center">
                      <service.icon className="w-6 h-6 text-gold" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl md:text-2xl font-medium text-black mb-3">{service.title}</h3>
                      <p className="text-zinc-600 mb-4">{service.description}</p>
                      <ul className="space-y-2">
                        {service.items.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-3">
                            <CheckCircle2 className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" />
                            <span className="text-zinc-700 text-sm">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Who This Service Is For */}
      <section className="bg-black py-20">
        <div className="jj-layer-2">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="max-w-5xl mx-auto"
          >
            <motion.h2
              variants={fadeInUp}
              className="text-3xl md:text-4xl font-bold text-black text-center mb-12"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              Who This Service Is For
            </motion.h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {targetAudience.map((item, index) => (
                <motion.div
                  key={index}
                  variants={fadeInUp}
                  className="flex items-center gap-4 jj-card-inner !p-4"
                >
                  <div className="w-10 h-10 bg-black border border-gold/30 rounded-lg flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-5 h-5 text-gold" />
                  </div>
                  <span className="text-zinc-800 font-medium">{item.label}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Rental Advisory vs. Rental Management */}
      <section className="bg-black py-20">
        <div className="jj-layer-2">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="max-w-4xl mx-auto"
          >
            <motion.div variants={fadeInUp} className="flex justify-center mb-6">
              <div className="w-14 h-14 rounded-full bg-black flex items-center justify-center border-2 border-gold">
                <HelpCircle className="w-7 h-7 text-gold" />
              </div>
            </motion.div>
            <motion.h2
              variants={fadeInUp}
              className="text-3xl md:text-4xl font-bold text-black text-center mb-8"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              Rental Advisory vs. Rental Management
            </motion.h2>
            
            <motion.div
              variants={fadeInUp}
              className="jj-card-inner"
            >
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-gold flex-shrink-0 mt-1" />
                  <p className="text-zinc-700">
                    <span className="font-semibold text-black">Rental Advisory</span> focuses on strategic guidance and transaction execution.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-gold flex-shrink-0 mt-1" />
                  <p className="text-zinc-700">
                    If you require ongoing property management, we introduce licensed third-party partners where appropriate.
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Why JBJ Global Real Estate */}
      <section className="bg-black py-20">
        <div className="jj-layer-2">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="max-w-4xl mx-auto"
          >
            <motion.div variants={fadeInUp} className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-full bg-black flex items-center justify-center border-2 border-gold">
                <Shield className="w-8 h-8 text-gold" />
              </div>
            </motion.div>
            <motion.h2
              variants={fadeInUp}
              className="text-3xl md:text-4xl font-bold text-black text-center mb-8"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              Why JBJ Global Real Estate
            </motion.h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {whyJBJ.map((reason, index) => (
                <motion.div
                  key={index}
                  variants={fadeInUp}
                  className="flex items-center gap-4 jj-card-inner !p-4"
                >
                  <CheckCircle2 className="w-5 h-5 text-gold flex-shrink-0" />
                  <span className="text-zinc-800">{reason}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-black py-20">
        <div className="jj-layer-2">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="max-w-3xl mx-auto text-center"
          >
            <motion.h2 
              variants={fadeInUp}
              className="text-3xl md:text-4xl font-bold text-black mb-6"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              Start Your Rental Advisory
            </motion.h2>
            
            <motion.p 
              variants={fadeInUp}
              className="text-lg text-zinc-700 mb-10"
            >
              Whether you're leasing a single unit or managing a portfolio, our advisory ensures your rental performs efficiently and compliantly.
            </motion.p>
            
            <motion.div variants={fadeInUp} className="flex flex-wrap justify-center gap-4">
              <Button 
                asChild
                size="lg"
                className="bg-gold hover:bg-gold-dark text-black font-semibold px-8 whitespace-nowrap"
              >
                <Link to="/seller-listing" className="inline-flex items-center gap-2">
                  <span>List Your Property for Rent</span>
                  <ArrowRight className="w-5 h-5 flex-shrink-0" />
                </Link>
              </Button>
              <Button 
                asChild
                size="lg"
                variant="outline"
                className="border-gold text-gold hover:bg-gold/10"
              >
                <Link to="/contact?service=rental-advisory">
                  Request Rental Advisory Consultation
                </Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* INTERNAL LINKS */}
      <section className="bg-black py-12 border-t border-gold/20">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-6 text-sm">
            <Link
              to="/landlord-guide"
              className="text-zinc-400 hover:text-gold transition-colors"
            >
              Landlord Guide
            </Link>
            <Link
              to="/tenant-guide"
              className="text-zinc-400 hover:text-gold transition-colors"
            >
              Tenant Guide
            </Link>
            <Link
              to="/market-intelligence"
              className="text-zinc-400 hover:text-gold transition-colors"
            >
              Market Intelligence
            </Link>
            <Link
              to="/contact"
              className="text-zinc-400 hover:text-gold transition-colors"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </>
  );
};

export default RentalAdvisory;
