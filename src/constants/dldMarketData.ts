/**
 * Shared DLD Market Data Constants
 * Single source of truth used by News.tsx and MarketReport.tsx (book generation)
 */

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
