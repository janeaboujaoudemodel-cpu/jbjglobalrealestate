import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { SEOHead, pagesSEO } from "@/components/SEOHead";
import { FounderPhilosophySection } from "@/components/FounderPhilosophySection";
import { PreFooterSeparator } from "@/components/PreFooterSeparator";
import { useLanguage } from "@/contexts/LanguageContext";
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
  const { t } = useLanguage();
  
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
          {/* Premium Label - Glass style with gold border, engraved look */}
          <motion.button 
            className="group inline-flex items-center gap-2 px-5 py-2.5 rounded-full mb-8 cursor-default"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 50%, rgba(200,167,102,0.08) 100%)',
              backdropFilter: 'blur(20px)',
              border: '1.5px solid rgba(200,167,102,0.6)',
              boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.1), inset 0 -1px 2px rgba(0,0,0,0.2), 0 4px 20px rgba(0,0,0,0.3)',
            }}
            variants={fadeInUp}
          >
            <span className="w-2 h-2 bg-gold rounded-full animate-pulse" />
            <span className="text-gold font-semibold text-[10px] md:text-xs uppercase tracking-[0.2em]">Institutional Real Estate Brokerage</span>
          </motion.button>
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
            {/* Hero CTA Buttons - Transparent bg, white 3D border, white title, gold icon on normal; filled on hover */}
            <Link to="/properties">
              <button 
                className="group relative inline-flex items-center justify-center gap-2 px-10 py-6 text-base font-bold rounded-xl transition-all duration-300 bg-transparent"
                style={{
                  border: '2px solid rgba(255,255,255,0.8)',
                  boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.2), inset 0 -1px 2px rgba(0,0,0,0.3), 0 4px 15px rgba(0,0,0,0.4)',
                }}
              >
                <span className="text-white group-hover:text-black transition-colors">Browse Properties</span>
                <ArrowUpRight className="w-5 h-5 text-gold transition-colors" style={{ filter: 'drop-shadow(0 0 6px rgba(200,167,102,0.8))' }} />
                {/* Hover fill overlay */}
                <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-white via-[#FDFBF7] to-[#F5F0E6] opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" style={{ border: '2px solid rgba(200,167,102,0.6)' }} />
              </button>
            </Link>
            <Link to="/contact">
              <button 
                className="group relative inline-flex items-center justify-center gap-2 px-10 py-6 text-base font-bold rounded-xl transition-all duration-300 bg-transparent"
                style={{
                  border: '2px solid rgba(255,255,255,0.8)',
                  boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.2), inset 0 -1px 2px rgba(0,0,0,0.3), 0 4px 15px rgba(0,0,0,0.4)',
                }}
              >
                <span className="text-white group-hover:text-black transition-colors">Speak With Us</span>
                <ArrowUpRight className="w-5 h-5 text-gold transition-colors" style={{ filter: 'drop-shadow(0 0 6px rgba(200,167,102,0.8))' }} />
                {/* Hover fill overlay */}
                <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-white via-[#FDFBF7] to-[#F5F0E6] opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" style={{ border: '2px solid rgba(200,167,102,0.6)' }} />
              </button>
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

      {/* Services Grid - White background container */}
      <section className="py-20 md:py-32 bg-black">
        <div className="container mx-auto px-4">
          {/* White background wrapper for service cards */}
          <div className="bg-gradient-to-br from-white via-[#FDFBF7] to-[#F5F0E6] rounded-3xl p-6 md:p-10">
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
                className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border border-gold/30 hover:border-gold hover:shadow-xl hover:shadow-gold/10 transition-all duration-500 flex flex-col"
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
                    {/* REVERSED Icon Box: transparent border black on normal, filled on hover */}
                    <div className="w-12 h-12 rounded-xl bg-transparent border-2 border-black flex items-center justify-center flex-shrink-0 group-hover:bg-black transition-all duration-300">
                      <service.icon className="w-6 h-6 text-black group-hover:text-gold transition-colors" />
                    </div>
                    <h3 className="text-gold group-hover:text-black text-xl font-bold line-clamp-1 transition-colors">{service.title}</h3>
                  </div>
                  
                  <p className="text-zinc-600 text-sm mb-4 line-clamp-2 flex-shrink-0">
                    {service.description}
                  </p>
                  
                  {/* Features - Gold text with black border and glow */}
                  <div className="flex flex-wrap gap-2 mb-4 flex-shrink-0">
                    {service.features.slice(0, 3).map((feature) => (
                      <span 
                        key={feature}
                        className="text-xs text-gold px-2 py-1 rounded-lg border-2 border-black"
                        style={{
                          textShadow: '0 0 8px rgba(200,167,102,0.4)',
                          boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)',
                        }}
                      >
                        {feature}
                      </span>
                    ))}
                  </div>
                  
                  <div className="mt-auto">
                    <Link to={service.link}>
                      <button 
                        className="relative w-full h-10 rounded-lg font-bold transition-all duration-300 group/btn overflow-hidden flex items-center justify-center"
                        style={{
                          background: 'linear-gradient(135deg, #FFFFFF 0%, #FDFBF7 25%, #F5F0E6 50%, #E8DFD0 75%, #C8A766 100%)',
                          boxShadow: `
                            0 5px 15px rgba(200,167,102,0.35),
                            0 3px 8px rgba(0,0,0,0.12),
                            inset 0 1px 3px rgba(255,255,255,0.9),
                            0 0 12px rgba(200,167,102,0.25)
                          `,
                        }}
                      >
                        <span className="absolute inset-x-0 top-0 h-1/2 rounded-t-lg bg-gradient-to-b from-white/70 to-transparent pointer-events-none" />
                        <span className="absolute inset-0 rounded-lg opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300 pointer-events-none" style={{ boxShadow: '0 0 25px rgba(200,167,102,0.5)' }} />
                        <span className="relative flex items-center gap-2">
                          <span className="text-black group-hover/btn:text-gold transition-colors">Explore</span>
                          <ArrowUpRight className="w-4 h-4 text-gold group-hover/btn:text-black transition-colors" />
                        </span>
                      </button>
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
            </motion.div>
          </div>
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

          {/* White background container for AI tools */}
          <div className="bg-gradient-to-br from-white via-[#FDFBF7] to-[#F5F0E6] rounded-3xl p-8 mb-8 mx-4 md:mx-8">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { name: "AI Property Comparison", icon: FileSearch, link: "/compare" },
                { name: "AI Interior Design", icon: Palette, link: "/interior-design-ai" },
                { name: "AI Measurement", icon: Building2, link: "/property-measurement" },
                { name: "Mortgage Calculator", icon: Calculator, link: "/mortgage-calculator" }
              ].map((tool) => (
                <Link key={tool.name} to={tool.link}>
                  <motion.div 
                    className="p-6 rounded-2xl bg-transparent border-2 border-black hover:bg-gradient-to-br hover:from-[#FDFBF7] hover:via-[#F5F0E6] hover:to-[#EDE4D3] hover:border-gold transition-all duration-300 group cursor-pointer"
                    whileHover={{ scale: 1.02 }}
                  >
                    {/* REVERSED Icon Box: transparent border black on normal */}
                    <div className="w-14 h-14 rounded-xl bg-transparent border-2 border-black flex items-center justify-center mb-4 group-hover:bg-black transition-all duration-300">
                      <tool.icon className="w-7 h-7 text-black group-hover:text-gold transition-colors" />
                    </div>
                    <h4 className="text-gold font-semibold mb-2 group-hover:text-black transition-colors">
                      {tool.name}
                    </h4>
                    <ArrowUpRight className="w-4 h-4 text-black group-hover:text-gold group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
                  </motion.div>
                </Link>
              ))}
            </div>
          </div>
          
          {/* Explore More Tools Button - 3D Premium Style with hover reverse */}
          <div className="text-center">
            <Link to="/ai-hub">
              <button 
                className="group relative inline-flex items-center justify-center gap-2 px-10 py-5 text-base font-bold rounded-xl transition-all duration-300 overflow-hidden"
                style={{
                  background: 'linear-gradient(135deg, #FFFFFF 0%, #FDFBF7 25%, #F5F0E6 50%, #E8DFD0 75%, #C8A766 100%)',
                  boxShadow: `
                    0 8px 25px rgba(200,167,102,0.4),
                    0 5px 12px rgba(0,0,0,0.15),
                    inset 0 2px 4px rgba(255,255,255,0.9),
                    inset 0 -2px 4px rgba(200,167,102,0.2),
                    0 0 18px rgba(200,167,102,0.3)
                  `,
                }}
              >
                <span className="absolute inset-x-0 top-0 h-1/2 rounded-t-xl bg-gradient-to-b from-white/80 to-transparent pointer-events-none" />
                <span className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" style={{ boxShadow: '0 0 35px rgba(200,167,102,0.6), inset 0 0 18px rgba(200,167,102,0.1)' }} />
                <span className="relative flex items-center gap-2">
                  <span className="text-black group-hover:text-gold transition-colors">Explore More</span>
                  <span className="text-gold group-hover:text-black transition-colors">AI Tools</span>
                  <ArrowUpRight className="w-5 h-5 text-black group-hover:text-gold transition-colors" />
                </span>
              </button>
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