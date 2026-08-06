import { useEffect, useState } from "react";

/**
 * Performance guard for heavy background videos.
 *
 * Background videos on this site are 4–40 MB. Mounting them during first paint
 * saturates the connection and starves images, fonts and data requests — which
 * is exactly what "sections load partially / very slowly" looks like.
 *
 * This hook returns `false` until the page has finished its first paint and the
 * browser is idle, and stays `false` forever when the visitor is on a metered /
 * slow connection or prefers reduced motion. The poster image always renders,
 * so there is no visual regression — only a later, cheaper video start.
 */
export function useDeferredMedia(delayMs = 1200): boolean {
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Never pull megabytes on metered or slow connections.
    const conn = (navigator as any)?.connection;
    if (conn?.saveData) return;
    const type = String(conn?.effectiveType || "");
    if (/(^|-)(slow-)?2g$/.test(type) || type === "3g") return;

    // Respect reduced-motion: poster only.
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) return;

    let cancelled = false;
    let idleId: number | undefined;
    let timeoutId: number | undefined;

    const arm = () => {
      if (cancelled) return;
      const w = window as Window & {
        requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      };
      if (typeof w.requestIdleCallback === "function") {
        idleId = w.requestIdleCallback(() => !cancelled && setAllowed(true), { timeout: 2500 });
      } else {
        timeoutId = window.setTimeout(() => !cancelled && setAllowed(true), 300);
      }
    };

    // Wait for load (all critical images/fonts done) then idle, then start.
    const start = () => {
      timeoutId = window.setTimeout(arm, delayMs);
    };

    if (document.readyState === "complete") start();
    else window.addEventListener("load", start, { once: true });

    return () => {
      cancelled = true;
      window.removeEventListener("load", start);
      if (timeoutId) window.clearTimeout(timeoutId);
      if (idleId && (window as any).cancelIdleCallback) (window as any).cancelIdleCallback(idleId);
    };
  }, [delayMs]);

  return allowed;
}

export default useDeferredMedia;
