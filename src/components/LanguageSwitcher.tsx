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
        {isIconOnly ? (
          <button
            className="w-6 h-6 flex items-center justify-center transition-all duration-200 group"
            style={{ filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }}
          >
            <Globe className="w-3.5 h-3.5 text-gold group-hover:text-white transition-colors duration-200" style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.3))' }} />
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
        sideOffset={12}
        className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border border-gold/30 min-w-[200px] rounded-xl shadow-2xl shadow-black/20 p-0 overflow-hidden"
      >
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-gold to-transparent" />
        <ScrollArea className="h-[320px]">
          <div className="p-2">
            {SUPPORTED_LANGUAGES.map((lang) => (
              <DropdownMenuItem 
                key={lang.code}
                onClick={() => setLanguage(lang.code)}
                className={`flex items-center justify-between cursor-pointer transition-all duration-200 rounded-lg px-4 py-3 my-0.5 group ${
                  language === lang.code 
                    ? 'bg-gold/15 text-black border border-gold/30' 
                    : 'text-black hover:text-gold hover:bg-gold/10 hover:shadow-[0_4px_15px_rgba(200,167,102,0.2)] hover:-translate-y-0.5'
                }`}
              >
                <span className="flex items-center gap-3">
                  <span className="text-lg">{lang.flag}</span>
                  <span className="text-sm font-medium group-hover:text-gold transition-colors">{lang.nativeName}</span>
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