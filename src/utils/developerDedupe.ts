/**
 * Canonical developer identity (LOCKED).
 *
 * The directory, homepage rails and project surfaces must never show the same
 * brand twice because the database holds more than one record for it. This
 * merges records that represent the SAME company (normalized legal name, or a
 * shared official website domain) into one canonical card, keeping the richest
 * verified record and the COMBINED project count. No project data is deleted —
 * the merge happens at the presentation layer, so every linked project still
 * resolves through its own developer id.
 */

export interface DedupeInput {
  id: string;
  name: string;
  slug?: string | null;
  rank?: number | null;
  founded_year?: number | null;
  description?: string | null;
}

export interface DedupedDeveloper<T extends DedupeInput> {
  developer: T;
  mergedIds: string[];
}

const LEGAL_SUFFIX = /\b(l\.?\s?l\.?\s?c\.?|pjsc|psc|fze|fzco|llp|ltd|limited|holding|holdings|group|co|company)\b/g;

export const normalizeDeveloperKey = (value?: string | null) =>
  (value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s.]/g, " ")
    .replace(LEGAL_SUFFIX, " ")
    .replace(/\b(real\s?estate|development|developments|developer|developers|properties|property|realty)\b/g, " ")
    .replace(/[^a-z0-9]+/g, "");

/**
 * Verified same-company aliases (LOCKED). Only add a pair here after proving
 * both records are the same registered brand (shared official domain / logo).
 */
const CANONICAL_ALIASES: Record<string, string> = {
  // AG Ark RE Development (agproperty.ae) == AG Properties L.L.C — same brand,
  // same official domain and same official mark, two legacy records.
  agark: "ag",
  agarkre: "ag",
  agarkredevelopment: "ag",
  aagproperties: "ag",
  aag: "ag",
};


export const normalizeDomain = (value?: unknown) => {
  if (typeof value !== "string" || !value.trim()) return "";
  try {
    const url = value.includes("://") ? value : `https://${value}`;
    return new URL(url).hostname.replace(/^www\./i, "").toLowerCase();
  } catch {
    return "";
  }
};

const score = <T extends DedupeInput>(dev: T, projectCount: number) => {
  const rec = dev as Record<string, unknown>;
  let value = projectCount * 100;
  if (rec.logo_url || rec.logo_url_processed) value += 60;
  if (rec.feature_image_url) value += 50;
  if (dev.founded_year) value += 15;
  if (typeof dev.description === "string" && dev.description.length > 60) value += 10;
  if (normalizeDomain(rec.website_url)) value += 10;
  if (dev.rank && dev.rank > 0) value += Math.max(0, 20 - dev.rank);
  return value;
};

/**
 * Merge duplicate developer records. Returns one entry per real company with
 * the best record and every merged record id (so callers can sum stats).
 */
export function dedupeDevelopers<T extends DedupeInput>(
  developers: T[],
  getProjectCount: (dev: T) => number = () => 0,
): DedupedDeveloper<T>[] {
  const groups = new Map<string, T[]>();
  const domainToKey = new Map<string, string>();

  for (const dev of developers) {
    const baseKey = normalizeDeveloperKey(dev.name) || (dev.slug || dev.id);
    const nameKey = CANONICAL_ALIASES[baseKey] || baseKey;
    const domain = normalizeDomain((dev as Record<string, unknown>).website_url);
    let key = nameKey;
    if (domain) {
      const existing = domainToKey.get(domain);
      if (existing) key = existing;
      else domainToKey.set(domain, key);
    }
    const bucket = groups.get(key);
    if (bucket) bucket.push(dev);
    else groups.set(key, [dev]);
  }

  return [...groups.values()].map((bucket) => {
    const sorted = [...bucket].sort((a, b) => score(b, getProjectCount(b)) - score(a, getProjectCount(a)));
    return { developer: sorted[0], mergedIds: bucket.map((d) => d.id) };
  });
}
