import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Briefcase, Users, Building2, TrendingUp, Key, Globe,
  ArrowRight, CheckCircle, ChevronRight, MessageSquare, Phone
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
    description: "Professional buyer representation for off-plan and ready properties.",
    link: "/services/buying-advisory"
  },
  {
    icon: Key,
    title: "Selling Advisory",
    description: "Strategic pricing, positioning, and execution for owners selling in the UAE.",
    link: "/services/selling-advisory"
  },
  {
    icon: Building2,
    title: "Rental Advisory",
    description: "Landlord-focused leasing support from pricing to tenant onboarding.",
    link: "/services/rental-advisory"
  },
  {
    icon: TrendingUp,
    title: "Investment Advisory",
    description: "Data-driven investment strategy and portfolio decision support.",
    link: "/services/investment-advisory"
  },
  {
    icon: Users,
    title: "Partner Introductions",
    description: "Introductions to licensed partners for legal, mortgage, and specialist support.",
    link: "/partners"
  },
  {
    icon: Globe,
    title: "Golden Visa Guide",
    description: "Long-term residency pathway through qualifying real estate investment.",
    link: "/guides/golden-visa-uae"
  }
];

// How to choose the right service
const serviceGuide = [
  { need: "Buying a home or investment", service: "Buying Advisory" },
  { need: "Selling an asset", service: "Selling Advisory" },
  { need: "Renting out your property", service: "Rental Advisory" },
  { need: "Building a portfolio", service: "Investment Advisory" },
  { need: "Need legal/mortgage support", service: "Partner Introductions" }
];

const Services = () => {
  return (
    <div className="min-h-screen bg-black">
      <SEOHead 
        title="Explore Our Services | JBJ Global Real Estate"
        description="JBJ Global Real Estate provides licensed brokerage advisory across Buy · Sell · Rent, supported by market intelligence and disciplined execution."
        keywords="Dubai real estate services, buying advisory, selling advisory, rental advisory, investment advisory, partner introductions, golden visa"
        canonicalPath="/services"
      />

      {/* Hero Section with Video */}
      <section className="relative min-h-[60vh] flex items-center overflow-hidden">
        {/* Background Video */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-30"
        >
          <source src={servicesHeroVideo} type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-900/50 via-black/70 to-black" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gold/5 via-transparent to-transparent" />
        
        <motion.div 
          className="relative z-10 container mx-auto px-4 py-32 text-center"
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
              Professional Advisory
            </span>
          </motion.div>

          <motion.h1 
            className="text-white text-4xl md:text-5xl lg:text-6xl font-bold mb-6 max-w-4xl mx-auto"
            style={{ fontFamily: "Poppins, sans-serif" }}
            variants={fadeInUp}
          >
            Explore Our Services
          </motion.h1>

          <motion.p 
            className="text-zinc-300 text-lg md:text-xl max-w-3xl mx-auto mb-8"
            variants={fadeInUp}
          >
            JBJ Global Real Estate provides licensed brokerage advisory across Buy · Sell · Rent, 
            supported by market intelligence and disciplined execution. Choose the service that 
            matches your objective, then proceed with a structured consultation.
          </motion.p>

          <motion.div 
            className="flex flex-col sm:flex-row gap-4 justify-center"
            variants={fadeInUp}
          >
            <Button variant="primary" size="lg" asChild>
              <Link to="/contact">
                <MessageSquare className="w-5 h-5 mr-2" />
                Speak with an Advisor
              </Link>
            </Button>
            <Button variant="secondary" size="lg" asChild>
              <Link to="/guides">
                View Guides
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
            </Button>
          </motion.div>
        </motion.div>
      </section>

      {/* Service Cards Grid */}
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
                Advisory Services
              </span>
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-black" style={{ fontFamily: "Poppins, sans-serif" }}>
                Choose Your Path
              </h2>
              <p className="text-black/70 max-w-2xl mx-auto">
                Select the service that aligns with your real estate objectives.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {serviceCards.map((service) => (
                <motion.div key={service.title} variants={fadeInUp}>
                  <Link to={service.link}>
                    <Card className="jj-card-inner hover:border-gold transition-all group h-full flex flex-col">
                      <CardContent className="p-6 flex flex-col flex-1">
                        <div className="jj-icon-box-active w-12 h-12 mb-4 group-hover:scale-110 transition-transform">
                          <service.icon className="w-6 h-6" />
                        </div>
                        <h3 className="text-black font-semibold text-lg mb-2 group-hover:text-gold transition-colors">
                          {service.title}
                        </h3>
                        <p className="text-black/70 text-sm mb-4 flex-1">
                          {service.description}
                        </p>
                        <div className="flex items-center gap-1 text-gold text-sm font-medium mt-auto pt-4 border-t border-gold/20">
                          Learn More
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

      {/* How to Choose the Right Service */}
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
                Quick Guide
              </span>
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-black" style={{ fontFamily: "Poppins, sans-serif" }}>
                How to Choose the Right Service
              </h2>
            </motion.div>

            <motion.div 
              className="max-w-2xl mx-auto"
              variants={fadeInUp}
            >
              <Card className="jj-card-inner">
                <CardContent className="p-8">
                  <ul className="space-y-4">
                    {serviceGuide.map((item, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                        <span className="text-black/80">
                          <span className="font-medium text-black">{item.need}</span>
                          {" → "}
                          <span className="text-gold font-semibold">{item.service}</span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-16 bg-black">
        <div className="jj-layer-2">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="text-center"
          >
            <motion.div variants={fadeInUp}>
              <span className="text-gold text-xs uppercase tracking-[0.3em] mb-4 block">
                Get Started
              </span>
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-black" style={{ fontFamily: "Poppins, sans-serif" }}>
                Request a Consultation
              </h2>
              <p className="text-black/70 max-w-2xl mx-auto mb-8">
                If you want a structured recommendation, request a consultation and we will 
                route you to the correct advisory path.
              </p>
            </motion.div>

            <motion.div 
              className="flex flex-col sm:flex-row gap-4 justify-center"
              variants={fadeInUp}
            >
              <Button variant="primary" size="lg" asChild>
                <Link to="/contact">
                  <MessageSquare className="w-5 h-5 mr-2" />
                  Request Consultation
                </Link>
              </Button>
              <Button variant="secondary" size="lg" asChild>
                <Link to="/contact">
                  <Phone className="w-5 h-5 mr-2" />
                  Contact Us
                </Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Services;
