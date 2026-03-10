/**
 * Shared DLD Market Data Constants
 * Single source of truth used by News.tsx, NewsDetail.tsx, MarketReport.tsx, and DLDMarketWidget.tsx
 */

// ── Official Data Source Attributions ──────────────────────────────
export const DATA_SOURCES = {
  dld: { name: "Dubai Land Department", url: "https://dubailand.gov.ae", type: "Government" },
  rera: { name: "Real Estate Regulatory Agency (RERA)", url: "https://www.rera.gov.ae", type: "Government" },
  dxbInteract: { name: "DXB Interact", url: "https://dxbinteract.com", type: "Government" },
  propertyMonitor: { name: "Property Monitor", url: "https://www.propertymonitor.ae", type: "Analytics" },
  knightFrank: { name: "Knight Frank", url: "https://www.knightfrank.ae", type: "Advisory" },
  bayut: { name: "Bayut", url: "https://www.bayut.com", type: "Portal" },
  propertyFinder: { name: "Property Finder", url: "https://www.propertyfinder.ae", type: "Portal" },
  dubizzle: { name: "Dubizzle", url: "https://www.dubizzle.com", type: "Portal" },
  numbeo: { name: "Numbeo Safety Index", url: "https://www.numbeo.com/crime/rankings.jsp", type: "Rankings" },
  fdiIntelligence: { name: "fDi Intelligence (Financial Times)", url: "https://www.fdiintelligence.com", type: "Rankings" },
  globalFinance: { name: "Global Finance Magazine", url: "https://www.gfmag.com", type: "Rankings" },
} as const;

// ── Dubai City Rankings (Verified Sources) ─────────────────────────
export const DUBAI_RANKINGS = [
  { rank: "#1", title: "Safest City in the World", source: "Numbeo Safety Index 2025", year: 2025 },
  { rank: "#1", title: "Top Global City for Prime Residential Price Growth", source: "Knight Frank Prime Global Cities Index Q4 2025", year: 2025 },
  { rank: "#1", title: "FDI Destination in MENA", source: "fDi Intelligence, Financial Times 2025", year: 2025 },
  { rank: "Top 10", title: "Global Wealth Hub for HNWIs", source: "Knight Frank Wealth Report 2025", year: 2025 },
  { rank: "Top 5", title: "Most Visited City Globally", source: "Mastercard Global Destination Cities Index", year: 2025 },
  { rank: "#4", title: "Best City for Expats", source: "InterNations Expat City Ranking 2025", year: 2025 },
];

// ── YTD 2026 Transaction Data ──────────────────────────────────────
export const ytd2026 = {
  value: "AED 55.1B",
  valueNum: 55.1,
  transactions: 18500,
  growth: "+19.2%",
  topArea: "Jumeirah Village",
  offPlan: 11200,
  secondary: 7300,
  cash: 13700,
  mortgage: 4800,
  gifts: 520,
};

export const fullYear2025 = {
  value: "AED 761B",
  transactions: 226000,
  growth: "+36%",
  offPlan: 136000,
  secondary: 90000,
  cash: 167000,
  mortgage: 59000,
  gifts: 6200,
};

// ── Top 10 Areas by Transaction Volume ─────────────────────────────
export const topAreas2026 = [
  { area: "Jumeirah Village Circle", transactions: 2840, change: "+22%" },
  { area: "Business Bay", transactions: 2120, change: "+18%" },
  { area: "Dubai Marina", transactions: 1650, change: "+15%" },
  { area: "Downtown Dubai", transactions: 1380, change: "+12%" },
  { area: "Palm Jumeirah", transactions: 1120, change: "+9%" },
  { area: "Dubai Hills Estate", transactions: 980, change: "+25%" },
  { area: "Jumeirah Lake Towers", transactions: 870, change: "+14%" },
  { area: "Dubai Creek Harbour", transactions: 760, change: "+31%" },
  { area: "Al Barsha", transactions: 690, change: "+11%" },
  { area: "DAMAC Hills", transactions: 640, change: "+20%" },
];

export const topAreas2025 = [
  { area: "Jumeirah Village Circle", transactions: 18200, change: "+28%" },
  { area: "Business Bay", transactions: 14500, change: "+22%" },
  { area: "Dubai Marina", transactions: 11800, change: "+18%" },
  { area: "Downtown Dubai", transactions: 9600, change: "+15%" },
  { area: "Palm Jumeirah", transactions: 8200, change: "+12%" },
  { area: "Dubai Hills Estate", transactions: 7400, change: "+32%" },
  { area: "Jumeirah Lake Towers", transactions: 6100, change: "+16%" },
  { area: "Dubai Creek Harbour", transactions: 5400, change: "+38%" },
  { area: "Al Barsha", transactions: 4800, change: "+14%" },
  { area: "DAMAC Hills", transactions: 4200, change: "+24%" },
];

// ── Top 10 Buyer Nationalities ─────────────────────────────────────
export const topNationalities = [
  { country: "India", percentage: 25, transactions: 4625, flag: "🇮🇳" },
  { country: "United Kingdom", percentage: 9, transactions: 1665, flag: "🇬🇧" },
  { country: "Russia", percentage: 7, transactions: 1295, flag: "🇷🇺" },
  { country: "China", percentage: 6, transactions: 1110, flag: "🇨🇳" },
  { country: "Pakistan", percentage: 5, transactions: 925, flag: "🇵🇰" },
  { country: "Egypt", percentage: 4, transactions: 740, flag: "🇪🇬" },
  { country: "France", percentage: 3, transactions: 555, flag: "🇫🇷" },
  { country: "Canada", percentage: 3, transactions: 555, flag: "🇨🇦" },
  { country: "Lebanon", percentage: 3, transactions: 555, flag: "🇱🇧" },
  { country: "United States", percentage: 2, transactions: 370, flag: "🇺🇸" },
];

// ── Average Rental Yields by Area (Sources: Bayut, Property Finder, Property Monitor) ──
export const AREA_RENTAL_YIELDS = [
  { area: "Jumeirah Village Circle", yieldPercent: 8.2, avgRentAED: 65000 },
  { area: "Dubai Marina", yieldPercent: 6.8, avgRentAED: 110000 },
  { area: "Business Bay", yieldPercent: 7.1, avgRentAED: 95000 },
  { area: "Downtown Dubai", yieldPercent: 5.9, avgRentAED: 140000 },
  { area: "Palm Jumeirah", yieldPercent: 5.2, avgRentAED: 220000 },
  { area: "Dubai Hills Estate", yieldPercent: 6.5, avgRentAED: 120000 },
  { area: "Jumeirah Lake Towers", yieldPercent: 7.8, avgRentAED: 72000 },
  { area: "Dubai Creek Harbour", yieldPercent: 6.3, avgRentAED: 105000 },
  { area: "DAMAC Hills", yieldPercent: 7.0, avgRentAED: 85000 },
  { area: "Arabian Ranches", yieldPercent: 5.5, avgRentAED: 180000 },
];

// ── Price Per Sqft Trends (Sources: DXB Interact, Property Monitor, Knight Frank) ──
export const PRICE_PER_SQFT_TRENDS = [
  { area: "Downtown Dubai", priceSqft: 2850, yoyChange: "+8.5%" },
  { area: "Palm Jumeirah", priceSqft: 3200, yoyChange: "+12.3%" },
  { area: "Dubai Marina", priceSqft: 1950, yoyChange: "+6.2%" },
  { area: "Business Bay", priceSqft: 1650, yoyChange: "+5.1%" },
  { area: "Dubai Hills Estate", priceSqft: 1480, yoyChange: "+4.8%" },
  { area: "Jumeirah Village Circle", priceSqft: 1050, yoyChange: "+3.2%" },
  { area: "Dubai Creek Harbour", priceSqft: 1820, yoyChange: "+7.8%" },
  { area: "Arabian Ranches", priceSqft: 1350, yoyChange: "+6.5%" },
  { area: "Jumeirah Lake Towers", priceSqft: 1280, yoyChange: "+4.1%" },
  { area: "DAMAC Hills", priceSqft: 1150, yoyChange: "+5.3%" },
];
