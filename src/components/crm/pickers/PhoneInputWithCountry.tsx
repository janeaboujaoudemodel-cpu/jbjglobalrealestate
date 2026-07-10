import { useState, useMemo } from "react";
import { ChevronsUpDown, Check } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { COUNTRIES, splitE164, findCountryByDial } from "@/data/countries";
import { cn } from "@/lib/utils";

interface Props {
  value: string;
  onChange: (e164: string) => void;
  placeholder?: string;
  className?: string;
  defaultDial?: string;
}

/**
 * Premium two-field phone input — both fields share the exact same shape,
 * size, border, radius and background as every other form field (shadcn Input).
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

  // Trigger mirrors shadcn Input exactly: min-h-11, rounded-lg, px-4, same border via jbj-form-field.
  const triggerCls =
    "jbj-form-field flex min-h-11 w-full items-center justify-between gap-2 rounded-lg px-4 py-2 text-base md:text-sm text-[#1A1A1A] transition-all duration-200 focus-visible:outline-none";

  return (
    <div className={cn("grid grid-cols-[140px_1fr] gap-3 w-full", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label="Select country dial code"
            data-surface="light"
            data-jbj-field
            className={triggerCls}
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

      {/* National number — shadcn Input so shape/size/border match every other field */}
      <Input
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        value={national}
        onChange={(e) => setNational(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}
