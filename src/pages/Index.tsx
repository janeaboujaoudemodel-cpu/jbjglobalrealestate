import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Footer from "@/components/Footer";
import StatsCounter from "@/components/StatsCounter";
import AIComparisonWidget from "@/components/AIComparisonWidget";
import MarketReportCTA from "@/components/MarketReportCTA";
import MortgageCalculator from "@/components/MortgageCalculator";
import WelcomeModal from "@/components/WelcomeModal";
import InquiryFormModal from "@/components/InquiryFormModal";
import { useLanguage } from "@/contexts/LanguageContext";
import { Sparkles, ArrowUpRight, ChevronDown, User, Scale, Layers, Calculator, FileText, Heart } from "lucide-react";
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
  const [isInquiryOpen, setIsInquiryOpen] = useState(false);
  const { t } = useLanguage();

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

          {/* Main Tagline - Smaller, single line */}
          <motion.h1 
            className="text-white text-2xl md:text-3xl lg:text-4xl font-bold tracking-wide mb-4 leading-tight"
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
            {/* Primary Row - Main CTAs */}
            <div className="flex flex-wrap justify-center gap-3">
              {/* Explore Our Services - White background, gold text */}
              <Link to="/about">
                <Button 
                  className="bg-white hover:bg-zinc-100 text-gold font-semibold px-6 py-5 text-sm shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  {t('home.cta.explore')}
                  <ArrowUpRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              {/* Explore Properties - Gold */}
              <Link to="/properties">
                <Button 
                  className="bg-gold hover:bg-gold-light text-black font-semibold px-6 py-5 text-sm shadow-lg shadow-gold/20 hover:shadow-xl hover:shadow-gold/30 transition-all duration-300"
                >
                  {t('home.cta.properties')}
                  <ArrowUpRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
              {/* Contact Us - White/Gold style */}
              <Button 
                className="bg-white hover:bg-zinc-100 text-gold font-semibold px-6 py-5 text-sm shadow-lg hover:shadow-xl transition-all duration-300"
                onClick={() => setIsInquiryOpen(true)}
              >
                {t('home.cta.contact')}
                <ArrowUpRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
            
            {/* Second Row - Service Shortcuts */}
            <div className="flex flex-wrap justify-center gap-3">
              <Button 
                className="bg-white hover:bg-zinc-100 text-gold font-semibold px-5 py-4 text-xs shadow-md hover:shadow-lg transition-all duration-300"
                onClick={() => setIsInquiryOpen(true)}
              >
                List Your Property
                <ArrowUpRight className="w-3 h-3 ml-1" />
              </Button>
              <Link to="/concierge">
                <Button 
                  className="bg-white hover:bg-zinc-100 text-gold font-semibold px-5 py-4 text-xs shadow-md hover:shadow-lg transition-all duration-300"
                >
                  Luxury Concierge
                  <Sparkles className="w-3 h-3 ml-1" />
                </Button>
              </Link>
              <Link to="/services/design-build">
                <Button 
                  className="bg-white hover:bg-zinc-100 text-gold font-semibold px-5 py-4 text-xs shadow-md hover:shadow-lg transition-all duration-300"
                >
                  Design & Build
                  <Layers className="w-3 h-3 ml-1" />
                </Button>
              </Link>
              <Link to="/services/law-firm">
                <Button 
                  className="bg-white hover:bg-zinc-100 text-gold font-semibold px-5 py-4 text-xs shadow-md hover:shadow-lg transition-all duration-300"
                >
                  Law Firm
                  <Scale className="w-3 h-3 ml-1" />
                </Button>
              </Link>
            </div>
            
            {/* Third Row - Tools */}
            <div className="flex flex-wrap justify-center gap-3">
              {/* Market Report */}
              <Link to="/market-report">
                <Button 
                  className="bg-white hover:bg-zinc-100 text-gold font-semibold px-5 py-4 text-xs shadow-md hover:shadow-lg transition-all duration-300 group"
                >
                  <FileText className="w-3 h-3 mr-1" />
                  Market Report
                  <ArrowUpRight className="w-3 h-3 ml-1 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </Button>
              </Link>
              
              {/* Mortgage Advisory */}
              <Link to="/mortgage-advisory">
                <Button 
                  className="bg-white hover:bg-zinc-100 text-gold font-semibold px-5 py-4 text-xs shadow-md hover:shadow-lg transition-all duration-300 group"
                >
                  <Calculator className="w-3 h-3 mr-1" />
                  Mortgage Advisory
                  <ArrowUpRight className="w-3 h-3 ml-1 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </Button>
              </Link>
              
              {/* News & Insights */}
              <Link to="/news">
                <Button 
                  className="bg-white hover:bg-zinc-100 text-gold font-semibold px-5 py-4 text-xs shadow-md hover:shadow-lg transition-all duration-300 group"
                >
                  <FileText className="w-3 h-3 mr-1" />
                  News & Insights
                  <ArrowUpRight className="w-3 h-3 ml-1 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </Button>
              </Link>
              
              {/* Favorites */}
              <Link to="/favorites">
                <Button 
                  className="bg-white hover:bg-zinc-100 text-gold font-semibold px-5 py-4 text-xs shadow-md hover:shadow-lg transition-all duration-300 group"
                >
                  <Heart className="w-3 h-3 mr-1" />
                  Favorites & Shortlist
                  <ArrowUpRight className="w-3 h-3 ml-1 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </Button>
              </Link>
            </div>
            
            {/* AI Home Finder - Full Width Purple Glowing Bar */}
            <Link to="/quiz" className="w-full max-w-2xl mt-4">
              <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-purple-600 via-purple-700 to-purple-800 p-[1px] shadow-2xl shadow-purple-500/30 hover:shadow-purple-500/50 transition-all duration-500 group">
                {/* Animated glow border */}
                <div className="absolute inset-0 bg-gradient-to-r from-purple-400 via-fuchsia-400 to-purple-400 opacity-60 blur-sm group-hover:opacity-100 transition-opacity duration-500" />
                
                {/* Inner content */}
                <div className="relative flex items-center justify-center gap-4 bg-gradient-to-r from-purple-700 via-purple-800 to-purple-700 rounded-xl px-8 py-4 group-hover:from-purple-600 group-hover:via-purple-700 group-hover:to-purple-600 transition-all duration-500">
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                  
                  <Sparkles className="w-5 h-5 text-purple-200 group-hover:text-white transition-colors relative z-10" />
                  <div className="text-center relative z-10">
                    <p className="text-white font-bold text-base tracking-wide">{t('home.cta.aiFinder')}</p>
                    <p className="text-purple-200/80 text-xs">AI-Powered Property Matching</p>
                  </div>
                  <ArrowUpRight className="w-5 h-5 text-purple-200 group-hover:text-white group-hover:translate-x-1 group-hover:-translate-y-1 transition-all relative z-10" />
                </div>
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

      {/* MORTGAGE CALCULATOR SECTION */}
      <section className="py-16 md:py-20 bg-black">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-10"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="text-gold text-xs uppercase tracking-[0.3em]">Financial Planning</span>
            <h3 className="text-white text-3xl md:text-4xl font-bold mt-2" style={{ fontFamily: "Poppins, sans-serif" }}>
              Mortgage Calculator
            </h3>
            <p className="text-zinc-400 mt-2 max-w-lg mx-auto">
              Estimate your monthly payments and plan your investment with our comprehensive calculator
            </p>
          </motion.div>
          <MortgageCalculator compact />
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
            <Button 
              className="bg-gold hover:bg-gold-light text-black font-semibold px-8 py-6 text-base shadow-lg shadow-gold/20 transition-all duration-300 hover:shadow-gold/30 hover:scale-[1.02]"
              onClick={() => setIsInquiryOpen(true)}
            >
              {t('home.cta.contact')}
              <ArrowUpRight className="w-5 h-5 ml-2 -mr-1" />
            </Button>
            <Link to="/properties">
              <Button 
                variant="outline"
                className="border-gold/50 text-gold hover:bg-gold/10 hover:border-gold px-8 py-6 text-base transition-all duration-300 hover:shadow-lg hover:shadow-gold/10"
              >
                Browse Properties
                <ArrowUpRight className="w-5 h-5 ml-2 -mr-1" />
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Footer */}
      <Footer />

      {/* Inquiry Form Modal */}
      <InquiryFormModal 
        isOpen={isInquiryOpen} 
        onClose={() => setIsInquiryOpen(false)} 
        source="homepage"
      />
    </section>
  );
};

export default Index;
