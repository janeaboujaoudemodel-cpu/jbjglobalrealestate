import { ReactNode, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { RefreshCw, LogOut, Shield, AlertTriangle } from "lucide-react";

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
 * This guard now uses centralized owner status from AuthContext only.
 * No duplicate verify-owner calls are made.
 * 
 * NOTE: This is UI-layer protection only.
 * Server-side enforcement is mandatory in Edge Functions + RLS.
 */
const OwnerGuard = ({ children, showLoading = true }: OwnerGuardProps) => {
  const { 
    user, 
    loading: authLoading, 
    ownerLoading, 
    ownerError, 
    isOwner,
    refreshOwnerVerification,
    signOut,
  } = useAuth();
  const location = useLocation();
  const [loadingTimedOut, setLoadingTimedOut] = useState(false);
  const autoRetryCount = useRef(0);
  const autoRetryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!(authLoading || ownerLoading)) {
      setLoadingTimedOut(false);
      return;
    }

    const timer = window.setTimeout(() => {
      setLoadingTimedOut(true);
    }, 8000);

    return () => window.clearTimeout(timer);
  }, [authLoading, ownerLoading, location.pathname]);

  // Show loading state while checking auth OR owner status
  if ((authLoading || ownerLoading) && showLoading) {
    if (!loadingTimedOut) {
      return (
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="text-center px-6">
            <Shield className="w-12 h-12 text-gold animate-pulse mx-auto mb-4" />
            <p className="text-zinc-200 font-medium">Verifying owner access…</p>
            <p className="text-zinc-400 text-sm mt-2">Please wait a moment.</p>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <div className="w-20 h-20 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-10 h-10 text-amber-500" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Still verifying access</h1>
          <p className="text-zinc-300 mb-6">The verification is taking longer than expected. You can retry now.</p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={() => {
                setLoadingTimedOut(false);
                refreshOwnerVerification();
              }}
              className="bg-gold hover:bg-gold/90 text-black font-semibold"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry Verification
            </Button>
            <Button
              onClick={() => signOut()}
              className="bg-white hover:bg-zinc-100 text-black border-2 border-white font-semibold"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // VISITOR (no session) → redirect to auth with redirect-back
  if (!user) {
    const redirectPath = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/auth?redirect=${redirectPath}`} replace />;
  }

  // Owner verification failed with an error - show retry UI instead of redirecting
  if (ownerError && !isOwner) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <div className="w-20 h-20 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-10 h-10 text-amber-500" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">
            Verification Temporarily Unavailable
          </h1>
          <p className="text-zinc-400 mb-2">
            We couldn't verify your owner access at this time.
          </p>
          <p className="text-zinc-500 text-sm mb-6">
            Error: {ownerError}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={() => refreshOwnerVerification()}
              className="bg-gold hover:bg-gold/90 text-black font-semibold"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry Verification
            </Button>
            <Button
              onClick={() => signOut()}
              className="bg-white hover:bg-zinc-100 text-black border-2 border-white font-semibold"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    );
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
  const { isOwner, ownerLoading } = useAuth();
  return { isOwner, isLoading: ownerLoading };
}
