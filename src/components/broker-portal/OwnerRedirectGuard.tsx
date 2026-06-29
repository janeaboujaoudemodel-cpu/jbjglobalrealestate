import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useIsAppOwner } from "@/hooks/useIsAppOwner";
import { useUserModeContext } from "@/contexts/UserModeContext";

export const BROKER_PREVIEW_PARAM = "preview";

/**
 * Wrap /broker/* routes so owners are never accidentally left in broker chrome.
 * Owner → owner dashboard, broker → broker dashboard. Explicit preview remains
 * available only with ?preview=1 for QA.
 */
export default function OwnerRedirectGuard({ children }: { children: ReactNode }) {
  const { isOwner, isLoading } = useIsAppOwner();
  const { mode } = useUserModeContext();
  const location = useLocation();

  const params = new URLSearchParams(location.search);
  const previewQuery = params.get(BROKER_PREVIEW_PARAM);

  // Broker/Investor/Developer mode must render its own portal, even for the
  // real app owner. Redirecting owner-role users regardless of mode created the
  // /broker-dashboard ⇄ /owner blink and left the preview blank.
  if (mode !== "owner") return <>{children}</>;

  if (isLoading) return null;
  if (!isOwner) return <>{children}</>;

  const isPreview = previewQuery === "1";

  if (isPreview) return <>{children}</>;

  const target = location.pathname.startsWith("/broker/crm") ? "/owner/crm" : "/owner";
  return <Navigate to={target} replace />;
}
