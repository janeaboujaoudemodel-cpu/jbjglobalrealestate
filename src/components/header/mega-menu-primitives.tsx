import * as React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type MegaMenuShellProps = {
  children: React.ReactNode;
  className?: string;
};

/**
 * Shared mega-menu shell:
 * - No top gold border / shimmer line (per user requirement)
 * - Wide, consistent container
 * - Champagne gradient background (design token classes)
 */
export const MegaMenuShell = React.forwardRef<HTMLDivElement, MegaMenuShellProps>(
  ({ children, className }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          // Fixed positioning with horizontal margins to show rounded corners
          "fixed z-[9999] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.5)] rounded-xl overflow-hidden",
          className
        )}
        style={{
          // Position just below the header with horizontal padding
          top: 'var(--header-height, 128px)',
          left: '24px',
          right: '24px',
          // Solid gradient background - prevents any transparency issues
          background: 'linear-gradient(135deg, #F5EBD7 0%, #E8DCC8 50%, #D4C4A8 100%)',
        }}
      >
        {/* Rounded gold border */}
        <div className="absolute inset-0 rounded-xl border-2 border-gold/40 pointer-events-none" />
        {children}
        {/* Bottom gold accent (kept) */}
        <div className="h-1 bg-gradient-to-r from-gold/50 via-gold to-gold/50" />
      </div>
    );
  }
);
MegaMenuShell.displayName = "MegaMenuShell";

type MegaMenuFeaturedCardProps = {
  to: string;
  onClick: () => void;
  image: string;
  kicker?: string;
  title: string;
  description?: string;
  cta: string;
  className?: string;
};

/**
 * Compact featured card used in all mega menus.
 * Smaller size with proper rounded corners, similar to Provident style.
 */
export function MegaMenuFeaturedCard({
  to,
  onClick,
  image,
  kicker,
  title,
  description,
  cta,
  className,
}: MegaMenuFeaturedCardProps) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={cn(
        // Compact card with 3D effect - proper rounded corners with gold border
        // Removed aspect-ratio to allow flexible height stretching
        "block group relative overflow-hidden rounded-xl min-h-[260px] lg:min-h-[340px] transition-all duration-500",
        // 3D depth and hover zoom effect
        "shadow-lg hover:shadow-2xl hover:scale-[1.02] transform-gpu",
        className
      )}
    >
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
        style={{ backgroundImage: `url(${image})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />
      {/* Gold border with hover enhancement */}
      <div className="absolute inset-0 border-2 border-gold/40 rounded-xl group-hover:border-gold/80 transition-colors" />
      <div className="absolute bottom-0 left-0 right-0 p-5">
        {kicker ? (
          <p className="text-gold text-[10px] font-bold tracking-[0.2em] uppercase mb-1.5">
            {kicker}
          </p>
        ) : null}
        <h3 className="text-white text-lg lg:text-xl font-bold mb-1.5 leading-tight">{title}</h3>
        {description ? (
          <p className="text-white/80 text-xs mb-3 max-w-[48ch] line-clamp-2">{description}</p>
        ) : null}
        {/* CTA with gold border */}
        <span className="inline-flex items-center gap-1.5 text-gold font-semibold text-xs group-hover:gap-2.5 transition-all px-3 py-1.5 border border-gold/50 rounded-lg bg-black/30 hover:bg-gold hover:text-black">
          {cta}
          <ArrowRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </Link>
  );
}

type MegaMenuSectionTitleProps = {
  icon: LucideIcon;
  title: string;
  rightSlot?: React.ReactNode;
};

export function MegaMenuSectionTitle({
  icon: Icon,
  title,
  rightSlot,
}: MegaMenuSectionTitleProps) {
  return (
    <div className="flex items-center justify-between mb-5 pb-2 border-b border-gold/30">
      <h4 className="text-black font-bold text-xs tracking-[0.2em] uppercase flex items-center gap-2">
        <Icon className="w-4 h-4 text-gold" />
        {title}
      </h4>
      {rightSlot}
    </div>
  );
}

type MegaMenuIconLinkProps = {
  to: string;
  onClick: () => void;
  icon: LucideIcon;
  title: string;
  description?: string;
  compact?: boolean;
};

/**
 * Standardized link row:
 * Normal: transparent bg, black icon with gold border, black title
 * Hover: champagne-gold bg, gold title, black icon bg with gold icon
 */
export function MegaMenuIconLink({
  to,
  onClick,
  icon: Icon,
  title,
  description,
  compact = false,
}: MegaMenuIconLinkProps) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-xl transition-all duration-300 group relative",
        // Normal: transparent; Hover: champagne gradient background
        "bg-transparent hover:bg-gradient-to-r hover:from-[#F5EBD7] hover:to-[#E8DCC8]",
        compact ? "py-2 px-2.5" : "py-3 px-3"
      )}
    >
      {/* Icon container: normal = transparent with gold border, black icon; hover = black bg, gold icon */}
      <div
        className={cn(
          "rounded-lg border transition-all duration-300 flex items-center justify-center shrink-0",
          // Normal state: transparent bg, gold border
          "bg-transparent border-gold/50",
          // Hover state: black bg with gold border
          "group-hover:bg-black group-hover:border-gold",
          compact ? "w-8 h-8" : "w-10 h-10"
        )}
      >
        <Icon className={cn(
          "transition-colors duration-300",
          // Normal: black icon; Hover: gold icon
          "text-black group-hover:text-gold",
          compact ? "w-4 h-4" : "w-5 h-5"
        )} />
      </div>
      <div className="min-w-0 flex-1">
        {/* Title: normal = black; hover = gold */}
        <span className={cn(
          "block font-semibold transition-colors duration-300",
          "text-black group-hover:text-gold",
          compact ? "text-sm" : "text-sm"
        )}>
          {title}
        </span>
        {description ? (
          <span className="block text-xs text-black/60 group-hover:text-black/70 truncate transition-colors">
            {description}
          </span>
        ) : null}
      </div>
      {/* Thin gold divider under each page link */}
      <div className="absolute bottom-0 left-3 right-3 h-[1px] bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
    </Link>
  );
}
