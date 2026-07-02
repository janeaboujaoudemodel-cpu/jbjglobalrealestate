import { useState, CSSProperties } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Briefcase, User, ChevronDown, Check, Loader2, Users, Building2, Crown } from "lucide-react";
import { useIsAppOwner } from "@/hooks/useIsAppOwner";
import { useUserModeContext, UserMode } from "@/contexts/UserModeContext";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/contexts/AuthContext";
import { isOwnerBackendEmail } from "@/config/ownerEmails";
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
  owner: {
    label: 'Mode: Owner',
    shortLabel: 'O',
    icon: Crown,
    description: 'Owner command center — full portal access (visible only to you).',
    base: '#0A0A0A',      // navy ink
    baseDark: '#0A1830',
    rowFrom: '#FDFBF7',
    rowTo: '#F7F2EA',
    rowHover: '#EFE6D6',
    dark: '#1A1A1A',
    onBase: '#FFFFFF',
    surface: 'ink',
  },
};

export const ModeSwitcher = ({ variant = 'header', className, showForUnselected = false, side = 'bottom' }: ModeSwitcherProps) => {
  const { mode, isLoading, setMode, hasMadeInitialSelection } = useUserModeContext();
  const { hasSelectedRole } = useUserRole();
  const { isOwner: isAppOwner } = useIsAppOwner();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [hoveredMode, setHoveredMode] = useState<UserMode | null>(null);

  const navigate = useNavigate();
  const location = useLocation();
  const canDisplayOwnerMode = isOwnerBackendEmail(user?.email) || isAppOwner;

  // Hide the badge only when no selection has been made AND the placement
  // hasn't opted in to the unselected/"Select your mode" CTA.
  const isUnselected = !hasMadeInitialSelection && !hasSelectedRole;
  if (isUnselected && !showForUnselected) return null;

  const handleModeChange = async (newMode: UserMode) => {
    // 🔒 SECURITY: Only registered founder owner inboxes may enter Owner mode.
    // Owner mode is the ONLY mode that exposes the back-end command center,
    // and it must never be reachable from a non-owner account regardless of
    // any UI bypass.
    if (newMode === 'owner' && !canDisplayOwnerMode) {
      toast.error('Owner mode is restricted', {
        description: 'This mode is only available to the registered owner inboxes.',
      });
      setIsOpen(false);
      return;
    }

    await setMode(newMode);
    window.dispatchEvent(new CustomEvent('userModeChange', { detail: newMode }));
    toast.success(`Switched to ${MODE_CONFIG[newMode].label}`, {
      description: MODE_CONFIG[newMode].description,
    });

    // 🔒 MODE → DASHBOARD REDIRECT POLICY:
    // Every mode switch lands the user in that mode's own dashboard.
    // Owner mode is gated above to the registered app owner only — no other
    // account can ever reach /owner. Broker/Developer/Investor each go to
    // their respective workspace with no conflicts.
    const destination =
      newMode === 'owner' ? '/owner' :
      newMode === 'broker' ? '/broker-dashboard' :
      newMode === 'developer' ? '/developers-portal' :
      '/investor-dashboard';

    if (location.pathname !== destination) {
      navigate(destination, { replace: true });
    }


    setIsOpen(false);
  };

  const currentConfig = MODE_CONFIG[mode];
  const CurrentIcon = isUnselected ? User : currentConfig.icon;
  const triggerLabel = isUnselected ? 'Select your mode' : currentConfig.label;
  const triggerShortLabel = isUnselected ? '?' : currentConfig.shortLabel;

  // ─────────────────────────────────────────────────────────────────
  // Closed header trigger: emerald-ombre with white text/icons to match
  // the search/filter/favorite utility controls.
  // ─────────────────────────────────────────────────────────────────
  // Closed-trigger: same emerald premium control family as AED/filter/favorites.
  const triggerStyle: CSSProperties = {
    backgroundColor: 'transparent',
    backgroundImage: 'var(--jj-emerald-ombre)',
    border: 0,
    color: '#FFFFFF',
    WebkitTextFillColor: '#FFFFFF',
    boxShadow: '0 10px 24px -14px rgba(6,78,59,0.92), inset 0 1px 0 rgba(255,255,255,0.14)',
  };



  if (variant === 'compact') {
    return (
      <button
        onClick={() => setIsOpen((open) => !open)}
        disabled={isLoading}
        style={triggerStyle}
        data-no-contrast-guard
        data-emerald-action="true"
          data-mode-trigger="compact"
        className={cn(
          "flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-all duration-200 hover:-translate-y-0.5",
          className
        )}
      >
        {isLoading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: '#FFFFFF', stroke: '#FFFFFF' }} />
        ) : (
          <CurrentIcon className="w-3.5 h-3.5" style={{ color: '#FFFFFF', stroke: '#FFFFFF' }} />
        )}
        <span className="text-xs font-bold" style={{ color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' }}>
          {triggerShortLabel}
        </span>
      </button>
    );
  }

  return (
    <div
      data-mode-switcher-root="true"
    >
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen} modal={false}>
        <DropdownMenuTrigger asChild>
          <button
            disabled={isLoading}
            onClick={(e) => e.stopPropagation()}
            style={triggerStyle}
            data-no-contrast-guard
            data-emerald-action="true"
            data-surface="emerald"
            data-allow-dark-cta
            data-on-dark
            data-mode-trigger="header"
            data-header-control-family="pill"
          className={cn(
              "jj-header-selector-control jj-header-premium-control allow-white h-11 flex items-center gap-1.5 px-4 py-1.5 rounded-full border-0 transition-none duration-0 hover:brightness-110 whitespace-nowrap shrink-0",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40",
              isOpen && "ring-2",
              className
            )}
          >
            {isLoading && (
              <Loader2 className="w-4 h-4 animate-spin shrink-0" style={{ color: '#FFFFFF', stroke: '#FFFFFF' }} />
            )}
            <span
              className="mode-switcher-trigger-label text-[10px] font-bold whitespace-nowrap leading-none hidden sm:block tracking-wide"
              style={{ color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' }}
            >
              {triggerLabel}
            </span>
            <ChevronDown
              data-no-contrast-guard
              className={cn("mode-switcher-trigger-chevron w-3.5 h-3.5 shrink-0 transition-none duration-0", isOpen && "rotate-180")}
              style={{ color: '#FFFFFF', stroke: '#FFFFFF' }}
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
            {(Object.entries(MODE_CONFIG) as [UserMode, ModePalette][])
              .filter(([modeKey]) => modeKey !== 'owner' || canDisplayOwnerMode)
              .map(([modeKey, config]) => {
              const Icon = config.icon;
              const isActive = mode === modeKey;
              const isHovered = hoveredMode === modeKey;

              // Champagne dropdown rows: selected mode is indicated by an
              // emerald hairline/check only, never by a full emerald row fill.
              const rowTextColor = '#1A1A1A';
              const rowDescriptionColor = '#3A2D1D';
              const rowIconBg = 'linear-gradient(135deg, #FDFBF7 0%, #EFE6D6 100%)';
              const rowIconColor = isActive ? '#064E3B' : '#1A1A1A';

              const rowStyle: CSSProperties = {
                ['--mode-row-bg' as string]: isActive
                  ? 'linear-gradient(135deg, #FDFBF7 0%, #EFE6D6 100%)'
                  : 'linear-gradient(135deg, #FDFBF7 0%, #F2E8D2 100%)',
                ['--mode-row-border' as string]: isActive ? '#064E3B' : isHovered ? '#A9823E' : '#B89555',
                ['--mode-row-shadow' as string]: isActive
                  ? '0 10px 24px -16px rgba(6,78,59,0.28), inset 0 1px 0 rgba(255,255,255,0.70)'
                  : isHovered
                  ? '0 12px 26px -16px rgba(184,149,85,0.72), inset 0 1px 0 rgba(255,255,255,0.72)'
                  : '0 6px 18px -14px rgba(184,149,85,0.45), inset 0 1px 0 rgba(255,255,255,0.6)',
                ['--mode-row-transform' as string]: isHovered ? 'translateY(-1px)' : 'translateY(0)',
                background: 'var(--mode-row-bg)',
                backgroundImage: 'var(--mode-row-bg)',
                borderColor: 'var(--mode-row-border)',
                borderWidth: isActive ? 1.5 : 1,
                color: rowTextColor,
                boxShadow: 'var(--mode-row-shadow)',
                transform: 'var(--mode-row-transform)',
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
                  data-no-contrast-guard
                  data-no-emerald-hover
                  data-mode-row={isActive ? 'active' : 'idle'}
                  data-mode-card="true"
                  data-surface="champagne"
                  className={cn(
                    "mode-switcher-item",
                    "mode-switcher-equal-card relative flex items-start gap-3 pl-4 pr-3 py-3 rounded-xl cursor-pointer transition-all duration-150 border w-full min-h-[92px]",
                    "focus:outline-none",
                  )}
                >
                  <div
                    data-no-contrast-guard
                    data-mode-icon-tile={isActive ? 'active' : 'idle'}
                    data-surface="champagne"
                    data-allow-ink="true"
                    className="mode-switcher-icon-tile w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{
                      backgroundImage: rowIconBg,
                      boxShadow: isActive
                        ? '0 0 0 1px rgba(6,78,59,0.45)'
                        : '0 0 0 1px rgba(184,149,85,0.35)',
                    }}
                  >
                    <Icon
                      data-no-contrast-guard
                      className="w-[18px] h-[18px]"
                      style={{ color: rowIconColor, stroke: rowIconColor }}
                      strokeWidth={2}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p
                      className="text-[13px] font-bold leading-tight break-words"
                      style={{ color: rowTextColor, WebkitTextFillColor: rowTextColor }}
                    >
                      {config.label}
                    </p>
                    <p
                      className="text-[11px] leading-snug mt-0.5 break-words whitespace-normal"
                      style={{
                        color: rowDescriptionColor,
                        WebkitTextFillColor: rowDescriptionColor,
                      }}
                    >
                      {config.description}
                    </p>
                  </div>

                  {isActive ? (
                    <span
                      data-no-contrast-guard
                      data-mode-active-pill=""
                      data-surface="champagne"
                      data-allow-ink="true"
                      className="mode-switcher-selected-pill ml-2 inline-flex items-center justify-center gap-1 h-8 w-8 rounded-full text-[10px] font-bold shrink-0"
                      style={{
                        background: 'rgba(6,78,59,0.10)',
                        color: '#064E3B',
                        WebkitTextFillColor: '#064E3B',
                        borderColor: '#064E3B',
                        borderWidth: 1,
                        borderStyle: 'solid',
                      }}
                    >
                      <Check
                        data-no-contrast-guard
                        className="w-3 h-3 shrink-0"
                        style={{ color: '#064E3B', stroke: '#064E3B' }}
                        strokeWidth={3}
                      />
                    </span>
                  ) : null}

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
