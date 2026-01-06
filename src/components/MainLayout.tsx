import { useState } from "react";
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
  const [isChatCollapsed, setIsChatCollapsed] = useState(false);
  
  // On mobile, chat is always collapsed (shown as floating button)
  const effectiveCollapsed = isMobile ? true : isChatCollapsed;
  
  return (
    <div className="min-h-screen bg-black">
      <MarketingScripts />
      <GlobalHeader />
      {/* Add padding-top for header and padding-right/left for side chat panel (desktop only) */}
      <main className={`pt-16 lg:pt-18 transition-all duration-300 ${effectiveCollapsed ? '' : isRTL ? 'lg:pl-[380px]' : 'lg:pr-[380px]'}`}>
        {children}
      </main>
      <InstallAppButton />
      <VoiceConciergeWidget />
      <AIChatWidget 
        isCollapsed={effectiveCollapsed} 
        onToggleCollapse={() => setIsChatCollapsed(!isChatCollapsed)} 
      />
    </div>
  );
};

export default MainLayout;
