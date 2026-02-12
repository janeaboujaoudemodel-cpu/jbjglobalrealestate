import { useState, lazy, Suspense, memo } from "react";
import DeveloperPartnersMarquee from "@/components/DeveloperPartnersMarquee";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
// Footer removed - handled by MainLayout
import StatsCounter from "@/components/StatsCounter";
import InquiryFormModal from "@/components/InquiryFormModal";
import BestIdeaAward from "@/components/BestIdeaAward";
import SupportTicketBox from "@/components/SupportTicketBox";
import ExploreServicesCard from "@/components/home/ExploreServicesCard";
import { ToolkitShowcaseCard } from "@/components/home/ToolkitShowcaseCard";

// Master Blueprint Components - Lazy load below-fold heavy sections
import TrustBar from "@/components/home/TrustBar";
import FeaturedListings from "@/components/home/FeaturedListings";
import ServicesGrid from "@/components/home/ServicesGrid";
import WhyChooseUs from "@/components/home/WhyChooseUs";
import AreasWeCover from "@/components/home/AreasWeCover";
import HeroSearchBar from "@/components/home/HeroSearchBar";

// Lazy load heavier below-fold sections for performance
const WhyDubaiCapitalSection = lazy(() => import("@/components/home/WhyDubaiCapitalSection"));
const TestimonialsSection = lazy(() => import("@/components/home/TestimonialsSection"));
const AIComparisonWidget = lazy(() => import("@/components/AIComparisonWidget"));
const MarketReportCTA = lazy(() => import("@/components/MarketReportCTA"));
const MortgageCalculator = lazy(() => import("@/components/MortgageCalculator"));
const BrokerOnboardingBanner = lazy(() => import("@/components/BrokerOnboardingBanner"));
const JBJPodcastSection = lazy(() => import("@/components/home/JBJPodcastSection"));

import { PodcastVisibilityGate } from "@/components/home/PodcastVisibilityGate";
import { SectionDivider } from "@/components/ui/section-divider";

import { SEOHead, pagesSEO } from "@/components/SEOHead";
import { useLanguage } from "@/contexts/LanguageContext";
import { useUserRole } from "@/hooks/useUserRole";
import { Sparkles, ArrowUpRight, ArrowRight, ChevronDown, User, Scale, Layers, Calculator, FileText, Heart, BarChart3, Wrench, Ruler, Palette, Calendar, Wallet, ShoppingBag, Brain, GraduationCap, Briefcase, Target, Award, PenTool, Users, Table2, Video, Home, Key, Globe, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PremiumHeroButton } from "@/components/ui/premium-hero-button";

import luxuryVillaHero from "@/assets/luxury-villa-hero.jpeg";
import jbjFullLogoLight from "@/assets/jbj-fulllogo-light.png";
import { CONTACT_INFO } from "@/constants/stats";

// Lazy loading fallback component
const SectionLoader = () => (
  <div className="py-12 flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
  </div>
);

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
      {isBroker && (
        <Suspense fallback={<SectionLoader />}>
          <BrokerOnboardingBanner />
        </Suspense>
      )}
      
      {/* HERO SECTION - LUXURY CINEMATIC VIDEO - MUST BE 100vh */}
      <div className="jj-hero-fullscreen relative flex items-center justify-center overflow-hidden">
        {/* Video Background - Luxury Dubai Drone Footage - Optimized for performance */}
        <div className="absolute inset-0">
          {/* Fallback image - always visible as base layer for instant load */}
          <img 
            src={luxuryVillaHero} 
            alt="Luxury Dubai Real Estate" 
            className="absolute inset-0 w-full h-full object-cover"
            loading="eager"
            fetchPriority="high"
          />
          {/* Video overlays the image when it loads/plays - deferred for performance */}
          <video 
            ref={(el) => {
              if (el && !el.dataset.deferred) {
                el.dataset.deferred = 'true';
                // Defer video loading to prioritize initial page render
                setTimeout(() => {
                  el.preload = 'auto';
                  el.src = '/videos/hero-video.mp4';
                  el.load();
                }, 2000);
              }
            }}
            autoPlay 
            loop 
            muted 
            playsInline
            preload="metadata"
            poster={luxuryVillaHero}
            webkit-playsinline="true"
            x-webkit-airplay="allow"
            className="absolute inset-0 w-full h-full object-cover z-[1]"
            style={{ 
              WebkitTransform: 'translateZ(0)',
              backfaceVisibility: 'hidden',
              opacity: 0,
              transition: 'opacity 0.5s ease-in-out',
            }}
            onCanPlay={(e) => {
              // Fade in video when ready to play
              e.currentTarget.style.opacity = '1';
            }}
            onError={(e) => {
              // Hide video on error, fallback image already visible
              e.currentTarget.style.display = 'none';
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
          <div className="max-w-4xl pt-56 sm:pt-40 md:pt-48 lg:pt-56">
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

      {/* TRUST BAR (4 Cards) - Flows directly from Developer Partners */}
      <div id="trust-bar" className="bg-black py-16 md:py-20">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-4 mb-8 md:mb-10">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gold/25 to-gold/40" />
            <span className="text-gold/60 text-[10px] uppercase tracking-[0.2em] font-medium">{t('home.trustBar.trustedByThousands', 'Trusted By Thousands')}</span>
            <div className="flex-1 h-px bg-gradient-to-l from-transparent via-gold/25 to-gold/40" />
          </div>
        </div>
        <TrustBar />
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center gap-4 mt-8 md:mt-10">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-gold/25 to-gold/40" />
            <span className="text-gold/60 text-[10px] uppercase tracking-[0.2em] font-medium">{t('home.trustBar.excellenceGuaranteed', 'Excellence Guaranteed')}</span>
            <div className="flex-1 h-px bg-gradient-to-l from-transparent via-gold/25 to-gold/40" />
          </div>
        </div>
      </div>

      {/* FEATURED LISTINGS - Master Blueprint: Section 3 (8 cards, Buy/Rent tabs) */}
      <FeaturedListings />

      {/* DIVIDER */}
      <SectionDivider />

      {/* FIND YOUR STARTING POINT - Clear Entry Points with Champagne Layer - ALL 11 CARDS RESTORED */}
      <section className="pb-12 md:pb-16 bg-black">
        <div className="jj-layer-2">
          <div className="text-center mb-6 md:mb-10">
            <span className="inline-flex items-center gap-1.5 md:gap-2 px-3 md:px-5 py-1.5 md:py-2 bg-gradient-to-r from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border-2 border-gold rounded-full text-[10px] md:text-xs uppercase tracking-[0.15em] md:tracking-[0.2em] font-semibold shadow-md">
              <Users className="w-3 h-3 md:w-3.5 md:h-3.5 text-gold" />
              <span className="text-black">{t('hero.findStartingPoint')}</span>
            </span>
          </div>

          {/* Audience Entry Cards - Full set with 11 cards */}
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-11 gap-2.5 md:gap-3 w-full mb-6 md:mb-10">
            {[
              { to: "/buyer-guide", icon: Heart, label: t('hero.buyers') },
              { to: "/seller-guide", icon: Target, label: t('hero.sellers') },
              { to: "/rent-guide", icon: Key, label: t('hero.rentals') },
              { to: "/landlord-guide", icon: Home, label: t('hero.landlords', 'Landlords') },
              { to: "/tenant-guide", icon: User, label: t('hero.tenants', 'Tenants') },
              { to: "/ai-hub", icon: Layers, label: t('hero.investors') },
              { to: "/quiz", icon: Users, label: t('hero.visitors') },
              { to: "/partners", icon: Briefcase, label: t('hero.partners', 'Partners') },
              { to: "/guides/golden-visa-uae", icon: Globe, label: t('hero.goldenVisa', 'Golden Visa') },
              { to: "/referral", icon: Award, label: t('hero.referral') },
              { to: "/join", icon: GraduationCap, label: t('hero.careers') },
            ].map((card) => (
              <Link key={card.to} to={card.to} className="group">
                <div className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/30 hover:border-gold rounded-xl p-3 md:p-4 text-center hover:shadow-[0_8px_30px_rgba(200,167,102,0.4)] hover:-translate-y-1 shadow-[0_4px_16px_rgba(200,167,102,0.2)] transition-all duration-300 aspect-square flex items-center justify-center">
                  <div className="flex flex-col items-center gap-1.5 md:gap-2">
                    <div className="w-9 h-9 md:w-10 md:h-10 bg-black rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-md">
                      <card.icon className="w-4 h-4 md:w-5 md:h-5 text-gold" />
                    </div>
                    <h4 className="text-black group-hover:text-gold text-[10px] md:text-xs font-bold transition-colors leading-tight tracking-wide">{card.label}</h4>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* ROW 2: Action Cards with Subtitles (7 cards) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2.5 md:gap-3 w-full mb-6 md:mb-10">
            {[
              { to: "/properties", icon: Home, title: t('hero.exploreProperties'), sub: t('hero.browseListings') },
              { to: "/list-property", icon: FileText, title: t('hero.listYourProperty'), sub: t('hero.sellOrRent') },
              { to: "/market-report", icon: BarChart3, title: t('hero.marketReport'), sub: t('hero.latestInsights') },
              { to: "/ai-hub", icon: Layers, title: t('hero.investorHub'), sub: t('hero.aiTools') },
              { to: "/partners/legal", icon: Scale, title: t('hero.legalPartners'), sub: t('hero.legalServices') },
              { to: "/partners/mortgage", icon: Calculator, title: t('hero.mortgagePartners'), sub: t('hero.financingOptions') },
              { to: "/services/design-build", icon: Palette, title: t('hero.designBuild'), sub: t('hero.constructionFitout') },
            ].map((card) => (
              <Link key={card.to} to={card.to} className="group">
                <div className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/30 hover:border-gold rounded-xl p-3 md:p-4 text-center hover:shadow-[0_8px_30px_rgba(200,167,102,0.4)] hover:-translate-y-1 shadow-[0_4px_16px_rgba(200,167,102,0.2)] transition-all duration-300 h-full flex items-center justify-center min-h-[100px] md:min-h-[120px]">
                  <div className="flex flex-col items-center gap-1.5 md:gap-2">
                    <div className="w-10 h-10 md:w-11 md:h-11 bg-black rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-md">
                      <card.icon className="w-5 h-5 text-gold" />
                    </div>
                    <div>
                      <h4 className="text-black group-hover:text-gold text-[11px] md:text-xs font-bold transition-colors leading-tight">{card.title}</h4>
                      <p className="text-black/50 text-[9px] md:text-[10px] mt-0.5 font-medium">{card.sub}</p>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* ROW 3: Large Feature Cards (2 cards) - Premium Hub Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 w-full">
            {/* JBJ Broker Hub */}
            <Link to="/broker-toolkit" className="group">
              <div className="bg-gradient-to-r from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border-2 border-gold/60 rounded-xl p-6 md:p-8 hover:border-gold hover:shadow-[0_0_50px_rgba(200,167,102,0.6),0_25px_60px_rgba(0,0,0,0.4)] hover:-translate-y-2 shadow-[0_12px_40px_rgba(200,167,102,0.4),0_6px_20px_rgba(0,0,0,0.25)] transition-all duration-300 relative overflow-hidden h-full">
                {/* Premium glow effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-gold/10 via-transparent to-gold/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-start gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-gold/20 to-gold/10 border-2 border-gold/40 rounded-xl flex items-center justify-center flex-shrink-0 shadow-[0_4px_12px_rgba(200,167,102,0.3)]">
                    <Building2 className="w-8 h-8 text-gold" strokeWidth={1.5} />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-black group-hover:text-gold text-lg md:text-xl font-bold transition-colors leading-tight mb-1">{t('hero.jbjBrokerHub')}</h4>
                    <p className="text-gold font-semibold text-sm mb-2">{t('hero.professionalTools')}</p>
                    <p className="text-black/70 text-sm leading-relaxed mb-4">{t('hero.brokerHubDesc', 'Access AI-powered broker tools, training modules, CRM, and marketing resources.')}</p>
                    <Button variant="primary" size="sm" className="group-hover:shadow-[0_0_20px_rgba(200,167,102,0.5)] transition-all">
                      {t('hero.accessBrokerHub')}
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                </div>
              </div>
            </Link>

            {/* JBJ Investor Hub */}
            <Link to="/ai-hub" className="group">
              <div className="bg-gradient-to-r from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border-2 border-gold/60 rounded-xl p-6 md:p-8 hover:border-gold hover:shadow-[0_0_50px_rgba(200,167,102,0.6),0_25px_60px_rgba(0,0,0,0.4)] hover:-translate-y-2 shadow-[0_12px_40px_rgba(200,167,102,0.4),0_6px_20px_rgba(0,0,0,0.25)] transition-all duration-300 relative overflow-hidden h-full">
                {/* Premium glow effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-gold/10 via-transparent to-gold/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl" />
                <div className="relative z-10 flex flex-col md:flex-row md:items-start gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-gold/20 to-gold/10 border-2 border-gold/40 rounded-xl flex items-center justify-center flex-shrink-0 shadow-[0_4px_12px_rgba(200,167,102,0.3)]">
                    <Layers className="w-8 h-8 text-gold" strokeWidth={1.5} />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-black group-hover:text-gold text-lg md:text-xl font-bold transition-colors leading-tight mb-1">{t('hero.jbjInvestorHub')}</h4>
                    <p className="text-gold font-semibold text-sm mb-2">{t('hero.freeAiTools')}</p>
                    <p className="text-black/70 text-sm leading-relaxed mb-4">{t('hero.investorHubDesc', 'AI-powered property analysis, comparison, mortgage calculator, and productivity tools.')}</p>
                    <Button variant="primary" size="sm" className="group-hover:shadow-[0_0_20px_rgba(200,167,102,0.5)] transition-all">
                      {t('hero.exploreInvestorHub')}
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* EXPLORE OUR SERVICES SLIDESHOW - Wrapped in container for consistent sizing */}
      <section className="bg-black">
        <div className="jj-layer-2">
          <ExploreServicesCard />
        </div>
      </section>

      {/* DIVIDER - Between Explore Services and Toolkit Showcase */}
      <SectionDivider />

      {/* TOOLKIT SHOWCASE CARD - Free Professional Tools */}
      <ToolkitShowcaseCard />

      {/* DIVIDER - Between Toolkit Showcase and AI Home Finder */}
      <SectionDivider />

      {/* AI HOME FINDER - Premium CTA Section - CENTERED vertically and horizontally */}
      <section className="bg-black flex items-center justify-center min-h-[300px]">
        <div className="container mx-auto px-4">
          <div className="flex justify-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center relative"
            >
              {/* Purple glow effect behind card */}
              <div className="absolute inset-0 -m-4 md:-m-6 rounded-3xl bg-purple-500/20 blur-2xl animate-pulse" />
              {/* White background card with purple border glow */}
              <div 
                className="relative z-10 bg-gradient-to-br from-zinc-900 via-black to-zinc-800 rounded-2xl px-8 md:px-12 py-6 md:py-8 border-2 border-purple-400/40"
                style={{
                  boxShadow: '0 0 40px rgba(147,51,234,0.3), 0 0 80px rgba(147,51,234,0.15), 0 20px 50px rgba(0,0,0,0.3)'
                }}
              >
                {/* Purple label badge */}
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-400 text-xs uppercase tracking-[0.2em] mb-4">
                  <Sparkles className="w-3 h-3" />
                  {t('home.aiPowered', 'AI-Powered')}
                </div>
                <Link to="/quiz" className="block group">
                  <div className="flex items-center justify-center gap-3 mb-2">
                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-br from-purple-500/20 to-purple-600/10 border-2 border-purple-400/40 flex items-center justify-center shadow-[0_0_25px_rgba(147,51,234,0.35)] group-hover:shadow-[0_0_40px_rgba(147,51,234,0.5)] transition-all">
                      <Sparkles className="w-6 h-6 md:w-7 md:h-7 text-purple-500 group-hover:text-purple-400 transition-colors" strokeWidth={1.5} />
                    </div>
                    <h2 
                      className="text-2xl md:text-4xl lg:text-5xl font-bold tracking-wide text-purple-500 group-hover:text-purple-400 transition-colors" 
                      style={{ fontFamily: "Poppins, sans-serif" }}
                    >
                      {t('hero.aiFinder')}
                    </h2>
                    <ArrowUpRight className="w-6 h-6 md:w-8 md:h-8 text-purple-500 group-hover:text-purple-400 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-300" />
                  </div>
                  <p className="text-zinc-300 text-sm md:text-base max-w-lg mx-auto">
                    {t('hero.aiFinderDesc')}
                  </p>
                  <p className="text-zinc-500 text-xs mt-3">
                    {t('home.poweredByJBJ', 'Powered by JBJ Global Real Estate')}
                  </p>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* DIVIDER - Between AI Home Finder and AI Comparison */}
      <SectionDivider />

      {/* AI COMPARISON & ANALYZER PREVIEW */}
      <section className="bg-black">
        <div className="jj-layer-2">
          <Suspense fallback={<SectionLoader />}>
            <AIComparisonWidget />
          </Suspense>
        </div>
      </section>

      {/* DIVIDER */}
      <SectionDivider />

      {/* MARKET REPORT CTA - Active Champagne Layer */}
      <section className="bg-black">
        <div className="jj-layer-2">
          <div className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border border-gold/40 md:border-2 rounded-xl md:rounded-3xl p-4 md:p-10 shadow-xl">
            <motion.div
              className="text-center mb-4 md:mb-8"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <span className="inline-block text-gold text-[10px] md:text-xs uppercase tracking-[0.2em] md:tracking-[0.3em] mb-2 md:mb-3">{t('home.exclusivePublication', 'Exclusive Publication')}</span>
              <h2 className="text-black text-xl md:text-3xl font-bold" style={{ fontFamily: "Poppins, sans-serif" }}>
                {t('home.freeMarket', 'Free Market')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold to-gold-light">{t('home.intelligenceBook', 'Intelligence Book')}</span>
              </h2>
            </motion.div>
            <Suspense fallback={<SectionLoader />}>
              <MarketReportCTA />
            </Suspense>
          </div>
        </div>
      </section>

      {/* DIVIDER */}
      <SectionDivider />

      {/* MORTGAGE CALCULATOR SECTION - Compact on mobile */}
      <section className="bg-black">
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
                <span className="text-black text-xs font-semibold uppercase tracking-wider">Financial Tools</span>
              </span>
              <h3 className="text-zinc-900 text-3xl md:text-4xl font-bold" style={{ fontFamily: "Poppins, sans-serif" }}>
                {t('mortgage.title', 'Mortgage')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold via-[#C4A962] to-gold">{t('mortgage.calculator', 'Calculator')}</span>
              </h3>
              <p className="text-zinc-600 mt-3 max-w-lg mx-auto">
                Estimate your monthly payments and explore financing options.
              </p>
            </motion.div>
            <div className="relative z-10">
              <Suspense fallback={<SectionLoader />}>
                <MortgageCalculator compact />
              </Suspense>
              <p className="text-zinc-500 text-xs text-center mt-4">
                Estimates only. We connect you with independent licensed mortgage advisors for personalized guidance.
              </p>
              
              {/* Dual Buttons with 3D Premium Styling */}
              <div className="flex flex-col sm:flex-row gap-4 mt-8 justify-center">
                {/* Primary 3D Button - Try Our AI Mortgage Calculator */}
                <Link to="/mortgage-calculator">
                  <Button variant="primary" size="lg" className="gap-2 px-8 py-5 text-base group">
                    <Sparkles className="w-5 h-5 text-gold group-hover:text-black transition-colors" />
                    <span className="whitespace-nowrap"><span className="text-black group-hover:text-gold transition-colors">{t('home.tryOurAi', 'Try Our AI')} </span><span className="text-gold group-hover:text-black transition-colors">{t('mortgage.calculator', 'Mortgage Calculator')}</span></span>
                    <ArrowUpRight className="w-5 h-5 text-black group-hover:text-gold transition-colors" />
                  </Button>
                </Link>
                
                {/* Secondary Button - Connect With Mortgage Partners */}
                <Link to="/partners/mortgage">
                  <Button variant="secondary" size="lg" className="gap-2 px-8 py-5 text-base group">
                    <Users className="w-5 h-5 text-gold" />
                    <span>{t('home.connectMortgagePartners', 'Connect With Mortgage Partners')}</span>
                    <ArrowUpRight className="w-5 h-5" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DIVIDER - Before Why Dubai (fullWidth to match edge-to-edge section) */}
      <SectionDivider fullWidth />

      <Suspense fallback={<SectionLoader />}>
        <WhyDubaiCapitalSection />
      </Suspense>

      {/* Spacer before divider - creates visual centering between Why Dubai and Podcast */}

      {/* JBJ PODCAST SECTION - Admin-controlled visibility */}
      <PodcastVisibilityGate>
        <SectionDivider fullWidth />
        <Suspense fallback={<SectionLoader />}>
          <JBJPodcastSection />
        </Suspense>
      </PodcastVisibilityGate>

      {/* DIVIDER - Before Best Idea Award (always needed) */}
      <SectionDivider />



      {/* BEST IDEA AWARD */}
      <BestIdeaAward />

      {/* DIVIDER */}
      <SectionDivider />

      {/* WHY CHOOSE US - Master Blueprint: Section 5 */}
      <WhyChooseUs />

      {/* DIVIDER */}
      <SectionDivider />

      {/* AREAS WE COVER - Master Blueprint: Section 6 (12 area links) */}
      <AreasWeCover />

      {/* DIVIDER */}
      <SectionDivider />

      {/* TESTIMONIALS - Master Blueprint: Section 7 (3 testimonials) */}
      <Suspense fallback={<SectionLoader />}>
        <TestimonialsSection />
      </Suspense>

      {/* DIVIDER */}
      <SectionDivider />

      {/* Stats Counter Section */}
      <StatsCounter />

      {/* DIVIDER */}
      <SectionDivider />

      {/* SUPPORT TICKET BOX - Always visible (last content before global CTA) */}
      <SupportTicketBox />

      {/* Inquiry Modal */}
      <InquiryFormModal 
        isOpen={isInquiryOpen} 
        onClose={() => setIsInquiryOpen(false)} 
      />
    </section>
  );
};

export default Index;