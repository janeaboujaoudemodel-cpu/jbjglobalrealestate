/**
 * White Logo Registry — LOCKED single wiring point.
 *
 * Any audited pure-white knockout stored on a developer row
 * (`logo_url_processed` pointing at `developer-logos/white-v1|v2/...`) is the
 * final artwork for that brand and MUST render on every surface: cards, search
 * bar, global search modal, comparison bar, project detail, developer detail,
 * area strips — everywhere.
 *
 * Many call sites historically passed the raw `developers.logo_url` straight
 * into <DeveloperLogo />. Instead of rewiring 60 files (and re-breaking on the
 * next new surface), this registry is consulted inside <DeveloperLogo /> by
 * developer name, so an updated logo propagates globally by construction.
 */
import { supabase } from "@/integrations/supabase/client";

const normalize = (value: unknown): string =>
  typeof value === "string" ? value.toLowerCase().replace(/[^a-z0-9]+/g, "") : "";

const registry = new Map<string, string>();
let primed: Promise<void> | null = null;

/** Percent-encoded storage paths (`white-v2%2Ffile.png`) must resolve too. */
export const decodeStoragePath = (url: string): string =>
  url.includes("%2F") || url.includes("%2f") ? url.replace(/%2F/gi, "/") : url;

export function getRegistryWhiteLogo(name: unknown): string | null {
  const key = normalize(name);
  if (!key) return null;
  const exact = registry.get(key);
  if (exact) return exact;
  // Surfaces label brands loosely ("Radiant Real Estate" vs the record
  // "Radiant Real Estate Development"), so fall back to a containment match.
  if (key.length < 6) return null;
  for (const [candidate, url] of registry) {
    if (candidate.startsWith(key) || key.startsWith(candidate)) return url;
  }
  return null;
}

export function primeWhiteLogoRegistry(): Promise<void> {
  if (primed) return primed;
  primed = (async () => {
    const { data } = await supabase
      .from("developers")
      .select("name, logo_url_processed")
      .not("logo_url_processed", "is", null)
      .limit(2000);
    for (const row of data ?? []) {
      const raw = row?.logo_url_processed;
      if (typeof raw !== "string") continue;
      const url = decodeStoragePath(raw);
      if (!/developer-logos\/white-v(?:1|2)\//i.test(url)) continue;
      const key = normalize(row?.name);
      if (key && !registry.has(key)) registry.set(key, url);
    }
  })().catch(() => {
    // A failed prime must never break logo rendering — callers fall back to
    // the src they already have.
    primed = null;
  });
  return primed;
}
