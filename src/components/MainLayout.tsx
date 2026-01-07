import { useEffect, useState, useRef, useCallback } from "react";
import { useLocation } from "react-router-dom";
import GlobalHeader from "@/components/GlobalHeader";
import VoiceConciergeWidget from "@/components/VoiceConciergeWidget";
import AIChatWidget from "@/components/AIChatWidget";
import InstallAppButton from "@/components/InstallAppButton";
import MarketingScripts from "@/components/marketing/MarketingScripts";
import { useLanguage } from "@/contexts/LanguageContext";
import { useIsMobile } from "@/hooks/use-mobile";

const CHAT_AUTO_EXPAND_DELAY = 15000; // 15 seconds
const CHAT_SESSION_KEY = "jj_chat_auto_shown";

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const { isRTL } = useLanguage();
  const isMobile = useIsMobile();
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");

  // Always start collapsed – chat is an overlay, never pushes content
  const [isChatCollapsed, setIsChatCollapsed] = useState(true);
  const [showAttentionPulse, setShowAttentionPulse] = useState(false);
  const autoExpandTriggeredRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Check if we already auto-expanded this session
  const hasAutoShown = () => {
    try {
      return sessionStorage.getItem(CHAT_SESSION_KEY) === "1";
    } catch {
      return false;
    }
  };

  const markAutoShown = () => {
    try {
      sessionStorage.setItem(CHAT_SESSION_KEY, "1");
    } catch {
      // silent
    }
  };

  const triggerAutoExpand = useCallback(() => {
    if (autoExpandTriggeredRef.current || hasAutoShown() || isAdminRoute) return;
    autoExpandTriggeredRef.current = true;
    markAutoShown();
    setShowAttentionPulse(true);
    // Don't auto-open the full panel; just show an attractive pulse on the button
    // The user decides to click. This is less intrusive.
  }, [isAdminRoute]);

  // Timer-based trigger
  useEffect(() => {
    if (isAdminRoute || hasAutoShown()) return;

    timerRef.current = setTimeout(() => {
      triggerAutoExpand();
    }, CHAT_AUTO_EXPAND_DELAY);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isAdminRoute, triggerAutoExpand]);

  // Exit-intent detection (mouse leaves viewport at top)
  useEffect(() => {
    if (isMobile || isAdminRoute || hasAutoShown()) return;

    const handleMouseLeave = (e: MouseEvent) => {
      // If mouse exits near the top of the page (likely closing tab / navigating away)
      if (e.clientY <= 5) {
        triggerAutoExpand();
      }
    };

    document.addEventListener("mouseleave", handleMouseLeave);
    return () => document.removeEventListener("mouseleave", handleMouseLeave);
  }, [isMobile, isAdminRoute, triggerAutoExpand]);

  // When user interacts with chat, clear the pulse
  const handleToggleChat = () => {
    setShowAttentionPulse(false);
    setIsChatCollapsed((v) => !v);
  };

  // Chat is always an overlay – no content pushing
  // effectiveCollapsed only controls whether the panel is shown or not
  const effectiveCollapsed = isMobile || isAdminRoute ? true : isChatCollapsed;

  return (
    <div className="min-h-screen bg-black">
      <MarketingScripts />
      <GlobalHeader />
      {/* No padding adjustment – chat overlays content */}
      <main className="pt-16 lg:pt-18">
        {children}
      </main>
      <InstallAppButton />
      <VoiceConciergeWidget />
      {!isAdminRoute && (
        <AIChatWidget
          isCollapsed={effectiveCollapsed}
          onToggleCollapse={handleToggleChat}
          showAttentionPulse={showAttentionPulse}
        />
      )}
    </div>
  );
};

export default MainLayout;

