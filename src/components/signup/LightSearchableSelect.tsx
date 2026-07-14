import { useState, useMemo, useRef, useEffect } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  getCountryList,
  getLanguageList,
  getCountryFlagForName,
  getLanguageFlagForName,
  PRIORITY_COUNTRIES,
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

// Reverse map so nationality dropdown shows nationality label with flag of the country
const COUNTRY_TO_NATIONALITY: Record<string, string> = Object.fromEntries(
  Object.entries(NATIONALITY_TO_COUNTRY).map(([n, c]) => [c, n])
);

export type LightVariant = "country" | "nationality" | "language" | "plain";

interface Props {
  value: string;
  onChange: (v: string) => void;
  options?: string[];
  variant?: LightVariant;
  placeholder?: string;
  searchPlaceholder?: string;
  ariaLabel?: string;
  id?: string;
}

/**
 * Champagne/emerald light dropdown for the sign-up form.
 * - White surface, gold hairline border, emerald focus
 * - Flags for country / nationality / language
 * - Full searchable list with priority countries pinned on top for country/nationality
 * - No blue at any state (scoped by [data-jbj-signup] CSS)
 */
export default function LightSearchableSelect({
  value,
  onChange,
  options,
  variant = "plain",
  placeholder = "Select…",
  searchPlaceholder = "Search…",
  ariaLabel,
  id,
}: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => searchRef.current?.focus());
    } else {
      setSearch("");
    }
  }, [open]);

  const list: string[] = useMemo(() => {
    if (options && options.length) return options;
    if (variant === "country") return getCountryList();
    if (variant === "nationality") {
      // Show nationality demonyms; priority: Emirati, British, American, Indian, etc.
      const nats = Object.keys(NATIONALITY_TO_COUNTRY).sort((a, b) => a.localeCompare(b));
      const priority = ["Emirati", "British", "American", "Indian", "Saudi"].filter((n) => nats.includes(n));
      const rest = nats.filter((n) => !priority.includes(n));
      return [...priority, ...rest];
    }
    if (variant === "language") return getLanguageList();
    return [];
  }, [options, variant]);

  const getFlag = (opt: string): string => {
    if (variant === "language") return getLanguageFlagForName(opt);
    if (variant === "nationality") {
      const country = NATIONALITY_TO_COUNTRY[opt] || opt;
      return getCountryFlagForName(country);
    }
    if (variant === "country") return getCountryFlagForName(opt);
    return "";
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return list;
    return list.filter((o) => o.toLowerCase().includes(q));
  }, [list, search]);

  // For country variant, keep priority countries pinned when no search
  const displayList = useMemo(() => {
    if (variant !== "country" || search.trim()) return filtered;
    const priority = PRIORITY_COUNTRIES.filter((c) => filtered.includes(c));
    const rest = filtered.filter((c) => !priority.includes(c));
    return [...priority, ...rest];
  }, [filtered, variant, search]);

  const selectedFlag = value ? getFlag(value) : "";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          aria-label={ariaLabel || placeholder}
          aria-expanded={open}
          data-jbj-signup-trigger
          className={cn(
            "w-full h-11 rounded-md bg-white border border-[#B89555]/45 px-3",
            "inline-flex items-center justify-between gap-2 text-sm text-[#1A1A1A]",
            "transition-colors hover:border-[#064E3B]/60",
            "focus:outline-none focus:border-[#064E3B] focus:ring-2 focus:ring-[#064E3B]/20",
            open && "border-[#064E3B] ring-2 ring-[#064E3B]/20"
          )}
        >
          <span className="flex items-center gap-2 min-w-0 flex-1 text-left">
            {selectedFlag ? (
              <span className="text-lg leading-none shrink-0">{selectedFlag}</span>
            ) : null}
            <span className={cn("truncate", !value && "text-[#1A1A1A]/45")}>
              {value || placeholder}
            </span>
          </span>
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-[#0d3a2b]/70 transition-transform",
              open && "rotate-180"
            )}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        side="bottom"
        sideOffset={6}
        avoidCollisions
        collisionPadding={12}
        className={cn(
          "w-[var(--radix-popover-trigger-width)] min-w-[280px] p-0 z-[10210]",
          "bg-white border border-[#B89555]/45 rounded-md shadow-[0_18px_48px_-18px_rgba(6,78,59,0.22)]",
          "jbj-signup-dropdown"
        )}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <div className="p-2 border-b border-[#B89555]/25">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#0d3a2b]/60" />
            <input
              ref={searchRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full h-10 rounded-md bg-[#FDFBF7] border border-[#B89555]/40 pl-9 pr-3 text-sm text-[#1A1A1A] placeholder:text-[#1A1A1A]/40 outline-none focus:border-[#064E3B] focus:ring-2 focus:ring-[#064E3B]/20"
            />
          </div>
        </div>
        <div className="max-h-[280px] overflow-y-auto py-1 overscroll-contain">
          {displayList.length === 0 ? (
            <div className="py-6 text-center text-sm text-[#1A1A1A]/50">
              No results
            </div>
          ) : (
            displayList.map((opt) => {
              const flag = getFlag(opt);
              const isSelected = value === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => {
                    onChange(opt);
                    setOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors",
                    "text-[#1A1A1A] hover:bg-[#F7F2EA]",
                    isSelected && "bg-[#064E3B]/6 font-semibold text-[#064E3B]"
                  )}
                >
                  {flag && <span className="text-lg leading-none shrink-0">{flag}</span>}
                  <span className="truncate text-sm flex-1 min-w-0">{opt}</span>
                  {isSelected && (
                    <Check className="h-4 w-4 shrink-0 text-[#064E3B]" strokeWidth={2.6} />
                  )}
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export { COUNTRY_TO_NATIONALITY, NATIONALITY_TO_COUNTRY };
