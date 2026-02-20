import * as React from "react";
import { useState, useMemo, useRef, useEffect } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SearchableSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  searchPlaceholder?: string;
  priorityItem?: string; // Item to show first (e.g., "United Arab Emirates" or "English")
  className?: string;
  triggerClassName?: string;
  disabled?: boolean;
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
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus search input when popover opens
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
    if (!open) {
      setSearch("");
    }
  }, [open]);

  // Filter and sort options - priority item first, then alphabetical
  const filteredOptions = useMemo(() => {
    const filtered = options.filter((opt) => {
      if (opt === "Other") return false; // Remove "Other" option
      return opt.toLowerCase().includes(search.toLowerCase());
    });

    // Sort alphabetically first
    filtered.sort((a, b) => a.localeCompare(b));

    // Move priority item to top if it exists and matches search
    if (priorityItem && filtered.includes(priorityItem)) {
      const index = filtered.indexOf(priorityItem);
      filtered.splice(index, 1);
      filtered.unshift(priorityItem);
    }

    return filtered;
  }, [options, search, priorityItem]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild disabled={disabled}>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "w-full justify-between h-12 rounded-lg",
            !triggerClassName && "bg-white border-gold/30 text-black hover:bg-white hover:border-gold/60 hover:text-black",
            !value && "text-zinc-500",
            triggerClassName
          )}
        >
          <span className="truncate">{value || placeholder}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-gold/60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className={cn(
          "w-[var(--radix-popover-trigger-width)] p-0 bg-white border-gold/30 shadow-xl shadow-gold/10 z-[100]",
          className
        )}
        align="start"
        sideOffset={4}
      >
        {/* Search Input */}
        <div className="p-2 border-b border-gold/20">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gold/60" />
            <Input
              ref={inputRef}
              placeholder={searchPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 pl-9 bg-white border-gold/30 text-black placeholder:text-zinc-500 focus:border-gold rounded-md"
            />
          </div>
        </div>

        {/* Options List */}
        <ScrollArea className="h-[280px]">
          <div className="p-1">
            {filteredOptions.length === 0 ? (
              <div className="py-6 text-center text-sm text-zinc-500">
                No results found
              </div>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option}
                  onClick={() => {
                    onChange(option);
                    setOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2.5 text-sm rounded-md transition-colors text-left",
                    value === option
                      ? "bg-gold/10 text-gold"
                      : "text-black hover:bg-gold/5"
                  )}
                >
                  <Check
                    className={cn(
                      "h-4 w-4 shrink-0",
                      value === option ? "opacity-100 text-gold" : "opacity-0"
                    )}
                  />
                  <span className="truncate">{option}</span>
                  {option === priorityItem && (
                    <span className="ml-auto text-xs text-gold/60">Default</span>
                  )}
                </button>
              ))
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

export default SearchableSelect;
