/**
 * Format a project's bedroom offering as a RANGE — never an enumerated list.
 *
 * LOCKED rule (mem://features/project-detail/provenance-and-updated-standard):
 *   When the owner enters `bedroom_types` (e.g. ["Studio","2","4"]) the intent
 *   is the RANGE from the smallest to the largest entry, not three discrete
 *   options. Render "Studio - 4 BR", never "Studio • 2BR • 4BR".
 *
 *   • ["Studio", "4"]                → "Studio - 4 BR"
 *   • ["1", "3"]                     → "1 - 3 BR"
 *   • ["Studio"]                     → "Studio"
 *   • ["2"]                          → "2 BR"
 *   • falls back to bedrooms_min/max when the array is empty.
 */
export interface BedroomSource {
  bedroom_types?: unknown;
  bedrooms_min?: number | null;
  bedrooms_max?: number | null;
  has_studio?: boolean | null;
}

function toNumeric(entry: unknown): number | "studio" | null {
  if (entry == null) return null;
  const s = String(entry).trim();
  if (!s) return null;
  if (/studio/i.test(s)) return "studio";
  const n = parseInt(s.replace(/[^\d-]/g, ""), 10);
  if (!Number.isFinite(n)) return null;
  return n === 0 ? "studio" : n;
}

function labelFor(v: number | "studio"): string {
  return v === "studio" ? "Studio" : `${v} BR`;
}

export function formatBedroomRange(project: BedroomSource): string | null {
  const raw = Array.isArray(project.bedroom_types) ? project.bedroom_types : [];
  const parsed = raw.map(toNumeric).filter((x): x is number | "studio" => x !== null);

  if (parsed.length > 0) {
    // studio counts as 0 for min/max comparison
    const numeric = parsed.map((v) => (v === "studio" ? 0 : v));
    const min = Math.min(...numeric);
    const max = Math.max(...numeric);
    if (min === max) return labelFor(min === 0 ? "studio" : min);
    const low = min === 0 ? "Studio" : `${min}`;
    return `${low} - ${max} BR`;
  }

  // Fallback to numeric columns
  const min = project.bedrooms_min;
  const max = project.bedrooms_max;
  if (min == null && !project.has_studio) return null;
  const lo = project.has_studio || min === 0 ? 0 : (min ?? 0);
  const hi = max ?? min ?? lo;
  if (lo === hi) return labelFor(lo === 0 ? "studio" : lo);
  const loLabel = lo === 0 ? "Studio" : `${lo}`;
  return `${loLabel} - ${hi} BR`;
}
