/**
 * SaleStatusFilter — Multi-select sale status with colored dots.
 *
 * Uses the canonical filter tokens from `filterStyles.ts` so triggers,
 * popovers, checkboxes and clear-button all match the rest of the filter UI
 * and meet the accessibility / faded-gold rules (no text-[#1A1A1A]/XX, no
 * placeholder below /70).
 */

import { useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { SALE_STATUS_OPTIONS, getSaleStatusConfig } from "@/constants/filterConfig";
import {
  filterPillBase,
  filterPillActive,
  filterPillInactiveLight,
  filterPillInactiveDark,
  filterPopoverSurface,
  filterCheckBox,
  filterCheckBoxOn,
  filterCheckBoxOff,
} from "./filterStyles";

interface SaleStatusFilterProps {
  value: string[];
  onChange: (value: string[]) => void;
  variant?: 'light' | 'dark';
  className?: string;
}

export function SaleStatusFilter({
  value,
  onChange,
  variant = 'light',
  className,
}: SaleStatusFilterProps) {
  const [open, setOpen] = useState(false);

  const toggleStatus = (statusValue: string) => {
    if (statusValue === 'all') {
      onChange([]);
      return;
    }

    const newValue = value.includes(statusValue)
      ? value.filter(v => v !== statusValue)
      : [...value, statusValue];
    onChange(newValue);
  };

  const clearAll = () => {
    onChange([]);
  };

  const selectedCount = value.length;
  const isActive = selectedCount > 0;
  const displayText = selectedCount === 0
    ? "All Statuses"
    : selectedCount === 1
      ? value[0]
      : `${selectedCount} Selected`;

  const triggerClass = cn(
    filterPillBase,
    "h-11 min-w-[160px] justify-between max-w-none",
    isActive
      ? filterPillActive
      : variant === 'dark'
        ? filterPillInactiveDark
        : filterPillInactiveLight,
    className,
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          role="combobox"
          aria-expanded={open}
          className={triggerClass}
        >
          <div className="flex items-center gap-2 truncate">
            {selectedCount > 0 && (
              <div className="flex -space-x-1">
                {value.slice(0, 3).map(status => {
                  const config = getSaleStatusConfig(status);
                  return config ? (
                    <div
                      key={status}
                      className={cn(
                        "w-2.5 h-2.5 rounded-full ring-2",
                        isActive ? "ring-[#1A1A1A]" : "ring-[#FDFBF7]",
                        config.dotClass,
                      )}
                    />
                  ) : null;
                })}
              </div>
            )}
            <span className="truncate">{displayText}</span>
          </div>
          <ChevronDown
            className={cn(
              "ml-2 h-4 w-4 shrink-0 transition-opacity",
              isActive ? "opacity-90" : "opacity-70",
            )}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={cn(filterPopoverSurface, "w-[240px] p-2")}
        align="start"
        side="bottom"
        sideOffset={8}
        avoidCollisions
      >
        <div className="space-y-1">
          {SALE_STATUS_OPTIONS.filter(opt => opt.value !== 'all').map((option) => {
            const isSelected = value.includes(option.value);
            const config = 'color' in option ? option.color : null;

            return (
              <button
                key={option.value}
                onClick={() => toggleStatus(option.value)}
                className={cn(
                  "flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  "text-[#1A1A1A] hover:bg-[#F7F2EA]",
                  isSelected && "bg-[#F7F2EA]",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#064E3B] focus-visible:ring-offset-1 focus-visible:ring-offset-[#FDFBF7]",
                )}
              >
                <span
                  className={cn(
                    filterCheckBox,
                    isSelected ? filterCheckBoxOn : filterCheckBoxOff,
                  )}
                >
                  {isSelected && <Check className="w-3 h-3 text-white" />}
                </span>

                {config && (
                  <div className={cn("w-2.5 h-2.5 rounded-full", config.dotClass)} />
                )}

                <span>{option.label}</span>
              </button>
            );
          })}
        </div>

        {selectedCount > 0 && (
          <div className="mt-2 pt-2 border-t border-[#064E3B]/20">
            <button
              onClick={clearAll}
              className="w-full text-center text-xs font-semibold py-1.5 rounded text-[#1A1A1A] hover:text-[#1A1A1A] hover:bg-[#F7F2EA] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#064E3B]"
            >
              Clear Selection
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

// Single-select version for simpler use cases
interface SaleStatusSelectProps {
  value: string | null;
  onChange: (value: string | null) => void;
  variant?: 'light' | 'dark';
  className?: string;
}

export function SaleStatusSelect({
  value,
  onChange,
  variant = 'light',
  className,
}: SaleStatusSelectProps) {
  const [open, setOpen] = useState(false);
  const config = value ? getSaleStatusConfig(value) : null;
  const isActive = !!value;

  const triggerClass = cn(
    filterPillBase,
    "h-11 min-w-[140px] justify-between max-w-none",
    isActive
      ? filterPillActive
      : variant === 'dark'
        ? filterPillInactiveDark
        : filterPillInactiveLight,
    className,
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          role="combobox"
          aria-expanded={open}
          className={triggerClass}
        >
          <div className="flex items-center gap-2">
            {config && (
              <div className={cn("w-2.5 h-2.5 rounded-full", config.dotClass)} />
            )}
            <span>{value || "Status"}</span>
          </div>
          <ChevronDown
            className={cn(
              "ml-2 h-4 w-4 shrink-0 transition-opacity",
              isActive ? "opacity-90" : "opacity-70",
            )}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={cn(filterPopoverSurface, "w-[200px] p-2")}
        align="start"
        side="bottom"
        sideOffset={8}
        avoidCollisions
      >
        <div className="space-y-1">
          {SALE_STATUS_OPTIONS.map((option) => {
            const optConfig = option.value !== 'all' ? getSaleStatusConfig(option.value) : null;
            const isSelected = value === option.value || (option.value === 'all' && !value);

            return (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value === 'all' ? null : option.value);
                  setOpen(false);
                }}
                className={cn(
                  "flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  "text-[#1A1A1A] hover:bg-[#F7F2EA]",
                  isSelected && "bg-[#F7F2EA]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#064E3B] focus-visible:ring-offset-1 focus-visible:ring-offset-[#FDFBF7]",
                )}
              >
                {optConfig && (
                  <div className={cn("w-2.5 h-2.5 rounded-full", optConfig.dotClass)} />
                )}
                {!optConfig && <div className="w-2.5" />}

                <span>{option.label}</span>

                {isSelected && (
                  <Check className="ml-auto w-4 h-4 text-[#1A1A1A]" />
                )}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
