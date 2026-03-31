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

const MODE_CONFIG: Record<UserMode, { label: string; shortLabel: string; icon: typeof User; color: string; bgColor: string; borderColor: string; description: string }> = {
  investor: {
    label: 'Mode: Investor',
    shortLabel: 'I',
    icon: User,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10 border-emerald-500/30',
    borderColor: 'border-emerald-500/40',
    description: 'Browse properties, access ROI tools, upload listings, explore guides & market insights'
  },
  broker: {
    label: 'Mode: Broker',
    shortLabel: 'B',
    icon: Briefcase,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10 border-blue-500/30',
    borderColor: 'border-blue-500/40',
    description: 'CRM dashboard, education hub, sell properties, upload listings, coordinate with clients & close deals'
  },
  investor_broker: {
    label: 'Mode: Investor + Broker',
    shortLabel: 'I+B',
    icon: Users,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10 border-purple-500/30',
    borderColor: 'border-purple-500/40',
    description: 'Full access to investor tools, broker dashboard, CRM, listings, guides & market intelligence'
  },
  developer: {
    label: 'Mode: Developer',
    shortLabel: 'D',
    icon: Building2,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10 border-amber-500/30',
    borderColor: 'border-amber-500/40',
    description: 'Submit projects, upload terraces & documents, manage launches, marketing materials & event calendar'
  }
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
      description: MODE_CONFIG[newMode].description
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
          "flex items-center gap-1.5 px-2 py-1 rounded-full border transition-all duration-300",
          currentConfig.bgColor,
          className
        )}
      >
        {isLoading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-500" />
        ) : (
          <CurrentIcon className={cn("w-3.5 h-3.5", currentConfig.color)} />
        )}
        <span className={cn("text-xs font-medium", currentConfig.color)}>
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
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border transition-all duration-300 hover:shadow-md max-w-[220px] whitespace-nowrap shrink-0",
              currentConfig.bgColor,
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-400/50",
              className
            )}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-gray-500 shrink-0" />
            ) : (
              <CurrentIcon className={cn("w-4 h-4 shrink-0", currentConfig.color)} />
            )}
            <span className={cn("text-xs font-semibold truncate hidden sm:block", currentConfig.color)}>
              {currentConfig.label}
            </span>
            <ChevronDown className={cn(
              "w-3 h-3 shrink-0 transition-transform duration-200",
              currentConfig.color,
              isOpen && "rotate-180"
            )} />
          </button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent 
          align="end" 
          className="w-72 mr-3 bg-white border border-gray-200 shadow-xl rounded-xl p-2 z-[10001]"
          sideOffset={5}
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          <div className="px-3 py-2.5 mb-2 rounded-lg bg-gray-50 border border-gray-200">
            <p className="text-sm font-bold text-black">
              Select your mode
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              Choose how you want to use the platform
            </p>
          </div>
          
          {Object.entries(MODE_CONFIG).map(([modeKey, config]) => {
            const Icon = config.icon;
            const isActive = mode === modeKey;
            
            return (
              <DropdownMenuItem
                key={modeKey}
                onSelect={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleModeChange(modeKey as UserMode);
                }}
                onClick={(e) => e.stopPropagation()}
                onPointerDown={(e) => e.stopPropagation()}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200",
                  isActive 
                    ? `${config.bgColor} ${config.borderColor} border` 
                    : "hover:bg-gray-50"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center border",
                  config.bgColor, config.borderColor
                )}>
                  <Icon className={cn("w-4 h-4", config.color)} />
                </div>
                <div className="flex-1">
                  <p className={cn(
                    "text-sm font-medium",
                    config.color
                  )}>
                    {config.label}
                  </p>
                  <p className="text-xs text-gray-500">
                    {config.description}
                  </p>
                </div>
                {isActive && (
                  <Check className={cn("w-4 h-4", config.color)} />
                )}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default ModeSwitcher;
