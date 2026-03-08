import { ReactNode, useEffect, useRef, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { RefreshCw, LogOut, Shield, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";

interface OwnerGuardProps {
  children: ReactNode;
  showLoading?: boolean;
}

/**
 * OwnerGuard - Restricts routes to Owner-only access
 * 
 * After successful verification retry → auto-navigates back to intended route.
 * Shows green/red feedback on retry verification.
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
  const navigate = useNavigate();
  const [loadingTimedOut, setLoadingTimedOut] = useState(false);
  const [retryStatus, setRetryStatus] = useState<"idle" | "success" | "failed">("idle");
  const autoRetryCount = useRef(0);
  const autoRetryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Store intended route for auto-redirect after successful verification
  const intendedRoute = useRef(location.pathname + location.search);

  useEffect(() => {
    intendedRoute.current = location.pathname + location.search;
  }, [location.pathname, location.search]);

  // Auto-redirect when isOwner becomes true
  useEffect(() => {
    if (isOwner && retryStatus === "success") {
      const timer = setTimeout(() => {
        // Already on the right page if OwnerGuard wraps it
        setRetryStatus("idle");
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isOwner, retryStatus]);

  useEffect(() => {
    if (!(authLoading || ownerLoading)) {
      setLoadingTimedOut(false);
      return;
    }
    const timer = window.setTimeout(() => setLoadingTimedOut(true), 8000);
    return () => window.clearTimeout(timer);
  }, [authLoading, ownerLoading, location.pathname]);

  const handleRetry = async () => {
    setRetryStatus("idle");
    await refreshOwnerVerification();
    // Check after a tick
    setTimeout(() => {
      // We read from the auth context via the component re-render
    }, 100);
  };

  // Track retry result
  useEffect(() => {
    if (!ownerLoading && retryStatus === "idle") return;
    if (!ownerLoading && isOwner) {
      setRetryStatus("success");
    } else if (!ownerLoading && ownerError) {
      setRetryStatus("failed");
    }
  }, [ownerLoading, isOwner, ownerError]);

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

  // VISITOR → redirect to auth
  if (!user) {
    const redirectPath = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/auth?redirect=${redirectPath}`} replace />;
  }

  // Owner verification failed — auto-retry up to 3 times silently
  if (ownerError && !isOwner) {
    if (autoRetryCount.current < 3) {
      if (!autoRetryTimer.current) {
        autoRetryTimer.current = setTimeout(() => {
          autoRetryCount.current += 1;
          autoRetryTimer.current = null;
          refreshOwnerVerification();
        }, 2000);
      }
      return (
        <div className="min-h-screen bg-black flex items-center justify-center">
          <div className="text-center px-6">
            <Shield className="w-12 h-12 text-gold animate-pulse mx-auto mb-4" />
            <p className="text-zinc-200 font-medium">Verifying owner access…</p>
            <p className="text-zinc-400 text-sm mt-2">Retrying ({autoRetryCount.current + 1}/3)…</p>
          </div>
        </div>
      );
    }

    // After 3 failed retries, show error UI
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
              onClick={() => {
                autoRetryCount.current = 0;
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

  // AUTHENTICATED but NOT OWNER → AccessDenied
  if (!isOwner) {
    return <Navigate to="/403" replace />;
  }

  // OWNER → allowed
  return <>{children}</>;
};

export default OwnerGuard;

export function useIsOwner(): { isOwner: boolean; isLoading: boolean } {
  const { isOwner, ownerLoading } = useAuth();
  return { isOwner, isLoading: ownerLoading };
}
