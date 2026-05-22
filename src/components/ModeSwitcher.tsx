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
  /** Foreground color used on top of `base` (icon badge fill + Selected pill). */
  onBase: string;
  surface: 'gold' | 'ink' | 'espresso';
};

// Per-mode palette (locked):
//   Investor          -> orange
//   Broker            -> blue
//   Investor + Broker -> green
//   Developer         -> purple
// Classy champagne/ink palette — refined to feel premium instead of loud.
// Each mode shares the brand champagne surface; only the accent rail + icon
// tone shifts subtly so the dropdown reads cohesive and editorial.
const MODE_CONFIG: Record<UserMode, ModePalette> = {
  investor: {
    label: 'Mode: Investor',
    shortLabel: 'I',
    icon: User,
    description: 'Browse properties, ROI tools, listings, guides & market insights',
    base: '#B89555',      // champagne gold accent
    baseDark: '#8A6E3D',
    rowFrom: '#FDFBF7',
    rowTo: '#F7F2EA',
    rowHover: '#EFE6D6',
    dark: '#1A1A1A',
    onBase: '#1A1A1A',    // ink on gold for legibility
    surface: 'gold',
  },
  broker: {
    label: 'Mode: Broker',
    shortLabel: 'B',
    icon: Briefcase,
    description: 'CRM, education hub, sell, listings, coordinate clients & close deals',
    base: '#1A1A1A',      // ink accent
    baseDark: '#0A0A0A',
    rowFrom: '#FDFBF7',
    rowTo: '#F7F2EA',
    rowHover: '#EFE6D6',
    dark: '#1A1A1A',
    onBase: '#FFFFFF',
    surface: 'ink',
  },
  // 'investor_broker' removed — strictly 3 categories now.
  developer: {
    label: 'Mode: Developer',
    shortLabel: 'D',
    icon: Building2,
    description: 'Submit projects, upload documents, manage launches & event calendar',
    base: '#3A2D1D',      // espresso
    baseDark: '#1F1810',
    rowFrom: '#FDFBF7',
    rowTo: '#F7F2EA',
    rowHover: '#EFE6D6',
    dark: '#1A1A1A',
    onBase: '#FFFFFF',
    surface: 'espresso',
  },
};

export const ModeSwitcher = ({ variant = 'header', className, showForUnselected = false, side = 'bottom' }: ModeSwitcherProps) => {
  const { mode, isLoading, setMode, hasMadeInitialSelection } = useUserModeContext();
  const { hasSelectedRole } = useUserRole();
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredMode, setHoveredMode] = useState<UserMode | null>(null);

  // Hide the badge only when no selection has been made AND the placement
  // hasn't opted in to the unselected/"Select your mode" CTA.
  const isUnselected = !hasMadeInitialSelection && !hasSelectedRole;
  if (isUnselected && !showForUnselected) return null;

  const handleModeChange = async (newMode: UserMode) => {
    await setMode(newMode);
    window.dispatchEvent(new CustomEvent('userModeChange', { detail: newMode }));
    toast.success(`Switched to ${MODE_CONFIG[newMode].label}`, {
      description: MODE_CONFIG[newMode].description,
    });
    setTimeout(() => setIsOpen(false), 400);
  };

  const currentConfig = MODE_CONFIG[mode];
  const CurrentIcon = isUnselected ? User : currentConfig.icon;
  const triggerLabel = isUnselected ? 'Select your mode' : currentConfig.label;
  const triggerShortLabel = isUnselected ? '?' : currentConfig.shortLabel;

  // ─────────────────────────────────────────────────────────────────
  // Closed-trigger styling: a saturated mode-color chip with **ink black**
  // label/icon (never white). Hover does NOT change colour — only floats
  // upward + adds a soft glow ring. Unselected state uses a neutral
  // champagne chip with a gold hairline so it reads as a CTA.
  // ─────────────────────────────────────────────────────────────────
  // Closed-trigger: uniform champagne chip with a gold hairline + thin
  // accent rail on the leading edge in the active mode's tone. Same look
  // whether selected or not — classy, consistent, no rainbow.
  const triggerStyle: CSSProperties = {
    backgroundImage: 'linear-gradient(135deg, #FDFBF7 0%, #EFE6D6 100%)',
    borderColor: 'rgba(184,149,85,0.55)',
    color: '#1A1A1A',
    boxShadow: isUnselected
      ? 'inset 0 1px 0 rgba(255,255,255,0.6), 0 1px 2px rgba(26,26,26,0.06)'
      : `inset 3px 0 0 ${currentConfig.base}, inset 0 1px 0 rgba(255,255,255,0.6), 0 1px 2px rgba(26,26,26,0.06)`,
  };

  if (variant === 'compact') {
    return (
      <button
        onClick={() => setIsOpen(true)}
        disabled={isLoading}
        style={triggerStyle}
        data-no-contrast-guard
        data-mode-trigger="compact"
        className={cn(
          "flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-all duration-200 hover:-translate-y-0.5",
          className
        )}
      >
        {isLoading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: '#1A1A1A' }} />
        ) : (
          <CurrentIcon className="w-3.5 h-3.5" style={{ color: '#1A1A1A' }} />
        )}
        <span className="text-xs font-bold" style={{ color: '#1A1A1A' }}>
          {triggerShortLabel}
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
            data-no-contrast-guard
            data-mode-trigger="header"
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg border transition-all duration-200 hover:-translate-y-0.5 whitespace-nowrap shrink-0",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40",
              isOpen && "ring-2",
              className
            )}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin shrink-0" style={{ color: '#1A1A1A' }} />
            ) : (
              <CurrentIcon className="w-4 h-4 shrink-0" style={{ color: '#1A1A1A' }} />
            )}
            <span
              className="text-[10px] font-bold whitespace-nowrap leading-none hidden sm:block"
              style={{ color: '#1A1A1A' }}
            >
              {triggerLabel}
            </span>
            <ChevronDown
              className={cn("w-3.5 h-3.5 shrink-0 transition-transform duration-200", isOpen && "rotate-180")}
              style={{ color: '#1A1A1A' }}
            />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          side={side}
          // data-surface="light" gives the portaled panel its own light-scope
          // so dark-surface CSS (e.g. inside <footer>) can't bleed in.
          // Inline styles on the panel + descendants are belt-and-suspenders
          // against any global rule that might force white/transparent text
          // when the trigger lives on a dark surface.
          data-surface="light"
          data-mode-switcher-panel="true"
          style={{ backgroundColor: '#FFFFFF', color: '#0A0A0A' }}
          className="mode-switcher-panel w-[360px] mr-3 bg-[#FDFBF7] border border-[#B89555]/30 shadow-2xl rounded-2xl p-3 z-[10001]"
          sideOffset={10}
          collisionPadding={{ top: 104, bottom: 16, left: 16, right: 16 }}
          avoidCollisions
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          <div className="px-3 pt-1 pb-3 mb-2 border-b border-[#D9C292]/40">
            <span
              className="inline-block px-2 py-0.5 rounded-full text-[9px] font-bold tracking-[0.18em]"
              style={{
                color: '#6B5424',
                backgroundColor: '#FBF4E1',
                borderColor: '#D9C292',
                borderWidth: 1,
                borderStyle: 'solid',
              }}
            >
              MODE
            </span>
            <p
              className="text-[14px] font-bold mt-1.5 leading-tight"
              style={{ color: '#0A0A0A' }}
            >
              Select your mode
            </p>
            <p
              className="text-[11px] mt-0.5 leading-snug"
              style={{ color: '#3F3F46' }}
            >
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
                // Thin 1px outer ring when active, plus the 3px inset left rail
                // in the mode tone. Keeps the card clearly active without a
                // chunky black box around it.
                boxShadow: isActive
                  ? `inset 3px 0 0 ${config.base}, 0 0 0 1px ${config.base}`
                  : `inset 3px 0 0 ${config.base}`,
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
                  {/* Uniform ink icon badge with champagne-gold hairline ring.
                      Icon stays crisp white on both default and hover; opt-out of
                      the global white-icon contrast guard since the badge is dark. */}
                  <div
                    data-no-contrast-guard
                    data-mode-icon-tile={config.surface}
                    className="mode-switcher-icon-tile w-10 h-10 rounded-xl flex items-center justify-center shrink-0 allow-white"
                    style={{
                      '--mode-base': config.base,
                      '--mode-base-dark': config.baseDark,
                      '--mode-on-base': config.onBase,
                      backgroundImage: `linear-gradient(135deg, ${config.base} 0%, ${config.baseDark} 100%)`,
                      boxShadow: `0 0 0 1px ${config.base}, 0 2px 6px rgba(0,0,0,0.18)`,
                    } as CSSProperties}
                  >
                    <Icon
                      data-no-contrast-guard
                      className="mode-switcher-icon w-[18px] h-[18px] allow-white"
                      style={{ color: config.onBase, stroke: config.onBase }}
                      strokeWidth={2}
                    />
                  </div>


                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-bold leading-tight" style={{ color: config.dark }}>
                      {config.label}
                    </p>
                    <p
                      className="text-[11px] leading-snug mt-0.5 line-clamp-1"
                      style={{ color: config.dark }}
                    >
                      {config.description}
                    </p>
                  </div>

                  {isActive ? (
                    <span
                      data-no-contrast-guard
                      data-mode-selected-pill={config.surface}
                      className="mode-switcher-selected-pill ml-2 inline-flex items-center justify-center gap-1 px-2.5 h-[22px] min-w-[96px] rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 whitespace-nowrap allow-white"
                      style={{
                        '--mode-base': config.base,
                        '--mode-on-base': config.onBase,
                        backgroundColor: config.base,
                        color: config.onBase,
                        borderColor: config.base,
                      } as CSSProperties}
                    >
                      <Check
                        data-no-contrast-guard
                        className="mode-switcher-selected-icon w-3 h-3 shrink-0 allow-white"
                        style={{ color: config.onBase, stroke: config.onBase }}
                      />
                      Selected
                    </span>
                  ) : (
                    <span
                      className="ml-2 inline-flex items-center justify-center px-2.5 h-[22px] min-w-[96px] rounded-full text-[10px] font-bold uppercase tracking-wider shrink-0 whitespace-nowrap border"
                      style={{
                        color: '#1A1A1A',
                        borderColor: 'rgba(26,26,26,0.25)',
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
