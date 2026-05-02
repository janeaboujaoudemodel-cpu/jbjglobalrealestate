import { X, Tag, Layers, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  activeChipBase,
  activeChipPrimary,
  activeChipDismissDot,
} from "@/components/filters/filterStyles";

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
 *
 * Styling sources every class from `filterStyles.ts` so contrast and active
 * state stay consistent with the rest of the filter UI.
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
      <span className="text-[10px] uppercase tracking-[0.18em] font-semibold text-[#1A1A1A]/70">
        Active filters:
      </span>

      {txLabel && (
        <span className={activeChipPrimary}>
          <ShoppingBag className="w-3 h-3" aria-hidden />
          {txLabel}
        </span>
      )}

      {statusLabel && (
        <button
          type="button"
          onClick={onClearStatus}
          className={`${activeChipBase} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B89555] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FDFBF7] transition-colors`}
          aria-label={`Clear status filter: ${statusLabel}`}
        >
          <Layers className="w-3 h-3" aria-hidden />
          {statusLabel}
          <span className={activeChipDismissDot}>
            <X className="w-2.5 h-2.5" aria-hidden />
          </span>
        </button>
      )}

      {typeLabel && (
        <button
          type="button"
          onClick={onClearType}
          className={`${activeChipBase} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#B89555] focus-visible:ring-offset-2 focus-visible:ring-offset-[#FDFBF7] transition-colors`}
          aria-label={`Clear category filter: ${typeLabel}`}
        >
          <Tag className="w-3 h-3" aria-hidden />
          {typeLabel}
          <span className={activeChipDismissDot}>
            <X className="w-2.5 h-2.5" aria-hidden />
          </span>
        </button>
      )}

      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-7 px-2 text-xs font-semibold text-[#1A1A1A]/70 hover:text-[#1A1A1A] hover:bg-[#1A1A1A]/5"
        onClick={onClearAll}
      >
        Clear all
      </Button>
    </div>
  );
}

export default ActiveFilterIndicator;
