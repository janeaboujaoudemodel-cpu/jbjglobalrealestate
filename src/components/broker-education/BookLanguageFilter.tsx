import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Globe, Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface BookLanguageFilterProps {
  value: string;
  onChange: (language: string) => void;
  className?: string;
}

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'ar', name: 'العربية', flag: '🇦🇪' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'hi', name: 'हिंदी', flag: '🇮🇳' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
];

export function BookLanguageFilter({ value, onChange, className }: BookLanguageFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedLanguage = LANGUAGES.find(l => l.code === value) || LANGUAGES[0];

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "border-gold/40 bg-white/80 hover:bg-gold/10 text-black gap-2",
            className
          )}
        >
          <Globe className="w-4 h-4 text-gold" />
          <span className="text-lg">{selectedLanguage.flag}</span>
          <span className="hidden sm:inline">{selectedLanguage.name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end"
        className="bg-white border-gold/30 shadow-xl min-w-[180px] z-[200]"
      >
        {LANGUAGES.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => {
              onChange(lang.code);
              setIsOpen(false);
            }}
            className={cn(
              "flex items-center gap-3 cursor-pointer",
              value === lang.code 
                ? "bg-gold/15 text-gold" 
                : "text-black hover:bg-gold/10 hover:text-gold"
            )}
          >
            <span className="text-lg">{lang.flag}</span>
            <span className="flex-1">{lang.name}</span>
            {value === lang.code && (
              <Check className="w-4 h-4 text-gold" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
