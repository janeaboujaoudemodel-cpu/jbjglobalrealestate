/**
 * HandoverDateRange - From/To year pickers for handover filtering
 */

import { useState } from "react";
import { ChevronDown, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { HANDOVER_YEAR_OPTIONS } from "@/constants/filterConfig";

interface HandoverDateRangeProps {
  fromYear: number | null;
  toYear: number | null;
  onFromYearChange: (year: number | null) => void;
  onToYearChange: (year: number | null) => void;
  variant?: 'light' | 'dark';
  className?: string;
}

export function HandoverDateRange({
  fromYear,
  toYear,
  onFromYearChange,
  onToYearChange,
  variant = 'light',
  className
}: HandoverDateRangeProps) {
  const [open, setOpen] = useState(false);
  const isDark = variant === 'dark';

  const hasValue = fromYear !== null || toYear !== null;
  
  const displayText = hasValue
    ? fromYear && toYear
      ? `${fromYear} - ${toYear}`
      : fromYear
        ? `From ${fromYear}`
        : `Until ${toYear}`
    : "Handover Date";

  const clearSelection = () => {
    onFromYearChange(null);
    onToYearChange(null);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "justify-between min-w-[160px] h-11",
            isDark 
              ? "bg-[#1a1a1a] border-[#2a2a2a] text-white hover:bg-[#2a2a2a]"
              : "bg-white/90 border-gold/30 text-black hover:bg-champagne-light",
            className
          )}
        >
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 opacity-60" />
            <span>{displayText}</span>
          </div>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className={cn(
          "w-[280px] p-4",
          isDark ? "bg-[#1a1a1a] border-[#2a2a2a]" : "bg-white border-gold/20"
        )}
        align="start"
        sideOffset={8}
        avoidCollisions={true}
        style={{ zIndex: 10500 }}
      >
        <div className="space-y-4">
          <h4 className={cn(
            "text-sm font-medium",
            isDark ? "text-white" : "text-black"
          )}>
            Project Handover By
          </h4>
          
          <div className="grid grid-cols-2 gap-3">
            {/* From Year */}
            <div className="space-y-1.5">
              <label className={cn(
                "text-xs",
                isDark ? "text-zinc-400" : "text-black/60"
              )}>
                From
              </label>
              <Select
                value={fromYear?.toString() ?? "any"}
                onValueChange={(val) => onFromYearChange(val === "any" ? null : parseInt(val))}
              >
                <SelectTrigger className={cn(
                  "h-10 w-full",
                  isDark 
                    ? "bg-[#2a2a2a] border-[#3a3a3a] text-white"
                    : "bg-champagne-light border-gold/30 text-black"
                )}>
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent position="popper" className={cn("z-[10600]", isDark ? "bg-[#1a1a1a] border-[#2a2a2a]" : "bg-white")}>
                  <SelectItem value="any" className={isDark ? "text-white hover:bg-[#2a2a2a]" : ""}>
                    Any
                  </SelectItem>
                  {HANDOVER_YEAR_OPTIONS.map((year) => (
                    <SelectItem 
                      key={year.value} 
                      value={year.value.toString()}
                      className={isDark ? "text-white hover:bg-[#2a2a2a]" : ""}
                    >
                      {year.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* To Year */}
            <div className="space-y-1.5">
              <label className={cn(
                "text-xs",
                isDark ? "text-zinc-400" : "text-black/60"
              )}>
                To
              </label>
              <Select
                value={toYear?.toString() ?? "any"}
                onValueChange={(val) => onToYearChange(val === "any" ? null : parseInt(val))}
              >
                <SelectTrigger className={cn(
                  "h-10 w-full",
                  isDark 
                    ? "bg-[#2a2a2a] border-[#3a3a3a] text-white"
                    : "bg-champagne-light border-gold/30 text-black"
                )}>
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent position="popper" className={cn("z-[10600]", isDark ? "bg-[#1a1a1a] border-[#2a2a2a]" : "bg-white")}>
                  <SelectItem value="any" className={isDark ? "text-white hover:bg-[#2a2a2a]" : ""}>
                    Any
                  </SelectItem>
                  {HANDOVER_YEAR_OPTIONS.map((year) => (
                    <SelectItem 
                      key={year.value} 
                      value={year.value.toString()}
                      className={isDark ? "text-white hover:bg-[#2a2a2a]" : ""}
                      disabled={fromYear !== null && year.value < fromYear}
                    >
                      {year.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {hasValue && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSelection}
              className={cn(
                "w-full",
                isDark 
                  ? "text-zinc-400 hover:text-white hover:bg-[#2a2a2a]"
                  : "text-black/60 hover:text-black hover:bg-champagne-light"
              )}
            >
              Clear Selection
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// Inline version for compact spaces
interface HandoverDateInlineProps {
  fromYear: number | null;
  toYear: number | null;
  onFromYearChange: (year: number | null) => void;
  onToYearChange: (year: number | null) => void;
  variant?: 'light' | 'dark';
  className?: string;
}

export function HandoverDateInline({
  fromYear,
  toYear,
  onFromYearChange,
  onToYearChange,
  variant = 'light',
  className
}: HandoverDateInlineProps) {
  const isDark = variant === 'dark';

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Select
        value={fromYear?.toString() ?? "any"}
        onValueChange={(val) => onFromYearChange(val === "any" ? null : parseInt(val))}
      >
        <SelectTrigger className={cn(
          "h-10 w-24",
          isDark 
            ? "bg-[#1a1a1a] border-[#2a2a2a] text-white"
            : "bg-white/90 border-gold/30 text-black"
        )}>
          <SelectValue placeholder="From" />
        </SelectTrigger>
        <SelectContent className={isDark ? "bg-[#1a1a1a] border-[#2a2a2a]" : ""}>
          <SelectItem value="any" className={isDark ? "text-white" : ""}>Any</SelectItem>
          {HANDOVER_YEAR_OPTIONS.map((year) => (
            <SelectItem key={year.value} value={year.value.toString()} className={isDark ? "text-white" : ""}>
              {year.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <span className={isDark ? "text-zinc-500" : "text-black/40"}>–</span>
      
      <Select
        value={toYear?.toString() ?? "any"}
        onValueChange={(val) => onToYearChange(val === "any" ? null : parseInt(val))}
      >
        <SelectTrigger className={cn(
          "h-10 w-24",
          isDark 
            ? "bg-[#1a1a1a] border-[#2a2a2a] text-white"
            : "bg-white/90 border-gold/30 text-black"
        )}>
          <SelectValue placeholder="To" />
        </SelectTrigger>
        <SelectContent className={isDark ? "bg-[#1a1a1a] border-[#2a2a2a]" : ""}>
          <SelectItem value="any" className={isDark ? "text-white" : ""}>Any</SelectItem>
          {HANDOVER_YEAR_OPTIONS.map((year) => (
            <SelectItem 
              key={year.value} 
              value={year.value.toString()} 
              className={isDark ? "text-white" : ""}
              disabled={fromYear !== null && year.value < fromYear}
            >
              {year.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
