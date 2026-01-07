import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import GlobalHeader from "@/components/GlobalHeader";
import VoiceConciergeWidget from "@/components/VoiceConciergeWidget";
import AIChatWidget from "@/components/AIChatWidget";
import InstallAppButton from "@/components/InstallAppButton";
import MarketingScripts from "@/components/marketing/MarketingScripts";
import { useLanguage } from "@/contexts/LanguageContext";
import { useIsMobile } from "@/hooks/use-mobile";

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const { isRTL } = useLanguage();
  const isMobile = useIsMobile();
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");

  // Start with chat open on desktop, collapsed on mobile
  const [isChatCollapsed, setIsChatCollapsed] = useState(false);

  // Always keep chat collapsed on admin screens to avoid blocking controls.
  useEffect(() => {
    if (isAdminRoute) setIsChatCollapsed(true);
  }, [isAdminRoute]);

  // On mobile, chat is always collapsed (shown as floating button)
  const effectiveCollapsed = isMobile || isAdminRoute ? true : isChatCollapsed;

  return (
    <div className="min-h-screen bg-black">
      <MarketingScripts />
      <GlobalHeader />
      {/* Add padding-top for header and padding-right/left for side chat panel (desktop only) */}
      <main
        className={`pt-16 lg:pt-18 transition-all duration-300 ${
          effectiveCollapsed
            ? ""
            : isRTL
              ? "lg:pl-[380px]"
              : "lg:pr-[380px]"
        }`}
      >
        {children}
      </main>
      <InstallAppButton />
      <VoiceConciergeWidget />
      <AIChatWidget
        isCollapsed={effectiveCollapsed}
        onToggleCollapse={() => setIsChatCollapsed((v) => !v)}
      />
    </div>
  );
};

export default MainLayout;

