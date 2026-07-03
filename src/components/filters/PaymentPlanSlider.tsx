/**
 * PaymentPlanSlider - Dual-handle slider for payment plan percentage (0-100%)
 */

import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PAYMENT_PLAN_DEFAULTS } from "@/constants/filterConfig";

interface PaymentPlanSliderProps {
  preHandoverMin: number;
  preHandoverMax: number;
  hasPostHandover: boolean;
  onPreHandoverChange: (min: number, max: number) => void;
  onHasPostHandoverChange: (value: boolean) => void;
  variant?: 'light' | 'dark';
  className?: string;
}

export function PaymentPlanSlider({
  preHandoverMin,
  preHandoverMax,
  hasPostHandover,
  onPreHandoverChange,
  onHasPostHandoverChange,
  variant = 'light',
  className
}: PaymentPlanSliderProps) {
  const isDark = variant === 'dark';
  
  const handleReset = () => {
    onPreHandoverChange(PAYMENT_PLAN_DEFAULTS.min, PAYMENT_PLAN_DEFAULTS.max);
    onHasPostHandoverChange(false);
  };

  const isModified = preHandoverMin !== PAYMENT_PLAN_DEFAULTS.min || 
                     preHandoverMax !== PAYMENT_PLAN_DEFAULTS.max ||
                     hasPostHandover;

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <label className={cn(
          "text-sm font-medium",
          isDark ? "text-white" : "text-[#1A1A1A]"
        )}>
          Payment Plan
        </label>
        {isModified && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className={cn(
              "h-7 px-2 text-xs gap-1",
              isDark 
                  ? "text-white hover:text-white hover:bg-[#2a2a2a]"
                  : "text-[#1A1A1A] hover:text-[#1A1A1A] hover:bg-champagne-light"
            )}
          >
            <RotateCcw className="w-3 h-3" />
            Reset
          </Button>
        )}
      </div>
      
      {/* Labels */}
      <div className="flex justify-between text-xs">
        <span className={isDark ? "text-white" : "text-[#1A1A1A]"}>
          Pre-Handover
        </span>
        <span className={isDark ? "text-white" : "text-[#1A1A1A]"}>
          Post-Handover
        </span>
      </div>
      
      {/* Slider */}
      <div className="relative px-1">
        <Slider
          value={[preHandoverMin, preHandoverMax]}
          min={PAYMENT_PLAN_DEFAULTS.min}
          max={PAYMENT_PLAN_DEFAULTS.max}
          step={PAYMENT_PLAN_DEFAULTS.step}
          onValueChange={([min, max]) => onPreHandoverChange(min, max)}
          className="w-full"
        />
        
        {/* Visual percentage indicator */}
        <div className="flex justify-between mt-2">
          <div className={cn(
            "text-sm font-medium tabular-nums",
            isDark ? "text-white" : "text-[#1A1A1A]"
          )}>
            {preHandoverMin}%
          </div>
          <div className={cn(
            "text-sm font-medium tabular-nums",
            isDark ? "text-white" : "text-[#1A1A1A]"
          )}>
            {preHandoverMax}%
          </div>
        </div>
      </div>
      
      {/* Post-handover checkbox */}
      <div className="flex items-center gap-3 pt-2">
        <Checkbox
          id="post-handover"
          checked={hasPostHandover}
          onCheckedChange={(checked) => onHasPostHandoverChange(checked === true)}
          className={cn(
            isDark ? "border-white/40" : "border-[#064E3B]/40",
            "data-[state=checked]:bg-[#064E3B] data-[state=checked]:border-[#064E3B]"
          )}
        />
        <label 
          htmlFor="post-handover" 
          className={cn(
            "text-sm cursor-pointer",
            isDark ? "text-white" : "text-[#1A1A1A]"
          )}
        >
          Only show projects with post-handover payments
        </label>
      </div>
    </div>
  );
}

// Compact version for inline use
interface PaymentPlanCompactProps {
  value: [number, number];
  onChange: (value: [number, number]) => void;
  variant?: 'light' | 'dark';
  className?: string;
}

export function PaymentPlanCompact({
  value,
  onChange,
  variant = 'light',
  className
}: PaymentPlanCompactProps) {
  const isDark = variant === 'dark';

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between text-xs">
        <span className={isDark ? "text-white" : "text-[#1A1A1A]"}>
          Payment Plan: {value[0]}% - {value[1]}%
        </span>
      </div>
      <Slider
        value={value}
        min={0}
        max={100}
        step={5}
        onValueChange={(val) => onChange(val as [number, number])}
        className="w-full"
      />
    </div>
  );
}
