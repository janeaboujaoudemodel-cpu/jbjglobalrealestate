/**
 * Shared search-filter model for the global geo filter bar.
 *
 * One serialisation format is used everywhere (hero bar, portal developer
 * filter, /properties) so a filter selection can be handed between surfaces
 * with a plain URL.
 */

import {
  COUNTRY_CURRENCY,
  getAreas,
  getRegions,
  type ListingIntent,
  type PropertyCategory,
} from "@/data/geography";


export interface GeoSearchFilters {
  intent: ListingIntent;
  category: PropertyCategory;
  country: string | null;
  region: string | null;
  areas: string[];
  beds: string[];
  baths: string[];
  priceMin: number | null;
  priceMax: number | null;
  sizeMin: number | null;
  sizeMax: number | null;
  completion: string | null;
  furnishing: string | null;
  developer: string | null;
  q: string;
}

export const EMPTY_FILTERS: GeoSearchFilters = {
  intent: "buy",
  category: "residential",
  country: "uae",
  region: null,
  areas: [],
  beds: [],
  baths: [],
  priceMin: null,
  priceMax: null,
  sizeMin: null,
  sizeMax: null,
  completion: null,
  furnishing: null,
  developer: null,
  q: "",
};

export const currencyFor = (country?: string | null) =>
  COUNTRY_CURRENCY[country ?? ""] ?? "AED";

/**
 * Serialises the filter model. Emits BOTH the canonical geo slugs and the
 * display-name params (`areas`, `emirates`, `bedrooms`, `transaction`) that the
 * existing /properties filter engine already understands, so a hero selection
 * lands as real, applied filters instead of a bare query string.
 */
export function filtersToParams(f: GeoSearchFilters): URLSearchParams {
  const p = new URLSearchParams();
  if (f.q.trim()) p.set("q", f.q.trim());
  if (f.intent) {
    p.set("intent", f.intent);
    if (f.intent === "buy" || f.intent === "rent") p.set("transaction", f.intent);
    if (f.intent === "off-plan") p.set("saleStatus", "off-plan");
  }
  if (f.category) p.set("category", f.category);
  if (f.country) p.set("country", f.country);
  if (f.region) {
    p.set("region", f.region);
    const regionName = getRegions(f.country).find((r) => r.slug === f.region)?.name;
    if (regionName) p.set("emirates", regionName);
  }
  if (f.areas.length) {
    p.set("areaSlugs", f.areas.join(","));
    const all = getAreas(f.country, f.region);
    const names = f.areas.map((s) => all.find((x) => x.slug === s)?.name).filter(Boolean) as string[];
    if (names.length) p.set("areas", names.join(","));
  }
  if (f.beds.length) {
    p.set("beds", f.beds.join(","));
    p.set("bedrooms", f.beds.join(","));
  }
  if (f.baths.length) p.set("baths", f.baths.join(","));

  if (f.priceMin != null) p.set("priceMin", String(f.priceMin));
  if (f.priceMax != null) p.set("priceMax", String(f.priceMax));
  if (f.sizeMin != null) p.set("sizeMin", String(f.sizeMin));
  if (f.sizeMax != null) p.set("sizeMax", String(f.sizeMax));
  if (f.completion) p.set("completion", f.completion);
  if (f.furnishing && f.furnishing !== "any") p.set("furnishing", f.furnishing);
  if (f.developer) p.set("developer", f.developer);
  return p;
}

const num = (v: string | null) => {
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

export function paramsToFilters(p: URLSearchParams): GeoSearchFilters {
  return {
    ...EMPTY_FILTERS,
    q: p.get("q") ?? "",
    intent: (p.get("intent") as ListingIntent) || EMPTY_FILTERS.intent,
    category: (p.get("category") as PropertyCategory) || EMPTY_FILTERS.category,
    country: p.get("country") ?? EMPTY_FILTERS.country,
    region: p.get("region"),
    areas: (p.get("areas") ?? "").split(",").filter(Boolean),
    beds: (p.get("beds") ?? "").split(",").filter(Boolean),
    baths: (p.get("baths") ?? "").split(",").filter(Boolean),
    priceMin: num(p.get("priceMin")),
    priceMax: num(p.get("priceMax")),
    sizeMin: num(p.get("sizeMin")),
    sizeMax: num(p.get("sizeMax")),
    completion: p.get("completion"),
    furnishing: p.get("furnishing"),
    developer: p.get("developer"),
  };
}

/** Number of "extra" filters active — drives the `More Filters (n)` badge. */
export function countMoreFilters(f: GeoSearchFilters): number {
  let n = 0;
  if (f.sizeMin != null || f.sizeMax != null) n += 1;
  if (f.completion) n += 1;
  if (f.furnishing && f.furnishing !== "any") n += 1;
  if (f.developer) n += 1;
  return n;
}

export function activeFilterCount(f: GeoSearchFilters): number {
  let n = countMoreFilters(f);
  if (f.areas.length) n += 1;
  if (f.region) n += 1;
  if (f.beds.length || f.baths.length) n += 1;
  if (f.priceMin != null || f.priceMax != null) n += 1;
  return n;
}

export const compactPrice = (v: number, currency: string) => {
  if (v >= 1_000_000) return `${currency} ${(v / 1_000_000).toFixed(v % 1_000_000 === 0 ? 0 : 1)}M`;
  if (v >= 1_000) return `${currency} ${Math.round(v / 1_000)}K`;
  return `${currency} ${v}`;
};
