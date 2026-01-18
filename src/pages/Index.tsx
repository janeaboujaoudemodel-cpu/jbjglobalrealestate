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
            Licensed Real Estate Brokerage
          </motion.span>
          
          {/* H1 - Premium Typography */}
          <motion.h1 
            variants={fadeInUp} 
            className="text-white text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6"
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            Buy. Sell. Rent.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold via-[#C4A962] to-gold">Delivered with Intelligence.</span>
          </motion.h1>
          
          {/* Subline - Premium tagline */}
          <motion.p 
            variants={fadeInUp}
            className="text-zinc-300 text-base md:text-lg lg:text-xl max-w-2xl mx-auto leading-relaxed mb-4"
          >
            Luxury real estate brokerage for buying, selling & renting in the UAE.
          </motion.p>

          {/* Partner microline */}
          <motion.p 
            variants={fadeInUp}
            className="text-zinc-500 text-xs md:text-sm mb-10"
          >
            Mortgage, legal & visa services provided through licensed partners.
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
              <ArrowUpRight className="w-4 h-4 ml-2 text-gold" />
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

      {/* AI HOME FINDER - Premium CTA Section */}
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
              <div className="relative bg-gradient-to-br from-purple-900/40 via-purple-800/30 to-purple-900/40 backdrop-blur-md border-2 border-purple-500/50 rounded-2xl p-8 md:p-10 text-center hover:border-purple-400 hover:shadow-[0_0_40px_rgba(147,51,234,0.4)] transition-all duration-500 shadow-[0_0_25px_rgba(147,51,234,0.25)]">
                {/* Glow overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-transparent to-purple-600/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                
                <div className="relative z-10">
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <Sparkles className="w-8 h-8 text-purple-400 group-hover:text-purple-300 transition-colors" />
                    <h2 className="text-purple-300 text-2xl md:text-3xl lg:text-4xl font-bold tracking-wide group-hover:text-purple-200 transition-colors" style={{ fontFamily: "Poppins, sans-serif" }}>
                      AI Home Finder
                    </h2>
                    <ArrowUpRight className="w-7 h-7 text-purple-400 group-hover:text-purple-300 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-300" />
                  </div>
                  
                  <p className="text-purple-200/80 text-base md:text-lg group-hover:text-purple-100 transition-colors">
                    Take your free test and discover your perfect property match
                  </p>
                </div>
              </div>
            </Link>
          </motion.div>
        </div>
      </section>


      {/* WHO IS THIS FOR - Clear Entry Points */}
      <section className="py-16 md:py-20 bg-zinc-950">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <span className="inline-flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-white via-[#FDFBF7] to-[#F5F0E6] border border-gold/40 rounded-full text-black text-xs uppercase tracking-[0.2em] font-medium mb-3 shadow-md">
              <Users className="w-3 h-3 text-gold" />
              Who We Serve
            </span>
            <p className="text-white text-xl md:text-2xl font-medium" style={{ fontFamily: "Poppins, sans-serif" }}>
              Find Your Starting Point
            </p>
          </div>

          {/* Audience Entry Cards - White Cards with Black Icon Containers + Referral */}
          <div className="grid grid-cols-3 md:grid-cols-6 gap-3 max-w-6xl mx-auto mb-12">
            <Link to="/buyer-guide" className="group">
              <div className="bg-white border border-zinc-200 rounded-xl p-4 text-center hover:border-gold hover:shadow-xl hover:shadow-gold/20 transition-all duration-300 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-gold/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative z-10">
                  <div className="w-9 h-9 bg-black rounded-lg flex items-center justify-center mx-auto mb-2 group-hover:bg-zinc-900 transition-colors">
                    <Heart className="w-4 h-4 text-gold" />
                  </div>
                  <h4 className="text-black text-xs font-semibold mb-0.5">Buyers</h4>
                  <p className="text-zinc-600 text-[10px]">Find your home</p>
                </div>
              </div>
            </Link>
            <Link to="/seller-guide" className="group">
              <div className="bg-white border border-zinc-200 rounded-xl p-4 text-center hover:border-gold hover:shadow-xl hover:shadow-gold/20 transition-all duration-300 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-gold/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative z-10">
                  <div className="w-9 h-9 bg-black rounded-lg flex items-center justify-center mx-auto mb-2 group-hover:bg-zinc-900 transition-colors">
                    <Target className="w-4 h-4 text-gold" />
                  </div>
                  <h4 className="text-black text-xs font-semibold mb-0.5">Sellers</h4>
                  <p className="text-zinc-600 text-[10px]">List property</p>
                </div>
              </div>
            </Link>
            <Link to="/rent-guide" className="group">
              <div className="bg-white border border-zinc-200 rounded-xl p-4 text-center hover:border-gold hover:shadow-xl hover:shadow-gold/20 transition-all duration-300 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-gold/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative z-10">
                  <div className="w-9 h-9 bg-black rounded-lg flex items-center justify-center mx-auto mb-2 group-hover:bg-zinc-900 transition-colors">
                    <Key className="w-4 h-4 text-gold" />
                  </div>
                  <h4 className="text-black text-xs font-semibold mb-0.5">Renters</h4>
                  <p className="text-zinc-600 text-[10px]">Rent property</p>
                </div>
              </div>
            </Link>
            <Link to="/ai-hub" className="group">
              <div className="bg-white border border-zinc-200 rounded-xl p-4 text-center hover:border-gold hover:shadow-xl hover:shadow-gold/20 transition-all duration-300 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-gold/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative z-10">
                  <div className="w-9 h-9 bg-black rounded-lg flex items-center justify-center mx-auto mb-2 group-hover:bg-zinc-900 transition-colors">
                    <Briefcase className="w-4 h-4 text-gold" />
                  </div>
                  <h4 className="text-black text-xs font-semibold mb-0.5">Brokers</h4>
                  <p className="text-zinc-600 text-[10px]">Join circle</p>
                </div>
              </div>
            </Link>
            <Link to="/quiz" className="group">
              <div className="bg-white border border-zinc-200 rounded-xl p-4 text-center hover:border-gold hover:shadow-xl hover:shadow-gold/20 transition-all duration-300 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-gold/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative z-10">
                  <div className="w-9 h-9 bg-black rounded-lg flex items-center justify-center mx-auto mb-2 group-hover:bg-zinc-900 transition-colors">
                    <Users className="w-4 h-4 text-gold" />
                  </div>
                  <h4 className="text-black text-xs font-semibold mb-0.5">Visitors</h4>
                  <p className="text-zinc-600 text-[10px]">Explore UAE</p>
                </div>
              </div>
            </Link>
            <Link to="/referral" className="group">
              <div className="bg-white border border-zinc-200 rounded-xl p-4 text-center hover:border-gold hover:shadow-xl hover:shadow-gold/20 transition-all duration-300 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-gold/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative z-10">
                  <div className="w-9 h-9 bg-black rounded-lg flex items-center justify-center mx-auto mb-2 group-hover:bg-zinc-900 transition-colors">
                    <Award className="w-4 h-4 text-gold" />
                  </div>
                  <h4 className="text-black text-xs font-semibold mb-0.5">Referral</h4>
                  <p className="text-zinc-600 text-[10px]">Earn rewards</p>
                </div>
              </div>
            </Link>
          </div>

          {/* Quick Actions - Champagne Gold for Explore/List Properties */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto mb-12">
            <Link to="/properties" className="group">
              <div className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border border-gold/40 rounded-xl p-5 text-center hover:border-gold hover:shadow-[0_0_25px_rgba(200,167,102,0.4)] transition-all duration-300 relative overflow-hidden shadow-[0_0_15px_rgba(200,167,102,0.2)]">
                <div className="absolute inset-0 bg-gradient-to-br from-gold/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative z-10">
                  <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-zinc-900 transition-colors">
                    <Home className="w-5 h-5 text-gold" />
                  </div>
                  <h4 className="text-black text-sm font-semibold mb-1">Explore Properties</h4>
                  <p className="text-zinc-600 text-xs">Browse listings</p>
                </div>
              </div>
            </Link>
            <Link to="/seller-listing" className="group">
              <div className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border border-gold/40 rounded-xl p-5 text-center hover:border-gold hover:shadow-[0_0_25px_rgba(200,167,102,0.4)] transition-all duration-300 relative overflow-hidden shadow-[0_0_15px_rgba(200,167,102,0.2)]">
                <div className="absolute inset-0 bg-gradient-to-br from-gold/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative z-10">
                  <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-zinc-900 transition-colors">
                    <Target className="w-5 h-5 text-gold" />
                  </div>
                  <h4 className="text-black text-sm font-semibold mb-1">List Your Property</h4>
                  <p className="text-zinc-600 text-xs">Sell or rent</p>
                </div>
              </div>
            </Link>
            <Link to="/market-report" className="group">
              <div className="bg-white border border-zinc-200 rounded-xl p-5 text-center hover:border-gold hover:shadow-xl hover:shadow-gold/20 transition-all duration-300 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-gold/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative z-10">
                  <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-zinc-900 transition-colors">
                    <FileText className="w-5 h-5 text-gold" />
                  </div>
                  <h4 className="text-black text-sm font-semibold mb-1">Market Report</h4>
                  <p className="text-zinc-600 text-xs">Latest insights</p>
                </div>
              </div>
            </Link>
            <Link to="/ai-hub" className="group">
              <div className="bg-white border border-zinc-200 rounded-xl p-5 text-center hover:border-gold hover:shadow-xl hover:shadow-gold/20 transition-all duration-300 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-gold/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative z-10">
                  <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-zinc-900 transition-colors">
                    <Sparkles className="w-5 h-5 text-gold" />
                  </div>
                  <h4 className="text-black text-sm font-semibold mb-1">All Tools</h4>
                  <p className="text-zinc-600 text-xs">AI-powered tools</p>
                </div>
              </div>
            </Link>
          </div>

          {/* Licensed Partner Network - White Card Style */}
          <div className="grid grid-cols-3 gap-4 max-w-3xl mx-auto mb-12">
            <Link to="/services/law-firm" className="group">
              <div className="bg-white border border-zinc-200 rounded-xl p-5 text-center hover:border-gold hover:shadow-xl hover:shadow-gold/20 transition-all duration-300 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-gold/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative z-10">
                  <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-zinc-900 transition-colors">
                    <Scale className="w-5 h-5 text-gold" />
                  </div>
                  <h4 className="text-black text-sm font-semibold mb-1">Legal Partners</h4>
                  <p className="text-zinc-600 text-xs">Licensed advisors</p>
                </div>
              </div>
            </Link>
            <Link to="/mortgage-calculator" className="group">
              <div className="bg-white border border-zinc-200 rounded-xl p-5 text-center hover:border-gold hover:shadow-xl hover:shadow-gold/20 transition-all duration-300 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-gold/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative z-10">
                  <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-zinc-900 transition-colors">
                    <Calculator className="w-5 h-5 text-gold" />
                  </div>
                  <h4 className="text-black text-sm font-semibold mb-1">Mortgage Partners</h4>
                  <p className="text-zinc-600 text-xs">Financing options</p>
                </div>
              </div>
            </Link>
            <Link to="/services/design-build" className="group">
              <div className="bg-white border border-zinc-200 rounded-xl p-5 text-center hover:border-gold hover:shadow-xl hover:shadow-gold/20 transition-all duration-300 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-gold/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative z-10">
                  <div className="w-10 h-10 bg-black rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:bg-zinc-900 transition-colors">
                    <Wrench className="w-5 h-5 text-gold" />
                  </div>
                  <h4 className="text-black text-sm font-semibold mb-1">Design & Build</h4>
                  <p className="text-zinc-600 text-xs">Interior solutions</p>
                </div>
              </div>
            </Link>
          </div>

          {/* Resources Grid - Champagne Glowing Cards */}
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Broker Toolkit Card - Champagne Glow */}
            <Link to="/broker-toolkit" className="group">
              <div className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border border-gold/50 rounded-2xl p-6 md:p-8 hover:border-gold hover:shadow-[0_0_40px_rgba(200,167,102,0.5)] transition-all duration-300 shadow-[0_0_25px_rgba(200,167,102,0.3)]">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center shadow-lg shadow-gold/20">
                    <GraduationCap className="w-6 h-6 text-gold" />
                  </div>
                  <div>
                    <h3 className="text-black text-lg font-semibold">Broker Toolkit</h3>
                    <p className="text-zinc-500 text-xs">Guides & Resources</p>
                  </div>
                </div>
                <p className="text-zinc-600 text-sm mb-4">
                  Practical guides for real estate professionals.
                </p>
                <span className="text-gold text-sm font-medium group-hover:underline flex items-center gap-1">
                  Explore
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M17 7H7M17 7V17" />
                  </svg>
                </span>
              </div>
            </Link>

            {/* Broker Hub Card - Champagne Glow */}
            <Link to="/ai-hub" className="group">
              <div className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border border-gold/50 rounded-2xl p-6 md:p-8 hover:border-gold hover:shadow-[0_0_40px_rgba(200,167,102,0.5)] transition-all duration-300 shadow-[0_0_25px_rgba(200,167,102,0.3)]">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center shadow-lg shadow-gold/20">
                    <Layers className="w-6 h-6 text-gold" />
                  </div>
                  <div>
                    <h3 className="text-black text-lg font-semibold">JBJ Broker Hub</h3>
                    <p className="text-zinc-500 text-xs">20+ Free Tools</p>
                  </div>
                </div>
                <p className="text-zinc-600 text-sm mb-4">
                  AI tools, training, HR support & coaching — all free.
                </p>
                <span className="text-gold text-sm font-medium group-hover:underline flex items-center gap-1">
                  Access Broker Hub
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M17 7H7M17 7V17" />
                  </svg>
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
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="max-w-6xl mx-auto"
          >
            {/* Section Header */}
            <motion.div className="text-center mb-12" variants={fadeInUp}>
              <span className="inline-flex items-center gap-2 text-gold text-sm uppercase tracking-[0.3em]">
                <User className="w-4 h-4" />
                Leadership
              </span>
              <h2 
                className="text-white text-4xl md:text-5xl lg:text-6xl font-bold mt-4 mb-4"
                style={{ fontFamily: "Poppins, sans-serif" }}
              >
                Meet the <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold to-gold-light">Founder</span>
              </h2>
              <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
                JBJ Global Real Estate is a founder-led brokerage for buying, selling, and renting — built on unwavering standards, discretion, and long-term vision.
              </p>
            </motion.div>

            {/* Founder Card - Classic Side by Side Layout */}
            <motion.div 
              className="bg-zinc-900/50 border border-gold/20 rounded-3xl overflow-hidden"
              variants={fadeInUp}
            >
              <div className="grid md:grid-cols-2 gap-0">
                {/* Photo Side */}
                <div className="relative">
                  {/* GLOBAL IMAGE RULE - LOCKED (FINAL):
                      object-fit: cover + center 15% = max zoom, crop from bottom only */}
                  <img 
                    src={founderProfessional} 
                    alt="Jane Abou Jaoude - Founder & CEO at JBJ Global Real Estate"
                    className="w-full h-full min-h-[400px] md:min-h-[500px] bg-zinc-950"
                    style={{ objectFit: "cover", objectPosition: "center 15%" }}
                  />
                  {/* Subtle gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent to-zinc-900/30 md:block hidden" />
                </div>
                
                {/* Content Side */}
                <div className="p-8 md:p-12 flex flex-col justify-center">
                  <h3 className="text-white text-3xl md:text-4xl font-bold mb-2">Jane Abou Jaoude</h3>
                  <p
                    className="text-xl md:text-2xl font-semibold mb-6"
                    style={{
                      background: "linear-gradient(135deg, #CBA64B 0%, #E8D5A3 50%, #CBA64B 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    Founder and CEO
                  </p>
                  
                  <p className="text-zinc-400 text-base leading-relaxed mb-8">
                    With over 12 years of experience and a proven track record of training 2,800+ brokers, 
                    Jane leads JBJ Global Real Estate with a commitment to excellence, integrity, and client success.
                  </p>
                  
                  {/* Stats Row - Gold Borders */}
                  <div className="grid grid-cols-3 gap-4 mb-8">
                    <div className="text-center p-3 bg-black/30 border border-gold rounded-xl">
                      <p className="text-transparent bg-clip-text bg-gradient-to-r from-gold via-[#C4A962] to-gold text-2xl md:text-3xl font-bold">12+</p>
                      <p className="text-zinc-500 text-[10px] uppercase tracking-wider mt-1">Years Exp</p>
                    </div>
                    <div className="text-center p-3 bg-black/30 border border-gold rounded-xl">
                      <p className="text-transparent bg-clip-text bg-gradient-to-r from-gold via-[#C4A962] to-gold text-2xl md:text-3xl font-bold">10+</p>
                      <p className="text-zinc-500 text-[10px] uppercase tracking-wider mt-1">Team Members</p>
                    </div>
                    <div className="text-center p-3 bg-black/30 border border-gold rounded-xl">
                      <p className="text-transparent bg-clip-text bg-gradient-to-r from-gold via-[#C4A962] to-gold text-2xl md:text-3xl font-bold">2.8K+</p>
                      <p className="text-zinc-500 text-[10px] uppercase tracking-wider mt-1">Trained</p>
                    </div>
                  </div>
                  
                  {/* CTA Button */}
                  <Link to="/founder">
                    <Button className="w-full md:w-auto bg-gradient-to-r from-gold via-[#C4A962] to-gold hover:from-gold-light hover:to-gold text-black font-bold px-8 py-6 text-base transition-all duration-500 hover:shadow-[0_0_40px_rgba(200,167,102,0.6)] hover:scale-105 shadow-[0_0_25px_rgba(200,167,102,0.4)] border border-gold/50">
                      Learn More About Our Founder
                      <ArrowUpRight className="w-5 h-5 ml-2" />
                    </Button>
                  </Link>
                </div>
              </div>
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
            </div>
          </div>
        </div>
      </section>

      {/* Stats Counter Section */}
      <StatsCounter />

      {/* Contact CTA Section - Premium Champagne Design */}
      <section className="py-20 md:py-28 bg-gradient-to-br from-white via-[#FDFBF7] to-[#F5F0E6] relative overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <motion.div 
            className="text-center max-w-3xl mx-auto"
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
            
            <h3 className="text-3xl md:text-4xl lg:text-5xl font-bold text-black mb-6" style={{ fontFamily: "Poppins, sans-serif" }}>
              Ready to <span className="text-gold">Get Started?</span>
            </h3>
            <p className="text-zinc-600 text-base md:text-lg mb-10 leading-relaxed max-w-xl mx-auto">
              Connect with our expert team to explore exclusive opportunities in Dubai's premier real estate market.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button 
                variant="dark"
                className="px-10 py-6 text-base"
                onClick={() => setIsInquiryOpen(true)}
              >
                Book Consultation
                <ArrowUpRight className="w-5 h-5 ml-2" />
              </Button>
              <Link to="/properties">
                <Button 
                  variant="secondary"
                  className="border-black text-black hover:bg-black hover:text-white px-10 py-6 text-base"
                >
                  Browse Properties
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M17 7H7M17 7V17" />
                  </svg>
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
