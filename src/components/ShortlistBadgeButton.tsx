import { Award, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useShortlist } from "@/hooks/useFavorites";
import { useGuestShortlist } from "@/hooks/useGuestFavorites";
import { useShortlistBadges, ShortlistBadge } from "@/hooks/useShortlistBadges";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

interface ShortlistBadgeButtonProps {
  projectId: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  showBadgeIndicator?: boolean;
}

const badgeConfig = {
  top1: { 
    label: "Top 1 — Gold", 
    emoji: "🥇",
    color: "bg-gradient-to-r from-yellow-400 via-yellow-500 to-amber-500 shadow-lg shadow-yellow-500/30", 
    textColor: "text-white",
    menuColor: "text-yellow-400"
  },
  top2: { 
    label: "Top 2 — Silver", 
    emoji: "🥈",
    color: "bg-gradient-to-r from-zinc-300 via-slate-400 to-zinc-400 shadow-lg shadow-zinc-400/30", 
    textColor: "text-zinc-900",
    menuColor: "text-zinc-300"
  },
  top3: { 
    label: "Top 3 — Bronze", 
    emoji: "🥉",
    color: "bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 shadow-lg shadow-amber-600/30", 
    textColor: "text-white",
    menuColor: "text-amber-500"
  },
};

const ShortlistBadgeButton = ({ 
  projectId, 
  size = "md",
  className = "",
  showBadgeIndicator = true
}: ShortlistBadgeButtonProps) => {
  const { user } = useAuth();
  const { data: userShortlist } = useShortlist();
  const { isShortlisted: isGuestShortlisted } = useGuestShortlist();
  const { getBadge, setBadge } = useShortlistBadges();

  const isShortlisted = user 
    ? userShortlist?.some((s) => s.project_id === projectId) || false
    : isGuestShortlisted(projectId);

  const currentBadge = getBadge(projectId);

  const sizeClasses = {
    sm: "h-7 px-2 text-xs",
    md: "h-8 px-3 text-sm",
    lg: "h-9 px-4 text-sm",
  };

  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  const handleSetBadge = (badge: ShortlistBadge | null) => {
    setBadge(projectId, badge);
    if (badge) {
      toast.success(`Assigned ${badgeConfig[badge].label} badge`);
    } else {
      toast.success("Badge removed");
    }
  };

  const handleNotShortlisted = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toast.info("Add this property to your Shortlist first to assign a badge", {
      action: {
        label: "Go to Favorites",
        onClick: () => window.location.href = "/favorites?tab=shortlist"
      }
    });
  };

  // If not shortlisted, show disabled button with tooltip
  if (!isShortlisted) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={handleNotShortlisted}
            className={`${sizeClasses[size]} flex items-center gap-1.5 rounded-full bg-white border border-gold/40 text-gold cursor-pointer hover:bg-white/90 transition-all ${className}`}
          >
            <Award className={iconSizes[size]} />
            <span className="hidden sm:inline text-sm font-medium">Add Badge</span>
          </button>
        </TooltipTrigger>
        <TooltipContent className="max-w-[200px] text-center">
          <p>Add to Shortlist first to assign Top 1, 2, or 3 badges</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  // If shortlisted, show dropdown
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Current badge indicator */}
      {showBadgeIndicator && currentBadge && (
        <Badge className={`${badgeConfig[currentBadge].color} ${badgeConfig[currentBadge].textColor} font-bold px-2 py-0.5 flex items-center gap-1 text-xs`}>
          {badgeConfig[currentBadge].emoji} {badgeConfig[currentBadge].label}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleSetBadge(null);
            }}
            className="ml-1 hover:opacity-70"
          >
            <X className="w-3 h-3" />
          </button>
        </Badge>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            onClick={(e) => e.stopPropagation()}
            className={`${sizeClasses[size]} flex items-center gap-1.5 rounded-full bg-white border border-gold/30 text-gold hover:bg-white/90 transition-all cursor-pointer ${className}`}
          >
            <Award className={iconSizes[size]} />
            <span className="hidden sm:inline">{currentBadge ? "Change" : "Add Badge"}</span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="bg-zinc-900 border-zinc-800" onClick={(e) => e.stopPropagation()}>
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              handleSetBadge('top1');
            }}
            className={`${badgeConfig.top1.menuColor} hover:bg-zinc-800 cursor-pointer font-medium`}
          >
            🥇 Top 1 (Gold)
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              handleSetBadge('top2');
            }}
            className={`${badgeConfig.top2.menuColor} hover:bg-zinc-800 cursor-pointer font-medium`}
          >
            🥈 Top 2 (Silver)
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              handleSetBadge('top3');
            }}
            className={`${badgeConfig.top3.menuColor} hover:bg-zinc-800 cursor-pointer font-medium`}
          >
            🥉 Top 3 (Bronze)
          </DropdownMenuItem>
          {currentBadge && (
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                handleSetBadge(null);
              }}
              className="text-zinc-400 hover:bg-zinc-800 cursor-pointer"
            >
              <X className="w-4 h-4 mr-2" />
              Remove Badge
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default ShortlistBadgeButton;
