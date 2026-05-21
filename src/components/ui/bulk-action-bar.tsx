import { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * BulkActionBar — site-wide primitive for sticky selection/action toolbars.
 *
 * Hard rules (site-wise):
 *  - Single horizontal row at ALL viewport widths. NEVER stacks vertically.
 *  - Overflow scrolls horizontally; the left "lead" cluster stays pinned.
 *  - Children buttons/selects should pair with <BulkActionItem /> so labels
 *    do not wrap and controls do not shrink awkwardly.
 *
 * Champagne-gold theme baked in (page #FDFBF7 → surface #F7F2EA → raised
 * #EFE6D6, 1px gold hairline, ink text). Matches design system memory.
 */

interface BulkActionBarProps {
  /** Pinned cluster on the left (typically the "N selected" + Clear). */
  lead: ReactNode;
  /** Scrolling cluster of action buttons / selects on the right. */
  children: ReactNode;
  /** Sticky offset; default 0 (use 88 inside main content for the L-frame). */
  stickyTop?: number;
  className?: string;
}

export function BulkActionBar({
  lead,
  children,
  stickyTop = 0,
  className,
}: BulkActionBarProps) {
  return (
    <div className="sticky z-40" style={{ top: stickyTop }}>
      <div
        className={cn(
          "rounded-xl border border-[#B89555]/40 bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6]",
          "shadow-[0_4px_20px_rgba(200,167,102,0.18)]",
          // Always a single row — no md:flex-col / no flex-wrap.
          "flex items-center gap-3 pl-3 pr-2 py-2",
          className,
        )}
      >
        {/* Pinned lead cluster — never scrolls, never shrinks. */}
        <div className="flex items-center gap-2 shrink-0">{lead}</div>

        {/* Vertical hairline separator */}
        <div className="h-6 w-px bg-[#B89555]/30 shrink-0" aria-hidden />

        {/* Scrolling actions cluster. */}
        <div
          className={cn(
            "flex items-center gap-2 flex-nowrap min-w-0",
            "overflow-x-auto",
            // Hide scrollbar visuals but keep functionality.
            "[scrollbar-width:thin] [&::-webkit-scrollbar]:h-1.5",
            "[&::-webkit-scrollbar-thumb]:bg-[#B89555]/30",
            "[&::-webkit-scrollbar-thumb]:rounded-full",
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

/**
 * Wrap each direct action child so it never wraps text or shrinks below
 * its content width. Use on Buttons, <select>s, etc.
 */
export function BulkActionItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "shrink-0 whitespace-nowrap [&>*]:whitespace-nowrap",
        className,
      )}
    >
      {children}
    </div>
  );
}

export default BulkActionBar;
