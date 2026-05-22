import { useEffect, useState, lazy, Suspense } from "react";
import { useLocation } from "react-router-dom";
import {
  hasTransparentHeader,
  isBackOfficeRoute as isBackOfficePath,
  needsHeaderSpacing as shouldAddHeaderSpacing,
} from "@/config/mainLayoutRoutes";
import {
  getServiceLayoutSnapshot,
  hasVisibleServiceBody,
  type ServiceLayoutSnapshot,
} from "@/lib/serviceLayoutGuard";
import GlobalHeader from "@/components/GlobalHeader";
import { useLanguage } from "@/contexts/LanguageContext";
import Footer from "@/components/home/MinimalFooter";
import SecurityShield from "@/components/SecurityShield";

const GlobalVerticalNav = lazy(() => import("@/components/navigation/GlobalVerticalNav"));
const HorizontalUtilityBar = lazy(() => import("@/components/navigation/HorizontalUtilityBar"));
// GlobalFilterBar is now embedded inside HorizontalUtilityBar
import CombinedContactNewsletter from "@/components/CombinedContactNewsletter";
import AuditorReadOnlyBanner from "@/components/AuditorReadOnlyBanner";
import GlobalContactGating from "@/components/GlobalContactGating";
import { useIsMobile } from "@/hooks/use-mobile";
import { useOnboardingTour } from "@/hooks/use-onboarding-tour";
import { useActivityTracker } from "@/hooks/useActivityTracker";
import { useVisitorTracking } from "@/hooks/useVisitorTracking";
import { useAntiCapture } from "@/hooks/useAntiCapture";
import { useAuditorTracking } from "@/hooks/useAuditorTracking";

const AuditorFeedbackButton = lazy(() => import("@/components/auditor/AuditorFeedbackButton"));

// Lazy-load non-critical components to reduce initial bundle
const AIChatWidget = lazy(() => import("@/components/AIChatWidget"));
const VoiceConciergeWidget = lazy(() => import("@/components/VoiceConciergeWidget"));
import PageNavigation from "@/components/PageNavigation";
const MarketingScripts = lazy(() => import("@/components/marketing/MarketingScripts"));
const PopupLayer = lazy(() => import("@/components/PopupLayer"));
const CommandPaletteRoot = lazy(() => import("@/components/ui/command-palette-root"));
const GuidedTour = lazy(() => import("@/components/GuidedTour"));

const CHAT_DAILY_KEY = "jj_chat_daily_shown";
const SCROLL_DELAY_MS = 1500;

const hasDailyShown = (): boolean => {
  try {
    const stored = localStorage.getItem(CHAT_DAILY_KEY);
    if (!stored) return false;
    return stored === new Date().toDateString();
  } catch {
    return false;
  }
};

const markDailyShown = () => {
  try {
    localStorage.setItem(CHAT_DAILY_KEY, new Date().toDateString());
  } catch {}
};

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const { isRTL } = useLanguage();
  const isMobile = useIsMobile();
  const location = useLocation();
  const { trackPageVisit } = useActivityTracker();
  useVisitorTracking();
  useAntiCapture();
  useAuditorTracking();

  // Track page visits on route change
  useEffect(() => { trackPageVisit(); }, [location.pathname, trackPageVisit]);
  const isBackOfficeRoute = isBackOfficePath(location.pathname);
  const isServiceRoute = location.pathname.startsWith("/services/");
  const isHomePage = location.pathname === "/";
  const isDetailPage =
    location.pathname.startsWith("/project/") ||
    location.pathname.startsWith("/area/");
  const showLayoutDebug =
    isServiceRoute &&
    new URLSearchParams(location.search).get("layoutDebug") === "1";

  const isToolkitGeneratorRoute =
    location.pathname === '/toolkit/stamp-generator' ||
    location.pathname.startsWith('/toolkit/stamp-generator/') ||
    (location.pathname.startsWith('/toolkit/') && (
      location.pathname.includes('/generate') ||
      location.pathname.includes('/export') ||
      location.pathname.includes('/new')
    ));

  const { showTour, setShowTour, completeTour } = useOnboardingTour();
  const [isChatCollapsed, setIsChatCollapsed] = useState(true);
  const [layoutGuardTriggered, setLayoutGuardTriggered] = useState(false);

  // Mobile: always keep chat minimized
  useEffect(() => {
    if (isMobile) {
      setIsChatCollapsed(true);
    }
  }, [isMobile]);
  const [layoutDebugSnapshot, setLayoutDebugSnapshot] = useState<ServiceLayoutSnapshot | null>(null);
  // Defer non-critical shell components by 1s (reduced from 2s for faster perceived load)
  const [shellReady, setShellReady] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setShellReady(true), 1000);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    if (isDetailPage) {
      setIsChatCollapsed(true);
      markDailyShown();
      setShowAttentionPulse(false);
    }
  }, [location.pathname]);

  useEffect(() => {
    const handleRecPopup = () => {
      setIsChatCollapsed(true);
      setShowAttentionPulse(false);
    };
    window.addEventListener('recommendation-popup-opened', handleRecPopup);
    return () => window.removeEventListener('recommendation-popup-opened', handleRecPopup);
  }, []);

  const [showAttentionPulse, setShowAttentionPulse] = useState(false);
  const [popupsReady, setPopupsReady] = useState(!isHomePage);

  useEffect(() => {
    if (isBackOfficeRoute) return;
    if (!isHomePage) {
      setPopupsReady(true);
      if (!hasDailyShown()) setShowAttentionPulse(true);
      return;
    }
    let scrollTimer: number | undefined;
    let hasTriggered = false;
    const handleScroll = () => {
      if (hasTriggered) return;
      if (window.scrollY > window.innerHeight * 0.5) {
        hasTriggered = true;
        scrollTimer = window.setTimeout(() => {
          setPopupsReady(true);
          if (!hasDailyShown()) setShowAttentionPulse(true);
        }, SCROLL_DELAY_MS);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimer) window.clearTimeout(scrollTimer);
    };
  }, [isHomePage, isBackOfficeRoute]);

  const handleToggleChat = () => {
    markDailyShown();
    setShowAttentionPulse(false);
    setIsChatCollapsed((v) => !v);
  };

  const handleMinimizeChat = () => {
    markDailyShown();
    setShowAttentionPulse(false);
  };

  const effectiveCollapsed = isBackOfficeRoute ? true : isChatCollapsed;
  const hasDarkHero = hasTransparentHeader(location.pathname);
  const needsHeaderSpacing = shouldAddHeaderSpacing(location.pathname);

  useEffect(() => {
    if (isBackOfficeRoute || !isServiceRoute) {
      setLayoutGuardTriggered(false);
      return;
    }
    const timer = window.setTimeout(() => {
      const snapshot = getServiceLayoutSnapshot();
      if (hasVisibleServiceBody(snapshot)) {
        setLayoutGuardTriggered(false);
        return;
      }
      const main = document.querySelector('main');
      if (main instanceof HTMLElement) {
        main.style.paddingTop = '6rem';
        main.style.minHeight = '100vh';
        main.getBoundingClientRect();
      }
      window.dispatchEvent(new Event('resize'));
      setLayoutGuardTriggered(true);
    }, 1000);
    return () => window.clearTimeout(timer);
  }, [isBackOfficeRoute, isServiceRoute, location.pathname]);

  useEffect(() => {
    if (!showLayoutDebug) { setLayoutDebugSnapshot(null); return; }
    const syncSnapshot = () => setLayoutDebugSnapshot(getServiceLayoutSnapshot());
    syncSnapshot();
    window.addEventListener('scroll', syncSnapshot, { passive: true });
    window.addEventListener('resize', syncSnapshot);
    return () => {
      window.removeEventListener('scroll', syncSnapshot);
      window.removeEventListener('resize', syncSnapshot);
    };
  }, [showLayoutDebug, location.pathname]);

  return (
    <div className="min-h-screen bg-background md:bg-[#FDFBF7]">
      <AuditorReadOnlyBanner />
      {/* Mobile Desktop Banner */}
      {/* Desktop banner removed — now only shows as bottom toast */}
      {/* Defer non-critical shell components */}
      {shellReady && (
        <Suspense fallback={null}>
          <SecurityShield />
          <MarketingScripts />
          <CommandPaletteRoot />
        </Suspense>
      )}
      {/* Compact phone (<640): mobile header | Tablet/desktop (sm 640px+): reference L-shape sidebar + utility bar */}
      <div data-chrome="header" className="sm:hidden">
        <GlobalHeader forceSolid={needsHeaderSpacing} />
      </div>
      <>
        <div data-chrome="sidebar" className="hidden sm:block fixed left-0 top-0 h-screen z-[9997]">
          <Suspense fallback={
            <div
              aria-hidden="true"
              className="h-screen bg-gradient-to-b from-[#F7F1E6] to-[#ECE2D2] border-r border-[hsl(var(--gold)/0.25)] [body.jj-vertical-nav-active_&]:w-[200px] [body.jj-vertical-nav-collapsed_&]:w-[48px] w-[200px]"
            />
          }>
            <GlobalVerticalNav />
          </Suspense>
        </div>
        <div data-chrome="utility-bar" className="hidden sm:block">
          <Suspense fallback={
            <div
              aria-hidden="true"
              className="fixed top-0 right-0 h-[88px] z-[9998] bg-gradient-to-r from-[#F7F1E6] via-[#ECE2D2] to-[#D8C7A6] border-b border-[hsl(var(--gold)/0.25)] shadow-[0_1px_3px_hsl(var(--gold)/0.12)] [body.jj-vertical-nav-active_&]:left-[200px] [body.jj-vertical-nav-collapsed_&]:left-[48px] left-[200px]"
            />
          }>
            <HorizontalUtilityBar />
          </Suspense>
        </div>
      </>
      <GlobalContactGating>
        <main className={`w-full max-w-full overflow-x-hidden bg-background transition-all duration-300 [body.jj-vertical-nav-active_&]:sm:pl-[200px] [body.jj-vertical-nav-collapsed_&]:sm:pl-[48px] ${needsHeaderSpacing ? "pt-24 sm:pt-[88px]" : "sm:pt-[88px] pt-0"}`}>

          {layoutGuardTriggered && isServiceRoute && (
            <div role="alert" className="mx-auto mt-4 w-full max-w-6xl px-4 sm:px-6 lg:px-8">
              <div className="rounded-lg border border-destructive/30 bg-background/95 px-4 py-3 text-sm text-foreground shadow-sm backdrop-blur">
                Layout safeguard restored body visibility for this service page.
              </div>
            </div>
          )}
          {children}
        </main>
      </GlobalContactGating>
      <div data-chrome="footer" className="[body.jj-vertical-nav-active_&]:sm:pl-[200px] [body.jj-vertical-nav-collapsed_&]:sm:pl-[48px]">
        {!isBackOfficeRoute && !isToolkitGeneratorRoute && <Footer />}
      </div>
      {popupsReady && (
        <Suspense fallback={null}>
          <PopupLayer />
        </Suspense>
      )}
      {/* Page navigation arrows — visible only when chat is closed */}
      <PageNavigation isChatOpen={!effectiveCollapsed} isChatMedium={showAttentionPulse && effectiveCollapsed} />
      {!isBackOfficeRoute && (!isHomePage || popupsReady) && (
        <Suspense fallback={null}>
          <AIChatWidget
            isCollapsed={effectiveCollapsed}
            onToggleCollapse={handleToggleChat}
            onMinimize={handleMinimizeChat}
            showAttentionPulse={showAttentionPulse && popupsReady}
          />
        </Suspense>
      )}
      {!isBackOfficeRoute && (
        <Suspense fallback={null}>
          <VoiceConciergeWidget />
        </Suspense>
      )}
      {showLayoutDebug && layoutDebugSnapshot && (
        <div
          data-testid="layout-debug-overlay"
          className="fixed bottom-4 right-4 z-[120] w-72 rounded-xl border border-border bg-background/95 p-3 text-xs text-foreground shadow-xl backdrop-blur"
        >
          <p className="font-semibold">Service Layout Debug</p>
          <p className="mt-1">Path: {layoutDebugSnapshot.pathname}</p>
          <p>Scroll: {layoutDebugSnapshot.scrollPercent}%</p>
          <p>Main height: {layoutDebugSnapshot.mainHeight}px</p>
          {layoutDebugSnapshot.bodySections.map((section) => (
            <p key={section.id}>{section.id}: {section.offsetHeight}px</p>
          ))}
        </div>
      )}
      <Suspense fallback={null}>
        <AuditorFeedbackButton />
      </Suspense>
      <Suspense fallback={null}>
        <GuidedTour
          isOpen={showTour}
          onClose={() => { completeTour(); setShowTour(false); }}
        />
      </Suspense>
    </div>
  );
};

export default MainLayout;
