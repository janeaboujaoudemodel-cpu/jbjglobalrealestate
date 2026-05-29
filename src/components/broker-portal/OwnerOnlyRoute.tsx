import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useIsAppOwner } from "@/hooks/useIsAppOwner";

/**
 * Owner-only inner guard for routes mounted inside the broker portal shell
 * (e.g. /broker/forms). Brokers and other non-owner users get bounced back
 * to /broker/portal so they cannot reach owner-only surfaces by deep link.
 */
export default function OwnerOnlyRoute({ children }: { children: ReactNode }) {
  const { isOwner, isLoading } = useIsAppOwner();
  if (isLoading) return null;
  if (!isOwner) return <Navigate to="/broker/portal" replace />;
  return <>{children}</>;
}
