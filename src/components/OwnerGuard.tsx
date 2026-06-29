import { ReactNode, useEffect, useRef, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserModeContext } from "@/contexts/UserModeContext";
import { useAuditorPasswordChange } from "@/hooks/useAuditorPasswordChange";
import { supabase } from "@/integrations/supabase/client";
import { isOwnerBackendEmail } from "@/config/ownerEmails";
import { Button } from "@/components/ui/button";
import { RefreshCw, LogOut, Shield, AlertTriangle, CheckCircle2, XCircle, Ban } from "lucide-react";
import AuditorForcePasswordChange from "@/components/auth/AuditorForcePasswordChange";

interface OwnerGuardProps {
  children: ReactNode;
  showLoading?: boolean;
}

/**
 * OwnerGuard - Restricts routes to Owner or Auditor (read-only) access.
 * Auditors must change password on first login and are blocked if suspended.
 */
const OwnerGuard = ({ children, showLoading = true }: OwnerGuardProps) => {
  const { 
    user, 
    loading: authLoading, 
    ownerLoading, 
    ownerError, 
    isOwner,
    isAuditor,
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

  // Auditor suspend check
  const [isSuspended, setIsSuspended] = useState(false);
  const [suspendChecked, setSuspendChecked] = useState(false);

  // Auditor password change
  const {
    needsPasswordChange,
    isLoading: pwLoading,
    displayName,
    changePassword,
  } = useAuditorPasswordChange();

  useEffect(() => {
    intendedRoute.current = location.pathname + location.search;
  }, [location.pathname, location.search]);

  // Check if auditor is suspended
  useEffect(() => {
    if (!user || !isAuditor || isOwner) {
      setSuspendChecked(true);
      return;
    }

    const checkSuspend = async () => {
      try {
        const { data, error } = await supabase
          .from("auditor_profiles")
          .select("is_suspended, access_expires_at")
          .eq("user_id", user.id)
          .single();

        if (error || !data) {
          setSuspendChecked(true);
          return;
        }

        const suspended = (data as any).is_suspended === true;
        const expired = (data as any).access_expires_at && new Date((data as any).access_expires_at) < new Date();
        setIsSuspended(suspended || !!expired);
      } catch {
        // silent
      } finally {
        setSuspendChecked(true);
      }
    };

    checkSuspend();
  }, [user, isAuditor, isOwner]);

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
  // Only the registered owner email may ever see OwnerGuard content. Cached
  // flags, auditor/admin rows, aliases, and stale owner mode cannot bypass this.
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

  // Optimistic render — Owner mode only. If we already trust this user as owner
  // (current flag, session cache, persistent cache, or this guard rendered once),
  // never block the owner route on a re-verification round-trip.
  if (
    showLoading &&
    !!user &&
    mode === "owner" &&
    isRegisteredOwnerEmail &&
    (isOwner || ownerVerifiedOnce.current || hasCachedOwner || hasRenderedRef.current)
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
        <div className="min-h-screen bg-[#1A1A1A] flex items-center justify-center">
          <div className="text-center px-6">
            <Shield className="w-12 h-12 text-[#1A1A1A] animate-pulse mx-auto mb-4" />
            <p className="text-gray-200 font-medium">Verifying access…</p>
            <p className="text-white/70 text-sm mt-2">Please wait a moment.</p>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-[#1A1A1A] flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <div className="w-20 h-20 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-10 h-10 text-amber-500" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Still verifying access</h1>
          <p className="text-white/85 mb-6">The verification is taking longer than expected. You can retry now.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={() => {
                setLoadingTimedOut(false);
                refreshOwnerVerification();
              }}
              className="bg-[#EFE6D6] hover:bg-[#EFE6D6]/90 text-[#1A1A1A] font-semibold"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry Verification
            </Button>
            <Button
              onClick={() => signOut()}
              className="bg-[#FDFBF7] hover:bg-[#F7F2EA] text-[#1A1A1A] border-2 border-white font-semibold"
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
        <div className="min-h-screen bg-[#1A1A1A] flex items-center justify-center">
          <div className="text-center px-6">
            <Shield className="w-12 h-12 text-[#1A1A1A] animate-pulse mx-auto mb-4" />
            <p className="text-gray-200 font-medium">Verifying access…</p>
            <p className="text-white/70 text-sm mt-2">Retrying ({autoRetryCount.current + 1}/3)…</p>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-[#1A1A1A] flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <div className="w-20 h-20 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-10 h-10 text-amber-500" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Verification Temporarily Unavailable</h1>
          <p className="text-white/70 mb-2">We couldn't verify your access at this time.</p>
          <p className="text-white/90 text-sm mb-6">Error: {ownerError}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={() => {
                autoRetryCount.current = 0;
                refreshOwnerVerification();
              }}
              className="bg-[#EFE6D6] hover:bg-[#EFE6D6]/90 text-[#1A1A1A] font-semibold"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry Verification
            </Button>
            <Button
              onClick={() => signOut()}
              className="bg-[#FDFBF7] hover:bg-[#F7F2EA] text-[#1A1A1A] border-2 border-white font-semibold"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // AUTHENTICATED but NOT THE REGISTERED OWNER → AccessDenied
  if (!isOwner || !isRegisteredOwnerEmail) {
    return <Navigate to="/403" replace />;
  }

  // AUDITOR: Check if suspended
  if (isAuditor && !isOwner) {
    if (!suspendChecked || pwLoading) {
      return (
        <div className="min-h-screen bg-[#1A1A1A] flex items-center justify-center">
          <div className="text-center px-6">
            <Shield className="w-12 h-12 text-[#1A1A1A] animate-pulse mx-auto mb-4" />
            <p className="text-gray-200 font-medium">Checking access status…</p>
          </div>
        </div>
      );
    }

    if (isSuspended) {
      return (
        <div className="min-h-screen bg-[#1A1A1A] flex items-center justify-center p-6">
          <div className="max-w-md text-center">
            <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6">
              <Ban className="w-10 h-10 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-3">Access Suspended</h1>
            <p className="text-white/70 mb-6">
              Your access has been suspended or expired by the administrator. Please contact Jane for assistance.
            </p>
            <Button
              onClick={() => signOut()}
              className="bg-[#FDFBF7] hover:bg-[#F7F2EA] text-[#1A1A1A] border-2 border-white font-semibold"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      );
    }

    if (needsPasswordChange) {
      return (
        <AuditorForcePasswordChange
          displayName={displayName}
          onPasswordChanged={changePassword}
        />
      );
    }
  }

  // REGISTERED OWNER → allowed
  return <>{children}</>;
};

export default OwnerGuard;

export function useIsOwner(): { isOwner: boolean; isLoading: boolean } {
  const { isOwner, ownerLoading } = useAuth();
  return { isOwner, isLoading: ownerLoading };
}
