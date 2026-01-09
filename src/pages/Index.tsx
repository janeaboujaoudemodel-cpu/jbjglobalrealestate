import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Footer from "@/components/Footer";
import StatsCounter from "@/components/StatsCounter";
import AIComparisonWidget from "@/components/AIComparisonWidget";
import MarketReportCTA from "@/components/MarketReportCTA";
import MortgageCalculator from "@/components/MortgageCalculator";
import WelcomeModal from "@/components/WelcomeModal";
import RoleSelectionModal from "@/components/RoleSelectionModal";
import BrokerOnboardingBanner from "@/components/BrokerOnboardingBanner";
import InquiryFormModal from "@/components/InquiryFormModal";
import InstallAppButton from "@/components/InstallAppButton";
import CookiesConsentBanner from "@/components/CookiesConsentBanner";
import { SEOHead, pagesSEO } from "@/components/SEOHead";
import { useLanguage } from "@/contexts/LanguageContext";
import { useUserRole } from "@/hooks/useUserRole";
import { Sparkles, ArrowUpRight, ChevronDown, User, Scale, Layers, Calculator, FileText, Heart, BarChart3, Wrench, Ruler, Palette, Calendar, Wallet, ShoppingBag, Brain, GraduationCap, Briefcase, Target, Award, PenTool, Users, Table2, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import founderProfessional from "@/assets/founder-professional.jpeg";
import luxuryVillaHero from "@/assets/luxury-villa-hero.jpeg"; // Used in other sections
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
      
      {/* Welcome Modal - AI Assistant Popup on first load */}
      <WelcomeModal />
      
      {/* Role Selection Modal - Shows after welcome modal */}
      <RoleSelectionModal />
      
      {/* Broker Onboarding Banner - Only for brokers */}
      {isBroker && <BrokerOnboardingBanner />}
      
      {/* Cookies Consent Banner */}
      <CookiesConsentBanner />
      
      {/* Floating Install App Button */}
      <InstallAppButton />

      {/* HERO SECTION - QUIET LUXURY */}
      <div className="relative min-h-screen flex items-center justify-center">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${luxuryVillaHero})` }}
        />
        
        {/* Refined Dark Overlay - Less heavy */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/50 to-black/70" />
        
        {/* Content */}
        <motion.div 
          className="relative z-10 text-center px-4 max-w-3xl mx-auto"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          {/* Badge */}
          <motion.span 
            variants={fadeInUp}
            className="inline-block px-4 py-1.5 border border-gold/40 rounded-full text-gold text-[10px] md:text-xs uppercase tracking-[0.3em] mb-8"
          >
            Real Estate Brokerage
          </motion.span>
          
          {/* H1 - Cleaner, tighter */}
          <motion.h1 
            variants={fadeInUp} 
            className="text-white text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight leading-[1.1] mb-6"
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            Buy & Sell Brokerage<br />
            <span className="text-gold">in Dubai</span>
          </motion.h1>
          
          {/* Subline - Muted, refined */}
          <motion.p 
            variants={fadeInUp}
            className="text-zinc-300 text-sm md:text-base lg:text-lg max-w-xl mx-auto leading-relaxed mb-4"
          >
            Client-first guidance, property search, and transaction coordination.
          </motion.p>

          {/* Partner microline */}
          <motion.p 
            variants={fadeInUp}
            className="text-zinc-500 text-xs md:text-sm mb-10"
          >
            Licensed partners available for legal and mortgage introductions.
          </motion.p>

          {/* Two CTAs Only */}
          <motion.div 
            variants={fadeInUp}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link to="/properties">
              <Button className="bg-gold hover:bg-gold-light text-black font-semibold px-8 py-6 text-sm tracking-wide transition-all duration-300 hover:shadow-lg hover:shadow-gold/20">
                Browse Properties
                <ArrowUpRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Button 
              variant="outline"
              className="border-gold/50 text-gold hover:bg-gold/10 hover:border-gold font-medium px-8 py-6 text-sm tracking-wide transition-all duration-300"
              onClick={() => setIsInquiryOpen(true)}
            >
              Book Consultation
            </Button>
          </motion.div>
        </motion.div>
        
        {/* Scroll indicator - Subtle */}
        <motion.div 
          className="absolute bottom-8 left-0 right-0 flex flex-col items-center gap-2 text-zinc-500 z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2, duration: 1 }}
        >
          <ChevronDown className="w-5 h-5 animate-bounce" />
        </motion.div>
      </div>

      {/* QUICK ACTIONS - Simplified */}
      <section className="py-16 md:py-20 bg-black">
        <div className="container mx-auto px-4">
          {/* Primary Services Row */}
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            <Link to="/properties">
              <Button className="bg-gold hover:bg-gold-light text-black font-semibold px-6 py-5 text-sm transition-all duration-300">
                Explore Properties
                <ArrowUpRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Button 
              variant="outline"
              className="border-gold/40 text-gold hover:bg-gold/10 hover:border-gold px-6 py-5 text-sm transition-all duration-300"
              onClick={() => setIsInquiryOpen(true)}
            >
              List Your Property
            </Button>
            <Link to="/market-report">
              <Button 
                variant="outline"
                className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:border-zinc-600 px-6 py-5 text-sm transition-all duration-300"
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

      {/* RESOURCES SECTION - Simplified */}
      <section className="py-16 md:py-20 bg-zinc-950">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-zinc-400 text-xs uppercase tracking-[0.2em] mb-2">Resources</h2>
            <p className="text-white text-xl md:text-2xl font-medium" style={{ fontFamily: "Poppins, sans-serif" }}>
              Tools for Real Estate Professionals
            </p>
          </div>

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

            {/* AI Tools Card */}
            <Link to="/ai-hub" className="group">
              <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 md:p-8 hover:border-zinc-700 transition-all duration-300">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-zinc-800 rounded-xl flex items-center justify-center">
                    <Brain className="w-6 h-6 text-zinc-400" />
                  </div>
                  <div>
                    <h3 className="text-white text-lg font-semibold">AI Assistant Hub</h3>
                    <p className="text-zinc-500 text-xs">10+ Tools</p>
                  </div>
                </div>
                <p className="text-zinc-400 text-sm mb-4">
                  AI-powered property tools and assistants.
                </p>
                <span className="text-zinc-400 text-sm group-hover:text-gold group-hover:underline transition-colors">
                  View all →
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
                    alt="Jane Abou Jaoude - Founder & CEO" 
                    className="w-full h-full object-cover object-top"
                  />
                  {/* Gradient overlay at bottom */}
                  <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/80 to-transparent" />
                </div>
                
                {/* Name badge */}
                <div className="absolute bottom-6 left-6 right-6 bg-black/60 backdrop-blur-md border border-gold/30 rounded-xl p-4">
                  <p className="text-gold text-xs uppercase tracking-[0.2em] mb-1">Founder & CEO</p>
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
              
              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 mb-8">
                <div className="text-center">
                  <p className="text-gold text-3xl md:text-4xl font-bold" style={{ fontFamily: "Poppins, sans-serif" }}>3</p>
                  <p className="text-zinc-500 text-xs uppercase tracking-wider">Services</p>
                </div>
                <div className="text-center">
                  <p className="text-gold text-3xl md:text-4xl font-bold" style={{ fontFamily: "Poppins, sans-serif" }}>5+</p>
                  <p className="text-zinc-500 text-xs uppercase tracking-wider">Years in Dubai</p>
                </div>
                <div className="text-center">
                  <p className="text-gold text-3xl md:text-4xl font-bold" style={{ fontFamily: "Poppins, sans-serif" }}>2,800+</p>
                  <p className="text-zinc-500 text-xs uppercase tracking-wider">Brokers Trained</p>
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

      {/* Contact CTA Section - Quiet Luxury */}
      <section className="py-20 md:py-24 bg-black">
        <div className="container mx-auto px-4">
          <motion.div 
            className="text-center max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h3 className="text-2xl md:text-3xl font-semibold text-white mb-4" style={{ fontFamily: "Poppins, sans-serif" }}>
              Ready to Get Started?
            </h3>
            <p className="text-zinc-500 text-sm md:text-base mb-8 leading-relaxed">
              Connect with our team to discuss buying or selling real estate in Dubai.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button 
                className="bg-gold hover:bg-gold-light text-black font-semibold px-8 py-6 text-sm transition-all duration-300"
                onClick={() => setIsInquiryOpen(true)}
              >
                Book Consultation
                <ArrowUpRight className="w-4 h-4 ml-2" />
              </Button>
              <Link to="/properties">
                <Button 
                  variant="outline"
                  className="border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:border-zinc-600 px-8 py-6 text-sm transition-all duration-300"
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
