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
import BestIdeaAward from "@/components/BestIdeaAward";

import { SEOHead, pagesSEO } from "@/components/SEOHead";
import { useLanguage } from "@/contexts/LanguageContext";
import { useUserRole } from "@/hooks/useUserRole";
import { Sparkles, ArrowUpRight, ArrowRight, ChevronDown, User, Scale, Layers, Calculator, FileText, Heart, BarChart3, Wrench, Ruler, Palette, Calendar, Wallet, ShoppingBag, Brain, GraduationCap, Briefcase, Target, Award, PenTool, Users, Table2, Video, Home, Key } from "lucide-react";
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
        {/* Video Background - Luxury Dubai Drone Footage */}
        <div className="absolute inset-0">
          {/* Fallback image - always visible as base layer */}
          <img 
            src={luxuryVillaHero} 
            alt="Luxury Dubai Real Estate" 
            className="absolute inset-0 w-full h-full object-cover"
          />
          {/* Video overlays the image when it loads/plays */}
          <video 
            autoPlay 
            loop 
            muted 
            playsInline
            preload="auto"
            webkit-playsinline="true"
            x-webkit-airplay="allow"
            className="absolute inset-0 w-full h-full object-cover z-[1]"
            style={{ 
              WebkitTransform: 'translateZ(0)',
              backfaceVisibility: 'hidden',
            }}
          >
            <source src="/videos/hero-video.mp4" type="video/mp4" />
          </video>
          {/* Video overlay gradient - above video */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-black/80 z-[2]" />
          {/* Additional cinematic vignette */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-transparent to-black/60 z-[2]" />
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
        
        {/* Content - Compact for video visibility */}
        <motion.div 
          className="relative z-10 text-center px-4 max-w-3xl mx-auto"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          {/* H1 - 2-line layout: Buy Sell Rent on line 1, Delivered with Intelligence on line 2 */}
          <motion.h1 
            variants={fadeInUp} 
            className="text-white text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] mb-3 md:mb-5 px-2 sm:px-0"
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            <span className="block whitespace-nowrap">
              Buy<span className="inline-block w-1.5 h-1.5 rounded-full mx-1 align-middle" style={{ background: 'linear-gradient(135deg, #D4AF37, #E8DCC8)', boxShadow: '0 0 8px rgba(200,167,102,0.8)' }}></span>
              Sell<span className="inline-block w-1.5 h-1.5 rounded-full mx-1 align-middle" style={{ background: 'linear-gradient(135deg, #D4AF37, #E8DCC8)', boxShadow: '0 0 8px rgba(200,167,102,0.8)' }}></span>
              Rent<span className="inline-block w-1.5 h-1.5 rounded-full mx-1 align-middle" style={{ background: 'linear-gradient(135deg, #D4AF37, #E8DCC8)', boxShadow: '0 0 8px rgba(200,167,102,0.8)' }}></span>
            </span>
            <span 
              className="block bg-gradient-to-r from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] bg-clip-text text-transparent mt-1"
              style={{ 
                filter: 'drop-shadow(0 0 12px rgba(200,167,102,0.5)) drop-shadow(0 0 20px rgba(200,167,102,0.35))',
                textShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
              }}
            >
              Delivered with Intelligence.
            </span>
          </motion.h1>
          
          {/* Subline - Compact */}
          <motion.p 
            variants={fadeInUp}
            className="text-zinc-300 text-sm md:text-base lg:text-lg max-w-xl mx-auto leading-relaxed mb-2 md:mb-3"
          >
            Luxury Licensed Real Estate Brokerage for buying, selling & renting in the UAE.
          </motion.p>

          {/* Partner microline - Hidden on smallest screens */}
          <motion.p 
            variants={fadeInUp}
            className="hidden sm:block text-zinc-300/80 text-xs md:text-sm mb-6 md:mb-8 font-medium tracking-wide"
          >
            Mortgage, Legal & Visa Services provided through licensed partners.
          </motion.p>

          {/* Hero CTA Buttons - Smaller on phone, current size on tablet/desktop */}
          <motion.div 
            variants={fadeInUp}
            className="flex flex-row items-center justify-center gap-2 sm:gap-3 md:gap-4 mt-4 sm:mt-0"
          >
            <Link to="/properties">
              <button 
                className="group relative inline-flex items-center justify-center gap-1 sm:gap-1.5 md:gap-2 px-3 sm:px-6 md:px-8 lg:px-10 py-2 sm:py-3 md:py-4 text-[10px] sm:text-sm md:text-base font-bold rounded-md sm:rounded-lg md:rounded-xl transition-all duration-300 bg-transparent"
                style={{
                  border: '2px solid rgba(255,255,255,0.8)',
                  boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.2), inset 0 -1px 2px rgba(0,0,0,0.3), 0 4px 15px rgba(0,0,0,0.4)',
                }}
              >
                <span className="text-white group-hover:text-black transition-colors">Explore</span>
                <ArrowUpRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-5 md:h-5 text-gold group-hover:text-black transition-colors" style={{ filter: 'drop-shadow(0 0 6px rgba(200,167,102,0.8))' }} />
                {/* Hover fill overlay */}
                <span className="absolute inset-0 rounded-md sm:rounded-lg md:rounded-xl bg-gradient-to-r from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" style={{ border: '2px solid rgba(200,167,102,0.6)' }} />
              </button>
            </Link>
            <button 
              onClick={() => setIsInquiryOpen(true)}
              className="group relative inline-flex items-center justify-center gap-1 sm:gap-1.5 md:gap-2 px-3 sm:px-6 md:px-8 lg:px-10 py-2 sm:py-3 md:py-4 text-[10px] sm:text-sm md:text-base font-bold rounded-md sm:rounded-lg md:rounded-xl transition-all duration-300 bg-transparent"
              style={{
                border: '2px solid rgba(255,255,255,0.8)',
                boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.2), inset 0 -1px 2px rgba(0,0,0,0.3), 0 4px 15px rgba(0,0,0,0.4)',
              }}
            >
              <span className="text-white group-hover:text-black transition-colors">Book a Consultation</span>
              <ArrowUpRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-5 md:h-5 text-gold transition-colors" style={{ filter: 'drop-shadow(0 0 6px rgba(200,167,102,0.8))' }} />
              {/* Hover fill overlay */}
              <span className="absolute inset-0 rounded-md sm:rounded-lg md:rounded-xl bg-gradient-to-r from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" style={{ border: '2px solid rgba(200,167,102,0.6)' }} />
            </button>
          </motion.div>
        </motion.div>
        
        {/* Scroll indicator - Animated */}
        <motion.div 
          className="absolute bottom-8 left-0 right-0 flex flex-col items-center gap-2 z-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2, duration: 1 }}
        >
          <span 
            className="text-[10px] uppercase tracking-[0.3em] bg-gradient-to-r from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] bg-clip-text text-transparent"
            style={{ 
              filter: 'drop-shadow(0 0 8px rgba(200,167,102,0.5)) drop-shadow(0 0 16px rgba(200,167,102,0.35))',
              textShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
            }}
          >Discover</span>
          <ChevronDown 
            className="w-5 h-5 animate-bounce" 
            style={{ 
              color: '#E8DCC8',
              filter: 'drop-shadow(0 0 8px rgba(200,167,102,0.6)) drop-shadow(0 0 16px rgba(200,167,102,0.4))',
            }} 
          />
        </motion.div>
      </div>

      {/* DEVELOPER PARTNERS MARQUEE */}
      <DeveloperPartnersMarquee />

      {/* AI HOME FINDER - Premium CTA Section - Gold glow on normal, white on hover */}
      <section className="py-10 md:py-14 bg-black">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl mx-auto"
          >
            <Link to="/quiz" className="block group">
              <div 
                className="relative bg-gradient-to-br from-purple-900/40 via-purple-800/30 to-purple-900/40 backdrop-blur-md rounded-2xl p-8 md:p-10 text-center transition-all duration-500 group-hover:translate-y-[-4px] group-hover:scale-[1.02]"
                style={{
                  border: '2px solid rgba(147,51,234,0.5)',
                  boxShadow: '0 0 12px rgba(255,255,255,0.2), 0 0 25px rgba(147,51,234,0.15), inset 0 1px 2px rgba(255,255,255,0.1)',
                }}
              >
                {/* White border glow on normal load */}
                <div 
                  className="absolute inset-0 rounded-2xl pointer-events-none"
                  style={{
                    boxShadow: '0 0 15px rgba(255,255,255,0.15), 0 0 8px rgba(255,255,255,0.1)',
                  }}
                />
                {/* 3D hover effect - coming out of screen */}
                <div 
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none"
                  style={{
                    boxShadow: '0 12px 35px rgba(0,0,0,0.4), 0 0 25px rgba(255,255,255,0.3), 0 0 50px rgba(147,51,234,0.25), inset 0 -2px 5px rgba(0,0,0,0.2)',
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-purple-600/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="relative z-10">
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <Sparkles className="w-8 h-8 text-purple-400 group-hover:text-purple-300 transition-colors" />
                    <h2 
                      className="text-white text-2xl md:text-3xl lg:text-4xl font-bold tracking-wide" 
                      style={{ 
                        fontFamily: "Poppins, sans-serif",
                        textShadow: '0 2px 4px rgba(0,0,0,0.4)',
                      }}
                    >
                      AI Home Finder
                    </h2>
                    <ArrowUpRight className="w-7 h-7 text-purple-400 group-hover:text-purple-300 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-300" />
                  </div>
                  
                  <p className="text-white text-base md:text-lg">
                    Take your free test and discover your perfect property match
                  </p>
                </div>
              </div>
            </Link>
          </motion.div>
        </div>
      </section>


      {/* WHO IS THIS FOR - Clear Entry Points with Champagne Layer */}
      <section className="py-16 md:py-20 bg-black">
        <div className="mx-4 md:mx-8 lg:mx-16 py-10 px-4 bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] rounded-2xl border border-gold/30 shadow-lg">
          <div className="text-center mb-10">
            <span className="inline-flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border-2 border-gold rounded-full text-xs uppercase tracking-[0.2em] font-semibold shadow-md">
              <Users className="w-3 h-3 text-gold" />
              <span className="text-black">Find Your</span>
              <span className="text-gold">Starting Point</span>
            </span>
          </div>

          {/* Audience Entry Cards - 3D style with gold border, transparent bg, matching first line style */}
          <div className="flex justify-center gap-2 md:gap-3 max-w-5xl mx-auto mb-10 flex-wrap md:flex-nowrap">
            <Link to="/buyer-guide" className="group flex-1 min-w-[70px] max-w-[100px] md:max-w-none">
              <div className="bg-gradient-to-r from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border-2 border-gold/40 rounded-lg p-2 md:p-3 text-center hover:border-gold hover:shadow-[0_0_30px_rgba(200,167,102,0.5),0_20px_40px_rgba(0,0,0,0.35)] hover:-translate-y-1 shadow-[0_8px_25px_rgba(200,167,102,0.35),0_4px_12px_rgba(0,0,0,0.2)] transition-all duration-300 relative overflow-hidden h-full">
                <div className="relative z-10">
                  <div className="w-7 h-7 md:w-8 md:h-8 bg-transparent border-2 border-gold group-hover:border-black rounded-lg flex items-center justify-center mx-auto mb-1 md:mb-2 transition-colors shadow-md">
                    <Heart className="w-3.5 h-3.5 md:w-4 md:h-4 text-black group-hover:text-gold transition-colors" />
                  </div>
                  <h4 className="text-black group-hover:text-gold text-[10px] md:text-xs font-semibold transition-colors">Buyers</h4>
                </div>
              </div>
            </Link>
            <Link to="/seller-guide" className="group flex-1 min-w-[70px] max-w-[100px] md:max-w-none">
              <div className="bg-gradient-to-r from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border-2 border-gold/40 rounded-lg p-2 md:p-3 text-center hover:border-gold hover:shadow-[0_0_30px_rgba(200,167,102,0.5),0_20px_40px_rgba(0,0,0,0.35)] hover:-translate-y-1 shadow-[0_8px_25px_rgba(200,167,102,0.35),0_4px_12px_rgba(0,0,0,0.2)] transition-all duration-300 relative overflow-hidden h-full">
                <div className="relative z-10">
                  <div className="w-7 h-7 md:w-8 md:h-8 bg-transparent border-2 border-gold group-hover:border-black rounded-lg flex items-center justify-center mx-auto mb-1 md:mb-2 transition-colors shadow-md">
                    <Target className="w-3.5 h-3.5 md:w-4 md:h-4 text-black group-hover:text-gold transition-colors" />
                  </div>
                  <h4 className="text-black group-hover:text-gold text-[10px] md:text-xs font-semibold transition-colors">Sellers</h4>
                </div>
              </div>
            </Link>
            <Link to="/rent-guide" className="group flex-1 min-w-[70px] max-w-[100px] md:max-w-none">
              <div className="bg-gradient-to-r from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border-2 border-gold/40 rounded-lg p-2 md:p-3 text-center hover:border-gold hover:shadow-[0_0_30px_rgba(200,167,102,0.5),0_20px_40px_rgba(0,0,0,0.35)] hover:-translate-y-1 shadow-[0_8px_25px_rgba(200,167,102,0.35),0_4px_12px_rgba(0,0,0,0.2)] transition-all duration-300 relative overflow-hidden h-full">
                <div className="relative z-10">
                  <div className="w-7 h-7 md:w-8 md:h-8 bg-transparent border-2 border-gold group-hover:border-black rounded-lg flex items-center justify-center mx-auto mb-1 md:mb-2 transition-colors shadow-md">
                    <Key className="w-3.5 h-3.5 md:w-4 md:h-4 text-black group-hover:text-gold transition-colors" />
                  </div>
                  <h4 className="text-black group-hover:text-gold text-[10px] md:text-xs font-semibold transition-colors">Rentals</h4>
                </div>
              </div>
            </Link>
            <Link to="/ai-hub" className="group flex-1 min-w-[70px] max-w-[100px] md:max-w-none">
              <div className="bg-gradient-to-r from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border-2 border-gold/40 rounded-lg p-2 md:p-3 text-center hover:border-gold hover:shadow-[0_0_30px_rgba(200,167,102,0.5),0_20px_40px_rgba(0,0,0,0.35)] hover:-translate-y-1 shadow-[0_8px_25px_rgba(200,167,102,0.35),0_4px_12px_rgba(0,0,0,0.2)] transition-all duration-300 relative overflow-hidden h-full">
                <div className="relative z-10">
                  <div className="w-7 h-7 md:w-8 md:h-8 bg-transparent border-2 border-gold group-hover:border-black rounded-lg flex items-center justify-center mx-auto mb-1 md:mb-2 transition-colors shadow-md">
                    <Layers className="w-3.5 h-3.5 md:w-4 md:h-4 text-black group-hover:text-gold transition-colors" />
                  </div>
                  <h4 className="text-black group-hover:text-gold text-[10px] md:text-xs font-semibold transition-colors">Investors</h4>
                </div>
              </div>
            </Link>
            <Link to="/quiz" className="group flex-1 min-w-[70px] max-w-[100px] md:max-w-none">
              <div className="bg-gradient-to-r from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border-2 border-gold/40 rounded-lg p-2 md:p-3 text-center hover:border-gold hover:shadow-[0_0_30px_rgba(200,167,102,0.5),0_20px_40px_rgba(0,0,0,0.35)] hover:-translate-y-1 shadow-[0_8px_25px_rgba(200,167,102,0.35),0_4px_12px_rgba(0,0,0,0.2)] transition-all duration-300 relative overflow-hidden h-full">
                <div className="relative z-10">
                  <div className="w-7 h-7 md:w-8 md:h-8 bg-transparent border-2 border-gold group-hover:border-black rounded-lg flex items-center justify-center mx-auto mb-1 md:mb-2 transition-colors shadow-md">
                    <Users className="w-3.5 h-3.5 md:w-4 md:h-4 text-black group-hover:text-gold transition-colors" />
                  </div>
                  <h4 className="text-black group-hover:text-gold text-[10px] md:text-xs font-semibold transition-colors">Visitors</h4>
                </div>
              </div>
            </Link>
            <Link to="/referral" className="group flex-1 min-w-[70px] max-w-[100px] md:max-w-none">
              <div className="bg-gradient-to-r from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border-2 border-gold/40 rounded-lg p-2 md:p-3 text-center hover:border-gold hover:shadow-[0_0_30px_rgba(200,167,102,0.5),0_20px_40px_rgba(0,0,0,0.35)] hover:-translate-y-1 shadow-[0_8px_25px_rgba(200,167,102,0.35),0_4px_12px_rgba(0,0,0,0.2)] transition-all duration-300 relative overflow-hidden h-full">
                <div className="relative z-10">
                  <div className="w-7 h-7 md:w-8 md:h-8 bg-transparent border-2 border-gold group-hover:border-black rounded-lg flex items-center justify-center mx-auto mb-1 md:mb-2 transition-colors shadow-md">
                    <Award className="w-3.5 h-3.5 md:w-4 md:h-4 text-black group-hover:text-gold transition-colors" />
                  </div>
                  <h4 className="text-black group-hover:text-gold text-[10px] md:text-xs font-semibold transition-colors">Referral</h4>
                </div>
              </div>
            </Link>
            <Link to="/join" className="group flex-1 min-w-[70px] max-w-[100px] md:max-w-none">
              <div className="bg-gradient-to-r from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border-2 border-gold/40 rounded-lg p-2 md:p-3 text-center hover:border-gold hover:shadow-[0_0_30px_rgba(200,167,102,0.5),0_20px_40px_rgba(0,0,0,0.35)] hover:-translate-y-1 shadow-[0_8px_25px_rgba(200,167,102,0.35),0_4px_12px_rgba(0,0,0,0.2)] transition-all duration-300 relative overflow-hidden h-full">
                <div className="relative z-10">
                  <div className="w-7 h-7 md:w-8 md:h-8 bg-transparent border-2 border-gold group-hover:border-black rounded-lg flex items-center justify-center mx-auto mb-1 md:mb-2 transition-colors shadow-md">
                    <GraduationCap className="w-3.5 h-3.5 md:w-4 md:h-4 text-black group-hover:text-gold transition-colors" />
                  </div>
                  <h4 className="text-black group-hover:text-gold text-[10px] md:text-xs font-semibold transition-colors">Careers</h4>
                </div>
              </div>
            </Link>
          </div>

          {/* Quick Actions + Partner Network - Second line matches first line style (active champagne) */}
          <div className="flex justify-center gap-2 md:gap-3 max-w-6xl mx-auto mb-12 flex-wrap lg:flex-nowrap">
            <Link to="/properties" className="group flex-1 min-w-[100px] max-w-[140px]">
              <div className="bg-gradient-to-r from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border-2 border-gold/40 rounded-xl p-3 md:p-4 text-center hover:border-gold hover:shadow-[0_0_30px_rgba(200,167,102,0.5),0_20px_40px_rgba(0,0,0,0.35)] hover:-translate-y-1 shadow-[0_8px_25px_rgba(200,167,102,0.35),0_4px_12px_rgba(0,0,0,0.2)] transition-all duration-300 relative overflow-hidden h-full">
                <div className="relative z-10">
                  <div className="w-8 h-8 md:w-9 md:h-9 bg-transparent border-2 border-gold group-hover:border-black rounded-lg flex items-center justify-center mx-auto mb-2 transition-colors shadow-md">
                    <Home className="w-4 h-4 md:w-4.5 md:h-4.5 text-black group-hover:text-gold transition-colors" />
                  </div>
                  <h4 className="text-black group-hover:text-gold text-[10px] md:text-xs font-semibold mb-0.5 transition-colors">Explore Properties</h4>
                  <p className="text-gold group-hover:text-black text-[9px] md:text-[10px] transition-colors hidden md:block">Browse listings</p>
                </div>
              </div>
            </Link>
            <Link to="/seller-listing" className="group flex-1 min-w-[100px] max-w-[140px]">
              <div className="bg-gradient-to-r from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border-2 border-gold/40 rounded-xl p-3 md:p-4 text-center hover:border-gold hover:shadow-[0_0_30px_rgba(200,167,102,0.5),0_20px_40px_rgba(0,0,0,0.35)] hover:-translate-y-1 shadow-[0_8px_25px_rgba(200,167,102,0.35),0_4px_12px_rgba(0,0,0,0.2)] transition-all duration-300 relative overflow-hidden h-full">
                <div className="relative z-10">
                  <div className="w-8 h-8 md:w-9 md:h-9 bg-transparent border-2 border-gold group-hover:border-black rounded-lg flex items-center justify-center mx-auto mb-2 transition-colors shadow-md">
                    <Target className="w-4 h-4 md:w-4.5 md:h-4.5 text-black group-hover:text-gold transition-colors" />
                  </div>
                  <h4 className="text-black group-hover:text-gold text-[10px] md:text-xs font-semibold mb-0.5 transition-colors">List Your Property</h4>
                  <p className="text-gold group-hover:text-black text-[9px] md:text-[10px] transition-colors hidden md:block">Sell or rent</p>
                </div>
              </div>
            </Link>
            <Link to="/market-report" className="group flex-1 min-w-[100px] max-w-[140px]">
              <div className="bg-gradient-to-r from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border-2 border-gold/40 rounded-xl p-3 md:p-4 text-center hover:border-gold hover:shadow-[0_0_30px_rgba(200,167,102,0.5),0_20px_40px_rgba(0,0,0,0.35)] hover:-translate-y-1 shadow-[0_8px_25px_rgba(200,167,102,0.35),0_4px_12px_rgba(0,0,0,0.2)] transition-all duration-300 relative overflow-hidden h-full">
                <div className="relative z-10">
                  <div className="w-8 h-8 md:w-9 md:h-9 bg-transparent border-2 border-gold group-hover:border-black rounded-lg flex items-center justify-center mx-auto mb-2 transition-colors shadow-md">
                    <FileText className="w-4 h-4 md:w-4.5 md:h-4.5 text-black group-hover:text-gold transition-colors" />
                  </div>
                  <h4 className="text-black group-hover:text-gold text-[10px] md:text-xs font-semibold mb-0.5 transition-colors">Market Report</h4>
                  <p className="text-gold group-hover:text-black text-[9px] md:text-[10px] transition-colors hidden md:block">Latest insights</p>
                </div>
              </div>
            </Link>
            <Link to="/ai-hub" className="group flex-1 min-w-[100px] max-w-[140px]">
              <div className="bg-gradient-to-r from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border-2 border-gold/40 rounded-xl p-3 md:p-4 text-center hover:border-gold hover:shadow-[0_0_30px_rgba(200,167,102,0.5),0_20px_40px_rgba(0,0,0,0.35)] hover:-translate-y-1 shadow-[0_8px_25px_rgba(200,167,102,0.35),0_4px_12px_rgba(0,0,0,0.2)] transition-all duration-300 relative overflow-hidden h-full">
                <div className="relative z-10">
                  <div className="w-8 h-8 md:w-9 md:h-9 bg-transparent border-2 border-gold group-hover:border-black rounded-lg flex items-center justify-center mx-auto mb-2 transition-colors shadow-md">
                    <Layers className="w-4 h-4 md:w-4.5 md:h-4.5 text-black group-hover:text-gold transition-colors" />
                  </div>
                  <h4 className="text-black group-hover:text-gold text-[10px] md:text-xs font-semibold mb-0.5 transition-colors">Investor Hub</h4>
                  <p className="text-gold group-hover:text-black text-[9px] md:text-[10px] transition-colors hidden md:block">AI-powered tools</p>
                </div>
              </div>
            </Link>
            <Link to="/services/law-firm" className="group flex-1 min-w-[100px] max-w-[140px]">
              <div className="bg-gradient-to-r from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border-2 border-gold/40 rounded-xl p-3 md:p-4 text-center hover:border-gold hover:shadow-[0_0_30px_rgba(200,167,102,0.5),0_20px_40px_rgba(0,0,0,0.35)] hover:-translate-y-1 shadow-[0_8px_25px_rgba(200,167,102,0.35),0_4px_12px_rgba(0,0,0,0.2)] transition-all duration-300 relative overflow-hidden h-full">
                <div className="relative z-10">
                  <div className="w-8 h-8 md:w-9 md:h-9 bg-transparent border-2 border-gold group-hover:border-black rounded-lg flex items-center justify-center mx-auto mb-2 transition-colors shadow-md">
                    <Scale className="w-4 h-4 md:w-4.5 md:h-4.5 text-black group-hover:text-gold transition-colors" />
                  </div>
                  <h4 className="text-black group-hover:text-gold text-[10px] md:text-xs font-semibold mb-0.5 transition-colors">Legal Partners</h4>
                  <p className="text-gold group-hover:text-black text-[9px] md:text-[10px] transition-colors hidden md:block">Legal services</p>
                </div>
              </div>
            </Link>
            <Link to="/mortgage-calculator" className="group flex-1 min-w-[100px] max-w-[140px]">
              <div className="bg-gradient-to-r from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border-2 border-gold/40 rounded-xl p-3 md:p-4 text-center hover:border-gold hover:shadow-[0_0_30px_rgba(200,167,102,0.5),0_20px_40px_rgba(0,0,0,0.35)] hover:-translate-y-1 shadow-[0_8px_25px_rgba(200,167,102,0.35),0_4px_12px_rgba(0,0,0,0.2)] transition-all duration-300 relative overflow-hidden h-full">
                <div className="relative z-10">
                  <div className="w-8 h-8 md:w-9 md:h-9 bg-transparent border-2 border-gold group-hover:border-black rounded-lg flex items-center justify-center mx-auto mb-2 transition-colors shadow-md">
                    <Calculator className="w-4 h-4 md:w-4.5 md:h-4.5 text-black group-hover:text-gold transition-colors" />
                  </div>
                  <h4 className="text-black group-hover:text-gold text-[10px] md:text-xs font-semibold mb-0.5 transition-colors">Mortgage Partners</h4>
                  <p className="text-gold group-hover:text-black text-[9px] md:text-[10px] transition-colors hidden md:block">Financing options</p>
                </div>
              </div>
            </Link>
            <Link to="/services/design-build" className="group flex-1 min-w-[100px] max-w-[140px]">
              <div className="bg-gradient-to-r from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border-2 border-gold/40 rounded-xl p-3 md:p-4 text-center hover:border-gold hover:shadow-[0_0_30px_rgba(200,167,102,0.5),0_20px_40px_rgba(0,0,0,0.35)] hover:-translate-y-1 shadow-[0_8px_25px_rgba(200,167,102,0.35),0_4px_12px_rgba(0,0,0,0.2)] transition-all duration-300 relative overflow-hidden h-full">
                <div className="relative z-10">
                  <div className="w-8 h-8 md:w-9 md:h-9 bg-transparent border-2 border-gold group-hover:border-black rounded-lg flex items-center justify-center mx-auto mb-2 transition-colors shadow-md">
                    <Wrench className="w-4 h-4 md:w-4.5 md:h-4.5 text-black group-hover:text-gold transition-colors" />
                  </div>
                  <h4 className="text-black group-hover:text-gold text-[10px] md:text-xs font-semibold mb-0.5 transition-colors">Design & Build</h4>
                  <p className="text-gold group-hover:text-black text-[9px] md:text-[10px] transition-colors hidden md:block">Construction & fit-out</p>
                </div>
              </div>
            </Link>
          </div>


          {/* Resources Grid - Active color fill with 3D hover effect */}
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* JBJ Broker Hub Card - 3D styling matching other cards */}
            <Link to="/broker-toolkit" className="group">
              <div className="bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border-2 border-gold/40 rounded-2xl p-6 md:p-8 hover:border-gold hover:shadow-[0_0_30px_rgba(200,167,102,0.5),0_20px_40px_rgba(0,0,0,0.35)] hover:-translate-y-1 shadow-[0_8px_25px_rgba(200,167,102,0.35),0_4px_12px_rgba(0,0,0,0.2)] transition-all duration-300">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-transparent border-2 border-gold group-hover:border-black rounded-xl flex items-center justify-center shadow-lg shadow-gold/40 transition-all duration-300">
                    <Briefcase className="w-6 h-6 text-black group-hover:text-gold transition-colors" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">
                      <span className="text-gold group-hover:text-black transition-colors">JBJ</span>{" "}
                      <span className="text-black group-hover:text-gold transition-colors">Broker Hub</span>
                    </h3>
                    <p className="text-zinc-600 group-hover:text-gold text-xs transition-colors">Professional Tools & Resources</p>
                  </div>
                </div>
                <p className="text-zinc-700 group-hover:text-zinc-600 text-sm mb-4 transition-colors">
                  Access AI-powered broker tools, training modules, CRM, marketing resources, and everything you need to succeed.
                </p>
                <span className="text-sm font-medium flex items-center gap-1 transition-colors" style={{ filter: 'drop-shadow(0 0 6px rgba(200,167,102,0.5))' }}>
                  <span className="text-black font-bold group-hover:text-gold transition-colors">Access Broker Hub</span>
                  <svg className="w-3 h-3 text-gold" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M17 7H7M17 7V17" />
                  </svg>
                </span>
              </div>
            </Link>

            {/* Investor Hub Card - 3D styling matching other cards */}
            <Link to="/ai-hub" className="group">
              <div className="bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border-2 border-gold/40 rounded-2xl p-6 md:p-8 hover:border-gold hover:shadow-[0_0_30px_rgba(200,167,102,0.5),0_20px_40px_rgba(0,0,0,0.35)] hover:-translate-y-1 shadow-[0_8px_25px_rgba(200,167,102,0.35),0_4px_12px_rgba(0,0,0,0.2)] transition-all duration-300">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-transparent border-2 border-gold group-hover:border-black rounded-xl flex items-center justify-center shadow-lg shadow-gold/40 transition-all duration-300">
                    <Layers className="w-6 h-6 text-black group-hover:text-gold transition-colors" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold">
                      <span className="text-gold group-hover:text-black transition-colors">JBJ</span>{" "}
                      <span className="text-black group-hover:text-gold transition-colors">Investor Hub</span>
                    </h3>
                    <p className="text-zinc-600 group-hover:text-gold text-xs transition-colors">Free AI Tools for Investors</p>
                  </div>
                </div>
                <p className="text-zinc-700 group-hover:text-zinc-600 text-sm mb-4 transition-colors">
                  AI-powered property analysis, comparison, mortgage calculator, and productivity tools — all free for investors and homeowners.
                </p>
                <span className="text-sm font-medium flex items-center gap-1 transition-colors" style={{ filter: 'drop-shadow(0 0 6px rgba(200,167,102,0.5))' }}>
                  <span className="text-black font-bold group-hover:text-gold transition-colors">Explore Investor Hub</span>
                  <svg className="w-3 h-3 text-gold" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M17 7H7M17 7V17" />
                  </svg>
                </span>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* FOUNDER SECTION - Meet The Leadership */}
      <section className="py-20 md:py-28 bg-black">
        {/* Active Champagne Section Layer */}
        <div className="mx-4 md:mx-8 lg:mx-16 py-12 md:py-16 px-4 md:px-8 bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] rounded-2xl border border-gold/30 shadow-lg">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="max-w-6xl mx-auto"
          >
            {/* Section Header - Leadership Label with Mixed Color Style */}
            <motion.div className="text-center mb-12" variants={fadeInUp}>
              {/* Leadership Label - 3D Frame Style */}
              <div 
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-black rounded-lg mb-4 shadow-md group cursor-default"
                style={{
                  boxShadow: `
                    0 4px 12px rgba(0,0,0,0.15),
                    inset 0 2px 4px rgba(255,255,255,0.9),
                    inset 0 -2px 4px rgba(200,167,102,0.2)
                  `,
                }}
              >
                <User className="w-4 h-4 text-gold" />
                <span className="text-gold font-semibold text-sm uppercase tracking-[0.2em]">Leadership</span>
              </div>
              <h2
                className="text-black text-4xl md:text-5xl lg:text-6xl font-bold mt-4 mb-4"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                Meet the{" "}
                <span 
                  className="text-transparent bg-clip-text bg-gradient-to-r from-[#C8A766] via-[#D4AF37] to-[#C8A766]"
                  style={{ filter: 'drop-shadow(0 0 8px rgba(200,167,102,0.4))' }}
                >
                  Founder
                </span>
              </h2>
              <p className="text-zinc-700 text-lg max-w-2xl mx-auto">
                <Link to="/about" className="text-gold hover:underline">JBJ Global Real Estate</Link> is a founder-led brokerage for buying, selling, and renting built on unwavering standards, discretion, and long-term vision.
              </p>
            </motion.div>

            {/* Founder Card - Pearl card inside active champagne layer */}
            <motion.div
              className="rounded-3xl overflow-hidden shadow-2xl border-2 border-gold/40 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]"
              variants={fadeInUp}
            >
              <div className="grid md:grid-cols-2 gap-0">
                {/* Photo Side - Bright Champagne/Gold gradient for contrast - Zoomed out to show full body */}
                <div className="relative bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#C8A766]">
                  <img
                    src={founderProfessional}
                    alt="Jane Abou Jaoude - Founder & CEO at JBJ Global Real Estate"
                    className="w-full h-full min-h-[400px] md:min-h-[500px]"
                    style={{ objectFit: "cover", objectPosition: "center 25%" }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent to-zinc-900/40 md:block hidden pointer-events-none" />
                </div>

                {/* Content Side - Pearl white/champagne for internal card */}
                <div className="p-8 md:p-12 flex flex-col justify-center bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]">
                  <h3 className="text-black text-3xl md:text-4xl font-bold mb-2">Jane Abou Jaoude</h3>
                  <p className="text-gold text-xl md:text-2xl font-semibold mb-6">Founder & CEO</p>

                  <p className="text-zinc-700 text-base leading-relaxed mb-8">
                    With 12+ years of industry experience and a proven track record of training 4,800+ brokers,
                    Jane leads JBJ Global Real Estate with a commitment to excellence, integrity, and client success.
                  </p>

                  {/* Stats Row - Active color on normal, champagne on hover */}
                  <div className="grid grid-cols-3 gap-4 mb-8">
                    <div className="group text-center p-3 bg-gradient-to-r from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border-2 border-gold rounded-xl transition-all duration-300 hover:bg-gradient-to-r hover:from-[#FDFBF7] hover:via-[#F5F0E6] hover:to-[#EDE4D3]" style={{ boxShadow: '0 0 15px rgba(200,167,102,0.4)' }}>
                      <p className="text-black group-hover:text-black text-2xl md:text-3xl font-bold transition-colors">12<span className="text-gold">+</span></p>
                      <p className="text-zinc-700 group-hover:text-zinc-600 text-[10px] uppercase tracking-wider mt-1 transition-colors">Years Exp</p>
                    </div>
                    <div className="group text-center p-3 bg-gradient-to-r from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border-2 border-gold rounded-xl transition-all duration-300 hover:bg-gradient-to-r hover:from-[#FDFBF7] hover:via-[#F5F0E6] hover:to-[#EDE4D3]" style={{ boxShadow: '0 0 15px rgba(200,167,102,0.4)' }}>
                      <p className="text-black group-hover:text-black text-2xl md:text-3xl font-bold transition-colors">147<span className="text-gold">+</span></p>
                      <p className="text-zinc-700 group-hover:text-zinc-600 text-[10px] uppercase tracking-wider mt-1 transition-colors">Team Members</p>
                    </div>
                    <div className="group text-center p-3 bg-gradient-to-r from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border-2 border-gold rounded-xl transition-all duration-300 hover:bg-gradient-to-r hover:from-[#FDFBF7] hover:via-[#F5F0E6] hover:to-[#EDE4D3]" style={{ boxShadow: '0 0 15px rgba(200,167,102,0.4)' }}>
                      <p className="text-black group-hover:text-black text-2xl md:text-3xl font-bold transition-colors">4.8K<span className="text-gold">+</span></p>
                      <p className="text-zinc-700 group-hover:text-zinc-600 text-[10px] uppercase tracking-wider mt-1 transition-colors">Brokers Trained</p>
                    </div>
                  </div>

                  <Link to="/founder">
                    <button 
                      className="relative inline-flex items-center justify-center gap-2 px-8 py-5 text-base font-bold rounded-xl transition-all duration-300 bg-gradient-to-r from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/50 hover:scale-[1.02] transform active:scale-95 group w-full md:w-auto"
                      style={{
                        boxShadow: `
                          0 10px 30px rgba(200,167,102,0.4),
                          0 6px 15px rgba(0,0,0,0.2),
                          inset 0 2px 4px rgba(255,255,255,0.9),
                          inset 0 -2px 4px rgba(200,167,102,0.2),
                          0 0 20px rgba(200,167,102,0.3)
                        `,
                      }}
                    >
                      <span className="absolute inset-x-0 top-0 h-1/2 rounded-t-xl bg-gradient-to-b from-white/80 to-transparent pointer-events-none" />
                      <span className="absolute inset-x-0 bottom-0 h-1/3 rounded-b-xl bg-gradient-to-t from-gold/10 to-transparent pointer-events-none" />
                      <span className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" style={{ boxShadow: '0 0 40px rgba(200,167,102,0.6), inset 0 0 20px rgba(200,167,102,0.1)' }} />
                      <span className="relative flex items-center justify-center gap-2">
                        <User className="w-5 h-5 text-gold group-hover:text-black transition-colors" />
                        <span className="text-black group-hover:text-gold transition-colors">Learn More About</span>
                        <span className="text-gold group-hover:text-black transition-colors">The Founder</span>
                        <ArrowUpRight className="w-5 h-5 text-black group-hover:text-gold transition-colors" />
                      </span>
                    </button>
                  </Link>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* BEST IDEA AWARD */}
      <BestIdeaAward />

      {/* SUPPORT TICKET moved to Contact page */}

      {/* AI COMPARISON & ANALYZER PREVIEW */}
      <section className="py-16 md:py-20 bg-black">
        <div className="container mx-auto px-4">
          {/* Active Champagne Section Layer */}
          <div className="bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] rounded-2xl border border-gold/30 shadow-lg p-6 md:p-10">
            <AIComparisonWidget />
          </div>
        </div>
      </section>

      {/* MARKET REPORT CTA - Active Champagne Layer */}
      <section className="py-20 md:py-28 bg-black">
        {/* Active Champagne Section Layer */}
        <div className="mx-4 md:mx-8 lg:mx-16 bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] rounded-2xl border border-gold/30 shadow-lg p-6 md:p-10">
          {/* Pearl Card Inside */}
          <div className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 rounded-3xl p-8 md:p-12 shadow-xl">
            <motion.div
              className="text-center mb-10"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <span className="inline-block text-gold text-xs uppercase tracking-[0.3em] mb-4">Exclusive Publication</span>
              <h2 className="text-black text-3xl md:text-4xl font-bold" style={{ fontFamily: "Poppins, sans-serif" }}>
                Free Market <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold to-gold-light">Intelligence Book</span>
              </h2>
            </motion.div>
            <MarketReportCTA />
          </div>
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

      {/* MORTGAGE CALCULATOR SECTION - Active Champagne Layer */}
      <section className="py-20 md:py-28 bg-black">
        {/* Active Champagne Section Layer */}
        <div className="mx-4 md:mx-8 lg:mx-16 bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] rounded-2xl border border-gold/30 shadow-lg p-6 md:p-10">
          {/* Pearl Card Inside */}
          <div className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 rounded-3xl p-8 md:p-12 shadow-xl relative overflow-hidden">
            {/* Decorative glow elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gold/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-gold/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
            
            <motion.div
              className="text-center mb-8 relative z-10"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <span className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-gold/20 via-[#F5F0E6] to-gold/20 border border-gold/50 rounded-full mb-4 shadow-lg shadow-gold/10">
                <Calculator className="w-4 h-4 text-gold" />
                <span className="text-black text-xs font-semibold uppercase tracking-wider">Mortgage Estimate</span>
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
              
              {/* Dual Buttons with 3D Premium Styling */}
              <div className="flex flex-col sm:flex-row gap-4 mt-8 justify-center">
                {/* Primary 3D Button - Try Our AI Mortgage Calculator */}
                <Link to="/mortgage">
                  <button 
                    className="relative inline-flex items-center justify-center gap-2 px-8 py-5 text-base font-bold rounded-xl transition-all duration-300 group overflow-hidden"
                    style={{
                      background: 'linear-gradient(135deg, #FFFFFF 0%, #FDFBF7 25%, #F5F0E6 50%, #E8DFD0 75%, #C8A766 100%)',
                      boxShadow: `
                        0 10px 30px rgba(200,167,102,0.4),
                        0 6px 15px rgba(0,0,0,0.2),
                        inset 0 2px 4px rgba(255,255,255,0.9),
                        inset 0 -2px 4px rgba(200,167,102,0.2),
                        0 0 20px rgba(200,167,102,0.3)
                      `,
                    }}
                  >
                    <span className="absolute inset-x-0 top-0 h-1/2 rounded-t-xl bg-gradient-to-b from-white/80 to-transparent pointer-events-none" />
                    <span className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" style={{ boxShadow: '0 0 40px rgba(200,167,102,0.6), inset 0 0 20px rgba(200,167,102,0.1)' }} />
                    <span className="relative flex items-center justify-center gap-2">
                      <Sparkles className="w-5 h-5 text-gold group-hover:text-black transition-colors" />
                      <span className="text-black group-hover:text-gold transition-colors">Try Our AI</span>
                      <span className="text-gold group-hover:text-black transition-colors">Mortgage Calculator</span>
                      <ArrowUpRight className="w-5 h-5 text-black group-hover:text-gold transition-colors" />
                    </span>
                  </button>
                </Link>
                
                {/* Secondary Button - Connect With Mortgage Partners */}
                <Link to="/partners/mortgage">
                  <button 
                    className="relative inline-flex items-center justify-center gap-2 px-8 py-5 text-base font-bold rounded-xl transition-all duration-300 bg-transparent border-2 border-black text-black hover:bg-black hover:text-white group"
                  >
                    <Users className="w-5 h-5 text-gold group-hover:text-gold" />
                    <span>Connect With Mortgage Partners</span>
                    <ArrowUpRight className="w-5 h-5" />
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Counter Section */}
      <StatsCounter />

      {/* Contact CTA Section - 3-Layer System: Black > Active Champagne > Pearl Card */}
      <section className="py-16 md:py-20 bg-black">
        <div className="container mx-auto px-4">
          <div className="mx-0">
            {/* OUTER CARD (Active Champagne) - Matching section width */}
            <div className="bg-gradient-to-br from-champagne-light via-champagne to-champagne-dark border border-gold/30 rounded-2xl sm:rounded-3xl p-4 sm:p-6 md:p-8">
              {/* INNER CARD (Champagne Pearl) - Noticeably smaller */}
              <motion.div 
                className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 rounded-xl sm:rounded-2xl p-6 md:p-10 shadow-[0_0_30px_rgba(200,167,102,0.25)] text-center"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
              >
                {/* Premium badge with glow */}
                <motion.span 
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-gold/20 via-[#F5F0E6] to-gold/20 border border-gold/50 rounded-full text-black text-xs uppercase tracking-[0.2em] mb-6 shadow-lg shadow-gold/20"
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <Sparkles className="w-3 h-3 text-gold animate-pulse" />
                  Begin Your Journey
                </motion.span>
                
                <h3 className="text-2xl md:text-3xl lg:text-4xl font-bold text-black mb-4" style={{ fontFamily: "Poppins, sans-serif" }}>
                  Ready to <span className="text-gold">Get Started?</span>
                </h3>
                <p className="text-zinc-600 text-sm md:text-base lg:text-lg mb-8 leading-relaxed max-w-xl mx-auto">
                  Connect with our expert team to explore exclusive opportunities in Dubai's premier real estate market.
                </p>
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <button 
                    onClick={() => setIsInquiryOpen(true)}
                    className="relative inline-flex items-center justify-center gap-2 px-8 md:px-10 py-4 md:py-5 text-sm md:text-base font-bold rounded-xl transition-all duration-300 hover:scale-[1.02] transform active:scale-95 group"
                    style={{
                      background: 'linear-gradient(135deg, #FFFFFF 0%, #FDFBF7 25%, #F5F0E6 50%, #E8DFD0 75%, #C8A766 100%)',
                      boxShadow: `
                        0 10px 30px rgba(200,167,102,0.4),
                        0 6px 15px rgba(0,0,0,0.2),
                        inset 0 2px 4px rgba(255,255,255,0.9),
                        inset 0 -2px 4px rgba(200,167,102,0.2),
                        0 0 20px rgba(200,167,102,0.3)
                      `,
                    }}
                  >
                    <span className="absolute inset-x-0 top-0 h-1/2 rounded-t-xl bg-gradient-to-b from-white/80 to-transparent pointer-events-none" />
                    <span className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" style={{ boxShadow: '0 0 40px rgba(200,167,102,0.6), inset 0 0 20px rgba(200,167,102,0.1)' }} />
                    <span className="relative flex items-center justify-center gap-1">
                      <Calendar className="w-5 h-5 text-gold group-hover:text-black transition-colors" />
                      <span className="text-black group-hover:text-gold transition-colors">Book</span>
                      <span className="text-gold group-hover:text-black transition-colors">Consultation</span>
                      <ArrowUpRight className="w-5 h-5 text-black group-hover:text-gold transition-colors" />
                    </span>
                  </button>
                  <Link to="/properties">
                    <button 
                      className="inline-flex items-center justify-center gap-2 px-8 md:px-10 py-4 md:py-5 text-sm md:text-base font-bold rounded-xl transition-all duration-300 bg-transparent border-2 border-black text-black hover:bg-black hover:text-white group"
                    >
                      Browse Properties
                      <ArrowUpRight className="w-5 h-5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </button>
                  </Link>
                </div>
              </motion.div>
            </div>
          </div>
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
