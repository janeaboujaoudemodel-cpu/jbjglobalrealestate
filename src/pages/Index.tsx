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

// Three pillars (re-introduced per owner directive — hero displays three brand pillars on every device)
const pillars = [
  { icon: Building2, title: "Premium Marketplace", desc: "2,400+ Off-Plan & Resale Properties" },
  { icon: Brain, title: "AI-Powered Tools", desc: "Smart Search & Investment Intelligence" },
  { icon: Briefcase, title: "Brokerage Services", desc: "Licensed Advisors & Expert Guides" },
];







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

            {/* Hero action pills row (Browse Properties → Careers) removed per owner directive —
                those shortcuts live inside the role-specific portal CTA below. */}

            {/* Three pillars — desktop = 3-column cards (untouched), mobile = single clean inline row */}
            <motion.div variants={fadeInUp} className="w-full max-w-3xl mx-auto">
              {/* Mobile: ultra-compact inline row */}
              <div className="md:hidden flex items-stretch justify-between gap-2 rounded-2xl border border-[hsl(var(--gold)/0.35)] bg-black/40 backdrop-blur-md px-2 py-2.5">
                {pillars.map((pillar) => (
                  <div key={pillar.title} className="flex-1 min-w-0 flex flex-col items-center text-center px-1">
                    <pillar.icon className="w-4 h-4 text-[#E2C9A0] mb-1" strokeWidth={1.8} />
                    <span className="text-[10px] leading-tight font-semibold text-white whitespace-nowrap">
                      {pillar.title}
                    </span>
                  </div>
                ))}
              </div>
              {/* Desktop: original three-card grid (untouched aesthetic) */}
              <div className="hidden md:grid grid-cols-3 gap-px border border-[hsl(var(--gold)/0.25)] overflow-hidden rounded-lg">
                {pillars.map((pillar) => (
                  <div
                    key={pillar.title}
                    className="bg-black/50 backdrop-blur-sm p-4 text-center border-r last:border-r-0 border-[hsl(var(--gold)/0.18)]"
                  >
                    <pillar.icon className="w-5 h-5 text-[#E2C9A0] mx-auto mb-1.5" strokeWidth={1.8} />
                    <h3 className="text-xs font-semibold text-white mb-0.5">{pillar.title}</h3>
                    <p className="text-[10px] text-white/70 leading-tight">{pillar.desc}</p>
                  </div>
                ))}
              </div>
            </motion.div>



            {/* Book a Free Consultation CTA — replaces the old Explore arrow */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.6 }}
              className="flex justify-center pt-2"
            >
              <button
                type="button"
                onClick={() => setIsInquiryOpen(true)}
                data-no-contrast-guard
                className="group inline-flex h-12 sm:h-14 items-center justify-center gap-3 rounded-2xl px-7 sm:px-9
                  text-[15px] font-semibold tracking-tight
                  transition-[transform,box-shadow,border-color,background] duration-300 ease-out
                  hover:-translate-y-0.5
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E2C9A0]/65 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
                style={{
                  color: '#FDFBF7',
                  background: 'rgba(253, 251, 247, 0.12)',
                  WebkitBackdropFilter: 'blur(18px) saturate(160%)',
                  backdropFilter: 'blur(18px) saturate(160%)',
                  border: '1px solid #D4B896',
                  boxShadow:
                    'inset 0 1px 0 rgba(255,255,255,0.22), 0 0 0 1px rgba(212,184,150,0.35), 0 14px 34px rgba(0,0,0,0.40), 0 0 22px rgba(226,201,160,0.18)',
                  textShadow: '0 1px 4px rgba(0,0,0,0.55)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(253, 251, 247, 0.22)';
                  e.currentTarget.style.borderColor = '#E2C9A0';
                  e.currentTarget.style.boxShadow =
                    'inset 0 1px 0 rgba(255,255,255,0.30), 0 0 0 1px rgba(226,201,160,0.65), 0 18px 40px rgba(0,0,0,0.45), 0 0 28px rgba(226,201,160,0.28)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(253, 251, 247, 0.12)';
                  e.currentTarget.style.borderColor = '#D4B896';
                  e.currentTarget.style.boxShadow =
                    'inset 0 1px 0 rgba(255,255,255,0.22), 0 0 0 1px rgba(212,184,150,0.35), 0 14px 34px rgba(0,0,0,0.40), 0 0 22px rgba(226,201,160,0.18)';
                }}
              >
                <span>Book a Free Consultation</span>
                <ArrowUpRight
                  className="h-4 w-4 transition-transform duration-300 ease-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  style={{ color: '#E2C9A0' }}
                  strokeWidth={2.25}
                />
              </button>
            </motion.div>
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
      <Suspense fallback={null}>
        <VerificationBanner />
      </Suspense>

      {/* PARTNER VERIFY CTA — only shown to registered partners */}
      <Suspense fallback={null}>
        <PartnerVerifyHeroCTA />
      </Suspense>


      {/* DEVELOPER PORTAL CTA */}
      <div className="cv-auto">
        <Suspense fallback={<SectionLoader />}>
          <DeveloperPortalCTA />
        </Suspense>
      </div>

      {/* TrustBar (RERA / 8-card grid) removed per founder request — component retained on disk */}
      <SectionDivider fullWidth />



      {/* FEATURED LISTINGS */}
      <div className="cv-auto">
        <Suspense fallback={<SectionLoader />}>
          <FeaturedListings />
        </Suspense>
      </div>

      {/* CONTINUE SEARCHING — removed per owner request */}

      {/* RESALE PROPERTIES - single divider before Starting Point */}
      <div className="cv-auto">
        <Suspense fallback={<SectionLoader />}>
          <ResalePropertiesSection />
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
      <section>
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


      {/* AI COMPARISON & ANALYZER PREVIEW */}
      <section>
        <div className="jj-layer-2">
          <Suspense fallback={<SectionLoader />}>
            <AIComparisonWidget />
          </Suspense>
        </div>
      </section>

      <SectionDivider />

      <section className="py-6 md:py-8">
        <div className="jj-layer-2">
          <div className="bg-[#F7F2EA] border border-[#B89555]/30 rounded-2xl p-4 md:p-8 relative overflow-hidden">
            <div className="relative z-10">
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

            </div>
          </div>
        </div>
      </section>


      <PodcastVisibilityGate>
        <SectionDivider fullWidth />
        <div className="cv-auto">
          <Suspense fallback={<SectionLoader />}>
            <JBJPodcastSection />
          </Suspense>
        </div>
      </PodcastVisibilityGate>

      <div className="cv-auto">
        <Suspense fallback={<SectionLoader />}>
          <AreasWeCover />
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
