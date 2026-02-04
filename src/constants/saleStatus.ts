/**
 * Sale Status Constants - Used for API sync and filtering
 * These are the official sale statuses from the Reelly API
 */

export const SALE_STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "announced", label: "Announced" },
  { value: "on_sale", label: "On Sale" },
  { value: "out_of_stock", label: "Out of Stock" },
  { value: "presale_eoi", label: "Presale (EOI)" },
  { value: "start_of_sales", label: "Start of Sales" },
] as const;

// Mapping from API values to display labels
export const SALE_STATUS_LABELS: Record<string, string> = {
  "announced": "Announced",
  "on_sale": "On Sale", 
  "out_of_stock": "Out of Stock",
  "presale_eoi": "Presale (EOI)",
  "start_of_sales": "Start of Sales",
  // Alternative API formats
  "Announced": "Announced",
  "On Sale": "On Sale",
  "Out of Stock": "Out of Stock",
  "Presale (EOI)": "Presale (EOI)",
  "Start of Sales": "Start of Sales",
};

// Convert API sale status to normalized database value
export function normalizeSaleStatus(apiStatus: string | null | undefined): string | null {
  if (!apiStatus) return null;
  
  const normalizedMap: Record<string, string> = {
    // Exact matches from API
    "Announced": "Announced",
    "On Sale": "On Sale",
    "Out of Stock": "Out of Stock",
    "Presale (EOI)": "Presale (EOI)",
    "Start of Sales": "Start of Sales",
    // Snake case variants
    "announced": "Announced",
    "on_sale": "On Sale",
    "out_of_stock": "Out of Stock",
    "presale_eoi": "Presale (EOI)",
    "start_of_sales": "Start of Sales",
    // Legacy mappings
    "available": "On Sale",
    "coming_soon": "Announced",
    "limited": "On Sale",
    "sold_out": "Out of Stock",
  };
  
  return normalizedMap[apiStatus] || apiStatus;
}

export type SaleStatusValue = typeof SALE_STATUS_OPTIONS[number]['value'];
