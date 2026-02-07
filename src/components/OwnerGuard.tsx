import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

/**
 * OWNER_EMAIL - The single privileged identity
 * Set via environment variable ONLY - no fallback (fail closed)
 */
const OWNER_EMAIL = import.meta.env.VITE_OWNER_EMAIL;

interface OwnerGuardProps {
  children: ReactNode;
  /** If true, shows loading spinner while checking auth. Default: true */
  showLoading?: boolean;
}

/**
 * OwnerGuard - Restricts routes to Owner-only access
 * 
 * Identity model:
 * - OWNER (auth.email === OWNER_EMAIL) → allowed
 * - VISITOR (no session) → redirect to /auth with redirect-back
 * - AUTHENTICATED but NOT OWNER → redirect to /403 (AccessDenied)
 * 
 * NOTE: This is UI-layer protection only.
 * Server-side enforcement is mandatory in Edge Functions + RLS.
 */
const OwnerGuard = ({ children, showLoading = true }: OwnerGuardProps) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Show loading state while checking auth
  if (loading && showLoading) {
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

  // Fail closed if OWNER_EMAIL not configured
  if (!OWNER_EMAIL) {
    console.error('OWNER_EMAIL environment variable not configured');
    return <Navigate to="/403" replace />;
  }

  // AUTHENTICATED but NOT OWNER → AccessDenied
  const userEmail = user.email?.toLowerCase();
  const ownerEmail = OWNER_EMAIL.toLowerCase();
  
  if (userEmail !== ownerEmail) {
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
  const { user, loading } = useAuth();
  
  if (loading) {
    return { isOwner: false, isLoading: true };
  }
  
  if (!user?.email) {
    return { isOwner: false, isLoading: false };
  }
  
  const ownerEmail = import.meta.env.VITE_OWNER_EMAIL;
  if (!ownerEmail) {
    console.error('OWNER_EMAIL environment variable not configured');
    return { isOwner: false, isLoading: false };
  }
  
  const isOwner = user.email.toLowerCase() === ownerEmail.toLowerCase();
  
  return { isOwner, isLoading: false };
}
