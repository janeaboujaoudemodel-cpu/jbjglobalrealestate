import * as React from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";

export interface ComboOption {
  value: string;
  label: string;
  prefix?: React.ReactNode;
  keywords?: string[];
}

interface SingleProps {
  options: ComboOption[];
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  className?: string;
  triggerClassName?: string;
  renderSelected?: (opt: ComboOption | undefined) => React.ReactNode;
}

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Select…",
  searchPlaceholder = "Search…",
  emptyText = "No results.",
  triggerClassName,
  renderSelected,
}: SingleProps) {
  const [open, setOpen] = React.useState(false);
  const selected = options.find((o) => o.value === value);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "flex h-10 w-full items-center justify-between rounded-md border border-input bg-white px-3 py-2 text-sm text-[#1A1A1A]",
            "focus:outline-none focus:ring-2 focus:ring-[#B89555]/40",
            triggerClassName,
          )}
        >
          <span className="flex items-center gap-2 truncate">
            {renderSelected ? renderSelected(selected) : selected ? (
              <>
                {selected.prefix}
                <span className="truncate">{selected.label}</span>
              </>
            ) : (
              <span className="text-[#1A1A1A]/50">{placeholder}</span>
            )}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-[--radix-popover-trigger-width] bg-white" align="start">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {options.map((opt) => (
                <CommandItem
                  key={opt.value}
                  value={`${opt.label} ${opt.keywords?.join(" ") ?? ""}`}
                  onSelect={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  {opt.prefix}
                  <span className="flex-1 truncate">{opt.label}</span>
                  {value === opt.value && <Check className="h-4 w-4 text-[#1A1A1A]" />}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

interface MultiProps {
  options: ComboOption[];
  values: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  triggerClassName?: string;
  max?: number;
}

export function SearchableMultiSelect({
  options,
  values,
  onChange,
  placeholder = "Select…",
  searchPlaceholder = "Search…",
  emptyText = "No results.",
  triggerClassName,
  max,
}: MultiProps) {
  const [open, setOpen] = React.useState(false);
  const selectedOpts = options.filter((o) => values.includes(o.value));

  const toggle = (v: string) => {
    if (values.includes(v)) onChange(values.filter((x) => x !== v));
    else {
      if (max && values.length >= max) return;
      onChange([...values, v]);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "flex min-h-10 w-full items-center justify-between rounded-md border border-input bg-white px-2 py-1.5 text-sm text-[#1A1A1A]",
            "focus:outline-none focus:ring-2 focus:ring-[#B89555]/40",
            triggerClassName,
          )}
        >
          <span className="flex flex-wrap items-center gap-1 flex-1 min-w-0">
            {selectedOpts.length === 0 && (
              <span className="text-[#1A1A1A]/50 px-1">{placeholder}</span>
            )}
            {selectedOpts.map((o) => (
              <span
                key={o.value}
                className="inline-flex items-center gap-1 rounded bg-[#EFE6D6] border border-[#B89555]/30 px-1.5 py-0.5 text-xs"
              >
                {o.prefix}
                <span>{o.label}</span>
                <X
                  className="h-3 w-3 cursor-pointer opacity-60 hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggle(o.value);
                  }}
                />
              </span>
            ))}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-[--radix-popover-trigger-width] bg-white" align="start">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {options.map((opt) => {
                const checked = values.includes(opt.value);
                return (
                  <CommandItem
                    key={opt.value}
                    value={`${opt.label} ${opt.keywords?.join(" ") ?? ""}`}
                    onSelect={() => toggle(opt.value)}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <span
                      className={cn(
                        "flex h-4 w-4 items-center justify-center rounded-sm border",
                        checked ? "bg-[#1A1A1A] border-[#1A1A1A]" : "bg-white border-[#B89555]/50",
                      )}
                    >
                      {checked && <Check className="h-3 w-3 text-white" />}
                    </span>
                    {opt.prefix}
                    <span className="flex-1 truncate">{opt.label}</span>
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
