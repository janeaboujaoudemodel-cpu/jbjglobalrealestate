import { useEffect, useState, lazy, Suspense } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
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

// Eager-load shell chrome so the sidebar + utility bar paint in the same frame as the page —
// prevents the visible "page → sidebar → header" stagger on first load.
import GlobalVerticalNav from "@/components/navigation/GlobalVerticalNav";
import HorizontalUtilityBar from "@/components/navigation/HorizontalUtilityBar";
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
const VoiceConciergeWidget = lazy(() => import("@/components/VoiceConciergeWidget"));
const AIChatWidget = lazy(() => import("@/components/AIChatWidget"));
import PageNavigation from "@/components/PageNavigation";
const GlobalSupportMount = lazy(() => import("@/components/support/GlobalSupportMount"));
const MarketingScripts = lazy(() => import("@/components/marketing/MarketingScripts"));
const PopupLayer = lazy(() => import("@/components/PopupLayer"));
const CommandPaletteRoot = lazy(() => import("@/components/ui/command-palette-root"));
const GuidedTour = lazy(() => import("@/components/GuidedTour"));
const CompleteProfilePrompt = lazy(() => import("@/components/CompleteProfilePrompt"));

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
  } catch {
    // localStorage can be unavailable in restricted browser contexts.
  }
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
  const isBrokerPortalRoute = location.pathname === "/broker" || location.pathname.startsWith("/broker/");
  const usesStandalonePortalChrome = isBackOfficeRoute || isBrokerPortalRoute;
  const isServiceRoute = location.pathname.startsWith("/services/");
  const isHomePage = location.pathname === "/" || location.pathname === "/index";
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

  useEffect(() => {
    const closeTourForWebDeveloper = () => {
      completeTour();
      setShowTour(false);
    };
    window.addEventListener("jbj:webdev-open", closeTourForWebDeveloper);
    return () => window.removeEventListener("jbj:webdev-open", closeTourForWebDeveloper);
  }, [completeTour, setShowTour]);

  // Mobile: always keep chat minimized
  useEffect(() => {
    if (isMobile) {
      setIsChatCollapsed(true);
    }
  }, [isMobile]);
  const [layoutDebugSnapshot, setLayoutDebugSnapshot] = useState<ServiceLayoutSnapshot | null>(null);
  // Defer non-critical shell components briefly so homepage/sidebar/search paint first.
  const [shellReady, setShellReady] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setShellReady(true), 250);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    if (isDetailPage) {
      setIsChatCollapsed(true);
      markDailyShown();
      setShowAttentionPulse(false);
    }
  }, [isDetailPage, location.pathname]);

  useEffect(() => {
    const handleRecPopup = () => {
      setIsChatCollapsed(true);
      setShowAttentionPulse(false);
    };
    const handleOpenChatSupport = async () => {
      // Track chat support open
      try {
        const { data: { user } } = await supabase.auth.getUser();
        await supabase.from('jbj_analytics').insert({
          tool_name: 'chat_support',
          action_type: 'chat_support_opened',
          tool_category: 'support',
          user_id: user?.id || null,
          user_email: user?.email || null,
          metadata: { page: window.location.pathname, source: 'support_launcher' },
        });
      } catch {
        // Silent fail — analytics should not block UX
      }
      setPopupsReady(true);
      markDailyShown();
      setShowAttentionPulse(false);
      setIsChatCollapsed(false);
    };
    window.addEventListener('recommendation-popup-opened', handleRecPopup);
    window.addEventListener('jbj:open-chat-support', handleOpenChatSupport);
    return () => {
      window.removeEventListener('recommendation-popup-opened', handleRecPopup);
      window.removeEventListener('jbj:open-chat-support', handleOpenChatSupport);
    };
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

  const effectiveCollapsed = usesStandalonePortalChrome ? true : isChatCollapsed;
  const hasDarkHero = hasTransparentHeader(location.pathname);
  const needsHeaderSpacing = usesStandalonePortalChrome ? false : shouldAddHeaderSpacing(location.pathname);

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
    <div className="min-h-screen bg-[#F7F2EA]">
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
      {!usesStandalonePortalChrome && (
        <>
          <div data-chrome="header" className="sm:hidden">
            <GlobalHeader forceSolid={needsHeaderSpacing} />
          </div>
          <div data-chrome="sidebar" className="hidden sm:block fixed left-0 top-0 h-[100dvh] z-[9997]">
            <GlobalVerticalNav />
          </div>
          <div data-chrome="utility-bar" className="hidden sm:block">
            <HorizontalUtilityBar />
          </div>
        </>
      )}
      <GlobalContactGating>
        {/*
          Header spacing rules:
          - needsHeaderSpacing=true  → reserve 88px so non-hero pages clear the fixed header
          - needsHeaderSpacing=false → ZERO top padding so fullscreen hero pages sit flush behind
            the header (the hero element itself already reserves internal padding-top for the
            header via .jj-hero-fullscreen). This removes the champagne band that was visible
            between the header and the hero on desktop.
        */}
        <main className={`jj-main-shell w-full max-w-full overflow-x-clip bg-[#F7F2EA] min-h-screen transition-[margin-left,width,padding-top] duration-100 ease-out ${usesStandalonePortalChrome ? "jj-main-shell--standalone" : ""} ${needsHeaderSpacing && !isHomePage ? "pt-24 sm:pt-[88px] [body.jj-vertical-nav-collapsed_&]:sm:pt-[48px]" : "pt-0"}`}>
          <div data-content-gutter="1" className="w-full max-w-full">


          {layoutGuardTriggered && isServiceRoute && (
            <div role="alert" className="mx-auto mt-4 w-full max-w-6xl px-4 sm:px-6 lg:px-8">
              <div className="rounded-lg border border-destructive/30 bg-background/95 px-4 py-3 text-sm text-foreground shadow-sm backdrop-blur">
                Layout safeguard restored body visibility for this service page.
              </div>
            </div>
          )}
          {children}
          </div>
        </main>
      </GlobalContactGating>
      {/* Footer: full-bleed navy. NO left padding here so the navy background
          runs edge-to-edge underneath the fixed vertical sidebar (instead of
          leaving a champagne strip between the sidebar and the footer). The
          sidebar visually overlays the leftmost slice; footer inner content
          uses max-w-7xl mx-auto so it stays optically centered. */}
      <div data-chrome="footer" className="jj-footer-shell w-full">
        {!usesStandalonePortalChrome && !isToolkitGeneratorRoute && <Footer />}
      </div>

      {!usesStandalonePortalChrome && popupsReady && (
        <Suspense fallback={null}>
          <PopupLayer />
        </Suspense>
      )}
      {/* Page navigation arrows — visible only when chat is closed */}
      {!usesStandalonePortalChrome && <PageNavigation isChatOpen={!effectiveCollapsed} isChatMedium={showAttentionPulse && effectiveCollapsed} />}
      {!usesStandalonePortalChrome && (!isHomePage || popupsReady) && (
        <Suspense fallback={null}>
          <AIChatWidget
            isCollapsed={effectiveCollapsed}
            onToggleCollapse={handleToggleChat}
            onMinimize={handleMinimizeChat}
            showAttentionPulse={showAttentionPulse && popupsReady}
          />
        </Suspense>
      )}
      {/* VoiceConciergeWidget removed — voice access lives inside the Talk-to-us panel */}

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
      {!usesStandalonePortalChrome && (
        <Suspense fallback={null}>
          <CompleteProfilePrompt />
        </Suspense>
      )}
      {!usesStandalonePortalChrome && (
        <Suspense fallback={null}>
          <GlobalSupportMount />
        </Suspense>
      )}
    </div>
  );
};

export default MainLayout;
