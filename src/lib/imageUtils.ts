/**
 * Image URL validation and normalization utilities
 * Filters out broken placeholders, normalizes CDN sizes, etc.
 */

const PLACEHOLDER_PATTERNS = [
  /Base64-Image-Removed/i,
  /data:image\//i,
  /placeholder/i,
  /\[object Object\]/i,
];

// These patterns filter out site UI elements - NOT property images
const SITE_ASSET_PATTERNS = [
  /navbar/i,
  /header/i,
  /footer/i,
  /menu/i,
  /widget/i,
  /sidebar/i,
  /social/i,
  /share/i,
  /button/i,
  /btn_/i,
  /logo/i,
  /icon/i,
  /avatar/i,
  /spinner/i,
  /favicon/i,
];

// Document patterns - these are PDFs/docs, not gallery images
const DOCUMENT_PATTERNS = [
  /general_brochure/i,
  /brochure\.pdf/i,
  /payment[-_]?plan\.pdf/i,
  /floor[-_]?plan\.pdf/i,
];

// Trusted image domains - NEVER filter images from these sources
const TRUSTED_IMAGE_DOMAINS = [
  "mdafrewypkkrildjgtey.supabase.co", // Our Supabase storage
  "reelly.io",
  "reelly-assets",
  "provident.ae",
  "cloudfront.net",
  "bayut.com",
  "propertyfinder.ae",
  "dubizzle.com",
  "zaapi.ae",
  "emaar.com",
  "damacproperties.com",
  "sobharealty.com",
  "meraas.com",
  "nakheel.com",
  "aldar.com",
  "ellington.ae",
  "object.properties",
  "select.ae",
  "uploads.mangopulse",
  "cdn.sanity.io",
  "images.unsplash.com",
];

const SAFE_IMAGE_SIZE = "464x312";

/**
 * Check if URL is from a trusted image source
 */
function isTrustedImageSource(url: string): boolean {
  return TRUSTED_IMAGE_DOMAINS.some(domain => url.includes(domain));
}

/**
 * Check if an image URL is valid (not a placeholder, not a site asset, etc.)
 */
export function isValidImageUrl(url: unknown): url is string {
  if (!url) return false;
  if (typeof url !== "string") return false;
  
  // Must start with http(s)
  if (!url.startsWith("http://") && !url.startsWith("https://")) return false;
  
  // Check for placeholder patterns (always reject these)
  for (const pattern of PLACEHOLDER_PATTERNS) {
    if (pattern.test(url)) return false;
  }
  
  // If from trusted domain, allow it (skip site asset filtering)
  if (isTrustedImageSource(url)) {
    // Still filter out explicit document files even from trusted sources
    for (const pattern of DOCUMENT_PATTERNS) {
      if (pattern.test(url)) return false;
    }
    return true;
  }
  
  // Check for site asset patterns (only for untrusted domains)
  for (const pattern of SITE_ASSET_PATTERNS) {
    if (pattern.test(url)) return false;
  }
  
  return true;
}

/**
 * Normalize Provident CDN image URLs to a safe size that won't 403
 */
export function normalizeProvidentImageUrl(url: string): string {
  if (!url) return url;
  
  // Check for Provident CDN pattern and normalize size
  if (url.includes("/x/") && url.includes("cloudfront.net")) {
    return url.replace(/\/x\/\d+x\d+\//, `/x/${SAFE_IMAGE_SIZE}/`);
  }
  
  return url;
}

/**
 * Filter and normalize an array of image objects
 */
export function filterValidImages<T extends { url?: string }>(
  images: T[]
): T[] {
  return images
    .filter((img) => isValidImageUrl(img?.url))
    .map((img) => ({
      ...img,
      url: normalizeProvidentImageUrl(img.url!),
    }));
}

/**
 * Get the first valid image URL from an array
 */
export function getFirstValidImageUrl(
  images: Array<{ url?: string }> | undefined
): string | undefined {
  if (!images || images.length === 0) return undefined;
  const valid = images.find((img) => isValidImageUrl(img?.url));
  return valid ? normalizeProvidentImageUrl(valid.url!) : undefined;
}
