export const ELITE_DEVELOPERS = ["emaar", "nakheel", "damac", "sobha", "meraas", "omniyat", "aldar", "dubai-properties", "dubai properties", "dubai-holding", "dubai holding"];
export const PREMIUM_DEVELOPERS = ["ellington", "binghatti", "danube", "azizi", "select-group", "select group", "deyaar", "majid-al-futtaim", "majid al futtaim", "arada", "nshama", "wasl"];
export const TOP_TIER_DEVELOPERS = ["imtiaz", "samana", "tiger", "beyond", "object", "rak-properties", "rak properties", "mag", "meydan", "reportage", "h&h", "h-h"];
export const ESTABLISHED_DEVELOPERS = ["aark", "ab-developers", "radiant", "peace homes"];

export const ELITE_PRIORITY_ORDER = [
  'emaar', 'omniyat', 'nakheel', 'sobha', 'aldar', 
  'ellington', 'damac', 'meraas', 'dubai-properties'
];

export type DeveloperTier = "elite" | "premium" | "top-tier" | "established" | "other";

export function getDeveloperTier(slug: string, name: string = "", rank?: number | null): DeveloperTier {
  const normalized = `${slug} ${name}`.toLowerCase();
  if (ELITE_DEVELOPERS.some(d => normalized.includes(d))) return "elite";
  if (PREMIUM_DEVELOPERS.some(d => normalized.includes(d))) return "premium";
  if (TOP_TIER_DEVELOPERS.some(d => normalized.includes(d))) return "top-tier";
  if (ESTABLISHED_DEVELOPERS.some(d => normalized.includes(d))) return "established";
  if (rank && rank > 0) {
    if (rank <= 10) return "elite";
    if (rank <= 30) return "premium";
    if (rank <= 80) return "top-tier";
  }
  return "other";
}

export const TIER_LABELS: Record<DeveloperTier, string> = {
  elite: "ELITE",
  premium: "PREMIUM",
  "top-tier": "TOP TIER",
  established: "ESTABLISHED",
  other: "PARTNER"
};
