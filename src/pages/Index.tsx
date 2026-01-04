import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Footer from "@/components/Footer";
import StatsCounter from "@/components/StatsCounter";
import AIComparisonWidget from "@/components/AIComparisonWidget";
import MarketReportCTA from "@/components/MarketReportCTA";
import WelcomeModal from "@/components/WelcomeModal";
import { Sparkles, ArrowUpRight, ChevronDown, User, Scale, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import founderProfessional from "@/assets/founder-professional.jpeg";
import luxuryVillaHero from "@/assets/luxury-villa-hero.jpeg";
import { CONTACT_INFO } from "@/constants/stats";

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] } }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15, delayChildren: 0.2 }
  }
};

const Index = () => {

  return (
    <section className="relative w-full min-h-screen bg-black">
      {/* Welcome Modal - AI Assistant Popup on first load */}
      <WelcomeModal />

      {/* HERO SECTION - CLEAN LUXURY VILLA */}
      <div className="relative h-screen flex items-center justify-center">
        {/* Villa Background Image */}
        <div className="absolute inset-0 overflow-hidden">
          <img 
            src={luxuryVillaHero} 
            alt="Luxury Villa in Dubai" 
            className="w-full h-full object-cover"
          />
          {/* Enhanced gradient overlay for better text readability */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black/20" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/30" />
        </div>

        {/* Hero Content - Clean and Minimal */}
        <motion.div 
          className="relative z-10 text-center px-4 max-w-4xl mx-auto"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          {/* Welcome Text */}
          <motion.div variants={fadeInUp}>
            <span className="inline-block text-gold text-xs md:text-sm uppercase tracking-[0.4em] mb-6">
              Exclusive Properties
            </span>
            <h2 
              className="text-white text-xl md:text-2xl lg:text-3xl font-light tracking-wide mb-4"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              Welcome to JJ Global Capital
            </h2>
            {/* We Create | We Elevate | We Lead */}
            <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8 text-zinc-300 text-base md:text-lg mb-8">
              <span className="font-light">We Create</span>
              <span className="text-gold/60">|</span>
              <span className="font-light">We Elevate</span>
              <span className="text-gold/60">|</span>
              <span className="font-light">We Lead</span>
            </div>
          </motion.div>

          {/* Main Tagline */}
          <motion.h1 
            className="text-white text-3xl md:text-5xl lg:text-6xl font-bold tracking-wide mb-4 leading-tight"
            variants={fadeInUp}
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            Your Gateway to Global{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold to-gold-light">
              Real Estate Investments & Concierge
            </span>
          </motion.h1>

          {/* Sub-tagline */}
          <motion.p 
            className="text-zinc-400 text-sm md:text-base max-w-xl mx-auto"
            variants={fadeInUp}
          >
            A founder-led advisory specializing in UAE and Dubai real estate
          </motion.p>
        </motion.div>
        
        {/* Scroll indicator - Centered at bottom */}
        <motion.div 
          className="absolute bottom-8 left-0 right-0 flex flex-col items-center gap-2 text-white/50 z-10"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 0.8 }}
        >
          <span className="text-xs uppercase tracking-[0.3em]">Discover</span>
          <ChevronDown className="w-5 h-5 animate-bounce" />
        </motion.div>
      </div>

      {/* CTA SECTION - Below Hero */}
      <section className="py-12 md:py-16 bg-black">
        <div className="container mx-auto px-4">
          <motion.div 
            className="flex flex-col items-center gap-6"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex flex-wrap justify-center gap-3">
              {/* Explore Our Services - White background, gold text */}
              <Link to="/about">
                <Button 
                  className="bg-white hover:bg-zinc-100 text-gold font-semibold px-6 py-5 text-sm shadow-lg"
                >
                  Explore Our Services
                  <ArrowUpRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              {/* Explore Properties - Gold, slightly smaller */}
              <Link to="/properties">
                <Button 
                  className="bg-gold hover:bg-gold-light text-black font-semibold px-6 py-5 text-sm shadow-lg shadow-gold/20"
                >
                  Explore Properties
                  <ArrowUpRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              {/* Contact Us - Same style */}
              <a href={CONTACT_INFO.inquiryFormUrl} target="_blank" rel="noopener noreferrer">
                <Button 
                  variant="outline"
                  className="border-gold/50 text-gold hover:bg-gold/10 hover:border-gold px-6 py-5 text-sm"
                >
                  Contact Us
                  <ArrowUpRight className="w-4 h-4 ml-2" />
                </Button>
              </a>
            </div>
            
            {/* Second Row - Service Shortcuts */}
            <div className="flex flex-wrap justify-center gap-3">
              <a href={CONTACT_INFO.inquiryFormUrl} target="_blank" rel="noopener noreferrer">
                <Button 
                  variant="outline"
                  className="border-white/30 bg-white/5 text-white hover:bg-white/10 hover:border-white/50 px-5 py-4 text-xs backdrop-blur-sm"
                >
                  List Your Property
                  <ArrowUpRight className="w-3 h-3 ml-1" />
                </Button>
              </a>
              <Link to="/concierge">
                <Button 
                  variant="outline"
                  className="border-gold/30 bg-gold/5 text-gold hover:bg-gold/10 hover:border-gold/50 px-5 py-4 text-xs backdrop-blur-sm"
                >
                  Luxury Concierge
                  <Sparkles className="w-3 h-3 ml-1" />
                </Button>
              </Link>
              <Link to="/services/design-build">
                <Button 
                  variant="outline"
                  className="border-zinc-600/50 bg-zinc-800/30 text-zinc-300 hover:bg-zinc-800/50 hover:text-white px-5 py-4 text-xs backdrop-blur-sm"
                >
                  Design & Build
                  <Layers className="w-3 h-3 ml-1" />
                </Button>
              </Link>
              <Link to="/services/law-firm">
                <Button 
                  variant="outline"
                  className="border-zinc-600/50 bg-zinc-800/30 text-zinc-300 hover:bg-zinc-800/50 hover:text-white px-5 py-4 text-xs backdrop-blur-sm"
                >
                  Law Firm
                  <Scale className="w-3 h-3 ml-1" />
                </Button>
              </Link>
            </div>
            
            {/* AI Home Finder CTA */}
            <Link to="/quiz">
              <div className="flex items-center gap-3 bg-gradient-to-r from-purple-700 to-purple-900 hover:from-purple-600 hover:to-purple-800 border border-purple-500/40 rounded-xl px-6 py-3 transition-all shadow-lg shadow-purple-500/20 group">
                <Sparkles className="w-5 h-5 text-white" />
                <div className="text-left">
                  <p className="text-white font-semibold text-sm">Let AI Find Your Home</p>
                  <p className="text-purple-200/80 text-xs">Get Your Free Test Now</p>
                </div>
                <ArrowUpRight className="w-5 h-5 text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </div>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* FOUNDER SECTION - Meet The Leadership */}
      <section className="py-20 md:py-28 bg-gradient-to-b from-black via-zinc-950 to-black">
        <div className="container mx-auto px-4">
          <motion.div
            className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            {/* Founder Image */}
            <motion.div 
              className="relative order-2 lg:order-1"
              variants={fadeInUp}
            >
              <div className="relative aspect-[3/4] max-w-md mx-auto lg:max-w-none">
                {/* Decorative frame */}
                <div className="absolute -inset-4 border border-gold/20 rounded-3xl" />
                <div className="absolute -inset-2 bg-gradient-to-br from-gold/10 to-transparent rounded-2xl" />
                
                {/* Image container with smart crop - show from top */}
                <div className="relative rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl shadow-black/80">
                  <img 
                    src={founderProfessional} 
                    alt="Jane Abou Jaoude - Founder & Chairwoman" 
                    className="w-full h-full object-cover object-top"
                  />
                  {/* Gradient overlay at bottom */}
                  <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/80 to-transparent" />
                </div>
                
                {/* Name badge */}
                <div className="absolute bottom-6 left-6 right-6 bg-black/60 backdrop-blur-md border border-gold/30 rounded-xl p-4">
                  <p className="text-gold text-xs uppercase tracking-[0.2em] mb-1">Founder & Chairwoman</p>
                  <h3 className="text-white text-xl font-bold" style={{ fontFamily: "Poppins, sans-serif" }}>
                    Jane Abou Jaoude
                  </h3>
                </div>
              </div>
            </motion.div>

            {/* Content */}
            <motion.div className="order-1 lg:order-2" variants={fadeInUp}>
              <div className="mb-6">
                <span className="inline-flex items-center gap-2 text-gold text-sm uppercase tracking-[0.3em]">
                  <User className="w-4 h-4" />
                  Leadership
                </span>
              </div>
              
              <h2 
                className="text-white text-4xl md:text-5xl lg:text-6xl font-bold mb-8"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                Meet the <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold to-gold-light">Founder</span>
              </h2>
              
              <p className="text-zinc-300 text-lg md:text-xl leading-relaxed mb-6">
                JJ Holding Group is a founder-led, multi-division holding built on unwavering standards, discretion, and long-term vision.
              </p>
              
              <p className="text-zinc-500 text-base md:text-lg leading-relaxed mb-8">
                Jane Abou Jaoude leads with a philosophy rooted in accountability and discretion, building organizations designed to endure rather than simply expand.
              </p>
              
              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 mb-8">
                <div className="text-center">
                  <p className="text-gold text-3xl md:text-4xl font-bold" style={{ fontFamily: "Poppins, sans-serif" }}>4</p>
                  <p className="text-zinc-500 text-xs uppercase tracking-wider">Divisions</p>
                </div>
                <div className="text-center">
                  <p className="text-gold text-3xl md:text-4xl font-bold" style={{ fontFamily: "Poppins, sans-serif" }}>12+</p>
                  <p className="text-zinc-500 text-xs uppercase tracking-wider">Years</p>
                </div>
                <div className="text-center">
                  <p className="text-gold text-3xl md:text-4xl font-bold" style={{ fontFamily: "Poppins, sans-serif" }}>92+</p>
                  <p className="text-zinc-500 text-xs uppercase tracking-wider">Countries</p>
                </div>
              </div>
              
              <Link to="/founder">
                <Button className="bg-gold hover:bg-gold-light text-black font-semibold px-8 py-6 text-base">
                  Learn More About Our Founder
                  <ArrowUpRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* AI COMPARISON & ANALYZER PREVIEW */}
      <section className="py-16 md:py-20 bg-black">
        <div className="container mx-auto px-4">
          <AIComparisonWidget />
        </div>
      </section>

      {/* MARKET REPORT CTA */}
      <section className="py-16 md:py-20 bg-gradient-to-b from-black to-zinc-950">
        <div className="container mx-auto px-4">
          <MarketReportCTA />
        </div>
      </section>

      {/* Stats Counter Section */}
      <StatsCounter />

      {/* Contact CTA Section */}
      <div className="container mx-auto px-4 bg-black">
        <motion.div 
          className="text-center py-20 border-t border-zinc-800"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={fadeInUp}
        >
          <span className="inline-block text-gold text-xs uppercase tracking-[0.3em] mb-4">Get Started</span>
          <h3 className="text-3xl md:text-4xl font-bold text-white mb-4" style={{ fontFamily: "Poppins, sans-serif" }}>
            Ready to Invest?
          </h3>
          <p className="text-zinc-400 max-w-xl mx-auto mb-8">
            Connect with our team to discover exclusive off-plan opportunities and start your UAE investment journey today.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a href={CONTACT_INFO.inquiryFormUrl} target="_blank" rel="noopener noreferrer">
              <Button className="bg-gold hover:bg-gold-light text-black font-semibold px-8 py-6 text-base">
                Contact Us
                <ArrowUpRight className="w-5 h-5 ml-2" />
              </Button>
            </a>
            <Link to="/properties">
              <Button 
                variant="outline"
                className="border-gold/50 text-gold hover:bg-gold/10 hover:border-gold px-8 py-6 text-base"
              >
                Browse Properties
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <Footer />
    </section>
  );
};

export default Index;
