/**
 * Lazy-loads non-critical and owner-only app-shell components AFTER first
 * paint. Owner-only chunks (WebDev dock + highlight) are now gated by a
 * SYNCHRONOUS email check BEFORE they are imported, so anonymous visitors
 * never request the JS at all.
 */
import { lazy, Suspense, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { isOwnerEmail } from "@/config/ownerEmails";
import { useIsAppOwner } from "@/hooks/useIsAppOwner";
import { useUserMode } from "@/hooks/useUserMode";

const GlobalVisitorTracking = lazy(() => import("@/components/GlobalVisitorTracking"));
// OwnerVisitorToggle removed — Owner/Visitor view is now driven by the header mode switcher.
const SeoHighlightOverlay = lazy(() => import("@/components/SeoHighlightOverlay"));
const OwnerOverrideLoader = lazy(() => import("@/components/owner-overrides/OwnerOverrideLoader"));
const WebDevDock = lazy(() => import("@/components/owner-webdev/WebDevDock"));
const WebDevChangeHighlight = lazy(() => import("@/components/owner-webdev/WebDevChangeHighlight"));

export default function DeferredAppExtras() {
  const [ready, setReady] = useState(false);
  const { user, isOwner: authIsOwner, loading: authLoading, ownerLoading } = useAuth();
  const { isOwner: roleIsOwner, isLoading: roleLoading } = useIsAppOwner();
  const { mode, isLoading: modeLoading } = useUserMode();
  // Approved visual overrides are public because they are the applied website
  // changes. The editing dock/highlight are developer-only and fail closed
  // until auth, owner verification, role lookup, and Owner mode are settled.
  const ownerToolsGate =
    !authLoading &&
    !ownerLoading &&
    !roleLoading &&
    !modeLoading &&
    !!user &&
    isOwnerEmail(user.email) &&
    authIsOwner &&
    roleIsOwner &&
    mode === "owner";

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
      <OwnerOverrideLoader />
      {/* Developer tools: not even imported for non-owners/non-developers */}
      {ownerToolsGate && (
        <>
          <WebDevDock />
          <WebDevChangeHighlight />
        </>
      )}
    </Suspense>
  );
}
