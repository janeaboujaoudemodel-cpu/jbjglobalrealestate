/**
 * DisplayModeToggle - Broker vs Investor mode switcher
 */

import { TrendingUp, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { type DisplayMode } from "@/constants/filterConfig";

interface DisplayModeToggleProps {
  value: DisplayMode;
  onChange: (value: DisplayMode) => void;
  variant?: 'light' | 'dark';
  size?: 'sm' | 'md';
  className?: string;
}

export function DisplayModeToggle({
  value,
  onChange,
  variant = 'light',
  size = 'md',
  className
}: DisplayModeToggleProps) {
  const isDark = variant === 'dark';
  const isSmall = size === 'sm';

  const modes = [
    { 
      value: 'investor' as DisplayMode, 
      label: 'Investor', 
      icon: TrendingUp,
      shortLabel: '📈'
    },
    { 
      value: 'broker' as DisplayMode, 
      label: 'Broker', 
      icon: Briefcase,
      shortLabel: '🏢'
    },
  ];

  return (
    <div 
      className={cn(
        "inline-flex rounded-xl p-1",
        isDark 
          ? "bg-[#1a1a1a] border border-[#2a2a2a]"
          : "bg-white/80 border border-gold/30",
        className
      )}
    >
      {modes.map((mode) => {
        const Icon = mode.icon;
        const isActive = value === mode.value;
        
        return (
          <button
            key={mode.value}
            onClick={() => onChange(mode.value)}
            className={cn(
              "flex items-center gap-2 rounded-lg transition-all",
              isSmall ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm",
              isActive
                ? "bg-gold text-black font-medium shadow-sm"
                : isDark
                  ? "text-zinc-400 hover:text-white hover:bg-[#2a2a2a]"
                  : "text-black/60 hover:text-black hover:bg-champagne-light"
            )}
          >
            <Icon className={cn(
              isSmall ? "w-3.5 h-3.5" : "w-4 h-4"
            )} />
            <span className={isSmall ? "hidden sm:inline" : ""}>
              {mode.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// Compact icon-only version
interface DisplayModeIconToggleProps {
  value: DisplayMode;
  onChange: (value: DisplayMode) => void;
  variant?: 'light' | 'dark';
  className?: string;
}

export function DisplayModeIconToggle({
  value,
  onChange,
  variant = 'light',
  className
}: DisplayModeIconToggleProps) {
  const isDark = variant === 'dark';

  return (
    <div 
      className={cn(
        "inline-flex rounded-lg p-0.5",
        isDark 
          ? "bg-[#1a1a1a] border border-[#2a2a2a]"
          : "bg-white/80 border border-gold/30",
        className
      )}
    >
      <button
        onClick={() => onChange('investor')}
        className={cn(
          "p-2 rounded-md transition-all",
          value === 'investor'
            ? "bg-gold text-black"
            : isDark
              ? "text-zinc-400 hover:text-white"
              : "text-black/60 hover:text-black"
        )}
        title="Investor View — See investment-focused content like ROI, yields & capital growth"
      >
        <TrendingUp className="w-4 h-4" />
      </button>
      <button
        onClick={() => onChange('broker')}
        className={cn(
          "p-2 rounded-md transition-all",
          value === 'broker'
            ? "bg-gold text-black"
            : isDark
              ? "text-zinc-400 hover:text-white"
              : "text-black/60 hover:text-black"
        )}
        title="Broker View — See broker tools, commissions & deal registration"
      >
        <Briefcase className="w-4 h-4" />
      </button>
    </div>
  );
}
