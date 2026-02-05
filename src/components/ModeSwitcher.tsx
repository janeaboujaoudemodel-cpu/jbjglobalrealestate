import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Briefcase, User, ChevronDown, Check, Loader2, Users } from "lucide-react";
import { useUserMode, UserMode } from "@/hooks/useUserMode";
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
}

const MODE_CONFIG: Record<UserMode, { label: string; shortLabel: string; icon: typeof User; color: string; bgColor: string; description: string }> = {
  investor: {
    label: 'Investor Mode',
    shortLabel: 'I',
    icon: User,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10 border-emerald-500/30',
    description: 'Browse properties & invest'
  },
  broker: {
    label: 'Broker Mode',
    shortLabel: 'B',
    icon: Briefcase,
    color: 'text-gold',
    bgColor: 'bg-gold/10 border-gold/30',
    description: 'Access broker tools & dashboard'
  },
  investor_broker: {
    label: 'Investor + Broker',
    shortLabel: 'I+B',
    icon: Users,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10 border-purple-500/30',
    description: 'Full access to both modes'
  }
};

export const ModeSwitcher = ({ variant = 'header', className }: ModeSwitcherProps) => {
  const { mode, isLoading, setMode } = useUserMode();
  const { role, hasSelectedRole } = useUserRole();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  // Don't show mode switcher if user hasn't selected a role yet
  if (!hasSelectedRole) return null;

  // Check if user can access broker mode - now includes broker_jbj
  const canAccessBrokerMode = role === 'broker' || role === 'broker_partner' || role === 'broker_jbj';

  const handleModeChange = async (newMode: UserMode) => {
    // Check if mode requires broker access
    const requiresBroker = newMode === 'broker' || newMode === 'investor_broker';
    if (requiresBroker && !canAccessBrokerMode) {
      toast.error('You need a broker role to access Broker Mode');
      return;
    }
    
    await setMode(newMode);
    setIsOpen(false);
    
    // Emit global event for immediate UI updates
    window.dispatchEvent(new CustomEvent('userModeChange', { detail: newMode }));
    
    // Navigate to dashboard so user sees the change immediately
    navigate('/my-dashboard', { replace: true });
    
    toast.success(`Switched to ${MODE_CONFIG[newMode].label}`, {
      description: MODE_CONFIG[newMode].description
    });
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
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <button
          disabled={isLoading}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all duration-300 hover:shadow-md",
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
        align="end" 
        className="w-64 bg-white border border-zinc-200 shadow-xl rounded-xl p-1"
      >
        <div className="px-3 py-2 border-b border-zinc-100 mb-1">
          <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
            Switch Mode
          </p>
        </div>
        
        {Object.entries(MODE_CONFIG).map(([modeKey, config]) => {
          const Icon = config.icon;
          const isActive = mode === modeKey;
          const requiresBroker = modeKey === 'broker' || modeKey === 'investor_broker';
          const isDisabled = requiresBroker && !canAccessBrokerMode;
          
          return (
            <DropdownMenuItem
              key={modeKey}
              onClick={() => !isDisabled && handleModeChange(modeKey as UserMode)}
              disabled={isDisabled}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all duration-200",
                isActive 
                  ? "bg-gradient-to-r from-gold/10 to-gold/5 border border-gold/20" 
                  : "hover:bg-zinc-50",
                isDisabled && "opacity-50 cursor-not-allowed"
              )}
            >
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center border",
                isActive ? config.bgColor : "bg-zinc-100 border-zinc-200"
              )}>
                <Icon className={cn("w-4 h-4", isActive ? config.color : "text-zinc-500")} />
              </div>
              <div className="flex-1">
                <p className={cn(
                  "text-sm font-medium",
                  isActive ? "text-zinc-900" : "text-zinc-700"
                )}>
                  {config.label}
                </p>
                <p className="text-xs text-zinc-500">
                  {config.description}
                </p>
              </div>
              {isActive && (
                <Check className="w-4 h-4 text-gold" />
              )}
            </DropdownMenuItem>
          );
        })}
        
        {!canAccessBrokerMode && (
          <div className="px-3 py-2 mt-1 border-t border-zinc-100">
            <p className="text-xs text-zinc-400">
              Broker Mode requires a broker role. 
              <a href="/broker-toolkit" className="text-gold hover:underline ml-1">
                Learn more
              </a>
            </p>
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ModeSwitcher;
