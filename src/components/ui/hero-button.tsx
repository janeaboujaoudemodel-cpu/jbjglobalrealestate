import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface HeroButtonProps {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
}

/**
 * Premium hero button with consistent styling across all hero sections.
 * - Normal: transparent with white border
 * - Hover: gold border with gold text
 */
export const HeroButton = ({ children, href, onClick, className }: HeroButtonProps) => {
  const buttonContent = (
    <button 
      onClick={onClick}
      className={cn(
        "group relative inline-flex items-center justify-center gap-1.5",
        "px-4 sm:px-5 md:px-6 py-2 sm:py-2.5",
        "text-[11px] sm:text-xs md:text-sm font-semibold tracking-wide",
        "rounded-lg transition-all duration-300",
        "bg-transparent border border-white/60 hover:border-gold/80",
        className
      )}
      style={{
        boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
      }}
    >
      <span className="text-white group-hover:text-gold transition-colors">{children}</span>
      <ArrowUpRight 
        className="w-3.5 h-3.5 text-gold group-hover:scale-110 transition-all" 
        style={{ filter: 'drop-shadow(0 0 4px rgba(200,167,102,0.6))' }} 
      />
    </button>
  );

  if (href) {
    return <Link to={href}>{buttonContent}</Link>;
  }

  return buttonContent;
};

export default HeroButton;
