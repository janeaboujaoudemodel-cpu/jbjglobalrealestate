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
  base: string;     // primary mode color (saturated chip + accent)
  baseDark: string; // darker mode color for gradients / rims
  rowFrom: string;  // row card gradient start (clearly tinted)
  rowTo: string;    // row card gradient end (slightly deeper tint)
  rowHover: string; // row hover background
  dark: string;     // text color on light surfaces
};

// Per-mode palette (locked):
//   Investor          -> orange
//   Broker            -> blue
//   Investor + Broker -> green
//   Developer         -> purple
const MODE_CONFIG: Record<UserMode, ModePalette> = {
  investor: {
    label: 'Mode: Investor',
    shortLabel: 'I',
    icon: User,
    description: 'Browse properties, ROI tools, listings, guides & market insights',
    base: '#F97316',
    baseDark: '#C2410C',
    rowFrom: '#FFF1E0',
    rowTo: '#FFE0BF',
    rowHover: '#FFD0A0',
    dark: '#7C2D12',
  },
  broker: {
    label: 'Mode: Broker',
    shortLabel: 'B',
    icon: Briefcase,
    description: 'CRM, education hub, sell, listings, coordinate clients & close deals',
    base: '#2563EB',
    baseDark: '#1D4ED8',
    rowFrom: '#E8F0FE',
    rowTo: '#CFE0FB',
    rowHover: '#BBD2F8',
    dark: '#1E3A8A',
  },
  investor_broker: {
    label: 'Mode: Investor + Broker',
    shortLabel: 'I+B',
    icon: Users,
    description: 'Full investor + broker access: tools, CRM, listings, guides & insights',
    base: '#16A34A',
    baseDark: '#15803D',
    rowFrom: '#E5F8EC',
    rowTo: '#C7EFD3',
    rowHover: '#B0E5C0',
    dark: '#14532D',
  },
  developer: {
    label: 'Mode: Developer',
    shortLabel: 'D',
    icon: Building2,
    description: 'Submit projects, upload documents, manage launches & event calendar',
    base: '#7C3AED',
    baseDark: '#6D28D9',
    rowFrom: '#F1ECFE',
    rowTo: '#DDD0FB',
    rowHover: '#CCB9F8',
    dark: '#4C1D95',
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

  // ─────────────────────────────────────────────────────────────────
  // Closed-trigger styling: a SOLID mode-color chip (not a pastel),
  // so the selected mode visibly "reflects" in header / footer / menu.
  // ─────────────────────────────────────────────────────────────────
  const triggerStyle: CSSProperties = {
    backgroundImage: `linear-gradient(135deg, ${currentConfig.base} 0%, ${currentConfig.baseDark} 100%)`,
    borderColor: currentConfig.baseDark,
    color: '#FFFFFF',
    boxShadow: `0 2px 6px ${currentConfig.base}55, inset 0 1px 0 rgba(255,255,255,0.25)`,
  };

  if (variant === 'compact') {
    return (
      <button
        onClick={() => setIsOpen(true)}
        disabled={isLoading}
        style={triggerStyle}
        className={cn(
          "flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-all duration-300",
          className
        )}
      >
        {isLoading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: '#FFFFFF' }} />
        ) : (
          <CurrentIcon className="w-3.5 h-3.5" style={{ color: '#FFFFFF' }} />
        )}
        <span className="text-xs font-bold" style={{ color: '#FFFFFF' }}>
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
      // color override so the trigger chip stays legible on dark surfaces.
      data-surface="light"
    >
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen} modal={false}>
        <DropdownMenuTrigger asChild>
          <button
            disabled={isLoading}
            style={triggerStyle}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all duration-300 hover:brightness-110 whitespace-nowrap shrink-0",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40",
              isOpen && "ring-2",
              className
            )}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin shrink-0" style={{ color: '#FFFFFF' }} />
            ) : (
              <CurrentIcon className="w-4 h-4 shrink-0" style={{ color: '#FFFFFF' }} />
            )}
            <span
              className="text-[10px] font-bold whitespace-nowrap leading-none hidden sm:block"
              style={{ color: '#FFFFFF' }}
            >
              {currentConfig.label}
            </span>
            <ChevronDown
              className={cn("w-3.5 h-3.5 shrink-0 transition-transform duration-200", isOpen && "rotate-180")}
              style={{ color: '#FFFFFF' }}
            />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          side={side}
          // data-surface="light" gives the portaled panel its own light-scope
          // so dark-surface CSS can't bleed in when the trigger is in the footer.
          data-surface="light"
          className="w-[360px] mr-3 bg-white border border-gray-200 shadow-2xl rounded-2xl p-3 z-[10001]"
          sideOffset={10}
          collisionPadding={{ top: 104, bottom: 16, left: 16, right: 16 }}
          avoidCollisions
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          <div className="px-3 pt-1 pb-3 mb-2 border-b border-[#D9C292]/40">
            <span className="inline-block px-2 py-0.5 rounded-full text-[9px] font-bold tracking-[0.18em] text-[#8A7747] bg-[#D9C292]/15 border border-[#D9C292]/40">
              MODE
            </span>
            <p className="text-[14px] font-bold text-black mt-1.5 leading-tight">Select your mode</p>
            <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">
              Choose how you want to use the platform
            </p>
          </div>

          {/* Tight premium stack — uniform row height */}
          <div className="flex flex-col gap-1.5">
            {(Object.entries(MODE_CONFIG) as [UserMode, ModePalette][]).map(([modeKey, config]) => {
              const Icon = config.icon;
              const isActive = mode === modeKey;
              const isHovered = hoveredMode === modeKey;

              const rowStyle: CSSProperties = {
                backgroundImage: isHovered
                  ? `linear-gradient(135deg, ${config.rowTo} 0%, ${config.rowHover} 100%)`
                  : `linear-gradient(135deg, ${config.rowFrom} 0%, ${config.rowTo} 100%)`,
                borderColor: config.base,
                color: config.dark,
                // 4px inset left accent bar + (when active) a single solid
                // outer ring in the mode color (no white gap) so the border
                // hugs the card edge cleanly.
                boxShadow: isActive
                  ? `inset 4px 0 0 ${config.base}, 0 0 0 3px ${config.base}`
                  : `inset 4px 0 0 ${config.base}`,
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
                    "relative flex items-center gap-3 pl-5 pr-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 border w-full min-h-[72px]",
                    "focus:outline-none",
                  )}
                >
                  {/* Saturated icon badge with halo */}
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{
                      backgroundImage: `linear-gradient(135deg, ${config.base} 0%, ${config.baseDark} 100%)`,
                      boxShadow: `0 0 0 4px ${config.base}22, 0 2px 6px ${config.base}55`,
                    }}
                  >
                    <Icon className="w-[18px] h-[18px]" style={{ color: '#FFFFFF' }} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold leading-tight" style={{ color: config.dark }}>
                      {config.label}
                    </p>
                    <p
                      className="text-[11px] leading-snug mt-0.5 line-clamp-1"
                      style={{ color: config.dark, opacity: 0.85 }}
                    >
                      {config.description}
                    </p>
                  </div>

                  {isActive ? (
                    <span
                      className="ml-2 inline-flex items-center justify-center gap-1 px-2.5 h-[22px] min-w-[96px] rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 whitespace-nowrap"
                      style={{ backgroundColor: config.base, color: '#FFFFFF' }}
                    >
                      <Check className="w-3 h-3 shrink-0" style={{ color: '#FFFFFF' }} />
                      Selected
                    </span>
                  ) : (
                    <span
                      className="ml-2 inline-flex items-center justify-center px-2.5 h-[22px] min-w-[96px] rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 whitespace-nowrap border"
                      style={{
                        color: config.base,
                        borderColor: config.base,
                        backgroundColor: 'rgba(255,255,255,0.6)',
                      }}
                    >
                      Select
                    </span>
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
