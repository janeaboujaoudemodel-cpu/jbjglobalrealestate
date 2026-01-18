import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { SEOHead, pagesSEO } from "@/components/SEOHead";
import { FounderPhilosophySection } from "@/components/FounderPhilosophySection";
import { PreFooterSeparator } from "@/components/PreFooterSeparator";
import { 
  Building2, 
  Scale, 
  Palette, 
  Plane, 
  Car, 
  Gem, 
  ArrowUpRight,
  Calculator,
  Home,
  FileSearch,
  Briefcase,
  Shield,
  Users
} from "lucide-react";
import luxuryVillaHero from "@/assets/luxury-villa-hero.jpeg";
import coupleYachtDubai from "@/assets/couple-yacht-dubai.png";
import founderJetInterior from "@/assets/founder-jet-interior.jpeg";
import luxuryVilla1 from "@/assets/luxury-villa-1.jpeg";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.1 }
  }
};

const services = [
  {
    id: "buy-sell",
    title: "Buy & Sell Brokerage",
    description: "Expert representation for property purchases and sales across UAE's most sought-after locations.",
    icon: Building2,
    image: luxuryVillaHero,
    link: "/properties",
    features: ["Off-Plan Projects", "Ready Properties", "Price Negotiations", "Transaction Support"]
  },
  {
    id: "rent",
    title: "Rent Brokerage",
    description: "Professional rental services for landlords and tenants seeking quality rental properties.",
    icon: Home,
    image: "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80",
    link: "/properties?status=ready",
    features: ["Tenant Sourcing", "Rental Negotiations", "Contract Coordination", "Market Analysis"]
  },
  {
    id: "holiday-homes",
    title: "Holiday Homes",
    description: "Short-term rental support and holiday home operations for property owners in the UAE.",
    icon: Gem,
    image: coupleYachtDubai,
    link: "/contact",
    features: ["Listing Management", "Guest Services", "Revenue Optimization", "Property Marketing"]
  },
  {
    id: "partner-legal",
    title: "Legal Partners",
    description: "Introductions to independent law firms for conveyancing and legal matters.",
    icon: Scale,
    image: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&q=80",
    link: "/services/law-firm",
    features: ["Partner Introductions", "Conveyancing Referrals", "Contract Review", "Visa Coordination"],
    isPartner: true
  },
  {
    id: "partner-mortgage",
    title: "Mortgage Partners",
    description: "Introductions and coordination with independent, licensed mortgage specialists.",
    icon: Calculator,
    image: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=800&q=80",
    link: "/mortgage-advisory",
    features: ["Bank Introductions", "Specialist Referrals", "Rate Comparison Tool", "Pre-Qualification Guidance"],
    isPartner: true
  },
  {
    id: "design-build",
    title: "Design & Build Partners",
    description: "Introductions to architecture, interior design, and fit-out partners.",
    icon: Palette,
    image: luxuryVilla1,
    link: "/services/design-build",
    features: ["Architecture", "Interior Design", "Fit-Out Services", "Project Management"],
    isPartner: true
  },
  {
    id: "concierge",
    title: "Luxury Concierge",
    description: "White-glove lifestyle services including jets, yachts, and exclusive experiences.",
    icon: Gem,
    image: coupleYachtDubai,
    link: "/concierge",
    features: ["Private Jets", "Yacht Charters", "Luxury Cars", "VIP Access"]
  }
];


const Services = () => {
  return (
    <>
      <SEOHead {...pagesSEO.services} />
      <div className="min-h-screen bg-black">
      {/* Premium Hero Section - Cinematic Video */}
      <section className="relative h-[85vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          {/* Video Background */}
          <video
            autoPlay
            muted
            loop
            playsInline
            className="w-full h-full object-cover"
            poster={founderJetInterior}
          >
            <source src="https://videos.pexels.com/video-files/3571264/3571264-uhd_2560_1440_30fps.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/60 to-black" />
        </div>
        
        {/* Floating gold accent orbs */}
        <div className="absolute top-1/4 left-10 w-64 h-64 bg-gold/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-gold/10 rounded-full blur-[120px] pointer-events-none" />
        
        <motion.div 
          className="relative z-10 text-center px-4 max-w-5xl mx-auto"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <motion.span 
            className="inline-block text-gold text-xs md:text-sm uppercase tracking-[0.5em] mb-8 border border-gold/30 px-6 py-2 rounded-full backdrop-blur-sm"
            variants={fadeInUp}
          >
            Institutional Real Estate Brokerage
          </motion.span>
          <motion.h1 
            className="text-white text-5xl md:text-7xl lg:text-8xl font-bold mb-8 tracking-[-0.02em]"
            style={{ fontFamily: "Poppins, sans-serif" }}
            variants={fadeInUp}
          >
            Premium Services
          </motion.h1>
          <motion.p 
            className="text-zinc-300 text-lg md:text-2xl max-w-3xl mx-auto mb-10 leading-relaxed"
            variants={fadeInUp}
          >
            Expert brokerage for property sales, rentals, and holiday homes — 
            <span className="text-gold"> plus trusted partner introductions</span>
          </motion.p>
          
          <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/properties">
              <Button variant="primary" size="lg" className="text-base px-8">
                Browse Properties
                <ArrowUpRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link to="/contact">
              <Button variant="secondary" size="lg" className="text-base px-8">
                Speak With Us
              </Button>
            </Link>
          </motion.div>
        </motion.div>
        
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

      {/* Services Grid */}
      <section className="py-20 md:py-32">
        <div className="container mx-auto px-4">
          <motion.div 
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            {services.map((service) => (
              <motion.div
                key={service.id}
                variants={fadeInUp}
                className="group relative overflow-hidden rounded-2xl bg-white border border-zinc-200 hover:border-gold hover:shadow-xl hover:shadow-gold/10 transition-all duration-500 flex flex-col"
              >
                {/* Image */}
                <div className="aspect-[16/10] overflow-hidden relative flex-shrink-0">
                  <img 
                    src={service.image} 
                    alt={service.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-white/90 via-white/30 to-transparent" />
                </div>
                
                {/* Content - No longer absolute */}
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-xl bg-black flex items-center justify-center flex-shrink-0">
                      <service.icon className="w-6 h-6 text-gold" />
                    </div>
                    <h3 className="text-black text-xl font-bold line-clamp-1">{service.title}</h3>
                  </div>
                  
                  <p className="text-zinc-600 text-sm mb-4 line-clamp-2 flex-shrink-0">
                    {service.description}
                  </p>
                  
                  {/* Features */}
                  <div className="flex flex-wrap gap-2 mb-4 flex-shrink-0">
                    {service.features.slice(0, 3).map((feature) => (
                      <span 
                        key={feature}
                        className="text-xs text-black bg-zinc-100 px-2 py-1 rounded-full border border-zinc-200"
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                  
                  <div className="mt-auto">
                    <Link to={service.link}>
                      <Button 
                        variant="dark"
                        className="w-full"
                      >
                        Explore
                        <ArrowUpRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Founder-Led Philosophy & Advisory Positioning */}
      <FounderPhilosophySection />

      {/* AI Tools Section */}
      <section className="py-20 bg-gradient-to-b from-black via-zinc-950 to-black relative overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gold/5 rounded-full blur-[150px] pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gold/5 rounded-full blur-[150px] pointer-events-none" />
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="text-gold text-xs uppercase tracking-[0.3em] mb-4 block">Innovation</span>
            <h2 
              className="text-white text-3xl md:text-5xl font-bold mb-4"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              AI-Powered Tools
            </h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              Explore our tools to enhance your property decisions
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[
              { name: "AI Property Comparison", icon: FileSearch, link: "/compare" },
              { name: "AI Interior Design", icon: Palette, link: "/interior-design-ai" },
              { name: "AI Measurement", icon: Building2, link: "/property-measurement" },
              { name: "Mortgage Calculator", icon: Calculator, link: "/mortgage-calculator" }
            ].map((tool) => (
              <Link key={tool.name} to={tool.link}>
                <motion.div 
                  className="p-6 rounded-2xl bg-gradient-to-br from-white via-[#FDFBF7] to-[#F5F0E6] border border-gold/30 hover:border-black hover:shadow-xl transition-all duration-300 group cursor-pointer"
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-white via-[#FDFBF7] to-[#F5F0E6] border border-gold/30 flex items-center justify-center mb-4">
                    <tool.icon className="w-7 h-7 text-black" />
                  </div>
                  <h4 className="text-gold font-semibold mb-2 group-hover:text-black transition-colors">
                    {tool.name}
                  </h4>
                  <ArrowUpRight className="w-4 h-4 text-gold group-hover:text-black group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
                </motion.div>
              </Link>
            ))}
          </div>
          
          {/* Explore More Tools Button */}
          <div className="text-center">
            <Link to="/ai-hub">
              <Button variant="secondary" size="lg" className="px-8">
                Explore More AI Tools
                <ArrowUpRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>


      {/* Pre-Footer White Section - Separates from dark footer */}
      <PreFooterSeparator 
        title="Ready to Get Started?"
        subtitle="Speak with our team for personalized brokerage support across Dubai and the UAE."
        primaryLink="/contact"
        primaryText="Contact Us"
        secondaryLink="/properties"
        secondaryText="Browse Properties"
      />

      <Footer />
      </div>
    </>
  );
};

export default Services;