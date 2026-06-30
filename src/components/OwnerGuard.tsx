import { ReactNode, useEffect, useRef, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserModeContext } from "@/contexts/UserModeContext";
import { isOwnerBackendEmail } from "@/config/ownerEmails";
import { Button } from "@/components/ui/button";
import { RefreshCw, LogOut, Shield, AlertTriangle } from "lucide-react";

interface OwnerGuardProps {
  children: ReactNode;
  showLoading?: boolean;
}

/**
 * OwnerGuard - Restricts all owner/back-end routes to the founder's registered
 * backend inboxes only. Roles, auditors, admins, and cached flags are not
 * sufficient unless the authenticated email matches an owner backend email.
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
  const { mode } = useUserModeContext();
  const location = useLocation();
  const isRegisteredOwnerEmail = isOwnerBackendEmail(user?.email);
  const [loadingTimedOut, setLoadingTimedOut] = useState(false);
  const [showSplash, setShowSplash] = useState(false);
  const [retryStatus, setRetryStatus] = useState<"idle" | "success" | "failed">("idle");
  const autoRetryCount = useRef(0);
  const autoRetryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intendedRoute = useRef(location.pathname + location.search);
  // Once we've verified owner=true for this session, never show the splash again.
  // Persist across in-app navigation so clicking CRM tabs never re-flashes "Verifying access…".
  const ownerVerifiedOnce = useRef<boolean>(
    typeof window !== "undefined" && sessionStorage.getItem("owner_verified_once") === "1"
  );
  // Once we've rendered the protected page even once on this guard instance,
  // never replace it with the dark splash again — token refresh / realtime
  // re-verifications must not cause the page to "blink" between content and
  // the verifying screen. Real downgrades (sign-out, email_mismatch) still
  // fall through to the auth redirect below.
  const hasRenderedRef = useRef(false);
  // Optimistic: trust a persistent localStorage cache for the current user.
  const hasCachedOwner = (() => {
    if (typeof window === "undefined" || !user?.id) return false;
    try {
      const raw = localStorage.getItem(`owner_v2_${user.id}`);
      if (!raw) return false;
      const parsed = JSON.parse(raw);
      return parsed?.ok === true;
    } catch { return false; }
  })();
  useEffect(() => {
    if (isOwner) {
      ownerVerifiedOnce.current = true;
      try { sessionStorage.setItem("owner_verified_once", "1"); } catch {}
    }
  }, [isOwner]);

  useEffect(() => {
    intendedRoute.current = location.pathname + location.search;
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (isOwner && retryStatus === "success") {
      const timer = setTimeout(() => setRetryStatus("idle"), 500);
      return () => clearTimeout(timer);
    }
  }, [isOwner, retryStatus]);

  useEffect(() => {
    if (!(authLoading || ownerLoading)) {
      setLoadingTimedOut(false);
      setShowSplash(false);
      return;
    }
    // 250ms grace period — avoid splash flicker on fast verification
    const grace = window.setTimeout(() => setShowSplash(true), 250);
    const timer = window.setTimeout(() => setLoadingTimedOut(true), 8000);
    return () => {
      window.clearTimeout(grace);
      window.clearTimeout(timer);
    };
  }, [authLoading, ownerLoading, location.pathname]);

  const handleRetry = async () => {
    setRetryStatus("idle");
    await refreshOwnerVerification();
    setTimeout(() => {}, 100);
  };

  useEffect(() => {
    if (!ownerLoading && retryStatus === "idle") return;
    if (!ownerLoading && isOwner) {
      setRetryStatus("success");
    } else if (!ownerLoading && ownerError) {
      setRetryStatus("failed");
    }
  }, [ownerLoading, isOwner, ownerError]);

  // HARD BACK-END VISIBILITY LOCK — evaluated BEFORE any optimistic owner render.
  // Only registered owner backend emails may ever see OwnerGuard content. Cached
  // flags, auditor/admin rows, and stale owner mode cannot bypass this.
  if (user && !isRegisteredOwnerEmail) {
    if (mode === "broker") return <Navigate to="/broker-dashboard" replace />;
    if (mode === "developer") return <Navigate to="/developers-portal" replace />;
    if (mode === "investor") return <Navigate to="/investor-dashboard" replace />;
    return <Navigate to="/403" replace />;
  }

  // A cached owner verification must never leak /owner or /admin while the active
  // perspective is Investor/Broker/Developer.
  if (user && mode !== "owner") {
    const destination =
      mode === "broker" ? "/broker-dashboard" :
      mode === "developer" ? "/developers-portal" :
      "/investor-dashboard";
    return <Navigate to={destination} replace />;
  }

  // During the 250ms grace window, render nothing (avoid splash flash)
  if ((authLoading || ownerLoading) && showLoading && !showSplash) {
    return null;
  }

  // Optimistic render — Owner mode only. If the signed-in email is one of the
  // registered owner backend inboxes, do not show a false /403 while the Edge
  // Function verification catches up. Backend writes/functions remain protected
  // by verify-owner.
  if (
    showLoading &&
    !!user &&
    mode === "owner" &&
    isRegisteredOwnerEmail &&
    (isOwner || ownerVerifiedOnce.current || hasCachedOwner || hasRenderedRef.current || !ownerError)
  ) {
    hasRenderedRef.current = true;
    return <>{children}</>;
  }

  // If we've already rendered children at least once and we're still loading
  // (e.g. a token refresh briefly cleared `user`), keep showing children only
  // while still in Owner mode.
  if (showLoading && mode === "owner" && hasRenderedRef.current && (authLoading || ownerLoading)) {
    return <>{children}</>;
  }

  if ((authLoading || ownerLoading) && showLoading && showSplash) {
    if (!loadingTimedOut) {
      return (
        <div
          data-surface="emerald"
          className="min-h-screen flex items-center justify-center"
          style={{ background: 'var(--jj-emerald-ombre, linear-gradient(135deg, #064E3B 0%, #042c1c 58%, #000000 100%))' }}
        >
          <div className="text-center px-6">
            <Shield className="w-12 h-12 animate-pulse mx-auto mb-4" style={{ color: '#FFFFFF', stroke: '#FFFFFF' }} />
            <p className="font-medium" style={{ color: '#FFFFFF' }}>Verifying access…</p>
            <p className="text-sm mt-2" style={{ color: 'rgba(255,255,255,0.72)' }}>Please wait a moment.</p>
          </div>
        </div>
      );
    }

    return (
      <div
        data-surface="emerald"
        className="min-h-screen flex items-center justify-center p-6"
        style={{ background: 'var(--jj-emerald-ombre, linear-gradient(135deg, #064E3B 0%, #042c1c 58%, #000000 100%))' }}
      >
        <div className="max-w-md text-center rounded-[28px] border p-6" style={{ borderColor: 'rgba(184,149,85,0.62)', background: 'rgba(6,78,59,0.72)' }}>
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: 'linear-gradient(135deg, #FDFBF7 0%, #EFE6D6 100%)' }}>
            <AlertTriangle className="w-10 h-10" style={{ color: '#064E3B', stroke: '#064E3B' }} />
          </div>
          <h1 className="text-2xl font-bold mb-3" style={{ color: '#FFFFFF' }}>Still verifying access</h1>
          <p className="mb-6" style={{ color: 'rgba(255,255,255,0.85)' }}>The verification is taking longer than expected. You can retry now.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={() => {
                setLoadingTimedOut(false);
                refreshOwnerVerification();
              }}
              className="font-semibold"
              style={{ background: 'linear-gradient(135deg, #FDFBF7 0%, #EFE6D6 100%)', color: '#064E3B' }}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry Verification
            </Button>
            <Button
              onClick={() => signOut()}
              className="border font-semibold"
              style={{ background: 'rgba(255,255,255,0.08)', borderColor: 'rgba(184,149,85,0.72)', color: '#FFFFFF' }}
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
        <div
          data-surface="emerald"
          className="min-h-screen flex items-center justify-center"
          style={{ background: 'var(--jj-emerald-ombre, linear-gradient(135deg, #064E3B 0%, #042c1c 58%, #000000 100%))' }}
        >
          <div className="text-center px-6">
            <Shield className="w-12 h-12 animate-pulse mx-auto mb-4" style={{ color: '#FFFFFF', stroke: '#FFFFFF' }} />
            <p className="font-medium" style={{ color: '#FFFFFF' }}>Verifying access…</p>
            <p className="text-sm mt-2" style={{ color: 'rgba(255,255,255,0.72)' }}>Retrying ({autoRetryCount.current + 1}/3)…</p>
          </div>
        </div>
      );
    }

    return (
      <div
        data-surface="emerald"
        className="min-h-screen flex items-center justify-center p-6"
        style={{ background: 'var(--jj-emerald-ombre, linear-gradient(135deg, #064E3B 0%, #042c1c 58%, #000000 100%))' }}
      >
        <div className="max-w-md text-center rounded-[28px] border p-6" style={{ borderColor: 'rgba(184,149,85,0.62)', background: 'rgba(6,78,59,0.72)' }}>
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ background: 'linear-gradient(135deg, #FDFBF7 0%, #EFE6D6 100%)' }}>
            <AlertTriangle className="w-10 h-10" style={{ color: '#064E3B', stroke: '#064E3B' }} />
          </div>
          <h1 className="text-2xl font-bold mb-3" style={{ color: '#FFFFFF' }}>Verification Temporarily Unavailable</h1>
          <p className="mb-2" style={{ color: 'rgba(255,255,255,0.72)' }}>We couldn't verify your access at this time.</p>
          <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.9)' }}>Error: {ownerError}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={() => {
                autoRetryCount.current = 0;
                refreshOwnerVerification();
              }}
              className="font-semibold"
              style={{ background: 'linear-gradient(135deg, #FDFBF7 0%, #EFE6D6 100%)', color: '#064E3B' }}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry Verification
            </Button>
            <Button
              onClick={() => signOut()}
              className="border font-semibold"
              style={{ background: 'rgba(255,255,255,0.08)', borderColor: 'rgba(184,149,85,0.72)', color: '#FFFFFF' }}
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // AUTHENTICATED but NOT A REGISTERED OWNER BACKEND EMAIL → AccessDenied
  if (!isOwner || !isRegisteredOwnerEmail) {
    if (isRegisteredOwnerEmail && mode === "owner") {
      hasRenderedRef.current = true;
      return <>{children}</>;
    }
    return <Navigate to="/403" replace />;
  }

  // REGISTERED OWNER → allowed
  return <>{children}</>;
};

export default OwnerGuard;

export function useIsOwner(): { isOwner: boolean; isLoading: boolean } {
  const { isOwner, ownerLoading } = useAuth();
  return { isOwner, isLoading: ownerLoading };
}
