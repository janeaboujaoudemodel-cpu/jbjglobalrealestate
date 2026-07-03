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
            "allow-white jj-pill-emerald-metallic border-0 text-white hover:text-white",
            className
          )}
        >
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 opacity-100 text-white" />
            <span>{displayText}</span>
          </div>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-100 text-white" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        data-filter-dropdown="true"
        className="allow-white w-[280px] p-4 bg-gradient-to-br from-[#064E3B] via-[#042C1C] to-[#010806] border border-white/24 text-white"
        align="start"
        sideOffset={8}
        avoidCollisions={true}
        style={{ zIndex: 10500 }}
      >
        <div className="space-y-4">
          <h4 className={cn(
            "text-sm font-medium",
            "allow-white text-white"
          )}>
            Project Handover By
          </h4>
          
          <div className="grid grid-cols-2 gap-3">
            {/* From Year */}
            <div className="space-y-1.5">
              <label className={cn(
                "text-xs",
                "allow-white text-white"
              )}>
                From
              </label>
              <Select
                value={fromYear?.toString() ?? "any"}
                onValueChange={(val) => onFromYearChange(val === "any" ? null : parseInt(val))}
              >
                <SelectTrigger className={cn(
                  "h-10 w-full",
                  "allow-white bg-[#021611]/82 border-white/28 text-white"
                )}>
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent position="popper" className="z-[10600]">
                  <SelectItem value="any">
                    Any
                  </SelectItem>
                  {HANDOVER_YEAR_OPTIONS.map((year) => (
                    <SelectItem 
                      key={year.value} 
                      value={year.value.toString()}
                      className=""
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
                "allow-white text-white"
              )}>
                To
              </label>
              <Select
                value={toYear?.toString() ?? "any"}
                onValueChange={(val) => onToYearChange(val === "any" ? null : parseInt(val))}
              >
                <SelectTrigger className={cn(
                  "h-10 w-full",
                  "allow-white bg-[#021611]/82 border-white/28 text-white"
                )}>
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent position="popper" className="z-[10600]">
                  <SelectItem value="any">
                    Any
                  </SelectItem>
                  {HANDOVER_YEAR_OPTIONS.map((year) => (
                    <SelectItem 
                      key={year.value} 
                      value={year.value.toString()}
                      className=""
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
                  "allow-white text-white hover:text-white hover:bg-white/12"
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
            ? "allow-white bg-[#021611]/82 border-white/28 text-white"
            : "allow-white bg-[#021611]/82 border-white/28 text-white"
        )}>
          <SelectValue placeholder="From" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="any">Any</SelectItem>
          {HANDOVER_YEAR_OPTIONS.map((year) => (
            <SelectItem key={year.value} value={year.value.toString()}>
              {year.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <span className="allow-white text-white">–</span>
      
      <Select
        value={toYear?.toString() ?? "any"}
        onValueChange={(val) => onToYearChange(val === "any" ? null : parseInt(val))}
      >
        <SelectTrigger className={cn(
          "h-10 w-24",
          isDark 
            ? "allow-white bg-[#021611]/82 border-white/28 text-white"
            : "allow-white bg-[#021611]/82 border-white/28 text-white"
        )}>
          <SelectValue placeholder="To" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="any">Any</SelectItem>
          {HANDOVER_YEAR_OPTIONS.map((year) => (
            <SelectItem 
              key={year.value} 
              value={year.value.toString()} 
              className=""
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
