/**
 * areaResolver — one place that turns whatever a visitor typed into a real
 * geography area, and remembers what it learned.
 *
 * Resolution order:
 *   1. exact name / slug match
 *   2. static alias table (well-known nicknames: "JVC", "Marina", "DIFC" …)
 *   3. learned aliases (confirmed by real visitors, stored in the backend)
 *   4. fuzzy token match  → returns a SUGGESTION that must be confirmed
 *      ("Dubai Square Marina" → "Dubai Marina — is this what you meant?")
 *
 * When the visitor confirms a suggestion we call `learn_area_alias` so the next
 * visitor who types the same phrase is routed instantly, without a question.
 */

import { GEO_COUNTRIES, type GeoCountry } from "@/data/geography";
import { supabase } from "@/integrations/supabase/client";

export interface ResolvedArea {
  slug: string;
  name: string;
  countrySlug: string;
  regionSlug: string | null;
  /** How we got there. `fuzzy` must be confirmed by the visitor first. */
  via: "exact" | "alias" | "learned" | "fuzzy";
  /** 0..1 — only meaningful for fuzzy matches. */
  score?: number;
}

interface Entry {
  slug: string;
  name: string;
  countrySlug: string;
  regionSlug: string | null;
  isRegion: boolean;
}

const flatten = (): Entry[] => {
  const out: Entry[] = [];
  for (const c of GEO_COUNTRIES as GeoCountry[]) {
    for (const area of c.areas ?? [])
      out.push({ ...area, countrySlug: c.slug, regionSlug: null, isRegion: false });
    for (const r of c.regions ?? []) {
      out.push({ slug: r.slug, name: r.name, countrySlug: c.slug, regionSlug: r.slug, isRegion: true });
      for (const area of r.areas)
        out.push({ ...area, countrySlug: c.slug, regionSlug: r.slug, isRegion: false });
    }
  }
  return out;
};

export const AREA_ENTRIES: Entry[] = flatten();

export const norm = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

/** Noise words that never help identify a place. */
const STOP = new Set([
  "the", "in", "at", "near", "area", "district", "city", "community",
  "property", "properties", "apartment", "apartments", "villa", "villas",
  "for", "sale", "rent", "buy", "bedroom", "bedrooms", "bed", "br", "studio",
  "square", "sqaure", "squre", "tower", "towers", "residence", "residences",
]);

/** Hand-curated nicknames — instant, no confirmation needed. */
export const STATIC_ALIASES: Record<string, string> = {
  jvc: "jumeirah-village-circle",
  jvt: "jumeirah-village-triangle",
  jlt: "jumeirah-lake-towers",
  jbr: "jumeirah-beach-residence",
  difc: "difc",
  marina: "dubai-marina",
  "the marina": "dubai-marina",
  "marina dubai": "dubai-marina",
  downtown: "downtown-dubai",
  "the palm": "palm-jumeirah",
  palm: "palm-jumeirah",
  "business bay dubai": "business-bay",
  "creek harbour": "dubai-creek-harbour",
  "dubai hills": "dubai-hills-estate",
  mbr: "mohammed-bin-rashid-city",
  "mbr city": "mohammed-bin-rashid-city",
  "sports city": "dubai-sports-city",
  "silicon oasis": "dubai-silicon-oasis",
  "al marjan": "al-marjan-island",
  saadiyat: "saadiyat-island",
  yas: "yas-island",
  "reem island": "al-reem-island",
};

const byName = new Map(AREA_ENTRIES.map((e) => [norm(e.name), e]));
const bySlug = new Map(AREA_ENTRIES.map((e) => [e.slug, e]));

const toResolved = (e: Entry, via: ResolvedArea["via"], score?: number): ResolvedArea => ({
  slug: e.slug,
  name: e.name,
  countrySlug: e.countrySlug,
  regionSlug: e.regionSlug,
  via,
  score,
});

/** Exact area/region lookup by display name or slug. */
export function findAreaExact(value: string): ResolvedArea | null {
  const n = norm(value);
  if (!n) return null;
  const direct = byName.get(n) ?? bySlug.get(n.replace(/\s+/g, "-"));
  if (direct) return toResolved(direct, "exact");
  const aliased = STATIC_ALIASES[n];
  if (aliased && bySlug.has(aliased)) return toResolved(bySlug.get(aliased)!, "alias");
  return null;
}

/* ------------------------------------------------------------ learned cache */

let learnedCache: Map<string, { slug: string; name: string }> | null = null;
let learnedPromise: Promise<void> | null = null;

async function loadLearned(): Promise<void> {
  if (learnedCache) return;
  if (!learnedPromise) {
    learnedPromise = (async () => {
      try {
        const { data } = await supabase
          .from("search_area_aliases" as never)
          .select("alias_norm,area_slug,area_name")
          .limit(2000);
        learnedCache = new Map(
          ((data ?? []) as { alias_norm: string; area_slug: string; area_name: string }[]).map((r) => [
            r.alias_norm,
            { slug: r.area_slug, name: r.area_name },
          ]),
        );
      } catch {
        learnedCache = new Map();
      }
    })();
  }
  await learnedPromise;
}

/* ------------------------------------------------------------------- fuzzy */

/** Token-overlap + substring score between the typed phrase and an area name. */
function score(queryTokens: string[], name: string): number {
  const nameTokens = norm(name).split(" ").filter(Boolean);
  if (!nameTokens.length || !queryTokens.length) return 0;
  const hits = nameTokens.filter((t) => queryTokens.includes(t)).length;
  let s = hits / nameTokens.length;
  // Every meaningful area token must be present for a real suggestion.
  if (hits === 0) return 0;
  // Reward when the query mentions no other area-ish word beyond noise.
  const extra = queryTokens.filter((t) => !nameTokens.includes(t) && !STOP.has(t)).length;
  s -= extra * 0.12;
  return Math.max(0, Math.min(1, s));
}

/**
 * Best-effort resolution. Returns `via: "fuzzy"` when the caller must ask the
 * visitor to confirm ("we couldn't find X, did you mean Y?").
 */
export async function resolveArea(raw: string): Promise<ResolvedArea | null> {
  const value = (raw ?? "").trim();
  if (!value) return null;

  const exact = findAreaExact(value);
  if (exact) return exact;

  await loadLearned();
  const learned = learnedCache?.get(norm(value));
  if (learned && bySlug.has(learned.slug)) return toResolved(bySlug.get(learned.slug)!, "learned");

  // Longest exact area name contained in the sentence wins ("… in Dubai Marina").
  const n = norm(value);
  const contained = [...AREA_ENTRIES]
    .filter((e) => !e.isRegion)
    .sort((a, b) => b.name.length - a.name.length)
    .find((e) => n.includes(norm(e.name)));
  if (contained) return toResolved(contained, "exact");

  const tokens = n.split(" ").filter((t) => t && !STOP.has(t));
  if (!tokens.length) return null;

  let best: { e: Entry; s: number } | null = null;
  for (const e of AREA_ENTRIES) {
    const s = score(tokens, e.name);
    if (s > 0 && (!best || s > best.s || (s === best.s && !e.isRegion && best.e.isRegion))) {
      best = { e, s };
    }
  }
  if (best && best.s >= 0.5) return toResolved(best.e, "fuzzy", best.s);
  return null;
}

/** Records a confirmed alias so the next visitor is routed instantly. */
export async function learnAreaAlias(alias: string, area: ResolvedArea): Promise<void> {
  const key = norm(alias);
  if (!key) return;
  learnedCache?.set(key, { slug: area.slug, name: area.name });
  try {
    await supabase.rpc("learn_area_alias" as never, {
      _alias: alias,
      _area_slug: area.slug,
      _area_name: area.name,
      _country_slug: area.countrySlug,
      _region_slug: area.regionSlug,
    } as never);
  } catch (err) {
    console.warn("[areaResolver] could not store learned alias", err);
  }
}

/** Canonical results URL for an area, with country + region pinned. */
export function areaSearchParams(
  area: ResolvedArea,
  extra?: { purpose?: string; beds?: string; q?: string },
): URLSearchParams {
  const p = new URLSearchParams();
  p.set("purpose", extra?.purpose ?? "buy");
  p.set("intent", extra?.purpose ?? "buy");
  if (extra?.purpose === "buy" || extra?.purpose === "rent") p.set("transaction", extra.purpose);
  p.set("country", area.countrySlug);
  const isRegionOnly = !!area.regionSlug && area.regionSlug === area.slug;
  if (area.regionSlug) p.set("region", area.regionSlug);
  if (isRegionOnly) {
    // A region (emirate / governorate) selection — no leaf area filter.
    p.set("emirates", area.name);
  } else {
    p.set("areaSlugs", area.slug);
    p.set("areas", area.name);
  }

  if (extra?.beds) {
    p.set("beds", extra.beds);
    p.set("bedrooms", extra.beds);
  }
  if (extra?.q) p.set("q", extra.q);
  return p;
}
