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
  /\/flags?\//i,
  /flag-icon/i,
  /lang[-_]?selector/i,
  /sprite/i,
  /pixel\.(gif|png)/i,
  /spacer\.(gif|png)/i,
  /1x1\.(gif|png)/i,
  /tracking/i,
  /analytics/i,
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
const HIGH_RES_IMAGE_SIZE = "1920x1080";

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
export function normalizeProvidentImageUrl(url: string, size?: string): string {
  if (!url) return url;
  
  // Check for Provident CDN pattern and normalize size
  if (url.includes("/x/") && url.includes("cloudfront.net")) {
    return url.replace(/\/x\/\d+x\d+\//, `/x/${size || SAFE_IMAGE_SIZE}/`);
  }
  
  return url;
}

/**
 * Get a high-resolution version of an image URL (for hero sections)
 */
export function getHighResImageUrl(url: string): string {
  if (!url) return url;
  
  if (url.includes("/x/") && url.includes("cloudfront.net")) {
    return url.replace(/\/x\/\d+x\d+\//, `/x/${HIGH_RES_IMAGE_SIZE}/`);
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

/**
 * Optimize Supabase Storage image URLs using the render/image transformation endpoint.
 * Converts /object/public/ to /render/image/public/ and appends width & quality params
 * to serve compressed WebP versions on-the-fly (~30-60 KB instead of ~2 MB PNGs).
 */
const STORAGE_OBJECT_PATH = "/storage/v1/object/public/";
const STORAGE_RENDER_PATH = "/storage/v1/render/image/public/";

export function optimizeStorageImageUrl(
  url: string | null | undefined,
  width: number = 600,
  quality: number = 70
): string | undefined {
  if (!url) return undefined;
  if (!url.includes(STORAGE_OBJECT_PATH)) return url;
  return url.replace(STORAGE_OBJECT_PATH, STORAGE_RENDER_PATH) + `?width=${width}&quality=${quality}`;
}

/**
 * Extract the dominant background color from a loaded image by sampling its corner pixels.
 * Uses a hidden canvas. Falls back to white on cross-origin or other errors.
 */
export function extractDominantCornerColor(img: HTMLImageElement): string {
  try {
    const canvas = document.createElement("canvas");
    const size = 1; // sample 1px at each corner
    canvas.width = img.naturalWidth || img.width;
    canvas.height = img.naturalHeight || img.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "rgb(255,255,255)";

    ctx.drawImage(img, 0, 0);

    const w = canvas.width;
    const h = canvas.height;
    if (w === 0 || h === 0) return "rgb(255,255,255)";

    // Sample 4 corners
    const corners = [
      ctx.getImageData(0, 0, size, size).data,           // top-left
      ctx.getImageData(w - 1, 0, size, size).data,       // top-right
      ctx.getImageData(0, h - 1, size, size).data,       // bottom-left
      ctx.getImageData(w - 1, h - 1, size, size).data,   // bottom-right
    ];

    // Find most common corner color (simple: stringify & count)
    const colorMap = new Map<string, number>();
    let bestColor = `rgb(${corners[0][0]},${corners[0][1]},${corners[0][2]})`;
    let bestCount = 0;

    for (const c of corners) {
      const key = `rgb(${c[0]},${c[1]},${c[2]})`;
      const count = (colorMap.get(key) || 0) + 1;
      colorMap.set(key, count);
      if (count > bestCount) {
        bestCount = count;
        bestColor = key;
      }
    }

    return bestColor;
  } catch {
    // Cross-origin or security error
    return "rgb(255,255,255)";
  }
}
