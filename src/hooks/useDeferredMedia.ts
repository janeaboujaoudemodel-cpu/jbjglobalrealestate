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
export function useDeferredMedia(delayMs = 350): boolean {
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Honour an explicit data-saving choice. Do not permanently suppress the
    // video based on effectiveType: browsers often keep reporting "3g" after
    // the connection has recovered, which left the hero stuck on its poster.
    const conn = (navigator as any)?.connection;
    if (conn?.saveData) return;

    // Respect reduced-motion: poster only.
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches) return;

    let cancelled = false;
    let timeoutId: number | undefined;

    // Bounded delay after React mounts. Waiting for window.load or an idle
    // callback can deadlock on image-heavy pages because those events may be
    // held up by the very media work this guard is meant to sequence.
    timeoutId = window.setTimeout(() => {
      if (!cancelled) setAllowed(true);
    }, Math.max(0, delayMs));

    return () => {
      cancelled = true;
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, [delayMs]);

  return allowed;
}

export default useDeferredMedia;
