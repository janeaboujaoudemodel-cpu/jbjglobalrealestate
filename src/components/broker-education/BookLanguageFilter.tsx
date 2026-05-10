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
            "border-[#B89555]/40 bg-[#FDFBF7]/80 hover:bg-[#EFE6D6]/10 text-[#1A1A1A] gap-2",
            className
          )}
        >
          <Globe className="w-4 h-4 text-[#1A1A1A]" />
          <span className="text-lg">{selectedLanguage.flag}</span>
          <span className="hidden sm:inline">{selectedLanguage.name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end"
        className="bg-[#FDFBF7] border-[#B89555]/30 shadow-xl min-w-[180px] z-[200]"
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
                ? "bg-[#EFE6D6]/15 !text-[#1A1A1A]" 
                : "!text-[#1A1A1A] hover:bg-[#EFE6D6]/10 hover:!text-[#1A1A1A] focus:!text-[#1A1A1A] focus:bg-[#EFE6D6]/10"
            )}
          >
            <span className="text-lg">{lang.flag}</span>
            <span className="flex-1">{lang.name}</span>
            {value === lang.code && (
              <Check className="w-4 h-4 text-[#1A1A1A]" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
