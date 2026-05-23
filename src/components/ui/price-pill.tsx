/**
 * PricePill — UNIFIED price label for ALL property cards across the app.
 *
 * Locked visual contract:
 *  - Box:    `price-pill-premium` (champagne fill, gold hairline, orange value)
 *  - Eyebrow "From" → `price-pill-eyebrow` (ink #1A1A1A)
 *  - Value           → `price-pill-value`   (`--price-orange`)
 *
 * Use this component EVERYWHERE a property `price_from` is shown.
 * Do NOT hand-roll "From AED X.XM" strings — they will drift from the brand.
 */

import React from "react";
import { cn } from "@/lib/utils";

interface PricePillProps {
  price?: number | null;
  currency?: "AED" | "USD" | "EUR" | "GBP" | "INR" | "SAR" | "CNY" | "RUB" | "CAD" | "AUD";
  /** When true, renders absolutely positioned bottom-right (over a media area). */
  floating?: boolean;
  /** Eyebrow label, defaults to "From". Hidden when no price. */
  eyebrow?: string;
  /** Fallback label when price is missing. */
  fallback?: string;
  className?: string;
}

const SYMBOLS: Record<string, string> = {
  AED: "AED",
  USD: "$",
  EUR: "€",
  GBP: "£",
  INR: "₹",
  SAR: "SAR",
  CNY: "¥",
  RUB: "₽",
  CAD: "C$",
  AUD: "A$",
};

const RATES: Record<string, number> = {
  AED: 1, USD: 0.27, EUR: 0.25, GBP: 0.21, INR: 22.5,
  SAR: 1.02, CNY: 1.98, RUB: 24.5, CAD: 0.37, AUD: 0.42,
};

function format(price: number, currency: string): string {
  const converted = price * (RATES[currency] ?? 1);
  const sym = SYMBOLS[currency] ?? currency;
  if (converted >= 1_000_000) return `${sym} ${(converted / 1_000_000).toFixed(1)}M`;
  if (converted >= 1_000) return `${sym} ${(converted / 1_000).toFixed(0)}K`;
  return `${sym} ${Math.round(converted).toLocaleString()}`;
}

export const PricePill: React.FC<PricePillProps> = ({
  price,
  currency = "AED",
  floating = false,
  eyebrow = "From",
  fallback = "Price on request",
  className,
}) => {
  const hasPrice = typeof price === "number" && price > 0;
  return (
    <div
      data-price-badge
      data-no-contrast-guard
      className={cn(
        "price-pill-premium",
        floating && "absolute bottom-3 right-3 z-10",
        className
      )}
    >
      {hasPrice ? (
        <>
          <span className="price-pill-eyebrow">{eyebrow}</span>
          <span className="price-pill-value">{format(price!, currency)}</span>
        </>
      ) : (
        <span className="price-pill-value">{fallback}</span>
      )}
    </div>
  );
};

export default PricePill;
