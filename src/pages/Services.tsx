import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Home, Building2, Key, FileText, Scale, Landmark, 
  PenTool, Hammer, Briefcase, Users, Shield, Award,
  ArrowRight, CheckCircle, Sparkles, Building, ChevronRight,
  Brain, Ruler, Palette, Cpu
} from "lucide-react";
import Footer from "@/components/Footer";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CONTACT_INFO } from "@/constants/stats";

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

const coreServices = [
  {
    icon: Home,
    title: "Buy Property",
    description: "Find your dream home or investment property with expert guidance through Dubai's dynamic real estate market.",
    link: "/guides/buyers",
    features: ["Market Analysis", "Property Tours", "Negotiation Support", "Due Diligence"]
  },
  {
    icon: Key,
    title: "Sell Property",
    description: "Maximize your property's value with our comprehensive marketing and sales strategies.",
    link: "/guides/sellers",
    features: ["Property Valuation", "Marketing Strategy", "Buyer Screening", "Closing Support"]
  },
  {
    icon: Building2,
    title: "Rent Property",
    description: "Whether you're a landlord or tenant, we streamline the rental process for optimal results.",
    link: "/guides/rentals",
    features: ["Tenant Matching", "Lease Management", "Property Maintenance", "Rent Collection"]
  },
  {
    icon: FileText,
    title: "Property Management",
    description: "Complete property management solutions to protect and grow your real estate investments.",
    link: "/guides/property-management",
    features: ["24/7 Support", "Maintenance Coordination", "Financial Reporting", "Tenant Relations"]
  }
];

const specializedServices = [
  {
    icon: Scale,
    title: "Legal Services",
    description: "Comprehensive legal support for all your real estate transactions and disputes.",
    link: "/services/legal",
    badge: "Legal Division"
  },
  {
    icon: Landmark,
    title: "Mortgage Advisory",
    description: "Expert mortgage guidance to secure the best financing for your property.",
    link: "/services/mortgage",
    badge: "Financial Services"
  },
  {
    icon: PenTool,
    title: "Design & Build",
    description: "Transform spaces with our architecture, interior design, and construction partners.",
    link: "/services/design-build",
    badge: "Partner Network"
  },
  {
    icon: Hammer,
    title: "Renovation Services",
    description: "Quality renovation and fit-out services to enhance your property's value.",
    link: "/services/fit-out",
    badge: "Partner Network"
  }
];

const aiTools = [
  {
    icon: Brain,
    title: "AI Interior Designer",
    description: "Visualize your space with AI-powered interior design concepts.",
    link: "/tools/interior-ai"
  },
  {
    icon: Ruler,
    title: "AI Property Measurement",
    description: "Accurate property measurements using advanced AI technology.",
    link: "/tools/property-measurement"
  },
  {
    icon: Palette,
    title: "AI Home Finder",
    description: "Find your perfect property match with our intelligent recommendation system.",
    link: "/quiz"
  },
  {
    icon: Cpu,
    title: "Market Intelligence",
    description: "Data-driven insights powered by official government Open Data.",
    link: "/market-intelligence"
  }
];

const whyChooseUs = [
  {
    icon: Award,
    title: "15+ Years Experience",
    description: "Deep expertise in Dubai's real estate market"
  },
  {
    icon: Users,
    title: "Dedicated Team",
    description: "Personalized service from licensed professionals"
  },
  {
    icon: Shield,
    title: "Trusted Partner",
    description: "Transparent dealings with verified track record"
  },
  {
    icon: Building,
    title: "Premium Portfolio",
    description: "Access to exclusive off-market properties"
  }
];

const Services = () => {
  return (
    <div className="min-h-screen bg-black">
      <SEOHead 
        title="Real Estate Services Dubai | Buy, Sell, Rent | JBJ GLOBAL REAL ESTATE"
        description="Comprehensive real estate services in Dubai. Property sales, rentals, management, legal support, mortgage advisory, and design services. Expert guidance for all your property needs."
        keywords="Dubai real estate services, property management Dubai, buy property Dubai, sell property Dubai, rent Dubai, legal services real estate"
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
          <source src="/videos/hero-video.mp4" type="video/mp4" />
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
              Full-Service Brokerage
            </span>
          </motion.div>

          <motion.h1 
            className="text-white text-4xl md:text-5xl lg:text-6xl font-bold mb-6 max-w-4xl mx-auto"
            style={{ fontFamily: "Poppins, sans-serif" }}
            variants={fadeInUp}
          >
            Our Services
          </motion.h1>

          <motion.p 
            className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto mb-8"
            variants={fadeInUp}
          >
            Comprehensive real estate solutions tailored to your unique needs. 
            From buying and selling to legal support and design services.
          </motion.p>

          <motion.div variants={fadeInUp}>
            <Button variant="hero" size="lg" asChild>
              <a href={CONTACT_INFO.inquiryFormUrl} target="_blank" rel="noopener noreferrer">
                <Sparkles className="w-5 h-5 mr-2" />
                <span>Get Started</span>
                <ArrowRight className="w-5 h-5 ml-2" />
              </a>
            </Button>
          </motion.div>
        </motion.div>
      </section>

      {/* Core Services - 3-Layer System */}
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
                Core Services
              </span>
              <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ fontFamily: "Poppins, sans-serif" }}>
                <SplitTitle text="Buy · Sell · Rent" />
              </h2>
              <p className="text-black/70 max-w-2xl mx-auto">
                Expert guidance through every step of your real estate journey in Dubai.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {coreServices.map((service, index) => (
                <motion.div key={service.title} variants={fadeInUp}>
                  <Link to={service.link}>
                    <Card className="jj-card-inner hover:border-white transition-all group h-full">
                      <CardContent className="p-6">
                        <div className="w-12 h-12 rounded-xl bg-black flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                          <service.icon className="w-6 h-6 text-gold" />
                        </div>
                        <h3 className="text-black font-semibold text-lg mb-2 group-hover:text-gold transition-colors">
                          {service.title}
                        </h3>
                        <p className="text-black/70 text-sm mb-4">
                          {service.description}
                        </p>
                        <ul className="space-y-2">
                          {service.features.map((feature) => (
                            <li key={feature} className="flex items-center gap-2 text-xs text-black/60">
                              <CheckCircle className="w-3 h-3 text-gold" />
                              {feature}
                            </li>
                          ))}
                        </ul>
                        <div className="mt-4 flex items-center gap-1 text-gold text-sm font-medium">
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

      {/* Specialized Services - 3-Layer System */}
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
                Extended Services
              </span>
              <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ fontFamily: "Poppins, sans-serif" }}>
                <SplitTitle text="Specialized Solutions" />
              </h2>
              <p className="text-black/70 max-w-2xl mx-auto">
                Comprehensive support services to complement your real estate needs.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {specializedServices.map((service, index) => (
                <motion.div key={service.title} variants={fadeInUp}>
                  <Link to={service.link}>
                    <Card className="jj-card-inner hover:border-white transition-all group h-full">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="w-12 h-12 rounded-xl bg-black flex items-center justify-center group-hover:scale-110 transition-transform">
                            <service.icon className="w-6 h-6 text-gold" />
                          </div>
                          <span className="text-[10px] uppercase tracking-wider text-gold bg-black/10 px-2 py-1 rounded">
                            {service.badge}
                          </span>
                        </div>
                        <h3 className="text-black font-semibold text-lg mb-2 group-hover:text-gold transition-colors">
                          {service.title}
                        </h3>
                        <p className="text-black/70 text-sm mb-4">
                          {service.description}
                        </p>
                        <div className="flex items-center gap-1 text-gold text-sm font-medium">
                          Explore
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

      {/* AI Tools Section - 3-Layer System */}
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
                Innovation
              </span>
              <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ fontFamily: "Poppins, sans-serif" }}>
                <SplitTitle text="AI-Powered Tools" />
              </h2>
              <p className="text-black/70 max-w-2xl mx-auto">
                Leverage cutting-edge technology for smarter real estate decisions.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {aiTools.map((tool, index) => (
                <motion.div key={tool.title} variants={fadeInUp}>
                  <Link to={tool.link}>
                    <Card className="jj-card-inner hover:border-white transition-all group h-full">
                      <CardContent className="p-6">
                        <div className="w-12 h-12 rounded-xl bg-black flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                          <tool.icon className="w-6 h-6 text-gold" />
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles className="w-4 h-4 text-gold" />
                          <span className="text-[10px] uppercase tracking-wider text-gold">AI-Powered</span>
                        </div>
                        <h3 className="text-black font-semibold text-lg mb-2 group-hover:text-gold transition-colors">
                          {tool.title}
                        </h3>
                        <p className="text-black/70 text-sm mb-4">
                          {tool.description}
                        </p>
                        <div className="flex items-center gap-1 text-gold text-sm font-medium">
                          Try Now
                          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>

            <motion.div className="text-center mt-10" variants={fadeInUp}>
              <Button variant="primary" asChild>
                <Link to="/ai-hub">
                  <Sparkles className="w-5 h-5 mr-2" />
                  <span className="text-black">Explore More</span><span className="text-gold"> AI Tools</span>
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </Button>
            </motion.div>
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
                <SplitTitle text="Why Choose JBJ" />
              </h2>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {whyChooseUs.map((item, index) => (
                <motion.div key={item.title} variants={fadeInUp}>
                  <Card className="jj-card-inner h-full">
                    <CardContent className="p-6 text-center">
                      <div className="w-16 h-16 rounded-full bg-black flex items-center justify-center mx-auto mb-4">
                        <item.icon className="w-8 h-8 text-gold" />
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
                <SplitTitle text="Ready to Get Started?" />
              </h2>
              <p className="text-black/70 mb-8 max-w-xl mx-auto">
                Whether you're buying, selling, or renting, our team is here to provide 
                personalized guidance every step of the way.
              </p>
              <div className="flex flex-wrap justify-center gap-4">
                <Button variant="primary" size="lg" asChild>
                  <a href={CONTACT_INFO.inquiryFormUrl} target="_blank" rel="noopener noreferrer">
                    <span className="text-black">Schedule</span><span className="text-gold"> Consultation</span>
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </a>
                </Button>
                <Button variant="secondary" size="lg" asChild>
                  <Link to="/contact">
                    Contact Us
                  </Link>
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Services;