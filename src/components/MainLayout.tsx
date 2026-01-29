import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import GlobalHeader from "@/components/GlobalHeader";
import AIChatWidget from "@/components/AIChatWidget";
import MarketingScripts from "@/components/marketing/MarketingScripts";
import SecurityShield from "@/components/SecurityShield";
import PopupLayer from "@/components/PopupLayer";
import CommandPaletteRoot from "@/components/ui/command-palette-root";
import { useLanguage } from "@/contexts/LanguageContext";
import { useIsMobile } from "@/hooks/use-mobile";

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
  const isAdminRoute = location.pathname.startsWith("/admin");
  const isHomePage = location.pathname === "/";

  // Chat collapsed state - always start collapsed
  const [isChatCollapsed, setIsChatCollapsed] = useState(true);
  // Show attention pulse only after scroll delay on homepage, or immediately on other pages
  const [showAttentionPulse, setShowAttentionPulse] = useState(false);
  // Track if popups should be visible (delayed on homepage until user scrolls past hero)
  const [popupsReady, setPopupsReady] = useState(!isHomePage);

  // On homepage: wait for user to scroll past hero section, then delay 3.5s before showing popups/pulse
  useEffect(() => {
    if (isAdminRoute) return;
    
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
  }, [isHomePage, isAdminRoute]);

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
  const effectiveCollapsed = isAdminRoute ? true : isChatCollapsed;

  // Determine if page has a dark hero that can use transparent header
  // These pages have full-screen dark heroes where content should sit behind header
  const darkHeroPages = ['/', '/properties', '/quiz', '/about', '/team', '/founder', '/awards', '/join'];
  const hasDarkHero = darkHeroPages.includes(location.pathname) || 
                      location.pathname.startsWith('/developers/') ||
                      location.pathname.startsWith('/project/') ||
                      location.pathname.startsWith('/properties/');
  
  // Pages with bright backgrounds need content pushed below header
  const needsHeaderSpacing = !hasDarkHero;

  return (
    <div className="min-h-screen bg-black">
      <SecurityShield />
      <MarketingScripts />
      <CommandPaletteRoot />
      <GlobalHeader forceSolid={needsHeaderSpacing} />
      {/* Content spacing: dark hero pages sit behind header, bright pages pushed below */}
      <main className={needsHeaderSpacing ? "pt-20 sm:pt-24 lg:pt-28" : "pt-0"}>
        {children}
      </main>
      {/* All popups rendered centrally - only when ready */}
      {popupsReady && <PopupLayer />}
      {!isAdminRoute && popupsReady && (
        <AIChatWidget
          isCollapsed={effectiveCollapsed}
          onToggleCollapse={handleToggleChat}
          onMinimize={handleMinimizeChat}
          showAttentionPulse={showAttentionPulse}
        />
      )}
    </div>
  );
};

export default MainLayout;

