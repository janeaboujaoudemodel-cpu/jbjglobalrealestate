import { useState } from "react";
import { Briefcase, User, ChevronDown, Check, Loader2, Users } from "lucide-react";
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
    label: 'Investor Mode',
    shortLabel: 'I',
    icon: User,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10 border-emerald-500/30',
    borderColor: 'border-emerald-500/40',
    description: 'Browse properties & invest'
  },
  broker: {
    label: 'Broker Mode',
    shortLabel: 'B',
    icon: Briefcase,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10 border-blue-500/30',
    borderColor: 'border-blue-500/40',
    description: 'Access broker tools & dashboard'
  },
  investor_broker: {
    label: 'Investor + Broker',
    shortLabel: 'I+B',
    icon: Users,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10 border-purple-500/30',
    borderColor: 'border-purple-500/40',
    description: 'Full access to both modes'
  }
};

export const ModeSwitcher = ({ variant = 'header', className, showForUnselected = false }: ModeSwitcherProps) => {
  const { mode, isLoading, setMode } = useUserModeContext();
  const { hasSelectedRole } = useUserRole();
  const [isOpen, setIsOpen] = useState(false);

  // Don't show mode switcher if user hasn't selected a role yet (unless forced)
  if (!hasSelectedRole && !showForUnselected) return null;

  const handleModeChange = async (newMode: UserMode) => {
    await setMode(newMode);
    
    // Emit global event for immediate UI updates
    window.dispatchEvent(new CustomEvent('userModeChange', { detail: newMode }));
    
    // Show success toast
    toast.success(`Switched to ${MODE_CONFIG[newMode].label}`, {
      description: MODE_CONFIG[newMode].description
    });
    
    // Close dropdown after brief delay to show success state
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
          <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-400" />
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
              "flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all duration-300 hover:shadow-md min-w-[180px] justify-center",
              currentConfig.bgColor,
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/50",
              className
            )}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
            ) : (
              <CurrentIcon className={cn("w-4 h-4", currentConfig.color)} />
            )}
            <span className={cn("text-sm font-medium hidden sm:block", currentConfig.color)}>
              {currentConfig.label}
            </span>
            <ChevronDown className={cn(
              "w-3.5 h-3.5 transition-transform duration-200",
              currentConfig.color,
              isOpen && "rotate-180"
            )} />
          </button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent 
          align="center" 
          className="w-56 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border border-gold/40 shadow-xl rounded-xl p-2 z-[10001]"
          sideOffset={5}
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          <div className="px-3 py-2.5 mb-2 rounded-lg bg-gradient-to-r from-[#F5EBD7] via-[#EDE0C8] to-[#D4C4A8] border border-gold/40">
            <p className="text-sm font-bold text-black/80">
              Select your mode
            </p>
            <p className="text-xs text-black/50 mt-0.5">
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
                    : "hover:bg-zinc-50"
                )}
              >
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center border",
                  // Always show mode-specific colors, not just when active
                  config.bgColor, config.borderColor
                )}>
                  <Icon className={cn("w-4 h-4", config.color)} />
                </div>
                <div className="flex-1">
                  <p className={cn(
                    "text-sm font-medium",
                    // Always show mode-specific color for label
                    config.color
                  )}>
                    {config.label}
                  </p>
                  <p className="text-xs text-zinc-500">
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
