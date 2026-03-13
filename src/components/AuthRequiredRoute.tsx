import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import PageLoader from "@/components/PageLoader";

interface AuthRequiredRouteProps {
  children: ReactNode;
}

/**
 * AuthRequiredRoute — wraps Tier 2 routes that fully require login.
 * Redirects unauthenticated users to /auth with returnTo.
 */
const AuthRequiredRoute = ({ children }: AuthRequiredRouteProps) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return <PageLoader />;

  if (!user) {
    const returnTo = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/auth?returnTo=${returnTo}`} replace />;
  }

  return <>{children}</>;
};

export default AuthRequiredRoute;
