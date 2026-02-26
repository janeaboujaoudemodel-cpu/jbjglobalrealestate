import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
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
  // Recognize ALL back-office routes (owner panel, listing management, broker dashboards, etc.)
  const isBackOfficeRoute = 
    location.pathname.startsWith("/admin") || 
    location.pathname.startsWith("/listing-admin") ||
    location.pathname.startsWith("/broker-dashboard");
  const isHomePage = location.pathname === "/";
  const isDetailPage = location.pathname.startsWith("/project/") || location.pathname.startsWith("/area/");
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

  // Deterministic transparent-header routing (no post-render hero probing)
  const transparentHeaderRoutes = new Set([
    '/',
    '/properties',
    '/quiz',
    '/about',
    '/team',
    '/founder',
    '/awards',
    '/developers',
    '/services',
    '/market-intelligence',
    '/broker-dashboard',
    '/broker-resources',
    '/broker-education',
    '/company-profile',
    '/investor/portfolio-views',
    '/areas',
    '/buyer-guide',
    '/rent-guide',
    '/seller-guide',
    '/landlord-guide',
    '/tenant-guide',
    '/investor-education',
    '/guides/legal',
    '/guides/golden-visa',
  ]);

  const transparentHeaderPrefixes = [
    '/developers/',
    '/project/',
    '/properties/',
    '/market-intelligence/',
    '/guides/',
    '/services/',
    '/investor/',
  ];

  const hasDarkHero = !isBackOfficeRoute && (
    transparentHeaderRoutes.has(location.pathname) ||
    transparentHeaderPrefixes.some((prefix) => location.pathname.startsWith(prefix))
  );

  // Pages with bright backgrounds need content pushed below header
  const needsHeaderSpacing = !hasDarkHero;

  // Runtime regression guard for collapsed service pages (Option B)
  useEffect(() => {
    if (isBackOfficeRoute || !location.pathname.startsWith('/services/')) return;

    const timer = window.setTimeout(async () => {
      const sections = Array.from(document.querySelectorAll('main section'));
      const contentSections = sections.slice(1);
      const hasVisibleBodySection = contentSections.some((section) => {
        if (!(section instanceof HTMLElement)) return false;
        return section.offsetHeight > 120 && section.scrollHeight > 120;
      });

      if (hasVisibleBodySection) return;

      const main = document.querySelector('main');
      if (main) {
        main.classList.add('pt-24', 'sm:pt-28', 'lg:pt-32');
        main.getBoundingClientRect();
      }

      console.error('[layout-guard] Service page visibility fallback triggered', {
        pathname: location.pathname,
        totalSections: sections.length,
      });

      try {
        const { data: authData } = await supabase.auth.getUser();
        await supabase.from('audit_logs').insert({
          user_id: authData.user?.id ?? null,
          user_email: authData.user?.email ?? null,
          action_type: 'read',
          resource_type: 'settings',
          description: 'Service layout visibility guard fallback triggered',
          details: {
            pathname: location.pathname,
            totalSections: sections.length,
            triggeredAt: new Date().toISOString(),
          },
          user_agent: navigator.userAgent,
        } as any);
      } catch (error) {
        console.warn('[layout-guard] Failed to write audit log', error);
      }
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [location.pathname, isBackOfficeRoute]);

  return (
    <div className="min-h-screen bg-black">
      <SecurityShield />
      <MarketingScripts />
      <CommandPaletteRoot />
      <GlobalHeader forceSolid={needsHeaderSpacing} />
      {/* Content spacing: dark hero pages sit behind header, bright pages pushed below */}
      <GlobalContactGating>
        <main className={`w-full max-w-full overflow-x-hidden ${needsHeaderSpacing ? "pt-24 sm:pt-28 lg:pt-32" : "pt-0"}`}>
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

