import React from 'react';
import { Globe, Check } from 'lucide-react';
import { MegaMenuSectionTitle } from '@/components/header/mega-menu-primitives';
import { useLanguage, SUPPORTED_LANGUAGES, getLanguageInfo } from '@/contexts/LanguageContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface MegaMenuLanguageProps {
  onClose: () => void;
}

const MegaMenuLanguage = React.forwardRef<HTMLDivElement, MegaMenuLanguageProps>(({ onClose }, ref) => {
  const { language, setLanguage } = useLanguage();
  const currentLang = getLanguageInfo(language);

  const handleSelectLanguage = (langCode: string) => {
    setLanguage(langCode as any);
    onClose();
  };

  return (
    <div
      ref={ref}
      className={cn(
        "z-[9999] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.5)] rounded-xl overflow-hidden w-[360px]",
      )}
      style={{
        background: 'linear-gradient(135deg, #F5EBD7 0%, #E8DCC8 50%, #D4C4A8 100%)',
      }}
    >
      {/* Gold border */}
      <div className="absolute inset-0 rounded-xl border-2 border-gold/40 pointer-events-none" />
      
      <div className="px-6 py-6">
        <MegaMenuSectionTitle icon={Globe} title="Select Language" />
        
        <ScrollArea className="h-[320px] -mx-2">
          <div className="space-y-1 px-2">
            {SUPPORTED_LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => handleSelectLanguage(lang.code)}
                className={`flex items-center justify-between w-full cursor-pointer transition-all duration-300 rounded-xl px-4 py-3 group ${
                  language === lang.code 
                    ? 'bg-gradient-to-r from-gold/20 via-gold/15 to-gold/20 border border-gold/40 shadow-[0_4px_15px_rgba(200,167,102,0.2)]' 
                    : 'hover:bg-gradient-to-r hover:from-[#F5EBD7] hover:to-[#E8DCC8]'
                }`}
              >
                <span className="flex items-center gap-3">
                  <span className="text-xl">{lang.flag}</span>
                  <span className={`text-sm font-semibold transition-colors ${
                    language === lang.code ? 'text-gold' : 'text-black group-hover:text-gold'
                  }`}>{lang.nativeName}</span>
                </span>
                {language === lang.code && (
                  <Check className="w-5 h-5 text-gold" />
                )}
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>
      
      {/* Bottom gold accent */}
      <div className="h-1 bg-gradient-to-r from-gold/50 via-gold to-gold/50" />
    </div>
  );
});

MegaMenuLanguage.displayName = 'MegaMenuLanguage';

export default MegaMenuLanguage;
