import { Heart, ListPlus, Check } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useFavorites, useShortlist, useToggleFavorite, useToggleShortlist } from "@/hooks/useFavorites";
import { useGuestFavorites, useGuestShortlist } from "@/hooks/useGuestFavorites";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import { useActionGate } from "@/contexts/ActionGateContext";

const isUUID = (id: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

interface FavoriteButtonProps {
  projectId: string;
  showShortlist?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const FavoriteButton = ({ 
  projectId, 
  showShortlist = true, 
  size = "md",
  className = "" 
}: FavoriteButtonProps) => {
  const { user } = useAuth();
  const { gatedAction } = useActionGate();
  
  // For non-UUID project IDs (e.g. Reelly numeric IDs), always use guest/localStorage
  const useDb = user && isUUID(projectId);
  
  // Authenticated user hooks
  const { data: userFavorites } = useFavorites();
  const { data: userShortlist } = useShortlist();
  const toggleUserFavorite = useToggleFavorite();
  const toggleUserShortlist = useToggleShortlist();
  
  // Guest user hooks
  const { favorites: guestFavorites, toggleFavorite: toggleGuestFavorite, isFavorite: isGuestFavorite } = useGuestFavorites();
  const { shortlist: guestShortlist, toggleShortlist: toggleGuestShortlist, isShortlisted: isGuestShortlisted, count: guestShortlistCount } = useGuestShortlist();

  // Determine favorite/shortlist status based on auth state
  const isFavorite = useDb 
    ? userFavorites?.some((f) => f.project_id === projectId) || false
    : isGuestFavorite(projectId);
    
  const isShortlisted = useDb 
    ? userShortlist?.some((s) => s.project_id === projectId) || false
    : isGuestShortlisted(projectId);
    
  const shortlistCount = useDb 
    ? userShortlist?.length || 0
    : guestShortlistCount;

  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
  };

  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  const emeraldButtonStyle: React.CSSProperties = {
    backgroundImage: "var(--jj-emerald-ombre)",
    backgroundColor: "#064E3B",
    color: "#FFFFFF",
    WebkitTextFillColor: "#FFFFFF",
    border: "none",
    opacity: 1,
  };


  const whiteIconStyle: React.CSSProperties = {
    color: "#FFFFFF",
    stroke: "#FFFFFF",
    opacity: 1,
    filter: "none",
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    gatedAction(() => {
      if (useDb) {
        toggleUserFavorite.mutate({ projectId, isFavorite });
      } else {
        toggleGuestFavorite(String(projectId));
        toast.success(isFavorite ? "Removed from favorites" : "Added to favorites");
      }
    }, "save_favorite");
  };

  const handleShortlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    gatedAction(() => {
      if (useDb) {
        toggleUserShortlist.mutate({ projectId, isShortlisted, currentCount: shortlistCount });
      } else {
        const success = toggleGuestShortlist(String(projectId));
        if (success) {
          toast.success(isShortlisted ? "Removed from shortlist" : "Added to shortlist");
        }
      }
    }, "add_shortlist");
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
            data-surface="emerald"
            data-emerald="true"
            data-card-action="favorite"
            onClick={handleFavoriteClick}
            disabled={toggleUserFavorite.isPending}
            className={`${sizeClasses[size]} jj-official-emerald jj-favorite-trigger allow-white flex items-center justify-center rounded-full transition-all duration-200`}
            style={emeraldButtonStyle}
          >
            <Heart
              className={`${iconSizes[size]} allow-white transition-all duration-200`}
              color="#FFFFFF"
              stroke="#FFFFFF"
              fill={isFavorite ? "#FFFFFF" : "none"}
              style={whiteIconStyle}
            />
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" sideOffset={8} data-surface="navy" className="z-[10100] bg-[#0A0A0A] text-white border-[#B89555]/55 text-xs shadow-[0_10px_28px_-14px_rgba(10,10,10,0.9)]">
          <p className="text-white allow-white">{isFavorite ? "Remove from favorites" : "Add to favorites"}</p>
        </TooltipContent>
      </Tooltip>

      {showShortlist && (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              aria-label={isShortlisted ? "Remove from shortlist" : "Add to shortlist"}
              data-surface="emerald"
              data-emerald="true"
              data-card-action="shortlist"
              onClick={handleShortlistClick}
              disabled={toggleUserShortlist.isPending}
              className={`${sizeClasses[size]} jj-official-emerald jj-favorite-trigger allow-white flex items-center justify-center rounded-full transition-all duration-200`}
              style={emeraldButtonStyle}
            >
              {isShortlisted ? (
                <Check className={`${iconSizes[size]} allow-white`} color="#FFFFFF" stroke="#FFFFFF" style={whiteIconStyle} />
              ) : (
                <ListPlus className={`${iconSizes[size]} allow-white`} color="#FFFFFF" stroke="#FFFFFF" style={whiteIconStyle} />
              )}
            </button>
          </TooltipTrigger>
        <TooltipContent side="bottom" sideOffset={8} data-surface="navy" className="z-[10100] bg-[#0A0A0A] text-white border-[#B89555]/55 text-xs shadow-[0_10px_28px_-14px_rgba(10,10,10,0.9)]">
            <p className="text-white allow-white">{isShortlisted ? "Remove from shortlist" : "Add to shortlist"}</p>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
};

export default FavoriteButton;
