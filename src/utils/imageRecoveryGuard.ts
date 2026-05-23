/**
 * Site-wide broken-image self-healing.
 *
 * On any <img> error or zero-dimension load (excluding opt-outs):
 *   1. Try once with a high-res CDN variant of the URL.
 *   2. Otherwise replace src with a branded champagne-initials data URI.
 *
 * Opt out per-image with `data-no-fallback`.
 */
import { buildChampagneInitialsDataUri } from "./champagneInitialsFallback";
import { getHighResImageUrl } from "@/lib/imageUtils";

const RECOVERED = "data-img-recovered";
const SKIP = "data-no-fallback";
const TRIED_HIRES = "data-img-tried-hires";

const THUMB_HINTS = [
  /_thumb/i,
  /thumbnail/i,
  /\/\d{2,3}x\d{2,3}\//,
  /-\d{2,3}x\d{2,3}\./,
  /size=(?:thumb|small)/i,
];

function looksLikeThumb(src: string): boolean {
  return THUMB_HINTS.some((re) => re.test(src));
}

function applyInitialsFallback(img: HTMLImageElement) {
  if (img.getAttribute(RECOVERED) === "initials") return;
  const w = img.clientWidth || img.naturalWidth || parseInt(img.getAttribute("width") || "0", 10) || 400;
  const h = img.clientHeight || img.naturalHeight || parseInt(img.getAttribute("height") || "0", 10) || 300;
  const uri = buildChampagneInitialsDataUri({ alt: img.alt, width: w, height: h });
  img.setAttribute(RECOVERED, "initials");
  // strip srcset so the fallback wins
  if (img.srcset) img.srcset = "";
  img.src = uri;
}

function handle(img: HTMLImageElement, reason: "error" | "zero") {
  if (!(img instanceof HTMLImageElement)) return;
  if (img.hasAttribute(SKIP)) return;
  if (img.getAttribute(RECOVERED) === "initials") return;

  const current = img.currentSrc || img.src || "";

  // Skip our own data URIs to avoid loops.
  if (current.startsWith("data:image/svg+xml")) return;

  // Step 1: try high-res variant once for thumb-style URLs.
  if (
    reason === "error" &&
    current &&
    !img.hasAttribute(TRIED_HIRES) &&
    /^https?:/i.test(current) &&
    looksLikeThumb(current)
  ) {
    try {
      const hires = getHighResImageUrl(current);
      if (hires && hires !== current) {
        img.setAttribute(TRIED_HIRES, "1");
        if (img.srcset) img.srcset = "";
        img.src = hires;
        return;
      }
    } catch {
      /* fall through */
    }
  }

  applyInitialsFallback(img);
}

let installed = false;

export function installImageRecoveryGuard() {
  if (installed || typeof window === "undefined") return;
  installed = true;

  // Capture-phase: image error events do NOT bubble, must be captured.
  window.addEventListener(
    "error",
    (e) => {
      const t = e.target as HTMLElement | null;
      if (t && t.tagName === "IMG") handle(t as HTMLImageElement, "error");
    },
    true,
  );

  // Zero-dimension load catches CORS-stripped or empty responses.
  window.addEventListener(
    "load",
    (e) => {
      const t = e.target as HTMLElement | null;
      if (!t || t.tagName !== "IMG") return;
      const img = t as HTMLImageElement;
      if (img.naturalWidth === 0 && img.naturalHeight === 0) {
        handle(img, "zero");
      }
    },
    true,
  );
}
