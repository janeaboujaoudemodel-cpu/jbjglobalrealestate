/**
 * Global price formatting utility.
 * Always rounds to whole numbers — no decimals (e.g., 876,975 not 876,975.005).
 */

export function formatPrice(price: number | null | undefined): string {
  if (!price) return "Price on request";
  return `AED ${Math.round(price).toLocaleString()}`;
}

export function formatPriceShort(price: number | null | undefined): string {
  if (!price) return "Price on request";
  const rounded = Math.round(price);
  if (rounded >= 1000000) return `AED ${(rounded / 1000000).toFixed(1)}M`;
  if (rounded >= 1000) return `AED ${Math.round(rounded / 1000)}K`;
  return `AED ${rounded.toLocaleString()}`;
}

export function formatPriceRaw(price: number): string {
  return Math.round(price).toLocaleString();
}
