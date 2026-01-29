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
    <section className="relative w-full min-h-screen bg-black -mt-24 xl:-mt-28">
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
          {/* Video overlay gradient - above video (lightened for better video visibility) */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/60 z-[2]" />
          {/* Additional cinematic vignette (lightened) */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/40 z-[2]" />
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
        
        {/* Content - Centered for video visibility */}
        <motion.div 
          className="relative z-10 w-full flex flex-col items-center justify-center text-center px-4"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <div className="max-w-3xl mx-auto pt-20 md:pt-24">
            {/* H1 - Clean 2-line layout */}
            <motion.h1 
              variants={fadeInUp} 
              className="text-white text-xl sm:text-2xl md:text-4xl lg:text-5xl font-bold tracking-tight leading-[1.1] mb-3 md:mb-4 px-2 sm:px-0"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              <span className="block whitespace-nowrap">
                {t('hero.buy')}<span className="inline-block w-1 h-1 md:w-1.5 md:h-1.5 rounded-full mx-1 align-middle bg-gold" style={{ boxShadow: '0 0 8px rgba(200,167,102,0.8)' }}></span>
                {t('hero.sell')}<span className="inline-block w-1 h-1 md:w-1.5 md:h-1.5 rounded-full mx-1 align-middle bg-gold" style={{ boxShadow: '0 0 8px rgba(200,167,102,0.8)' }}></span>
                {t('hero.rent')}
              </span>
              {/* Delivered with Intelligence - Subtle elegant gold */}
              <span 
                className="block whitespace-nowrap text-sm sm:text-base md:text-xl lg:text-2xl mt-1.5 uppercase tracking-[0.2em] font-medium"
                style={{ 
                  background: 'linear-gradient(90deg, #C8A766 0%, #E8D4A8 50%, #C8A766 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  filter: 'drop-shadow(0 1px 4px rgba(200,167,102,0.4))',
                }}
              >
                {t('hero.deliveredWith')}
              </span>
            </motion.h1>
          
            {/* Subline - Clean */}
            <motion.p 
              variants={fadeInUp}
              className="text-zinc-300 text-[10px] md:text-xs lg:text-sm max-w-md mx-auto leading-relaxed mb-4 md:mb-5"
            >
              {t('hero.subtitle')}
            </motion.p>

            {/* Partner Services - Clickable links before buttons */}
            <motion.p
              variants={fadeInUp}
              className="text-[9px] sm:text-[10px] md:text-[11px] tracking-[0.12em] uppercase mb-5 md:mb-6"
            >
              <Link to="/mortgage-calculator" className="text-gold/70 hover:text-gold transition-colors cursor-pointer">Mortgage</Link>
              <span className="mx-1.5 sm:mx-2 text-gold/40">·</span>
              <Link to="/guides/legal" className="text-gold/70 hover:text-gold transition-colors cursor-pointer">Legal</Link>
              <span className="mx-1.5 sm:mx-2 text-gold/40">·</span>
              <Link to="/guides/golden-visa" className="text-gold/70 hover:text-gold transition-colors cursor-pointer">Visa</Link>
              <span className="text-white/70 normal-case tracking-normal ml-1.5 sm:ml-2">via partners</span>
            </motion.p>

            {/* Hero CTA Buttons - Classy, smaller, consistent */}
            <motion.div 
              variants={fadeInUp}
              className="flex flex-row items-center justify-center gap-3 sm:gap-4"
            >
              <Link to="/properties">
                <button 
                  className="group relative inline-flex items-center justify-center gap-1.5 px-3.5 sm:px-4 md:px-5 py-1.5 sm:py-2 text-[10px] sm:text-[11px] md:text-xs font-medium rounded-md transition-all duration-300 bg-transparent border border-white/50 hover:border-gold/80"
                  style={{
                    boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
                  }}
                >
                  <span className="text-white group-hover:text-gold transition-colors tracking-wide">{t('hero.explore')}</span>
                  <ArrowUpRight className="w-3 h-3 text-gold group-hover:scale-110 transition-all" style={{ filter: 'drop-shadow(0 0 3px rgba(200,167,102,0.5))' }} />
                </button>
              </Link>
              <button 
                onClick={() => setIsInquiryOpen(true)}
                className="group relative inline-flex items-center justify-center gap-1.5 px-3.5 sm:px-4 md:px-5 py-1.5 sm:py-2 text-[10px] sm:text-[11px] md:text-xs font-medium rounded-md transition-all duration-300 bg-transparent border border-white/50 hover:border-gold/80"
                style={{
                  boxShadow: '0 2px 8px rgba(0,0,0,0.25)',
                }}
              >
                <span className="text-white group-hover:text-gold transition-colors tracking-wide">{t('hero.bookConsultation')}</span>
                <ArrowUpRight className="w-3 h-3 text-gold group-hover:scale-110 transition-all" style={{ filter: 'drop-shadow(0 0 3px rgba(200,167,102,0.5))' }} />
              </button>
            </motion.div>
          </div>
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
          >{t('hero.discover')}</span>
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
      <section className="pt-10 md:pt-16 pb-6 md:pb-14 bg-black">
        <div className="container mx-auto px-3 md:px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl mx-auto"
          >
            <Link to="/quiz" className="block group">
              <div 
                className="relative bg-gradient-to-br from-purple-900/40 via-purple-800/30 to-purple-900/40 backdrop-blur-md rounded-xl md:rounded-2xl p-5 md:p-10 text-center transition-all duration-500 group-hover:translate-y-[-4px] group-hover:scale-[1.02]"
                style={{
                  border: '2px solid rgba(147,51,234,0.5)',
                  boxShadow: '0 0 12px rgba(255,255,255,0.2), 0 0 25px rgba(147,51,234,0.15), inset 0 1px 2px rgba(255,255,255,0.1)',
                }}
              >
                {/* White border glow on normal load */}
                <div 
                  className="absolute inset-0 rounded-xl md:rounded-2xl pointer-events-none"
                  style={{
                    boxShadow: '0 0 15px rgba(255,255,255,0.15), 0 0 8px rgba(255,255,255,0.1)',
                  }}
                />
                {/* 3D hover effect - coming out of screen */}
                <div 
                  className="absolute inset-0 rounded-xl md:rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-500 pointer-events-none"
                  style={{
                    boxShadow: '0 12px 35px rgba(0,0,0,0.4), 0 0 25px rgba(255,255,255,0.3), 0 0 50px rgba(147,51,234,0.25), inset 0 -2px 5px rgba(0,0,0,0.2)',
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-purple-600/10 rounded-xl md:rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="relative z-10">
                  <div className="flex items-center justify-center gap-2 md:gap-3 mb-3 md:mb-4">
                    <Sparkles className="w-6 h-6 md:w-8 md:h-8 text-purple-400 group-hover:text-purple-300 transition-colors" />
                    <h2 
                      className="text-white text-xl md:text-3xl lg:text-4xl font-bold tracking-wide" 
                      style={{ 
                        fontFamily: "Poppins, sans-serif",
                        textShadow: '0 2px 4px rgba(0,0,0,0.4)',
                      }}
                    >
                      {t('hero.aiFinder')}
                    </h2>
                    <ArrowUpRight className="w-5 h-5 md:w-7 md:h-7 text-purple-400 group-hover:text-purple-300 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-300" />
                  </div>
                  
                  <p className="text-white text-sm md:text-base lg:text-lg">
                    {t('hero.aiFinderDesc')}
                  </p>
                </div>
              </div>
            </Link>
          </motion.div>
        </div>
      </section>


      {/* WHO IS THIS FOR - Clear Entry Points with Champagne Layer */}
      <section className="pt-12 md:pt-24 pb-8 md:pb-20 bg-black">
        <div className="jj-layer-2">
          <div className="text-center mb-6 md:mb-10">
            <span className="inline-flex items-center gap-1.5 md:gap-2 px-3 md:px-5 py-1.5 md:py-2 bg-gradient-to-r from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border-2 border-gold rounded-full text-[10px] md:text-xs uppercase tracking-[0.15em] md:tracking-[0.2em] font-semibold shadow-md">
              <Users className="w-2.5 h-2.5 md:w-3 md:h-3 text-gold" />
              <span className="text-black">{t('hero.findStartingPoint')}</span>
            </span>
          </div>

          {/* Audience Entry Cards - 2 cols on mobile (shows all 7 cards in 4 rows), 7-col on desktop */}
          <div className="grid grid-cols-2 md:grid-cols-7 gap-1.5 md:gap-3 w-full mb-6 md:mb-10">
            <Link to="/buyer-guide" className="group">
              <div className="bg-gradient-to-r from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border border-gold/40 md:border-2 rounded-lg p-1.5 md:p-3 text-center hover:border-gold hover:shadow-[0_0_30px_rgba(200,167,102,0.5),0_20px_40px_rgba(0,0,0,0.35)] hover:-translate-y-1 shadow-[0_4px_12px_rgba(200,167,102,0.25),0_2px_6px_rgba(0,0,0,0.15)] md:shadow-[0_8px_25px_rgba(200,167,102,0.35),0_4px_12px_rgba(0,0,0,0.2)] transition-all duration-300 relative overflow-hidden h-full">
                <div className="relative z-10">
                  <div className="w-6 h-6 md:w-8 md:h-8 bg-transparent border border-gold md:border-2 group-hover:border-black rounded-md md:rounded-lg flex items-center justify-center mx-auto mb-0.5 md:mb-2 transition-colors">
                    <Heart className="w-3 h-3 md:w-4 md:h-4 text-black group-hover:text-gold transition-colors" />
                  </div>
                  <h4 className="text-black group-hover:text-gold text-[8px] md:text-xs font-semibold transition-colors leading-tight">{t('hero.buyers')}</h4>
                </div>
              </div>
            </Link>
            <Link to="/seller-guide" className="group">
              <div className="bg-gradient-to-r from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border border-gold/40 md:border-2 rounded-lg p-1.5 md:p-3 text-center hover:border-gold hover:shadow-[0_0_30px_rgba(200,167,102,0.5),0_20px_40px_rgba(0,0,0,0.35)] hover:-translate-y-1 shadow-[0_4px_12px_rgba(200,167,102,0.25),0_2px_6px_rgba(0,0,0,0.15)] md:shadow-[0_8px_25px_rgba(200,167,102,0.35),0_4px_12px_rgba(0,0,0,0.2)] transition-all duration-300 relative overflow-hidden h-full">
                <div className="relative z-10">
                  <div className="w-6 h-6 md:w-8 md:h-8 bg-transparent border border-gold md:border-2 group-hover:border-black rounded-md md:rounded-lg flex items-center justify-center mx-auto mb-0.5 md:mb-2 transition-colors">
                    <Target className="w-3 h-3 md:w-4 md:h-4 text-black group-hover:text-gold transition-colors" />
                  </div>
                  <h4 className="text-black group-hover:text-gold text-[8px] md:text-xs font-semibold transition-colors leading-tight">{t('hero.sellers')}</h4>
                </div>
              </div>
            </Link>
            <Link to="/rent-guide" className="group">
              <div className="bg-gradient-to-r from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border border-gold/40 md:border-2 rounded-lg p-1.5 md:p-3 text-center hover:border-gold hover:shadow-[0_0_30px_rgba(200,167,102,0.5),0_20px_40px_rgba(0,0,0,0.35)] hover:-translate-y-1 shadow-[0_4px_12px_rgba(200,167,102,0.25),0_2px_6px_rgba(0,0,0,0.15)] md:shadow-[0_8px_25px_rgba(200,167,102,0.35),0_4px_12px_rgba(0,0,0,0.2)] transition-all duration-300 relative overflow-hidden h-full">
                <div className="relative z-10">
                  <div className="w-6 h-6 md:w-8 md:h-8 bg-transparent border border-gold md:border-2 group-hover:border-black rounded-md md:rounded-lg flex items-center justify-center mx-auto mb-0.5 md:mb-2 transition-colors">
                    <Key className="w-3 h-3 md:w-4 md:h-4 text-black group-hover:text-gold transition-colors" />
                  </div>
                  <h4 className="text-black group-hover:text-gold text-[8px] md:text-xs font-semibold transition-colors leading-tight">{t('hero.rentals')}</h4>
                </div>
              </div>
            </Link>
            <Link to="/ai-hub" className="group">
              <div className="bg-gradient-to-r from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border border-gold/40 md:border-2 rounded-lg p-1.5 md:p-3 text-center hover:border-gold hover:shadow-[0_0_30px_rgba(200,167,102,0.5),0_20px_40px_rgba(0,0,0,0.35)] hover:-translate-y-1 shadow-[0_4px_12px_rgba(200,167,102,0.25),0_2px_6px_rgba(0,0,0,0.15)] md:shadow-[0_8px_25px_rgba(200,167,102,0.35),0_4px_12px_rgba(0,0,0,0.2)] transition-all duration-300 relative overflow-hidden h-full">
                <div className="relative z-10">
                  <div className="w-6 h-6 md:w-8 md:h-8 bg-transparent border border-gold md:border-2 group-hover:border-black rounded-md md:rounded-lg flex items-center justify-center mx-auto mb-0.5 md:mb-2 transition-colors">
                    <Layers className="w-3 h-3 md:w-4 md:h-4 text-black group-hover:text-gold transition-colors" />
                  </div>
                  <h4 className="text-black group-hover:text-gold text-[8px] md:text-xs font-semibold transition-colors leading-tight">{t('hero.investors')}</h4>
                </div>
              </div>
            </Link>
            <Link to="/quiz" className="group">
              <div className="bg-gradient-to-r from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border border-gold/40 md:border-2 rounded-lg p-1.5 md:p-3 text-center hover:border-gold hover:shadow-[0_0_30px_rgba(200,167,102,0.5),0_20px_40px_rgba(0,0,0,0.35)] hover:-translate-y-1 shadow-[0_4px_12px_rgba(200,167,102,0.25),0_2px_6px_rgba(0,0,0,0.15)] md:shadow-[0_8px_25px_rgba(200,167,102,0.35),0_4px_12px_rgba(0,0,0,0.2)] transition-all duration-300 relative overflow-hidden h-full">
                <div className="relative z-10">
                  <div className="w-6 h-6 md:w-8 md:h-8 bg-transparent border border-gold md:border-2 group-hover:border-black rounded-md md:rounded-lg flex items-center justify-center mx-auto mb-0.5 md:mb-2 transition-colors">
                    <Users className="w-3 h-3 md:w-4 md:h-4 text-black group-hover:text-gold transition-colors" />
                  </div>
                  <h4 className="text-black group-hover:text-gold text-[8px] md:text-xs font-semibold transition-colors leading-tight">{t('hero.visitors')}</h4>
                </div>
              </div>
            </Link>
            <Link to="/referral" className="group">
              <div className="bg-gradient-to-r from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border border-gold/40 md:border-2 rounded-lg p-1.5 md:p-3 text-center hover:border-gold hover:shadow-[0_0_30px_rgba(200,167,102,0.5),0_20px_40px_rgba(0,0,0,0.35)] hover:-translate-y-1 shadow-[0_4px_12px_rgba(200,167,102,0.25),0_2px_6px_rgba(0,0,0,0.15)] md:shadow-[0_8px_25px_rgba(200,167,102,0.35),0_4px_12px_rgba(0,0,0,0.2)] transition-all duration-300 relative overflow-hidden h-full">
                <div className="relative z-10">
                  <div className="w-6 h-6 md:w-8 md:h-8 bg-transparent border border-gold md:border-2 group-hover:border-black rounded-md md:rounded-lg flex items-center justify-center mx-auto mb-0.5 md:mb-2 transition-colors">
                    <Award className="w-3 h-3 md:w-4 md:h-4 text-black group-hover:text-gold transition-colors" />
                  </div>
                  <h4 className="text-black group-hover:text-gold text-[8px] md:text-xs font-semibold transition-colors leading-tight">{t('hero.referral')}</h4>
                </div>
              </div>
            </Link>
            <Link to="/join" className="group">
              <div className="bg-gradient-to-r from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border border-gold/40 md:border-2 rounded-lg p-1.5 md:p-3 text-center hover:border-gold hover:shadow-[0_0_30px_rgba(200,167,102,0.5),0_20px_40px_rgba(0,0,0,0.35)] hover:-translate-y-1 shadow-[0_4px_12px_rgba(200,167,102,0.25),0_2px_6px_rgba(0,0,0,0.15)] md:shadow-[0_8px_25px_rgba(200,167,102,0.35),0_4px_12px_rgba(0,0,0,0.2)] transition-all duration-300 relative overflow-hidden h-full">
                <div className="relative z-10">
                  <div className="w-6 h-6 md:w-8 md:h-8 bg-transparent border border-gold md:border-2 group-hover:border-black rounded-md md:rounded-lg flex items-center justify-center mx-auto mb-0.5 md:mb-2 transition-colors">
                    <GraduationCap className="w-3 h-3 md:w-4 md:h-4 text-black group-hover:text-gold transition-colors" />
                  </div>
                  <h4 className="text-black group-hover:text-gold text-[8px] md:text-xs font-semibold transition-colors leading-tight">{t('hero.careers')}</h4>
                </div>
              </div>
            </Link>
          </div>

          {/* Quick Actions + Partner Network - 2 cols mobile, 7 cols desktop */}
          <div className="grid grid-cols-2 lg:grid-cols-7 gap-1.5 md:gap-3 w-full mb-6 md:mb-12">
            <Link to="/properties" className="group">
              <div className="bg-gradient-to-r from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border border-gold/40 md:border-2 rounded-lg md:rounded-xl p-2 md:p-4 text-center hover:border-gold hover:shadow-[0_0_30px_rgba(200,167,102,0.5),0_20px_40px_rgba(0,0,0,0.35)] hover:-translate-y-1 shadow-[0_4px_12px_rgba(200,167,102,0.25)] md:shadow-[0_8px_25px_rgba(200,167,102,0.35),0_4px_12px_rgba(0,0,0,0.2)] transition-all duration-300 relative overflow-hidden h-full">
                <div className="relative z-10">
                  <div className="w-6 h-6 md:w-9 md:h-9 bg-transparent border border-gold md:border-2 group-hover:border-black rounded-md md:rounded-lg flex items-center justify-center mx-auto mb-0.5 md:mb-2 transition-colors">
                    <Home className="w-3 h-3 md:w-4 md:h-4 text-black group-hover:text-gold transition-colors" />
                  </div>
                  <h4 className="text-black group-hover:text-gold text-[7px] md:text-xs font-semibold mb-0 md:mb-0.5 transition-colors leading-tight">{t('hero.exploreProperties')}</h4>
                  <p className="text-gold group-hover:text-black text-[9px] md:text-[10px] transition-colors hidden md:block">{t('hero.browseListings')}</p>
                </div>
              </div>
            </Link>
            <Link to="/seller-listing" className="group">
              <div className="bg-gradient-to-r from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border border-gold/40 md:border-2 rounded-lg md:rounded-xl p-2 md:p-4 text-center hover:border-gold hover:shadow-[0_0_30px_rgba(200,167,102,0.5),0_20px_40px_rgba(0,0,0,0.35)] hover:-translate-y-1 shadow-[0_4px_12px_rgba(200,167,102,0.25)] md:shadow-[0_8px_25px_rgba(200,167,102,0.35),0_4px_12px_rgba(0,0,0,0.2)] transition-all duration-300 relative overflow-hidden h-full">
                <div className="relative z-10">
                  <div className="w-6 h-6 md:w-9 md:h-9 bg-transparent border border-gold md:border-2 group-hover:border-black rounded-md md:rounded-lg flex items-center justify-center mx-auto mb-0.5 md:mb-2 transition-colors">
                    <Target className="w-3 h-3 md:w-4 md:h-4 text-black group-hover:text-gold transition-colors" />
                  </div>
                  <h4 className="text-black group-hover:text-gold text-[7px] md:text-xs font-semibold mb-0 md:mb-0.5 transition-colors leading-tight">{t('hero.listYourProperty')}</h4>
                  <p className="text-gold group-hover:text-black text-[9px] md:text-[10px] transition-colors hidden md:block">{t('hero.sellOrRent')}</p>
                </div>
              </div>
            </Link>
            <Link to="/market-report" className="group">
              <div className="bg-gradient-to-r from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border border-gold/40 md:border-2 rounded-lg md:rounded-xl p-2 md:p-4 text-center hover:border-gold hover:shadow-[0_0_30px_rgba(200,167,102,0.5),0_20px_40px_rgba(0,0,0,0.35)] hover:-translate-y-1 shadow-[0_4px_12px_rgba(200,167,102,0.25)] md:shadow-[0_8px_25px_rgba(200,167,102,0.35),0_4px_12px_rgba(0,0,0,0.2)] transition-all duration-300 relative overflow-hidden h-full">
                <div className="relative z-10">
                  <div className="w-6 h-6 md:w-9 md:h-9 bg-transparent border border-gold md:border-2 group-hover:border-black rounded-md md:rounded-lg flex items-center justify-center mx-auto mb-0.5 md:mb-2 transition-colors">
                    <FileText className="w-3 h-3 md:w-4 md:h-4 text-black group-hover:text-gold transition-colors" />
                  </div>
                  <h4 className="text-black group-hover:text-gold text-[7px] md:text-xs font-semibold mb-0 md:mb-0.5 transition-colors leading-tight">{t('hero.marketReport')}</h4>
                  <p className="text-gold group-hover:text-black text-[9px] md:text-[10px] transition-colors hidden md:block">{t('hero.latestInsights')}</p>
                </div>
              </div>
            </Link>
            <Link to="/ai-hub" className="group">
              <div className="bg-gradient-to-r from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border border-gold/40 md:border-2 rounded-lg md:rounded-xl p-2 md:p-4 text-center hover:border-gold hover:shadow-[0_0_30px_rgba(200,167,102,0.5),0_20px_40px_rgba(0,0,0,0.35)] hover:-translate-y-1 shadow-[0_4px_12px_rgba(200,167,102,0.25)] md:shadow-[0_8px_25px_rgba(200,167,102,0.35),0_4px_12px_rgba(0,0,0,0.2)] transition-all duration-300 relative overflow-hidden h-full">
                <div className="relative z-10">
                  <div className="w-6 h-6 md:w-9 md:h-9 bg-transparent border border-gold md:border-2 group-hover:border-black rounded-md md:rounded-lg flex items-center justify-center mx-auto mb-0.5 md:mb-2 transition-colors">
                    <Layers className="w-3 h-3 md:w-4 md:h-4 text-black group-hover:text-gold transition-colors" />
                  </div>
                  <h4 className="text-black group-hover:text-gold text-[7px] md:text-xs font-semibold mb-0 md:mb-0.5 transition-colors leading-tight">{t('hero.investorHub')}</h4>
                  <p className="text-gold group-hover:text-black text-[9px] md:text-[10px] transition-colors hidden md:block">{t('hero.aiTools')}</p>
                </div>
              </div>
            </Link>
            {/* Hidden on mobile, visible on desktop - flex to fill width */}
            <Link to="/services/law-firm" className="group hidden lg:flex">
              <div className="bg-gradient-to-r from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border-2 border-gold/40 rounded-xl p-4 text-center hover:border-gold hover:shadow-[0_0_30px_rgba(200,167,102,0.5),0_20px_40px_rgba(0,0,0,0.35)] hover:-translate-y-1 shadow-[0_8px_25px_rgba(200,167,102,0.35),0_4px_12px_rgba(0,0,0,0.2)] transition-all duration-300 relative overflow-hidden h-full w-full">
                <div className="relative z-10">
                  <div className="w-9 h-9 bg-transparent border-2 border-gold group-hover:border-black rounded-lg flex items-center justify-center mx-auto mb-2 transition-colors">
                    <Scale className="w-4 h-4 text-black group-hover:text-gold transition-colors" />
                  </div>
                  <h4 className="text-black group-hover:text-gold text-xs font-semibold mb-0.5 transition-colors">{t('hero.legalPartners')}</h4>
                  <p className="text-gold group-hover:text-black text-[10px] transition-colors">{t('hero.legalServices')}</p>
                </div>
              </div>
            </Link>
            <Link to="/mortgage-calculator" className="group hidden lg:flex">
              <div className="bg-gradient-to-r from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border-2 border-gold/40 rounded-xl p-4 text-center hover:border-gold hover:shadow-[0_0_30px_rgba(200,167,102,0.5),0_20px_40px_rgba(0,0,0,0.35)] hover:-translate-y-1 shadow-[0_8px_25px_rgba(200,167,102,0.35),0_4px_12px_rgba(0,0,0,0.2)] transition-all duration-300 relative overflow-hidden h-full w-full">
                <div className="relative z-10">
                  <div className="w-9 h-9 bg-transparent border-2 border-gold group-hover:border-black rounded-lg flex items-center justify-center mx-auto mb-2 transition-colors">
                    <Calculator className="w-4 h-4 text-black group-hover:text-gold transition-colors" />
                  </div>
                  <h4 className="text-black group-hover:text-gold text-xs font-semibold mb-0.5 transition-colors">{t('hero.mortgagePartners')}</h4>
                  <p className="text-gold group-hover:text-black text-[10px] transition-colors">{t('hero.financingOptions')}</p>
                </div>
              </div>
            </Link>
            <Link to="/services/design-build" className="group hidden lg:flex">
              <div className="bg-gradient-to-r from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border-2 border-gold/40 rounded-xl p-4 text-center hover:border-gold hover:shadow-[0_0_30px_rgba(200,167,102,0.5),0_20px_40px_rgba(0,0,0,0.35)] hover:-translate-y-1 shadow-[0_8px_25px_rgba(200,167,102,0.35),0_4px_12px_rgba(0,0,0,0.2)] transition-all duration-300 relative overflow-hidden h-full w-full">
                <div className="relative z-10">
                  <div className="w-9 h-9 bg-transparent border-2 border-gold group-hover:border-black rounded-lg flex items-center justify-center mx-auto mb-2 transition-colors">
                    <Wrench className="w-4 h-4 text-black group-hover:text-gold transition-colors" />
                  </div>
                  <h4 className="text-black group-hover:text-gold text-xs font-semibold mb-0.5 transition-colors">{t('hero.designBuild')}</h4>
                  <p className="text-gold group-hover:text-black text-[10px] transition-colors">{t('hero.constructionFitout')}</p>
                </div>
              </div>
            </Link>
          </div>


          {/* Resources Grid - Compact on mobile */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6 max-w-4xl mx-auto">
            {/* JBJ Broker Hub Card - Compact on mobile */}
            <Link to="/broker-toolkit" className="group">
              <div className="bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border border-gold/40 md:border-2 rounded-xl md:rounded-2xl p-4 md:p-8 hover:border-gold hover:shadow-[0_0_30px_rgba(200,167,102,0.5),0_20px_40px_rgba(0,0,0,0.35)] hover:-translate-y-1 shadow-[0_4px_12px_rgba(200,167,102,0.25)] md:shadow-[0_8px_25px_rgba(200,167,102,0.35),0_4px_12px_rgba(0,0,0,0.2)] transition-all duration-300">
                <div className="flex items-center gap-3 md:gap-4 mb-2 md:mb-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-transparent border border-gold md:border-2 group-hover:border-black rounded-lg md:rounded-xl flex items-center justify-center shadow-md md:shadow-lg shadow-gold/40 transition-all duration-300">
                    <Briefcase className="w-5 h-5 md:w-6 md:h-6 text-black group-hover:text-gold transition-colors" />
                  </div>
                  <div>
                    <h3 className="text-base md:text-lg font-semibold">
                      <span className="text-gold group-hover:text-black transition-colors">JBJ</span>{" "}
                      <span className="text-black group-hover:text-gold transition-colors">Broker Hub</span>
                    </h3>
                    <p className="text-zinc-600 group-hover:text-gold text-[10px] md:text-xs transition-colors">Professional Tools</p>
                  </div>
                </div>
                <p className="text-zinc-700 group-hover:text-zinc-600 text-xs md:text-sm mb-2 md:mb-4 transition-colors line-clamp-2 md:line-clamp-none">
                  Access AI-powered broker tools, training modules, CRM, marketing resources.
                </p>
                <span className="text-xs md:text-sm font-medium flex items-center gap-1 transition-colors">
                  <span className="text-black font-bold group-hover:text-gold transition-colors">Access Broker Hub</span>
                  <svg className="w-3 h-3 text-gold" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M17 7H7M17 7V17" />
                  </svg>
                </span>
              </div>
            </Link>

            {/* Investor Hub Card - Compact on mobile - Extra bottom margin */}
            <Link to="/ai-hub" className="group mb-4 md:mb-0">
              <div className="bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border border-gold/40 md:border-2 rounded-xl md:rounded-2xl p-4 md:p-8 hover:border-gold hover:shadow-[0_0_30px_rgba(200,167,102,0.5),0_20px_40px_rgba(0,0,0,0.35)] hover:-translate-y-1 shadow-[0_4px_12px_rgba(200,167,102,0.25)] md:shadow-[0_8px_25px_rgba(200,167,102,0.35),0_4px_12px_rgba(0,0,0,0.2)] transition-all duration-300">
                <div className="flex items-center gap-3 md:gap-4 mb-2 md:mb-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-transparent border border-gold md:border-2 group-hover:border-black rounded-lg md:rounded-xl flex items-center justify-center shadow-md md:shadow-lg shadow-gold/40 transition-all duration-300">
                    <Layers className="w-5 h-5 md:w-6 md:h-6 text-black group-hover:text-gold transition-colors" />
                  </div>
                  <div>
                    <h3 className="text-base md:text-lg font-semibold">
                      <span className="text-gold group-hover:text-black transition-colors">JBJ</span>{" "}
                      <span className="text-black group-hover:text-gold transition-colors">Investor Hub</span>
                    </h3>
                    <p className="text-zinc-600 group-hover:text-gold text-[10px] md:text-xs transition-colors">Free AI Tools</p>
                  </div>
                </div>
                <p className="text-zinc-700 group-hover:text-zinc-600 text-xs md:text-sm mb-2 md:mb-4 transition-colors line-clamp-2 md:line-clamp-none">
                  AI-powered property analysis, comparison, mortgage calculator, and productivity tools.
                </p>
                <span className="text-xs md:text-sm font-medium flex items-center gap-1 transition-colors">
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

      {/* BEST IDEA AWARD */}
      <BestIdeaAward />

      {/* SUPPORT TICKET moved to Contact page */}

      {/* AI COMPARISON & ANALYZER PREVIEW */}
      <section className="py-8 md:py-20 bg-black">
        <div className="jj-layer-2">
          <AIComparisonWidget />
        </div>
      </section>

      {/* MARKET REPORT CTA - Active Champagne Layer */}
      <section className="py-10 md:py-28 bg-black">
        <div className="jj-layer-2">
          <div className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border border-gold/40 md:border-2 rounded-xl md:rounded-3xl p-4 md:p-12 shadow-xl">
            <motion.div
              className="text-center mb-4 md:mb-10"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <span className="inline-block text-gold text-[10px] md:text-xs uppercase tracking-[0.2em] md:tracking-[0.3em] mb-2 md:mb-4">Exclusive Publication</span>
              <h2 className="text-black text-xl md:text-4xl font-bold" style={{ fontFamily: "Poppins, sans-serif" }}>
                Free Market <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold to-gold-light">Intelligence Book</span>
              </h2>
            </motion.div>
            <MarketReportCTA />
          </div>
        </div>
      </section>

      {/* BLACK SEPARATOR SECTION - Hidden on mobile */}
      <section className="hidden md:block py-12 md:py-16 bg-gradient-to-b from-black via-zinc-950 to-black">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-6">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
            <Sparkles className="w-5 h-5 text-gold/50" />
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
          </div>
        </div>
      </section>

      {/* MORTGAGE CALCULATOR SECTION - Compact on mobile */}
      <section className="py-10 md:py-28 bg-black">
        <div className="jj-layer-2">
          <div className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border border-gold/40 md:border-2 rounded-xl md:rounded-3xl p-4 md:p-12 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 md:w-64 h-32 md:h-64 bg-gold/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-24 md:w-48 h-24 md:h-48 bg-gold/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
            
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
                <Link to="/mortgage-calculator">
                  <button 
                    className="relative inline-flex items-center justify-center gap-2 px-8 py-5 text-base font-bold rounded-xl transition-all duration-300 group overflow-hidden whitespace-nowrap"
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
                    <span className="relative flex items-center justify-center gap-2 whitespace-nowrap">
                      <Sparkles className="w-5 h-5 text-gold group-hover:text-black transition-colors" />
                      <span className="whitespace-nowrap"><span className="text-black group-hover:text-gold transition-colors">Try Our AI </span><span className="text-gold group-hover:text-black transition-colors">Mortgage Calculator</span></span>
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
        {/* Active Champagne Section Layer - using global jj-layer-2 */}
        <div className="jj-layer-2">
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
