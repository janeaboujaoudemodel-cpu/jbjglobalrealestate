import { Navigate, useLocation } from "react-router-dom";

/**
 * Redirect that preserves the query string and hash so deep links survive.
 * Use for canonical-URL consolidation (e.g. /brokers → /team?dept=sales).
 */
export function RedirectWithSearch({ to }: { to: string }) {
  const { search, hash } = useLocation();
  return <Navigate to={`${to}${search}${hash}`} replace />;
}
