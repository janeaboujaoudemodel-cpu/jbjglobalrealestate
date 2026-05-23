/**
 * imageLoadLogger
 * --------------------------------------------------------------
 * Centralised logger for remote <img> failures. Captures the URL,
 * HTTP status (when reachable via HEAD), the component that owns
 * the image, and any extra context (project slug, alt text…).
 *
 * Failures are:
 *  - console.error'd with a `[img-fail]` tag so they're easy to grep
 *    in the browser console
 *  - kept in an in-memory ring buffer accessible via
 *    `window.__imgFailures()` for quick diagnosis
 *  - de-duplicated per URL so a broken image doesn't spam the log
 *
 * Usage:
 *   import { logImageFailure } from "@/utils/imageLoadLogger";
 *   logImageFailure({ src, component: "ProjectCard", context: { slug } });
 */

export interface ImageFailureRecord {
  /** Original src that failed to load. */
  src: string;
  /** Component name that rendered the image. */
  component: string;
  /** HTTP status discovered via HEAD probe (0 = network error, -1 = not probed). */
  status: number;
  /** Browser-visible error reason. */
  reason: "onerror" | "zero-dimensions" | "unknown";
  /** Free-form context: { slug, alt, projectId, ... } */
  context?: Record<string, unknown>;
  /** ISO timestamp. */
  at: string;
}

const RING_SIZE = 100;
const ring: ImageFailureRecord[] = [];
const seen = new Set<string>();

function pushRecord(rec: ImageFailureRecord) {
  ring.push(rec);
  if (ring.length > RING_SIZE) ring.shift();
}

async function probeStatus(url: string): Promise<number> {
  try {
    // Some CDNs reject HEAD; fall back to GET with no-store.
    const res = await fetch(url, { method: "HEAD", mode: "cors", cache: "no-store" });
    return res.status;
  } catch {
    try {
      const res = await fetch(url, { method: "GET", mode: "cors", cache: "no-store" });
      return res.status;
    } catch {
      return 0; // network error / CORS-opaque
    }
  }
}

export function logImageFailure(opts: {
  src?: string | null;
  component: string;
  reason?: ImageFailureRecord["reason"];
  context?: Record<string, unknown>;
}): void {
  const src = (opts.src || "").toString();
  if (!src) return;
  const key = `${opts.component}::${src}`;
  if (seen.has(key)) return;
  seen.add(key);

  const baseRec: ImageFailureRecord = {
    src,
    component: opts.component,
    status: -1,
    reason: opts.reason ?? "onerror",
    context: opts.context,
    at: new Date().toISOString(),
  };

  // Synchronous log first so the failure appears immediately even if the
  // HEAD probe is slow / blocked.
  // eslint-disable-next-line no-console
  console.error(
    `[img-fail] ${opts.component} → ${src}`,
    { reason: baseRec.reason, context: opts.context }
  );
  pushRecord(baseRec);

  // Async enrich with HTTP status when possible.
  if (/^https?:\/\//i.test(src)) {
    void probeStatus(src).then((status) => {
      const enriched = { ...baseRec, status };
      // eslint-disable-next-line no-console
      console.error(`[img-fail] ${opts.component} status=${status} → ${src}`);
      // Replace the previously pushed record so the ring stays accurate.
      const idx = ring.findIndex((r) => r.src === src && r.component === opts.component);
      if (idx >= 0) ring[idx] = enriched;
      else pushRecord(enriched);
    });
  }
}

/** Snapshot of recorded failures (for window-level diagnostics). */
export function getImageFailures(): ImageFailureRecord[] {
  return [...ring];
}

/** Expose on window for quick diagnosis from DevTools. */
if (typeof window !== "undefined") {
  (window as any).__imgFailures = getImageFailures;
}
