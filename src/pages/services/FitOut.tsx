import { Link } from "react-router-dom";
import VideoBackground from "@/components/VideoBackground";
import { motion } from "framer-motion";
import { 
  Hammer, Wrench, Shield, Clock, Award, Users,
  ChevronLeft, ArrowRight, CheckCircle
} from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { PremiumHeroButton } from "@/components/ui/premium-hero-button";
import { Card, CardContent } from "@/components/ui/card";
import { CONTACT_INFO } from "@/constants/stats";
import fitOutHeroVideo from "@/assets/videos/fit-out-hero.mp4";

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

// Split title helper
const SplitTitle = ({ text }: { text: string }) => {
  const words = text.split(' ');
  const firstWord = words[0];
  const restWords = words.slice(1).join(' ');
  
  return (
    <span className="jj-title-split">
      <span>{firstWord}</span>{restWords && <span> {restWords}</span>}
    </span>
  );
};

const services = [
  {
    icon: Hammer,
    title: "Full Fit-Out",
    description: "Complete transformation of shell and core spaces into functional environments.",
    features: ["MEP Works", "Flooring", "Ceiling Systems", "Joinery"]
  },
  {
    icon: Wrench,
    title: "Renovation",
    description: "Upgrade and refresh existing spaces to meet modern standards.",
    features: ["Structural Changes", "System Upgrades", "Finish Updates", "Layout Changes"]
  },
  {
    icon: Shield,
    title: "Commercial Fit-Out",
    description: "Professional office and retail space development and customization.",
    features: ["Office Spaces", "Retail Shops", "Restaurants", "Showrooms"]
  },
  {
    icon: Clock,
    title: "Fast-Track Projects",
    description: "Accelerated delivery for time-sensitive projects without compromising quality.",
    features: ["Rapid Execution", "24/7 Teams", "Phased Delivery", "Minimal Disruption"]
  }
];

const whyChooseUs = [
  {
    icon: Award,
    title: "Licensed Contractors",
    description: "Fully licensed and insured professionals"
  },
  {
    icon: Users,
    title: "Expert Teams",
    description: "Skilled craftsmen and project managers"
  },
  {
    icon: Shield,
    title: "Quality Guarantee",
    description: "Warranty on all workmanship"
  },
  {
    icon: Clock,
    title: "On-Time Delivery",
    description: "Commitment to project timelines"
  }
];

const FitOut = () => {
  return (
    <div className="min-h-screen bg-black">
      <SEOHead 
        title="Fit-Out & Renovation Dubai | Commercial & Residential | JBJ GLOBAL REAL ESTATE"
        description="Professional fit-out and renovation services in Dubai. Full fit-out, renovations, commercial spaces, and fast-track projects. Licensed contractors with quality guarantee."
        keywords="Dubai fit-out, renovation Dubai, office fit-out, commercial renovation, residential renovation Dubai"
        canonicalPath="/services/fit-out"
      />

      {/* Hero Section - Bright Video Background */}
      <section className="jj-hero-fullscreen relative flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <VideoBackground 
            src={fitOutHeroVideo}
            poster="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1920&q=80"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/50 to-black" />
        </div>
        
        <motion.div 
          className="relative z-10 container mx-auto px-4 py-32"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <motion.div variants={fadeInUp}>
            <Link 
              to="/services/design-build" 
              className="inline-flex items-center gap-2 text-gold hover:text-white transition-colors mb-6"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to Design & Build
            </Link>
          </motion.div>

          <motion.div 
            className="flex items-center gap-2 mb-6"
            variants={fadeInUp}
          >
            <Hammer className="w-6 h-6 text-gold" />
            <span className="text-gold text-sm uppercase tracking-[0.3em]">
              Partner Network
            </span>
          </motion.div>

          <motion.h1 
            className="text-white text-4xl md:text-5xl lg:text-6xl font-bold mb-6 max-w-4xl"
            style={{ fontFamily: "Poppins, sans-serif" }}
            variants={fadeInUp}
          >
            Fit-Out & Renovation
          </motion.h1>

          <motion.p 
            className="text-zinc-300 text-base md:text-lg max-w-2xl mb-10"
            variants={fadeInUp}
          >
            Quality fit-out and renovation services by licensed contractors. 
            Transform your space with expert craftsmanship.
          </motion.p>

          <motion.div variants={fadeInUp}>
            <PremiumHeroButton href={CONTACT_INFO.inquiryFormUrl} icon={ArrowRight}>
              Get a Quote
            </PremiumHeroButton>
          </motion.div>
        </motion.div>
      </section>

      {/* Services - 3-Layer System */}
      <section className="py-16 bg-black">
        <div className="jj-layer-2">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.div className="text-center mb-12" variants={fadeInUp}>
              <span className="text-gold text-xs uppercase tracking-[0.3em] mb-4 block">
                Our Services
              </span>
              <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ fontFamily: "Poppins, sans-serif" }}>
                <SplitTitle text="Fit-Out Solutions" />
              </h2>
              <p className="text-black/70 max-w-2xl mx-auto">
                Comprehensive fit-out and renovation services for all project types.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-6">
              {services.map((service) => (
                <motion.div key={service.title} variants={fadeInUp}>
                  <Card className="jj-card-inner hover:border-gold transition-all group h-full">
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="jj-icon-box-active w-14 h-14 flex-shrink-0 group-hover:scale-110 transition-transform">
                          <service.icon className="w-7 h-7" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-black font-semibold text-xl mb-2 group-hover:text-gold transition-colors">
                            {service.title}
                          </h3>
                          <p className="text-black/70 text-sm mb-4">
                            {service.description}
                          </p>
                          <div className="grid grid-cols-2 gap-2">
                            {service.features.map((feature) => (
                              <div key={feature} className="flex items-center gap-2 text-xs text-black/60">
                                <CheckCircle className="w-3 h-3 text-gold flex-shrink-0" />
                                {feature}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Why Choose Us - 3-Layer System */}
      <section className="py-16 bg-black">
        <div className="jj-layer-2">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.div className="text-center mb-12" variants={fadeInUp}>
              <span className="text-gold text-xs uppercase tracking-[0.3em] mb-4 block">
                Our Advantage
              </span>
              <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ fontFamily: "Poppins, sans-serif" }}>
                <SplitTitle text="Why Choose Us" />
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {whyChooseUs.map((item) => (
                <motion.div key={item.title} variants={fadeInUp}>
                  <Card className="jj-card-inner h-full">
                    <CardContent className="p-6 text-center">
                      <div className="jj-icon-box-active w-16 h-16 rounded-full mx-auto mb-4">
                        <item.icon className="w-8 h-8" />
                      </div>
                      <h3 className="text-black font-semibold text-lg mb-2">
                        {item.title}
                      </h3>
                      <p className="text-black/70 text-sm">
                        {item.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section - 3-Layer System */}
      <section className="py-16 bg-black">
        <div className="jj-layer-2">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="text-center"
          >
            <div className="jj-card-inner rounded-2xl p-8 md:p-12 max-w-3xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-bold mb-4" style={{ fontFamily: "Poppins, sans-serif" }}>
                <SplitTitle text="Start Your Project" />
              </h2>
              <p className="text-black/70 mb-8 max-w-xl mx-auto">
                Ready to transform your space? Get a detailed quote from our 
                licensed fit-out contractors.
              </p>
              <Button variant="primary" size="lg" asChild>
                <a href={CONTACT_INFO.inquiryFormUrl} target="_blank" rel="noopener noreferrer">
                  <span className="text-black">Request</span><span className="text-gold"> Quote</span>
                  <ArrowRight className="w-5 h-5 ml-2" />
                </a>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default FitOut;
