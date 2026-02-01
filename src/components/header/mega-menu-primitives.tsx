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
          "absolute top-full left-0 right-0 mt-0 bg-gradient-to-br from-champagne-light via-champagne to-champagne-dark shadow-[0_30px_80px_-20px_rgba(0,0,0,0.5)] z-50",
          className
        )}
      >
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
 * Large rectangular featured card used in all mega menus.
 * Purposefully taller + wider to avoid looking cropped.
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
        // Keep the featured visual fully integrated in the dropdown (no “floating card” scale-up)
        // Add spacing below on stacked (mobile) layouts so the first section doesn't feel stuck to the image.
        "block group relative overflow-hidden rounded-2xl aspect-[3/2] min-h-[320px] lg:min-h-[440px] transition-all duration-500 mb-7 lg:mb-0",
        className
      )}
    >
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-110"
        style={{ backgroundImage: `url(${image})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/45 to-transparent" />
      <div className="absolute inset-0 border border-gold/25 rounded-2xl group-hover:border-gold/50 transition-colors" />
      <div className="absolute bottom-0 left-0 right-0 p-7">
        {kicker ? (
          <p className="text-gold text-xs font-bold tracking-[0.25em] uppercase mb-2">
            {kicker}
          </p>
        ) : null}
        <h3 className="text-white text-2xl font-bold mb-2 leading-tight">{title}</h3>
        {description ? (
          <p className="text-white/80 text-sm mb-4 max-w-[52ch]">{description}</p>
        ) : null}
        <span className="inline-flex items-center gap-2 text-gold font-semibold text-sm group-hover:gap-3 transition-all">
          {cta}
          <ArrowRight className="w-4 h-4" />
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
 * - Black title + gold icon
 * - Hover inversion (black bg, gold text)
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
        "flex items-center gap-3 rounded-xl text-black hover:text-white hover:bg-black transition-all group",
        compact ? "py-2 px-2.5" : "py-3 px-3"
      )}
    >
      <div
        className={cn(
          "rounded-lg bg-black border border-gold/50 flex items-center justify-center group-hover:bg-gold group-hover:border-gold transition-all shadow-lg shrink-0",
          compact ? "w-8 h-8" : "w-10 h-10"
        )}
      >
        <Icon className={cn("text-gold group-hover:text-black transition-colors", compact ? "w-4 h-4" : "w-5 h-5")} />
      </div>
      <div className="min-w-0">
        <span className={cn("block font-semibold group-hover:text-gold", compact ? "text-sm" : "text-sm")}>
          {title}
        </span>
        {description ? (
          <span className="block text-xs text-black/60 group-hover:text-white/70 truncate">
            {description}
          </span>
        ) : null}
      </div>
    </Link>
  );
}
