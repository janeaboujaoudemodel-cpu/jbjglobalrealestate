// GLOBAL RULE — Scraping allowed ONLY from developer-direct off-plan sources +
// Provident (off-plan partner feed). Secondary listing portals are permanently
// forbidden. Enforced at every edge-function scraper.
//
// Memory: mem://constraints/no-secondary-source-scraping
//
// If you add a new scraper, import { assertAllowedSource } and call it before
// any outbound fetch. Do NOT loosen this list without product approval.

const FORBIDDEN_HOST_FRAGMENTS = [
  "bayut.",
  "dubizzle.",
  "propertyfinder.",
  "justproperty.",
  "justrent",
  "houza.",
  "luxhabitat.",
  "driven",
  "haus-haus",
  "betterhomes",
  "allsoppandallsopp",
  "fam-properties",
  "espace.",
  "metropolitan-properties",
  "savills",
  "knightfrank",
  "engelvoelkers",
];

// Always-allowed primary sources (developer-direct + our partner).
// Match by host suffix or substring.
const ALLOWED_HOST_FRAGMENTS = [
  "provident",          // partner off-plan feed
  "emaar.com",
  "damacproperties.com",
  "damac.com",
  "meraas.com",
  "nakheel.com",
  "sobharealty.com",
  "majidalfuttaim.com",
  "aldar.com",
  "danubeproperties.ae",
  "dubaiproperties.ae",
  "azizidevelopments.com",
  "ellingtongroup.com",
  "binghattidevelopers.com",
  "tigerproperties.com",
  "selectgroup.ae",
  "mag.ae",
  "omniyat.com",
  "arada.com",
  "shapoorji.ae",
];

export type AllowDecision =
  | { ok: true; reason: "primary_partner" | "developer_official" }
  | { ok: false; reason: "secondary_source_blocked"; host: string };

export function classifySource(rawUrl: string): AllowDecision {
  let host = "";
  try {
    host = new URL(rawUrl).hostname.toLowerCase();
  } catch {
    return { ok: false, reason: "secondary_source_blocked", host: rawUrl };
  }

  for (const bad of FORBIDDEN_HOST_FRAGMENTS) {
    if (host.includes(bad)) {
      return { ok: false, reason: "secondary_source_blocked", host };
    }
  }
  for (const good of ALLOWED_HOST_FRAGMENTS) {
    if (host.includes(good)) {
      return {
        ok: true,
        reason: good.includes("provident") ? "primary_partner" : "developer_official",
      };
    }
  }
  // Unknown host — treat as developer-direct ONLY if it doesn't smell like a
  // portal. We require explicit allow for safety: block by default.
  return { ok: false, reason: "secondary_source_blocked", host };
}

export function assertAllowedSource(url: string): void {
  const r = classifySource(url);
  if (!r.ok) {
    throw new Response(
      JSON.stringify({
        error: "secondary_source_blocked",
        message:
          "Scraping is only permitted from developer-direct off-plan sources and Provident. Secondary listing portals are forbidden.",
        host: r.host,
      }),
      { status: 403, headers: { "Content-Type": "application/json" } },
    );
  }
}
