import { Heart, ListPlus, Check } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useFavorites, useShortlist, useToggleFavorite, useToggleShortlist } from "@/hooks/useFavorites";
import { useGuestFavorites, useGuestShortlist } from "@/hooks/useGuestFavorites";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";

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
  
  // Authenticated user hooks
  const { data: userFavorites } = useFavorites();
  const { data: userShortlist } = useShortlist();
  const toggleUserFavorite = useToggleFavorite();
  const toggleUserShortlist = useToggleShortlist();
  
  // Guest user hooks
  const { favorites: guestFavorites, toggleFavorite: toggleGuestFavorite, isFavorite: isGuestFavorite } = useGuestFavorites();
  const { shortlist: guestShortlist, toggleShortlist: toggleGuestShortlist, isShortlisted: isGuestShortlisted, count: guestShortlistCount } = useGuestShortlist();

  // Determine favorite/shortlist status based on auth state
  const isFavorite = user 
    ? userFavorites?.some((f) => f.project_id === projectId) || false
    : isGuestFavorite(projectId);
    
  const isShortlisted = user 
    ? userShortlist?.some((s) => s.project_id === projectId) || false
    : isGuestShortlisted(projectId);
    
  const shortlistCount = user 
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

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (user) {
      toggleUserFavorite.mutate({ projectId, isFavorite });
    } else {
      toggleGuestFavorite(projectId);
      toast.success(isFavorite ? "Removed from favorites" : "Added to favorites");
    }
  };

  const handleShortlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (user) {
      toggleUserShortlist.mutate({ projectId, isShortlisted, currentCount: shortlistCount });
    } else {
      if (!isShortlisted && shortlistCount >= 3) {
        toast.error("Maximum 3 projects can be shortlisted for comparison");
        return;
      }
      const success = toggleGuestShortlist(projectId);
      if (success) {
        toast.success(isShortlisted ? "Removed from comparison" : "Added to comparison");
      }
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={handleFavoriteClick}
            disabled={toggleUserFavorite.isPending}
            className={`${sizeClasses[size]} flex items-center justify-center rounded-full bg-black/60 backdrop-blur-sm hover:bg-black/80 transition-all duration-200 border border-white/10`}
          >
            <Heart
              className={`${iconSizes[size]} transition-all duration-200 ${
                isFavorite 
                  ? "fill-red-500 text-red-500" 
                  : "text-white hover:text-red-400"
              }`}
            />
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{isFavorite ? "Remove from favorites" : "Add to favorites"}</p>
        </TooltipContent>
      </Tooltip>

      {showShortlist && (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={handleShortlistClick}
              disabled={toggleUserShortlist.isPending || (!isShortlisted && shortlistCount >= 3)}
              className={`${sizeClasses[size]} flex items-center justify-center rounded-full transition-all duration-200 border ${
                isShortlisted
                  ? "bg-gold text-black border-gold"
                  : shortlistCount >= 3
                  ? "bg-zinc-800/60 text-zinc-500 border-zinc-700 cursor-not-allowed"
                  : "bg-black/60 backdrop-blur-sm hover:bg-black/80 text-white border-white/10"
              }`}
            >
              {isShortlisted ? (
                <Check className={iconSizes[size]} />
              ) : (
                <ListPlus className={iconSizes[size]} />
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>
              {isShortlisted 
                ? "Remove from comparison" 
                : shortlistCount >= 3 
                ? "Max 3 properties for comparison" 
                : "Add to comparison (max 3)"}
            </p>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
};

export default FavoriteButton;
