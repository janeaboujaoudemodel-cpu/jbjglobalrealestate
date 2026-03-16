import { useState, lazy, Suspense, memo, useEffect, forwardRef } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

import { SEOHead, pagesSEO } from "@/components/SEOHead";
import { useLanguage } from "@/contexts/LanguageContext";
import { useUserRole } from "@/hooks/useUserRole";
import { Sparkles, ArrowUpRight, Users, Building2, Brain, Briefcase, Home, Palette, FileText, UserCircle, ChevronDown } from "lucide-react";
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
const DeveloperPortalCTA = lazy(() => import("@/components/home/DeveloperPortalCTA"));

import { PodcastVisibilityGate } from "@/components/home/PodcastVisibilityGate";
import { SectionDivider } from "@/components/ui/section-divider";

const VerificationBanner = lazy(() => import("@/components/verification/VerificationBanner"));

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
    <section className="relative w-full min-h-screen bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8]">
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
      <div className="jj-hero-fullscreen relative flex items-center justify-center overflow-hidden bg-black">
        {/* Video Background */}
        <div className="absolute inset-0 bg-black">
          <img 
            src={luxuryVillaHero} 
            alt="Luxury Dubai Real Estate" 
            className="absolute inset-0 w-full h-full object-cover"
            loading="eager"
            fetchPriority="high"
            decoding="async"
          />
          <video 
            autoPlay loop muted playsInline
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
            onCanPlay={(e) => { e.currentTarget.style.opacity = '1'; }}
            onError={(e) => { e.currentTarget.style.display = 'none'; }}
            src="https://mdafrewypkkrildjgtey.supabase.co/storage/v1/object/public/videos/hero-video.mp4"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/70 z-[2]" />
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
              className="text-[10px] sm:text-xs uppercase tracking-[0.25em] text-[hsl(var(--gold)/0.7)] mb-4"
            >
              Dubai's Trusted Real Estate Technology Platform
            </motion.p>

            {/* Main heading */}
            <motion.h1
              variants={fadeInUp}
              className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold tracking-tight leading-[1.1] mb-6"
              style={{
                background: "linear-gradient(135deg, #FFFFFF 0%, #E8DCC8 40%, #C8A766 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                fontFamily: "Poppins, sans-serif",
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
                  className="group inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-full border border-[hsl(var(--gold)/0.3)] bg-black/40 backdrop-blur-md text-white/90 text-[10px] sm:text-xs font-medium hover:bg-[hsl(var(--gold)/0.15)] hover:border-[hsl(var(--gold)/0.6)] hover:text-gold transition-all duration-300"
                >
                  <action.icon className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-gold/70 group-hover:text-gold transition-colors" />
                  {action.label}
                </Link>
              ))}
            </motion.div>

            {/* Three pillar badges */}
            <motion.div
              variants={fadeInUp}
              className="grid grid-cols-3 gap-px max-w-3xl mx-auto mb-8 border border-[hsl(var(--gold)/0.2)] overflow-hidden"
            >
              {pillars.map((pillar, i) => (
                <div
                  key={pillar.title}
                  className="bg-black/50 backdrop-blur-sm p-3 sm:p-4 text-center border-r last:border-r-0 border-[hsl(var(--gold)/0.15)]"
                >
                  <pillar.icon className="w-4 h-4 sm:w-5 sm:h-5 text-gold mx-auto mb-1.5" />
                  <h3 className="text-[10px] sm:text-xs font-semibold text-white mb-0.5">{pillar.title}</h3>
                  <p className="text-[8px] sm:text-[10px] text-zinc-400 leading-tight">{pillar.desc}</p>
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
              <span className="text-[9px] uppercase tracking-[0.2em] text-zinc-500">Explore</span>
              <ChevronDown className="w-4 h-4 text-[hsl(var(--gold)/0.5)] animate-bounce" />
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
      <Suspense fallback={<SectionLoader />}>
        <DeveloperPortalCTA />
      </Suspense>

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
      <Suspense fallback={<SectionLoader />}>
        <FeaturedListings />
      </Suspense>

      {/* CONTINUE SEARCHING */}
      <Suspense fallback={<SectionLoader />}>
        <ContinueSearching type="property" />
      </Suspense>

      {/* RESALE PROPERTIES - single divider before Starting Point */}
      <Suspense fallback={<SectionLoader />}>
        <ResalePropertiesSection />
      </Suspense>

      {/* DIVIDER — single divider (removed double) */}
      <SectionDivider fullWidth />

      {/* FIND YOUR STARTING POINT */}
      <Suspense fallback={<SectionLoader />}>
        <StartingPointSection />
      </Suspense>

      <SectionDivider fullWidth />

      {/* OVERSEAS INVESTORS */}
      <Suspense fallback={<SectionLoader />}>
        <OverseasInvestorsBanner />
      </Suspense>

      <SectionDivider fullWidth />

      {/* EXPLORE OUR GUIDES & REPORTS */}
      <Suspense fallback={<SectionLoader />}>
        <HomepageBookMarquee />
      </Suspense>

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
      <Suspense fallback={<SectionLoader />}>
        <ToolkitShowcaseCard />
      </Suspense>

      {/* AI HOME FINDER — Premium 3D Section */}
      <section className="flex items-center justify-center min-h-[340px] relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gold/8 rounded-full blur-[120px]" />
          <div className="absolute top-0 left-0 w-[300px] h-[300px] bg-gold/5 rounded-full blur-[80px]" />
          <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-gold/5 rounded-full blur-[80px]" />
          <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(hsl(var(--gold) / 0.3) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--gold) / 0.3) 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        </div>
        
        <div className="container mx-auto px-4 relative z-10" style={{ perspective: '1200px' }}>
          <div className="flex justify-center">
            <motion.div
              initial={{ opacity: 0, y: 30, rotateX: 8 }}
              whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              whileHover={{ y: -6, rotateX: -2, scale: 1.01 }}
              className="text-center relative"
              style={{ transformStyle: 'preserve-3d' }}
            >
              {/* Premium multi-layer glow */}
              <div className="absolute inset-0 -m-8 md:-m-12 rounded-3xl bg-gold/12 blur-[50px]" />
              <div className="absolute inset-0 -m-4 md:-m-6 rounded-3xl bg-gold/10 blur-2xl" />
              
              {/* Card with premium 3D glassmorphism */}
              <div 
                className="relative z-10 bg-gradient-to-br from-zinc-900/95 via-black/95 to-zinc-800/95 backdrop-blur-xl rounded-2xl px-8 md:px-14 py-8 md:py-10 border border-gold/30"
                style={{
                  boxShadow: '0 0 60px hsl(var(--gold) / 0.25), 0 0 120px hsl(var(--gold) / 0.1), 0 30px 80px rgba(0,0,0,0.5), inset 0 1px 0 hsl(var(--gold) / 0.15), inset 0 -1px 0 rgba(0,0,0,0.3)',
                  transform: 'translateZ(20px)',
                }}
              >
                {/* Top shine line */}
                <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-gold/60 to-transparent" />
                {/* Bottom reflection */}
                <div className="absolute bottom-0 left-12 right-12 h-px bg-gradient-to-r from-transparent via-gold/20 to-transparent" />
                
                {/* Gold label badge */}
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gold/15 border border-gold/30 text-gold text-xs uppercase tracking-[0.2em] mb-5">
                  <Sparkles className="w-3 h-3" />
                  {t('home.aiPowered', 'AI-Powered')}
                </div>
                <Link to="/quiz" className="block group">
                  <div className="flex items-center justify-center gap-3 mb-3">
                    <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-br from-gold/20 to-gold/10 border border-gold/30 flex items-center justify-center shadow-[0_0_30px_hsl(var(--gold)_/_0.25)] group-hover:shadow-[0_0_50px_hsl(var(--gold)_/_0.4)] transition-all duration-500">
                      <Sparkles className="w-6 h-6 md:w-7 md:h-7 text-gold group-hover:text-gold-light transition-colors" strokeWidth={1.5} />
                    </div>
                    <h2 
                      className="text-2xl md:text-4xl lg:text-5xl font-bold tracking-wide bg-gradient-to-r from-gold via-[#E8DCC8] to-gold bg-clip-text text-transparent group-hover:from-gold-light group-hover:to-gold transition-all duration-500" 
                      style={{ fontFamily: "Poppins, sans-serif" }}
                    >
                      {t('hero.aiFinder')}
                    </h2>
                    <ArrowUpRight className="w-6 h-6 md:w-8 md:h-8 text-gold group-hover:text-gold-light group-hover:translate-x-1 group-hover:-translate-y-1 transition-all duration-300" />
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
      <section>
        <div className="jj-layer-2">
          <Suspense fallback={<SectionLoader />}>
            <AIComparisonWidget />
          </Suspense>
        </div>
      </section>

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

      <SectionDivider fullWidth />

      <Suspense fallback={<SectionLoader />}>
        <WhyDubaiCapitalSection />
      </Suspense>

      <PodcastVisibilityGate>
        <SectionDivider fullWidth />
        <Suspense fallback={<SectionLoader />}>
          <JBJPodcastSection />
        </Suspense>
      </PodcastVisibilityGate>

      <SectionDivider fullWidth />

      <Suspense fallback={<SectionLoader />}>
        <BestIdeaAward />
      </Suspense>

      <SectionDivider fullWidth />

      <Suspense fallback={<SectionLoader />}>
        <WhyChooseUs />
      </Suspense>

      <SectionDivider fullWidth />

      <Suspense fallback={<SectionLoader />}>
        <AreasWeCover />
      </Suspense>

      <SectionDivider fullWidth />

      <Suspense fallback={<SectionLoader />}>
        <TestimonialsSection />
      </Suspense>

      <SectionDivider fullWidth />

      <Suspense fallback={<SectionLoader />}>
        <StatsCounter />
      </Suspense>

      <SectionDivider fullWidth />

      <Suspense fallback={<SectionLoader />}>
        <SupportTicketBox />
      </Suspense>

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
