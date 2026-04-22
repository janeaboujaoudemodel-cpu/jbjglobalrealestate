/**
 * Static validation checks over the service SEO catalog.
 *
 * Flags:
 *  - Missing or empty title / description / canonicalPath
 *  - Duplicated title or description across slugs
 *  - canonicalPath that doesn't match `/services/<slug>`
 *  - Title or description outside SEO best-practice length bands
 *  - hreflang sets missing the required `x-default` entry, or missing any
 *    supported language locale
 */
import { SUPPORTED_LANGUAGES } from "@/translations";
import {
  computeServiceSeoEntries,
  type ServiceSeoEntry,
} from "@/seo/serviceSeoCatalog";

export type CheckSeverity = "error" | "warning";

export interface SeoCheck {
  id: string;
  severity: CheckSeverity;
  /** Slug(s) affected. Empty means "global" (e.g. duplicate set spanning many). */
  slugs: string[];
  message: string;
}

export interface SeoCheckReport {
  checks: SeoCheck[];
  errorCount: number;
  warningCount: number;
  /** Slugs with at least one error or warning. */
  affectedSlugs: Set<string>;
}

const TITLE_MIN = 30;
const TITLE_MAX = 65;
const DESC_MIN = 70;
const DESC_MAX = 160;

export function runSeoChecks(
  entries: ServiceSeoEntry[] = computeServiceSeoEntries(),
): SeoCheckReport {
  const checks: SeoCheck[] = [];
  const supportedCodes = SUPPORTED_LANGUAGES.map((l) => l.code);

  // --- Per-entry checks ---
  for (const e of entries) {
    const t = (e.title ?? "").trim();
    const d = (e.description ?? "").trim();
    const cp = (e.canonicalPath ?? "").trim();

    if (!t) {
      checks.push({ id: `missing-title:${e.slug}`, severity: "error", slugs: [e.slug], message: "Missing title." });
    } else {
      if (t.length < TITLE_MIN) checks.push({ id: `short-title:${e.slug}`, severity: "warning", slugs: [e.slug], message: `Title is ${t.length} chars (recommended ≥ ${TITLE_MIN}).` });
      if (t.length > TITLE_MAX) checks.push({ id: `long-title:${e.slug}`, severity: "warning", slugs: [e.slug], message: `Title is ${t.length} chars (recommended ≤ ${TITLE_MAX}).` });
    }

    if (!d) {
      checks.push({ id: `missing-desc:${e.slug}`, severity: "error", slugs: [e.slug], message: "Missing description." });
    } else {
      if (d.length < DESC_MIN) checks.push({ id: `short-desc:${e.slug}`, severity: "warning", slugs: [e.slug], message: `Description is ${d.length} chars (recommended ≥ ${DESC_MIN}).` });
      if (d.length > DESC_MAX) checks.push({ id: `long-desc:${e.slug}`, severity: "warning", slugs: [e.slug], message: `Description is ${d.length} chars (recommended ≤ ${DESC_MAX}).` });
    }

    if (!cp) {
      checks.push({ id: `missing-canonical:${e.slug}`, severity: "error", slugs: [e.slug], message: "Missing canonicalPath." });
    } else {
      const expected = `/services/${e.slug}`;
      if (cp !== expected) {
        checks.push({
          id: `canonical-mismatch:${e.slug}`,
          severity: "error",
          slugs: [e.slug],
          message: `canonicalPath "${cp}" does not match expected "${expected}".`,
        });
      }
      if (!cp.startsWith("/")) {
        checks.push({
          id: `canonical-not-absolute:${e.slug}`,
          severity: "error",
          slugs: [e.slug],
          message: `canonicalPath "${cp}" must start with "/".`,
        });
      }
    }

    // hreflang completeness
    const hreflangs = new Set(e.hreflangTargets.map((t) => t.hreflang));
    if (!hreflangs.has("x-default")) {
      checks.push({
        id: `missing-x-default:${e.slug}`,
        severity: "error",
        slugs: [e.slug],
        message: "hreflang set is missing required x-default entry.",
      });
    }
    const missingLocales = supportedCodes.filter((c) => !hreflangs.has(c));
    if (missingLocales.length > 0) {
      checks.push({
        id: `missing-hreflang:${e.slug}`,
        severity: "error",
        slugs: [e.slug],
        message: `hreflang set is missing locale(s): ${missingLocales.join(", ")}.`,
      });
    }

    // Every hreflang href should be the same canonical URL
    const distinctHrefs = new Set(e.hreflangTargets.map((t) => t.href));
    if (distinctHrefs.size > 1) {
      checks.push({
        id: `divergent-hreflang-href:${e.slug}`,
        severity: "warning",
        slugs: [e.slug],
        message: `hreflang targets resolve to ${distinctHrefs.size} distinct URLs (expected 1 since site is single-URL across languages).`,
      });
    }
  }

  // --- Cross-entry duplicate checks ---
  const byTitle = new Map<string, string[]>();
  const byDesc = new Map<string, string[]>();
  const byCanonical = new Map<string, string[]>();
  for (const e of entries) {
    const t = (e.title ?? "").trim().toLowerCase();
    const d = (e.description ?? "").trim().toLowerCase();
    const cp = (e.canonicalPath ?? "").trim().toLowerCase();
    if (t) byTitle.set(t, [...(byTitle.get(t) ?? []), e.slug]);
    if (d) byDesc.set(d, [...(byDesc.get(d) ?? []), e.slug]);
    if (cp) byCanonical.set(cp, [...(byCanonical.get(cp) ?? []), e.slug]);
  }

  for (const [, slugs] of byTitle) {
    if (slugs.length > 1) {
      checks.push({
        id: `duplicate-title:${slugs.join(",")}`,
        severity: "error",
        slugs,
        message: `Duplicate title shared by ${slugs.length} slugs: ${slugs.join(", ")}.`,
      });
    }
  }
  for (const [, slugs] of byDesc) {
    if (slugs.length > 1) {
      checks.push({
        id: `duplicate-desc:${slugs.join(",")}`,
        severity: "error",
        slugs,
        message: `Duplicate description shared by ${slugs.length} slugs: ${slugs.join(", ")}.`,
      });
    }
  }
  for (const [, slugs] of byCanonical) {
    if (slugs.length > 1) {
      checks.push({
        id: `duplicate-canonical:${slugs.join(",")}`,
        severity: "error",
        slugs,
        message: `Duplicate canonicalPath shared by ${slugs.length} slugs: ${slugs.join(", ")}.`,
      });
    }
  }

  const errorCount = checks.filter((c) => c.severity === "error").length;
  const warningCount = checks.filter((c) => c.severity === "warning").length;
  const affectedSlugs = new Set<string>();
  for (const c of checks) for (const s of c.slugs) affectedSlugs.add(s);

  return { checks, errorCount, warningCount, affectedSlugs };
}
