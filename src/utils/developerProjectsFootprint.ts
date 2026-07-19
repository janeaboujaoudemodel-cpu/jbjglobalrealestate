/**
 * Turn the flat Excel-imported "<country>_projects_areas" fields into a
 * structured Country → Region/Emirate → Areas hierarchy. Owners can then
 * see and edit projects footprint per country professionally instead of a
 * comma-blob single input like "Dubai, JVC, Palm, DIP, Emirates Hills …".
 *
 * We recognise these Excel keys today:
 *   - dubai_projects_areas          → country = UAE (all UAE areas live here)
 *   - united_kingdom_projects_areas → country = UK
 *   - pakistan_projects_areas       → country = Pakistan
 *   - <other>_projects_areas        → treated as its own country bucket
 *
 * For UAE the raw list is scanned for Emirate keywords (Dubai, Abu Dhabi,
 * Sharjah, Ajman, RAK, UAQ, Fujairah) so each area is bucketed under the
 * right Emirate. Anything that cannot be matched is placed under
 * "Dubai" by default (the historical Excel column name) with a "review"
 * hint so the owner can reclassify.
 */

import { fieldToList } from "@/utils/developerExcelFields";

export const UAE_EMIRATES = [
  "Dubai",
  "Abu Dhabi",
  "Sharjah",
  "Ajman",
  "Ras Al Khaimah",
  "Umm Al Quwain",
  "Fujairah",
] as const;

const EMIRATE_ALIASES: Record<string, (typeof UAE_EMIRATES)[number]> = {
  dubai: "Dubai",
  "abu dhabi": "Abu Dhabi",
  abudhabi: "Abu Dhabi",
  auh: "Abu Dhabi",
  sharjah: "Sharjah",
  shj: "Sharjah",
  ajman: "Ajman",
  "ras al khaimah": "Ras Al Khaimah",
  rak: "Ras Al Khaimah",
  "umm al quwain": "Umm Al Quwain",
  uaq: "Umm Al Quwain",
  fujairah: "Fujairah",
  fuj: "Fujairah",
};

const AREA_TO_EMIRATE: Record<string, (typeof UAE_EMIRATES)[number]> = {
  // Dubai (samples — the fuzzy matcher below will still put unknown areas here)
  jvc: "Dubai",
  jvt: "Dubai",
  jlt: "Dubai",
  "jumeirah village circle": "Dubai",
  "jumeirah village triangle": "Dubai",
  "jumeirah lake towers": "Dubai",
  "business bay": "Dubai",
  "downtown dubai": "Dubai",
  downtown: "Dubai",
  "dubai marina": "Dubai",
  "palm jumeirah": "Dubai",
  "dubai islands": "Dubai",
  "dubai hills": "Dubai",
  "dubai south": "Dubai",
  "dubai creek": "Dubai",
  "dubai land": "Dubai",
  dubailand: "Dubai",
  "arabian ranches": "Dubai",
  "emirates hills": "Dubai",
  "meydan": "Dubai",
  "mohammed bin rashid city": "Dubai",
  mbr: "Dubai",
  "damac hills": "Dubai",
  "damac lagoons": "Dubai",
  "dubai investment park": "Dubai",
  dip: "Dubai",
  "al furjan": "Dubai",
  jbr: "Dubai",
  "jumeirah beach residence": "Dubai",
  motor: "Dubai",
  "motor city": "Dubai",
  jgv: "Dubai",
  // Abu Dhabi
  "saadiyat island": "Abu Dhabi",
  "yas island": "Abu Dhabi",
  "al reem": "Abu Dhabi",
  "al reem island": "Abu Dhabi",
  "al maryah": "Abu Dhabi",
  "al raha": "Abu Dhabi",
  ghantoot: "Abu Dhabi",
  // Sharjah
  aljada: "Sharjah",
  "al zahia": "Sharjah",
  maryam: "Sharjah",
  "maryam island": "Sharjah",
  tilal: "Sharjah",
  // RAK / Ajman / etc.
  "al marjan": "Ras Al Khaimah",
  "al hamra": "Ras Al Khaimah",
  hayat: "Ajman",
  "emirates city": "Ajman",
  "al zorah": "Ajman",
};

export type FootprintBucket = {
  region: string;
  areas: string[];
  needsReview?: boolean;
};

export type FootprintCountry = {
  country: string;
  buckets: FootprintBucket[];
  totalAreas: number;
};

const PROJECTS_AREAS_KEY_RE = /^(.+?)_projects?_areas?$/i;
const KEY_TO_COUNTRY: Record<string, string> = {
  dubai: "United Arab Emirates",
  uae: "United Arab Emirates",
  united_arab_emirates: "United Arab Emirates",
  united_kingdom: "United Kingdom",
  uk: "United Kingdom",
  pakistan: "Pakistan",
  india: "India",
  saudi_arabia: "Saudi Arabia",
  ksa: "Saudi Arabia",
  qatar: "Qatar",
  oman: "Oman",
  bahrain: "Bahrain",
  kuwait: "Kuwait",
  egypt: "Egypt",
  turkey: "Türkiye",
};

const humanizeCountry = (slug: string) =>
  KEY_TO_COUNTRY[slug.toLowerCase()] ||
  slug
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");

const matchEmirate = (area: string): (typeof UAE_EMIRATES)[number] | null => {
  const lc = area.toLowerCase().trim();
  if (!lc) return null;
  // Direct alias
  if (EMIRATE_ALIASES[lc]) return EMIRATE_ALIASES[lc];
  // Explicit token match ("dubai marina" starts with "dubai")
  for (const [alias, emirate] of Object.entries(EMIRATE_ALIASES)) {
    if (lc.includes(alias)) return emirate;
  }
  // Known-area dictionary
  for (const [key, emirate] of Object.entries(AREA_TO_EMIRATE)) {
    if (lc === key || lc.includes(key)) return emirate;
  }
  return null;
};

/**
 * Detect all projects-areas keys inside a `custom_fields` record and return
 * their structured breakdown.
 */
export const buildFootprintFromCustomFields = (
  customFields: Record<string, unknown> | null | undefined,
): FootprintCountry[] => {
  if (!customFields) return [];
  const entries = Object.entries(customFields);
  const countries = new Map<string, FootprintCountry>();

  for (const [key, value] of entries) {
    const match = PROJECTS_AREAS_KEY_RE.exec(key);
    if (!match) continue;
    const slug = match[1];
    const country = humanizeCountry(slug);
    const areas = fieldToList(value)
      .map((s) => s.replace(/\s{2,}/g, " ").trim())
      .filter(Boolean);
    if (!areas.length) continue;

    let entry = countries.get(country);
    if (!entry) {
      entry = { country, buckets: [], totalAreas: 0 };
      countries.set(country, entry);
    }

    if (country === "United Arab Emirates") {
      // Split UAE areas across the 7 Emirates
      const grouped = new Map<string, string[]>();
      const unmatched: string[] = [];
      for (const area of areas) {
        const emirate = matchEmirate(area);
        if (emirate) {
          const list = grouped.get(emirate) ?? [];
          // De-dupe and skip if the area value is literally just the emirate name
          if (area.toLowerCase() !== emirate.toLowerCase() && !list.includes(area)) list.push(area);
          grouped.set(emirate, list);
        } else {
          unmatched.push(area);
        }
      }
      // Preserve the canonical Emirate order
      for (const emirate of UAE_EMIRATES) {
        const list = grouped.get(emirate);
        if (list && list.length) entry.buckets.push({ region: emirate, areas: list });
      }
      if (unmatched.length) {
        entry.buckets.push({ region: "Unassigned (needs review)", areas: unmatched, needsReview: true });
      }
    } else {
      // Non-UAE country → single bucket
      entry.buckets.push({ region: country, areas });
    }

    entry.totalAreas += areas.length;
  }

  return Array.from(countries.values()).sort((a, b) => b.totalAreas - a.totalAreas);
};

export const PROJECTS_AREAS_KEY_REGEX = PROJECTS_AREAS_KEY_RE;
