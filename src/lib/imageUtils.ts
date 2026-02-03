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

const SITE_ASSET_PATTERNS = [
  /navbar/i,
  /header/i,
  /footer/i,
  /menu/i,
  /widget/i,
  /sidebar/i,
  /banner/i,
  /thumbnail/i,
  /thumb_/i,
  /social/i,
  /share/i,
  /button/i,
  /btn_/i,
  /grid_\d+/i,
  /general_brochure/i,
  /brochure/i,
  /payment[-_]?plan/i,
  /floor[-_]?plan/i,
  /logo/i,
  /icon/i,
  /avatar/i,
  /spinner/i,
  /favicon/i,
];

const SAFE_IMAGE_SIZE = "464x312";

/**
 * Check if an image URL is valid (not a placeholder, not a site asset, etc.)
 */
export function isValidImageUrl(url: unknown): url is string {
  if (!url) return false;
  if (typeof url !== "string") return false;
  
  // Must start with http(s)
  if (!url.startsWith("http://") && !url.startsWith("https://")) return false;
  
  // Check for placeholder patterns
  for (const pattern of PLACEHOLDER_PATTERNS) {
    if (pattern.test(url)) return false;
  }
  
  // Check for site asset patterns (exclude brochure/floor plan images from gallery)
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
