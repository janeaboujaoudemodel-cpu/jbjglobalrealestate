import { ReactNode, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useIsAppOwner } from "@/hooks/useIsAppOwner";

const PREVIEW_KEY = "jbj_broker_portal_preview";
export const BROKER_PREVIEW_PARAM = "preview";

/**
 * Wrap /broker/* routes so owners can intentionally preview the broker portal
 * without surprise navigation. The previous auto-redirect was too aggressive:
 * it could bounce an owner from /broker/crm to /owner/crm immediately after
 * clicking “Log a call”. The explicit Owner Backend button remains the way out.
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

  try { sessionStorage.setItem(PREVIEW_KEY, "1"); } catch {}
  return <>{children}</>;
}
