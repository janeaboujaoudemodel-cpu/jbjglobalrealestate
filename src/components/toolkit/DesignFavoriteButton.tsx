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
            className={`${sizeClasses[size]} flex items-center justify-center rounded-full transition-all duration-200 border ${
              isFavorite
                ? "bg-gradient-to-r from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-[#B89555]/40 shadow-lg"
                : "bg-gradient-to-r from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-[#B89555]/30 hover:border-[#B89555] hover:shadow-lg"
            }`}
          >
            <Heart
              className={`${iconSizes[size]} transition-all duration-200 ${
                isFavorite ? "fill-red-500 text-red-500" : "text-[#1A1A1A] hover:text-red-500"
              }`}
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
              className={`${sizeClasses[size]} flex items-center justify-center rounded-full transition-all duration-200 border ${
                isShortlisted
                  ? "bg-gradient-to-r from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-[#B89555] shadow-lg"
                  : "bg-gradient-to-r from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-[#B89555]/30 hover:border-[#B89555] hover:shadow-lg"
              }`}
            >
              {isShortlisted ? (
                <Check className={`${iconSizes[size]} text-[#1A1A1A]`} />
              ) : (
                <ListPlus className={`${iconSizes[size]} text-[#1A1A1A]`} />
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
