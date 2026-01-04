import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const LanguageSwitcher = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2.5 text-white/70 hover:text-gold hover:bg-transparent border border-transparent hover:border-gold/30 rounded-md transition-all"
        >
          <Globe className="w-4 h-4 mr-1" />
          <span className="text-xs font-medium">{language === 'en' ? 'EN' : 'عربي'}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        sideOffset={8}
        className="bg-zinc-900/95 backdrop-blur-md border border-gold/30 min-w-[140px] rounded-lg shadow-xl shadow-black/40"
      >
        <DropdownMenuItem 
          onClick={() => setLanguage('en')}
          className={`text-white hover:bg-gold/20 cursor-pointer transition-colors rounded-md ${language === 'en' ? 'bg-gold/10 text-gold' : ''}`}
        >
          <span className="mr-2">🇬🇧</span> English
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setLanguage('ar')}
          className={`text-white hover:bg-gold/20 cursor-pointer transition-colors rounded-md ${language === 'ar' ? 'bg-gold/10 text-gold' : ''}`}
        >
          <span className="mr-2">🇦🇪</span> العربية
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSwitcher;
