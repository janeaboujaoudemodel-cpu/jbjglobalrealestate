import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Briefcase, Users, Building2, TrendingUp, Key, Globe,
  ArrowRight, CheckCircle, ChevronRight, MessageSquare, AlertCircle
} from "lucide-react";
import Footer from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import servicesHeroVideo from "@/assets/videos/services-hero.mp4";

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

// Service cards data - exactly as specified
const serviceCards = [
  {
    icon: Briefcase,
    title: "Buying Advisory",
    description: "Guidance and coordination for buyers navigating off-plan and ready properties across the UAE.",
    includes: [
      "Market navigation",
      "Property shortlisting",
      "Viewing coordination",
      "Transaction process support"
    ],
    cta: "Explore Buying Advisory",
    link: "/services/buying-advisory"
  },
  {
    icon: Key,
    title: "Selling Advisory",
    description: "Structured resale support for owners and investors listing properties in the secondary market.",
    includes: [
      "Pricing strategy",
      "Listing preparation",
      "Buyer qualification",
      "Sale coordination"
    ],
    cta: "Explore Selling Advisory",
    link: "/services/selling-advisory"
  },
  {
    icon: Building2,
    title: "Rental Advisory",
    description: "Professional leasing support for landlords and tenants, from listing to contract execution.",
    includes: [
      "Rental pricing guidance",
      "Listing & tenant coordination",
      "Offer negotiation support",
      "Lease process assistance"
    ],
    cta: "Explore Rental Advisory",
    link: "/services/rental-advisory"
  },
  {
    icon: TrendingUp,
    title: "Investment Advisory",
    description: "Data-driven real estate investment guidance aligned with investor objectives, timelines, and risk profiles.",
    includes: [
      "Market intelligence",
      "Project comparison",
      "Portfolio structuring logic",
      "Long-term strategy support"
    ],
    cta: "Explore Investment Advisory",
    link: "/services/investment-advisory"
  },
  {
    icon: Users,
    title: "Partner Introductions",
    description: "Introductions to independent, licensed third-party professionals where required.",
    includes: [
      "Mortgage specialists",
      "Legal conveyancing firms",
      "Visa & residency consultants",
      "Property management providers"
    ],
    note: "Services are provided by independent licensed partners. Clients contract directly with partners under their own terms.",
    cta: "View Partner Network",
    link: "/partners"
  },
  {
    icon: Globe,
    title: "Golden Visa Guidance",
    description: "Guidance on property-based Golden Visa eligibility and application coordination.",
    includes: [
      "Eligibility overview",
      "Qualifying property criteria",
      "Application process explanation",
      "Partner coordination (where applicable)"
    ],
    cta: "View Golden Visa Guide",
    link: "/guides/golden-visa-uae"
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
    <div className="min-h-screen bg-black">
      <SEOHead 
        title="Real Estate Services | JBJ Global Real Estate"
        description="Licensed brokerage support across buying, selling, leasing, and investment — with clear scope, transparency, and expert coordination."
        keywords="Dubai real estate services, buying advisory, selling advisory, rental advisory, investment advisory, partner introductions, golden visa"
        canonicalPath="/services"
      />

      {/* Hero Section with Video */}
      <section className="relative min-h-[70vh] flex items-center overflow-hidden">
        {/* Background Video */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-40"
        >
          <source src={servicesHeroVideo} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-900/40 via-black/60 to-black" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gold/5 via-transparent to-transparent" />
        
        <motion.div 
          className="relative z-10 container mx-auto px-4 py-32 text-center max-w-4xl"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <motion.div 
            className="flex items-center justify-center gap-2 mb-6"
            variants={fadeInUp}
          >
            <Briefcase className="w-6 h-6 text-gold" />
            <span className="text-gold text-sm uppercase tracking-[0.3em]">
              Services
            </span>
          </motion.div>

          <motion.h1 
            className="text-white text-4xl md:text-5xl lg:text-6xl font-bold mb-6"
            style={{ fontFamily: "Poppins, sans-serif" }}
            variants={fadeInUp}
          >
            Real Estate Services, Structured for Clarity
          </motion.h1>

          <motion.p 
            className="text-zinc-300 text-lg md:text-xl mb-4"
            variants={fadeInUp}
          >
            Licensed brokerage support across buying, selling, leasing, and investment — 
            with clear scope, transparency, and expert coordination.
          </motion.p>

          <motion.p 
            className="text-zinc-400 text-base mb-10"
            variants={fadeInUp}
          >
            Every service is delivered within our licensed brokerage framework or through 
            independent, licensed partners where required.
          </motion.p>

          <motion.div variants={fadeInUp}>
            <Button variant="primary" size="lg" asChild>
              <a href="#services-grid">
                Explore Our Services
                <ArrowRight className="w-5 h-5 ml-2" />
              </a>
            </Button>
          </motion.div>
        </motion.div>
      </section>

      {/* Service Cards Grid */}
      <section id="services-grid" className="py-20 bg-black">
        <div className="jj-layer-2">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="w-full px-4 sm:px-6 lg:px-8"
          >
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
              {serviceCards.map((service) => (
                <motion.div key={service.title} variants={fadeInUp}>
                  <Link to={service.link} className="block h-full">
                    <Card className="jj-card-inner hover:border-gold transition-all group h-full flex flex-col">
                      <CardContent className="p-6 flex flex-col flex-1">
                        <div className="jj-icon-box-active w-12 h-12 mb-4 group-hover:scale-110 transition-transform">
                          <service.icon className="w-6 h-6" />
                        </div>
                        <h3 className="text-black font-semibold text-xl mb-3 group-hover:text-gold transition-colors">
                          {service.title}
                        </h3>
                        <p className="text-black/70 text-sm mb-4">
                          {service.description}
                        </p>
                        
                        {/* Includes list */}
                        <div className="bg-black/5 rounded-lg p-4 mb-4 flex-1">
                          <p className="text-xs text-black/50 uppercase tracking-wider mb-2 font-medium">Includes</p>
                          <ul className="space-y-2">
                            {service.includes.map((item, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-sm text-black/80">
                                <CheckCircle className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" />
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        
                        {/* Partner note if applicable */}
                        {service.note && (
                          <div className="bg-gold/10 rounded-lg p-3 mb-4 border border-gold/20">
                            <p className="text-xs text-black/60 italic">
                              {service.note}
                            </p>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-1 text-gold text-sm font-medium mt-auto pt-4 border-t border-gold/20">
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

      {/* Service Scope Clarification */}
      <section className="py-20 bg-black">
        <div className="jj-layer-2">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="w-full px-4 sm:px-6 lg:px-8"
          >
            <motion.div className="text-center mb-12" variants={fadeInUp}>
              <span className="text-gold text-xs uppercase tracking-[0.3em] mb-4 block">
                Service Scope
              </span>
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-black" style={{ fontFamily: "Poppins, sans-serif" }}>
                How Our Services Work
              </h2>
            </motion.div>

            <motion.div 
              className="max-w-4xl mx-auto"
              variants={fadeInUp}
            >
              <Card className="jj-card-inner">
                <CardContent className="p-8">
                  <p className="text-black/80 text-lg mb-8 text-center">
                    JBJ Global Real Estate is a licensed real estate brokerage authorized to buy, sell, 
                    and rent properties in Dubai and the UAE.
                  </p>
                  
                  <div className="grid md:grid-cols-2 gap-8">
                    {/* Our role includes */}
                    <div>
                      <h3 className="text-black font-semibold text-lg mb-4 flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-gold" />
                        Our role includes
                      </h3>
                      <ul className="space-y-3">
                        {scopeIncludes.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-3 text-black/70">
                            <span className="text-gold">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    
                    {/* We do not provide */}
                    <div>
                      <h3 className="text-black font-semibold text-lg mb-4 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-zinc-500" />
                        We do not provide
                      </h3>
                      <ul className="space-y-3">
                        {scopeExcludes.map((item, idx) => (
                          <li key={idx} className="flex items-start gap-3 text-black/70">
                            <span className="text-zinc-400">•</span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  
                  <div className="mt-8 pt-6 border-t border-gold/20 text-center">
                    <p className="text-black/60 text-sm">
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

      {/* Final CTA Section */}
      <section className="py-20 bg-black">
        <div className="jj-layer-2">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="text-center w-full px-4 sm:px-6 lg:px-8"
          >
            <motion.div variants={fadeInUp}>
              <span className="text-gold text-xs uppercase tracking-[0.3em] mb-4 block">
                Get Started
              </span>
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-black" style={{ fontFamily: "Poppins, sans-serif" }}>
                Not Sure Which Service You Need?
              </h2>
              <p className="text-black/70 max-w-2xl mx-auto mb-8">
                Our team will guide you to the correct service based on your objective — 
                buying, selling, leasing, or investing.
              </p>
            </motion.div>

            <motion.div variants={fadeInUp}>
              <Button variant="primary" size="lg" asChild>
                <Link to="/contact">
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Request a Consultation
                </Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer Disclaimer */}
      <section className="bg-black py-8 border-t border-zinc-800">
        <div className="container mx-auto px-4 text-center">
          <p className="text-zinc-500 text-sm max-w-3xl mx-auto">
            JBJ Global Real Estate is a licensed real estate brokerage. Advisory support is provided 
            within brokerage scope. Partner services are delivered independently under partner licenses.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Services;
