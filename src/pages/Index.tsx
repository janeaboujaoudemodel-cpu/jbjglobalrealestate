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
import SupportTicketBox from "@/components/SupportTicketBox";
import ExploreServicesCard from "@/components/home/ExploreServicesCard";
import WhyDubaiCapitalSection from "@/components/home/WhyDubaiCapitalSection";

// Master Blueprint Components
import TrustBar from "@/components/home/TrustBar";
import FeaturedListings from "@/components/home/FeaturedListings";
import ServicesGrid from "@/components/home/ServicesGrid";
import WhyChooseUs from "@/components/home/WhyChooseUs";
import AreasWeCover from "@/components/home/AreasWeCover";
import TestimonialsSection from "@/components/home/TestimonialsSection";
import CTABand from "@/components/home/CTABand";
import HeroSearchBar from "@/components/home/HeroSearchBar";

import JBJPodcastSection from "@/components/home/JBJPodcastSection";
import { PodcastVisibilityGate } from "@/components/home/PodcastVisibilityGate";
import { SectionDivider } from "@/components/ui/section-divider";

import { SEOHead, pagesSEO } from "@/components/SEOHead";
import { useLanguage } from "@/contexts/LanguageContext";
import { useUserRole } from "@/hooks/useUserRole";
import { Sparkles, ArrowUpRight, ArrowRight, ChevronDown, User, Scale, Layers, Calculator, FileText, Heart, BarChart3, Wrench, Ruler, Palette, Calendar, Wallet, ShoppingBag, Brain, GraduationCap, Briefcase, Target, Award, PenTool, Users, Table2, Video, Home, Key, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PremiumHeroButton } from "@/components/ui/premium-hero-button";

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
      
      {/* HERO SECTION - LUXURY CINEMATIC VIDEO - MUST BE 100vh */}
      <div className="jj-hero-fullscreen relative flex items-center justify-center overflow-hidden">
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
        
        {/* Content - Left-aligned with Search Bar on Hero - Pushed down more, smaller content */}
        <motion.div 
          className="relative z-10 w-full flex flex-col items-start justify-end px-4 sm:px-8 md:px-12 lg:px-16 pb-16 md:pb-20"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <div className="max-w-4xl pt-40 md:pt-48 lg:pt-56">
            {/* Buy · Sell · Rent - Smaller headline */}
            <motion.h1 
              variants={fadeInUp} 
              className="text-white text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold tracking-tight leading-[1.1] mb-1.5 md:mb-2"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              <span className="block whitespace-nowrap">
                {t('hero.buy')}<span className="inline-block w-1 h-1 rounded-full mx-1.5 align-middle bg-gold" style={{ boxShadow: '0 0 6px rgba(200,167,102,0.8)' }}></span>
                {t('hero.sell')}<span className="inline-block w-1 h-1 rounded-full mx-1.5 align-middle bg-gold" style={{ boxShadow: '0 0 6px rgba(200,167,102,0.8)' }}></span>
                {t('hero.rent')}<span className="inline-block w-1 h-1 rounded-full mx-1.5 align-middle bg-gold" style={{ boxShadow: '0 0 6px rgba(200,167,102,0.8)' }}></span>
              </span>
            </motion.h1>

            {/* Licensed Real Estate Brokerage - Smaller subtitle */}
            <motion.p 
              variants={fadeInUp}
              className="text-zinc-400 text-[9px] sm:text-[10px] uppercase tracking-[0.12em] md:tracking-[0.15em] font-medium mb-1.5 md:mb-2"
            >
              {t('hero.subtitle')}
            </motion.p>
          
            {/* Delivered with Intelligence - Smaller */}
            <motion.span 
              variants={fadeInUp}
              className="block whitespace-nowrap text-[10px] sm:text-xs md:text-sm lg:text-base mb-4 md:mb-5 uppercase tracking-[0.12em] md:tracking-[0.15em] font-medium"
              style={{ 
                background: 'linear-gradient(90deg, #C8A766 0%, #E8D4A8 50%, #C8A766 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                filter: 'drop-shadow(0 1px 3px rgba(200,167,102,0.4))',
              }}
            >
              {t('hero.deliveredWith')}
            </motion.span>

            {/* SEARCH BAR - Compact */}
            <motion.div 
              variants={fadeInUp}
              className="w-full max-w-4xl"
            >
              <HeroSearchBar />
            </motion.div>

          </div>
        </motion.div>
      </div>

      {/* DEVELOPER PARTNERS MARQUEE - MOVED UP: Directly under hero */}
      <div id="developer-partners">
        <DeveloperPartnersMarquee />
      </div>

      {/* DIVIDER - Separates Developer Partners from Trust Bar */}
      <SectionDivider compact />

      {/* TRUST BAR (4 Cards) - Centered with proper divider alignment */}
      <div id="trust-bar" className="bg-black py-3">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-4 mb-3">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gold/25 to-gold/40" />
            <span className="text-gold/60 text-[10px] uppercase tracking-[0.2em] font-medium">Trusted By Thousands</span>
            <div className="flex-1 h-px bg-gradient-to-l from-transparent via-gold/25 to-gold/40" />
          </div>
        </div>
        <TrustBar />
      </div>

      {/* FEATURED LISTINGS - Master Blueprint: Section 3 (8 cards, Buy/Rent tabs) */}
      <FeaturedListings />

      {/* DIVIDER */}
      <SectionDivider compact />

      {/* FIND YOUR STARTING POINT - Clear Entry Points with Champagne Layer - ALL 11 CARDS RESTORED */}
      <section className="py-6 md:py-12 bg-black">
        <div className="jj-layer-2">
          <div className="text-center mb-6 md:mb-10">
            <span className="inline-flex items-center gap-1.5 md:gap-2 px-3 md:px-5 py-1.5 md:py-2 bg-gradient-to-r from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border-2 border-gold rounded-full text-[10px] md:text-xs uppercase tracking-[0.15em] md:tracking-[0.2em] font-semibold shadow-md">
              <Users className="w-3 h-3 md:w-3.5 md:h-3.5 text-gold" />
              <span className="text-black">{t('hero.findStartingPoint')}</span>
            </span>
          </div>

          {/* Audience Entry Cards - Full set with 11 cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-11 gap-2 md:gap-3 w-full mb-6 md:mb-10">
            {/* Card 1: Buyers */}
            <Link to="/buyer-guide" className="group">
              <div className="bg-gradient-to-r from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border border-gold/40 md:border-2 rounded-lg p-2 md:p-3 text-center hover:border-gold hover:shadow-[0_0_30px_rgba(200,167,102,0.5),0_20px_40px_rgba(0,0,0,0.35)] hover:-translate-y-1 shadow-[0_4px_12px_rgba(200,167,102,0.25),0_2px_6px_rgba(0,0,0,0.15)] md:shadow-[0_8px_25px_rgba(200,167,102,0.35),0_4px_12px_rgba(0,0,0,0.2)] transition-all duration-300 relative overflow-hidden h-full">
                <div className="relative z-10">
                  <div className="w-8 h-8 bg-transparent border border-gold md:border-2 group-hover:border-black rounded-md md:rounded-lg flex items-center justify-center mx-auto mb-1 md:mb-2 transition-colors">
                    <Heart className="w-4 h-4 text-black group-hover:text-gold transition-colors" />
                  </div>
                  <h4 className="text-black group-hover:text-gold text-xs font-semibold transition-colors leading-tight">{t('hero.buyers')}</h4>
                </div>
              </div>
            </Link>
            
            {/* Card 2: Sellers */}
            <Link to="/seller-guide" className="group">
              <div className="bg-gradient-to-r from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border border-gold/40 md:border-2 rounded-lg p-2 md:p-3 text-center hover:border-gold hover:shadow-[0_0_30px_rgba(200,167,102,0.5),0_20px_40px_rgba(0,0,0,0.35)] hover:-translate-y-1 shadow-[0_4px_12px_rgba(200,167,102,0.25),0_2px_6px_rgba(0,0,0,0.15)] md:shadow-[0_8px_25px_rgba(200,167,102,0.35),0_4px_12px_rgba(0,0,0,0.2)] transition-all duration-300 relative overflow-hidden h-full">
                <div className="relative z-10">
                  <div className="w-8 h-8 bg-transparent border border-gold md:border-2 group-hover:border-black rounded-md md:rounded-lg flex items-center justify-center mx-auto mb-1 md:mb-2 transition-colors">
                    <Target className="w-4 h-4 text-black group-hover:text-gold transition-colors" />
                  </div>
                  <h4 className="text-black group-hover:text-gold text-xs font-semibold transition-colors leading-tight">{t('hero.sellers')}</h4>
                </div>
              </div>
            </Link>
            
            {/* Card 3: Rentals */}
            <Link to="/rent-guide" className="group">
              <div className="bg-gradient-to-r from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border border-gold/40 md:border-2 rounded-lg p-2 md:p-3 text-center hover:border-gold hover:shadow-[0_0_30px_rgba(200,167,102,0.5),0_20px_40px_rgba(0,0,0,0.35)] hover:-translate-y-1 shadow-[0_4px_12px_rgba(200,167,102,0.25),0_2px_6px_rgba(0,0,0,0.15)] md:shadow-[0_8px_25px_rgba(200,167,102,0.35),0_4px_12px_rgba(0,0,0,0.2)] transition-all duration-300 relative overflow-hidden h-full">
                <div className="relative z-10">
                  <div className="w-8 h-8 bg-transparent border border-gold md:border-2 group-hover:border-black rounded-md md:rounded-lg flex items-center justify-center mx-auto mb-1 md:mb-2 transition-colors">
                    <Key className="w-4 h-4 text-black group-hover:text-gold transition-colors" />
                  </div>
                  <h4 className="text-black group-hover:text-gold text-xs font-semibold transition-colors leading-tight">{t('hero.rentals')}</h4>
                </div>
              </div>
            </Link>
            
            {/* Card 4: Landlords */}
            <Link to="/landlord-guide" className="group">
              <div className="bg-gradient-to-r from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border border-gold/40 md:border-2 rounded-lg p-2 md:p-3 text-center hover:border-gold hover:shadow-[0_0_30px_rgba(200,167,102,0.5),0_20px_40px_rgba(0,0,0,0.35)] hover:-translate-y-1 shadow-[0_4px_12px_rgba(200,167,102,0.25),0_2px_6px_rgba(0,0,0,0.15)] md:shadow-[0_8px_25px_rgba(200,167,102,0.35),0_4px_12px_rgba(0,0,0,0.2)] transition-all duration-300 relative overflow-hidden h-full">
                <div className="relative z-10">
                  <div className="w-8 h-8 bg-transparent border border-gold md:border-2 group-hover:border-black rounded-md md:rounded-lg flex items-center justify-center mx-auto mb-1 md:mb-2 transition-colors">
                    <Home className="w-4 h-4 text-black group-hover:text-gold transition-colors" />
                  </div>
                  <h4 className="text-black group-hover:text-gold text-xs font-semibold transition-colors leading-tight">Landlords</h4>
                </div>
              </div>
            </Link>
            
            {/* Card 5: Tenants */}
            <Link to="/tenant-guide" className="group">
              <div className="bg-gradient-to-r from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border border-gold/40 md:border-2 rounded-lg p-2 md:p-3 text-center hover:border-gold hover:shadow-[0_0_30px_rgba(200,167,102,0.5),0_20px_40px_rgba(0,0,0,0.35)] hover:-translate-y-1 shadow-[0_4px_12px_rgba(200,167,102,0.25),0_2px_6px_rgba(0,0,0,0.15)] md:shadow-[0_8px_25px_rgba(200,167,102,0.35),0_4px_12px_rgba(0,0,0,0.2)] transition-all duration-300 relative overflow-hidden h-full">
                <div className="relative z-10">
                  <div className="w-8 h-8 bg-transparent border border-gold md:border-2 group-hover:border-black rounded-md md:rounded-lg flex items-center justify-center mx-auto mb-1 md:mb-2 transition-colors">
                    <User className="w-4 h-4 text-black group-hover:text-gold transition-colors" />
                  </div>
                  <h4 className="text-black group-hover:text-gold text-xs font-semibold transition-colors leading-tight">Tenants</h4>
                </div>
              </div>
            </Link>
            
            {/* Card 6: Investors */}
            <Link to="/ai-hub" className="group">
              <div className="bg-gradient-to-r from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border border-gold/40 md:border-2 rounded-lg p-2 md:p-3 text-center hover:border-gold hover:shadow-[0_0_30px_rgba(200,167,102,0.5),0_20px_40px_rgba(0,0,0,0.35)] hover:-translate-y-1 shadow-[0_4px_12px_rgba(200,167,102,0.25),0_2px_6px_rgba(0,0,0,0.15)] md:shadow-[0_8px_25px_rgba(200,167,102,0.35),0_4px_12px_rgba(0,0,0,0.2)] transition-all duration-300 relative overflow-hidden h-full">
                <div className="relative z-10">
                  <div className="w-8 h-8 bg-transparent border border-gold md:border-2 group-hover:border-black rounded-md md:rounded-lg flex items-center justify-center mx-auto mb-1 md:mb-2 transition-colors">
                    <Layers className="w-4 h-4 text-black group-hover:text-gold transition-colors" />
                  </div>
                  <h4 className="text-black group-hover:text-gold text-xs font-semibold transition-colors leading-tight">{t('hero.investors')}</h4>
                </div>
              </div>
            </Link>
            
            {/* Card 7: Visitors */}
            <Link to="/quiz" className="group">
              <div className="bg-gradient-to-r from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border border-gold/40 md:border-2 rounded-lg p-2 md:p-3 text-center hover:border-gold hover:shadow-[0_0_30px_rgba(200,167,102,0.5),0_20px_40px_rgba(0,0,0,0.35)] hover:-translate-y-1 shadow-[0_4px_12px_rgba(200,167,102,0.25),0_2px_6px_rgba(0,0,0,0.15)] md:shadow-[0_8px_25px_rgba(200,167,102,0.35),0_4px_12px_rgba(0,0,0,0.2)] transition-all duration-300 relative overflow-hidden h-full">
                <div className="relative z-10">
                  <div className="w-8 h-8 bg-transparent border border-gold md:border-2 group-hover:border-black rounded-md md:rounded-lg flex items-center justify-center mx-auto mb-1 md:mb-2 transition-colors">
                    <Users className="w-4 h-4 text-black group-hover:text-gold transition-colors" />
                  </div>
                  <h4 className="text-black group-hover:text-gold text-xs font-semibold transition-colors leading-tight">{t('hero.visitors')}</h4>
                </div>
              </div>
            </Link>
            
            {/* Card 8: Partners */}
            <Link to="/partners" className="group">
              <div className="bg-gradient-to-r from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border border-gold/40 md:border-2 rounded-lg p-2 md:p-3 text-center hover:border-gold hover:shadow-[0_0_30px_rgba(200,167,102,0.5),0_20px_40px_rgba(0,0,0,0.35)] hover:-translate-y-1 shadow-[0_4px_12px_rgba(200,167,102,0.25),0_2px_6px_rgba(0,0,0,0.15)] md:shadow-[0_8px_25px_rgba(200,167,102,0.35),0_4px_12px_rgba(0,0,0,0.2)] transition-all duration-300 relative overflow-hidden h-full">
                <div className="relative z-10">
                  <div className="w-8 h-8 bg-transparent border border-gold md:border-2 group-hover:border-black rounded-md md:rounded-lg flex items-center justify-center mx-auto mb-1 md:mb-2 transition-colors">
                    <Briefcase className="w-4 h-4 text-black group-hover:text-gold transition-colors" />
                  </div>
                  <h4 className="text-black group-hover:text-gold text-xs font-semibold transition-colors leading-tight">Partners</h4>
                </div>
              </div>
            </Link>
            
            {/* Card 9: Golden Visa */}
            <Link to="/guides/golden-visa-uae" className="group">
              <div className="bg-gradient-to-r from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border border-gold/40 md:border-2 rounded-lg p-2 md:p-3 text-center hover:border-gold hover:shadow-[0_0_30px_rgba(200,167,102,0.5),0_20px_40px_rgba(0,0,0,0.35)] hover:-translate-y-1 shadow-[0_4px_12px_rgba(200,167,102,0.25),0_2px_6px_rgba(0,0,0,0.15)] md:shadow-[0_8px_25px_rgba(200,167,102,0.35),0_4px_12px_rgba(0,0,0,0.2)] transition-all duration-300 relative overflow-hidden h-full">
                <div className="relative z-10">
                  <div className="w-8 h-8 bg-transparent border border-gold md:border-2 group-hover:border-black rounded-md md:rounded-lg flex items-center justify-center mx-auto mb-1 md:mb-2 transition-colors">
                    <Globe className="w-4 h-4 text-black group-hover:text-gold transition-colors" />
                  </div>
                  <h4 className="text-black group-hover:text-gold text-xs font-semibold transition-colors leading-tight">Golden Visa</h4>
                </div>
              </div>
            </Link>
            
            {/* Card 10: Referral */}
            <Link to="/referral" className="group">
              <div className="bg-gradient-to-r from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border border-gold/40 md:border-2 rounded-lg p-2 md:p-3 text-center hover:border-gold hover:shadow-[0_0_30px_rgba(200,167,102,0.5),0_20px_40px_rgba(0,0,0,0.35)] hover:-translate-y-1 shadow-[0_4px_12px_rgba(200,167,102,0.25),0_2px_6px_rgba(0,0,0,0.15)] md:shadow-[0_8px_25px_rgba(200,167,102,0.35),0_4px_12px_rgba(0,0,0,0.2)] transition-all duration-300 relative overflow-hidden h-full">
                <div className="relative z-10">
                  <div className="w-8 h-8 bg-transparent border border-gold md:border-2 group-hover:border-black rounded-md md:rounded-lg flex items-center justify-center mx-auto mb-1 md:mb-2 transition-colors">
                    <Award className="w-4 h-4 text-black group-hover:text-gold transition-colors" />
                  </div>
                  <h4 className="text-black group-hover:text-gold text-xs font-semibold transition-colors leading-tight">{t('hero.referral')}</h4>
                </div>
              </div>
            </Link>
            
            {/* Card 11: Careers */}
            <Link to="/join" className="group">
              <div className="bg-gradient-to-r from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border border-gold/40 md:border-2 rounded-lg p-2 md:p-3 text-center hover:border-gold hover:shadow-[0_0_30px_rgba(200,167,102,0.5),0_20px_40px_rgba(0,0,0,0.35)] hover:-translate-y-1 shadow-[0_4px_12px_rgba(200,167,102,0.25),0_2px_6px_rgba(0,0,0,0.15)] md:shadow-[0_8px_25px_rgba(200,167,102,0.35),0_4px_12px_rgba(0,0,0,0.2)] transition-all duration-300 relative overflow-hidden h-full">
                <div className="relative z-10">
                  <div className="w-8 h-8 bg-transparent border border-gold md:border-2 group-hover:border-black rounded-md md:rounded-lg flex items-center justify-center mx-auto mb-1 md:mb-2 transition-colors">
                    <GraduationCap className="w-4 h-4 text-black group-hover:text-gold transition-colors" />
                  </div>
                  <h4 className="text-black group-hover:text-gold text-xs font-semibold transition-colors leading-tight">{t('hero.careers')}</h4>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* EXPLORE OUR SERVICES SLIDESHOW */}
      <ExploreServicesCard />

      {/* AI HOME FINDER - Premium CTA Section - CENTERED with background card */}
      <section className="py-10 md:py-16 bg-black">
        <div className="container mx-auto px-4">
          <div className="flex justify-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center relative"
            >
              {/* Background card - restored and centered */}
              <div className="absolute inset-0 -m-6 md:-m-8 rounded-2xl bg-gradient-to-r from-purple-500/10 via-purple-600/5 to-purple-500/10 border border-purple-400/20 blur-sm" />
              <div className="relative z-10 px-6 md:px-10 py-4 md:py-6">
                <Link to="/quiz" className="inline-flex items-center gap-3 group">
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-br from-purple-500/30 to-purple-600/20 border border-purple-400/40 flex items-center justify-center shadow-[0_0_20px_rgba(147,51,234,0.3)] group-hover:shadow-[0_0_30px_rgba(147,51,234,0.5)] transition-all">
                    <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-purple-400 group-hover:text-purple-300 transition-colors" />
                  </div>
                  <h2 
                    className="text-2xl md:text-4xl lg:text-5xl font-bold tracking-wide text-purple-400 group-hover:text-purple-300 transition-colors" 
                    style={{ fontFamily: "Poppins, sans-serif" }}
                  >
                    {t('hero.aiFinder')}
                  </h2>
                  <ArrowUpRight className="w-5 h-5 md:w-7 md:h-7 text-purple-400 group-hover:text-purple-300 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-300" />
                </Link>
                <p className="text-white/70 text-sm md:text-base mt-2 max-w-lg mx-auto">
                  {t('hero.aiFinderDesc')}
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* DIVIDER */}
      <SectionDivider compact />

      {/* AI COMPARISON & ANALYZER PREVIEW */}
      <section className="py-6 md:py-14 bg-black">
        <div className="jj-layer-2">
          <AIComparisonWidget />
        </div>
      </section>

      {/* DIVIDER */}
      <SectionDivider compact />

      {/* MARKET REPORT CTA - Active Champagne Layer */}
      <section className="py-8 md:py-16 bg-black">
        <div className="jj-layer-2">
          <div className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border border-gold/40 md:border-2 rounded-xl md:rounded-3xl p-4 md:p-10 shadow-xl">
            <motion.div
              className="text-center mb-4 md:mb-8"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <span className="inline-block text-gold text-[10px] md:text-xs uppercase tracking-[0.2em] md:tracking-[0.3em] mb-2 md:mb-3">Exclusive Publication</span>
              <h2 className="text-black text-xl md:text-3xl font-bold" style={{ fontFamily: "Poppins, sans-serif" }}>
                Free Market <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold to-gold-light">Intelligence Book</span>
              </h2>
            </motion.div>
            <MarketReportCTA />
          </div>
        </div>
      </section>

      {/* DIVIDER */}
      <SectionDivider compact />

      {/* MORTGAGE CALCULATOR SECTION - Compact on mobile */}
      <section className="py-8 md:py-16 bg-black">
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

      {/* DIVIDER - Before Why Dubai */}
      <SectionDivider compact />

      <WhyDubaiCapitalSection />

      {/* JBJ PODCAST SECTION - Admin-controlled visibility */}
      <PodcastVisibilityGate>
        <SectionDivider compact />
        <JBJPodcastSection />
        <SectionDivider compact />
      </PodcastVisibilityGate>

      {/* BEST IDEA AWARD */}
      <BestIdeaAward />

      {/* WHY CHOOSE US - Master Blueprint: Section 5 */}
      <WhyChooseUs />

      {/* AREAS WE COVER - Master Blueprint: Section 6 (12 area links) */}
      <AreasWeCover />

      {/* TESTIMONIALS - Master Blueprint: Section 7 (3 testimonials) */}
      <TestimonialsSection />

      {/* Stats Counter Section */}
      <StatsCounter />

      {/* CTA BAND - Master Blueprint: Section 8 (Ready to Get Started?) */}
      <CTABand />

      {/* SUPPORT TICKET BOX - Always visible */}
      <SupportTicketBox />

      {/* FOOTER */}
      <Footer />

      {/* Inquiry Modal */}
      <InquiryFormModal 
        isOpen={isInquiryOpen} 
        onClose={() => setIsInquiryOpen(false)} 
      />
    </section>
  );
};

export default Index;