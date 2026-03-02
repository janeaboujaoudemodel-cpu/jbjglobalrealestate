import { useEffect, useState } from "react";
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
import AIChatWidget from "@/components/AIChatWidget";
import MarketingScripts from "@/components/marketing/MarketingScripts";
import SecurityShield from "@/components/SecurityShield";
import PopupLayer from "@/components/PopupLayer";
import CommandPaletteRoot from "@/components/ui/command-palette-root";
import GuidedTour from "@/components/GuidedTour";
import { useLanguage } from "@/contexts/LanguageContext";
import NewsletterBand from "@/components/NewsletterBand";
import Footer from "@/components/Footer";
import DirectContactCTA from "@/components/DirectContactCTA";
import CombinedContactNewsletter from "@/components/CombinedContactNewsletter";
import GlobalContactGating from "@/components/GlobalContactGating";
import { useIsMobile } from "@/hooks/use-mobile";
import { useOnboardingTour } from "@/hooks/use-onboarding-tour";

const CHAT_DAILY_KEY = "jj_chat_daily_shown";
const SCROLL_DELAY_MS = 3500; // 3.5 seconds after scroll past hero

// Check if today's date was already shown
const hasDailyShown = (): boolean => {
  try {
    const stored = localStorage.getItem(CHAT_DAILY_KEY);
    if (!stored) return false;
    const today = new Date().toDateString();
    return stored === today;
  } catch {
    return false;
  }
};

// Mark today as shown
const markDailyShown = () => {
  try {
    localStorage.setItem(CHAT_DAILY_KEY, new Date().toDateString());
  } catch {
    // silent
  }
};

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const { isRTL } = useLanguage();
  const isMobile = useIsMobile();
  const location = useLocation();
  const isBackOfficeRoute = isBackOfficePath(location.pathname);
  const isServiceRoute = location.pathname.startsWith("/services/");
  const isHomePage = location.pathname === "/";
  const isDetailPage =
    location.pathname.startsWith("/project/") ||
    location.pathname.startsWith("/area/");
  const showLayoutDebug =
    isServiceRoute &&
    new URLSearchParams(location.search).get("layoutDebug") === "1";

  // Toolkit generator routes are full-screen app experiences — suppress Footer & CTA
  const isToolkitGeneratorRoute =
    location.pathname.startsWith('/toolkit/stamp-generator/') ||
    location.pathname.startsWith('/toolkit/') && (
      location.pathname.includes('/generate') ||
      location.pathname.includes('/export') ||
      location.pathname.includes('/new')
    );

  // Onboarding tour for tablets
  const { showTour, setShowTour, completeTour } = useOnboardingTour();

  // Chat collapsed state - always start collapsed
  const [isChatCollapsed, setIsChatCollapsed] = useState(true);

  // Layout safeguard state (only used if service body collapses unexpectedly)
  const [layoutGuardTriggered, setLayoutGuardTriggered] = useState(false);
  const [layoutDebugSnapshot, setLayoutDebugSnapshot] =
    useState<ServiceLayoutSnapshot | null>(null);

  // Auto-collapse chat when navigating to project/area detail pages
  useEffect(() => {
    if (isDetailPage) {
      setIsChatCollapsed(true);
      markDailyShown();
      setShowAttentionPulse(false);
    }
  }, [location.pathname]);

  // Auto-collapse chat when recommendation popup opens
  useEffect(() => {
    const handleRecPopup = () => {
      setIsChatCollapsed(true);
      setShowAttentionPulse(false);
    };
    window.addEventListener('recommendation-popup-opened', handleRecPopup);
    return () => window.removeEventListener('recommendation-popup-opened', handleRecPopup);
  }, []);

  // Show attention pulse only after scroll delay on homepage, or immediately on other pages
  const [showAttentionPulse, setShowAttentionPulse] = useState(false);
  // Track if popups should be visible (delayed on homepage until user scrolls past hero)
  const [popupsReady, setPopupsReady] = useState(!isHomePage);

  // On homepage: wait for user to scroll past hero section, then delay 3.5s before showing popups/pulse
  useEffect(() => {
    if (isBackOfficeRoute) return;

    // Not on homepage - show immediately
    if (!isHomePage) {
      setPopupsReady(true);
      if (!hasDailyShown()) {
        setShowAttentionPulse(true);
      }
      return;
    }

    // On homepage - wait for scroll past hero (~100vh)
    let scrollTimer: number | undefined;
    let hasTriggered = false;

    const handleScroll = () => {
      if (hasTriggered) return;

      // Hero section is roughly viewport height
      const heroHeight = window.innerHeight;
      if (window.scrollY > heroHeight * 0.5) {
        hasTriggered = true;

        // Wait 3.5 seconds after scrolling past hero
        scrollTimer = window.setTimeout(() => {
          setPopupsReady(true);
          if (!hasDailyShown()) {
            setShowAttentionPulse(true);
          }
        }, SCROLL_DELAY_MS);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimer) window.clearTimeout(scrollTimer);
    };
  }, [isHomePage, isBackOfficeRoute]);

  // When user interacts with chat, mark daily shown and clear the pulse immediately
  const handleToggleChat = () => {
    // Always mark as shown and clear pulse when user interacts with chat
    markDailyShown();
    setShowAttentionPulse(false);
    setIsChatCollapsed((v) => !v);
  };

  // Minimize without opening chat (for mobile medium box)
  const handleMinimizeChat = () => {
    markDailyShown();
    setShowAttentionPulse(false);
    // Keep collapsed, just remove the pulse
  };

  // Chat is always an overlay – no content pushing
  const effectiveCollapsed = isBackOfficeRoute ? true : isChatCollapsed;

  // Deterministic, route-only layout mode (no DOM probing / no state flip)
  const hasDarkHero = hasTransparentHeader(location.pathname);
  const needsHeaderSpacing = shouldAddHeaderSpacing(location.pathname);

  // Runtime safeguard (no backend writes): recover if all service body sections collapse to 0-height
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

      console.error('[layout-guard] Service layout recovered after collapsed body detection', {
        pathname: location.pathname,
        heroSections: snapshot.heroSections.length,
        bodySections: snapshot.bodySections.length,
      });
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [isBackOfficeRoute, isServiceRoute, location.pathname]);

  // Optional debug overlay for proofing: /services/...?...&layoutDebug=1
  useEffect(() => {
    if (!showLayoutDebug) {
      setLayoutDebugSnapshot(null);
      return;
    }

    const syncSnapshot = () => {
      setLayoutDebugSnapshot(getServiceLayoutSnapshot());
    };

    syncSnapshot();
    window.addEventListener('scroll', syncSnapshot, { passive: true });
    window.addEventListener('resize', syncSnapshot);

    return () => {
      window.removeEventListener('scroll', syncSnapshot);
      window.removeEventListener('resize', syncSnapshot);
    };
  }, [showLayoutDebug, location.pathname]);

  return (
    <div className="min-h-screen bg-black">
      <SecurityShield />
      <MarketingScripts />
      <CommandPaletteRoot />
      <GlobalHeader forceSolid={needsHeaderSpacing} />
      {/* Content spacing: dark hero pages sit behind header, bright pages pushed below */}
      <GlobalContactGating>
        <main className={`w-full max-w-full overflow-x-hidden ${needsHeaderSpacing ? "pt-24 sm:pt-28 lg:pt-32" : "pt-0"}`}>
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
      {/* Global Contact + Newsletter Section - combined for all public pages */}
      {!isBackOfficeRoute && !isToolkitGeneratorRoute && (
        <CombinedContactNewsletter />
      )}
      {/* Global Footer - rendered centrally */}
      {!isBackOfficeRoute && !isToolkitGeneratorRoute && <Footer />}
      {/* All popups rendered centrally - only when ready */}
      {popupsReady && <PopupLayer />}
      {/* Chat widget hidden on homepage first fold, visible after scroll */}
      {!isBackOfficeRoute && (!isHomePage || popupsReady) && (
        <AIChatWidget
          isCollapsed={effectiveCollapsed}
          onToggleCollapse={handleToggleChat}
          onMinimize={handleMinimizeChat}
          showAttentionPulse={showAttentionPulse && popupsReady}
        />
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
            <p key={section.id}>
              {section.id}: {section.offsetHeight}px
            </p>
          ))}
        </div>
      )}
      {/* Guided Tour for tablet users */}
      <GuidedTour 
        isOpen={showTour} 
        onClose={() => {
          completeTour();
          setShowTour(false);
        }} 
      />
    </div>
  );
};

export default MainLayout;

