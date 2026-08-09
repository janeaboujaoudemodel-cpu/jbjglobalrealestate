/**
 * Developer Logo Resolver — LOCKED SOURCE OF TRUTH.
 *
 * Hard rules (enforced globally — do NOT change without Founder authorization):
 *   1. Developer logos MUST come from `developers.logo_url` only.
 *   2. `feature_image_url`, `cover_image_url`, project photos, screenshots,
 *      WhatsApp / convert.io files, or any other photo may NEVER be used
 *      as a developer logo — not even as a fallback.
 *   3. Missing database logos should be resolved from the developer website
 *      where available; UI must never render a building icon or empty logo box.
 *   4. `logo_url_processed` is an internal background-removed mirror; it is
 *      no longer preferred over the canonical `logo_url`. Canonical wins.
 *
 * Supabase joins can return either an array (when expanded) or an object,
 * so this resolver handles both safely.
 */
import { getVerifiedWhiteLogo } from "@/utils/verifiedWhiteLogos";

const FORBIDDEN_LOGO_PATTERNS: RegExp[] = [
  /screenshot/i,
  /whatsapp/i,
  /convert\.io/i,
  /\/frame\+?\d/i,
  /1080x1080/i,
  /\/images?\.(png|jpe?g|webp)(\?|$)/i,
  /logo-white-1/i,
  /logodix\.com/i,
  /\/projects\/\d+\/images\//i, // project photo paths
  /snapedit/i,
  /google\.com\/s2\/favicons/i, // generic favicon/globe/phone icons are not developer logos
  /favicon/i,
  /_feature_[a-f0-9]{6,}\.(jpg|jpeg|png|webp)/i, // mis-tagged project feature images
  /\/x\/16x16\//i, // favicon-size CDN paths only; larger CDN logo plates are valid developer logos
  /habtoor_polo/i,
  /tilal_/i,
  /exterior/i,
  /interior/i,
  /facade/i,
  /tower/i,
  /building/i,
  /community/i,
  /masterplan/i,
  /bedroom/i,
  // Raster photo formats are never transparent brand marks — they always knock
  // out to a solid block on the emerald plate.
  /\.jpe?g(\?|$)/i,
  // Audited slab artwork (opaque background -> white block) and wrong-brand
  // files found in the catalog. Never render these as developer logos.
  /8c882e55-602e-4200-9ff7-a42177045b1e-processed\.png/i, // "Anderson Logistics" file stored on Arada
  /Group\+544\.png/i,
  /Smart-Investments-Ltd\.png/i,
  /ank-developers-logo\.png/i,
  // Social-media photo exports (Instagram/Facebook CDN naming) are never brand
  // marks — they knock out to an opaque block on the emerald plate.
  /\/\d{9,}_\d{10,}_/,
];



function isAllowedLogoUrl(url: unknown): url is string {
  if (typeof url !== "string") return false;
  const trimmed = url.trim();
  if (!trimmed) return false;
  // Allow site-relative paths for curated local assets (e.g. /developers/logos/emaar-logo.webp)
  if (!/^(https?:\/\/|\/)/i.test(trimmed)) return false;
  return !FORBIDDEN_LOGO_PATTERNS.some((pat) => pat.test(trimmed));
}

const secureLogoUrl = (url: string): string =>
  url.startsWith("http://") ? `https://${url.slice("http://".length)}` : url;

function normalizeDeveloper(developer: unknown): Record<string, unknown> | null {
  if (!developer) return null;
  const dev = Array.isArray(developer) ? developer[0] : developer;
  if (!dev || typeof dev !== "object") return null;
  return dev as Record<string, unknown>;
}

const OFFICIAL_LOGO_MIRRORS: Array<{ match: RegExp; logo: string }> = [
  { match: /emaar_properties_f2c4d0a72c/i, logo: "/developers/logos/emaar-logo.webp" },
  { match: /makdevelopers\.com\/wp-content\/uploads\/.+mak-developers-logo/i, logo: "/developer-logos/mak-developers.svg" },
  { match: /mashriqelite\.com\/frontend\/images\/logo\.png/i, logo: "/developer-logos/mashriq-elite.png" },
  { match: /oneuae\.com\/.+OneDevLogo/i, logo: "/developer-logos/one-development.svg" },
  { match: /binghattiweb\.imgix\.net\/logo\.svg/i, logo: "/developer-logos/binghatti.svg" },
];

const OFFICIAL_LOGOS_BY_NAME: Array<{ match: RegExp; logo: string }> = [
  { match: /\bemaar\b/i, logo: "/developers/logos/emaar-logo.webp" },
  { match: /\baldar\b/i, logo: "/developers/logos/aldar-logo.png" },
  { match: /\bdubai\s+properties\b/i, logo: "/developers/logos/dubai-properties-logo.webp" },
  { match: /\bcondor\b/i, logo: "/developers/logos/condor-developers-logo.png" },
  { match: /\bazizi\b/i, logo: "/developer-logos/azizi-developments.png" },
  { match: /\bma+a?k\b|maakdream/i, logo: "/developer-logos/mak-developers.svg" },
  { match: /mashriq\s+elite/i, logo: "/developer-logos/mashriq-elite.png" },
  { match: /\bone\s+development\b/i, logo: "/developer-logos/one-development.svg" },
  { match: /\bbinghatti\b/i, logo: "/developer-logos/binghatti.svg" },
  { match: /\bwellington\b/i, logo: "/developer-logos/wellington.svg" },
  { match: /majid\s+al\s+futtaim/i, logo: "https://communities.majidalfuttaim.com/en/assets/images/logo.svg" },
];

function getOfficialLogoMirror(url: unknown, name: unknown): string | null {
  // Name-first: a URL mirror may NEVER paint another brand's mark on a card.
  // Some database rows carry the wrong CDN file (e.g. Ellington / Sobha Realty
  // inherited Emaar's logo file), so a URL mirror only applies when the mirror
  // brand also matches the developer name.
  if (typeof name === "string" && name.trim()) {
    const byName = OFFICIAL_LOGOS_BY_NAME.find((entry) => entry.match.test(name));
    if (byName) return byName.logo;
  }
  if (typeof url === "string") {
    const byUrl = OFFICIAL_LOGO_MIRRORS.find((entry) => entry.match.test(url));
    if (byUrl && !isWrongBrandLogoFile(url, name)) return byUrl.logo;
  }
  return null;
}

// Brand tokens baked into shared CDN filenames. When the file belongs to a
// different brand than the developer, the artwork is rejected outright — a card
// must never display another developer's mark.
const LOGO_FILE_BRAND_TOKENS: Array<{ file: RegExp; brand: RegExp }> = [
  { file: /emaar_properties_f2c4d0a72c/i, brand: /\bemaar\b/i },
  { file: /binghattiweb/i, brand: /binghatti/i },
  { file: /nakheel-log/i, brand: /nakheel/i },
];

export function isWrongBrandLogoFile(url: unknown, name: unknown): boolean {
  if (typeof url !== "string" || typeof name !== "string") return false;
  return LOGO_FILE_BRAND_TOKENS.some(
    (entry) => entry.file.test(url) && !entry.brand.test(name),
  );
}

/**
 * Safely extract the canonical developer logo URL.
 * Returns `null` if no valid, allowed logo exists (UI must render the approved
 * a website-derived logo/fav icon or a text mark — never a substitute project photo).
 */
export function getDeveloperLogoUrl(developer: unknown): string | null {
  const dev = normalizeDeveloper(developer);
  if (!dev) return null;
  // LOCKED: a processed white-knockout asset in the `developer-logos/white-v1`
  // storage folder is the approved, audited final artwork for that developer.
  // It always wins — it is the exact official mark with its background removed
  // and its ink repainted pure white, so it needs no runtime paint tricks.
  const locked = dev.logo_url_processed;
  if (isLockedWhiteLogoAsset(locked)) return secureLogoUrl(locked as string);
  // Curated, audited artwork is the canonical source whenever it exists. This
  // must run before the database URL because several legacy rows still point
  // at opaque slabs, expired remote files, or processed mirrors.
  const verifiedWhite = getVerifiedWhiteLogo(dev.name);
  if (verifiedWhite) return verifiedWhite;
  const url = dev.logo_url;
  const mirrored = getOfficialLogoMirror(url, dev.name);
  if (mirrored) return mirrored;
  if (isWrongBrandLogoFile(url, dev.name)) return null;
  if (isAllowedLogoUrl(url)) return secureLogoUrl(url);
  // Processed artwork is a legitimate final fallback when the canonical field
  // is empty or contains a rejected photo/favicon. It is never allowed to
  // outrank a valid official canonical logo.
  const processed = dev.logo_url_processed;
  return isAllowedLogoUrl(processed) ? secureLogoUrl(processed) : null;
}

/**
 * True for the permanently locked white-knockout assets produced by the
 * developer logo pipeline. Such artwork is already pure white on a transparent
 * canvas and must render as-is (no invert filter, no screen blend).
 */
export function isLockedWhiteLogoAsset(url: unknown): boolean {
  if (typeof url !== "string") return false;
  // Supabase public URLs may percent-encode the folder separator
  // (`white-v2%2Ffile.png`); both forms are the same locked asset.
  const decoded = url.replace(/%2F/gi, "/");
  return /developer-logos\/white-v(?:1|2)\//i.test(decoded);
}



export function getDeveloperWebsiteUrl(developer: unknown): string | null {
  const dev = normalizeDeveloper(developer);
  if (!dev) return null;
  const website = dev.website_url ?? dev.website;
  if (typeof website !== "string") return null;
  const trimmed = website.trim();
  if (!trimmed) return null;
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
}

const KNOWN_DEVELOPER_WEBSITES: Array<{ match: RegExp; website: string }> = [
  { match: /\bemaar\b/i, website: "https://www.emaar.com/en" },
  { match: /\bma+a?k\b|maakdream/i, website: "https://makdevelopers.com/" },
];

const KNOWN_DEVELOPER_LOGOS: Array<{ match: RegExp; logo: string }> = [
  { match: /\bemaar\b/i, logo: "/developers/logos/emaar-logo.webp" },
  { match: /\baldar\b/i, logo: "/developers/logos/aldar-logo.png" },
  { match: /\bdubai\s+properties\b/i, logo: "/developers/logos/dubai-properties-logo.webp" },
  { match: /\bcondor\b/i, logo: "/developers/logos/condor-developers-logo.png" },
  { match: /\bazizi\b/i, logo: "/developer-logos/azizi-developments.png" },
  { match: /\bma+a?k\b|maakdream/i, logo: "/developer-logos/mak-developers.svg" },
  { match: /mashriq\s+elite/i, logo: "/developer-logos/mashriq-elite.png" },
  { match: /\bone\s+development\b/i, logo: "/developer-logos/one-development.svg" },
  { match: /\bbinghatti\b/i, logo: "/developer-logos/binghatti.svg" },
  { match: /\bwellington\b/i, logo: "/developer-logos/wellington.svg" },
  { match: /majid\s+al\s+futtaim/i, logo: "https://communities.majidalfuttaim.com/en/assets/images/logo.svg" },
];

export function getKnownDeveloperWebsiteUrl(name: unknown): string | null {
  if (typeof name !== "string" || !name.trim()) return null;
  const hit = KNOWN_DEVELOPER_WEBSITES.find((entry) => entry.match.test(name));
  return hit?.website ?? null;
}

export function getKnownDeveloperLogoUrl(name: unknown): string | null {
  if (typeof name !== "string" || !name.trim()) return null;
  // Curated pure-white official marks win over the generic known-logo list.
  const verifiedWhite = getVerifiedWhiteLogo(name);
  if (verifiedWhite) return verifiedWhite;
  const hit = KNOWN_DEVELOPER_LOGOS.find((entry) => entry.match.test(name));
  return hit?.logo ?? null;
}

export function getWebsiteLogoFallbackUrl(websiteUrl: unknown): string | null {
  const publishableKey = import.meta.env.VITE_LOVABLE_CONNECTOR_LOGO_DEV_API_KEY;
  if (!publishableKey || typeof websiteUrl !== "string") return null;
  const raw = websiteUrl.trim();
  if (!raw) return null;

  try {
    const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    const domain = new URL(withProtocol).hostname.replace(/^www\./i, "").toLowerCase();
    if (!domain || !domain.includes(".")) return null;
    return `https://img.logo.dev/${encodeURIComponent(domain)}?token=${encodeURIComponent(publishableKey)}&size=96&format=png&fallback=404`;
  } catch {
    return null;
  }
}

export function getDeveloperLogoBgColor(developer: unknown): string | null {
  const dev = normalizeDeveloper(developer);
  if (!dev) return null;
  const color = dev.logo_bg_color;
  return typeof color === "string" && color ? color : null;
}

export function getDeveloperSlug(developer: unknown): string | null {
  const dev = normalizeDeveloper(developer);
  if (!dev) return null;
  const slug = dev.slug;
  return typeof slug === "string" && slug ? slug : null;
}

export function getDeveloperName(developer: unknown): string | null {
  const dev = normalizeDeveloper(developer);
  if (!dev) return null;
  const name = dev.name;
  return typeof name === "string" && name ? name : null;
}

/**
 * Validate any arbitrary URL against the developer-logo allow-list.
 * Use this for direct string inputs (not joined Supabase objects).
 */
export function isValidDeveloperLogoUrl(url: unknown): boolean {
  return isAllowedLogoUrl(url);
}
