/**
 * Global price formatting utility.
 * Always rounds to whole numbers — no decimals (e.g., 876,975 not 876,975.005).
 */

export function formatPrice(price: number | null | undefined): string {
  if (!price) return "Price on request";
  return `AED ${formatPriceRaw(price)}`;
}

export function formatPriceShort(price: number | null | undefined): string {
  if (!price) return "Price on request";
  return `AED ${formatPriceRaw(price)}`;
}

export function formatPriceRaw(price: number): string {
  const rounded = Math.round(price);
  if (rounded >= 1_000_000) {
    const value = rounded / 1_000_000;
    return `${Number.isInteger(value) ? value.toFixed(0) : value.toFixed(1)}M`;
  }
  if (rounded >= 1_000) return `${Math.round(rounded / 1_000)}K`;
  return rounded.toLocaleString();
}
