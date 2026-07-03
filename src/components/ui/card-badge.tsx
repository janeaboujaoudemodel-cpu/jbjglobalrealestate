import * as React from 'react';
import { cn } from '@/lib/utils';

/**
 * CardBadge — single reusable overlay badge for property/project cards.
 *
 * Enforces consistent emerald/white contrast + typography across
 * FeaturedListings, ProjectCard, and ReellyProjectCard.
 *
 * Variants:
 *  - "status" (default): emerald ombre + white text.
 *      Use for On Sale / Announced / Presale, etc. Never use for property-type
 *      labels on public project cards; top-left card identity is developer logo/nameplate only.
 *  - "sold": ink-red fill + white text (always high-contrast).
 *
 * Typography (locked via .card-status-badge in index.css):
 *  Inter 800 / 10.5px / uppercase / 0.14em tracking — DO NOT override per-site.
 */

type CardBadgeVariant = 'status' | 'sold' | 'status-frame';

export interface CardBadgeProps
  extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardBadgeVariant;
  /** Convenience for icon + label composition. */
  children: React.ReactNode;
}

export const CardBadge = React.forwardRef<HTMLDivElement, CardBadgeProps>(
  ({ variant = 'status', className, children, ...props }, ref) => {
    if (variant === 'sold') {
      return (
        <div
          ref={ref}
          data-no-contrast-guard
          className={cn(
            // Inline equivalent of .card-status-badge geometry so the
            // sold pill matches the status pill exactly (size/shape/weight).
            'inline-flex items-center justify-center whitespace-nowrap',
            'px-[10px] py-[5px] rounded-full',
            "font-['Inter'] font-extrabold uppercase leading-none",
            'text-[10.5px] tracking-[0.14em]',
            'bg-[#DC2626] text-white border border-[#FCA5A5]',
            'shadow-[0_4px_14px_rgba(0,0,0,0.18)]',
            className,
          )}
          {...props}
        >
          {children}
        </div>
      );
    }

    if (variant === 'status-frame') {
      // Rectangular emerald frame — matches price-pill geometry.
      // Used for the owner-opt-in sale-status badge on cards.
      return (
        <div
          ref={ref}
          data-no-contrast-guard
          className={cn(
            'inline-flex items-center justify-center whitespace-nowrap',
            'px-2.5 py-1 rounded-sm',
            "font-['Inter'] font-bold uppercase leading-none",
            'text-[10.5px] tracking-[0.14em]',
            'allow-white jj-pill-emerald-metallic text-white border-0',
            'shadow-[0_2px_8px_rgba(0,0,0,0.10)]',
            className,
          )}
          {...props}
        >
          {children}
        </div>
      );
    }

    // status (default) — emerald ombre + white text
    return (
      <div
        ref={ref}
        data-no-contrast-guard
        className={cn('card-status-badge', className)}
        {...props}
      >
        {children}
      </div>
    );
  },
);

CardBadge.displayName = 'CardBadge';

/**
 * Shared resolver for project sale-status → unified badge label.
 * Returns null when the status should not be surfaced.
 */
export const resolveSaleStatusLabel = (
  status?: string | null,
): string | null => {
  if (!status) return null;
  const s = status.toLowerCase();
  if (s.includes('sold')) return null; // handled via <CardBadge variant="sold">
  if (s.includes('on sale') || s.includes('start')) return 'On Sale';
  if (s.includes('announced')) return 'Announced';
  if (s.includes('presale') || s.includes('eoi')) return 'Presale';
  return null;
};
