import { useEffect, useState } from "react";

/**
 * WHITE-BLOCK GUARD (LOCKED)
 *
 * Some database / scraped developer logos are baked onto an opaque rectangle
 * (white or dark). Once the plate knockout paints every opaque pixel white,
 * that artwork renders as a solid white block — which the owner has forbidden.
 *
 * This guard analyses the artwork off-screen and reports "block" when the image
 * is essentially a filled rectangle, so the caller can fall back to the branded
 * white wordmark on the emerald plate instead of a blank slab.
 *
 * A CORS-blocked or undecodable image resolves to "unknown" and never changes
 * the rendered <img>.
 */
export type LogoArtworkVerdict = "unknown" | "ok" | "block";

const cache = new Map<string, LogoArtworkVerdict>();
const inflight = new Map<string, Promise<LogoArtworkVerdict>>();

function analyze(url: string): Promise<LogoArtworkVerdict> {
  const existing = inflight.get(url);
  if (existing) return existing;

  const task = new Promise<LogoArtworkVerdict>((resolve) => {
    // SVG marks are vector brand files and are never baked onto a slab.
    if (/\.svg(\?|$)/i.test(url)) return resolve("ok");
    // Only analyse origins that serve CORS headers (our own storage / app
    // assets). Third-party CDNs would fail the canvas read and log noise.
    const analysable =
      url.startsWith("/") ||
      url.startsWith("data:") ||
      url.includes("supabase.co/storage/") ||
      (typeof window !== "undefined" && url.startsWith(window.location.origin));
    if (!analysable) return resolve("unknown");


    const img = new Image();
    img.crossOrigin = "anonymous";
    img.decoding = "async";
    img.onload = () => {
      try {
        const size = 32;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) return resolve("unknown");
        ctx.clearRect(0, 0, size, size);
        ctx.drawImage(img, 0, 0, size, size);
        const { data } = ctx.getImageData(0, 0, size, size);

        let opaque = 0;
        const total = size * size;
        for (let i = 0; i < data.length; i += 4) {
          if (data[i + 3] > 200) opaque += 1;
        }
        // Nearly every pixel is opaque -> the knockout would paint a full slab.
        return resolve(opaque / total > 0.9 ? "block" : "ok");
      } catch {
        resolve("unknown");
      }
    };
    img.onerror = () => resolve("unknown");
    img.src = url;
  }).then((verdict) => {
    cache.set(url, verdict);
    inflight.delete(url);
    return verdict;
  });

  inflight.set(url, task);
  return task;
}

export function useLogoArtworkGuard(url?: string | null): LogoArtworkVerdict {
  const [verdict, setVerdict] = useState<LogoArtworkVerdict>(() =>
    url ? cache.get(url) ?? "unknown" : "unknown",
  );

  useEffect(() => {
    if (!url) {
      setVerdict("unknown");
      return;
    }
    const cached = cache.get(url);
    if (cached) {
      setVerdict(cached);
      return;
    }
    let alive = true;
    analyze(url).then((result) => {
      if (alive) setVerdict(result);
    });
    return () => {
      alive = false;
    };
  }, [url]);

  return verdict;
}
