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

      {/* HERO SECTION - SOLID BLACK BACKGROUND WITH CENTERED WHITE PANEL */}
      <div className="relative min-h-screen flex items-center justify-center bg-black px-4 py-20 md:py-24">
        
        {/* White Content Panel - Centered, smaller than full screen */}
        <motion.div 
          className="relative z-10 w-full max-w-3xl bg-white rounded-2xl md:rounded-3xl shadow-2xl shadow-black/60 overflow-hidden"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          {/* Main Content Area */}
          <div className="px-6 py-10 sm:px-10 sm:py-14 md:px-16 md:py-16 text-center">
            {/* Large JBJ Logo - White version on black would be outside, using dark inside white panel */}
            <motion.div variants={fadeInUp} className="mb-6 md:mb-8">
              <img 
                src={jbjFullLogoLight}
                alt="JBJ Global Real Estate"
                className="w-48 h-auto sm:w-56 md:w-72 lg:w-80 mx-auto object-contain"
              />
            </motion.div>
            
            {/* Gold divider */}
            <motion.div 
              variants={fadeInUp}
              className="w-16 md:w-24 h-1 bg-gradient-to-r from-gold to-gold-light mx-auto mb-4 md:mb-6"
            />
            
            {/* Tagline */}
            <motion.p 
              variants={fadeInUp}
              className="text-gold text-xs md:text-sm uppercase tracking-[0.25em] md:tracking-[0.3em] mb-6 md:mb-8 font-medium"
            >
              Real Estate Brokerage
            </motion.p>

            {/* We Find | We Negotiate | We Deliver */}
            <motion.div 
              variants={fadeInUp}
              className="flex flex-wrap items-center justify-center gap-3 md:gap-6 text-zinc-600 text-sm md:text-base lg:text-lg mb-6 md:mb-8"
            >
              <span className="font-medium">We Find</span>
              <span className="text-gold">|</span>
              <span className="font-medium">We Negotiate</span>
              <span className="text-gold">|</span>
              <span className="font-medium">We Deliver</span>
            </motion.div>

            {/* Sub-tagline */}
            <motion.p 
              className="text-zinc-500 text-xs sm:text-sm md:text-base max-w-lg mx-auto leading-relaxed"
              variants={fadeInUp}
            >
              Dubai's Premier Real Estate Brokerage — Expert property sales, leasing & holiday homes across the UAE
            </motion.p>
          </div>
          
          {/* Gold accent bar at bottom */}
          <div className="h-1.5 md:h-2 bg-gradient-to-r from-gold via-gold-light to-gold" />
        </motion.div>
        
        {/* Scroll indicator - Below white card */}
        <motion.div 
          className="absolute bottom-6 md:bottom-8 left-0 right-0 flex flex-col items-center gap-2 text-white/50 z-10"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.5, duration: 0.8 }}
        >
          <span className="text-[10px] md:text-xs uppercase tracking-[0.3em]">Discover</span>
          <ChevronDown className="w-4 h-4 md:w-5 md:h-5 animate-bounce" />
        </motion.div>
      </div>

      {/* CTA SECTION - Below Hero */}
      <section className="py-12 md:py-16 bg-black">
        <div className="container mx-auto px-4">
          <motion.div 
            className="flex flex-col items-center gap-5"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            {/* Row 1 - Primary CTAs - White Background with Gold Text */}
            <div className="flex flex-wrap justify-center gap-3">
              <Link to="/services">
                <Button 
                  className="bg-white hover:bg-zinc-100 text-gold font-semibold px-6 py-5 text-sm shadow-lg shadow-white/10 hover:shadow-xl transition-all duration-300 hover:scale-105"
                >
                  Explore Our Services
                  <ArrowUpRight className="w-4 h-4 ml-2 text-gold" />
                </Button>
              </Link>
              <Button 
                className="bg-white hover:bg-zinc-100 text-gold font-semibold px-6 py-5 text-sm shadow-lg shadow-white/10 hover:shadow-xl transition-all duration-300 hover:scale-105"
                onClick={() => setIsInquiryOpen(true)}
              >
                Contact Us
                <ArrowUpRight className="w-4 h-4 ml-2 text-gold" />
              </Button>
              <Link to="/market-report">
                <Button 
                  className="bg-white hover:bg-zinc-100 text-gold font-semibold px-6 py-5 text-sm shadow-lg shadow-white/10 hover:shadow-xl transition-all duration-300 hover:scale-105"
                >
                  <FileText className="w-4 h-4 mr-2 text-gold" />
                  Market Report
                  <ArrowUpRight className="w-4 h-4 ml-2 text-gold" />
                </Button>
              </Link>
              <Link to="/news">
                <Button 
                  className="bg-white hover:bg-zinc-100 text-gold font-semibold px-6 py-5 text-sm shadow-lg shadow-white/10 hover:shadow-xl transition-all duration-300 hover:scale-105"
                >
                  <FileText className="w-4 h-4 mr-2 text-gold" />
                  News & Insights
                  <ArrowUpRight className="w-4 h-4 ml-2 text-gold" />
                </Button>
              </Link>
            </div>
            
            {/* Row 2 - Services Row - Dark Solid with Gold Accent Border */}
            <div className="flex flex-wrap justify-center gap-3">
              <Link to="/properties">
                <Button 
                  className="bg-zinc-900 border-2 border-gold/40 text-white hover:bg-zinc-800 hover:border-gold font-semibold px-5 py-4 text-xs transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-gold/20"
                >
                  Explore Properties
                  <ArrowUpRight className="w-3 h-3 ml-1 text-gold" />
                </Button>
              </Link>
              <Button 
                className="bg-zinc-900 border-2 border-gold/40 text-white hover:bg-zinc-800 hover:border-gold font-semibold px-5 py-4 text-xs transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-gold/20"
                onClick={() => setIsInquiryOpen(true)}
              >
                List Your Property
                <ArrowUpRight className="w-3 h-3 ml-1 text-gold" />
              </Button>
              <Link to="/concierge">
                <Button 
                  className="bg-zinc-900 border-2 border-gold/40 text-white hover:bg-zinc-800 hover:border-gold font-semibold px-5 py-4 text-xs transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-gold/20"
                >
                  Luxury Concierge
                  <ArrowUpRight className="w-3 h-3 ml-1 text-gold" />
                </Button>
              </Link>
              <Link to="/services/design-build">
                <Button 
                  className="bg-zinc-900 border-2 border-gold/40 text-white hover:bg-zinc-800 hover:border-gold font-semibold px-5 py-4 text-xs transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-gold/20"
                >
                  Design & Build
                  <ArrowUpRight className="w-3 h-3 ml-1 text-gold" />
                </Button>
              </Link>
              <Link to="/services/law-firm">
                <Button 
                  className="bg-zinc-900 border-2 border-gold/40 text-white hover:bg-zinc-800 hover:border-gold font-semibold px-5 py-4 text-xs transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-gold/20"
                >
                  Legal Partners
                  <ArrowUpRight className="w-3 h-3 ml-1 text-gold" />
                </Button>
              </Link>
            </div>
            
            {/* Row 3 - AI Tools - Colored Glowing Borders */}
            <div className="flex flex-wrap justify-center gap-3">
              <Link to="/compare">
                <Button 
                  className="bg-transparent backdrop-blur-md border-2 border-purple-500/50 text-purple-400 hover:bg-purple-500/20 hover:border-purple-400 hover:shadow-lg hover:shadow-purple-500/20 font-semibold px-5 py-4 text-xs transition-all duration-300 hover:scale-105 group"
                >
                  <BarChart3 className="w-3 h-3 mr-1" />
                  Property Comparison
                  <ArrowUpRight className="w-3 h-3 ml-1 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </Button>
              </Link>
              
              <Link to="/interior-design-ai">
                <Button 
                  className="bg-transparent backdrop-blur-md border-2 border-fuchsia-500/50 text-fuchsia-400 hover:bg-fuchsia-500/20 hover:border-fuchsia-400 hover:shadow-lg hover:shadow-fuchsia-500/20 font-semibold px-5 py-4 text-xs transition-all duration-300 hover:scale-105 group"
                >
                  <Palette className="w-3 h-3 mr-1" />
                  AI Interior Design Studio
                  <ArrowUpRight className="w-3 h-3 ml-1 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </Button>
              </Link>
              
              <Link to="/property-measurement">
                <Button 
                  className="bg-transparent backdrop-blur-md border-2 border-teal-500/50 text-teal-400 hover:bg-teal-500/20 hover:border-teal-400 hover:shadow-lg hover:shadow-teal-500/20 font-semibold px-5 py-4 text-xs transition-all duration-300 hover:scale-105 group"
                >
                  <Ruler className="w-3 h-3 mr-1" />
                  Property Measurement
                  <ArrowUpRight className="w-3 h-3 ml-1 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </Button>
              </Link>
              
              <Link to="/rental-index">
                <Button 
                  className="bg-transparent backdrop-blur-md border-2 border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-400 hover:shadow-lg hover:shadow-emerald-500/20 font-semibold px-5 py-4 text-xs transition-all duration-300 hover:scale-105 group"
                >
                  <Layers className="w-3 h-3 mr-1" />
                  Rental Index
                  <ArrowUpRight className="w-3 h-3 ml-1 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </Button>
              </Link>
              
              <Link to="/document-scanner">
                <Button 
                  className="bg-transparent backdrop-blur-md border-2 border-green-500/50 text-green-400 hover:bg-green-500/20 hover:border-green-400 hover:shadow-lg hover:shadow-green-500/20 font-semibold px-5 py-4 text-xs transition-all duration-300 hover:scale-105 group"
                >
                  <FileText className="w-3 h-3 mr-1" />
                  Scan & Sign
                  <ArrowUpRight className="w-3 h-3 ml-1 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </Button>
              </Link>
            </div>
            
            {/* Row 4 - More AI Tools */}
            <div className="flex flex-wrap justify-center gap-3">
              <Link to="/property-evaluator">
                <Button 
                  className="bg-transparent backdrop-blur-md border-2 border-blue-500/50 text-blue-400 hover:bg-blue-500/20 hover:border-blue-400 hover:shadow-lg hover:shadow-blue-500/20 font-semibold px-5 py-4 text-xs transition-all duration-300 hover:scale-105 group"
                >
                  <Calculator className="w-3 h-3 mr-1" />
                  Property Evaluator
                  <ArrowUpRight className="w-3 h-3 ml-1 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </Button>
              </Link>
              
              <Link to="/mortgage-calculator">
                <Button 
                  className="bg-transparent backdrop-blur-md border-2 border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/20 hover:border-cyan-400 hover:shadow-lg hover:shadow-cyan-500/20 font-semibold px-5 py-4 text-xs transition-all duration-300 hover:scale-105 group"
                >
                  <Calculator className="w-3 h-3 mr-1" />
                  Mortgage Calculator
                  <ArrowUpRight className="w-3 h-3 ml-1 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </Button>
              </Link>
              
              <Link to="/favorites">
                <Button 
                  className="bg-transparent backdrop-blur-md border-2 border-pink-500/50 text-pink-400 hover:bg-pink-500/20 hover:border-pink-400 hover:shadow-lg hover:shadow-pink-500/20 font-semibold px-5 py-4 text-xs transition-all duration-300 hover:scale-105 group"
                >
                  <Heart className="w-3 h-3 mr-1" />
                  Favorites & Shortlist
                  <ArrowUpRight className="w-3 h-3 ml-1 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </Button>
              </Link>
              
              <Link to="/tools-guide">
                <Button 
                  className="bg-transparent backdrop-blur-md border-2 border-violet-500/50 text-violet-400 hover:bg-violet-500/20 hover:border-violet-400 hover:shadow-lg hover:shadow-violet-500/20 font-semibold px-5 py-4 text-xs transition-all duration-300 hover:scale-105 group"
                >
                  <Wrench className="w-3 h-3 mr-1" />
                  Tools Guide
                  <ArrowUpRight className="w-3 h-3 ml-1 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </Button>
              </Link>
              
              <Link to="/ai-hub">
                <Button 
                  className="bg-transparent backdrop-blur-md border-2 border-purple-500/50 text-purple-400 hover:bg-purple-500/20 hover:border-purple-400 hover:shadow-lg hover:shadow-purple-500/20 font-semibold px-5 py-4 text-xs transition-all duration-300 hover:scale-105 group"
                >
                  <Brain className="w-3 h-3 mr-1" />
                  AI Hub
                  <ArrowUpRight className="w-3 h-3 ml-1 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </Button>
              </Link>
            </div>
            
            {/* Row 5 - New AI Tools */}
            <div className="flex flex-wrap justify-center gap-3">
              <Link to="/ai-calendar">
                <Button 
                  className="bg-transparent backdrop-blur-md border-2 border-indigo-500/50 text-indigo-400 hover:bg-indigo-500/20 hover:border-indigo-400 hover:shadow-lg hover:shadow-indigo-500/20 font-semibold px-5 py-4 text-xs transition-all duration-300 hover:scale-105 group"
                >
                  <Calendar className="w-3 h-3 mr-1" />
                  AI Calendar & Notes
                  <ArrowUpRight className="w-3 h-3 ml-1 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </Button>
              </Link>
              
              <Link to="/ai-budget-planner">
                <Button 
                  className="bg-transparent backdrop-blur-md border-2 border-amber-500/50 text-amber-400 hover:bg-amber-500/20 hover:border-amber-400 hover:shadow-lg hover:shadow-amber-500/20 font-semibold px-5 py-4 text-xs transition-all duration-300 hover:scale-105 group"
                  title="Budget analysis and property affordability insights (informational only)"
                >
                  <Wallet className="w-3 h-3 mr-1" />
                  AI Budget Planner
                  <ArrowUpRight className="w-3 h-3 ml-1 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </Button>
              </Link>
              
              <Link to="/ai-personal-shopper">
                <Button 
                  className="bg-transparent backdrop-blur-md border-2 border-rose-500/50 text-rose-400 hover:bg-rose-500/20 hover:border-rose-400 hover:shadow-lg hover:shadow-rose-500/20 font-semibold px-5 py-4 text-xs transition-all duration-300 hover:scale-105 group"
                >
                  <ShoppingBag className="w-3 h-3 mr-1" />
                  AI Personal Shopper
                  <ArrowUpRight className="w-3 h-3 ml-1 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </Button>
              </Link>
              
              <Link to="/signature-studio">
                <Button 
                  className="bg-transparent backdrop-blur-md border-2 border-sky-500/50 text-sky-400 hover:bg-sky-500/20 hover:border-sky-400 hover:shadow-lg hover:shadow-sky-500/20 font-semibold px-5 py-4 text-xs transition-all duration-300 hover:scale-105 group"
                >
                  <PenTool className="w-3 h-3 mr-1" />
                  Signature Studio
                  <ArrowUpRight className="w-3 h-3 ml-1 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </Button>
              </Link>
              
              <Link to="/referral-onboarding">
                <Button 
                  className="bg-transparent backdrop-blur-md border-2 border-lime-500/50 text-lime-400 hover:bg-lime-500/20 hover:border-lime-400 hover:shadow-lg hover:shadow-lime-500/20 font-semibold px-5 py-4 text-xs transition-all duration-300 hover:scale-105 group"
                >
                  <Users className="w-3 h-3 mr-1" />
                  Join Referral Program
                  <ArrowUpRight className="w-3 h-3 ml-1 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </Button>
              </Link>
              
              <Link to="/spreadsheet">
                <Button 
                  className="bg-transparent backdrop-blur-md border-2 border-green-500/50 text-green-400 hover:bg-green-500/20 hover:border-green-400 hover:shadow-lg hover:shadow-green-500/20 font-semibold px-5 py-4 text-xs transition-all duration-300 hover:scale-105 group"
                >
                  <Table2 className="w-3 h-3 mr-1" />
                  Spreadsheet
                  <ArrowUpRight className="w-3 h-3 ml-1 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </Button>
              </Link>
              
              <Link to="/documents">
                <Button 
                  className="bg-transparent backdrop-blur-md border-2 border-blue-500/50 text-blue-400 hover:bg-blue-500/20 hover:border-blue-400 hover:shadow-lg hover:shadow-blue-500/20 font-semibold px-5 py-4 text-xs transition-all duration-300 hover:scale-105 group"
                >
                  <FileText className="w-3 h-3 mr-1" />
                  Documents
                  <ArrowUpRight className="w-3 h-3 ml-1 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </Button>
              </Link>
              
              <Link to="/video-meeting">
                <Button 
                  className="bg-transparent backdrop-blur-md border-2 border-red-500/50 text-red-400 hover:bg-red-500/20 hover:border-red-400 hover:shadow-lg hover:shadow-red-500/20 font-semibold px-5 py-4 text-xs transition-all duration-300 hover:scale-105 group"
                >
                  <Video className="w-3 h-3 mr-1" />
                  Video Meeting
                  <ArrowUpRight className="w-3 h-3 ml-1 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </Button>
              </Link>
            </div>
            
            {/* Row 6 - More Tools */}
            <div className="flex flex-wrap justify-center gap-3">
              <Link to="/crm">
                <Button 
                  className="bg-transparent backdrop-blur-md border-2 border-orange-500/50 text-orange-400 hover:bg-orange-500/20 hover:border-orange-400 hover:shadow-lg hover:shadow-orange-500/20 font-semibold px-5 py-4 text-xs transition-all duration-300 hover:scale-105 group"
                >
                  <Briefcase className="w-3 h-3 mr-1" />
                  CRM Dashboard
                  <ArrowUpRight className="w-3 h-3 ml-1 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </Button>
              </Link>
              
              <Link to="/map">
                <Button 
                  className="bg-transparent backdrop-blur-md border-2 border-teal-500/50 text-teal-400 hover:bg-teal-500/20 hover:border-teal-400 hover:shadow-lg hover:shadow-teal-500/20 font-semibold px-5 py-4 text-xs transition-all duration-300 hover:scale-105 group"
                >
                  <Target className="w-3 h-3 mr-1" />
                  Property Map
                  <ArrowUpRight className="w-3 h-3 ml-1 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </Button>
              </Link>
              
              <Link to="/hr-agent">
                <Button 
                  className="bg-transparent backdrop-blur-md border-2 border-violet-500/50 text-violet-400 hover:bg-violet-500/20 hover:border-violet-400 hover:shadow-lg hover:shadow-violet-500/20 font-semibold px-5 py-4 text-xs transition-all duration-300 hover:scale-105 group"
                >
                  <User className="w-3 h-3 mr-1" />
                  HR Agent
                  <ArrowUpRight className="w-3 h-3 ml-1 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </Button>
              </Link>
              
              <Link to="/my-account">
                <Button 
                  className="bg-transparent backdrop-blur-md border-2 border-cyan-500/50 text-cyan-400 hover:bg-cyan-500/20 hover:border-cyan-400 hover:shadow-lg hover:shadow-cyan-500/20 font-semibold px-5 py-4 text-xs transition-all duration-300 hover:scale-105 group"
                >
                  <User className="w-3 h-3 mr-1" />
                  My Account
                  <ArrowUpRight className="w-3 h-3 ml-1 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </Button>
              </Link>
              
              <Link to="/join">
                <Button 
                  className="bg-transparent backdrop-blur-md border-2 border-gold/50 text-gold hover:bg-gold/20 hover:border-gold hover:shadow-lg hover:shadow-gold/20 font-semibold px-5 py-4 text-xs transition-all duration-300 hover:scale-105 group"
                >
                  <Briefcase className="w-3 h-3 mr-1" />
                  Join Our Team
                  <ArrowUpRight className="w-3 h-3 ml-1 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </Button>
              </Link>
              
              <Link to="/onboarding">
                <Button 
                  className="bg-transparent backdrop-blur-md border-2 border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-400 hover:shadow-lg hover:shadow-emerald-500/20 font-semibold px-5 py-4 text-xs transition-all duration-300 hover:scale-105 group"
                >
                  <GraduationCap className="w-3 h-3 mr-1" />
                  Training Portal
                  <ArrowUpRight className="w-3 h-3 ml-1 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </Button>
              </Link>
            </div>
            
            {/* AI Home Finder - Full Width Purple Glowing Bar */}
            <Link to="/quiz" className="w-full max-w-2xl mt-4">
              <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-purple-600 via-purple-700 to-purple-800 p-[1px] shadow-2xl shadow-purple-500/30 hover:shadow-purple-500/50 transition-all duration-500 group hover:scale-[1.02]">
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

      {/* BROKER TOOLKIT & PROFESSIONAL TOOLS SECTION - Premium Dedicated */}
      <section className="py-20 md:py-28 bg-gradient-to-b from-black via-zinc-950 to-black relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-gold/5 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          {/* Section Header */}
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 text-gold text-xs uppercase tracking-[0.3em] mb-4">
              <Award className="w-4 h-4" />
              Exclusive Platform
            </span>
            <h2 
              className="text-white text-3xl md:text-4xl lg:text-5xl font-bold mb-4"
              style={{ fontFamily: "Poppins, sans-serif" }}
            >
              Elevate Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold via-gold-light to-gold">Real Estate Career</span>
            </h2>
            <p className="text-zinc-400 text-lg max-w-2xl mx-auto">
              Access AI-powered tools and professional resources designed for real estate excellence
            </p>
          </motion.div>

          {/* Two Column Cards */}
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Broker Toolkit Card */}
            <motion.div
              className="relative group"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-gold/20 via-gold/10 to-transparent rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500 opacity-50 group-hover:opacity-80" />
              <div className="relative bg-zinc-900/80 backdrop-blur-xl border border-gold/30 rounded-3xl p-8 md:p-10 h-full hover:border-gold/60 transition-all duration-500 group-hover:shadow-2xl group-hover:shadow-gold/20">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-gold to-gold-light rounded-2xl flex items-center justify-center shadow-lg shadow-gold/30">
                    <GraduationCap className="w-8 h-8 text-black" />
                  </div>
                  <div>
                    <h3 className="text-white text-2xl font-bold" style={{ fontFamily: "Poppins, sans-serif" }}>
                      Broker Toolkit
                    </h3>
                    <p className="text-gold text-sm uppercase tracking-wider">Guides & Resources</p>
                  </div>
                </div>
                
                <p className="text-zinc-300 mb-6 leading-relaxed">
                  Practical guides and resources for real estate professionals. From lead generation to closing techniques, develop your expertise.
                </p>
                
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-3 text-zinc-400">
                    <Target className="w-4 h-4 text-gold flex-shrink-0" />
                    <span>Closing Techniques Guide</span>
                  </li>
                  <li className="flex items-center gap-3 text-zinc-400">
                    <Target className="w-4 h-4 text-gold flex-shrink-0" />
                    <span>Lead Generation Strategies</span>
                  </li>
                  <li className="flex items-center gap-3 text-zinc-400">
                    <Target className="w-4 h-4 text-gold flex-shrink-0" />
                    <span>Client Relationship Tips</span>
                  </li>
                  <li className="flex items-center gap-3 text-zinc-400">
                    <Target className="w-4 h-4 text-gold flex-shrink-0" />
                    <span>Market Analysis Insights</span>
                  </li>
                </ul>
                
                <Link to="/broker-toolkit">
                  <Button className="w-full bg-gradient-to-r from-gold to-gold-light hover:from-gold-light hover:to-gold text-black font-bold py-6 text-base shadow-lg shadow-gold/30 hover:shadow-xl hover:shadow-gold/40 transition-all duration-300 group-hover:scale-[1.02]">
                    Explore Resources
                    <ArrowUpRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                
                <p className="text-zinc-500 text-xs text-center mt-4">
                  Educational content only. Not an accredited training institute.
                </p>
              </div>
            </motion.div>

            {/* Professional Tools Card */}
            <motion.div
              className="relative group"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-purple-500/10 to-transparent rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500 opacity-50 group-hover:opacity-80" />
              <div className="relative bg-zinc-900/80 backdrop-blur-xl border border-purple-500/30 rounded-3xl p-8 md:p-10 h-full hover:border-purple-400/60 transition-all duration-500 group-hover:shadow-2xl group-hover:shadow-purple-500/20">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/30">
                    <Briefcase className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white text-2xl font-bold" style={{ fontFamily: "Poppins, sans-serif" }}>
                      Professional Tools
                    </h3>
                    <p className="text-purple-400 text-sm uppercase tracking-wider">AI-Powered Assistants</p>
                  </div>
                </div>
                
                <p className="text-zinc-300 mb-6 leading-relaxed">
                  Supercharge your productivity with AI-powered tools designed to streamline your workflow and deliver exceptional results to clients.
                </p>
                
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-3 text-zinc-400">
                    <BarChart3 className="w-4 h-4 text-purple-400 flex-shrink-0" />
                    <span>Property Comparison & Analysis</span>
                  </li>
                  <li className="flex items-center gap-3 text-zinc-400">
                    <Calculator className="w-4 h-4 text-purple-400 flex-shrink-0" />
                    <span>Property Valuator & Evaluator</span>
                  </li>
                  <li className="flex items-center gap-3 text-zinc-400">
                    <FileText className="w-4 h-4 text-purple-400 flex-shrink-0" />
                    <span>Document Scanner & Signing</span>
                  </li>
                  <li className="flex items-center gap-3 text-zinc-400">
                    <Palette className="w-4 h-4 text-purple-400 flex-shrink-0" />
                    <span>AI Interior Design Studio</span>
                  </li>
                </ul>
                
                <Link to="/tools-guide">
                  <Button className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-bold py-6 text-base shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 transition-all duration-300 group-hover:scale-[1.02]">
                    Explore Tools
                    <ArrowUpRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>

          {/* Quick Stats - Simplified */}
          <motion.div 
            className="grid grid-cols-2 md:grid-cols-3 gap-6 mt-16 max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div className="text-center p-6 bg-zinc-900/50 backdrop-blur border border-zinc-800 rounded-2xl">
              <p className="text-gold text-3xl md:text-4xl font-bold" style={{ fontFamily: "Poppins, sans-serif" }}>10+</p>
              <p className="text-zinc-500 text-sm mt-1">AI Tools</p>
            </div>
            <div className="text-center p-6 bg-zinc-900/50 backdrop-blur border border-zinc-800 rounded-2xl">
              <p className="text-gold text-3xl md:text-4xl font-bold" style={{ fontFamily: "Poppins, sans-serif" }}>AI</p>
              <p className="text-zinc-500 text-sm mt-1">Powered</p>
            </div>
            <div className="text-center p-6 bg-zinc-900/50 backdrop-blur border border-zinc-800 rounded-2xl col-span-2 md:col-span-1">
              <p className="text-gold text-3xl md:text-4xl font-bold" style={{ fontFamily: "Poppins, sans-serif" }}>Free</p>
              <p className="text-zinc-500 text-sm mt-1">Resources</p>
            </div>
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
                <span className="text-zinc-700 text-xs font-semibold uppercase tracking-wider">Financial Planning</span>
              </span>
              <h3 className="text-zinc-900 text-3xl md:text-4xl font-bold" style={{ fontFamily: "Poppins, sans-serif" }}>
                Mortgage <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold via-[#C4A962] to-gold">Calculator</span>
              </h3>
              <p className="text-zinc-600 mt-3 max-w-lg mx-auto">
                Estimate your monthly payments and plan your investment with precision
              </p>
            </motion.div>
            <div className="relative z-10">
              <MortgageCalculator compact />
            </div>
          </div>
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
              className="bg-gold hover:bg-gold-light text-black font-semibold px-8 py-6 text-base shadow-lg shadow-gold/20 transition-all duration-300 hover:shadow-xl hover:shadow-gold/30 hover:scale-105"
              onClick={() => setIsInquiryOpen(true)}
            >
              {t('home.cta.contact')}
              <ArrowUpRight className="w-5 h-5 ml-2 -mr-1" />
            </Button>
            <Link to="/properties">
              <Button 
                className="bg-white/10 backdrop-blur-md border border-white/30 text-white hover:bg-white/20 hover:border-white/50 hover:shadow-lg hover:shadow-white/10 hover:scale-105 px-8 py-6 text-base transition-all duration-300"
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
