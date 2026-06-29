import { ReactNode, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useIsAppOwner } from "@/hooks/useIsAppOwner";

const PREVIEW_KEY = "jbj_broker_portal_preview";
const PREVIEW_VALUE = "explicit";
export const BROKER_PREVIEW_PARAM = "preview";

/**
 * Wrap /broker/* routes so owners are never accidentally left in broker chrome.
 * Owner → owner dashboard, broker → broker dashboard. Explicit preview remains
 * available only with ?preview=1 for QA.
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
    try { sessionStorage.setItem(PREVIEW_KEY, PREVIEW_VALUE); } catch {}
  } else if (previewQuery === "0") {
    try { sessionStorage.removeItem(PREVIEW_KEY); } catch {}
  }

  useEffect(() => {
    if (previewQuery === "1") {
      try { sessionStorage.setItem(PREVIEW_KEY, PREVIEW_VALUE); } catch {}
    } else if (previewQuery === "0") {
      try { sessionStorage.removeItem(PREVIEW_KEY); } catch {}
    }
  }, [previewQuery]);

  if (isLoading) return <>{children}</>;
  if (!isOwner) return <>{children}</>;

  const isPreview = previewQuery === "1" || (() => {
    try { return sessionStorage.getItem(PREVIEW_KEY) === PREVIEW_VALUE; } catch { return false; }
  })();

  if (isPreview) return <>{children}</>;

  const target = location.pathname.startsWith("/broker/crm") ? "/owner/crm" : "/owner";
  return <Navigate to={target} replace />;

  return <>{children}</>;
}
