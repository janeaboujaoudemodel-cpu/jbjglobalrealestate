import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useOwnerVerification } from "@/hooks/useOwnerVerification";

interface OwnerGuardProps {
  children: ReactNode;
  /** If true, shows loading spinner while checking auth. Default: true */
  showLoading?: boolean;
}

/**
 * OwnerGuard - Restricts routes to Owner-only access
 * 
 * Identity model:
 * - OWNER (verified via edge function) → allowed
 * - VISITOR (no session) → redirect to /auth with redirect-back
 * - AUTHENTICATED but NOT OWNER → redirect to /403 (AccessDenied)
 * 
 * NOTE: This is UI-layer protection only.
 * Server-side enforcement is mandatory in Edge Functions + RLS.
 */
const OwnerGuard = ({ children, showLoading = true }: OwnerGuardProps) => {
  const { user, loading: authLoading } = useAuth();
  const { isOwner, isLoading: ownerLoading } = useOwnerVerification();
  const location = useLocation();

  // Show loading state while checking auth or owner status
  if ((authLoading || ownerLoading) && showLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // VISITOR (no session) → redirect to auth with redirect-back
  if (!user) {
    const redirectPath = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/auth?redirect=${redirectPath}`} replace />;
  }

  // AUTHENTICATED but NOT OWNER → AccessDenied
  if (!isOwner) {
    return <Navigate to="/403" replace />;
  }

  // OWNER → allowed
  return <>{children}</>;
};

export default OwnerGuard;

/**
 * Hook to check if current user is the Owner
 * Use this for conditional rendering in components
 */
export function useIsOwner(): { isOwner: boolean; isLoading: boolean } {
  const { isOwner, isLoading } = useOwnerVerification();
  return { isOwner, isLoading };
}
