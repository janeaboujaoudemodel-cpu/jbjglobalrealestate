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
          className="h-9 px-2.5 text-white/70 hover:text-gold hover:bg-transparent"
        >
          <Globe className="w-4 h-4 mr-1.5" />
          <span className="text-sm font-medium">{language === 'en' ? 'EN' : 'عربي'}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="bg-zinc-900 border-zinc-700 min-w-[120px]"
      >
        <DropdownMenuItem 
          onClick={() => setLanguage('en')}
          className={`text-white hover:bg-zinc-800 cursor-pointer ${language === 'en' ? 'bg-zinc-800 text-gold' : ''}`}
        >
          🇬🇧 English
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => setLanguage('ar')}
          className={`text-white hover:bg-zinc-800 cursor-pointer ${language === 'ar' ? 'bg-zinc-800 text-gold' : ''}`}
        >
          🇦🇪 العربية
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default LanguageSwitcher;
