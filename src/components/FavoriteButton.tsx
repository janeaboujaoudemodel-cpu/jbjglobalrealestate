import { Heart, ListPlus, Check } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useFavorites, useShortlist, useToggleFavorite, useToggleShortlist } from "@/hooks/useFavorites";
import { useNavigate } from "react-router-dom";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

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
  const navigate = useNavigate();
  const { data: favorites } = useFavorites();
  const { data: shortlist } = useShortlist();
  const toggleFavorite = useToggleFavorite();
  const toggleShortlist = useToggleShortlist();

  const isFavorite = favorites?.some((f) => f.project_id === projectId) || false;
  const isShortlisted = shortlist?.some((s) => s.project_id === projectId) || false;
  const shortlistCount = shortlist?.length || 0;

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
    
    if (!user) {
      navigate("/auth", { state: { returnTo: window.location.pathname } });
      return;
    }
    
    toggleFavorite.mutate({ projectId, isFavorite });
  };

  const handleShortlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!user) {
      navigate("/auth", { state: { returnTo: window.location.pathname } });
      return;
    }
    
    toggleShortlist.mutate({ projectId, isShortlisted, currentCount: shortlistCount });
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={handleFavoriteClick}
            disabled={toggleFavorite.isPending}
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
              disabled={toggleShortlist.isPending || (!isShortlisted && shortlistCount >= 3)}
              className={`${sizeClasses[size]} flex items-center justify-center rounded-full transition-all duration-200 border ${
                isShortlisted
                  ? "bg-white text-zinc-900 border-white"
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
