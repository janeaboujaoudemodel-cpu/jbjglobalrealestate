import * as React from "react";
import { useState, useMemo, useRef, useEffect } from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { getCountryFlagForName, getLanguageFlagForName } from "@/constants/localeOptions";

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
  flagType?: 'country' | 'language';
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
    searchPlaceholder?.toLowerCase().includes('countr') || placeholder?.toLowerCase().includes('national')
      ? 'country'
      : searchPlaceholder?.toLowerCase().includes('lang')
        ? 'language'
        : 'country'
  );

  const getFlag = (option: string): string => {
    if (!showFlags) return "";
    if (detectedFlagType === 'language') return getLanguageFlagForName(option);
    return getCountryFlagForName(option);
  };

  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
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
          <span className="truncate flex items-center gap-2">
            {selectedFlag && <span className="text-lg leading-none">{selectedFlag}</span>}
            {value || placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-gold/60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={cn(
          "w-[var(--radix-popover-trigger-width)] p-0 bg-white border-gold/30 shadow-xl shadow-gold/10 z-[10060]",
          className
        )}
        align="start"
        side="bottom"
        sideOffset={6}
        avoidCollisions={false}
      >
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

        <div className="max-h-[320px] overflow-y-auto p-1" onWheel={(e) => e.stopPropagation()}>
          {filteredOptions.length === 0 ? (
            <div className="py-6 text-center text-sm text-zinc-500">
              No results found
            </div>
          ) : (
            filteredOptions.map((option) => {
              const flag = getFlag(option);
              return (
                <button
                  key={option}
                  onClick={() => {
                    onChange(option);
                    setOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-3 text-base rounded-md transition-colors text-left",
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
                  {flag && <span className="text-lg leading-none shrink-0">{flag}</span>}
                  <span className="truncate text-sm sm:text-base">{option}</span>
                  {option === priorityItem && (
                    <span className="ml-auto text-xs text-gold/60">Default</span>
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

export default SearchableSelect;
