import { X, Tag, Layers, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";

const TYPE_LABELS: Record<string, string> = {
  apartments: "Apartments",
  apartment: "Apartments",
  villa: "Villas",
  villas: "Villas",
  townhouse: "Townhouses",
  townhouses: "Townhouses",
  penthouse: "Penthouses",
  penthouses: "Penthouses",
  commercial: "Commercial",
};

const STATUS_LABELS: Record<string, string> = {
  ready: "Ready",
  "off-plan": "Off-Plan",
  "close-to-handover": "Close to Handover",
};

interface ActiveFilterIndicatorProps {
  transactionType: "buy" | "rent" | "all" | null;
  completionStatus: string | null;
  propertyType: string | null;
  onClearTransaction?: () => void;
  onClearStatus: () => void;
  onClearType: () => void;
  onClearAll: () => void;
}

/**
 * Compact summary of the deep-link filters currently applied (transaction
 * type, completion status, property category). Each chip can be dismissed
 * individually. Renders nothing when no deep-link filter is active.
 */
export function ActiveFilterIndicator({
  transactionType,
  completionStatus,
  propertyType,
  onClearStatus,
  onClearType,
  onClearAll,
}: ActiveFilterIndicatorProps) {
  const txLabel =
    transactionType === "rent"
      ? "For Rent"
      : transactionType === "buy"
      ? "For Sale"
      : null;
  const statusLabel = completionStatus
    ? STATUS_LABELS[completionStatus] || completionStatus
    : null;
  const typeLabel = propertyType
    ? TYPE_LABELS[propertyType.toLowerCase()] || propertyType
    : null;

  // Only show when at least one of status / type is active. (Transaction
  // alone is already represented by the Buy/Rent segmented control above.)
  if (!statusLabel && !typeLabel) return null;

  return (
    <div
      className="flex flex-wrap items-center gap-2 mb-3"
      role="status"
      aria-live="polite"
      aria-label="Active filters"
    >
      <span className="text-xs uppercase tracking-[0.18em] font-semibold text-black/60">
        Active filters:
      </span>

      {txLabel && (
        <span className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full bg-black text-white text-xs font-medium">
          <ShoppingBag className="w-3 h-3" aria-hidden />
          {txLabel}
        </span>
      )}

      {statusLabel && (
        <button
          type="button"
          onClick={onClearStatus}
          className="group inline-flex items-center gap-1.5 h-7 pl-2.5 pr-1.5 rounded-full bg-white border border-black/15 text-black text-xs font-medium hover:border-black/40 transition-colors"
          aria-label={`Clear status filter: ${statusLabel}`}
        >
          <Layers className="w-3 h-3" aria-hidden />
          {statusLabel}
          <span className="ml-0.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-black/5 group-hover:bg-black/15 transition-colors">
            <X className="w-2.5 h-2.5" aria-hidden />
          </span>
        </button>
      )}

      {typeLabel && (
        <button
          type="button"
          onClick={onClearType}
          className="group inline-flex items-center gap-1.5 h-7 pl-2.5 pr-1.5 rounded-full bg-white border border-black/15 text-black text-xs font-medium hover:border-black/40 transition-colors"
          aria-label={`Clear category filter: ${typeLabel}`}
        >
          <Tag className="w-3 h-3" aria-hidden />
          {typeLabel}
          <span className="ml-0.5 inline-flex items-center justify-center w-4 h-4 rounded-full bg-black/5 group-hover:bg-black/15 transition-colors">
            <X className="w-2.5 h-2.5" aria-hidden />
          </span>
        </button>
      )}

      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-7 px-2 text-xs text-black/70 hover:text-black hover:bg-black/5"
        onClick={onClearAll}
      >
        Clear all
      </Button>
    </div>
  );
}

export default ActiveFilterIndicator;
