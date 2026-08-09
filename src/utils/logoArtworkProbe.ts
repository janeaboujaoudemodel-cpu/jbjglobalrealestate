/**
 * Runtime artwork probe (LOCKED helper).
 *
 * Decides how a developer logo must be painted so it ALWAYS ends up as a pure
 * white mark on the emerald plate, without ever producing:
 *  - a white rectangle (opaque canvas turned white by a blanket knockout), or
 *  - an invisible plate (a white wordmark inverted to black and screened away).
 *
 * The probe loads the artwork once, samples its alpha channel and returns:
 *  - "silhouette": the canvas is transparent, so `brightness(0) invert(1)`
 *    repaints every ink pixel pure white with no risk of a slab.
 *  - "screen": the canvas is opaque, so the dark field is removed with screen
 *    blending instead (never a white block).
 * Probes that cannot read pixels (CORS-tainted) resolve to "silhouette",
 * which is correct for the SVG/PNG transparent brand files we allow.
 */
export type LogoPaintMode = "silhouette" | "screen";

const cache = new Map<string, LogoPaintMode>();
const inflight = new Map<string, Promise<LogoPaintMode>>();

export function getCachedLogoPaintMode(url?: string | null): LogoPaintMode | null {
  if (!url) return null;
  return cache.get(url) ?? null;
}

export function probeLogoPaintMode(url: string): Promise<LogoPaintMode> {
  const cached = cache.get(url);
  if (cached) return Promise.resolve(cached);
  const existing = inflight.get(url);
  if (existing) return existing;

  const task = new Promise<LogoPaintMode>((resolve) => {
    if (typeof document === "undefined") return resolve("silhouette");
    // SVG brand files are vector marks on a transparent canvas by definition.
    if (/\.svg(\?|$)/i.test(url)) return resolve("silhouette");
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.decoding = "async";
    const finish = (mode: LogoPaintMode) => resolve(mode);
    img.onerror = () => finish("silhouette");
    img.onload = () => {
      try {
        const w = Math.min(img.naturalWidth || 64, 64);
        const h = Math.min(img.naturalHeight || 64, 64);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) return finish("silhouette");
        ctx.drawImage(img, 0, 0, w, h);
        const { data } = ctx.getImageData(0, 0, w, h);
        let transparent = 0;
        const total = w * h;
        for (let i = 3; i < data.length; i += 4) {
          if (data[i] < 24) transparent += 1;
        }
        // A genuine brand mark on a transparent canvas leaves a large share of
        // empty pixels. Anything below that is an opaque plate/slab.
        finish(transparent / total > 0.12 ? "silhouette" : "screen");
      } catch {
        finish("silhouette");
      }
    };
    img.src = url;
  }).then((mode) => {
    cache.set(url, mode);
    inflight.delete(url);
    return mode;
  });

  inflight.set(url, task);
  return task;
}
