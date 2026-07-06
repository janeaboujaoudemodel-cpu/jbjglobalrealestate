/**
 * SearchableMultiSelect
 * --------------------------------------------------------------------------
 * Champagne-themed dropdown multi-select used everywhere in the CRM where
 * a filter control was previously a long static <select>.
 *
 * Features:
 *   - Live search box at the top of the dropdown
 *   - Select all / Unselect all
 *   - Per-row tick + count badge in the trigger
 *   - Controlled (selected: string[], onChange)
 *
 * Visual rules: champagne surfaces, gold hairline border, ink text.
 */
import { useMemo, useState } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export interface MultiOption {
  value: string;
  label: string;
  count?: number | null;
  /** Optional category badge tint (CSS color or hex) — renders as a colored dot before the label. */
  dot?: string | null;
  /** Optional group heading rendered above this option (sticky-style separator). */
  group?: string | null;
}

interface Props {
  label: string;
  options: MultiOption[];
  selected: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  className?: string;
  /** Accessibility label override for the trigger button */
  ariaLabel?: string;
}

export function SearchableMultiSelect({
  label,
  options,
  selected,
  onChange,
  placeholder = "Search…",
  className = "",
  ariaLabel,
}: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);

  const allChecked =
    filtered.length > 0 && filtered.every((o) => selected.includes(o.value));
  const someChecked = filtered.some((o) => selected.includes(o.value));

  const toggle = (value: string) => {
    if (selected.includes(value)) onChange(selected.filter((v) => v !== value));
    else onChange([...selected, value]);
  };

  const selectAllVisible = () => {
    const visibleValues = filtered.map((o) => o.value);
    const next = Array.from(new Set([...selected, ...visibleValues]));
    onChange(next);
  };
  const unselectAllVisible = () => {
    const visibleValues = new Set(filtered.map((o) => o.value));
    onChange(selected.filter((v) => !visibleValues.has(v)));
  };
  const clearAll = () => onChange([]);

  const triggerLabel =
    selected.length === 0
      ? label
      : `${label} · ${selected.length}`;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={ariaLabel ?? label}
          data-surface={selected.length > 0 ? "emerald" : "champagne"}
          data-emerald-ok={selected.length > 0 ? "button" : undefined}
          className={[
            "inline-flex items-center gap-2 px-3 h-10 rounded-lg text-sm font-semibold transition-all",
            selected.length > 0
              ? "jj-chip-emerald allow-white border-transparent"
              : "border border-[#B89555]/40 bg-[#FDFBF7] text-[#1A1A1A] hover:bg-[#F7F2EA]",
            className,
          ].join(" ")}
        >
          <span>{triggerLabel}</span>
          {selected.length > 0 && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                clearAll();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  clearAll();
                }
              }}
              className={selected.length > 0 ? "text-white hover:text-white" : "text-[#1A1A1A]/60 hover:text-[#1A1A1A]"}
              aria-label="Clear selection"
            >
              <X className="h-3.5 w-3.5" />
            </span>
          )}
          <ChevronDown className={selected.length > 0 ? "h-3.5 w-3.5 text-white" : "h-3.5 w-3.5 text-[#1A1A1A]/60"} />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-72 p-0 bg-[#FDFBF7] border border-[#B89555]/40 shadow-xl ring-1 ring-[#B89555]/10 rounded-lg"
      >
        <div className="p-2 border-b border-[#B89555]/20">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#1A1A1A]/50" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder}
              className="w-full h-8 pl-7 pr-2 rounded-md border border-[#B89555]/30 bg-[#FDFBF7] text-sm text-[#1A1A1A] placeholder:text-[#1A1A1A]/40 focus:outline-none focus:border-[#B89555]"
            />
          </div>
          <div className="mt-2 flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={allChecked ? unselectAllVisible : selectAllVisible}
              className="px-2 py-0.5 rounded border border-[#B89555]/30 text-[#1A1A1A] hover:bg-[#EFE6D6]"
            >
              {allChecked ? "Unselect all" : "Select all"}
            </button>
            {someChecked && !allChecked && (
              <button
                type="button"
                onClick={unselectAllVisible}
                className="px-2 py-0.5 rounded border border-[#B89555]/30 text-[#1A1A1A] hover:bg-[#EFE6D6]"
              >
                Clear visible
              </button>
            )}
            <span className="ml-auto text-[#1A1A1A]/60">
              {filtered.length} option{filtered.length === 1 ? "" : "s"}
            </span>
          </div>
        </div>
        <div className="max-h-72 overflow-y-auto py-1">
          {filtered.length === 0 ? (
            <div className="px-3 py-6 text-center text-xs text-[#1A1A1A]/60">
              No matches
            </div>
          ) : (
            (() => {
              const out: React.ReactNode[] = [];
              let lastGroup: string | null | undefined;
              filtered.forEach((opt) => {
                if (opt.group && opt.group !== lastGroup) {
                  lastGroup = opt.group;
                  out.push(
                    <div
                      key={`grp-${opt.group}`}
                      className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-[#1A1A1A]/55 bg-[#F7F2EA]/60"
                    >
                      {opt.group}
                    </div>
                  );
                }
                const checked = selected.includes(opt.value);
                out.push(
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => toggle(opt.value)}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-left hover:bg-[#EFE6D6] text-[#1A1A1A] transition-colors"
                    role="menuitemcheckbox"
                    aria-checked={checked}
                  >
                    <span
                      className={[
                        "inline-flex items-center justify-center w-4 h-4 rounded border",
                        checked
                          ? "jj-chip-emerald allow-white border-transparent text-white"
                          : "bg-[#FDFBF7] border-[#B89555]/40",
                      ].join(" ")}
                    >
                      {checked && <Check className="h-3 w-3" />}
                    </span>
                    {opt.dot && !checked && (
                      <span
                        aria-hidden
                        className="inline-block h-2.5 w-2.5 rounded-full ring-1 ring-black/5 shrink-0"
                        style={{ backgroundColor: opt.dot }}
                      />
                    )}
                    <span className="flex-1 truncate">{opt.label}</span>
                    {opt.count != null && (
                      <span className="text-[10px] text-[#1A1A1A]/60 tabular-nums">
                        {opt.count.toLocaleString()}
                      </span>
                    )}
                  </button>
                );
              });
              return out;
            })()
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default SearchableMultiSelect;
