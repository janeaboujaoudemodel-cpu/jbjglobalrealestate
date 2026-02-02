import * as React from "react";
import { Link } from "react-router-dom";
import { ArrowRight, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type MegaMenuShellProps = {
  children: React.ReactNode;
  className?: string;
  /** When true, removes max-height and overflow-y to prevent scrolling */
  noScroll?: boolean;
};

/**
 * Shared mega-menu shell:
 * - No top gold border / shimmer line (per user requirement)
 * - Wide, consistent container
 * - Champagne gradient background (design token classes)
 */
export const MegaMenuShell = React.forwardRef<HTMLDivElement, MegaMenuShellProps>(
  ({ children, className, noScroll = false }, ref) => {
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
          // Prevent the panel from touching the bottom of the viewport on smaller screens
          // Unless noScroll is true - then no max-height so all content is visible
          ...(noScroll ? {} : {
            maxHeight: 'calc(100vh - var(--header-height, 128px) - 24px)',
            overflowY: 'auto' as const,
          }),
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

export const MegaMenuSectionTitle = React.forwardRef<HTMLDivElement, MegaMenuSectionTitleProps>(
  ({ icon: Icon, title, rightSlot }, ref) => {
    return (
      <div ref={ref} className="flex items-center justify-between mb-5 pb-2 border-b border-gold/30 min-h-[36px]">
        <h4 className="text-black font-bold text-xs tracking-[0.2em] uppercase flex items-center gap-2">
          <Icon className="w-4 h-4 text-gold" />
          {title}
        </h4>
        {rightSlot}
      </div>
    );
  }
);
MegaMenuSectionTitle.displayName = "MegaMenuSectionTitle";

type MegaMenuIconLinkProps = {
  to: string;
  onClick: () => void;
  icon: LucideIcon;
  title: string;
  description?: string;
  compact?: boolean;
  /** Emphasis style for "See All" type links - gold, 3D, highlighted */
  emphasis?: boolean;
};

/**
 * Standardized link row:
 * Normal: transparent bg, black icon with gold border, black title
 * Hover: champagne-gold bg, gold title, black icon bg with gold icon
 * Emphasis: Premium gold styling with black text for maximum readability - 3D effect - LARGER title
 */
export function MegaMenuIconLink({
  to,
  onClick,
  icon: Icon,
  title,
  description,
  compact = false,
  emphasis = false,
}: MegaMenuIconLinkProps) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 rounded-xl transition-all duration-300 group relative",
        emphasis
          // Emphasis style: Gold gradient bg, black text for readability, 3D shadow
          ? "bg-gradient-to-r from-gold/40 via-gold/30 to-gold/40 hover:from-gold/60 hover:via-gold/50 hover:to-gold/60 shadow-[0_4px_15px_rgba(200,167,102,0.35)] hover:shadow-[0_6px_20px_rgba(200,167,102,0.5)] hover:-translate-y-0.5 border-2 border-gold/60 hover:border-gold"
          // Normal: transparent; Hover: champagne gradient background
          : "bg-transparent hover:bg-gradient-to-r hover:from-[#F5EBD7] hover:to-[#E8DCC8]",
        // Emphasis links get extra padding for prominence
        emphasis ? "py-3 px-4" : compact ? "py-2 px-2.5" : "py-3 px-3"
      )}
    >
      {/* Icon container - larger for emphasis links */}
      <div
        className={cn(
          "rounded-lg border transition-all duration-300 flex items-center justify-center shrink-0",
          emphasis
            ? "bg-black border-gold group-hover:border-gold group-hover:shadow-[0_0_12px_rgba(200,167,102,0.5)] w-10 h-10"
            : "bg-transparent border-gold/50 group-hover:border-gold",
          !emphasis && compact ? "w-7 h-7" : !emphasis ? "w-10 h-10" : ""
        )}
      >
        <Icon className={cn(
          "transition-colors duration-300",
          emphasis
            ? "text-gold w-5 h-5"
            : "text-black group-hover:text-gold",
          !emphasis && compact ? "w-3.5 h-3.5" : !emphasis ? "w-5 h-5" : ""
        )} />
      </div>
      <div className="min-w-0 flex-1">
        {/* Title - Emphasis uses LARGER text for better visual balance in gold cards */}
        <span className={cn(
          "block font-bold transition-colors duration-300",
          emphasis
            ? "text-black group-hover:text-black text-base"
            : "text-black group-hover:text-gold",
          !emphasis && compact ? "text-[13px]" : !emphasis ? "text-sm" : ""
        )}>
          {title}
        </span>
        {description ? (
          <span className="block text-xs text-black/60 group-hover:text-black/70 truncate transition-colors">
            {description}
          </span>
        ) : null}
      </div>
      {/* Thin gold divider under each page link - not shown for emphasis links */}
      {!emphasis && (
        <div className="absolute bottom-0 left-3 right-3 h-[1px] bg-gradient-to-r from-transparent via-gold/30 to-transparent" />
      )}
    </Link>
  );
}

/**
 * Section divider - thin gold line between sections in mega menus
 */
export function MegaMenuSectionDivider() {
  return (
    <div className="my-4 h-[1px] bg-gradient-to-r from-transparent via-gold/40 to-transparent" />
  );
}
