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
import { PremiumHeroButton } from "@/components/ui/premium-hero-button";

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
const VoiceConciergeWidget = lazy(() => import("@/components/VoiceConciergeWidget"));

const VerificationBanner = lazy(() => import("@/components/verification/VerificationBanner"));

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

// Hero action pills — matches founder reference photo: single horizontal row
const heroActions = [
  { label: "Browse Properties", icon: Search, href: "/properties" },
  { label: "AI Home Finder", icon: Home, href: "/quiz" },
  { label: "Sell Your Property", icon: Building2, href: "/sell" },
  { label: "Explore AI Tools", icon: Brain, href: "/ai-hub" },
  { label: "Market Intelligence", icon: BarChart3, href: "/market-intelligence" },
  { label: "News", icon: Newspaper, href: "/news" },
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
  const { isBroker } = useUserRole();





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
            preload="metadata"
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
          <div className="w-full max-w-5xl mx-auto text-center pt-[max(6vh,72px)] sm:pt-[10vh] md:pt-[16vh] pb-[max(2vh,16px)] space-y-3 sm:space-y-5 md:space-y-7">
            {/* Eyebrow — small uppercase tagline above headline (matches founder reference photo) */}
            <motion.p
              variants={fadeInUp}
              className="text-[10px] sm:text-[11px] md:text-xs font-semibold uppercase tracking-[0.32em] text-white/85"
              style={{
                textShadow: "0 1px 4px rgba(0,0,0,0.95), 0 2px 12px rgba(0,0,0,0.6)",
              }}
            >
              Dubai's Trusted Real Estate Ecosystem
            </motion.p>

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


            {/* "I'm a..." mode pill row removed — CategorySelectorSection below ("Tell us who you are — Get started in 30s") is the single funnel for category selection. No duplication. */}


            {/* Quick-action CTA pills — single horizontal wrap row matching reference photo */}
            <motion.div
              variants={fadeInUp}
              className="flex items-center justify-center flex-wrap gap-2 max-w-5xl mx-auto"
            >
              {heroActions.map((action) => (
                <Link
                  key={action.label}
                  to={action.href}
                  data-no-contrast-guard
                  className="jj-hero-action-card group inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-full border text-[11px] sm:text-[12px] font-semibold tracking-tight transition-all duration-300"
                >
                  <action.icon
                    aria-hidden="true"
                    className="jj-hero-action-icon w-3.5 h-3.5 flex-shrink-0 transition-colors duration-300"
                    strokeWidth={2.25}
                  />
                  <span className="jj-hero-action-label whitespace-nowrap">
                    {action.label}
                  </span>
                </Link>
              ))}
            </motion.div>


            {/* Three pillar badges — HIDDEN on mobile (<640px), compact on tablet, full size on desktop */}
            <motion.div
              variants={fadeInUp}
              className="hidden sm:grid grid-cols-3 max-w-xl md:max-w-2xl lg:max-w-3xl mx-auto border border-[#B89555]/40 overflow-hidden rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.5)] bg-[#0A0A0A]"
            >
              {pillars.map((pillar, idx) => (
                <div
                  key={pillar.title}
                  className="relative bg-[#0A0A0A] p-2.5 sm:p-3 md:p-4 lg:p-5 text-center"
                >
                  {/* Premium divider — gold gradient hairline + center diamond, between cards only */}
                  {idx > 0 && (
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute left-0 top-3 bottom-3 w-px"
                      style={{
                        background:
                          "linear-gradient(to bottom, transparent 0%, rgba(184,149,85,0.15) 15%, rgba(184,149,85,0.85) 50%, rgba(184,149,85,0.15) 85%, transparent 100%)",
                      }}
                    >
                      <span
                        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 block w-1.5 h-1.5 rotate-45 bg-[#EFE6D6] shadow-[0_0_6px_rgba(184,149,85,0.8)]"
                      />
                    </div>
                  )}
                  <pillar.icon
                    className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 lg:w-7 lg:h-7 text-[#1A1A1A] mx-auto mb-1.5 md:mb-2"
                    style={{ filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.9))" }}
                  />
                  <h3
                    className="text-[11px] sm:text-[12px] md:text-[13px] lg:text-sm font-bold mb-0.5 md:mb-1 leading-tight"
                    style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF", textShadow: "0 1px 3px rgba(0,0,0,0.95)" }}
                  >
                    {pillar.title}
                  </h3>
                  <p
                    className="text-[9px] sm:text-[10px] md:text-[11px] lg:text-xs leading-tight"
                    style={{ color: "rgba(255,255,255,0.92)", WebkitTextFillColor: "rgba(255,255,255,0.92)", textShadow: "0 1px 3px rgba(0,0,0,0.95)" }}
                  >
                    {pillar.desc}
                  </p>
                </div>
              ))}
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
                className="group inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#EFE6D6] hover:bg-[#F7F2EA] border border-[#B89555] text-[#1A1A1A] text-sm font-semibold tracking-tight transition-all shadow-[0_8px_28px_-8px_rgba(0,0,0,0.55)] hover:shadow-[0_12px_32px_-6px_rgba(0,0,0,0.6)]"
              >
                <span>Book a Free Consultation</span>
                <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" strokeWidth={2.25} />
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
                <Link to="/mortgage-calculator">
                  <Button size="default" className="gap-2 px-6 py-4 text-sm bg-[#1A1A1A] text-white hover:bg-[#1A1A1A]/90">
                    <Sparkles className="w-4 h-4" />
                    <span className="whitespace-nowrap">{t('home.tryOurAi', 'Try Our AI')} {t('mortgage.calculator', 'Mortgage Calculator')}</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </Button>
                </Link>

                <Link to="/partners/mortgage">
                  <Button variant="outline" size="default" className="gap-2 px-6 py-4 text-sm border-[#B89555]/40 text-[#1A1A1A] hover:bg-[#F7F2EA]">
                    <Users className="w-4 h-4 text-[#1A1A1A]/70" />
                    <span>{t('home.connectMortgagePartners', 'Connect With Mortgage Partners')}</span>
                    <ArrowUpRight className="w-4 h-4" />
                  </Button>
                </Link>
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

      {/* ElevenLabs voice concierge — floating bottom-right */}
      <Suspense fallback={null}>
        <VoiceConciergeWidget />
      </Suspense>
    </section>
  );
};

export default Index;
