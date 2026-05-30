import { ReactNode, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useIsAppOwner } from "@/hooks/useIsAppOwner";

const PREVIEW_KEY = "jbj_broker_portal_preview";
const PREVIEW_VALUE = "explicit";
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

  // Owner intentionally navigated into /broker/*. Treat any direct hit as a
  // preview session (sticky for the rest of the tab session). They always
  // have the "JBJ Owner" button in the portal header to leave again.
  // Previously this redirected away unless ?preview=1 was present, which
  // broke direct/sidebar navigation to nested pages like /broker/email/setup.
  try { sessionStorage.setItem(PREVIEW_KEY, PREVIEW_VALUE); } catch {}
  return <>{children}</>;
}
