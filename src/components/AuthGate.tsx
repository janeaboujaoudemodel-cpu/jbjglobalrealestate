import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import PageLoader from "@/components/PageLoader";

interface AuthGateProps {
  children: ReactNode;
}

/**
 * AuthGate — Forces all visitors to log in before accessing main site content.
 * Standalone routes (/auth, /welcome, /card, /sign, /ticket-survey, /403) are NOT wrapped by this.
 */
const AuthGate = ({ children }: AuthGateProps) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Still determining auth state
  if (loading) {
    return <PageLoader />;
  }

  // Not authenticated → redirect to /auth with return URL
  if (!user) {
    const returnTo = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/auth?returnTo=${returnTo}`} replace />;
  }

  // Authenticated → render children
  return <>{children}</>;
};

export default AuthGate;
