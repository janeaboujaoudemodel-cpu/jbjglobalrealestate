import { useState, lazy, Suspense, memo, useEffect, forwardRef } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import HeroSearchBar from "@/components/home/HeroSearchBar";

import { SEOHead, pagesSEO } from "@/components/SEOHead";
import { useLanguage } from "@/contexts/LanguageContext";
import { useUserRole } from "@/hooks/useUserRole";
import { Sparkles, ArrowUpRight, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PremiumHeroButton } from "@/components/ui/premium-hero-button";

import luxuryVillaHero from "@/assets/luxury-villa-hero.jpeg";
import jbjFullLogoLight from "@/assets/jbj-fulllogo-light.png";
import { CONTACT_INFO } from "@/constants/stats";

// Chunk imports — stored so we can preload them all after hero renders
const chunkImports = {
  DeveloperPartnersMarquee: () => import("@/components/DeveloperPartnersMarquee"),
  StatsCounter: () => import("@/components/StatsCounter"),
  InquiryFormModal: () => import("@/components/InquiryFormModal"),
  BestIdeaAward: () => import("@/components/BestIdeaAward"),
  SupportTicketBox: () => import("@/components/SupportTicketBox"),
  ExploreServicesCard: () => import("@/components/home/ExploreServicesCard"),
  ToolkitShowcaseCard: () => import("@/components/home/ToolkitShowcaseCard").then(m => ({ default: m.ToolkitShowcaseCard })),
  StartingPointSection: () => import("@/components/home/StartingPointSection"),
  OverseasInvestorsBanner: () => import("@/components/home/OverseasInvestorsBanner"),
  TrustBar: () => import("@/components/home/TrustBar"),
  FeaturedListings: () => import("@/components/home/FeaturedListings"),
  ServicesGrid: () => import("@/components/home/ServicesGrid"),
  WhyChooseUs: () => import("@/components/home/WhyChooseUs"),
  AreasWeCover: () => import("@/components/home/AreasWeCover"),
  ContinueSearching: () => import("@/components/ContinueSearching"),
  HomepageBookMarquee: () => import("@/components/home/HomepageBookMarquee"),
  WhyDubaiCapitalSection: () => import("@/components/home/WhyDubaiCapitalSection"),
  TestimonialsSection: () => import("@/components/home/TestimonialsSection"),
  AIComparisonWidget: () => import("@/components/AIComparisonWidget"),
  MarketReportCTA: () => import("@/components/MarketReportCTA"),
  MortgageCalculator: () => import("@/components/MortgageCalculator"),
  BrokerOnboardingBanner: () => import("@/components/BrokerOnboardingBanner"),
  JBJPodcastSection: () => import("@/components/home/JBJPodcastSection"),
  ResalePropertiesSection: () => import("@/components/home/ResalePropertiesSection"),
};

// Lazy components using the same import functions
const DeveloperPartnersMarquee = lazy(chunkImports.DeveloperPartnersMarquee);
const StatsCounter = lazy(chunkImports.StatsCounter);
const InquiryFormModal = lazy(chunkImports.InquiryFormModal);
const BestIdeaAward = lazy(chunkImports.BestIdeaAward);
const SupportTicketBox = lazy(chunkImports.SupportTicketBox);
const ExploreServicesCard = lazy(chunkImports.ExploreServicesCard);
const ToolkitShowcaseCard = lazy(chunkImports.ToolkitShowcaseCard);
const StartingPointSection = lazy(chunkImports.StartingPointSection);
const OverseasInvestorsBanner = lazy(chunkImports.OverseasInvestorsBanner);
const TrustBar = lazy(chunkImports.TrustBar);
const FeaturedListings = lazy(chunkImports.FeaturedListings);
const ServicesGrid = lazy(chunkImports.ServicesGrid);
const WhyChooseUs = lazy(chunkImports.WhyChooseUs);
const AreasWeCover = lazy(chunkImports.AreasWeCover);
const ContinueSearching = lazy(chunkImports.ContinueSearching);
const HomepageBookMarquee = lazy(chunkImports.HomepageBookMarquee);
const WhyDubaiCapitalSection = lazy(chunkImports.WhyDubaiCapitalSection);
const TestimonialsSection = lazy(chunkImports.TestimonialsSection);
const AIComparisonWidget = lazy(chunkImports.AIComparisonWidget);
const MarketReportCTA = lazy(chunkImports.MarketReportCTA);
const MortgageCalculator = lazy(chunkImports.MortgageCalculator);
const BrokerOnboardingBanner = lazy(chunkImports.BrokerOnboardingBanner);
const JBJPodcastSection = lazy(chunkImports.JBJPodcastSection);
const ResalePropertiesSection = lazy(chunkImports.ResalePropertiesSection);

import { PodcastVisibilityGate } from "@/components/home/PodcastVisibilityGate";
import { SectionDivider } from "@/components/ui/section-divider";

const SectionLoader = forwardRef<HTMLDivElement>((_, ref) => (
  <div ref={ref} className="py-12 flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
  </div>
));
SectionLoader.displayName = "SectionLoader";

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

  // Preload only near-the-fold chunks during idle time (avoid loading every section at once)
  useEffect(() => {
    const preloadNearFold = () => {
      [
        chunkImports.DeveloperPartnersMarquee,
        chunkImports.TrustBar,
        chunkImports.FeaturedListings,
        chunkImports.StartingPointSection,
      ].forEach((importFn) => {
        void importFn();
      });
    };

    if (typeof window !== "undefined" && "requestIdleCallback" in window) {
      const idleId = (window as Window & { requestIdleCallback: (cb: () => void, options?: { timeout: number }) => number }).requestIdleCallback(
        preloadNearFold,
        { timeout: 1800 }
      );
      return () => {
        (window as Window & { cancelIdleCallback?: (id: number) => void }).cancelIdleCallback?.(idleId);
      };
    }

    const timer = globalThis.setTimeout(preloadNearFold, 1200);
    return () => globalThis.clearTimeout(timer);
  }, []);

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
      <div className="jj-hero-fullscreen relative flex items-center justify-center overflow-hidden bg-black">
        {/* Video Background - Luxury Dubai Drone Footage - Optimized for performance */}
        <div className="absolute inset-0 bg-black">
          {/* Fallback image - always visible as base layer for instant load */}
          <img 
            src={luxuryVillaHero} 
            alt="Luxury Dubai Real Estate" 
            className="absolute inset-0 w-full h-full object-cover"
            loading="eager"
            fetchPriority="high"
            decoding="async"
          />
          {/* Video overlays the image when it loads/plays - deferred loading */}
          <video 
            autoPlay 
            loop 
            muted 
            playsInline
            preload="none"
            poster={luxuryVillaHero}
            webkit-playsinline="true"
            x-webkit-airplay="allow"
            className="absolute inset-0 w-full h-full object-cover z-[1]"
            style={{ 
              WebkitTransform: 'translateZ(0)',
              backfaceVisibility: 'hidden',
              opacity: 0,
              transition: 'opacity 0.8s ease-in-out',
            }}
            onCanPlay={(e) => {
              e.currentTarget.style.opacity = '1';
            }}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
            src="https://mdafrewypkkrildjgtey.supabase.co/storage/v1/object/public/videos/hero-video.mp4"
          />
          {/* Video overlay gradient - above video */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/20 to-black/60 z-[2]" />
          {/* Additional cinematic vignette */}
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
          <div className="w-full max-w-4xl pt-[45vh] sm:pt-[38vh] md:pt-[40vh] lg:pt-[42vh]">
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
          </div>

          {/* SEARCH BAR - stretched to the right edge space */}
          <motion.div 
            variants={fadeInUp}
            className="w-full max-w-[1380px] pr-0 md:pr-6 lg:pr-10"
          >
            <HeroSearchBar />
          </motion.div>
        </motion.div>
      </div>


      {/* DEVELOPER PARTNERS MARQUEE - MOVED UP: Directly under hero */}
      <div id="developer-partners">
        <Suspense fallback={<SectionLoader />}>
          <DeveloperPartnersMarquee />
        </Suspense>
      </div>

      {/* DIVIDER between Developer Partners and Trust Bar */}
      <SectionDivider />

      {/* TRUST BAR (8 Cards) - 4x2 Grid */}
      <div id="trust-bar" className="bg-black py-12 md:py-16">
        <Suspense fallback={<SectionLoader />}>
          <TrustBar />
        </Suspense>
      </div>

      <SectionDivider />

      {/* FEATURED LISTINGS - Master Blueprint: Section 3 (8 cards, Buy/Rent tabs) */}
      <Suspense fallback={<SectionLoader />}>
        <FeaturedListings />
      </Suspense>

      {/* CONTINUE SEARCHING - Recently viewed properties (primary focus for sales) */}
      <Suspense fallback={<SectionLoader />}>
        <ContinueSearching type="property" className="bg-black" />
      </Suspense>

      {/* RESALE PROPERTIES - Investor Network Listings */}
      <SectionDivider />
      <Suspense fallback={<SectionLoader />}>
        <ResalePropertiesSection />
      </Suspense>

      {/* DIVIDER */}
      <SectionDivider />

      {/* FIND YOUR STARTING POINT - Tabbed Premium Section */}
      <Suspense fallback={<SectionLoader />}>
        <StartingPointSection />
      </Suspense>

      <SectionDivider />

      {/* OVERSEAS INVESTORS - Golden Visa & International Investment */}
      <Suspense fallback={<SectionLoader />}>
        <OverseasInvestorsBanner />
      </Suspense>

      <SectionDivider />

      {/* EXPLORE OUR GUIDES & REPORTS - Walking Books Marquee */}
      <Suspense fallback={<SectionLoader />}>
        <HomepageBookMarquee />
      </Suspense>

      <SectionDivider />

      {/* EXPLORE OUR SERVICES SLIDESHOW - Wrapped in container for consistent sizing */}
      <section className="bg-black">
        <div className="jj-layer-2">
          <Suspense fallback={<SectionLoader />}>
            <ExploreServicesCard />
          </Suspense>
        </div>
      </section>

      {/* DIVIDER - Between Explore Services and Toolkit Showcase */}
      <SectionDivider />

      {/* TOOLKIT SHOWCASE CARD - Free Professional Tools */}
      <Suspense fallback={<SectionLoader />}>
        <ToolkitShowcaseCard />
      </Suspense>

      {/* AI HOME FINDER - Premium CTA Section - No dividers */}
      <section className="bg-black flex items-center justify-center min-h-[340px] relative overflow-hidden">
        {/* Premium ambient background effects */}
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-600/8 rounded-full blur-[120px]" />
          <div className="absolute top-0 left-0 w-[300px] h-[300px] bg-gold/5 rounded-full blur-[80px]" />
          <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-purple-500/5 rounded-full blur-[80px]" />
          {/* Subtle grid pattern */}
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(147,51,234,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(147,51,234,0.3) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex justify-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-center relative"
            >
              {/* Premium multi-layer glow */}
              <div className="absolute inset-0 -m-6 md:-m-8 rounded-3xl bg-purple-500/15 blur-3xl" />
              <div className="absolute inset-0 -m-3 md:-m-4 rounded-3xl bg-purple-400/10 blur-xl" />
              
              {/* Card with premium glassmorphism */}
              <div 
                className="relative z-10 bg-gradient-to-br from-zinc-900/95 via-black/95 to-zinc-800/95 backdrop-blur-xl rounded-2xl px-8 md:px-14 py-8 md:py-10 border border-purple-400/30"
                style={{
                  boxShadow: '0 0 50px rgba(147,51,234,0.25), 0 0 100px rgba(147,51,234,0.1), 0 25px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(147,51,234,0.15)'
                }}
              >
                {/* Top shine line */}
                <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-purple-400/50 to-transparent" />
                
                {/* Purple label badge */}
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/15 border border-purple-400/25 text-purple-400 text-xs uppercase tracking-[0.2em] mb-5">
                  <Sparkles className="w-3 h-3" />
                  {t('home.aiPowered', 'AI-Powered')}
                </div>
                <Link to="/quiz" className="block group">
                  <div className="flex items-center justify-center gap-3 mb-3">
                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-br from-purple-500/20 to-purple-600/10 border border-purple-400/30 flex items-center justify-center shadow-[0_0_30px_rgba(147,51,234,0.3)] group-hover:shadow-[0_0_50px_rgba(147,51,234,0.5)] transition-all duration-500">
                      <Sparkles className="w-6 h-6 md:w-7 md:h-7 text-purple-400 group-hover:text-purple-300 transition-colors" strokeWidth={1.5} />
                    </div>
                    <h2 
                      className="text-2xl md:text-4xl lg:text-5xl font-bold tracking-wide bg-gradient-to-r from-purple-400 via-purple-300 to-purple-500 bg-clip-text text-transparent group-hover:from-purple-300 group-hover:to-purple-400 transition-all duration-500" 
                      style={{ fontFamily: "Poppins, sans-serif" }}
                    >
                      {t('hero.aiFinder')}
                    </h2>
                    <ArrowUpRight className="w-6 h-6 md:w-8 md:h-8 text-purple-400 group-hover:text-purple-300 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-300" />
                  </div>
                  <p className="text-zinc-400 text-sm md:text-base max-w-lg mx-auto">
                    {t('hero.aiFinderDesc')}
                  </p>
                  <p className="text-zinc-600 text-xs mt-3">
                    {t('home.poweredByJBJ', 'Powered by JBJ Global Real Estate')}
                  </p>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>


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

      {/* MORTGAGE CALCULATOR SECTION */}
      <section className="bg-black">
        <div className="jj-layer-2">
          <div className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border border-gold/40 md:border-2 rounded-xl md:rounded-3xl p-4 md:p-12 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 md:w-64 h-32 md:h-64 bg-gold/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-24 md:w-48 h-24 md:h-48 bg-gold/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
            
            <div className="relative z-10">
              <Suspense fallback={<SectionLoader />}>
                <MortgageCalculator compact />
              </Suspense>
              <p className="text-zinc-500 text-xs text-center mt-4">
                Estimates only. We connect you with independent licensed mortgage advisors for personalized guidance.
              </p>
              
              {/* Dual Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 mt-8 justify-center">
                <Link to="/mortgage-calculator">
                  <Button variant="primary" size="lg" className="gap-2 px-8 py-5 text-base group">
                    <Sparkles className="w-5 h-5 text-gold group-hover:text-black transition-colors" />
                    <span className="whitespace-nowrap"><span className="text-black group-hover:text-gold transition-colors">{t('home.tryOurAi', 'Try Our AI')} </span><span className="text-gold group-hover:text-black transition-colors">{t('mortgage.calculator', 'Mortgage Calculator')}</span></span>
                    <ArrowUpRight className="w-5 h-5 text-black group-hover:text-gold transition-colors" />
                  </Button>
                </Link>
                
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
      <Suspense fallback={<SectionLoader />}>
        <BestIdeaAward />
      </Suspense>

      {/* DIVIDER */}
      <SectionDivider />

      {/* WHY CHOOSE US - Master Blueprint: Section 5 */}
      <Suspense fallback={<SectionLoader />}>
        <WhyChooseUs />
      </Suspense>

      <SectionDivider />

      {/* AREAS WE COVER - Master Blueprint: Section 6 (12 area links) */}
      <Suspense fallback={<SectionLoader />}>
        <AreasWeCover />
      </Suspense>

      {/* DIVIDER between Areas and Testimonials */}
      <SectionDivider />

      {/* TESTIMONIALS - Master Blueprint: Section 7 (3 testimonials) */}
      <Suspense fallback={<SectionLoader />}>
        <TestimonialsSection />
      </Suspense>

      {/* DIVIDER */}
      <SectionDivider />

      {/* Stats Counter Section */}
      <Suspense fallback={<SectionLoader />}>
        <StatsCounter />
      </Suspense>

      {/* DIVIDER */}
      <SectionDivider />

      {/* SUPPORT TICKET BOX - Always visible (last content before global CTA) */}
      <Suspense fallback={<SectionLoader />}>
        <SupportTicketBox />
      </Suspense>

      {/* Inquiry Modal */}
      <Suspense fallback={null}>
        <InquiryFormModal 
          isOpen={isInquiryOpen} 
          onClose={() => setIsInquiryOpen(false)} 
        />
      </Suspense>
    </section>
  );
};

export default Index;