import { useEffect, useState, useRef, useCallback } from "react";
import { useLocation } from "react-router-dom";
import GlobalHeader from "@/components/GlobalHeader";
import AIChatWidget from "@/components/AIChatWidget";
import MarketingScripts from "@/components/marketing/MarketingScripts";
import SecurityShield from "@/components/SecurityShield";
import PopupLayer from "@/components/PopupLayer";
import { useLanguage } from "@/contexts/LanguageContext";
import { useIsMobile } from "@/hooks/use-mobile";

const CHAT_DAILY_KEY = "jj_chat_daily_shown";

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

  // Chat collapsed state - always start collapsed, but show medium box on first daily load
  const [isChatCollapsed, setIsChatCollapsed] = useState(true);
  // Show attention pulse only on first daily load (medium box state)
  const [showAttentionPulse, setShowAttentionPulse] = useState(() => !hasDailyShown() && !location.pathname.startsWith("/admin"));

  // When user interacts with chat, mark daily shown and clear the pulse
  const handleToggleChat = () => {
    if (showAttentionPulse) {
      markDailyShown();
    }
    setShowAttentionPulse(false);
    setIsChatCollapsed((v) => !v);
  };

  // Chat is always an overlay – no content pushing
  const effectiveCollapsed = isAdminRoute ? true : isChatCollapsed;

  return (
    <div className="min-h-screen bg-black">
      <SecurityShield />
      <MarketingScripts />
      <GlobalHeader />
      {/* Match content offset to fixed header height */}
      <main className="pt-24 lg:pt-28">
        {children}
      </main>
      {/* All popups rendered centrally */}
      <PopupLayer />
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

