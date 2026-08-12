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

/**
 * PASS 298 — TOP DEVELOPERS ALWAYS ON TOP.
 * Lower weight = higher priority. Used by every developer list so an unknown
 * or newly imported developer can never outrank Emaar, Omniyat, Sobha, Nakheel…
 */
export const TIER_WEIGHT: Record<DeveloperTier, number> = {
  elite: 0,
  premium: 1,
  "top-tier": 2,
  established: 3,
  other: 4,
};

export function developerPriorityWeight(
  slug: string,
  name: string = "",
  rank?: number | null,
): number {
  const s = (slug || "").toLowerCase();
  const n = (name || "").toLowerCase();
  const eliteIdx = ELITE_PRIORITY_ORDER.findIndex((d) => s.includes(d) || n.includes(d));
  if (eliteIdx >= 0) return eliteIdx; // 0..8 — hand-curated marquee order
  return 10 + TIER_WEIGHT[getDeveloperTier(slug, name, rank)] * 10;
}

/** Canonical comparator: curated elite order → tier → rank → name. */
export function compareDevelopersByPriority(
  a: { slug?: string | null; name?: string | null; rank?: number | null },
  b: { slug?: string | null; name?: string | null; rank?: number | null },
): number {
  const aw = developerPriorityWeight(a.slug || "", a.name || "", a.rank);
  const bw = developerPriorityWeight(b.slug || "", b.name || "", b.rank);
  if (aw !== bw) return aw - bw;
  const ar = a.rank && a.rank > 0 ? a.rank : 999;
  const br = b.rank && b.rank > 0 ? b.rank : 999;
  if (ar !== br) return ar - br;
  return (a.name || "").localeCompare(b.name || "");
}
