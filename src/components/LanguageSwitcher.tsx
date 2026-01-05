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

const LanguageSwitcher = () => {
  const { language, setLanguage, t } = useLanguage();
  const currentLang = getLanguageInfo(language);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2.5 text-white/70 hover:text-gold hover:bg-transparent border border-transparent hover:border-gold/30 rounded-md transition-all"
        >
          <Globe className="w-4 h-4" />
          <span className="hidden sm:inline text-xs font-medium">{currentLang.flag} {currentLang.code.toUpperCase()}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        sideOffset={8}
        className="bg-zinc-900/95 backdrop-blur-md border border-gold/30 min-w-[180px] rounded-lg shadow-xl shadow-black/40 p-0"
      >
        <ScrollArea className="h-[320px]">
          <div className="p-1">
            {SUPPORTED_LANGUAGES.map((lang) => (
              <DropdownMenuItem 
                key={lang.code}
                onClick={() => setLanguage(lang.code)}
                className={`flex items-center justify-between text-white hover:bg-gold/20 cursor-pointer transition-colors rounded-md px-3 py-2 ${
                  language === lang.code ? 'bg-gold/10 text-gold' : ''
                }`}
              >
                <span className="flex items-center gap-2">
                  <span>{lang.flag}</span>
                  <span className="text-sm">{lang.nativeName}</span>
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
