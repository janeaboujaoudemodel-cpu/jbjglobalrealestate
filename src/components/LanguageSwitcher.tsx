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
            className="flex flex-col items-center justify-center gap-1.5 text-[#1A1A1A] hover:text-[#1A1A1A] py-2 w-16 transition-colors"
            aria-label={t('header.language')}
          >
            <Globe className="w-5 h-5 pointer-events-none" />
            <span className="text-[9px] font-medium text-center pointer-events-none">Language</span>
          </button>
        ) : isIconOnly ? (
          <button
            type="button"
            className="w-8 h-8 flex items-center justify-center transition-all duration-300 group rounded-lg hover:bg-[#EFE6D6]/10"
            aria-label={`${t('header.language')}: ${currentLang.nativeName}`}
          >
            <span className="text-sm leading-none group-hover:scale-110 transition-transform duration-300">
              {currentLang.flag}
            </span>
          </button>
        ) : isCompact ? (
          <button
            type="button"
            className="inline-flex h-7 w-7 items-center justify-center p-0 bg-transparent border-0 rounded-none appearance-none transition-colors duration-300 focus:outline-none focus-visible:outline-none focus-visible:ring-0 group"
            aria-label={t('header.language')}
          >
            <Globe className="w-3 h-3 text-[#1A1A1A] group-hover:text-[#1A1A1A]-light transition-colors duration-200" />
          </button>
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="h-10 lg:h-11 px-3 text-[#1A1A1A] hover:text-[#1A1A1A]-light rounded-full border border-[#B89555]/20 hover:border-[#B89555]/50 hover:bg-[#EFE6D6]/10 transition-all duration-300 group gap-2"
          >
            <Globe className="w-4 h-4 group-hover:scale-110 transition-transform" />
            <span className="hidden sm:inline text-xs font-medium tracking-wide">{currentLang.flag} {currentLang.code.toUpperCase()}</span>
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        sideOffset={1}
        data-surface="emerald"
        data-no-contrast-guard
        className="z-[9999] min-w-[280px] rounded-xl p-0 overflow-hidden border border-white/30 text-white bg-gradient-to-br from-[#064E3B] via-[#042C1C] to-[#010806] shadow-[0_18px_50px_rgba(0,0,0,0.42),0_0_28px_rgba(6,78,59,0.24)]"
      >
        <div className="px-4 py-3 border-b border-white/15">
          <p className="text-xs font-semibold text-white/70 uppercase tracking-wider">{t('header.language')}</p>
        </div>
        <ScrollArea className="h-[320px]">
          <div className="p-2">
            {SUPPORTED_LANGUAGES.map((lang) => {
              const active = language === lang.code;
              return (
                <DropdownMenuItem 
                  key={lang.code}
                  onClick={() => setLanguage(lang.code)}
                  unstyled
                  data-surface="emerald"
                  data-no-contrast-guard
                  className={`flex items-center justify-between cursor-pointer rounded-lg px-4 py-3 my-0.5 text-white transition-colors ${active ? 'bg-white/15 font-semibold' : 'hover:bg-white/10'}`}
                >
                  <span className="flex items-center gap-3 text-white">
                    <span className="text-lg">{lang.flag}</span>
                    <span className="text-sm font-semibold text-white">{lang.nativeName}</span>
                  </span>
                  {active && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
                </DropdownMenuItem>
              );
            })}
          </div>
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSwitcher;
