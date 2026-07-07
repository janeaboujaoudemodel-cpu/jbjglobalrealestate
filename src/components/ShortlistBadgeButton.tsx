import { Award, X, ListPlus, ListMinus } from "lucide-react";
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

const isUUID = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

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
    textColor: "text-[#1A1A1A]",
    menuColor: "text-white/85"
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
  const useDb = user && isUUID(projectId);
  const { data: userShortlist } = useShortlist();
  const { isShortlisted: isGuestShortlisted, toggleShortlist: toggleGuestShortlist } = useGuestShortlist();
  const { getBadge, setBadge } = useShortlistBadges();

  const isShortlisted = useDb 
    ? userShortlist?.some((s) => s.project_id === projectId) || false
    : isGuestShortlisted(projectId);

  const currentBadge = getBadge(projectId);

  // Circular 44px control to visually match the header search/heart
  // buttons and the FavoriteButton beside it. No elongated pill.
  const sizeClasses = {
    sm: "w-11 h-11",
    md: "w-11 h-11",
    lg: "w-12 h-12",
  };

  const iconSizes = {
    sm: "w-[18px] h-[18px]",
    md: "w-5 h-5",
    lg: "w-[22px] h-[22px]",
  };
  const actionClass =
    "jj-surface-emerald jj-favorite-trigger inline-flex items-center justify-center rounded-full aspect-square shrink-0 leading-none transition-all duration-200 hover:brightness-110 border-0 ring-0 shadow-[0_4px_14px_-4px_rgba(6,78,59,0.45)] overflow-hidden p-0";

  const toggleShortlistOnly = () => {
    toggleGuestShortlist(projectId);
    toast.success(isShortlisted ? "Removed from shortlist" : "Added to shortlist");
    // If removing from shortlist, also clear any badge that was assigned.
    if (isShortlisted && currentBadge) setBadge(projectId, null);
  };

  const handleSetBadge = (badge: ShortlistBadge | null) => {
    // Auto-add to shortlist if not already shortlisted
    if (!isShortlisted && badge) {
      toggleGuestShortlist(projectId);
      toast.success("Added to shortlist");
    }
    setBadge(projectId, badge);
    if (badge) {
      toast.success(`Assigned ${badgeConfig[badge].label} badge`);
    } else {
      toast.success("Badge removed");
    }
  };

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
            aria-label={currentBadge ? "Change badge" : "Add badge"}
            data-surface="emerald"
            data-emerald="true"
            data-emerald-ok="button"
            data-card-action="badge-shortlist"
            data-shortlist-button=""
            className={`${sizeClasses[size]} ${actionClass}`}
          >
            <Award
              className={`${iconSizes[size]} allow-white`}
              stroke="#FFFFFF"
              style={{ color: "#FFFFFF", stroke: "#FFFFFF" }}
            />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent className="bg-[#FDFBF7] border-[#1A1A1A]" onClick={(e) => e.stopPropagation()}>
          {/* Primary action — plain add/remove from shortlist */}
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              toggleShortlistOnly();
            }}
            className="text-[#1A1A1A] hover:bg-[#EFE6D6] cursor-pointer font-semibold"
          >
            {isShortlisted ? (
              <><ListMinus className="w-4 h-4 mr-2 text-[#064E3B]" /> Remove from shortlist</>
            ) : (
              <><ListPlus className="w-4 h-4 mr-2 text-[#064E3B]" /> Add to shortlist</>
            )}
          </DropdownMenuItem>
          <div className="my-1 h-px bg-[#B89555]/30" />
          <div className="px-2 pt-1 pb-1 text-[10px] uppercase tracking-[0.14em] text-[#1A1A1A]/60 font-semibold">
            Rank this project
          </div>
          <DropdownMenuItem
            onClick={(e) => { e.stopPropagation(); handleSetBadge('top1'); }}
            className="text-[#1A1A1A] hover:bg-[#EFE6D6] cursor-pointer font-medium"
          >
            🥇 Top 1 (Gold)
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={(e) => { e.stopPropagation(); handleSetBadge('top2'); }}
            className="text-[#1A1A1A] hover:bg-[#EFE6D6] cursor-pointer font-medium"
          >
            🥈 Top 2 (Silver)
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={(e) => { e.stopPropagation(); handleSetBadge('top3'); }}
            className="text-[#1A1A1A] hover:bg-[#EFE6D6] cursor-pointer font-medium"
          >
            🥉 Top 3 (Bronze)
          </DropdownMenuItem>
          {currentBadge && (
            <DropdownMenuItem
              onClick={(e) => { e.stopPropagation(); handleSetBadge(null); }}
              className="text-[#1A1A1A]/70 hover:bg-[#EFE6D6] cursor-pointer"
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
