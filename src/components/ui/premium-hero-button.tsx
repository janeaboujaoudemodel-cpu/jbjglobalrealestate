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
  
  const buttonContent = (
    <button 
      onClick={onClick}
      className={cn(
        "group relative inline-flex items-center justify-center gap-2",
        sizeClasses,
        "font-semibold tracking-wide",
        "rounded-xl transition-all duration-300",
        isLight 
          ? "bg-gradient-to-r from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 hover:border-gold/80 hover:-translate-y-1"
          : "bg-transparent border-2 border-white/70 hover:border-gold/80 hover:-translate-y-0.5",
        className
      )}
      style={{
        boxShadow: isLight
          ? '0 2px 8px rgba(200,167,102,0.2), 0 1px 3px rgba(0,0,0,0.1)'
          : 'inset 0 1px 2px rgba(255,255,255,0.15), 0 4px 20px rgba(0,0,0,0.4)',
      }}
      onMouseEnter={(e) => {
        if (isLight) {
          e.currentTarget.style.boxShadow = '0 8px 25px rgba(200,167,102,0.4), 0 4px 12px rgba(0,0,0,0.15)';
        }
      }}
      onMouseLeave={(e) => {
        if (isLight) {
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(200,167,102,0.2), 0 1px 3px rgba(0,0,0,0.1)';
        }
      }}
    >
      {iconPosition === "left" && (
        <IconComponent 
          className={cn("w-4 h-4 md:w-5 md:h-5 transition-colors", isLight ? "text-gold" : "text-gold group-hover:text-black")}
          style={{ filter: 'drop-shadow(0 0 6px rgba(200,167,102,0.8))' }} 
        />
      )}
      <span className={cn("transition-colors", isLight ? "text-black" : "text-white group-hover:text-black")}>{children}</span>
      {iconPosition === "right" && (
        <IconComponent 
          className={cn("w-4 h-4 md:w-5 md:h-5 transition-colors group-hover:translate-x-0.5 group-hover:-translate-y-0.5", isLight ? "text-gold" : "text-gold group-hover:text-black")}
          style={{ filter: 'drop-shadow(0 0 6px rgba(200,167,102,0.8))' }} 
        />
      )}
      {/* Hover fill effect - champagne gradient (only for dark-bg variant) */}
      {!isLight && (
        <span 
          className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 border-2 border-gold/60" 
        />
      )}
    </button>
  );

  if (href) {
    return <Link to={href}>{buttonContent}</Link>;
  }

  return buttonContent;
};

export default PremiumHeroButton;
