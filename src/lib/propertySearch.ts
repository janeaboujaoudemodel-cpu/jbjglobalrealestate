/**
 * PROPERTY SEARCH — single source of truth for the site-wide property filter.
 *
 * Design rules (approved plan):
 *   • Purpose (Buy / Rent / Sell) and project status (Off-plan / Ready / Resale /
 *     Distress / Nearing completion) are INDEPENDENT axes. "Off-plan" is a
 *     status, never a purpose.
 *   • Everything that can sensibly be multi-select IS multi-select.
 *   • Areas support INCLUDE and EXCLUDE lists; exclusions always win.
 *   • The URL is the source of truth so every filter is shareable.
 *
 * Used by: PropertySearchBar, MoreFiltersPanel, ResultsToolbar, /properties,
 * /rent, /resale, /distress, area + developer pages, portal inventory.
 * Project pages keep their own dedicated filters.
 */

import { getAreas, getRegions, COUNTRY_CURRENCY } from "@/data/geography";

/* ------------------------------------------------------------------ taxonomy */

export const PURPOSES = [
  { slug: "buy", label: "Buy" },
  { slug: "rent", label: "Rent" },
  { slug: "sell", label: "Sell" },
] as const;
export type Purpose = (typeof PURPOSES)[number]["slug"];

export const PROJECT_STATUSES = [
  { slug: "off-plan", label: "Off-plan" },
  { slug: "ready", label: "Ready" },
  { slug: "resale", label: "Resale" },
  { slug: "distress", label: "Distress deal" },
  { slug: "nearing-completion", label: "Nearing completion" },
] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number]["slug"];

const CURRENT_YEAR = new Date().getFullYear();
export const COMPLETION_YEARS = Array.from({ length: 8 }, (_, i) => String(CURRENT_YEAR + i));

export const PAYMENT_OPTIONS = [
  { slug: "any", label: "Any" },
  { slug: "payment-plan", label: "Payment plan" },
  { slug: "post-handover", label: "Post-handover plan" },
  { slug: "cash", label: "Cash only" },
] as const;
export type PaymentOption = (typeof PAYMENT_OPTIONS)[number]["slug"];

export const RENT_PERIODS = [
  { slug: "yearly", label: "Yearly" },
  { slug: "monthly", label: "Monthly" },
  { slug: "weekly", label: "Weekly" },
  { slug: "daily", label: "Daily" },
] as const;
export type RentPeriod = (typeof RENT_PERIODS)[number]["slug"];

/** Bayut-style two-column type grid, per category. */
export const CATEGORY_TYPES = {
  residential: [
    "Apartment",
    "Villa",
    "Townhouse",
    "Penthouse",
    "Villa Compound",
    "Hotel Apartment",
    "Duplex",
    "Land",
    "Floor",
    "Building",
  ],
  commercial: [
    "Office",
    "Shop",
    "Retail",
    "Warehouse",
    "Showroom",
    "Labour Camp",
    "Bulk Unit",
    "Commercial Land",
    "Commercial Floor",
    "Commercial Building",
  ],
} as const;
export type SearchCategory = keyof typeof CATEGORY_TYPES;

export const BEDS = ["Studio", "1", "2", "3", "4", "5", "6", "7+"] as const;
export const BATHS = ["1", "2", "3", "4", "5", "6+"] as const;

export const FURNISHINGS = [
  { slug: "any", label: "All" },
  { slug: "furnished", label: "Furnished" },
  { slug: "unfurnished", label: "Unfurnished" },
] as const;

export const SORT_OPTIONS = [
  { slug: "recommended", label: "Recommended" },
  { slug: "newest", label: "Newest" },
  { slug: "price-asc", label: "Lowest price" },
  { slug: "price-desc", label: "Highest price" },
  { slug: "size-desc", label: "Largest size" },
  { slug: "distress", label: "Distress first" },
  { slug: "handover", label: "Handover soonest" },
] as const;
export type SortOption = (typeof SORT_OPTIONS)[number]["slug"];

export const VIEW_MODES = ["list", "grid", "map"] as const;
export type ViewMode = (typeof VIEW_MODES)[number];

/* -------------------------------------------------------------- listing labels */

export type ListingLabelSlug =
  | "distress"
  | "hot"
  | "trending"
  | "featured"
  | "signature"
  | "vip"
  | "new-launch";

export interface ListingLabelDef {
  slug: ListingLabelSlug;
  label: string;
  /** Inline background (gradient or solid) — emerald always uses the pair. */
  background: string;
  color: string;
  /** Distress uses a premium animated shimmer. */
  animated?: boolean;
}

export const LISTING_LABELS: ListingLabelDef[] = [
  {
    slug: "distress",
    label: "Distress Deal",
    background: "linear-gradient(110deg,#3B0764 0%,#6D28D9 38%,#A855F7 62%,#6D28D9 100%)",
    color: "#FFFFFF",
    animated: true,
  },
  { slug: "hot", label: "Hot", background: "linear-gradient(135deg,#B91C1C 0%,#DC2626 100%)", color: "#FFFFFF" },
  { slug: "trending", label: "Trending", background: "linear-gradient(135deg,#C2410C 0%,#F97316 100%)", color: "#FFFFFF" },
  {
    slug: "featured",
    label: "Featured",
    background: "linear-gradient(135deg,#064E3B 0%,#042c1c 55%,#000 100%)",
    color: "#FFFFFF",
  },
  { slug: "signature", label: "Signature", background: "linear-gradient(135deg,#E6D3A3 0%,#B89555 100%)", color: "#1A1A1A" },
  { slug: "vip", label: "VIP", background: "linear-gradient(135deg,#1A1A1A 0%,#000 100%)", color: "#E6D3A3" },
  {
    slug: "new-launch",
    label: "New Launch",
    background: "linear-gradient(135deg,#064E3B 0%,#042c1c 55%,#000 100%)",
    color: "#FFFFFF",
  },
];

export const labelDef = (slug: string) => LISTING_LABELS.find((l) => l.slug === slug) ?? null;

/* -------------------------------------------------------------------- model */

export interface PropertySearch {
  purpose: Purpose;
  statuses: ProjectStatus[];
  completionTo: string | null;
  payment: PaymentOption;
  category: SearchCategory;
  types: string[];
  beds: string[];
  baths: string[];
  priceMin: number | null;
  priceMax: number | null;
  rentPeriod: RentPeriod;
  sizeMin: number | null;
  sizeMax: number | null;
  country: string;
  region: string | null;
  /** Area slugs the user wants INCLUDED. Empty = the whole region/country. */
  areasInclude: string[];
  /** Area slugs the user wants EXCLUDED. Always wins over the include list. */
  areasExclude: string[];
  furnishing: "any" | "furnished" | "unfurnished";
  developer: string | null;
  labels: string[];
  sort: SortOption;
  view: ViewMode;
  q: string;
}

export const EMPTY_SEARCH: PropertySearch = {
  purpose: "buy",
  statuses: [],
  completionTo: null,
  payment: "any",
  category: "residential",
  types: [],
  beds: [],
  baths: [],
  priceMin: null,
  priceMax: null,
  rentPeriod: "yearly",
  sizeMin: null,
  sizeMax: null,
  country: "uae",
  region: null,
  areasInclude: [],
  areasExclude: [],
  furnishing: "any",
  developer: null,
  labels: [],
  sort: "recommended",
  view: "grid",
  q: "",
};

export const currencyFor = (country?: string | null) => COUNTRY_CURRENCY[country ?? ""] ?? "AED";

/* -------------------------------------------------------------------- codec */

const list = (v: string | null): string[] =>
  (v ?? "").split(",").map((s) => s.trim()).filter(Boolean);

const num = (v: string | null): number | null => {
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

/** Canonical serialisation. Emits legacy keys too so existing result engines
 *  (FilterShortcutBar / useProjectFilters) apply the same selection. */
export function searchToParams(f: PropertySearch): URLSearchParams {
  const p = new URLSearchParams();
  if (f.q.trim()) p.set("q", f.q.trim());

  p.set("purpose", f.purpose);
  // legacy compatibility
  if (f.purpose === "buy" || f.purpose === "rent") p.set("transaction", f.purpose);
  p.set("intent", f.purpose);

  if (f.statuses.length) {
    p.set("status", f.statuses.join(","));
    if (f.statuses.includes("off-plan")) p.set("saleStatus", "off-plan");
    const legacy: string[] = [];
    if (f.statuses.includes("ready")) legacy.push("Completed");
    if (f.statuses.includes("off-plan") || f.statuses.includes("nearing-completion"))
      legacy.push("Under Construction");
    if (legacy.length) p.set("constructionStatuses", legacy.join(","));
  }
  if (f.completionTo) p.set("completionTo", f.completionTo);
  if (f.payment !== "any") p.set("payment", f.payment);

  p.set("category", f.category);
  if (f.types.length) {
    p.set("types", f.types.join(","));
    p.set("propertyTypes", f.types.join(","));
  }
  if (f.beds.length) {
    p.set("beds", f.beds.join(","));
    p.set("bedrooms", f.beds.join(","));
  }
  if (f.baths.length) p.set("baths", f.baths.join(","));

  if (f.priceMin != null) p.set("priceMin", String(f.priceMin));
  if (f.priceMax != null) p.set("priceMax", String(f.priceMax));
  if (f.purpose === "rent" && f.rentPeriod !== "yearly") p.set("period", f.rentPeriod);
  if (f.sizeMin != null) p.set("sizeMin", String(f.sizeMin));
  if (f.sizeMax != null) p.set("sizeMax", String(f.sizeMax));

  if (f.country) p.set("country", f.country);
  if (f.region) {
    p.set("region", f.region);
    const regionName = getRegions(f.country).find((r) => r.slug === f.region)?.name;
    if (regionName) p.set("emirates", regionName);
  }
  if (f.areasInclude.length) {
    p.set("areaSlugs", f.areasInclude.join(","));
    const all = getAreas(f.country, f.region);
    const names = f.areasInclude
      .map((s) => all.find((x) => x.slug === s)?.name)
      .filter(Boolean) as string[];
    // legacy engines read display names from ?areas=
    if (names.length) p.set("areas", names.join(","));
  }
  if (f.areasExclude.length) p.set("excludeAreas", f.areasExclude.join(","));

  if (f.furnishing !== "any") p.set("furnishing", f.furnishing);
  if (f.developer) p.set("developer", f.developer);
  if (f.labels.length) p.set("labels", f.labels.join(","));
  if (f.sort !== "recommended") p.set("sort", f.sort);
  if (f.view !== "grid") p.set("view", f.view);
  return p;
}

export function paramsToSearch(p: URLSearchParams): PropertySearch {
  const purposeRaw = p.get("purpose") ?? p.get("intent") ?? p.get("transaction");
  const purpose: Purpose =
    purposeRaw === "rent" || purposeRaw === "sell" ? purposeRaw : "buy";

  const statuses = list(p.get("status")).filter((s) =>
    PROJECT_STATUSES.some((x) => x.slug === s),
  ) as ProjectStatus[];
  // legacy ?saleStatus=off-plan
  if (!statuses.length && p.get("saleStatus") === "off-plan") statuses.push("off-plan");
  // legacy ?intent=off-plan (old model where off-plan was a purpose)
  if (!statuses.length && purposeRaw === "off-plan") statuses.push("off-plan");

  const category = (p.get("category") === "commercial" ? "commercial" : "residential") as SearchCategory;
  const furnishRaw = p.get("furnishing");

  return {
    ...EMPTY_SEARCH,
    q: p.get("q") ?? p.get("keyword") ?? p.get("search") ?? "",
    purpose,
    statuses,
    completionTo: p.get("completionTo"),
    payment: (PAYMENT_OPTIONS.some((o) => o.slug === p.get("payment"))
      ? p.get("payment")
      : "any") as PaymentOption,
    category,
    types: list(p.get("types") ?? p.get("propertyTypes")),
    beds: list(p.get("beds") ?? p.get("bedrooms")),
    baths: list(p.get("baths")),
    priceMin: num(p.get("priceMin")),
    priceMax: num(p.get("priceMax")),
    rentPeriod: (RENT_PERIODS.some((o) => o.slug === p.get("period"))
      ? p.get("period")
      : "yearly") as RentPeriod,
    sizeMin: num(p.get("sizeMin")),
    sizeMax: num(p.get("sizeMax")),
    country: p.get("country") ?? EMPTY_SEARCH.country,
    region: p.get("region"),
    areasInclude: list(p.get("areaSlugs")),
    areasExclude: list(p.get("excludeAreas")),
    furnishing:
      furnishRaw === "furnished" || furnishRaw === "unfurnished" ? furnishRaw : "any",
    developer: p.get("developer"),
    labels: list(p.get("labels")),
    sort: (SORT_OPTIONS.some((o) => o.slug === p.get("sort")) ? p.get("sort") : "recommended") as SortOption,
    view: (VIEW_MODES as readonly string[]).includes(p.get("view") ?? "")
      ? (p.get("view") as ViewMode)
      : "grid",
  };
}

/** Count of "extra" filters — drives the `More filters (n)` badge. */
export function countExtraFilters(f: PropertySearch): number {
  let n = 0;
  if (f.sizeMin != null || f.sizeMax != null) n += 1;
  if (f.completionTo) n += 1;
  if (f.payment !== "any") n += 1;
  if (f.furnishing !== "any") n += 1;
  if (f.developer) n += 1;
  if (f.labels.length) n += 1;
  if (f.baths.length) n += 1;
  if (f.areasExclude.length) n += 1;
  return n;
}

export function activeFilterCount(f: PropertySearch): number {
  let n = countExtraFilters(f);
  if (f.areasInclude.length) n += 1;
  if (f.region) n += 1;
  if (f.beds.length) n += 1;
  if (f.statuses.length) n += 1;
  if (f.types.length) n += 1;
  if (f.priceMin != null || f.priceMax != null) n += 1;
  return n;
}

export const compactPrice = (v: number, currency: string) => {
  if (v >= 1_000_000) return `${currency} ${(v / 1_000_000).toFixed(v % 1_000_000 === 0 ? 0 : 1)}M`;
  if (v >= 1_000) return `${currency} ${Math.round(v / 1_000)}K`;
  return `${currency} ${v}`;
};

/** Human summary of what the user selected — shown after Apply. */
export function describeSearch(f: PropertySearch): string {
  const bits: string[] = [];
  bits.push(f.purpose === "rent" ? "For rent" : f.purpose === "sell" ? "Sell" : "For sale");
  if (f.statuses.length)
    bits.push(f.statuses.map((s) => PROJECT_STATUSES.find((x) => x.slug === s)?.label ?? s).join(" / "));
  if (f.types.length) bits.push(f.types.join(" / "));
  if (f.beds.length) bits.push(`${f.beds.join("/")} bed`);
  const all = getAreas(f.country, f.region);
  const name = (s: string) => all.find((a) => a.slug === s)?.name ?? s;
  if (f.areasInclude.length) bits.push(`in ${f.areasInclude.map(name).join(", ")}`);
  else if (f.region) bits.push(`in ${getRegions(f.country).find((r) => r.slug === f.region)?.name ?? f.region}`);
  if (f.areasExclude.length) bits.push(`except ${f.areasExclude.map(name).join(", ")}`);
  const cur = currencyFor(f.country);
  if (f.priceMin != null || f.priceMax != null)
    bits.push(
      `${f.priceMin != null ? compactPrice(f.priceMin, cur) : "any"} – ${
        f.priceMax != null ? compactPrice(f.priceMax, cur) : "any"
      }`,
    );
  if (f.completionTo) bits.push(`handover by ${f.completionTo}`);
  if (f.payment !== "any")
    bits.push(PAYMENT_OPTIONS.find((o) => o.slug === f.payment)?.label ?? f.payment);
  return bits.join(" · ");
}
