import { useLanguage, SUPPORTED_LANGUAGES, getLanguageInfo } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Globe, Check } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';

interface LanguageSwitcherProps {
  variant?: 'default' | 'compact' | 'icon-only' | 'mobile';
}

const LanguageSwitcher = ({ variant = 'default' }: LanguageSwitcherProps) => {
  const { language, setLanguage, t } = useLanguage();
  const currentLang = getLanguageInfo(language);

  const isCompact = variant === 'compact';
  const isIconOnly = variant === 'icon-only';
  const isMobile = variant === 'mobile';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {isMobile ? (
          <button
            type="button"
            className="flex flex-col items-center justify-center gap-1.5 text-black hover:text-gold py-2 w-16 transition-colors"
            aria-label={t('header.language')}
          >
            <Globe className="w-5 h-5 pointer-events-none" />
            <span className="text-[9px] font-medium text-center pointer-events-none">Language</span>
          </button>
        ) : isIconOnly ? (
          <button
            type="button"
            className="w-8 h-8 flex items-center justify-center transition-all duration-300 group rounded-lg hover:bg-gold/10"
            aria-label={t('header.language')}
          >
            <Globe
              className="w-4 h-4 text-gold group-hover:text-white group-hover:scale-110 transition-all duration-300"
              style={{ filter: 'drop-shadow(0 0 6px rgba(200,167,102,0.4))' }}
            />
          </button>
        ) : isCompact ? (
          <button
            type="button"
            className="inline-flex h-7 w-7 items-center justify-center p-0 bg-transparent border-0 rounded-none appearance-none transition-colors duration-300 focus:outline-none focus-visible:outline-none focus-visible:ring-0 group"
            aria-label={t('header.language')}
          >
            <Globe className="w-3 h-3 text-gold group-hover:text-gold-light transition-colors duration-200" />
          </button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="h-10 lg:h-11 px-3 text-gold hover:text-gold-light rounded-full border border-gold/20 hover:border-gold/50 hover:bg-gold/10 transition-all duration-300 group gap-2"
          >
            <Globe className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span className="hidden sm:inline text-xs font-medium tracking-wide">{currentLang.flag} {currentLang.code.toUpperCase()}</span>
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        sideOffset={16}
        className="z-[9999] min-w-[280px] rounded-xl shadow-[0_30px_80px_-20px_rgba(0,0,0,0.5)] p-0 overflow-hidden border-2 border-gold/40"
        style={{
          background: 'linear-gradient(135deg, #F5EBD7 0%, #E8DCC8 50%, #D4C4A8 100%)',
        }}
      >
        {/* Top gold accent line */}
        <div className="h-1 bg-gradient-to-r from-gold/50 via-gold to-gold/50" />
        <ScrollArea className="h-[320px]">
          <div className="p-3">
            {SUPPORTED_LANGUAGES.map((lang) => (
              <DropdownMenuItem 
                key={lang.code}
                onClick={() => setLanguage(lang.code)}
                className={`flex items-center justify-between cursor-pointer transition-all duration-200 rounded-lg px-4 py-3 my-0.5 group ${
                  language === lang.code 
                    ? 'bg-gold/15 border border-gold/30' 
                    : 'hover:bg-gradient-to-r hover:from-[#F5EBD7] hover:to-[#E8DCC8]'
                }`}
              >
                <span className="flex items-center gap-3">
                  <span className="text-lg">{lang.flag}</span>
                  <span className={`text-sm font-semibold transition-colors ${
                    language === lang.code ? 'text-gold' : 'text-black group-hover:text-gold'
                  }`}>{lang.nativeName}</span>
                </span>
                {language === lang.code && (
                  <Check className="w-4 h-4 text-gold" />
                )}
              </DropdownMenuItem>
            ))}
          </div>
        </ScrollArea>
        {/* Bottom gold accent line */}
        <div className="h-1 bg-gradient-to-r from-gold/50 via-gold to-gold/50" />
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSwitcher;
