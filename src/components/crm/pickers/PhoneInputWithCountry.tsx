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

export default function PhoneInputWithCountry({
  value,
  onChange,
  placeholder = "Phone number",
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
    <div className={cn("flex w-full h-10 rounded-md border border-[#B89555]/30 bg-[#FDFBF7] overflow-hidden focus-within:ring-2 focus-within:ring-[#B89555]/40", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-1.5 px-2.5 border-r border-[#B89555]/30 bg-[#F7F2EA] hover:bg-[#EFE6D6] text-sm text-[#1A1A1A] focus-visible:outline-none"
          >
            <span className="text-base leading-none">{selectedCountry?.flag || "🏳️"}</span>
            <span className="font-medium">{dial}</span>
            <ChevronsUpDown className="w-3.5 h-3.5 text-[#1A1A1A]/50" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="p-0 w-[280px] bg-[#FDFBF7] border-[#B89555]/40">
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
                    onSelect={() => setDial(c.dial)}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <span className="text-base leading-none">{c.flag}</span>
                    <span className="flex-1 truncate">{c.name}</span>
                    <span className="text-xs text-[#1A1A1A]/60">{c.dial}</span>
                    {c.dial === dial && <Check className="w-4 h-4 text-[#B89555]" />}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <input
        type="tel"
        inputMode="tel"
        value={national}
        onChange={(e) => setNational(e.target.value)}
        placeholder={placeholder}
        className="flex-1 min-w-0 bg-transparent px-3 text-sm text-[#1A1A1A] placeholder:text-[#1A1A1A]/40 focus:outline-none"
      />
    </div>
  );
}
