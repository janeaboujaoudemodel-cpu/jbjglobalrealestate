import { Heart, ListPlus, Check } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useFavorites, useShortlist, useToggleFavorite, useToggleShortlist } from "@/hooks/useFavorites";
import { useGuestFavorites, useGuestShortlist } from "@/hooks/useGuestFavorites";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";

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

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (useDb) {
      toggleUserFavorite.mutate({ projectId, isFavorite });
    } else {
      toggleGuestFavorite(projectId);
      toast.success(isFavorite ? "Removed from favorites" : "Added to favorites");
    }
  };

  const handleShortlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (useDb) {
      toggleUserShortlist.mutate({ projectId, isShortlisted, currentCount: shortlistCount });
    } else {
      const success = toggleGuestShortlist(projectId);
      if (success) {
        toast.success(isShortlisted ? "Removed from shortlist" : "Added to shortlist");
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
            className={`${sizeClasses[size]} flex items-center justify-center rounded-full transition-all duration-200 border ${
              isFavorite 
                ? "bg-gradient-to-r from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-gold/40 shadow-lg"
                : "bg-gradient-to-r from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-gold/30 hover:border-gold hover:shadow-lg"
            }`}
          >
            <Heart
              className={`${iconSizes[size]} transition-all duration-200 ${
                isFavorite 
                  ? "fill-red-500 text-red-500" 
                  : "text-black hover:text-red-500"
              }`}
            />
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" sideOffset={8} className="z-[10100] bg-black/90 text-white border-gold/30 text-xs">
          <p>{isFavorite ? "Remove from favorites" : "Add to favorites"}</p>
        </TooltipContent>
      </Tooltip>

      {showShortlist && (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={handleShortlistClick}
              disabled={toggleUserShortlist.isPending}
              className={`${sizeClasses[size]} flex items-center justify-center rounded-full transition-all duration-200 border ${
                isShortlisted
                  ? "bg-gradient-to-r from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-gold shadow-lg"
                  : "bg-gradient-to-r from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-gold/30 hover:border-gold hover:shadow-lg"
              }`}
            >
              {isShortlisted ? (
                <Check className={`${iconSizes[size]} text-black`} />
              ) : (
                <ListPlus className={`${iconSizes[size]} text-black`} />
              )}
            </button>
          </TooltipTrigger>
        <TooltipContent side="bottom" sideOffset={8} className="z-[10100] bg-black/90 text-white border-gold/30 text-xs">
            <p>{isShortlisted ? "Remove from shortlist" : "Add to shortlist"}</p>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
};

export default FavoriteButton;
