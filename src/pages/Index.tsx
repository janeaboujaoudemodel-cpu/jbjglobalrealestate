import { useState } from "react";
import DeveloperPartnersMarquee from "@/components/DeveloperPartnersMarquee";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Footer from "@/components/Footer";
import StatsCounter from "@/components/StatsCounter";
import AIComparisonWidget from "@/components/AIComparisonWidget";
import MarketReportCTA from "@/components/MarketReportCTA";
import MortgageCalculator from "@/components/MortgageCalculator";
import BrokerOnboardingBanner from "@/components/BrokerOnboardingBanner";
import InquiryFormModal from "@/components/InquiryFormModal";
import { SEOHead, pagesSEO } from "@/components/SEOHead";
import { useLanguage } from "@/contexts/LanguageContext";
import { useUserRole } from "@/hooks/useUserRole";
import { Sparkles, ArrowUpRight, ChevronDown, User, Scale, Layers, Calculator, FileText, Heart, BarChart3, Wrench, Ruler, Palette, Calendar, Wallet, ShoppingBag, Brain, GraduationCap, Briefcase, Target, Award, PenTool, Users, Table2, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import founderProfessional from "@/assets/founder-professional.jpeg";
import luxuryVillaHero from "@/assets/luxury-villa-hero.jpeg";
import jbjFullLogoLight from "@/assets/jbj-fulllogo-light.png";
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
  const { isBroker, hasSelectedRole } = useUserRole();

  return (
    <section className="relative w-full min-h-screen bg-black">
      {/* SEO Meta Tags */}
      <SEOHead {...pagesSEO.home} />
      
      {/* Broker Onboarding Banner - Only for brokers */}
      {isBroker && <BrokerOnboardingBanner />}
      {/* HERO SECTION - LUXURY CINEMATIC VIDEO */}
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Video Background - Luxury Dubai Drone Footage Concept */}
        <div className="absolute inset-0">
          {/* Using villa hero as fallback - Video would show: Burj Khalifa, JBR coastline, Palm Jumeirah, Burj Al Arab */}
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: `url(${luxuryVillaHero})` }}
          />
          {/* Video overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-black/80" />
          {/* Additional cinematic vignette */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/60" />
        </div>
        
        {/* Animated gold accent lines */}
        <motion.div 
          className="absolute left-0 top-1/3 w-48 md:w-96 h-px bg-gradient-to-r from-gold/60 to-transparent"
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 1.5, delay: 0.5 }}
        />
        <motion.div 
          className="absolute right-0 bottom-1/3 w-48 md:w-96 h-px bg-gradient-to-l from-gold/60 to-transparent"
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 1.5, delay: 0.7 }}
        />
        
        {/* Content */}
        <motion.div 
          className="relative z-10 text-center px-4 max-w-4xl mx-auto"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          {/* Badge */}
          <motion.span 
            variants={fadeInUp}
            className="inline-flex items-center gap-2 px-5 py-2 bg-black/30 backdrop-blur-md border border-gold/40 rounded-full text-gold text-[10px] md:text-xs uppercase tracking-[0.3em] mb-8 shadow-lg shadow-gold/10"
          >
            <span className="w-2 h-2 bg-gold rounded-full animate-pulse" />
            Real Estate Brokerage
          </motion.span>
          
          {/* H1 - Premium Typography */}
          <motion.h1 
            variants={fadeInUp} 
            className="text-white text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6"
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            Buy & Sell Brokerage<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold via-[#C4A962] to-gold">in Dubai</span>
          </motion.h1>
          
          {/* Subline - Premium tagline */}
          <motion.p 
            variants={fadeInUp}
            className="text-zinc-300 text-base md:text-lg lg:text-xl max-w-2xl mx-auto leading-relaxed mb-4"
          >
            Luxury. Precision. Integrity. Your trusted partner in UAE real estate.
          </motion.p>

          {/* Partner microline */}
          <motion.p 
            variants={fadeInUp}
            className="text-zinc-500 text-xs md:text-sm mb-10"
          >
            Licensed partners available for legal and mortgage introductions.
          </motion.p>

          {/* Two CTAs Only - Premium Gold Buttons with Glow */}
          <motion.div 
            variants={fadeInUp}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link to="/properties">
              <Button className="relative bg-gradient-to-r from-gold via-[#C4A962] to-gold hover:from-gold-light hover:to-gold text-black font-bold px-10 py-6 text-sm tracking-wide transition-all duration-500 hover:shadow-2xl hover:shadow-gold/50 hover:scale-105 border border-gold/50 shadow-lg shadow-gold/30">
                <span className="relative z-10 flex items-center">
                  Explore Properties
                  <ArrowUpRight className="w-4 h-4 ml-2" />
                </span>
              </Button>
            </Link>
            <Button 
              className="relative bg-transparent border-2 border-gold text-gold hover:bg-gold hover:text-black font-bold px-10 py-6 text-sm tracking-wide transition-all duration-500 hover:shadow-2xl hover:shadow-gold/40 hover:scale-105 shadow-lg shadow-gold/20"
              onClick={() => setIsInquiryOpen(true)}
            >
              Book Consultation
            </Button>
          </motion.div>
        </motion.div>
        
        {/* Scroll indicator - Animated */}
        <motion.div 
          className="absolute bottom-8 left-0 right-0 flex flex-col items-center gap-2 text-gold/60 z-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2, duration: 1 }}
        >
          <span className="text-[10px] uppercase tracking-[0.3em]">Explore</span>
          <ChevronDown className="w-5 h-5 animate-bounce" />
        </motion.div>
      </div>

      {/* DEVELOPER PARTNERS MARQUEE */}
      <DeveloperPartnersMarquee />

      {/* QUICK ACTIONS - Simplified */}
      <section className="py-16 md:py-20 bg-black">
        <div className="container mx-auto px-4">
          {/* Primary Services Row - Premium Glow Buttons */}
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            <Link to="/properties">
              <Button className="relative bg-gradient-to-r from-gold via-[#C4A962] to-gold hover:from-gold-light hover:to-gold text-black font-bold px-6 py-5 text-sm transition-all duration-500 hover:shadow-xl hover:shadow-gold/40 hover:scale-105 shadow-md shadow-gold/25 border border-gold/30">
                Explore Properties
                <ArrowUpRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Button 
              className="relative border-2 border-gold text-gold hover:bg-gold hover:text-black font-bold px-6 py-5 text-sm transition-all duration-500 hover:shadow-xl hover:shadow-gold/30 shadow-md shadow-gold/15"
              onClick={() => setIsInquiryOpen(true)}
            >
              List Your Property
            </Button>
            <Link to="/market-report">
              <Button 
                className="border-2 border-zinc-700 text-white hover:bg-zinc-800 hover:border-gold/50 hover:text-gold px-6 py-5 text-sm transition-all duration-500 hover:shadow-lg hover:shadow-gold/20 font-semibold"
              >
                <FileText className="w-4 h-4 mr-2" />
                Market Report
              </Button>
            </Link>
          </div>

          {/* Licensed Partner Network */}
          <motion.div 
            className="max-w-2xl mx-auto text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h3 className="text-zinc-400 text-xs uppercase tracking-[0.2em] mb-4">Licensed Partner Network</h3>
            <div className="flex flex-wrap justify-center gap-3">
              <Link to="/services/law-firm">
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-full text-zinc-300 text-sm hover:border-gold/40 hover:text-gold transition-all">
                  <Scale className="w-4 h-4" />
                  Legal Partners
                </span>
              </Link>
              <Link to="/mortgage-calculator">
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-full text-zinc-300 text-sm hover:border-gold/40 hover:text-gold transition-all">
                  <Calculator className="w-4 h-4" />
                  Mortgage Partners
                </span>
              </Link>
              <Link to="/services/design-build">
                <span className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-full text-zinc-300 text-sm hover:border-gold/40 hover:text-gold transition-all">
                  <Wrench className="w-4 h-4" />
                  Design & Build
                </span>
              </Link>
            </div>
            <p className="text-zinc-500 text-xs mt-4 max-w-md mx-auto">
              We introduce clients to independent licensed partners. Clients contract directly with partners.
            </p>
          </motion.div>

          {/* Tools Row - Simplified to top 4 + View All */}
          <div className="text-center">
            <h3 className="text-zinc-400 text-xs uppercase tracking-[0.2em] mb-4">Property Tools</h3>
            <div className="flex flex-wrap justify-center gap-3 mb-4">
              <Link to="/compare">
                <Button variant="outline" className="border-zinc-800 text-zinc-400 hover:border-gold/40 hover:text-gold text-xs px-4 py-3">
                  <BarChart3 className="w-3 h-3 mr-2" />
                  Compare
                </Button>
              </Link>
              <Link to="/property-evaluator">
                <Button variant="outline" className="border-zinc-800 text-zinc-400 hover:border-gold/40 hover:text-gold text-xs px-4 py-3">
                  <Calculator className="w-3 h-3 mr-2" />
                  Evaluator
                </Button>
              </Link>
              <Link to="/mortgage-calculator">
                <Button variant="outline" className="border-zinc-800 text-zinc-400 hover:border-gold/40 hover:text-gold text-xs px-4 py-3">
                  <Calculator className="w-3 h-3 mr-2" />
                  Mortgage
                </Button>
              </Link>
              <Link to="/quiz">
                <Button variant="outline" className="border-zinc-800 text-zinc-400 hover:border-gold/40 hover:text-gold text-xs px-4 py-3">
                  <Sparkles className="w-3 h-3 mr-2" />
                  AI Home Finder
                </Button>
              </Link>
            </div>
            <Link to="/ai-hub" className="text-gold text-xs hover:underline">
              View all tools →
            </Link>
          </div>
        </div>
      </section>

      {/* WHO IS THIS FOR - Clear Entry Points */}
      <section className="py-16 md:py-20 bg-zinc-950">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-zinc-400 text-xs uppercase tracking-[0.2em] mb-2">Who We Serve</h2>
            <p className="text-white text-xl md:text-2xl font-medium" style={{ fontFamily: "Poppins, sans-serif" }}>
              Find Your Starting Point
            </p>
          </div>

          {/* Audience Entry Cards - With Glow Effects */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-12">
            <Link to="/buyer-guide" className="group">
              <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 text-center hover:border-gold/40 transition-all duration-300 hover:shadow-lg hover:shadow-gold/10 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-gold/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative z-10">
                  <div className="w-10 h-10 bg-gold/10 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-gold/20 transition-colors">
                    <Heart className="w-5 h-5 text-gold" />
                  </div>
                  <h4 className="text-white text-sm font-semibold mb-1">Buyers</h4>
                  <p className="text-zinc-500 text-xs">Find your home</p>
                </div>
              </div>
            </Link>
            <Link to="/seller-guide" className="group">
              <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 text-center hover:border-gold/40 transition-all duration-300 hover:shadow-lg hover:shadow-gold/10 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-gold/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative z-10">
                  <div className="w-10 h-10 bg-gold/10 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-gold/20 transition-colors">
                    <Target className="w-5 h-5 text-gold" />
                  </div>
                  <h4 className="text-white text-sm font-semibold mb-1">Sellers</h4>
                  <p className="text-zinc-500 text-xs">List your property</p>
                </div>
              </div>
            </Link>
            <Link to="/ai-hub" className="group">
              <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 text-center hover:border-gold/40 transition-all duration-300 hover:shadow-lg hover:shadow-gold/10 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-gold/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative z-10">
                  <div className="w-10 h-10 bg-gold/10 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-gold/20 transition-colors">
                    <Briefcase className="w-5 h-5 text-gold" />
                  </div>
                  <h4 className="text-white text-sm font-semibold mb-1">Brokers</h4>
                  <p className="text-zinc-500 text-xs">Join JBJ Broker Circle</p>
                </div>
              </div>
            </Link>
            <Link to="/quiz" className="group">
              <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-5 text-center hover:border-gold/40 transition-all duration-300 hover:shadow-lg hover:shadow-gold/10 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-gold/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative z-10">
                  <div className="w-10 h-10 bg-gold/10 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-gold/20 transition-colors">
                    <Users className="w-5 h-5 text-gold" />
                  </div>
                  <h4 className="text-white text-sm font-semibold mb-1">Visitors</h4>
                  <p className="text-zinc-500 text-xs">Explore UAE Real Estate</p>
                </div>
              </div>
            </Link>
          </div>

          {/* Resources Grid */}
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Broker Toolkit Card */}
            <Link to="/broker-toolkit" className="group">
              <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 md:p-8 hover:border-gold/40 transition-all duration-300">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-gold/10 rounded-xl flex items-center justify-center">
                    <GraduationCap className="w-6 h-6 text-gold" />
                  </div>
                  <div>
                    <h3 className="text-white text-lg font-semibold">Broker Toolkit</h3>
                    <p className="text-zinc-500 text-xs">Guides & Resources</p>
                  </div>
                </div>
                <p className="text-zinc-400 text-sm mb-4">
                  Practical guides for real estate professionals.
                </p>
                <span className="text-gold text-sm group-hover:underline">
                  Explore →
                </span>
              </div>
            </Link>

            {/* Broker Hub Card - FREE highlighted */}
            <Link to="/ai-hub" className="group">
              <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 md:p-8 hover:border-gold/40 transition-all duration-300 relative overflow-hidden">
                {/* FREE Badge */}
                <div className="absolute top-4 right-4">
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-500/20 border border-green-500/40 rounded-full text-green-400 text-[10px] font-semibold uppercase tracking-wider">
                    <Sparkles className="w-3 h-3" />
                    Free
                  </span>
                </div>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-gold/10 rounded-xl flex items-center justify-center">
                    <Brain className="w-6 h-6 text-gold" />
                  </div>
                  <div>
                    <h3 className="text-white text-lg font-semibold">JBJ Broker Hub</h3>
                    <p className="text-zinc-500 text-xs">20+ Free Tools</p>
                  </div>
                </div>
                <p className="text-zinc-400 text-sm mb-4">
                  AI tools, training, HR support & coaching — all free.
                </p>
                <span className="text-gold text-sm group-hover:underline">
                  Access Broker Hub →
                </span>
              </div>
            </Link>
          </div>
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
                    alt="Jane Abou Jaoude - Founder & Managing Director"
                    className="w-full h-full object-cover object-top"
                  />
                  {/* Gradient overlay at bottom */}
                  <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/80 to-transparent" />
                </div>
                
                {/* Name badge */}
                <div className="absolute bottom-6 left-6 right-6 bg-black/60 backdrop-blur-md border border-gold/30 rounded-xl p-4">
                  <p className="text-gold text-xs uppercase tracking-[0.2em] mb-1">Founder & Managing Director</p>
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
                JBJ Global Real Estate is a founder-led brokerage built on unwavering standards, discretion, and long-term vision.
              </p>
              
              <p className="text-zinc-500 text-base md:text-lg leading-relaxed mb-8">
                Jane Abou Jaoude leads with a philosophy rooted in accountability and discretion, building organizations designed to endure rather than simply expand.
              </p>
              
              {/* Stats - Updated to 12+ Years */}
              <div className="grid grid-cols-3 gap-6 mb-8">
                <div className="text-center p-4 bg-zinc-900/50 border border-gold/10 rounded-xl hover:border-gold/30 transition-all duration-300">
                  <p className="text-transparent bg-clip-text bg-gradient-to-r from-gold via-[#C4A962] to-gold text-3xl md:text-4xl font-bold" style={{ fontFamily: "Poppins, sans-serif" }}>12+</p>
                  <p className="text-zinc-400 text-xs uppercase tracking-wider mt-1">Years Experience</p>
                </div>
                <div className="text-center p-4 bg-zinc-900/50 border border-gold/10 rounded-xl hover:border-gold/30 transition-all duration-300">
                  <p className="text-transparent bg-clip-text bg-gradient-to-r from-gold via-[#C4A962] to-gold text-3xl md:text-4xl font-bold" style={{ fontFamily: "Poppins, sans-serif" }}>5+</p>
                  <p className="text-zinc-400 text-xs uppercase tracking-wider mt-1">Years in Dubai</p>
                </div>
                <div className="text-center p-4 bg-zinc-900/50 border border-gold/10 rounded-xl hover:border-gold/30 transition-all duration-300">
                  <p className="text-transparent bg-clip-text bg-gradient-to-r from-gold via-[#C4A962] to-gold text-3xl md:text-4xl font-bold" style={{ fontFamily: "Poppins, sans-serif" }}>2,800+</p>
                  <p className="text-zinc-400 text-xs uppercase tracking-wider mt-1">Brokers Trained</p>
                </div>
              </div>
              
              <Link to="/founder">
                <Button className="relative bg-gradient-to-r from-gold via-[#C4A962] to-gold hover:from-gold-light hover:to-gold text-black font-bold px-8 py-6 text-base transition-all duration-500 hover:shadow-2xl hover:shadow-gold/50 hover:scale-105 shadow-lg shadow-gold/30 border border-gold/50">
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

      {/* MARKET REPORT CTA - Premium White Frame */}
      <section className="py-20 md:py-28 bg-black">
        <div className="container mx-auto px-4">
          <motion.div
            className="text-center mb-10"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <span className="inline-block text-gold text-xs uppercase tracking-[0.3em] mb-4">Exclusive Publication</span>
            <h2 className="text-white text-3xl md:text-4xl font-bold" style={{ fontFamily: "Poppins, sans-serif" }}>
              Free Market <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold to-gold-light">Intelligence Book</span>
            </h2>
          </motion.div>
          <MarketReportCTA />
        </div>
      </section>

      {/* BLACK SEPARATOR SECTION */}
      <section className="py-12 md:py-16 bg-gradient-to-b from-black via-zinc-950 to-black">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-6">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
            <Sparkles className="w-5 h-5 text-gold/50" />
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
          </div>
        </div>
      </section>

      {/* MORTGAGE CALCULATOR SECTION - Premium White Style */}
      <section className="py-20 md:py-28 bg-black">
        <div className="container mx-auto px-4">
          <div className="bg-gradient-to-br from-white via-zinc-50 to-white border border-gold/30 rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden">
            {/* Decorative glow elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gold/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-gold/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
            
            <motion.div
              className="text-center mb-8 relative z-10"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <span className="inline-flex items-center gap-2 px-4 py-2 bg-gold/10 border border-gold/40 rounded-full mb-4">
                <Calculator className="w-4 h-4 text-gold" />
                <span className="text-zinc-700 text-xs font-semibold uppercase tracking-wider">Mortgage Estimate</span>
              </span>
              <h3 className="text-zinc-900 text-3xl md:text-4xl font-bold" style={{ fontFamily: "Poppins, sans-serif" }}>
                Mortgage <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold via-[#C4A962] to-gold">Calculator</span>
              </h3>
              <p className="text-zinc-600 mt-3 max-w-lg mx-auto">
                Estimate your monthly payments and explore financing options with licensed mortgage partners.
              </p>
            </motion.div>
            <div className="relative z-10">
              <MortgageCalculator compact />
              <p className="text-zinc-500 text-xs text-center mt-4">
                Estimates only. Introductions to independent licensed mortgage partners.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Counter Section */}
      <StatsCounter />

      {/* Contact CTA Section - Premium Luxury Design */}
      <section className="py-20 md:py-28 bg-gradient-to-b from-black via-zinc-950 to-black relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gold/10 rounded-full blur-3xl" />
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <motion.div 
            className="text-center max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            {/* Premium badge */}
            <motion.span 
              className="inline-flex items-center gap-2 px-4 py-2 bg-gold/10 border border-gold/30 rounded-full text-gold text-xs uppercase tracking-[0.2em] mb-6"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Sparkles className="w-3 h-3" />
              Begin Your Journey
            </motion.span>
            
            <h3 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6" style={{ fontFamily: "Poppins, sans-serif" }}>
              Ready to <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold via-[#C4A962] to-gold">Get Started?</span>
            </h3>
            <p className="text-zinc-400 text-base md:text-lg mb-10 leading-relaxed max-w-xl mx-auto">
              Connect with our expert team to explore exclusive opportunities in Dubai's premier real estate market.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button 
                className="relative bg-gradient-to-r from-gold via-[#C4A962] to-gold hover:from-gold-light hover:to-gold text-black font-bold px-10 py-6 text-base transition-all duration-500 hover:shadow-2xl hover:shadow-gold/50 hover:scale-105 shadow-lg shadow-gold/30 border border-gold/50"
                onClick={() => setIsInquiryOpen(true)}
              >
                Book Consultation
                <ArrowUpRight className="w-5 h-5 ml-2" />
              </Button>
              <Link to="/properties">
                <Button 
                  className="border-2 border-zinc-700 text-white hover:bg-zinc-800 hover:border-gold/50 hover:text-gold px-10 py-6 text-base transition-all duration-500 hover:shadow-lg hover:shadow-gold/20 font-semibold"
                >
                  Browse Properties
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>


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
