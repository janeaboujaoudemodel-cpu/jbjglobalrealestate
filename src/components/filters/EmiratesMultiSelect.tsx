/**
 * EmiratesMultiSelect - Checkbox-based multi-select for Emirates
 */

import { useState } from "react";
import { ChevronDown, Check, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { EMIRATES_OPTIONS } from "@/constants/filterConfig";

interface EmiratesMultiSelectProps {
  value: string[];
  onChange: (value: string[]) => void;
  variant?: 'light' | 'dark';
  className?: string;
}

export function EmiratesMultiSelect({ 
  value, 
  onChange, 
  variant = 'light',
  className 
}: EmiratesMultiSelectProps) {
  const [open, setOpen] = useState(false);

  const toggleEmirate = (emirateValue: string) => {
    const newValue = value.includes(emirateValue)
      ? value.filter(v => v !== emirateValue)
      : [...value, emirateValue];
    onChange(newValue);
  };

  const clearAll = () => {
    onChange([]);
  };

  const selectAll = (country: string) => {
    const countryEmirates = EMIRATES_OPTIONS
      .filter(e => e.country === country)
      .map(e => e.value);
    
    const allSelected = countryEmirates.every(e => value.includes(e));
    
    if (allSelected) {
      onChange(value.filter(v => !countryEmirates.includes(v as typeof EMIRATES_OPTIONS[number]['value'])));
    } else {
      const newValue = [...new Set([...value, ...countryEmirates])];
      onChange(newValue);
    }
  };

  const selectedCount = value.length;
  const displayText = selectedCount === 0 
    ? "All Locations" 
    : selectedCount === 1 
      ? value[0] 
      : `${selectedCount} Selected`;

  const isDark = variant === 'dark';
  
  const uaeEmirates = EMIRATES_OPTIONS.filter(e => e.country === 'UAE');
  const internationalLocations = EMIRATES_OPTIONS.filter(e => e.country === 'International');

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            "justify-between min-w-[160px] h-11",
            "allow-white jj-pill-emerald-metallic border-0 text-white hover:text-white",
            className
          )}
        >
          <div className="flex items-center gap-2 truncate">
            <MapPin className="w-4 h-4 opacity-100 text-white" />
            <span className="truncate">{displayText}</span>
          </div>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-100 text-white" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        data-filter-dropdown="true"
        className="allow-white w-[260px] p-0 bg-gradient-to-br from-[#064E3B] via-[#042C1C] to-[#010806] border border-white/24 text-white"
        align="start"
      >
        <div className="max-h-[320px] overflow-y-auto">
          {/* UAE Section */}
          <div className="p-2">
            <button
              onClick={() => selectAll('UAE')}
              className={cn(
                "flex items-center justify-between w-full px-3 py-2 text-xs font-semibold uppercase tracking-wider rounded",
                "allow-white text-white hover:bg-white/12"
              )}
            >
              <span>UAE Emirates</span>
              <span className="text-[10px] font-normal normal-case">
                {uaeEmirates.every(e => value.includes(e.value)) ? 'Deselect All' : 'Select All'}
              </span>
            </button>
            
            <div className="space-y-0.5 mt-1">
              {uaeEmirates.map((emirate) => {
                const isSelected = value.includes(emirate.value);
                
                return (
                  <button
                    key={emirate.value}
                    onClick={() => toggleEmirate(emirate.value)}
                    className={cn(
                      "flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm transition-colors",
                      "allow-white text-white hover:bg-white/12",
                      isSelected && "bg-white/12"
                    )}
                  >
                    <div className={cn(
                      "w-4 h-4 rounded border flex items-center justify-center transition-colors",
                      "border-white/40",
                      isSelected && "allow-white jj-pill-emerald-metallic border-0"
                    )}>
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </div>
                    
                    <span className="allow-white text-white">
                      {emirate.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
          
          {/* Divider */}
          <div className={cn(
            "mx-3 border-t",
            "border-white/20"
          )} />
          
          {/* International Section */}
          <div className="p-2">
            <button
              onClick={() => selectAll('International')}
              className={cn(
                "flex items-center justify-between w-full px-3 py-2 text-xs font-semibold uppercase tracking-wider rounded",
                "allow-white text-white hover:bg-white/12"
              )}
            >
              <span>International</span>
              <span className="text-[10px] font-normal normal-case">
                {internationalLocations.every(e => value.includes(e.value)) ? 'Deselect All' : 'Select All'}
              </span>
            </button>
            
            <div className="space-y-0.5 mt-1">
              {internationalLocations.map((location) => {
                const isSelected = value.includes(location.value);
                
                return (
                  <button
                    key={location.value}
                    onClick={() => toggleEmirate(location.value)}
                    className={cn(
                      "flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm transition-colors",
                      "allow-white text-white hover:bg-white/12",
                      isSelected && "bg-white/12"
                    )}
                  >
                    <div className={cn(
                      "w-4 h-4 rounded border flex items-center justify-center transition-colors",
                      "border-white/40",
                      isSelected && "allow-white jj-pill-emerald-metallic border-0"
                    )}>
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </div>
                    
                    <span className="allow-white text-white">
                      {location.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className={cn(
          "p-2 border-t flex items-center justify-between",
          "border-white/20 bg-black/12"
        )}>
          <span className={cn(
            "text-xs",
            "allow-white text-white"
          )}>
            {selectedCount} selected
          </span>
          
          {selectedCount > 0 && (
            <button
              onClick={clearAll}
              className={cn(
                "text-xs px-2 py-1 rounded transition-colors",
                "allow-white text-white hover:text-white hover:bg-white/12"
              )}
            >
              Clear
            </button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
