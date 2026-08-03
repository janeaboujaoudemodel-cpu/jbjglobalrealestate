/**
 * Project media classifier.
 *
 * LOCKED RULE: scraped/extracted assets must be understood before they are
 * published. An extractor is never allowed to dump every <img> it found into
 * the photo gallery. Each asset is classified into the section it belongs to
 * (payment plan, fact sheet, floor plan, master plan, brochure page, …) and
 * ONLY true renders/photography are allowed into the gallery.
 */

export type ProjectAssetRole =
  | "gallery"
  | "payment_plan"
  | "fact_sheet"
  | "brochure_page"
  | "floor_plan"
  | "master_plan"
  | "location_map"
  | "amenity"
  | "logo"
  | "flag"
  | "icon"
  | "broker_kit"
  | "unknown";

/** Roles that are allowed to render inside the public photo gallery. */
export const GALLERY_ROLES: ProjectAssetRole[] = ["gallery", "amenity"];

/** Roles that must never render as a project photo anywhere. */
export const REJECTED_ROLES: ProjectAssetRole[] = ["logo", "flag", "icon", "broker_kit"];

const RULES: Array<{ role: ProjectAssetRole; test: RegExp }> = [
  { role: "flag", test: /\/flags?\/|flag[-_]?icon|\/(en|ar|ru|zh|fr|de)\.(png|jpg|jpeg|webp|svg)$/i },
  { role: "logo", test: /logo|wordmark|monogram|favicon/i },
  { role: "icon", test: /\bicons?\b|sprite|spacer|pixel\.(gif|png)|1x1\.(gif|png)/i },
  { role: "payment_plan", test: /payment[-_ ]?plan|payment[-_ ]?schedule|instal?ment/i },
  { role: "fact_sheet", test: /fact[-_ ]?sheet|factsheet|spec[-_ ]?sheet/i },
  { role: "floor_plan", test: /floor[-_ ]?plan|unit[-_ ]?plan|layout[-_ ]?plan|typical[-_ ]?floor/i },
  { role: "master_plan", test: /master[-_ ]?plan|site[-_ ]?plan|siteplan/i },
  { role: "location_map", test: /location[-_ ]?map|\bmap\b|google\.com\/maps|connectivity/i },
  { role: "brochure_page", test: /brochure|e[-_]?book|presentation|deck[-_ ]?page|\bpage[-_ ]?\d+\b/i },
  { role: "broker_kit", test: /broker[-_ ]?kit|\/kit\/|agent[-_ ]?kit|brand[-_ ]?guideline|company[-_ ]?profile|credential|certificate|award/i },
  { role: "amenity", test: /amenit|facilit|gym|pool|spa|lounge|lobby|rooftop|clubhouse/i },
  { role: "gallery", test: /render|exterior|interior|facade|view|hero|gallery|photo|living|bedroom|kitchen|balcony|terrace|aerial/i },
];

/** Resolve a Next.js `/_next/image?url=…` proxy URL down to the real asset path. */
export function resolveProxiedImageUrl(rawUrl: string): string {
  if (!rawUrl || !rawUrl.includes("/_next/image")) return rawUrl;
  try {
    const parsed = new URL(rawUrl);
    const inner = parsed.searchParams.get("url");
    if (!inner) return rawUrl;
    const decoded = decodeURIComponent(inner);
    if (/^https?:\/\//i.test(decoded)) return decoded;
    return `${parsed.origin}${decoded.startsWith("/") ? "" : "/"}${decoded}`;
  } catch {
    return rawUrl;
  }
}

/**
 * Remove thumbnail transforms so the asset is requested at source resolution.
 * `?w=384&q=75` was the reason extracted slides rendered blurry.
 */
export function upgradeToSourceResolution(rawUrl: string): string {
  if (!rawUrl) return rawUrl;
  const resolved = resolveProxiedImageUrl(rawUrl);
  if (resolved !== rawUrl) return resolved;
  try {
    const u = new URL(rawUrl);
    let touched = false;
    for (const key of ["w", "width", "q", "quality", "h", "height"]) {
      if (u.searchParams.has(key)) {
        u.searchParams.delete(key);
        touched = true;
      }
    }
    return touched ? u.toString().replace(/\?$/, "") : rawUrl;
  } catch {
    return rawUrl;
  }
}

/** Rough pixel budget encoded in the URL — used to drop icon-sized assets. */
export function urlWidthHint(rawUrl: string): number | null {
  if (!rawUrl) return null;
  const q = rawUrl.match(/[?&](?:w|width)=(\d{2,4})/i);
  if (q) return parseInt(q[1], 10);
  const dims = rawUrl.match(/(\d{2,4})x(\d{2,4})/);
  if (dims) return parseInt(dims[1], 10);
  return null;
}

export interface ClassifyInput {
  url?: string | null;
  alt?: string | null;
}

/** Classify a single asset by URL + alt text. */
export function classifyProjectImage({ url, alt }: ClassifyInput): ProjectAssetRole {
  if (!url) return "unknown";
  const haystack = `${resolveProxiedImageUrl(url)} ${alt || ""}`;

  // An asset requested at icon dimensions is never a project photo.
  const width = urlWidthHint(url);
  if (width !== null && width <= 96) return "icon";

  for (const rule of RULES) {
    if (rule.test.test(haystack)) return rule.role;
  }
  return "unknown";
}

/**
 * Gallery guard. Even if a bad row is inserted later, non-photo and
 * icon-sized assets can never surface as a project photo.
 */
export function isGalleryPhoto(input: ClassifyInput): boolean {
  const role = classifyProjectImage(input);
  if (REJECTED_ROLES.includes(role)) return false;
  if (role === "payment_plan" || role === "fact_sheet" || role === "brochure_page") return false;
  if (role === "floor_plan" || role === "master_plan" || role === "location_map") return false;
  return true;
}

/** Keep only assets that belong in the photo gallery, at source resolution. */
export function filterGalleryAssets<T extends { url?: string | null; alt?: string | null }>(
  assets: T[],
): T[] {
  return (assets || [])
    .filter((asset) => isGalleryPhoto(asset))
    .map((asset) => ({ ...asset, url: asset.url ? upgradeToSourceResolution(asset.url) : asset.url }));
}

/** Assets that belong to a specific non-gallery section. */
export function assetsForRole<T extends { url?: string | null; alt?: string | null }>(
  assets: T[],
  role: ProjectAssetRole,
): T[] {
  return (assets || [])
    .filter((asset) => classifyProjectImage(asset) === role)
    .map((asset) => ({ ...asset, url: asset.url ? upgradeToSourceResolution(asset.url) : asset.url }));
}
