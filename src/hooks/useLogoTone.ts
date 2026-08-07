import { useEffect, useState } from "react";

/**
 * Detects whether a developer logo is "light" (white / near-white artwork).
 * Light logos are invisible on the white plate, so the caller flips the plate
 * to the emerald pair gradient. Analysis runs on a detached CORS image so a
 * blocked request never affects the rendered <img>.
 *
 * Result is cached per-URL for the session (logos repeat across many cards).
 */
type Tone = "unknown" | "light" | "dark";

const toneCache = new Map<string, Tone>();
const inflight = new Map<string, Promise<Tone>>();

function analyze(url: string): Promise<Tone> {
  const existing = inflight.get(url);
  if (existing) return existing;

  const task = new Promise<Tone>((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.decoding = "async";
    img.onload = () => {
      try {
        const size = 24;
        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) return resolve("unknown");
        ctx.drawImage(img, 0, 0, size, size);
        const { data } = ctx.getImageData(0, 0, size, size);

        let visible = 0;
        let light = 0;
        for (let i = 0; i < data.length; i += 4) {
          const alpha = data[i + 3];
          if (alpha < 40) continue; // transparent padding
          visible += 1;
          const luminance =
            (0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]) / 255;
          if (luminance > 0.82) light += 1;
        }

        if (visible < 12) return resolve("unknown");
        // Most of the visible artwork is near-white -> needs a dark plate.
        resolve(light / visible > 0.72 ? "light" : "dark");
      } catch {
        resolve("unknown");
      }
    };
    img.onerror = () => resolve("unknown");
    img.src = url;
  }).then((tone) => {
    toneCache.set(url, tone);
    inflight.delete(url);
    return tone;
  });

  inflight.set(url, task);
  return task;
}

export function useLogoTone(url?: string | null): Tone {
  const [tone, setTone] = useState<Tone>(() =>
    url ? toneCache.get(url) ?? "unknown" : "unknown",
  );

  useEffect(() => {
    if (!url) {
      setTone("unknown");
      return;
    }
    const cached = toneCache.get(url);
    if (cached) {
      setTone(cached);
      return;
    }
    let alive = true;
    analyze(url).then((result) => {
      if (alive) setTone(result);
    });
    return () => {
      alive = false;
    };
  }, [url]);

  return tone;
}
