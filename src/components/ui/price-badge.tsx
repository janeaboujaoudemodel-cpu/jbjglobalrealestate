import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { useCurrency } from "@/hooks/useCurrency";

/**
 * PriceBadge — the canonical price display component.
 *
 * Enforces consistent typography (Inter, tabular-nums, tight tracking),
 * the premium price-orange shade across light/dark surfaces, and a fixed
 * icon-to-label gap so every price reads as one premium unit.
 *
 * Always pass the AED amount; conversion + formatting is delegated to
 * the global useCurrency hook so the user's selected currency is honored.
 */

const priceBadgeVariants = cva(
  "inline-flex items-center font-sans font-semibold tabular-nums tracking-tight whitespace-nowrap text-price-orange leading-none",
  {
    variants: {
      variant: {
        // Plain text — for inline price mentions, cards, lists
        plain: "",
        // Soft pill — premium chip on light & dark surfaces
        soft:
          "rounded-full border border-price-orange/25 bg-price-orange/10 px-2.5 py-1",
        // Solid pill — emphatic CTA-adjacent placements
        solid:
          "rounded-full bg-price-orange text-white px-2.5 py-1 [&]:!text-white",
        // Outline pill — quiet placements that still need the brand color
        outline:
          "rounded-full border border-price-orange/40 px-2.5 py-1",
      },
      size: {
        xs: "price-sm gap-1 [&>svg]:h-3 [&>svg]:w-3",
        sm: "price-sm gap-1.5 [&>svg]:h-3.5 [&>svg]:w-3.5",
        md: "price-md gap-1.5 [&>svg]:h-4 [&>svg]:w-4",
        lg: "price-lg gap-2 [&>svg]:h-[18px] [&>svg]:w-[18px]",
        xl: "price-xl gap-2 [&>svg]:h-5 [&>svg]:w-5",
      },
    },
    defaultVariants: {
      variant: "plain",
      size: "md",
    },
  },
);

export interface PriceBadgeProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, "prefix">,
    VariantProps<typeof priceBadgeVariants> {
  /** Price in AED. Will be converted/formatted via global currency. */
  amount: number | null | undefined;
  /** Use compact form (e.g. AED 1.2M / 850K). Default true. */
  compact?: boolean;
  /** Optional leading icon (Lucide). Spacing is handled automatically. */
  icon?: React.ReactNode;
  /** Optional prefix label, e.g. "From". */
  prefix?: React.ReactNode;
  /** Optional suffix label, e.g. "/ month". */
  suffix?: React.ReactNode;
  /** Fallback text when amount is missing. */
  fallback?: string;
}

const PriceBadge = React.forwardRef<HTMLSpanElement, PriceBadgeProps>(
  (
    {
      className,
      variant,
      size,
      amount,
      compact = true,
      icon,
      prefix,
      suffix,
      fallback,
      ...props
    },
    ref,
  ) => {
    const { formatPrice, formatPriceFull } = useCurrency();

    const formatted = amount
      ? compact
        ? formatPrice(amount)
        : formatPriceFull(amount)
      : fallback ?? "Price on request";

    return (
      <span
        ref={ref}
        data-price=""
        data-price-badge=""
        className={cn(priceBadgeVariants({ variant, size }), className)}
        {...props}
      >
        {icon}
        {prefix ? (
          <span className="font-medium opacity-80">{prefix}</span>
        ) : null}
        <span>{formatted}</span>
        {suffix ? (
          <span className="font-medium opacity-80">{suffix}</span>
        ) : null}
      </span>
    );
  },
);
PriceBadge.displayName = "PriceBadge";

export { PriceBadge, priceBadgeVariants };
