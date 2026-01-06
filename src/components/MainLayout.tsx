import { useState } from "react";
import GlobalHeader from "@/components/GlobalHeader";
import VoiceConciergeWidget from "@/components/VoiceConciergeWidget";
import AIChatWidget from "@/components/AIChatWidget";
import { useLanguage } from "@/contexts/LanguageContext";

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const { isRTL } = useLanguage();
  const [isChatCollapsed, setIsChatCollapsed] = useState(false);
  
  return (
    <div className="min-h-screen bg-black">
      <GlobalHeader />
      {/* Add padding-top for header and padding-right/left for side chat panel */}
      <main className={`pt-16 lg:pt-18 transition-all duration-300 ${isChatCollapsed ? '' : isRTL ? 'pl-[380px]' : 'pr-[380px]'}`}>
        {children}
      </main>
      <VoiceConciergeWidget />
      <AIChatWidget 
        isCollapsed={isChatCollapsed} 
        onToggleCollapse={() => setIsChatCollapsed(!isChatCollapsed)} 
      />
    </div>
  );
};

export default MainLayout;
