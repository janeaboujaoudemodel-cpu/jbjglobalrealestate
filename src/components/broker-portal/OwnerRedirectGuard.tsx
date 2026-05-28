import { ReactNode, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useIsAppOwner } from "@/hooks/useIsAppOwner";

const PREVIEW_KEY = "jbj_broker_portal_preview";
export const BROKER_PREVIEW_PARAM = "preview";

/**
 * Wrap /broker/* routes so the platform owner is always sent back to their
 * own backend by default. They can opt in to broker preview by appending
 * `?preview=1` (the link in the owner sidebar does this) — that sets a
 * session flag and the guard stops redirecting until they sign out or
 * leave preview mode.
 */
export default function OwnerRedirectGuard({ children }: { children: ReactNode }) {
  const { isOwner, isLoading } = useIsAppOwner();
  const location = useLocation();

  const params = new URLSearchParams(location.search);
  const previewQuery = params.get(BROKER_PREVIEW_PARAM);

  // Set the preview flag synchronously during render, not only in useEffect.
  // Otherwise a fast click from /broker/portal?preview=1 to /broker/crm can
  // happen before the effect writes sessionStorage and owners get bounced back.
  if (previewQuery === "1") {
    try { sessionStorage.setItem(PREVIEW_KEY, "1"); } catch {}
  } else if (previewQuery === "0") {
    try { sessionStorage.removeItem(PREVIEW_KEY); } catch {}
  }

  useEffect(() => {
    if (previewQuery === "1") {
      try { sessionStorage.setItem(PREVIEW_KEY, "1"); } catch {}
    } else if (previewQuery === "0") {
      try { sessionStorage.removeItem(PREVIEW_KEY); } catch {}
    }
  }, [previewQuery]);

  if (isLoading) return <>{children}</>;
  if (!isOwner) return <>{children}</>;

  let previewing = previewQuery === "1";
  if (!previewing) {
    try { previewing = sessionStorage.getItem(PREVIEW_KEY) === "1"; } catch {}
  }
  if (previewing) return <>{children}</>;

  return <Navigate to="/owner/crm" replace />;
}
