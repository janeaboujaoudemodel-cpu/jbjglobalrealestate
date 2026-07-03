import * as React from "react";
import { useState, useMemo, useRef, useEffect } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  getCountryFlagForName,
  getLanguageFlagForName,
} from "@/constants/localeOptions";

const NATIONALITY_TO_COUNTRY: Record<string, string> = {
  Afghan: "Afghanistan", Albanian: "Albania", Algerian: "Algeria", American: "United States", Andorran: "Andorra", Angolan: "Angola",
  Argentine: "Argentina", Armenian: "Armenia", Australian: "Australia", Austrian: "Austria", Azerbaijani: "Azerbaijan", Bahraini: "Bahrain",
  Bangladeshi: "Bangladesh", Belgian: "Belgium", Bolivian: "Bolivia", Bosnian: "Bosnia and Herzegovina", Brazilian: "Brazil", British: "United Kingdom",
  Bulgarian: "Bulgaria", Cambodian: "Cambodia", Cameroonian: "Cameroon", Canadian: "Canada", Chilean: "Chile", Chinese: "China",
  Colombian: "Colombia", Croatian: "Croatia", Cuban: "Cuba", Czech: "Czech Republic", Danish: "Denmark", Dutch: "Netherlands",
  Ecuadorian: "Ecuador", Egyptian: "Egypt", Emirati: "United Arab Emirates", Estonian: "Estonia", Ethiopian: "Ethiopia", Filipino: "Philippines",
  Finnish: "Finland", French: "France", Georgian: "Georgia", German: "Germany", Ghanaian: "Ghana", Greek: "Greece",
  Hungarian: "Hungary", Icelandic: "Iceland", Indian: "India", Indonesian: "Indonesia", Iranian: "Iran", Iraqi: "Iraq",
  Irish: "Ireland", Israeli: "Israel", Italian: "Italy", Jamaican: "Jamaica", Japanese: "Japan", Jordanian: "Jordan",
  Kazakh: "Kazakhstan", Kenyan: "Kenya", Korean: "South Korea", Kuwaiti: "Kuwait", Latvian: "Latvia", Lebanese: "Lebanon",
  Libyan: "Libya", Lithuanian: "Lithuania", Luxembourgish: "Luxembourg", Malaysian: "Malaysia", Maldivian: "Maldives", Maltese: "Malta",
  Mexican: "Mexico", Moldovan: "Moldova", Mongolian: "Mongolia", Moroccan: "Morocco", Nepalese: "Nepal", "New Zealander": "New Zealand",
  Nigerian: "Nigeria", Norwegian: "Norway", Omani: "Oman", Pakistani: "Pakistan", Palestinian: "Palestine", Panamanian: "Panama",
  Peruvian: "Peru", Polish: "Poland", Portuguese: "Portugal", Qatari: "Qatar", Romanian: "Romania", Russian: "Russia",
  Saudi: "Saudi Arabia", Serbian: "Serbia", Singaporean: "Singapore", Slovak: "Slovakia", Slovenian: "Slovenia", "South African": "South Africa",
  Spanish: "Spain", "Sri Lankan": "Sri Lanka", Sudanese: "Sudan", Swedish: "Sweden", Swiss: "Switzerland", Syrian: "Syria",
  Taiwanese: "Taiwan", Thai: "Thailand", Tunisian: "Tunisia", Turkish: "Turkey", Ukrainian: "Ukraine", Uruguayan: "Uruguay",
  Uzbek: "Uzbekistan", Venezuelan: "Venezuela", Vietnamese: "Vietnam", Yemeni: "Yemen", Zambian: "Zambia", Zimbabwean: "Zimbabwe",
};

function getNationalityFlagForName(nationality: string): string {
  const country = NATIONALITY_TO_COUNTRY[nationality] || nationality;
  return getCountryFlagForName(country);
}

interface SearchableSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  searchPlaceholder?: string;
  priorityItem?: string;
  className?: string;
  triggerClassName?: string;
  disabled?: boolean;
  showFlags?: boolean;
  flagType?: "country" | "language" | "nationality";
}

export function SearchableSelect({
  value,
  onChange,
  options,
  placeholder = "Select...",
  searchPlaceholder = "Search...",
  priorityItem,
  className,
  triggerClassName,
  disabled = false,
  showFlags = true,
  flagType,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const detectedFlagType = flagType || (
    searchPlaceholder?.toLowerCase().includes("lang")
      ? "language"
      : placeholder?.toLowerCase().includes("national")
        ? "nationality"
        : "country"
  );

  const getFlag = (option: string): string => {
    if (!showFlags) return "";
    if (detectedFlagType === "language") return getLanguageFlagForName(option);
    if (detectedFlagType === "nationality") return getNationalityFlagForName(option);
    return getCountryFlagForName(option);
  };

  useEffect(() => {
    if (open && inputRef.current) {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
    if (!open) {
      setSearch("");
    }
  }, [open]);

  const filteredOptions = useMemo(() => {
    const filtered = options.filter((opt) => opt.toLowerCase().includes(search.toLowerCase()));

    filtered.sort((a, b) => a.localeCompare(b));

    if (priorityItem && filtered.includes(priorityItem)) {
      const index = filtered.indexOf(priorityItem);
      filtered.splice(index, 1);
      filtered.unshift(priorityItem);
    }

    return filtered;
  }, [options, search, priorityItem]);

  const selectedFlag = value ? getFlag(value) : "";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild disabled={disabled}>
        <button
          type="button"
          aria-expanded={open}
          aria-haspopup="dialog"
          data-searchable-trigger
          className={cn(
            "allow-white jbj-form-field w-full h-12 rounded-lg min-w-0 inline-flex items-center justify-between gap-3 px-4 transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
            !value && "text-white",
            triggerClassName
          )}
        >
          <span className="truncate flex items-center gap-2 min-w-0 flex-1 text-left">
            {selectedFlag && <span className="text-xl leading-none shrink-0">{selectedFlag}</span>}
            <span className="truncate font-medium">{value || placeholder}</span>
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 text-white" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        data-filter-dropdown="true"
        className={cn(
          "allow-white jbj-form-popover w-[var(--radix-popover-trigger-width)] min-w-[260px] p-0 shadow-xl z-[10210]",
          className
        )}
        align="start"
        side="bottom"
        sideOffset={6}
        avoidCollisions={true}
        collisionPadding={12}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="p-2 border-b border-white/18">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white" />
            <Input
              ref={inputRef}
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="allow-white jbj-form-field h-11 rounded-lg pl-9 focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
        </div>

        <div className="max-h-[280px] overflow-y-auto py-1 overscroll-contain">
          {filteredOptions.length === 0 ? (
            <div className="allow-white py-6 text-center text-sm text-white">No results found</div>
          ) : (
            filteredOptions.map((option) => {
              const flag = getFlag(option);
              const isSelected = value === option;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    onChange(option);
                    setOpen(false);
                  }}
                  className={cn(
                    "allow-white jbj-form-option w-full flex items-center gap-3 px-3 py-3 text-left min-h-[46px] transition-colors text-white hover:bg-white/12",
                    isSelected && "font-semibold"
                  )}
                >
                  {flag && <span className="text-xl leading-none shrink-0">{flag}</span>}
                  <span className="allow-white truncate text-sm sm:text-base flex-1 min-w-0 text-white">{option}</span>
                  {isSelected && <Check className="h-4 w-4 shrink-0 text-white" strokeWidth={2.8} />}
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default SearchableSelect;
