import { lazy, type ComponentType } from "react";

/**
 * Drop-in replacement for React.lazy that retries a failed dynamic import
 * up to `retries` times with exponential backoff. After the final failure
 * it triggers a one-shot hard reload so the browser pulls fresh chunk
 * hashes (common after a deploy mid-session).
 *
 * Usage:
 *   const Page = lazyWithRetry(() => import("@/pages/MyPage"));
 *
 * Existing `lazy(() => import(...))` callsites continue to work; this is
 * an opt-in upgrade for new lazy imports or hotspots.
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
  retries = 3,
  baseDelayMs = 400
) {
  return lazy(async () => {
    let lastErr: unknown;
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await factory();
      } catch (err) {
        lastErr = err;
        if (attempt === retries) break;
        await new Promise((r) => setTimeout(r, baseDelayMs * Math.pow(2, attempt)));
      }
    }
    try {
      const k = "jbj_chunk_reload_at";
      const last = Number(sessionStorage.getItem(k) || 0);
      if (Date.now() - last > 60_000) {
        sessionStorage.setItem(k, String(Date.now()));
        window.location.reload();
      }
    } catch {
      /* ignore */
    }
    throw lastErr;
  });
}
