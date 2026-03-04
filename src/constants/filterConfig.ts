/**
 * Unified Filter Configuration - Central configuration for all filter options
 * Used across Homepage, Properties, and Map pages for consistency
 */

// Sale Status with Reelly-style colored dots
export const SALE_STATUS_CONFIG = {
  "Announced": { 
    label: "Announced", 
    dotClass: "bg-pink-400", 
    textClass: "text-pink-400",
    bgClass: "bg-pink-400/10",
    borderClass: "border-pink-400/30"
  },
  "Presale (EOI)": { 
    label: "Pre-sale (EOI)", 
    dotClass: "bg-green-400", 
    textClass: "text-green-400",
    bgClass: "bg-green-400/10",
    borderClass: "border-green-400/30"
  },
  "Start of Sales": { 
    label: "Start of Sales", 
    dotClass: "bg-yellow-400", 
    textClass: "text-yellow-400",
    bgClass: "bg-yellow-400/10",
    borderClass: "border-yellow-400/30"
  },
  "On Sale": { 
    label: "On Sale", 
    dotClass: "bg-blue-400", 
    textClass: "text-blue-400",
    bgClass: "bg-blue-400/10",
    borderClass: "border-blue-400/30"
  },
  "Sold Out": { 
    label: "Sold Out", 
    dotClass: "bg-red-500", 
    textClass: "text-red-500",
    bgClass: "bg-red-500/10",
    borderClass: "border-red-500/30"
  },
} as const;

export type SaleStatusKey = keyof typeof SALE_STATUS_CONFIG;

export const SALE_STATUS_OPTIONS = [
  { value: "all", label: "All Statuses" },
  { value: "Announced", label: "Announced", color: SALE_STATUS_CONFIG["Announced"] },
  { value: "Presale (EOI)", label: "Pre-sale (EOI)", color: SALE_STATUS_CONFIG["Presale (EOI)"] },
  { value: "Start of Sales", label: "Start of Sales", color: SALE_STATUS_CONFIG["Start of Sales"] },
  { value: "On Sale", label: "On Sale", color: SALE_STATUS_CONFIG["On Sale"] },
  { value: "Sold Out", label: "Sold Out", color: SALE_STATUS_CONFIG["Sold Out"] },
] as const;

// Extended Property Types - includes all from Reelly + your existing types
export const EXTENDED_PROPERTY_TYPES = [
  { value: "all", label: "All Types" },
  { value: "apartments", label: "Apartments" },
  { value: "villa", label: "Villa" },
  { value: "townhouse", label: "Townhouse" },
  { value: "penthouse", label: "Penthouse" },
  { value: "duplex", label: "Duplex" },
  { value: "simplex", label: "Simplex" },
  { value: "sky-villas", label: "Sky Villas" },
  { value: "mansion", label: "Mansion" },
  { value: "studio", label: "Studio" },
  { value: "plot", label: "Plot" },
  { value: "land", label: "Land" },
  { value: "retail", label: "Retail" },
  { value: "offices", label: "Offices" },
  { value: "commercial", label: "Commercial" },
] as const;

// Extended Bedroom options up to 7+
export const BEDROOM_OPTIONS = [
  { value: "all", label: "Any" },
  { value: "studio", label: "Studio" },
  { value: "1", label: "1" },
  { value: "2", label: "2" },
  { value: "3", label: "3" },
  { value: "4", label: "4" },
  { value: "5", label: "5" },
  { value: "6", label: "6" },
  { value: "7+", label: "7+" },
] as const;

// Emirates with checkbox support - UAE + International priority countries
export const EMIRATES_OPTIONS = [
  // UAE Emirates
  { value: "Dubai", label: "Dubai", country: "UAE" },
  { value: "Abu Dhabi", label: "Abu Dhabi", country: "UAE" },
  { value: "Sharjah", label: "Sharjah", country: "UAE" },
  { value: "Ras Al Khaimah", label: "Ras Al Khaimah", country: "UAE" },
  { value: "Ajman", label: "Ajman", country: "UAE" },
  { value: "Fujairah", label: "Fujairah", country: "UAE" },
  { value: "Umm Al Quwain", label: "Umm Al Quwain", country: "UAE" },
  // International Priority Countries
  { value: "Cyprus", label: "Cyprus", country: "International" },
  { value: "Indonesia", label: "Indonesia", country: "International" },
  { value: "Oman", label: "Oman", country: "International" },
  { value: "Thailand", label: "Thailand", country: "International" },
] as const;

// Handover year options
export const HANDOVER_YEAR_OPTIONS = [
  { value: 2024, label: "2024" },
  { value: 2025, label: "2025" },
  { value: 2026, label: "2026" },
  { value: 2027, label: "2027" },
  { value: 2028, label: "2028" },
  { value: 2029, label: "2029" },
  { value: 2030, label: "2030" },
  { value: 2031, label: "2031" },
  { value: 2032, label: "2032" },
] as const;

// Development Status options
export const DEVELOPMENT_STATUS_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "ready", label: "Ready to Move" },
  { value: "off-plan", label: "Off-Plan" },
  { value: "under-construction", label: "Under Construction" },
] as const;

// Display Mode options
export const DISPLAY_MODE_OPTIONS = [
  { value: "investor", label: "Investor Mode", icon: "TrendingUp", description: "ROI metrics, rental yield, payment structure" },
  { value: "broker", label: "Broker Mode", icon: "Briefcase", description: "Commission info, quick share, developer contacts" },
] as const;

export type DisplayMode = typeof DISPLAY_MODE_OPTIONS[number]['value'];

// 10 Unified Currencies
export const CURRENCY_OPTIONS = [
  { code: 'AED', label: 'AED', symbol: 'AED', flag: '🇦🇪' },
  { code: 'USD', label: 'USD', symbol: '$', flag: '🇺🇸' },
  { code: 'EUR', label: 'EUR', symbol: '€', flag: '🇪🇺' },
  { code: 'GBP', label: 'GBP', symbol: '£', flag: '🇬🇧' },
  { code: 'INR', label: 'INR', symbol: '₹', flag: '🇮🇳' },
  { code: 'SAR', label: 'SAR', symbol: 'SAR', flag: '🇸🇦' },
  { code: 'CNY', label: 'CNY', symbol: '¥', flag: '🇨🇳' },
  { code: 'RUB', label: 'RUB', symbol: '₽', flag: '🇷🇺' },
  { code: 'CAD', label: 'CAD', symbol: 'C$', flag: '🇨🇦' },
  { code: 'AUD', label: 'AUD', symbol: 'A$', flag: '🇦🇺' },
] as const;

export type CurrencyCode = typeof CURRENCY_OPTIONS[number]['code'];

// Area Unit options
export const AREA_UNIT_OPTIONS = [
  { value: 'sqft', label: 'Square Feet', shortLabel: 'sqft' },
  { value: 'sqm', label: 'Square Meters', shortLabel: 'sqm' },
] as const;

export type AreaUnit = typeof AREA_UNIT_OPTIONS[number]['value'];

// Sort options with premium labels
export const SORT_OPTIONS = [
  { value: "newest", label: "Recently Added" },
  { value: "oldest", label: "First Listed" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
  { value: "size-large", label: "Size: Largest First" },
  { value: "size-small", label: "Size: Smallest First" },
] as const;

// Payment Plan range (0-100%)
export const PAYMENT_PLAN_DEFAULTS = {
  min: 0,
  max: 100,
  step: 5,
} as const;

// Map tile providers
export const MAP_TILE_PROVIDERS = {
  standard: {
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  },
  satellite: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: 'Tiles &copy; Esri',
  },
  terrain: {
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
    attribution: 'Tiles &copy; Esri',
  },
} as const;

export type MapTileProvider = keyof typeof MAP_TILE_PROVIDERS;

// Helper function to get sale status color config
export function getSaleStatusConfig(status: string | null | undefined) {
  if (!status) return null;
  
  // Try exact match first
  if (status in SALE_STATUS_CONFIG) {
    return SALE_STATUS_CONFIG[status as SaleStatusKey];
  }
  
  // Try case-insensitive match
  const normalizedStatus = status.toLowerCase();
  for (const [key, config] of Object.entries(SALE_STATUS_CONFIG)) {
    if (key.toLowerCase() === normalizedStatus) {
      return config;
    }
  }
  
  // Map common variations
  if (normalizedStatus.includes('sold') || normalizedStatus.includes('out of stock')) {
    return SALE_STATUS_CONFIG["Sold Out"];
  }
  if (normalizedStatus.includes('presale') || normalizedStatus.includes('eoi')) {
    return SALE_STATUS_CONFIG["Presale (EOI)"];
  }
  if (normalizedStatus.includes('start')) {
    return SALE_STATUS_CONFIG["Start of Sales"];
  }
  if (normalizedStatus.includes('announced')) {
    return SALE_STATUS_CONFIG["Announced"];
  }
  if (normalizedStatus.includes('on sale') || normalizedStatus.includes('available')) {
    return SALE_STATUS_CONFIG["On Sale"];
  }
  
  return null;
}
