/**
 * CRMFiltersPopover — single-line "Filters" trigger that opens a popover
 * containing all secondary filters for the CRM Relationships tabs.
 * Shows an active-count badge and renders chips below for quick clearing.
 */
import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { SlidersHorizontal, X } from "lucide-react";

export interface FilterChip {
  key: string;
  label: string;
  onClear: () => void;
}

interface Props {
  activeCount: number;
  chips?: FilterChip[];
  children: ReactNode;
  onResetAll?: () => void;
}

export function CRMFiltersPopover({ activeCount, chips = [], children, onResetAll }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="border-[#B89555]/40">
            <SlidersHorizontal className="w-4 h-4 mr-2" />
            Filters
            {activeCount > 0 && (
              <span className="ml-2 px-1.5 py-0.5 rounded-full bg-[#1A1A1A] text-white text-[10px] font-bold">
                {activeCount}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[420px] bg-[#FDFBF7] border-[#B89555]/40 p-4 space-y-3" align="start">
          {children}
          {onResetAll && activeCount > 0 && (
            <div className="pt-2 border-t border-[#B89555]/20 flex justify-end">
              <Button variant="ghost" size="sm" onClick={onResetAll}>
                Reset all
              </Button>
            </div>
          )}
        </PopoverContent>
      </Popover>
      {chips.map((c) => (
        <button
          key={c.key}
          onClick={c.onClear}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#EFE6D6] border border-[#B89555]/40 text-[11px] font-semibold text-[#1A1A1A] hover:bg-[#F7F2EA]"
          title="Remove filter"
        >
          {c.label}
          <X className="w-3 h-3" />
        </button>
      ))}
    </div>
  );
}
