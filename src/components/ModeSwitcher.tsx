import { useState } from "react";
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
}

type ModeStyle = {
  label: string;
  shortLabel: string;
  icon: typeof User;
  description: string;
  // Trigger button (header / footer / shared placements) — visible at rest
  triggerClass: string;
  triggerText: string;
  triggerIcon: string;
  // Dropdown row — at rest
  rowBase: string;
  rowText: string;
  rowIconWrap: string;
  rowIcon: string;
  // Dropdown row — highlighted (hover / keyboard focus)
  rowHighlight: string;
  // Dropdown row — active (currently selected mode)
  rowActiveRing: string;
};

// Per-mode palette per owner spec:
//   Investor          -> orange
//   Broker            -> blue
//   Investor + Broker -> green
//   Developer         -> purple
const MODE_CONFIG: Record<UserMode, ModeStyle> = {
  investor: {
    label: 'Mode: Investor',
    shortLabel: 'I',
    icon: User,
    description: 'Browse properties, access ROI tools, upload listings, explore guides & market insights',
    triggerClass: '!bg-orange-500/20 !border-orange-500 hover:!bg-orange-500/30 hover:!border-orange-600 shadow-orange-500/30',
    triggerText: '!text-orange-700',
    triggerIcon: '!text-orange-700',
    rowBase: '!bg-orange-50 !border-orange-300',
    rowText: '!text-orange-800',
    rowIconWrap: '!bg-orange-100 !border-orange-300',
    rowIcon: '!text-orange-700',
    rowHighlight: 'data-[highlighted]:!bg-orange-100 data-[highlighted]:!text-orange-900 data-[highlighted]:!border-orange-500 hover:!bg-orange-100 hover:!text-orange-900 focus:!bg-orange-100 focus:!text-orange-900',
    rowActiveRing: '!border-orange-500 ring-2 ring-orange-500/50',
  },
  broker: {
    label: 'Mode: Broker',
    shortLabel: 'B',
    icon: Briefcase,
    description: 'CRM dashboard, education hub, sell properties, upload listings, coordinate with clients & close deals',
    triggerClass: '!bg-blue-500/20 !border-blue-500 hover:!bg-blue-500/30 hover:!border-blue-600 shadow-blue-500/30',
    triggerText: '!text-blue-700',
    triggerIcon: '!text-blue-700',
    rowBase: '!bg-blue-50 !border-blue-300',
    rowText: '!text-blue-800',
    rowIconWrap: '!bg-blue-100 !border-blue-300',
    rowIcon: '!text-blue-700',
    rowHighlight: 'data-[highlighted]:!bg-blue-100 data-[highlighted]:!text-blue-900 data-[highlighted]:!border-blue-500 hover:!bg-blue-100 hover:!text-blue-900 focus:!bg-blue-100 focus:!text-blue-900',
    rowActiveRing: '!border-blue-500 ring-2 ring-blue-500/50',
  },
  investor_broker: {
    label: 'Mode: Investor + Broker',
    shortLabel: 'I+B',
    icon: Users,
    description: 'Full access to investor tools, broker dashboard, CRM, listings, guides & market intelligence',
    triggerClass: '!bg-green-500/20 !border-green-500 hover:!bg-green-500/30 hover:!border-green-600 shadow-green-500/30',
    triggerText: '!text-green-700',
    triggerIcon: '!text-green-700',
    rowBase: '!bg-green-50 !border-green-300',
    rowText: '!text-green-800',
    rowIconWrap: '!bg-green-100 !border-green-300',
    rowIcon: '!text-green-700',
    rowHighlight: 'data-[highlighted]:!bg-green-100 data-[highlighted]:!text-green-900 data-[highlighted]:!border-green-500 hover:!bg-green-100 hover:!text-green-900 focus:!bg-green-100 focus:!text-green-900',
    rowActiveRing: '!border-green-500 ring-2 ring-green-500/50',
  },
  developer: {
    label: 'Mode: Developer',
    shortLabel: 'D',
    icon: Building2,
    description: 'Submit projects, upload terraces & documents, manage launches, marketing materials & event calendar',
    triggerClass: '!bg-purple-500/20 !border-purple-500 hover:!bg-purple-500/30 hover:!border-purple-600 shadow-purple-500/30',
    triggerText: '!text-purple-700',
    triggerIcon: '!text-purple-700',
    rowBase: '!bg-purple-50 !border-purple-300',
    rowText: '!text-purple-800',
    rowIconWrap: '!bg-purple-100 !border-purple-300',
    rowIcon: '!text-purple-700',
    rowHighlight: 'data-[highlighted]:!bg-purple-100 data-[highlighted]:!text-purple-900 data-[highlighted]:!border-purple-500 hover:!bg-purple-100 hover:!text-purple-900 focus:!bg-purple-100 focus:!text-purple-900',
    rowActiveRing: '!border-purple-500 ring-2 ring-purple-500/50',
  },
};

export const ModeSwitcher = ({ variant = 'header', className, showForUnselected = false }: ModeSwitcherProps) => {
  const { mode, isLoading, setMode } = useUserModeContext();
  const { hasSelectedRole } = useUserRole();
  const [isOpen, setIsOpen] = useState(false);

  if (!hasSelectedRole && !showForUnselected) return null;

  const handleModeChange = async (newMode: UserMode) => {
    await setMode(newMode);
    window.dispatchEvent(new CustomEvent('userModeChange', { detail: newMode }));
    toast.success(`Switched to ${MODE_CONFIG[newMode].label}`, {
      description: MODE_CONFIG[newMode].description,
    });
    setTimeout(() => {
      setIsOpen(false);
    }, 400);
  };

  const currentConfig = MODE_CONFIG[mode];
  const CurrentIcon = currentConfig.icon;

  if (variant === 'compact') {
    return (
      <button
        onClick={() => setIsOpen(true)}
        disabled={isLoading}
        className={cn(
          "flex items-center gap-1.5 px-2 py-1 rounded-full border transition-all duration-300 shadow-sm",
          currentConfig.triggerClass,
          className
        )}
      >
        {isLoading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-600" />
        ) : (
          <CurrentIcon className={cn("w-3.5 h-3.5", currentConfig.triggerIcon)} />
        )}
        <span className={cn("text-xs font-semibold", currentConfig.triggerText)}>
          {currentConfig.shortLabel}
        </span>
      </button>
    );
  }

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen} modal={false}>
        <DropdownMenuTrigger asChild>
          <button
            disabled={isLoading}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-all duration-300 shadow-sm hover:shadow-md max-w-[240px] whitespace-nowrap shrink-0",
              currentConfig.triggerClass,
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-current/40",
              className
            )}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-gray-600 shrink-0" />
            ) : (
              <CurrentIcon className={cn("w-4 h-4 shrink-0", currentConfig.triggerIcon)} />
            )}
            <span className={cn("text-xs font-bold truncate hidden sm:block", currentConfig.triggerText)}>
              {currentConfig.label}
            </span>
            <ChevronDown
              className={cn(
                "w-3 h-3 shrink-0 transition-transform duration-200",
                currentConfig.triggerIcon,
                isOpen && "rotate-180"
              )}
            />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          className="w-80 mr-3 bg-white border border-gray-200 shadow-xl rounded-xl p-2 z-[10001]"
          sideOffset={5}
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
            {(Object.entries(MODE_CONFIG) as [UserMode, ModeStyle][]).map(([modeKey, config]) => {
              const Icon = config.icon;
              const isActive = mode === modeKey;

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
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200 border-2 shadow-sm",
                    config.rowBase,
                    config.rowText,
                    config.rowHighlight,
                    isActive ? config.rowActiveRing : "",
                    // Neutralize shadcn defaults so per-mode tints stay visible
                    "focus:outline-none"
                  )}
                  style={{ transform: 'none' }}
                >
                  <div
                    className={cn(
                      "w-9 h-9 rounded-lg flex items-center justify-center border shrink-0",
                      config.rowIconWrap
                    )}
                  >
                    <Icon className={cn("w-4 h-4", config.rowIcon)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn("text-sm font-bold", config.rowText)}>
                      {config.label}
                    </p>
                    <p className={cn("text-[11px] leading-snug mt-0.5 opacity-90", config.rowText)}>
                      {config.description}
                    </p>
                  </div>
                  {isActive && (
                    <Check className={cn("w-4 h-4 shrink-0", config.rowIcon)} />
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
