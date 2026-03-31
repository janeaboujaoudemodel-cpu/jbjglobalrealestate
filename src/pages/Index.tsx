import { useState, lazy, Suspense, memo, useEffect, forwardRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

import { SEOHead, pagesSEO } from "@/components/SEOHead";
import { useLanguage } from "@/contexts/LanguageContext";
import { useUserRole } from "@/hooks/useUserRole";
import { Sparkles, ArrowUpRight, Users, Building2, Brain, Briefcase, Home, Palette, FileText, UserCircle, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PremiumHeroButton } from "@/components/ui/premium-hero-button";

import heroFallbackDubai from "@/assets/hero-fallback-dubai.jpg";
import jbjMonogramLightTransparent from "@/assets/jbj-monogram-light-transparent.png";
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
const DeveloperPortalCTA = lazy(() => import("@/components/home/DeveloperPortalCTA"));

import { PodcastVisibilityGate } from "@/components/home/PodcastVisibilityGate";
import { SectionDivider } from "@/components/ui/section-divider";

const VerificationBanner = lazy(() => import("@/components/verification/VerificationBanner"));

const SectionLoader = forwardRef<HTMLDivElement>((_, ref) => (
  <div ref={ref} className="py-12 flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
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

// Quick-action CTA pills for hero overlay
const heroActions = [
  { label: "Sell Your Property", icon: Building2, href: "/sell" },
  { label: "AI Home Finder", icon: Home, href: "/quiz" },
  { label: "Explore AI Tools", icon: Brain, href: "/ai-hub" },
  { label: "Create Your CV", icon: FileText, href: "/toolkit/cv-builder" },
  { label: "Update Profile", icon: UserCircle, href: "/profile" },
];

// Three pillars
const pillars = [
  { icon: Building2, title: "Premium Marketplace", desc: "2,400+ Off-Plan & Resale Properties" },
  { icon: Brain, title: "AI-Powered Tools", desc: "Smart Search & Investment Intelligence" },
  { icon: Briefcase, title: "Brokerage Services", desc: "Licensed Advisors & Expert Guides" },
];

const Index = () => {
  const [isInquiryOpen, setIsInquiryOpen] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const { t } = useLanguage();
  const { isBroker, hasSelectedRole } = useUserRole();

  // Preload only near-the-fold chunks during idle time
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
    <section className="relative w-full min-h-screen bg-gradient-to-br from-[hsl(32,28%,13%)] via-[hsl(33,27%,15%)] to-[hsl(33,28%,11%)]">
      {/* SEO Meta Tags */}
      <SEOHead {...pagesSEO.home} />
      
      {/* Broker Onboarding Banner - Only for brokers */}
      {isBroker && (
        <Suspense fallback={<SectionLoader />}>
          <BrokerOnboardingBanner />
        </Suspense>
      )}
      
      {/* ═══════════════════════════════════════════════════════════
          MERGED HERO: Video Background + Gateway Tagline + CTA Pills
          Single fullscreen section — no separate IntroHeroSection
         ═══════════════════════════════════════════════════════════ */}
      <div className="jj-hero-fullscreen relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-[hsl(32,28%,13%)] via-[hsl(33,27%,15%)] to-[hsl(33,28%,11%)]">
        {/* Video Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(32,28%,13%)] via-[hsl(33,27%,15%)] to-[hsl(33,28%,11%)]">
          {/* Branded fallback — renders instantly, unmounts after video loads */}
          {!videoLoaded && (
            <div 
              className="absolute inset-0 z-[1] flex flex-col items-center justify-center pointer-events-none"
            >
              {/* Gold accent orbs */}
              <div className="absolute top-1/4 left-10 w-64 h-64 bg-white/5 rounded-full blur-[100px]" />
              <div className="absolute bottom-1/3 right-10 w-80 h-80 bg-white/5 rounded-full blur-[120px]" />
              
              {/* Logo — transparent monogram, no background */}
              <img 
                src={jbjMonogramLightTransparent} 
                alt="JBJ Global Real Estate" 
                className="w-36 h-auto md:w-52 object-contain bg-transparent"
                style={{ 
                  filter: 'drop-shadow(0 0 32px rgba(200,167,102,0.4))',
                  animation: 'heroFallbackPulse 2.5s ease-in-out infinite',
                }}
              />
              
              {/* Tagline */}
              <p 
                className="mt-6 text-white/60 text-sm md:text-base tracking-[0.25em] uppercase text-center px-6"
              >
                Your Gateway to Dubai's Finest Real Estate
              </p>
              
              {/* Loading shimmer line */}
              <div className="mt-8 w-24 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" style={{ animation: 'heroFallbackShimmer 2s ease-in-out infinite' }} />
            </div>
          )}

          <video 
            autoPlay loop muted playsInline
            preload="none"
            poster={heroFallbackDubai}
            webkit-playsinline="true"
            x-webkit-airplay="allow"
            className="absolute inset-0 w-full h-full object-cover z-[2]"
            style={{ 
              WebkitTransform: 'translateZ(0)',
              backfaceVisibility: 'hidden',
              opacity: 0,
              transition: 'opacity 0.8s ease-in-out',
            }}
            onCanPlay={(e) => { e.currentTarget.style.opacity = '1'; setVideoLoaded(true); }}
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
            src="https://mdafrewypkkrildjgtey.supabase.co/storage/v1/object/public/videos/hero-video.mp4"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/70 z-[3]" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/40 z-[3]" />
          
          <style>{`
            @keyframes heroFallbackPulse {
              0%, 100% { filter: drop-shadow(0 0 24px rgba(200,167,102,0.3)); transform: scale(1); }
              50% { filter: drop-shadow(0 0 40px rgba(200,167,102,0.6)); transform: scale(1.02); }
            }
            @keyframes heroFallbackShimmer {
              0%, 100% { opacity: 0.3; transform: scaleX(0.6); }
              50% { opacity: 0.8; transform: scaleX(1.2); }
            }
          `}</style>
        </div>
        
        {/* Animated gold accent lines */}
        <motion.div 
          className="absolute left-0 top-1/3 w-48 md:w-96 h-px bg-gradient-to-r from-white/20 to-transparent"
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 1.5, delay: 0.5 }}
        />
        <motion.div 
          className="absolute right-0 bottom-1/3 w-48 md:w-96 h-px bg-gradient-to-l from-white/20 to-transparent"
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 1.5, delay: 0.7 }}
        />
        
        {/* MERGED HERO CONTENT — tagline + CTAs + pillars */}
        <motion.div 
          className="relative z-10 w-full flex flex-col items-center justify-center text-center px-4 sm:px-8 md:px-12 lg:px-16"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <div className="w-full max-w-5xl mx-auto text-center pt-[max(20vh,120px)] sm:pt-[22vh] md:pt-[24vh]">
            {/* Platform tagline badge */}
            <motion.p
              variants={fadeInUp}
              className="text-[10px] sm:text-xs uppercase tracking-[0.25em] text-white/60 mb-4"
            >
              Dubai's Trusted Real Estate Technology Platform
            </motion.p>

            {/* Main heading */}
            <motion.h1
              variants={fadeInUp}
              className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight leading-[1.1] mb-6"
              style={{
                background: "linear-gradient(135deg, #FFFFFF 0%, #E0E0E0 40%, #FFFFFF 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              Your Gateway to Dubai's
              <br className="hidden sm:block" />
              <span className="block sm:inline"> Finest Real Estate</span>
            </motion.h1>

            {/* Quick-action CTA pills */}
            <motion.div
              variants={fadeInUp}
              className="flex flex-wrap justify-center gap-2 sm:gap-3 mb-8"
            >
              {heroActions.map((action) => (
                <Link
                  key={action.label}
                  to={action.href}
                  className="group inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-full border border-white/30 bg-black/40 backdrop-blur-md text-white/90 text-[10px] sm:text-xs font-medium hover:bg-white/15 hover:border-white/50 hover:text-white transition-all duration-300"
                >
                  <action.icon className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-white/70 group-hover:text-white transition-colors" />
                  {action.label}
                </Link>
              ))}
            </motion.div>

            {/* Three pillar badges */}
            <motion.div
              variants={fadeInUp}
              className="grid grid-cols-3 gap-px max-w-3xl mx-auto mb-8 border border-white/20 overflow-hidden"
            >
              {pillars.map((pillar, i) => (
                <div
                  key={pillar.title}
                  className="bg-black/50 backdrop-blur-sm p-3 sm:p-4 text-center border-r last:border-r-0 border-white/15"
                >
                  <pillar.icon className="w-4 h-4 sm:w-5 sm:h-5 text-white/80 mx-auto mb-1.5" />
                  <h3 className="text-[10px] sm:text-xs font-semibold text-white mb-0.5">{pillar.title}</h3>
                  <p className="text-[8px] sm:text-[10px] text-white/60 leading-tight">{pillar.desc}</p>
                </div>
              ))}
            </motion.div>

            {/* Scroll indicator */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2, duration: 0.5 }}
              className="flex flex-col items-center gap-1"
            >
              <span className="text-[9px] uppercase tracking-[0.2em] text-white/60">Explore</span>
              <ChevronDown className="w-4 h-4 text-white/40 animate-bounce" />
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* DEVELOPER PARTNERS MARQUEE */}
      <div id="developer-partners">
        <Suspense fallback={<SectionLoader />}>
          <DeveloperPartnersMarquee />
        </Suspense>
      </div>

      {/* VERIFICATION BANNER - moved here after marquee */}
      <Suspense fallback={null}>
        <VerificationBanner />
      </Suspense>

      {/* DEVELOPER PORTAL CTA */}
      <div className="cv-auto">
        <Suspense fallback={<SectionLoader />}>
          <DeveloperPortalCTA />
        </Suspense>
      </div>

      {/* DIVIDER between Developer Partners and Trust Bar */}
      <SectionDivider fullWidth />

      {/* TRUST BAR (8 Cards) - 4x2 Grid */}
      <div id="trust-bar" className="py-12 md:py-16">
        <Suspense fallback={<SectionLoader />}>
          <TrustBar />
        </Suspense>
      </div>

      <SectionDivider fullWidth />

      {/* FEATURED LISTINGS */}
      <div className="cv-auto">
        <Suspense fallback={<SectionLoader />}>
          <FeaturedListings />
        </Suspense>
      </div>

      {/* CONTINUE SEARCHING */}
      <div className="cv-auto">
        <Suspense fallback={<SectionLoader />}>
          <ContinueSearching type="property" />
        </Suspense>
      </div>

      {/* RESALE PROPERTIES - single divider before Starting Point */}
      <div className="cv-auto">
        <Suspense fallback={<SectionLoader />}>
          <ResalePropertiesSection />
        </Suspense>
      </div>

      {/* DIVIDER — single divider (removed double) */}
      <SectionDivider fullWidth />

      {/* FIND YOUR STARTING POINT */}
      <div className="cv-auto">
        <Suspense fallback={<SectionLoader />}>
          <StartingPointSection />
        </Suspense>
      </div>

      <SectionDivider fullWidth />

      {/* OVERSEAS INVESTORS */}
      <div className="cv-auto">
        <Suspense fallback={<SectionLoader />}>
          <OverseasInvestorsBanner />
        </Suspense>
      </div>

      <SectionDivider fullWidth />

      {/* EXPLORE OUR GUIDES & REPORTS */}
      <div className="cv-auto">
        <Suspense fallback={<SectionLoader />}>
          <HomepageBookMarquee />
        </Suspense>
      </div>

      <SectionDivider fullWidth />

      {/* EXPLORE OUR SERVICES */}
      <section className="py-12 md:py-20">
        <div className="jj-layer-2">
          <Suspense fallback={<SectionLoader />}>
            <ExploreServicesCard />
          </Suspense>
        </div>
      </section>

      <SectionDivider fullWidth />

      {/* TOOLKIT SHOWCASE CARD */}
      <div className="cv-auto">
        <Suspense fallback={<SectionLoader />}>
          <ToolkitShowcaseCard />
        </Suspense>
      </div>

      <SectionDivider fullWidth />

      {/* AI HOME FINDER — Premium 3D Section */}
      <section className="flex items-center justify-center py-16 md:py-24 min-h-[340px] relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #1a0a2e 0%, #2d1052 50%, #130728 100%)' }}>
        {/* Purple glow orbs */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full blur-3xl pointer-events-none" style={{ background: 'rgba(139, 92, 246, 0.15)' }} />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full blur-3xl pointer-events-none" style={{ background: 'rgba(167, 139, 250, 0.1)' }} />
        <div className="container mx-auto px-4 relative z-10" style={{ perspective: '1200px' }}>
          <div className="flex justify-center">
            <motion.div
              initial={{ opacity: 0, y: 30, rotateX: 8, scale: 0.97 }}
              whileInView={{ opacity: 1, y: 0, rotateX: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              whileHover={{ y: -6, rotateX: -2, scale: 1.01 }}
              className="text-center relative max-w-2xl"
              style={{ transformStyle: 'preserve-3d' }}
            >
              <div className="relative z-10 rounded-2xl px-8 md:px-14 py-8 md:py-10 transition-all duration-300"
                style={{ 
                  transform: 'translateZ(20px)',
                  background: '#ffffff',
                  border: '1px solid #c4b5fd',
                  boxShadow: '0 10px 40px rgba(139, 92, 246, 0.2)',
                }}
              >
                {/* Label badge */}
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs uppercase tracking-[0.2em] mb-5 font-semibold" style={{ background: '#ede9fe', border: '1px solid #c4b5fd', color: '#6d28d9' }}>
                  <Sparkles className="w-3 h-3" style={{ color: '#7c3aed' }} />
                  {t('home.aiPowered', 'AI-Powered')}
                </div>
                <Link to="/quiz" className="block group">
                  <div className="flex items-center justify-center gap-3 mb-3">
                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center group-hover:opacity-90 transition-all duration-500" style={{ background: '#7c3aed', boxShadow: '0 8px 24px rgba(124, 58, 237, 0.35)' }}>
                      <Sparkles className="w-6 h-6 md:w-7 md:h-7" style={{ color: '#ffffff' }} strokeWidth={1.5} />
                    </div>
                    <h2 
                      className="text-2xl md:text-4xl lg:text-5xl font-bold tracking-wide"
                      style={{ color: '#4c1d95' }}
                    >
                      {t('hero.aiFinder')}
                    </h2>
                    <ArrowUpRight className="w-6 h-6 md:w-8 md:h-8 group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-300" style={{ color: '#7c3aed' }} />
                  </div>
                  <p className="text-sm md:text-base max-w-lg mx-auto" style={{ color: '#4b5563' }}>
                    {t('hero.aiFinderDesc')}
                  </p>
                  <p className="text-xs mt-3 font-medium" style={{ color: '#8b5cf6' }}>
                    {t('home.poweredByJBJ', 'Powered by JBJ Global Real Estate')}
                  </p>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <SectionDivider fullWidth />

      {/* AI COMPARISON & ANALYZER PREVIEW */}
      <section>
        <div className="jj-layer-2">
          <Suspense fallback={<SectionLoader />}>
            <AIComparisonWidget />
          </Suspense>
        </div>
      </section>

      <SectionDivider />

      <section className="py-12 md:py-16">
        <div className="jj-layer-2">
          <div className="bg-gray-50 border border-gray-200 rounded-xl md:rounded-3xl p-4 md:p-12 relative overflow-hidden">
            <div className="relative z-10">
              <Suspense fallback={<SectionLoader />}>
                <MortgageCalculator compact />
              </Suspense>
              <p className="text-gray-500 text-xs text-center mt-4">
                Estimates only. We connect you with independent licensed mortgage advisors for personalized guidance.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 mt-8 justify-center">
                <Link to="/mortgage-calculator">
                  <Button size="lg" className="gap-2 px-8 py-5 text-base bg-black text-white hover:bg-gray-800">
                    <Sparkles className="w-5 h-5" />
                    <span className="whitespace-nowrap">{t('home.tryOurAi', 'Try Our AI')} {t('mortgage.calculator', 'Mortgage Calculator')}</span>
                    <ArrowUpRight className="w-5 h-5" />
                  </Button>
                </Link>
                
                <Link to="/partners/mortgage">
                  <Button variant="outline" size="lg" className="gap-2 px-8 py-5 text-base border-gray-300 text-black hover:bg-gray-100">
                    <Users className="w-5 h-5 text-gray-600" />
                    <span>{t('home.connectMortgagePartners', 'Connect With Mortgage Partners')}</span>
                    <ArrowUpRight className="w-5 h-5" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <SectionDivider fullWidth />

      <div className="cv-auto">
        <Suspense fallback={<SectionLoader />}>
          <WhyDubaiCapitalSection />
        </Suspense>
      </div>

      <PodcastVisibilityGate>
        <SectionDivider fullWidth />
        <div className="cv-auto">
          <Suspense fallback={<SectionLoader />}>
            <JBJPodcastSection />
          </Suspense>
        </div>
      </PodcastVisibilityGate>

      <SectionDivider fullWidth />

      <div className="cv-auto">
        <Suspense fallback={<SectionLoader />}>
          <BestIdeaAward />
        </Suspense>
      </div>

      <SectionDivider fullWidth />

      <div className="cv-auto">
        <Suspense fallback={<SectionLoader />}>
          <WhyChooseUs />
        </Suspense>
      </div>

      <SectionDivider fullWidth />

      <div className="cv-auto">
        <Suspense fallback={<SectionLoader />}>
          <AreasWeCover />
        </Suspense>
      </div>

      <SectionDivider fullWidth />

      <div className="cv-auto">
        <Suspense fallback={<SectionLoader />}>
          <TestimonialsSection />
        </Suspense>
      </div>

      <SectionDivider fullWidth />

      <div className="cv-auto">
        <Suspense fallback={<SectionLoader />}>
          <StatsCounter />
        </Suspense>
      </div>

      <SectionDivider fullWidth />

      <div className="cv-auto">
        <Suspense fallback={<SectionLoader />}>
          <SupportTicketBox />
        </Suspense>
      </div>

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
