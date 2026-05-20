import { useState } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { LANGUAGES, findLanguageByName } from "@/data/languages";
import { cn } from "@/lib/utils";

interface Props {
  value: string[];
  onChange: (languages: string[]) => void;
  placeholder?: string;
  className?: string;
}

export default function LanguageMultiPicker({ value, onChange, placeholder = "Add languages", className }: Props) {
  const [open, setOpen] = useState(false);
  const selected = (value || []).map((n) => ({ name: n, entry: findLanguageByName(n) }));

  const toggle = (name: string) => {
    const exists = (value || []).some((v) => v.toLowerCase() === name.toLowerCase());
    if (exists) {
      onChange((value || []).filter((v) => v.toLowerCase() !== name.toLowerCase()));
    } else {
      onChange([...(value || []), name]);
    }
  };

  const remove = (name: string) =>
    onChange((value || []).filter((v) => v.toLowerCase() !== name.toLowerCase()));

  return (
    <div className={cn("space-y-2", className)}>
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map(({ name, entry }) => (
            <span
              key={name}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#EFE6D6] border border-[#B89555]/40 text-xs text-[#1A1A1A]"
            >
              {entry?.flag && <span className="text-sm leading-none">{entry.flag}</span>}
              <span>{entry?.name || name}</span>
              <button
                type="button"
                onClick={() => remove(name)}
                className="ml-0.5 rounded-full hover:bg-[#FDFBF7] p-0.5"
                aria-label={`Remove ${name}`}
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="w-full h-10 flex items-center justify-between gap-2 rounded-md border border-[#B89555]/30 bg-[#FDFBF7] px-3 text-sm text-[#1A1A1A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B89555]/40"
          >
            <span className="truncate">
              {selected.length > 0 ? (
                <span className="text-[#1A1A1A]/70">
                  {selected.length} selected — add more
                </span>
              ) : (
                <span className="text-[#1A1A1A]/50">{placeholder}</span>
              )}
            </span>
            <ChevronsUpDown className="w-4 h-4 text-[#1A1A1A]/50 shrink-0" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="p-0 w-[var(--radix-popover-trigger-width)] min-w-[260px] bg-[#FDFBF7] border-[#B89555]/40"
        >
          <Command>
            <CommandInput placeholder="Search language…" className="text-[#1A1A1A]" />
            <CommandList className="max-h-72">
              <CommandEmpty>No match.</CommandEmpty>
              <CommandGroup>
                {LANGUAGES.map((l) => {
                  const isSelected = (value || []).some((v) => v.toLowerCase() === l.name.toLowerCase());
                  return (
                    <CommandItem
                      key={l.code}
                      value={`${l.name} ${l.code}`}
                      onSelect={() => toggle(l.name)}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <span className="text-base leading-none">{l.flag}</span>
                      <span className="flex-1 truncate">{l.name}</span>
                      {isSelected && <Check className="w-4 h-4 text-[#B89555]" />}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
