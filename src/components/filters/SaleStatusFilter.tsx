/**
 * SaleStatusFilter - Multi-select sale status with colored dots
 */

import { useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { SALE_STATUS_OPTIONS, getSaleStatusConfig } from "@/constants/filterConfig";

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
  className 
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
  const displayText = selectedCount === 0 
    ? "All Statuses" 
    : selectedCount === 1 
      ? value[0] 
      : `${selectedCount} Selected`;

  const isDark = variant === 'dark';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "justify-between min-w-[160px] h-11",
            isDark 
              ? "bg-[#1a1a1a] border-[#2a2a2a] text-white hover:bg-[#2a2a2a]"
              : "bg-white border-gold/30 text-black hover:bg-champagne-light",
            className
          )}
        >
          <div className="flex items-center gap-2 truncate">
            {selectedCount > 0 && (
              <div className="flex -space-x-1">
                {value.slice(0, 3).map(status => {
                  const config = getSaleStatusConfig(status);
                  return config ? (
                    <div 
                      key={status}
                      className={cn("w-2.5 h-2.5 rounded-full ring-2 ring-white", config.dotClass)} 
                    />
                  ) : null;
                })}
              </div>
            )}
            <span className="truncate">{displayText}</span>
          </div>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className={cn(
          "w-[240px] p-2",
          isDark ? "bg-[#1a1a1a] border-[#2a2a2a]" : "bg-white border-gold/20"
        )}
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
                  "flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm transition-colors",
                  isDark 
                    ? "hover:bg-[#2a2a2a]"
                    : "hover:bg-champagne-light",
                  isSelected && (isDark ? "bg-[#2a2a2a]" : "bg-champagne-light")
                )}
              >
                <div className={cn(
                  "w-4 h-4 rounded border flex items-center justify-center",
                  isDark ? "border-zinc-600" : "border-gold/40",
                  isSelected && "bg-gold border-gold"
                )}>
                  {isSelected && <Check className="w-3 h-3 text-black" />}
                </div>
                
                {config && (
                  <div className={cn("w-2.5 h-2.5 rounded-full", config.dotClass)} />
                )}
                
                <span className={isDark ? "text-white" : "text-black"}>
                  {option.label}
                </span>
              </button>
            );
          })}
        </div>
        
        {selectedCount > 0 && (
          <div className={cn(
            "mt-2 pt-2 border-t",
            isDark ? "border-zinc-700" : "border-gold/20"
          )}>
            <button
              onClick={clearAll}
              className={cn(
                "w-full text-center text-sm py-1.5 rounded transition-colors",
                isDark 
                  ? "text-zinc-400 hover:text-white hover:bg-[#2a2a2a]"
                  : "text-black/60 hover:text-black hover:bg-champagne-light"
              )}
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
  className 
}: SaleStatusSelectProps) {
  const [open, setOpen] = useState(false);
  const config = value ? getSaleStatusConfig(value) : null;
  const isDark = variant === 'dark';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "justify-between min-w-[140px] h-11",
            isDark 
              ? "bg-[#1a1a1a] border-[#2a2a2a] text-white hover:bg-[#2a2a2a]"
              : "bg-white border-gold/30 text-black hover:bg-champagne-light",
            className
          )}
        >
          <div className="flex items-center gap-2">
            {config && (
              <div className={cn("w-2.5 h-2.5 rounded-full", config.dotClass)} />
            )}
            <span>{value || "Status"}</span>
          </div>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className={cn(
          "w-[200px] p-2",
          isDark ? "bg-[#1a1a1a] border-[#2a2a2a]" : "bg-white border-gold/20"
        )}
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
                  "flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm transition-colors",
                  isDark 
                    ? "hover:bg-[#2a2a2a]"
                    : "hover:bg-champagne-light",
                  isSelected && (isDark ? "bg-[#2a2a2a]" : "bg-champagne-light")
                )}
              >
                {optConfig && (
                  <div className={cn("w-2.5 h-2.5 rounded-full", optConfig.dotClass)} />
                )}
                {!optConfig && <div className="w-2.5" />}
                
                <span className={isDark ? "text-white" : "text-black"}>
                  {option.label}
                </span>
                
                {isSelected && (
                  <Check className="ml-auto w-4 h-4 text-gold" />
                )}
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
