import { useState, useMemo } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChevronsUpDown, Search, Check } from "lucide-react";

export interface DialOption {
  value: string;
  label: string;
}

interface Props {
  value: string;
  display: string;
  options: DialOption[];
  onChange: (value: string) => void;
}

export default function DialCodePicker({ value, display, options, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [query, options]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="w-full h-10 inline-flex items-center justify-between gap-1 rounded-md border border-input bg-white px-2.5 text-sm text-[#1A1A1A] hover:bg-[#FDFBF7] focus:outline-none focus:ring-1 focus:ring-[#B89555]"
          aria-haspopup="listbox"
          aria-expanded={open}
        >
          <span className="truncate font-medium tabular-nums">{display}</span>
          <ChevronsUpDown className="h-3.5 w-3.5 text-[#1A1A1A]/60 shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={6}
        className="w-72 p-0 bg-[#FDFBF7] border border-[#B89555]/40 shadow-xl"
      >
        <div className="p-2 border-b border-[#B89555]/20">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#1A1A1A]/50" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search country or code…"
              className="w-full h-8 pl-7 pr-2 rounded-md border border-[#B89555]/30 bg-white text-sm text-[#1A1A1A] placeholder:text-[#1A1A1A]/40 focus:outline-none focus:border-[#B89555]"
            />
          </div>
        </div>
        <div className="max-h-64 overflow-y-auto py-1">
          {filtered.length === 0 && (
            <div className="px-3 py-4 text-xs text-[#1A1A1A]/50 text-center">No matches</div>
          )}
          {filtered.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => {
                onChange(o.value);
                setOpen(false);
                setQuery("");
              }}
              className="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm text-left text-[#1A1A1A] hover:bg-[#EFE6D6]/70"
            >
              <span className="truncate">{o.label}</span>
              {o.value === value && <Check className="h-3.5 w-3.5 text-[#B89555] shrink-0" />}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
