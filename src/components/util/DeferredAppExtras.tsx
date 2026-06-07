/**
 * Lazy-loads non-critical and owner-only app-shell components AFTER first
 * paint. These never block FCP/LCP and never ship code to anonymous visitors
 * until the browser is idle.
 *
 * Components included:
 *  - GlobalVisitorTracking (analytics — post-paint)
 *  - OwnerVisitorToggle    (owner UI — post-paint)
 *  - SeoHighlightOverlay   (owner SEO dev tool — post-paint)
 *  - OwnerOverrideLoader   (owner overrides — post-paint)
 *  - WebDevDock            (owner-only floating tool)
 *  - WebDevChangeHighlight (owner-only highlight)
 *
 * Each is dynamic-imported so the code lands in its own chunk and is only
 * fetched when this wrapper actually mounts the component.
 */
import { lazy, Suspense, useEffect, useState } from "react";

const GlobalVisitorTracking = lazy(() => import("@/components/GlobalVisitorTracking"));
const OwnerVisitorToggle = lazy(() => import("@/components/project-detail/OwnerVisitorToggle"));
const SeoHighlightOverlay = lazy(() => import("@/components/SeoHighlightOverlay"));
const OwnerOverrideLoader = lazy(() => import("@/components/owner-overrides/OwnerOverrideLoader"));
const WebDevDock = lazy(() => import("@/components/owner-webdev/WebDevDock"));
const WebDevChangeHighlight = lazy(() => import("@/components/owner-webdev/WebDevChangeHighlight"));

export default function DeferredAppExtras() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;
    const arm = () => {
      if (!cancelled) setReady(true);
    };
    const w = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    if (typeof w.requestIdleCallback === "function") {
      const id = w.requestIdleCallback(arm, { timeout: 2500 });
      return () => {
        cancelled = true;
        w.cancelIdleCallback?.(id);
      };
    }
    const t = window.setTimeout(arm, 1500);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, []);

  if (!ready) return null;

  return (
    <Suspense fallback={null}>
      <GlobalVisitorTracking />
      <OwnerVisitorToggle />
      <SeoHighlightOverlay />
      <OwnerOverrideLoader />
      <WebDevDock />
      <WebDevChangeHighlight />
    </Suspense>
  );
}
