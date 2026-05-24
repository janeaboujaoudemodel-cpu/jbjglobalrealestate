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
}: SortBySelectProps) {
  const current = options.find((o) => o.value === value);
  const h = size === "compact" ? "h-10" : "h-11";
  const width = hideLabel ? "w-[140px]" : "w-[200px]";
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        className={`${width} ${h} bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-2 border-[#B89555]/40 text-[#1A1A1A] rounded-xl text-sm shadow-sm hover:border-[#B89555] transition-colors ${className}`}
        aria-label="Sort by"
      >
        <ArrowUpDown className="w-4 h-4 mr-2 text-[#B89555] flex-shrink-0" />
        <span className="truncate text-left flex-1">
          {hideLabel ? (
            <span className="font-semibold">{current?.label ?? "Newest"}</span>
          ) : (
            <>
              <span className="text-[#1A1A1A]/70 font-medium">Sort by:</span>{" "}
              <span className="font-semibold">{current?.label ?? "Newest"}</span>
            </>
          )}
        </span>
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
