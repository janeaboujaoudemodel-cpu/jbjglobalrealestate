/**
 * Developer Logo Resolver — LOCKED SOURCE OF TRUTH.
 *
 * Hard rules (enforced globally — do NOT change without Founder authorization):
 *   1. Developer logos MUST come from `developers.logo_url` only.
 *   2. `feature_image_url`, `cover_image_url`, project photos, screenshots,
 *      WhatsApp / convert.io files, or any other photo may NEVER be used
 *      as a developer logo — not even as a fallback.
 *   3. The only approved "no logo" fallback is the `Building2` icon,
 *      rendered by the `DeveloperLogo` component. No initials, no monograms.
 *   4. `logo_url_processed` is an internal background-removed mirror; it is
 *      no longer preferred over the canonical `logo_url`. Canonical wins.
 *
 * Supabase joins can return either an array (when expanded) or an object,
 * so this resolver handles both safely.
 */

const FORBIDDEN_LOGO_PATTERNS: RegExp[] = [
  /screenshot/i,
  /whatsapp/i,
  /convert\.io/i,
  /\/frame\+?\d/i,
  /1080x1080/i,
  /\/images?\.(png|jpe?g|webp)(\?|$)/i,
  /\/[0-9]{8,}\.(jpg|jpeg|png|webp)(\?|$)/i,
  /logo-white-1/i,
  /logodix\.com/i,
  /%d[01][0-9a-f]%/i, // URL-encoded cyrillic (Russian screenshots)
  /\/projects\/\d+\/images\//i, // project photo paths
  /snapedit/i,
  /_n_[a-f0-9]{16,}\.(jpg|jpeg|png|webp)/i, // Instagram post mirrors
  /_feature_[a-f0-9]{6,}\.(jpg|jpeg|png|webp)/i, // mis-tagged project feature images
  /\/x\/16x16\//i, // favicon-size CDN paths
  /\/x\/[0-9]{2,3}x[0-9]{2,3}\//i, // tiny thumbnail CDN paths (project covers, not logos)
  /habtoor_polo/i,
  /tilal_/i,
];

function isAllowedLogoUrl(url: unknown): url is string {
  if (typeof url !== "string") return false;
  const trimmed = url.trim();
  if (!trimmed) return false;
  // Allow site-relative paths for curated local assets (e.g. /developers/logos/emaar-logo.webp)
  if (!/^(https?:\/\/|\/)/i.test(trimmed)) return false;
  return !FORBIDDEN_LOGO_PATTERNS.some((pat) => pat.test(trimmed));
}

function normalizeDeveloper(developer: unknown): Record<string, unknown> | null {
  if (!developer) return null;
  const dev = Array.isArray(developer) ? developer[0] : developer;
  if (!dev || typeof dev !== "object") return null;
  return dev as Record<string, unknown>;
}

/**
 * Safely extract the canonical developer logo URL.
 * Returns `null` if no valid, allowed logo exists (UI must render the approved
 * `Building2` icon fallback — never a substitute photo).
 */
export function getDeveloperLogoUrl(developer: unknown): string | null {
  const dev = normalizeDeveloper(developer);
  if (!dev) return null;
  const url = dev.logo_url;
  return isAllowedLogoUrl(url) ? url : null;
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
