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
  variant?: 'default' | 'compact' | 'icon-only';
}

const LanguageSwitcher = ({ variant = 'default' }: LanguageSwitcherProps) => {
  const { language, setLanguage, t } = useLanguage();
  const currentLang = getLanguageInfo(language);

  const isCompact = variant === 'compact';
  const isIconOnly = variant === 'icon-only';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={isIconOnly
            ? "p-0 min-w-0 hover:opacity-70 transition-opacity duration-200 bg-transparent border-0"
            : isCompact 
              ? "h-7 w-7 p-0 rounded-full bg-white border border-gold/30 hover:bg-transparent hover:border-gold/50 transition-all duration-300 group"
              : "h-10 lg:h-11 px-3 text-gold hover:text-gold-light rounded-full border border-gold/20 hover:border-gold/50 hover:bg-gold/10 transition-all duration-300 group gap-2"
          }
        >
          <Globe className={isIconOnly ? "w-5 h-5 text-gold" : isCompact ? "w-3 h-3 text-gold group-hover:text-gold-light" : "w-4 h-4 group-hover:scale-110 transition-transform"} />
          {!isCompact && !isIconOnly && <span className="hidden sm:inline text-xs font-medium tracking-wide">{currentLang.flag} {currentLang.code.toUpperCase()}</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        sideOffset={12}
        className="bg-gradient-to-b from-white via-[#FDFBF7] to-[#F5F0E6] border border-gold/30 min-w-[200px] rounded-xl shadow-2xl shadow-black/20 p-0 overflow-hidden"
      >
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-gold to-transparent" />
        <ScrollArea className="h-[320px]">
          <div className="p-2">
            {SUPPORTED_LANGUAGES.map((lang) => (
              <DropdownMenuItem 
                key={lang.code}
                onClick={() => setLanguage(lang.code)}
                className={`flex items-center justify-between hover:bg-[#D4C4A0]/40 cursor-pointer transition-all duration-200 rounded-lg px-4 py-3 my-0.5 ${
                  language === lang.code ? 'bg-gold/15 text-black border border-gold/30' : 'text-zinc-800 hover:text-black'
                }`}
              >
                <span className="flex items-center gap-3">
                  <span className="text-lg">{lang.flag}</span>
                  <span className="text-sm font-medium">{lang.nativeName}</span>
                </span>
                {language === lang.code && (
                  <Check className="w-4 h-4 text-gold" />
                )}
              </DropdownMenuItem>
            ))}
          </div>
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSwitcher;
