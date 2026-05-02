import { LucideIcon, ArrowUpRight, ArrowDown } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface PremiumHeroButtonProps {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  icon?: LucideIcon;
  iconPosition?: "left" | "right";
  className?: string;
  size?: "default" | "lg";
  variant?: "dark-bg" | "light-bg";
}

/**
 * Premium hero button with consistent styling across ALL hero sections.
 * 
 * GLOBAL STANDARD (LOCKED):
 * - Size "default": px-6 md:px-8 py-3 md:py-4, text-sm md:text-base
 * - Size "lg": px-8 md:px-10 py-4 md:py-5, text-base md:text-lg (for homepage)
 * 
 * Style: Transparent background, white border, white text, gold glowing icon
 * Hover: Champagne gradient fill, gold border, black text
 * 
 * This component ensures 100% visual consistency across:
 * - Homepage hero
 * - Guide pages (Buyer, Seller, Tenant, Rent, Golden Visa)
 * - Market Intelligence pages
 * - Service pages
 */
export const PremiumHeroButton = ({ 
  children, 
  href, 
  onClick, 
  icon: Icon,
  iconPosition = "right",
  className,
  size = "default",
  variant = "dark-bg"
}: PremiumHeroButtonProps) => {
  const DefaultIcon = ArrowUpRight;
  const IconComponent = Icon || DefaultIcon;
  
  const sizeClasses = size === "lg" 
    ? "px-8 md:px-10 py-4 md:py-5 text-base md:text-lg"
    : "px-6 md:px-8 py-3 md:py-4 text-sm md:text-base";

  const isLight = variant === "light-bg";

  const sharedClasses = cn(
    "group relative inline-flex items-center justify-center gap-2",
    sizeClasses,
    "font-semibold tracking-wide",
    "rounded-xl transition-all duration-300 cursor-pointer",
    isLight 
      ? "bg-[#FDFBF7] border-2 border-[#B89555]/30 hover:border-[#B89555]/30 hover:-translate-y-1"
      : "bg-transparent border-2 border-white/70 hover:border-white hover:-translate-y-0.5",
    className
  );

  const sharedStyle = {
    boxShadow: isLight
      ? '0 2px 8px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.06)'
      : 'inset 0 1px 2px rgba(255,255,255,0.15), 0 4px 20px rgba(0,0,0,0.4)',
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLElement>) => {
    if (isLight) {
      e.currentTarget.style.boxShadow = '0 8px 25px rgba(0,0,0,0.12), 0 4px 12px rgba(0,0,0,0.08)';
    }
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLElement>) => {
    if (isLight) {
      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.06)';
    }
  };

  const innerContent = (
    <>
      {iconPosition === "left" && (
        <IconComponent 
          className={cn("w-4 h-4 md:w-5 md:h-5 transition-colors", isLight ? "text-[#1A1A1A]/70" : "text-white/80 group-hover:text-[#1A1A1A]")}
        />
      )}
      <span className={cn("transition-colors", isLight ? "text-[#1A1A1A]" : "text-white group-hover:text-[#1A1A1A]")}>{children}</span>
      {iconPosition === "right" && (
        <IconComponent 
          className={cn("w-4 h-4 md:w-5 md:h-5 transition-colors group-hover:translate-x-0.5 group-hover:-translate-y-0.5", isLight ? "text-[#1A1A1A]/70" : "text-white/80 group-hover:text-[#1A1A1A]")}
        />
      )}
      {/* Hover fill effect (only for dark-bg variant) */}
      {!isLight && (
        <span 
          className="absolute inset-0 rounded-xl bg-[#FDFBF7] opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 border-2 border-[#B89555]/30" 
        />
      )}
    </>
  );

  // When href is provided, render as a single <Link> element (no nested <button>)
  if (href) {
    return (
      <Link 
        to={href} 
        className={sharedClasses}
        style={sharedStyle}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {innerContent}
      </Link>
    );
  }

  // When no href, render as a <button>
  return (
    <button 
      onClick={onClick}
      className={sharedClasses}
      style={sharedStyle}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {innerContent}
    </button>
  );
};

export default PremiumHeroButton;
