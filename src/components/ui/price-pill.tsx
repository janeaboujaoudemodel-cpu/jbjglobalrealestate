/**
 * PricePill — UNIFIED price label for ALL property cards across the app.
 *
 * Locked visual contract:
 *  - Box:    `price-pill-premium` (champagne fill, gold hairline, orange value)
 *  - Eyebrow "From" → `price-pill-eyebrow` (ink #1A1A1A)
 *  - Value           → `price-pill-value`   (`--price-orange`)
 *  - When `listingKind === 'leasing'`, value gets "/yr" suffix in ink so it
 *    can never be mistaken for a sale price.
 *
 * Use this component EVERYWHERE a property `price_from` is shown.
 * Do NOT hand-roll "From AED X.XM" strings — they will drift from the brand.
 */

import React from "react";
import { cn } from "@/lib/utils";
import { useCurrency } from "@/hooks/useCurrency";

interface PricePillProps {
  price?: number | null;
  currency?: "AED" | "USD" | "EUR" | "GBP" | "INR" | "SAR" | "CNY" | "RUB" | "CAD" | "AUD";
  /** When true, renders absolutely positioned bottom-right (over a media area). */
  floating?: boolean;
  /** Eyebrow label, defaults to "From". Hidden when no price. */
  eyebrow?: string;
  /** Fallback label when price is missing. */
  fallback?: string;
  /** Pass `'leasing'` for rental listings so the pill renders "/yr". */
  listingKind?: string | null;
  className?: string;
}

export const PricePill: React.FC<PricePillProps> = ({
  price,
  currency: _currency = "AED",
  floating = false,
  eyebrow = "From",
  fallback = "Price on request",
  listingKind,
  className,
}) => {
  const { formatPrice } = useCurrency();
  const hasPrice = typeof price === "number" && price > 0;
  const isLeasing = (listingKind || "").toLowerCase() === "leasing";
  return (
    <div
      data-price-badge
      data-no-contrast-guard
      data-listing-kind={listingKind || undefined}
      className={cn(
        "price-pill-premium",
        floating && "absolute bottom-3 right-3 z-10",
        className
      )}
    >
      {hasPrice ? (
        <>
          <span className="price-pill-eyebrow">{eyebrow}</span>
          <span className="price-pill-value">
            {formatPrice(price!)}
            {isLeasing && (
              <span className="price-pill-eyebrow" style={{ marginLeft: 4 }}>/yr</span>
            )}
          </span>
        </>
      ) : (
        <span className="price-pill-value">{fallback}</span>
      )}
    </div>
  );
};

export default PricePill;
