import { useNavigate, useLocation } from "react-router-dom";
import { ShieldX, Home, LogOut, RefreshCw, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useState, useEffect } from "react";

/**
 * AccessDenied (/403) - Shown when authenticated user is NOT the Owner
 * 
 * Features:
 * - Green success / red failure feedback on retry
 * - Auto-redirect back to intended page on success
 */
const AccessDenied = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut, refreshOwnerVerification, ownerLoading, ownerError, isOwner } = useAuth();
  const [retryResult, setRetryResult] = useState<"idle" | "success" | "failed">("idle");

  // Store where user came from (passed via state or fallback to "/")
  const intendedRoute = (location.state as { from?: string })?.from || "/";

  // Auto-redirect on successful verification
  useEffect(() => {
    if (isOwner && retryResult === "success") {
      const timer = setTimeout(() => {
        navigate(intendedRoute, { replace: true });
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [isOwner, retryResult, navigate, intendedRoute]);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Signed out successfully");
      navigate("/");
    } catch (error) {
      toast.error("Failed to sign out");
    }
  };

  const handleRetry = async () => {
    setRetryResult("idle");
    await refreshOwnerVerification();
  };

  // Watch for result after retry
  useEffect(() => {
    if (ownerLoading) return;
    if (retryResult !== "idle") return;
    // Only update after a retry was triggered (not on initial render)
  }, [ownerLoading]);

  // After refreshOwnerVerification completes
  useEffect(() => {
    if (ownerLoading) return;
    if (isOwner) {
      setRetryResult("success");
      toast.success("Verification successful! Redirecting…");
    } else if (ownerError) {
      setRetryResult("failed");
    }
  }, [ownerLoading, isOwner, ownerError]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        {/* Icon */}
        <div className="w-24 h-24 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mx-auto mb-8">
          <ShieldX className="w-12 h-12 text-red-500" />
        </div>

        {/* Title */}
        <h1 
          className="text-3xl font-bold text-white mb-4"
          style={{ fontFamily: "Poppins, sans-serif" }}
        >
          Access Denied
        </h1>

        {/* Message */}
        <p className="text-zinc-400 mb-6 leading-relaxed">
          This is an Owner-only system. The page you are trying to access is restricted.
        </p>

        {/* User Info */}
        {user?.email && (
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 mb-6">
            <p className="text-zinc-500 text-sm mb-1">Signed in as</p>
            <p className="text-white font-medium">{user.email}</p>
          </div>
        )}

        {/* Retry Result Feedback */}
        {retryResult === "success" && (
          <div className="bg-green-500/10 border border-green-500/40 rounded-xl p-4 mb-6 flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
            <p className="text-green-300 text-sm">Verification successful! Redirecting…</p>
          </div>
        )}

        {retryResult === "failed" && (
          <div className="bg-red-500/10 border border-red-500/40 rounded-xl p-4 mb-6 flex items-center gap-3">
            <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <p className="text-red-300 text-sm">
              Verification failed{ownerError ? `: ${ownerError}` : ". Please try again."}
            </p>
          </div>
        )}

        {/* Error Info (only show if no retry result) */}
        {ownerError && retryResult === "idle" && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-6">
            <p className="text-amber-200 text-sm">
              Verification issue: {ownerError}
            </p>
          </div>
        )}

        {/* Notice */}
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-8">
          <p className="text-amber-200 text-sm">
            If you believe this is an error, try refreshing your verification or contact the system owner directly.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={() => navigate("/")}
            variant="primary"
          >
            <Home className="w-4 h-4" />
            Return Home
          </Button>
          
          <Button
            onClick={handleRetry}
            disabled={ownerLoading}
            variant="dark-outline"
          >
            <RefreshCw className={`w-4 h-4 ${ownerLoading ? 'animate-spin' : ''}`} />
            Retry Verification
          </Button>
          
          {user && (
            <Button
              onClick={handleSignOut}
              variant="dark-outline"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          )}
        </div>

        {/* Footer */}
        <p className="text-zinc-600 text-xs mt-12">
          © {new Date().getFullYear()} JBJ Global Real Estate. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default AccessDenied;
