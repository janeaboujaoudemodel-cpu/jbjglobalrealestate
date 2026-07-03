import { ArrowUpDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type SortOption = { value: string; label: string };

interface SortBySelectProps {
  value: string;
  onChange: (value: string) => void;
  options?: SortOption[];
  className?: string;
  /** Compact == h-10. Default == h-11. */
  size?: "default" | "compact";
  /** Hide the "Sort by:" prefix label and show only the selected option. */
  hideLabel?: boolean;
  /** Icon-only mode: show just ⇅ + "Sort by" text. No value, no chevron. Smallest footprint. */
  iconOnly?: boolean;
  /** Borderless mode (for embedding in unified pills). */
  borderless?: boolean;
}

export const DEFAULT_SORT_OPTIONS: SortOption[] = [
  { value: "newest", label: "Newest" },
  { value: "oldest", label: "Oldest" },
  { value: "price-low", label: "Price: Low → High" },
  { value: "price-high", label: "Price: High → Low" },
];

/**
 * Premium, brand-consistent Sort By dropdown.
 * Use site-wide wherever a list/grid offers sort options.
 */
export function SortBySelect({
  value,
  onChange,
  options = DEFAULT_SORT_OPTIONS,
  className = "",
  size = "default",
  hideLabel = false,
  iconOnly = false,
  borderless = false,
}: SortBySelectProps) {
  const current = options.find((o) => o.value === value);
  const h = size === "compact" ? "h-10" : "h-11";
  const width = iconOnly ? "w-auto" : hideLabel ? "w-[140px]" : "w-[200px]";
  const frame = borderless
    ? "allow-white bg-transparent border-0 shadow-none text-white hover:bg-white/10 [&>svg]:text-white"
    : "bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border border-[#064E3B]/30 rounded-xl shadow-sm hover:border-[#064E3B]/55";
  // In iconOnly mode, hide the trailing Radix chevron
  const chevronOff = iconOnly ? "[&_.lucide-chevron-down]:hidden" : "";
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        className={`${width} ${h} px-3 ${frame} ${borderless ? "text-white" : "text-[#1A1A1A]"} text-sm transition-colors ${chevronOff} ${className}`}
        aria-label="Sort by"
      >
        <ArrowUpDown className={`w-4 h-4 mr-1.5 ${borderless ? "text-white" : "text-[#064E3B]"} flex-shrink-0`} />
        {iconOnly ? (
          <span className={`font-semibold text-[13px] ${borderless ? "text-white" : "text-[#1A1A1A]"}`}>Sort by</span>
        ) : (
          <span className="truncate text-left flex-1">
            {hideLabel ? (
              <span className="font-semibold">{current?.label ?? "Newest"}</span>
            ) : (
              <>
                <span className="text-[#1A1A1A] font-medium">Sort by:</span>{" "}
                <span className="font-semibold">{current?.label ?? "Newest"}</span>
              </>
            )}
          </span>
        )}
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export default SortBySelect;
