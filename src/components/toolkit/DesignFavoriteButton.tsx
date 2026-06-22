import { Heart, ListPlus, Check } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useIsDesignSaved, useToggleDesignFavorite, DesignItemType } from "@/hooks/useDesignFavorites";

interface DesignFavoriteButtonProps {
  itemType: DesignItemType;
  itemId: string;
  itemName?: string;
  thumbnailSvg?: string;
  metadata?: Record<string, unknown>;
  showShortlist?: boolean;
  size?: "sm" | "md";
  className?: string;
}

const DesignFavoriteButton = ({
  itemType,
  itemId,
  itemName,
  thumbnailSvg,
  metadata,
  showShortlist = true,
  size = "md",
  className = "",
}: DesignFavoriteButtonProps) => {
  const { isFavorite, isShortlisted } = useIsDesignSaved(itemType, itemId);
  const toggle = useToggleDesignFavorite();

  const sizeClasses = { sm: "w-8 h-8", md: "w-10 h-10" };
  const iconSizes = { sm: "w-4 h-4", md: "w-5 h-5" };
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

  const handleFav = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggle.mutate({
      itemType,
      itemId,
      itemName,
      thumbnailSvg,
      metadata,
      listType: "favorite",
      isActive: isFavorite,
    });
  };

  const handleShortlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggle.mutate({
      itemType,
      itemId,
      itemName,
      thumbnailSvg,
      metadata,
      listType: "shortlist",
      isActive: isShortlisted,
    });
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={handleFav}
            disabled={toggle.isPending}
            data-surface="emerald"
            data-emerald="true"
            data-card-action="favorite"
            className={`${sizeClasses[size]} jj-favorite-trigger jj-pill-emerald allow-white flex items-center justify-center rounded-full transition-all duration-200 shadow-lg`}
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
        <TooltipContent side="bottom" sideOffset={8} className="z-[10100] bg-[#1A1A1A]/90 text-white border-[#B89555]/30 text-xs">
          <p>{isFavorite ? "Remove from favorites" : "Add to favorites"}</p>
        </TooltipContent>
      </Tooltip>

      {showShortlist && (
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={handleShortlist}
              disabled={toggle.isPending}
              data-surface="emerald"
              data-emerald="true"
              data-card-action="shortlist"
              className={`${sizeClasses[size]} jj-favorite-trigger jj-pill-emerald allow-white flex items-center justify-center rounded-full transition-all duration-200 shadow-lg`}
              style={emeraldButtonStyle}
            >
              {isShortlisted ? (
                <Check className={`${iconSizes[size]} allow-white`} color="#FFFFFF" stroke="#FFFFFF" style={whiteIconStyle} />
              ) : (
                <ListPlus className={`${iconSizes[size]} allow-white`} color="#FFFFFF" stroke="#FFFFFF" style={whiteIconStyle} />
              )}
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom" sideOffset={8} className="z-[10100] bg-[#1A1A1A]/90 text-white border-[#B89555]/30 text-xs">
            <p>{isShortlisted ? "Remove from shortlist" : "Add to shortlist"}</p>
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
};

export default DesignFavoriteButton;
