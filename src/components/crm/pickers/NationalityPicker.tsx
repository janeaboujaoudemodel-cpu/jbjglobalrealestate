import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { COUNTRIES, resolveCountry } from "@/data/countries";
import { cn } from "@/lib/utils";

interface Props {
  value: string;
  onChange: (country: string) => void;
  placeholder?: string;
  className?: string;
}

/**
 * Nationality picker — displays and stores COUNTRY NAMES
 * (e.g. "United Arab Emirates", "Bahrain", "Japan") instead of demonyms.
 * Legacy demonym values (e.g. "Emirati") are still recognised on read.
 */
export default function NationalityPicker({ value, onChange, placeholder = "Select country", className }: Props) {
  const [open, setOpen] = useState(false);
  const selected = resolveCountry(value || "");

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "w-full h-10 flex items-center justify-between gap-2 rounded-md border border-[#B89555]/30 bg-[#FDFBF7] px-3 text-sm text-[#1A1A1A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B89555]/40",
            className,
          )}
        >
          <span className="flex items-center gap-2 truncate">
            {selected ? (
              <>
                <span className="text-base leading-none">{selected.flag}</span>
                <span className="truncate">{selected.name}</span>
              </>
            ) : value ? (
              <span className="truncate">{value}</span>
            ) : (
              <span className="text-[#1A1A1A]/50">{placeholder}</span>
            )}
          </span>
          <ChevronsUpDown className="w-4 h-4 text-[#1A1A1A]/50 shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        data-advisor-popover
        align="start"
        className="p-0 w-[var(--radix-popover-trigger-width)] min-w-[260px] bg-[#FDFBF7] border-[#B89555]/40 z-[10200]"
      >
        <Command>
          <CommandInput placeholder="Search country…" className="text-[#1A1A1A]" />
          <CommandList
            className="max-h-72 overflow-y-auto overscroll-contain"
            onWheel={(e) => e.stopPropagation()}
            onTouchMove={(e) => e.stopPropagation()}
          >
            <CommandEmpty>No match.</CommandEmpty>
            <CommandGroup>
              {COUNTRIES.map((c) => {
                const isSelected = selected?.code === c.code;
                return (
                  <CommandItem
                    key={c.code}
                    value={`${c.name} ${c.nationality} ${c.code}`}
                    data-no-contrast-guard
                    onSelect={() => { onChange(c.name); setOpen(false); }}
                    className="flex items-center gap-2 cursor-pointer data-[selected=true]:!bg-[#064E3B] data-[selected=true]:!text-white data-[selected=true]:[&_*]:!text-white data-[selected=true]:[&_svg]:!stroke-white"
                  >
                    <span className="text-base leading-none">{c.flag}</span>
                    <span className="flex-1 truncate">{c.name}</span>
                    {isSelected && <Check className="w-4 h-4" />}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
