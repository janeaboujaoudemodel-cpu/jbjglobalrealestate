import { useState, useMemo } from "react";
import { ChevronsUpDown, Check } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { COUNTRIES, splitE164, findCountryByDial } from "@/data/countries";
import { cn } from "@/lib/utils";

interface Props {
  value: string; // E.164 like "+971501234567"
  onChange: (e164: string) => void;
  placeholder?: string;
  className?: string;
  defaultDial?: string;
}

/**
 * Premium two-field phone input:
 * - Field 1: Country/dial code picker (separate premium field with flag + dial)
 * - Field 2: National mobile number (separate premium field)
 * Both share the same visual system as other form fields.
 */
export default function PhoneInputWithCountry({
  value,
  onChange,
  placeholder = "Mobile number",
  className,
  defaultDial = "+971",
}: Props) {
  const [open, setOpen] = useState(false);

  const { dial, national } = useMemo(() => {
    if (!value) return { dial: defaultDial, national: "" };
    return splitE164(value);
  }, [value, defaultDial]);

  const selectedCountry = findCountryByDial(dial) || findCountryByDial(defaultDial);

  const setDial = (newDial: string) => {
    onChange(`${newDial}${national}`);
    setOpen(false);
  };

  const setNational = (raw: string) => {
    const cleaned = raw.replace(/[^\d]/g, "");
    onChange(cleaned ? `${dial}${cleaned}` : "");
  };

  return (
    <div className={cn("grid grid-cols-[140px_1fr] gap-3 w-full", className)}>
      {/* Field 1 — dial code picker */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label="Select country dial code"
            className="h-10 w-full inline-flex items-center justify-between gap-2 rounded-md border border-[#B89555]/35 bg-[#FDFBF7] px-3 text-sm text-[#1A1A1A] shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] hover:border-[#B89555]/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#064E3B]/25 transition"
          >
            <span className="inline-flex items-center gap-2 min-w-0">
              <span className="text-base leading-none">{selectedCountry?.flag || "🏳️"}</span>
              <span className="font-medium leading-none truncate">{dial}</span>
            </span>
            <ChevronsUpDown className="w-3.5 h-3.5 text-[#1A1A1A]/50 shrink-0" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          data-advisor-popover
          align="start"
          className="p-0 w-[300px] bg-[#FDFBF7] border-[#B89555]/40 z-[10200] shadow-[0_20px_50px_-20px_rgba(6,78,59,0.35)]"
        >
          <Command>
            <CommandInput placeholder="Search country or code…" className="text-[#1A1A1A]" />
            <CommandList
              className="max-h-72 overflow-y-auto overscroll-contain"
              onWheel={(e) => e.stopPropagation()}
              onTouchMove={(e) => e.stopPropagation()}
            >
              <CommandEmpty>No match.</CommandEmpty>
              <CommandGroup>
                {COUNTRIES.map((c) => (
                  <CommandItem
                    key={c.code}
                    value={`${c.name} ${c.nationality} ${c.dial} ${c.code}`}
                    data-no-contrast-guard
                    onSelect={() => setDial(c.dial)}
                    className="flex items-center gap-2 cursor-pointer data-[selected=true]:!bg-[#064E3B] data-[selected=true]:!text-white data-[selected=true]:[&_*]:!text-white data-[selected=true]:[&_svg]:!stroke-white"
                  >
                    <span className="text-base leading-none">{c.flag}</span>
                    <span className="flex-1 truncate">{c.name}</span>
                    <span className="text-xs">{c.dial}</span>
                    {c.dial === dial && <Check className="w-4 h-4" />}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {/* Field 2 — national number */}
      <input
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        value={national}
        onChange={(e) => setNational(e.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-md border border-[#B89555]/35 bg-[#FDFBF7] px-3 text-sm text-[#1A1A1A] shadow-[inset_0_1px_0_rgba(255,255,255,0.6)] placeholder:text-[#1A1A1A]/40 hover:border-[#B89555]/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#064E3B]/25 transition"
      />
    </div>
  );
}
