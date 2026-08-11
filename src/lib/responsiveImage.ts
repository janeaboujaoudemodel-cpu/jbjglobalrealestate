/**
 * responsiveImage — safe, provider-aware responsive image sources.
 *
 * PERF (production audit): mobile was receiving full-size imagery (up to
 * 1920x1080) for 464px-wide cards, and hero posters shipped a single desktop
 * asset with no `srcset`. This helper produces a real `srcset` **only** for
 * providers where a width-transform is guaranteed to exist:
 *
 *   • Supabase Storage — `/object/public/` is rewritten to
 *     `/render/image/public/` with `width` + `quality` (served as WebP).
 *
 * For every other host (CloudFront `/x/WxH/`, reelly vault, S3 originals) the
 * URL is returned untouched. Those feeds only publish specific pre-generated
 * sizes, and inventing dimensions produced 403/404 blank images before — see
 * `getHighResImageUrl` in `src/lib/imageUtils.ts`.
 */

const STORAGE_OBJECT_PATH = "/storage/v1/object/public/";
const STORAGE_RENDER_PATH = "/storage/v1/render/image/public/";

const SIZE_PARAMS = /[?&](width|height|quality|resize|format)=[^&]*/gi;

export interface ResponsiveImage {
  src: string;
  srcSet?: string;
  sizes?: string;
}

/** Unsplash serves any width via `w` / `q`, so it is safe to resize. */
function isUnsplash(url: string): boolean {
  return url.includes("images.unsplash.com");
}

function isTransformable(url: string): boolean {
  return (
    url.includes(STORAGE_OBJECT_PATH) || url.includes(STORAGE_RENDER_PATH) || isUnsplash(url)
  );
}

function unsplashVariant(url: string, width: number, quality: number): string {
  try {
    const u = new URL(url);
    u.searchParams.set("w", String(width));
    u.searchParams.set("q", String(quality));
    u.searchParams.set("auto", "format");
    u.searchParams.delete("h");
    return u.toString();
  } catch {
    return url;
  }
}

function variant(url: string, width: number, quality: number): string {
  if (isUnsplash(url)) return unsplashVariant(url, width, quality);
  const base = url
    .replace(STORAGE_OBJECT_PATH, STORAGE_RENDER_PATH)
    .replace(SIZE_PARAMS, "")
    .replace(/[?&]+$/, "");
  const joiner = base.includes("?") ? "&" : "?";
  // `resize=contain` is REQUIRED. Supabase's default transform mode is `cover`,
  // and with only `width` supplied it keeps the ORIGINAL height — so a 296x59
  // developer wordmark requested at width=176 came back as a 176x59 centre CROP
  // ("EMAAR" rendered as "MAA"). `contain` scales proportionally (176x35) and
  // never clips, which the No-Cropped-Text standard requires.
  return `${base}${joiner}width=${width}&resize=contain&quality=${quality}`;
}



/**
 * Build `{ src, srcSet, sizes }` for an image that will be rendered at roughly
 * `widths[widths.length - 1]` CSS px on the largest breakpoint.
 */
export function buildResponsiveImage(
  url: string | null | undefined,
  options: { widths?: number[]; sizes?: string; quality?: number } = {},
): ResponsiveImage | null {
  if (!url || typeof url !== "string") return null;
  const widths = (options.widths ?? [320, 480, 640, 960]).slice().sort((a, b) => a - b);
  const quality = options.quality ?? 70;
  const largest = widths[widths.length - 1];

  if (!isTransformable(url)) {
    // No safe transform: ship the original, but still declare `sizes` so the
    // browser can pick sensibly if the host ever gains a srcset.
    return { src: url };
  }

  return {
    src: variant(url, largest, quality),
    srcSet: widths.map((w) => `${variant(url, w, quality)} ${w}w`).join(", "),
    sizes: options.sizes,
  };
}

/** Card-grid preset: cards are ~460px wide on desktop, full width on mobile. */
export const CARD_IMAGE_SIZES = "(max-width: 639px) 100vw, (max-width: 1199px) 50vw, 33vw";
export const CARD_IMAGE_WIDTHS = [320, 480, 640, 928];

/** Full-bleed hero/banner preset. */
export const HERO_IMAGE_SIZES = "100vw";
export const HERO_IMAGE_WIDTHS = [480, 768, 1280, 1920];

export default buildResponsiveImage;
