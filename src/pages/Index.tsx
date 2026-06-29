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
const ModePortalBanner = lazy(() => import("@/components/home/ModePortalBanner"));
const CategorySelectorSection = lazy(() => import("@/components/home/CategorySelectorSection"));
const CTABand = lazy(() => import("@/components/home/CTABand"));


import { PodcastVisibilityGate } from "@/components/home/PodcastVisibilityGate";
import { SectionDivider } from "@/components/ui/section-divider";
import { SectionDividerGoldFullBleed } from "@/components/ui/section-divider-gold-fullbleed";
import { PremiumSectionCard } from "@/components/ui/premium-section-card";
import PageShell from "@/components/layout/PageShell";
import LazyVisible from "@/components/util/LazyVisible";

const VerificationBanner = lazy(() => import("@/components/verification/VerificationBanner"));
const PartnerVerifyHeroCTA = lazy(() => import("@/components/home/PartnerVerifyHeroCTA"));
const DeveloperPartnersMarquee = lazy(() => import("@/components/DeveloperPartnersMarquee"));

const SectionLoader = forwardRef<HTMLDivElement>((_, ref) => (
  <div ref={ref} className="min-h-[72px] w-full" aria-hidden="true" />
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
  { label: "AI Home Finder", icon: Home, href: "/ai-home-finder" },
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

  // Mark <body> while on homepage so the global alignment-normalization
  // CSS rule (in src/index.css) skips this route. All other pages inherit
  // the canonical container width automatically.
  useEffect(() => {
    document.body.setAttribute("data-homepage", "true");
    return () => {
      document.body.removeAttribute("data-homepage");
    };
  }, []);





  // Preload only near-the-fold chunks during idle time
  useEffect(() => {
    const preloadNearFold = () => {
      [
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

  // Scroll safety net — homepage must NEVER inherit a stuck body lock left
  // behind by a modal/dialog/carousel that crashed before its cleanup ran.
  // We aggressively release any inline overflow/position lock on the home
  // route at mount, on focus, on tab visibility, and on the first user
  // interaction. The home page itself never needs a body-level scroll lock.
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const body = document.body;
    const html = document.documentElement;
    const release = () => {
      // Clear any inline overflow/position/pointer-events lock left over
      // from a modal/dialog/carousel that didn't run its cleanup.
      if (body.style.overflow) body.style.overflow = '';
      if (body.style.overflowY === 'hidden') body.style.overflowY = '';
      if (body.style.position === 'fixed') {
        body.style.position = '';
        body.style.top = '';
        body.style.width = '';
      }
      if (body.style.pointerEvents === 'none') body.style.pointerEvents = '';
      if (html.style.overflow) html.style.overflow = '';
      if (html.style.overflowY === 'hidden') html.style.overflowY = '';
    };
    release();
    const onFocus = () => release();
    const onVis = () => { if (document.visibilityState === 'visible') release(); };
    const onPointer = () => release();
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('pointerdown', onPointer, { passive: true });
    // Watch the body's style attribute — if anything re-locks it while the
    // home page is mounted, release immediately.
    const obs = new MutationObserver(release);
    obs.observe(body, { attributes: true, attributeFilter: ['style'] });
    obs.observe(html, { attributes: true, attributeFilter: ['style'] });
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVis);
      window.removeEventListener('pointerdown', onPointer);
      obs.disconnect();
    };
  }, []);

  // LCP boost — preload the hero poster image immediately so it paints before
  // React mounts the <video>. The poster is a hashed Vite asset URL, so we
  // can't bake it into index.html — inject the preload link at module mount.
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const existing = document.querySelector(
      `link[rel="preload"][as="image"][href="${heroFallbackDubai}"]`,
    );
    if (existing) return;
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = heroFallbackDubai;
    (link as any).fetchPriority = 'high';
    document.head.appendChild(link);
  }, []);

  return (
    <PageShell data-home-page className="relative w-full min-h-screen bg-[#F7F2EA] overflow-x-hidden">

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
      <div data-surface="dark" data-hero-dark className="jj-hero-fullscreen jj-home-hero relative flex items-center justify-center overflow-hidden bg-black">
        {/* Video Background */}
        <div className="absolute inset-0 bg-black">
          {/* Instant fallback poster image — paints immediately, no orbs, no brown */}
          <img
            src={heroFallbackDubai}
            alt=""
            aria-hidden="true"
            fetchpriority="high"
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover z-[1]"
          />

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
              opacity: 1,
            }}
            onLoadedData={() => setVideoLoaded(true)}
            onCanPlay={() => setVideoLoaded(true)}
            onError={() => setVideoLoaded(true)}
            src="https://mdafrewypkkrildjgtey.supabase.co/storage/v1/object/public/videos/hero-video.mp4"
          />
          {/* Lighter overlay: video visibility prioritized, headline still legible via its own text-shadow */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/15 to-black/45 z-[3] pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/20 z-[3] pointer-events-none" />
        </div>

        
        {/* MERGED HERO CONTENT — tagline + CTAs + pillars */}
        <motion.div 
          className="jj-content-track jj-home-hero-content relative z-10 w-full flex flex-col items-center justify-center text-center"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <div className="jj-home-hero-stack w-full max-w-5xl mx-auto text-center pt-[max(18vh,160px)] sm:pt-[24vh] md:pt-[32vh] pb-[max(2vh,16px)] space-y-3 sm:space-y-4 md:space-y-5">
            {/* Eyebrow tagline removed per owner directive — keep hero copy minimal */}

            {/* Headline — exact copy from reference photo */}
            <motion.h1
              variants={fadeInUp}
              data-no-contrast-guard
              data-on-dark
              data-allow-dark-cta
              className="font-display font-semibold tracking-tight leading-[1.05] text-balance w-full mx-auto allow-white"
              style={{
                fontSize: "clamp(1.85rem, 5vw + 0.5rem, 4.25rem)",
                letterSpacing: "-0.02em",
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

      {/* DEVELOPER PARTNERS MARQUEE — directly under hero */}
      <Suspense fallback={<SectionLoader />}>
        <DeveloperPartnersMarquee />
      </Suspense>

      {/* EXPLORE OUR SERVICES — separator section between Partners marquee and the
          Get Verified / Mode Portal pair, with generous breathing room above and below. */}
      <PremiumSectionCard padding="none" width="contained" wrapperClassName="cv-auto pt-16 pb-16 md:pt-20 md:pb-20">
        <LazyVisible minHeight={500}>
          <Suspense fallback={<SectionLoader />}>
            <ExploreServicesCard />
          </Suspense>
        </LazyVisible>
      </PremiumSectionCard>

      {/* VERIFICATION + MODE-AWARE PORTAL — paired full-bleed banner block. */}
      <div className="jj-fullbleed-band pt-6 md:pt-8" data-fullbleed-band>
        <Suspense fallback={null}>
          <VerificationBanner />
        </Suspense>
        <Suspense fallback={null}>
          <PartnerVerifyHeroCTA />
        </Suspense>
      </div>



      {/* CATEGORY SELECTOR — I'm an Investor / Broker / Developer */}
      <div id="category-selector" className="py-4">
        <Suspense fallback={<SectionLoader />}>
          <CategorySelectorSection />
        </Suspense>
      </div>




      {/* FEATURED LISTINGS — full-bleed band */}
      <div className="jj-fullbleed-band cv-auto py-4" data-fullbleed-band>
        <LazyVisible minHeight={500}>
          <Suspense fallback={<SectionLoader />}>
            <FeaturedListings />
          </Suspense>
        </LazyVisible>
      </div>

      {/* CONTINUE SEARCHING — full-bleed band */}
      <div className="jj-fullbleed-band cv-auto py-4" data-fullbleed-band>
        <LazyVisible minHeight={400}>
          <Suspense fallback={<SectionLoader />}>
            <ContinueSearching type="property" />
          </Suspense>
        </LazyVisible>
      </div>


      {/* RESALE PROPERTIES */}
      <PremiumSectionCard padding="none" width="contained" wrapperClassName="cv-auto py-4">
        <LazyVisible minHeight={500}>
          <Suspense fallback={<SectionLoader />}>
            <ResalePropertiesSection />
          </Suspense>
        </LazyVisible>
      </PremiumSectionCard>

      {/* OVERSEAS INVESTORS — full-bleed edge-to-edge (post-sidebar) */}
      <div className="jj-fullbleed-band cv-auto" data-fullbleed-band>
        <LazyVisible minHeight={300}>
          <Suspense fallback={<SectionLoader />}>
            <OverseasInvestorsBanner />
          </Suspense>
        </LazyVisible>
      </div>


      {/* EXPLORE OUR GUIDES & REPORTS — full-bleed band */}
      <div className="jj-fullbleed-band cv-auto py-4" data-fullbleed-band>
        <LazyVisible minHeight={400}>
          <Suspense fallback={<SectionLoader />}>
            <HomepageBookMarquee />
          </Suspense>
        </LazyVisible>
      </div>


      {/* (EXPLORE OUR SERVICES moved up — now sits between Partners marquee
          and the Get Verified / Mode Portal pair as a visual separator.) */}



      {/* TOOLKIT SHOWCASE CARD */}
      <PremiumSectionCard padding="none" width="contained" wrapperClassName="cv-auto py-4">
        <LazyVisible minHeight={400}>
          <Suspense fallback={<SectionLoader />}>
            <ToolkitShowcaseCard />
          </Suspense>
        </LazyVisible>
      </PremiumSectionCard>

      {/* AI COMPARISON & ANALYZER PREVIEW */}
      <PremiumSectionCard padding="none" width="contained" wrapperClassName="cv-auto py-4">
        <LazyVisible minHeight={400}>
          <div className="jj-premium-shell">
            <span aria-hidden className="jj-premium-shell__c-bl" />
            <span aria-hidden className="jj-premium-shell__c-br" />
            <Suspense fallback={<SectionLoader />}>
              <AIComparisonWidget />
            </Suspense>
          </div>
        </LazyVisible>
      </PremiumSectionCard>

      <PremiumSectionCard padding="none" width="contained" wrapperClassName="cv-auto py-4">
        <LazyVisible minHeight={420} rootMargin="1200px">
          <div className="jj-premium-shell" style={{ contain: "layout paint" }}>
            <span aria-hidden className="jj-premium-shell__c-bl" />
            <span aria-hidden className="jj-premium-shell__c-br" />

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
                variant="primary"
                leadingIcon={<Sparkles strokeWidth={2.2} />}
                trailingIcon={<ArrowUpRight strokeWidth={2.2} />}
              >
                <span className="whitespace-nowrap">{t('home.tryOurAi', 'Try Our AI')} {t('mortgage.calculator', 'Mortgage Calculator')}</span>
              </PearlButton>

              <PearlButton
                to="/partners/mortgage"
                size="md"
                variant="secondary"
                leadingIcon={<Users strokeWidth={2.2} />}
                trailingIcon={<ArrowUpRight strokeWidth={2.2} />}
              >
                <span className="whitespace-nowrap">{t('home.connectMortgagePartners', 'Connect With Mortgage Partners')}</span>
              </PearlButton>
            </div>

          </div>
        </LazyVisible>
      </PremiumSectionCard>


      <PodcastVisibilityGate>
        <PremiumSectionCard padding="none" width="contained" wrapperClassName="cv-auto py-4">
          <LazyVisible minHeight={400}>
            <Suspense fallback={<SectionLoader />}>
              <JBJPodcastSection />
            </Suspense>
          </LazyVisible>
        </PremiumSectionCard>
      </PodcastVisibilityGate>

      {/* TOP AREAS IN DUBAI */}
      <PremiumSectionCard padding="none" width="contained" wrapperClassName="cv-auto py-4">
        <LazyVisible minHeight={400}>
          <Suspense fallback={<SectionLoader />}>
            <AreasWeCover />
          </Suspense>
        </LazyVisible>
      </PremiumSectionCard>

      {/* READY TO GET STARTED — restored under Top Areas */}
      <PremiumSectionCard padding="none" width="full" wrapperClassName="cv-auto py-4">

        <LazyVisible minHeight={300}>
          <Suspense fallback={<SectionLoader />}>
            <CTABand />
          </Suspense>
        </LazyVisible>
      </PremiumSectionCard>






      <Suspense fallback={null}>
        <InquiryFormModal 
          isOpen={isInquiryOpen} 
          onClose={() => setIsInquiryOpen(false)} 
        />
      </Suspense>
    </PageShell>
  );
};

export default Index;
