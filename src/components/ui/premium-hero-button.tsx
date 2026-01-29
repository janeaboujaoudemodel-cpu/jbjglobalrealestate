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
}

/**
 * Premium hero button with consistent styling across ALL hero sections.
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
  iconPosition = "left",
  className 
}: PremiumHeroButtonProps) => {
  const DefaultIcon = iconPosition === "left" ? ArrowDown : ArrowUpRight;
  const IconComponent = Icon || DefaultIcon;
  
  const buttonContent = (
    <button 
      onClick={onClick}
      className={cn(
        "group relative inline-flex items-center justify-center gap-2",
        "px-6 md:px-8 py-3 md:py-4",
        "text-sm md:text-base font-bold",
        "rounded-lg md:rounded-xl transition-all duration-300",
        "bg-transparent",
        className
      )}
      style={{
        border: '2px solid rgba(255,255,255,0.8)',
        boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.2), inset 0 -1px 2px rgba(0,0,0,0.3), 0 4px 15px rgba(0,0,0,0.4)',
      }}
    >
      {iconPosition === "left" && (
        <IconComponent 
          className="w-4 h-4 text-gold group-hover:text-black transition-colors" 
          style={{ filter: 'drop-shadow(0 0 6px rgba(200,167,102,0.8))' }} 
        />
      )}
      <span className="text-white group-hover:text-black transition-colors">{children}</span>
      {iconPosition === "right" && (
        <IconComponent 
          className="w-4 h-4 text-gold group-hover:text-black transition-colors" 
          style={{ filter: 'drop-shadow(0 0 6px rgba(200,167,102,0.8))' }} 
        />
      )}
      {/* Hover fill effect */}
      <span 
        className="absolute inset-0 rounded-lg md:rounded-xl bg-gradient-to-r from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" 
        style={{ border: '2px solid rgba(200,167,102,0.6)' }} 
      />
    </button>
  );

  if (href) {
    return <Link to={href}>{buttonContent}</Link>;
  }

  return buttonContent;
};

export default PremiumHeroButton;
