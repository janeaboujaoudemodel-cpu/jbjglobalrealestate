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
  const actionClass = "jj-surface-emerald jj-favorite-trigger flex items-center justify-center rounded-full transition-all duration-200";

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
          <button aria-label="Save to favourites"
            onClick={handleFav}
            disabled={toggle.isPending}
            data-surface="emerald"
            data-emerald-ok="button"
            data-card-action="favorite"
            className={`${sizeClasses[size]} ${actionClass}`}
          >
            <Heart
              className={`${iconSizes[size]} transition-all duration-200`}
              fill={isFavorite ? "#FFFFFF" : "none"}
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
            <button aria-label="Confirm"
              onClick={handleShortlist}
              disabled={toggle.isPending}
              data-surface="emerald"
              data-emerald-ok="button"
              data-card-action="shortlist"
              className={`${sizeClasses[size]} ${actionClass}`}
            >
              {isShortlisted ? (
                <Check className={iconSizes[size]} />
              ) : (
                <ListPlus className={iconSizes[size]} />
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
