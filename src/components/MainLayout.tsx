import { useEffect, useState, lazy, Suspense, useCallback } from "react";
import { toast } from "sonner";
import { Monitor, X } from "lucide-react";
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
import Footer from "@/components/Footer";

const GlobalVerticalNav = lazy(() => import("@/components/navigation/GlobalVerticalNav"));
const HorizontalUtilityBar = lazy(() => import("@/components/navigation/HorizontalUtilityBar"));
import CombinedContactNewsletter from "@/components/CombinedContactNewsletter";
import GlobalContactGating from "@/components/GlobalContactGating";
import { useIsMobile } from "@/hooks/use-mobile";
import { useOnboardingTour } from "@/hooks/use-onboarding-tour";
import { useActivityTracker } from "@/hooks/useActivityTracker";
import { useVisitorTracking } from "@/hooks/useVisitorTracking";

// Lazy-load non-critical components to reduce initial bundle
const AIChatWidget = lazy(() => import("@/components/AIChatWidget"));
const MarketingScripts = lazy(() => import("@/components/marketing/MarketingScripts"));
const SecurityShield = lazy(() => import("@/components/SecurityShield"));
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
    location.pathname.startsWith('/toolkit/stamp-generator/') ||
    location.pathname.startsWith('/toolkit/') && (
      location.pathname.includes('/generate') ||
      location.pathname.includes('/export') ||
      location.pathname.includes('/new')
    );

  const { showTour, setShowTour, completeTour } = useOnboardingTour();
  const [isChatCollapsed, setIsChatCollapsed] = useState(true);
  const [layoutGuardTriggered, setLayoutGuardTriggered] = useState(false);

  // Mobile: always keep chat minimized. Desktop: auto-minimize after 8s
  useEffect(() => {
    if (isMobile) {
      setIsChatCollapsed(true);
      return;
    }
    if (!isChatCollapsed) {
      const timer = window.setTimeout(() => setIsChatCollapsed(true), 8000);
      return () => window.clearTimeout(timer);
    }
  }, [isChatCollapsed, isMobile]);
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

  // Mobile desktop recommendation banner
  const [showDesktopBanner, setShowDesktopBanner] = useState(() => {
    if (typeof window === 'undefined') return false;
    return !sessionStorage.getItem('jj_desktop_banner_dismissed');
  });

  useEffect(() => {
    if (isMobile && showDesktopBanner) {
      toast("For the best experience, we recommend using a desktop browser.", {
        icon: <Monitor className="w-4 h-4 text-gold" />,
        duration: 6000,
      });
    }
  }, [isMobile, showDesktopBanner]);

  const dismissDesktopBanner = useCallback(() => {
    setShowDesktopBanner(false);
    try { sessionStorage.setItem('jj_desktop_banner_dismissed', '1'); } catch {}
  }, []);

  return (
    <div className="min-h-screen bg-black">
      {/* Mobile Desktop Banner */}
      {isMobile && showDesktopBanner && (
        <div className="fixed top-0 left-0 right-0 z-[10001] bg-gradient-to-r from-[#FDFBF7] to-[#EDE4D3] border-b border-gold/30 px-4 py-2.5 flex items-center gap-3 shadow-md">
          <Monitor className="w-4 h-4 text-gold flex-shrink-0" />
          <p className="text-xs text-black/80 flex-1">For the best experience on our full portal, use a desktop browser.</p>
          <button onClick={dismissDesktopBanner} className="w-5 h-5 rounded-full bg-gold/10 flex items-center justify-center flex-shrink-0">
            <X className="w-3 h-3 text-gold" />
          </button>
        </div>
      )}
      {/* Defer non-critical shell components */}
      {shellReady && (
        <Suspense fallback={null}>
          <SecurityShield />
          <MarketingScripts />
          <CommandPaletteRoot />
        </Suspense>
      )}
      {/* Mobile: horizontal header | Desktop: vertical sidebar */}
      <div className="lg:hidden">
        <GlobalHeader forceSolid={needsHeaderSpacing} />
      </div>
      {!isBackOfficeRoute && (
        <>
          <div className="hidden lg:block fixed left-0 top-0 h-screen z-[9997]">
            <Suspense fallback={null}>
              <GlobalVerticalNav />
            </Suspense>
          </div>
          <Suspense fallback={null}>
            <HorizontalUtilityBar />
          </Suspense>
        </>
      )}
      <GlobalContactGating>
        <main className={`w-full max-w-full overflow-x-hidden ${!isBackOfficeRoute ? "[body.jj-vertical-nav-active_&]:lg:pl-[200px] [body.jj-vertical-nav-collapsed_&]:lg:pl-[48px]" : ""} ${needsHeaderSpacing ? "pt-24 sm:pt-28 lg:pt-[40px]" : "lg:pt-[40px] pt-0"}`}>
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
      <div className={!isBackOfficeRoute ? "[body.jj-vertical-nav-active_&]:lg:pl-[200px] [body.jj-vertical-nav-collapsed_&]:lg:pl-[48px]" : ""}>
        {!isBackOfficeRoute && !isToolkitGeneratorRoute && <CombinedContactNewsletter />}
        {!isBackOfficeRoute && !isToolkitGeneratorRoute && <Footer />}
      </div>
      {popupsReady && (
        <Suspense fallback={null}>
          <PopupLayer />
        </Suspense>
      )}
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
        <GuidedTour
          isOpen={showTour}
          onClose={() => { completeTour(); setShowTour(false); }}
        />
      </Suspense>
    </div>
  );
};

export default MainLayout;
