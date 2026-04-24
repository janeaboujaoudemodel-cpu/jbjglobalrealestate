import { useState, CSSProperties } from "react";
import { Briefcase, User, ChevronDown, Check, Loader2, Users, Building2 } from "lucide-react";
import { useUserModeContext, UserMode } from "@/contexts/UserModeContext";
import { useUserRole } from "@/hooks/useUserRole";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface ModeSwitcherProps {
  variant?: 'header' | 'compact' | 'full';
  className?: string;
  showForUnselected?: boolean;
  /** Which side the dropdown opens to. Use "top" inside the footer so it
   *  flips upward instead of overlaying the page above it. */
  side?: 'top' | 'bottom' | 'left' | 'right';
}

type ModePalette = {
  label: string;
  shortLabel: string;
  icon: typeof User;
  description: string;
  // Hard-coded hex colors so the global Tailwind grayscale remap of
  // orange/blue/green/purple cannot wash out the mode identity.
  base: string;     // primary mode color (e.g. button border, ring)
  light: string;    // soft tinted background for the row card
  lighter: string;  // very soft tinted background for the trigger
  dark: string;     // text color on light surfaces
  iconBg: string;   // icon container background
  iconBorder: string; // icon container border
};

// Per-mode palette per owner spec:
//   Investor          -> orange
//   Broker            -> blue
//   Investor + Broker -> green
//   Developer         -> purple
const MODE_CONFIG: Record<UserMode, ModePalette> = {
  investor: {
    label: 'Mode: Investor',
    shortLabel: 'I',
    icon: User,
    description: 'Browse properties, access ROI tools, upload listings, explore guides & market insights',
    base: '#F97316',      // orange-500
    light: '#FFEDD5',     // orange-100
    lighter: '#FFF7ED',   // orange-50
    dark: '#9A3412',      // orange-800
    iconBg: '#FFEDD5',
    iconBorder: '#FDBA74',
  },
  broker: {
    label: 'Mode: Broker',
    shortLabel: 'B',
    icon: Briefcase,
    description: 'CRM dashboard, education hub, sell properties, upload listings, coordinate with clients & close deals',
    base: '#2563EB',      // blue-600
    light: '#DBEAFE',     // blue-100
    lighter: '#EFF6FF',   // blue-50
    dark: '#1E3A8A',      // blue-900
    iconBg: '#DBEAFE',
    iconBorder: '#93C5FD',
  },
  investor_broker: {
    label: 'Mode: Investor + Broker',
    shortLabel: 'I+B',
    icon: Users,
    description: 'Full access to investor tools, broker dashboard, CRM, listings, guides & market intelligence',
    base: '#16A34A',      // green-600
    light: '#DCFCE7',     // green-100
    lighter: '#F0FDF4',   // green-50
    dark: '#14532D',      // green-900
    iconBg: '#DCFCE7',
    iconBorder: '#86EFAC',
  },
  developer: {
    label: 'Mode: Developer',
    shortLabel: 'D',
    icon: Building2,
    description: 'Submit projects, upload terraces & documents, manage launches, marketing materials & event calendar',
    base: '#7C3AED',      // violet-600
    light: '#EDE9FE',     // violet-100
    lighter: '#F5F3FF',   // violet-50
    dark: '#4C1D95',      // violet-900
    iconBg: '#EDE9FE',
    iconBorder: '#C4B5FD',
  },
};

export const ModeSwitcher = ({ variant = 'header', className, showForUnselected = false, side = 'bottom' }: ModeSwitcherProps) => {
  const { mode, isLoading, setMode } = useUserModeContext();
  const { hasSelectedRole } = useUserRole();
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredMode, setHoveredMode] = useState<UserMode | null>(null);

  if (!hasSelectedRole && !showForUnselected) return null;

  const handleModeChange = async (newMode: UserMode) => {
    await setMode(newMode);
    window.dispatchEvent(new CustomEvent('userModeChange', { detail: newMode }));
    toast.success(`Switched to ${MODE_CONFIG[newMode].label}`, {
      description: MODE_CONFIG[newMode].description,
    });
    setTimeout(() => setIsOpen(false), 400);
  };

  const currentConfig = MODE_CONFIG[mode];
  const CurrentIcon = currentConfig.icon;

  const triggerStyle: CSSProperties = {
    backgroundColor: currentConfig.lighter,
    borderColor: currentConfig.base,
    color: currentConfig.dark,
    boxShadow: `0 1px 0 ${currentConfig.base}33`,
  };

  if (variant === 'compact') {
    return (
      <button
        onClick={() => setIsOpen(true)}
        disabled={isLoading}
        style={triggerStyle}
        className={cn(
          "flex items-center gap-1.5 px-2 py-1 rounded-full border-2 transition-all duration-300",
          className
        )}
      >
        {isLoading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: currentConfig.base }} />
        ) : (
          <CurrentIcon className="w-3.5 h-3.5" style={{ color: currentConfig.base }} />
        )}
        <span className="text-xs font-semibold" style={{ color: currentConfig.dark }}>
          {currentConfig.shortLabel}
        </span>
      </button>
    );
  }

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      // data-surface="light" defeats the global [data-surface="dark"]
      // color override so mode-colored text stays legible inside the
      // obsidian footer / dark headers.
      data-surface="light"
    >
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen} modal={false}>
        <DropdownMenuTrigger asChild>
          <button
            disabled={isLoading}
            style={triggerStyle}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border-2 transition-all duration-300 hover:shadow-md max-w-[240px] whitespace-nowrap shrink-0",
              "focus:outline-none focus-visible:ring-2",
              className
            )}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin shrink-0" style={{ color: currentConfig.base }} />
            ) : (
              <CurrentIcon className="w-4 h-4 shrink-0" style={{ color: currentConfig.base }} />
            )}
            <span
              className="text-xs font-bold truncate hidden sm:block"
              style={{ color: currentConfig.dark }}
            >
              {currentConfig.label}
            </span>
            <ChevronDown
              className={cn("w-3 h-3 shrink-0 transition-transform duration-200", isOpen && "rotate-180")}
              style={{ color: currentConfig.base }}
            />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          side={side}
          className="w-80 mr-3 bg-white border border-gray-200 shadow-xl rounded-xl p-2 z-[10001]"
          sideOffset={8}
          collisionPadding={16}
          avoidCollisions
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          <div className="px-3 py-2.5 mb-2 rounded-lg bg-gray-50 border border-gray-200">
            <p className="text-sm font-bold text-black">Select your mode</p>
            <p className="text-xs text-gray-600 mt-0.5">
              Choose how you want to use the platform
            </p>
          </div>

          {/* Stable spaced stack — colored cards never touch */}
          <div className="flex flex-col gap-2">
            {(Object.entries(MODE_CONFIG) as [UserMode, ModePalette][]).map(([modeKey, config]) => {
              const Icon = config.icon;
              const isActive = mode === modeKey;
              const isHovered = hoveredMode === modeKey;

              const rowStyle: CSSProperties = {
                backgroundColor: isHovered ? config.light : config.lighter,
                borderColor: isActive || isHovered ? config.base : config.iconBorder,
                color: config.dark,
                boxShadow: isActive ? `0 0 0 2px ${config.base}55` : undefined,
                transform: 'none',
              };

              return (
                <DropdownMenuItem
                  key={modeKey}
                  onSelect={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleModeChange(modeKey);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                  onMouseEnter={() => setHoveredMode(modeKey)}
                  onMouseLeave={() => setHoveredMode(null)}
                  onFocus={() => setHoveredMode(modeKey)}
                  onBlur={() => setHoveredMode(null)}
                  style={rowStyle}
                  unstyled
                  className={cn(
                    "mode-switcher-item",
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors duration-200 border-2",
                    "focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1",
                  )}
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center border-2 shrink-0"
                    style={{ backgroundColor: config.iconBg, borderColor: config.iconBorder }}
                  >
                    <Icon className="w-4 h-4" style={{ color: config.base }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold" style={{ color: config.dark }}>
                      {config.label}
                    </p>
                    <p className="text-[11px] leading-snug mt-0.5" style={{ color: config.dark, opacity: 0.85 }}>
                      {config.description}
                    </p>
                  </div>
                  {isActive && (
                    <Check className="w-4 h-4 shrink-0" style={{ color: config.base }} />
                  )}
                </DropdownMenuItem>
              );
            })}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default ModeSwitcher;
