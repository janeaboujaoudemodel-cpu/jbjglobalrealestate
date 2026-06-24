/**
 * Lazy-loads non-critical and owner-only app-shell components AFTER first
 * paint. Owner-only chunks (WebDev dock + highlight) are now gated by a
 * SYNCHRONOUS email check BEFORE they are imported, so anonymous visitors
 * never request the JS at all.
 */
import { lazy, Suspense, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { isOwnerEmail } from "@/config/ownerEmails";

const GlobalVisitorTracking = lazy(() => import("@/components/GlobalVisitorTracking"));
// OwnerVisitorToggle removed — Owner/Visitor view is now driven by the header mode switcher.
const SeoHighlightOverlay = lazy(() => import("@/components/SeoHighlightOverlay"));
const OwnerOverrideLoader = lazy(() => import("@/components/owner-overrides/OwnerOverrideLoader"));
const WebDevDock = lazy(() => import("@/components/owner-webdev/WebDevDock"));
const WebDevChangeHighlight = lazy(() => import("@/components/owner-webdev/WebDevChangeHighlight"));

export default function DeferredAppExtras() {
  const [ready, setReady] = useState(false);
  const { user } = useAuth();
  const ownerGate = !!user && isOwnerEmail(user.email);

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
      {/* OwnerVisitorToggle removed — Mode switcher in header now controls Owner/Visitor view */}
      <SeoHighlightOverlay />
      {/* Owner-only chunks: not even imported for non-owners */}
      {ownerGate && (
        <>
          <OwnerOverrideLoader />
          <WebDevDock />
          <WebDevChangeHighlight />
        </>
      )}
    </Suspense>
  );
}
