import { useState, lazy, Suspense, memo, useEffect, forwardRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

import { SEOHead, pagesSEO } from "@/components/SEOHead";
import { useLanguage } from "@/contexts/LanguageContext";
import { useUserRole } from "@/hooks/useUserRole";
import { Sparkles, ArrowUpRight, Users, Building2, Brain, Briefcase, Home, FileText, UserCircle, ChevronDown, MessageSquareWarning, Search, BarChart3, Newspaper, LayoutDashboard, GraduationCap, Upload, Tag } from "lucide-react";
import { useMemo } from "react";
import { useUserModeContext } from "@/contexts/UserModeContext";


import { Button } from "@/components/ui/button";
import { PearlButton } from "@/components/ui/pearl-button";
import { PremiumHeroButton } from "@/components/ui/premium-hero-button";
import HeroPropertySearch from "@/components/home/HeroPropertySearch";
import HomeHeroSearch from "@/components/home/HomeHeroSearch";

import heroFallbackDubai from "@/assets/hero-fallback-dubai.jpg";
import { CONTACT_INFO } from "@/constants/stats";

// Chunk imports — stored so we can preload them all after hero renders
const chunkImports = {
  DeveloperPartnersMarquee: () => import("@/components/DeveloperPartnersMarquee"),
  StatsCounter: () => import("@/components/StatsCounter"),
  InquiryFormModal: () => import("@/components/InquiryFormModal"),
  BestIdeaAward: () => import("@/components/BestIdeaAward"),
  SupportTicketBox: () => import("@/components/SupportTicketBox"),
  ExploreServicesCard: () => import("@/components/home/ExploreServicesExpander"),
  ToolkitShowcaseCard: () => import("@/components/home/ToolkitShowcaseCard").then(m => ({ default: m.ToolkitShowcaseCard })),
  OverseasInvestorsBanner: () => import("@/components/home/OverseasInvestorsStrip"),
  TrustBar: () => import("@/components/home/TrustBar"),
  FeaturedListings: () => import("@/components/home/FeaturedListings"),
  ServicesGrid: () => import("@/components/home/ServicesGrid"),
  AreasWeCover: () => import("@/components/home/AreasWeCover"),
  ContinueSearching: () => import("@/components/ContinueSearching"),
  HomepageBookMarquee: () => import("@/components/home/HomepageBookMarquee"),
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
const OverseasInvestorsBanner = lazy(chunkImports.OverseasInvestorsBanner);
const TrustBar = lazy(chunkImports.TrustBar);
const FeaturedListings = lazy(chunkImports.FeaturedListings);
const ServicesGrid = lazy(chunkImports.ServicesGrid);
const AreasWeCover = lazy(chunkImports.AreasWeCover);
const ContinueSearching = lazy(chunkImports.ContinueSearching);
const HomepageBookMarquee = lazy(chunkImports.HomepageBookMarquee);
const AIComparisonWidget = lazy(chunkImports.AIComparisonWidget);
const MarketReportCTA = lazy(chunkImports.MarketReportCTA);
const MortgageCalculator = lazy(chunkImports.MortgageCalculator);
const BrokerOnboardingBanner = lazy(chunkImports.BrokerOnboardingBanner);
const JBJPodcastSection = lazy(chunkImports.JBJPodcastSection);
const ResalePropertiesSection = lazy(chunkImports.ResalePropertiesSection);
const DeveloperPortalCTA = lazy(() => import("@/components/home/DeveloperPortalCTA"));
const CategorySelectorSection = lazy(() => import("@/components/home/CategorySelectorSection"));

import { PodcastVisibilityGate } from "@/components/home/PodcastVisibilityGate";
import { SectionDivider } from "@/components/ui/section-divider";
import { SectionDividerGoldFullBleed } from "@/components/ui/section-divider-gold-fullbleed";
import { PremiumSectionCard } from "@/components/ui/premium-section-card";

const VerificationBanner = lazy(() => import("@/components/verification/VerificationBanner"));
const PartnerVerifyHeroCTA = lazy(() => import("@/components/home/PartnerVerifyHeroCTA"));

const SectionLoader = forwardRef<HTMLDivElement>((_, ref) => (
  <div ref={ref} className="py-12 flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-[#B89555]/30 border-t-transparent rounded-full animate-spin" />
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

// Hero action pills — News sits in the visual center; mode-specific extras append on the right
const baseHeroActions = [
  { label: "Browse Properties", icon: Search, href: "/properties" },
  { label: "AI Home Finder", icon: Home, href: "/quiz" },
  { label: "News", icon: Newspaper, href: "/news" },
  { label: "Market Intelligence", icon: BarChart3, href: "/market-intelligence" },
];

const modeHeroActions: Record<'investor' | 'broker' | 'developer', { label: string; icon: typeof Search; href: string }[]> = {
  investor: [
    { label: "Investor Dashboard", icon: LayoutDashboard, href: "/investor-dashboard" },
    { label: "Sell Your Property", icon: Tag, href: "/sell" },
  ],
  broker: [
    { label: "Broker Toolkit", icon: Briefcase, href: "/broker-toolkit" },
    { label: "Careers", icon: GraduationCap, href: "/careers" },
  ],
  developer: [
    { label: "Developer Portal", icon: Building2, href: "/developer-portal" },
  ],
};

// Pillars removed — hero now uses a single always-visible premium search bar on every device.







const Index = () => {
  const [isInquiryOpen, setIsInquiryOpen] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const { t } = useLanguage();
  const { isBroker } = useUserRole();
  const { mode, hasMadeInitialSelection } = useUserModeContext();
  const heroActions = useMemo(() => {
    if (!hasMadeInitialSelection) return baseHeroActions;
    const extras = modeHeroActions[mode] ?? [];
    return [...baseHeroActions, ...extras];
  }, [mode, hasMadeInitialSelection]);





  // Preload only near-the-fold chunks during idle time
  useEffect(() => {
    const preloadNearFold = () => {
      [
        chunkImports.DeveloperPartnersMarquee,
        chunkImports.TrustBar,
        chunkImports.FeaturedListings,
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

  // Scroll safety net — guarantees the homepage is always scrollable even if
  // a previously-mounted modal/dialog left body.overflow=hidden behind.
  useEffect(() => {
    const releaseScroll = () => {
      if (typeof document === 'undefined') return;
      const body = document.body;
      const html = document.documentElement;
      if (body.style.overflow === 'hidden') body.style.overflow = '';
      if (body.style.position === 'fixed') body.style.position = '';
      if (html.style.overflow === 'hidden') html.style.overflow = '';
      body.style.pointerEvents = '';
    };
    releaseScroll();
    const id = window.setInterval(releaseScroll, 1500);
    return () => window.clearInterval(id);
  }, []);

  return (
    <section data-home-page className="relative w-full min-h-screen bg-[#FDFBF7]">
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
      <div data-surface="dark" className="jj-hero-fullscreen relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-[hsl(32,28%,13%)] via-[hsl(33,27%,15%)] to-[hsl(33,28%,11%)]">
        {/* Video Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-[hsl(32,28%,13%)] via-[hsl(33,27%,15%)] to-[hsl(33,28%,11%)]">
          {/* Branded fallback — renders instantly, unmounts after video loads */}
          {!videoLoaded && (
            <div 
              className="absolute inset-0 z-[1] pointer-events-none"
            >
              {/* Gold accent orbs only — no logo to avoid overlapping headline on mobile */}
              <div className="absolute top-1/4 left-10 w-64 h-64 bg-[#FDFBF7]/5 rounded-full blur-[100px]" />
              <div className="absolute bottom-1/3 right-10 w-80 h-80 bg-[#FDFBF7]/5 rounded-full blur-[120px]" />
            </div>
          )}

          <video 
            autoPlay loop muted playsInline
            preload="auto"
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
            onLoadedData={(e) => { e.currentTarget.style.opacity = '1'; setVideoLoaded(true); }}
            onCanPlay={(e) => { e.currentTarget.style.opacity = '1'; setVideoLoaded(true); }}
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
            src="https://mdafrewypkkrildjgtey.supabase.co/storage/v1/object/public/videos/hero-video.mp4"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/55 to-black/90 z-[3]" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/25 to-black/55 z-[3]" />
        </div>
        
        {/* MERGED HERO CONTENT — tagline + CTAs + pillars */}
        <motion.div 
          className="relative z-10 w-full flex flex-col items-center justify-center text-center px-4 sm:px-8 md:px-12 lg:px-16"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <div className="w-full max-w-5xl mx-auto text-center pt-[max(3vh,40px)] sm:pt-[5vh] md:pt-[8vh] pb-[max(2vh,16px)] space-y-3 sm:space-y-4 md:space-y-5">
            {/* Eyebrow tagline removed per owner directive — keep hero copy minimal */}

            {/* Headline — exact copy from reference photo */}
            <motion.h1
              variants={fadeInUp}
              className="font-bold tracking-tight leading-[1.08] text-balance w-full mx-auto"
              style={{
                fontSize: "clamp(1.75rem, 4.8vw + 0.5rem, 4rem)",
                letterSpacing: "-0.015em",
                color: "#FFFFFF",
                WebkitTextFillColor: "#FFFFFF",
                wordSpacing: "0.01em",
                hyphens: "auto",
                textShadow: "0 2px 18px rgba(0,0,0,0.9), 0 0 2px rgba(0,0,0,0.95), 0 4px 30px rgba(0,0,0,0.55)",
              }}
            >
              Your Gateway to Dubai's Finest Real Estate
            </motion.h1>

            {/* Hero global search — long-stretch bar with inline Book + Concierge CTAs */}
            <motion.div variants={fadeInUp} className="w-full">
              <HomeHeroSearch onBookConsultation={() => setIsInquiryOpen(true)} />
            </motion.div>

            {/* Standalone "Book a Free Consultation" CTA removed — now lives inline inside the search bar above. */}

          </div>
        </motion.div>
      </div>

      {/* CATEGORY SELECTOR — I'm an Investor / Broker / Developer */}
      <div id="category-selector">
        <Suspense fallback={<SectionLoader />}>
          <CategorySelectorSection />
        </Suspense>
      </div>

      {/* DEVELOPER PARTNERS MARQUEE */}
      <div id="developer-partners">
        <Suspense fallback={<SectionLoader />}>
          <DeveloperPartnersMarquee />
        </Suspense>
      </div>

      {/* VERIFICATION BANNER - moved here after marquee */}
      <div className="py-10 sm:py-14">
        <Suspense fallback={null}>
          <VerificationBanner />
        </Suspense>

        {/* PARTNER VERIFY CTA — only shown to registered partners */}
        <Suspense fallback={null}>
          <PartnerVerifyHeroCTA />
        </Suspense>
      </div>

      {/* DEVELOPER PORTAL CTA */}
      <div className="cv-auto py-10 sm:py-14">
        <Suspense fallback={<SectionLoader />}>
          <DeveloperPortalCTA />
        </Suspense>
      </div>

      {/* FEATURED LISTINGS */}
      <div className="cv-auto py-10 sm:py-14">
        <Suspense fallback={<SectionLoader />}>
          <FeaturedListings />
        </Suspense>
      </div>

      {/* CONTINUE SEARCHING — restored: history-aware "continue where you left off". */}
      <div className="cv-auto py-6 md:py-10">
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

      <SectionDividerGoldFullBleed size="md" spacing="sm" />


      {/* OVERSEAS INVESTORS — Invest in Dubai */}
      <div className="cv-auto">
        <Suspense fallback={<SectionLoader />}>
          <OverseasInvestorsBanner />
        </Suspense>
      </div>

      <SectionDividerGoldFullBleed size="md" spacing="sm" />

      {/* EXPLORE OUR GUIDES & REPORTS — wrapped in gold-bordered premium card */}
      <PremiumSectionCard padding="none" wrapperClassName="cv-auto py-6 md:py-10">
        <Suspense fallback={<SectionLoader />}>
          <HomepageBookMarquee />
        </Suspense>
      </PremiumSectionCard>

      <SectionDividerGoldFullBleed size="md" spacing="sm" />

      {/* EXPLORE OUR SERVICES */}
      <PremiumSectionCard padding="none" wrapperClassName="cv-auto py-6 md:py-10">
        <Suspense fallback={<SectionLoader />}>
          <ExploreServicesCard />
        </Suspense>
      </PremiumSectionCard>

      <SectionDividerGoldFullBleed size="md" spacing="sm" />

      {/* TOOLKIT SHOWCASE CARD */}
      <PremiumSectionCard padding="none" wrapperClassName="cv-auto py-6 md:py-10">
        <Suspense fallback={<SectionLoader />}>
          <ToolkitShowcaseCard />
        </Suspense>
      </PremiumSectionCard>

      <SectionDividerGoldFullBleed size="md" spacing="sm" />


      {/* AI COMPARISON & ANALYZER PREVIEW */}
      <PremiumSectionCard padding="none" wrapperClassName="cv-auto py-6 md:py-10">
        <Suspense fallback={<SectionLoader />}>
          <AIComparisonWidget />
        </Suspense>
      </PremiumSectionCard>

      <SectionDividerGoldFullBleed size="md" spacing="sm" />

      <PremiumSectionCard tone="surface" padding="md" wrapperClassName="cv-auto py-6 md:py-10">
        <Suspense fallback={<SectionLoader />}>
          <MortgageCalculator compact />
        </Suspense>
        <p className="text-[#1A1A1A]/60 text-[11px] text-center mt-4">
          Estimates only. We connect you with independent licensed mortgage advisors for personalized guidance.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 mt-6 justify-center">
          <PearlButton
            to="/mortgage-calculator"
            size="md"
            leadingIcon={<Sparkles strokeWidth={2.2} />}
            trailingIcon={<ArrowUpRight strokeWidth={2.2} />}
          >
            <span className="whitespace-nowrap">{t('home.tryOurAi', 'Try Our AI')} {t('mortgage.calculator', 'Mortgage Calculator')}</span>
          </PearlButton>

          <PearlButton
            to="/partners/mortgage"
            size="md"
            leadingIcon={<Users strokeWidth={2.2} />}
            trailingIcon={<ArrowUpRight strokeWidth={2.2} />}
          >
            <span>{t('home.connectMortgagePartners', 'Connect With Mortgage Partners')}</span>
          </PearlButton>
        </div>
      </PremiumSectionCard>



      <PodcastVisibilityGate>
        <SectionDividerGoldFullBleed size="md" spacing="sm" />
        <PremiumSectionCard padding="none" wrapperClassName="cv-auto py-6 md:py-10">
          <Suspense fallback={<SectionLoader />}>
            <JBJPodcastSection />
          </Suspense>
        </PremiumSectionCard>
      </PodcastVisibilityGate>


      <SectionDividerGoldFullBleed size="md" spacing="sm" />

      {/* TOP AREAS IN DUBAI — wrapped in gold-bordered premium card */}
      <PremiumSectionCard padding="none" wrapperClassName="cv-auto py-6 md:py-10">
        <Suspense fallback={<SectionLoader />}>
          <AreasWeCover />
        </Suspense>
      </PremiumSectionCard>



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
