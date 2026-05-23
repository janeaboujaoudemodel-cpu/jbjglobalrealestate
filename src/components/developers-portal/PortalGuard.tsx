import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { usePortalRole } from "@/hooks/usePortalRole";
import PageLoader from "@/components/PageLoader";

interface Props {
  children: ReactNode;
}

/**
 * PortalGuard — anyone with a portal role (owner / portal_developer /
 * portal_rep) can enter. Anonymous users are sent to /auth.
 * Authenticated users without a portal role are sent to the public
 * rep application page so they can request access.
 */
const PortalGuard = ({ children }: Props) => {
  const { user, loading } = useAuth();
  const { role, isLoading: roleLoading } = usePortalRole();
  const loc = useLocation();

  if (loading || (user && roleLoading)) return <PageLoader />;

  if (!user) {
    const returnTo = encodeURIComponent(loc.pathname + loc.search);
    return <Navigate to={`/auth?returnTo=${returnTo}`} replace />;
  }

  if (!role) {
    // Logged in but no portal access — funnel to the public rep application
    // page (also accessible to anon users) instead of a 403.
    return <Navigate to="/developers-portal/reps/apply" replace />;
  }

  return <>{children}</>;
};

export default PortalGuard;
