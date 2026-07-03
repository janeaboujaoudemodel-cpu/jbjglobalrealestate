/**
 * SettingsDropdown - Currency, Unit, and Display Mode settings
 */

import { useState } from "react";
import { Settings, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { 
  CURRENCY_OPTIONS, 
  AREA_UNIT_OPTIONS, 
  DISPLAY_MODE_OPTIONS,
  type CurrencyCode,
  type AreaUnit,
  type DisplayMode
} from "@/constants/filterConfig";

interface SettingsDropdownProps {
  currency: CurrencyCode;
  areaUnit: AreaUnit;
  displayMode: DisplayMode;
  onCurrencyChange: (value: CurrencyCode) => void;
  onAreaUnitChange: (value: AreaUnit) => void;
  onDisplayModeChange: (value: DisplayMode) => void;
  variant?: 'light' | 'dark';
  className?: string;
}

export function SettingsDropdown({
  currency,
  areaUnit,
  displayMode,
  onCurrencyChange,
  onAreaUnitChange,
  onDisplayModeChange,
  variant = 'light',
  className
}: SettingsDropdownProps) {
  const [open, setOpen] = useState(false);
  const isDark = variant === 'dark';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className={cn(
            "h-11 w-11",
            isDark 
              ? "bg-[#1a1a1a] border-[#2a2a2a] text-white hover:bg-[#2a2a2a]"
              : "bg-[#FDFBF7]/90 border-[#064E3B]/30 text-[#1A1A1A] hover:bg-champagne-light",
            className
          )}
        >
          <Settings className="w-5 h-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className={cn(
          "w-[280px] p-0",
          isDark ? "bg-[#1a1a1a] border-[#2a2a2a]" : "bg-[#FDFBF7] border-[#064E3B]/20"
        )}
        align="end"
      >
        {/* Measure Unit */}
        <div className="p-4 space-y-3">
          <h4 className={cn(
            "text-xs font-semibold uppercase tracking-wider",
            isDark ? "text-white" : "text-[#1A1A1A]"
          )}>
            Measure Unit
          </h4>
          <div className="flex gap-2">
            {AREA_UNIT_OPTIONS.map((unit) => (
              <button
                key={unit.value}
                onClick={() => onAreaUnitChange(unit.value)}
                className={cn(
                  "flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors",
                  areaUnit === unit.value
                    ? "bg-[#EFE6D6] text-[#1A1A1A]"
                    : isDark 
                      ? "bg-[#2a2a2a] text-white hover:bg-[#333]"
                      : "bg-champagne-light text-[#1A1A1A] hover:bg-champagne"
                )}
              >
                {unit.shortLabel}
              </button>
            ))}
          </div>
        </div>
        
        {/* Divider */}
        <div className={cn("border-t", isDark ? "border-white/20" : "border-[#064E3B]/20")} />
        
        {/* Currency */}
        <div className="p-4 space-y-3">
          <h4 className={cn(
            "text-xs font-semibold uppercase tracking-wider",
            isDark ? "text-white" : "text-[#1A1A1A]"
          )}>
            Currency
          </h4>
          <div className="grid grid-cols-5 gap-1.5">
            {CURRENCY_OPTIONS.map((cur) => (
              <button
                key={cur.code}
                onClick={() => onCurrencyChange(cur.code)}
                className={cn(
                  "py-2 px-1 rounded-lg text-xs font-medium transition-colors text-center",
                  currency === cur.code
                    ? "bg-[#EFE6D6] text-[#1A1A1A]"
                    : isDark 
                      ? "bg-[#2a2a2a] text-white hover:bg-[#333]"
                      : "bg-champagne-light text-[#1A1A1A] hover:bg-champagne"
                )}
                title={cur.label}
              >
                {cur.code}
              </button>
            ))}
          </div>
        </div>
        
        {/* Divider */}
        <div className={cn("border-t", isDark ? "border-white/20" : "border-[#064E3B]/20")} />
        
        {/* Display Mode */}
        <div className="p-4 space-y-3">
          <h4 className={cn(
            "text-xs font-semibold uppercase tracking-wider",
            isDark ? "text-white" : "text-[#1A1A1A]"
          )}>
            Display Mode
          </h4>
          <div className="space-y-2">
            {DISPLAY_MODE_OPTIONS.map((mode) => (
              <button
                key={mode.value}
                onClick={() => onDisplayModeChange(mode.value)}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left",
                  displayMode === mode.value
                    ? isDark 
                      ? "bg-[#064E3B]/20 border border-[#064E3B]/40"
                      : "bg-[#064E3B]/10 border border-[#064E3B]/30"
                    : isDark 
                      ? "bg-[#2a2a2a] hover:bg-[#333]"
                      : "bg-champagne-light hover:bg-champagne"
                )}
              >
                <div className={cn(
                  "w-5 h-5 rounded-full border-2 flex items-center justify-center",
                  displayMode === mode.value
                    ? "border-[#064E3B] bg-[#064E3B]"
                    : isDark ? "border-white/40" : "border-[#064E3B]/40"
                )}>
                  {displayMode === mode.value && (
                    <Check className="w-3 h-3 text-[#1A1A1A]" />
                  )}
                </div>
                <div className="flex-1">
                  <div className={cn(
                    "text-sm font-medium",
                    isDark ? "text-white" : "text-[#1A1A1A]"
                  )}>
                    {mode.label}
                  </div>
                  <div className={cn(
                    "text-xs",
                    isDark ? "text-[#EFE6D6]" : "text-[#1A1A1A]/60"
                  )}>
                    {mode.description}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
        
        {/* Apply Button */}
        <div className={cn(
          "p-3 border-t",
          isDark ? "border-white/20 bg-[#151515]" : "border-[#064E3B]/20 bg-champagne-light/50"
        )}>
          <Button
            onClick={() => setOpen(false)}
            className="allow-white w-full jj-pill-emerald-metallic text-white hover:brightness-110"
          >
            Apply Settings
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
