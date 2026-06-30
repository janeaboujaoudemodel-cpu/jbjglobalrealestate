import { useNavigate, useLocation } from "react-router-dom";
import { ShieldX, Home, LogOut, RefreshCw, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { useState, useEffect } from "react";

/**
 * AccessDenied (/403) - Shown when authenticated user is not allowed into the
 * private Owner portal. Styled as emerald + white + champagne, with a smaller
 * inner card so the content never floats on the page background.
 */
const AccessDenied = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut, refreshOwnerVerification, ownerLoading, ownerError, isOwner } = useAuth();
  const [retryResult, setRetryResult] = useState<"idle" | "success" | "failed">("idle");

  const intendedRoute = (location.state as { from?: string })?.from || "/owner";

  useEffect(() => {
    if (isOwner && retryResult === "success") {
      const timer = setTimeout(() => {
        navigate(intendedRoute, { replace: true });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isOwner, retryResult, navigate, intendedRoute]);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Signed out successfully");
      navigate("/");
    } catch {
      toast.error("Failed to sign out");
    }
  };

  const handleRetry = async () => {
    setRetryResult("idle");
    await refreshOwnerVerification();
  };

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
    <div
      data-access-denied-page
      data-surface="emerald"
      className="min-h-screen flex items-center justify-center p-4 sm:p-6"
      style={{
        background: "var(--jj-emerald-ombre, linear-gradient(135deg, #064E3B 0%, #042c1c 58%, #000000 100%))",
        color: "#FFFFFF",
      }}
    >
      <div
        data-no-contrast-guard
        data-surface="emerald"
        className="w-full max-w-lg rounded-[28px] border p-5 sm:p-8 text-center shadow-2xl"
        style={{
          background: "linear-gradient(145deg, rgba(6,78,59,0.92) 0%, rgba(4,44,28,0.96) 56%, rgba(0,0,0,0.86) 100%)",
          borderColor: "rgba(184,149,85,0.62)",
          boxShadow: "0 30px 80px -45px rgba(0,0,0,0.85), inset 0 1px 0 rgba(255,255,255,0.14)",
          color: "#FFFFFF",
        }}
      >
        <div
          className="w-20 h-20 rounded-full border flex items-center justify-center mx-auto mb-6"
          style={{ background: "linear-gradient(135deg, #FDFBF7 0%, #EFE6D6 100%)", borderColor: "#B89555" }}
        >
          <ShieldX className="w-10 h-10" style={{ color: "#064E3B", stroke: "#064E3B" }} />
        </div>

        <h1
          className="text-3xl font-bold mb-4"
          style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}
        >
          Access Denied
        </h1>

        <p className="mb-6 leading-relaxed" style={{ color: "rgba(255,255,255,0.86)" }}>
          This is an Owner-only system. The page you are trying to access is restricted.
        </p>

        {user && (
          <div className="border rounded-2xl p-4 mb-5" style={{ background: "rgba(255,255,255,0.08)", borderColor: "rgba(184,149,85,0.42)" }}>
            <p className="text-sm" style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}>
              You are signed in but do not have access to this page.
            </p>
          </div>
        )}

        {retryResult === "success" && (
          <div className="border rounded-2xl p-4 mb-5 flex items-center gap-3" style={{ background: "rgba(255,255,255,0.08)", borderColor: "rgba(184,149,85,0.42)" }}>
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" style={{ color: "#FFFFFF", stroke: "#FFFFFF" }} />
            <p className="text-sm" style={{ color: "#FFFFFF" }}>Verification successful! Redirecting…</p>
          </div>
        )}

        {retryResult === "failed" && (
          <div className="border rounded-2xl p-4 mb-5 flex items-center gap-3" style={{ background: "rgba(255,255,255,0.08)", borderColor: "rgba(184,149,85,0.42)" }}>
            <XCircle className="w-5 h-5 flex-shrink-0" style={{ color: "#FFFFFF", stroke: "#FFFFFF" }} />
            <p className="text-sm" style={{ color: "#FFFFFF" }}>
              Verification failed{ownerError ? `: ${ownerError}` : ". Please try again."}
            </p>
          </div>
        )}

        {ownerError && retryResult === "idle" && (
          <div className="border rounded-2xl p-4 mb-5" style={{ background: "rgba(255,255,255,0.08)", borderColor: "rgba(184,149,85,0.42)" }}>
            <p className="text-sm" style={{ color: "#FFFFFF" }}>
              Verification issue: {ownerError}
            </p>
          </div>
        )}

        <div className="border rounded-2xl p-4 mb-7" style={{ background: "rgba(239,230,214,0.12)", borderColor: "rgba(184,149,85,0.48)" }}>
          <p className="text-sm" style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}>
            If you believe this is an error, try refreshing your verification or contact the system owner directly.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={() => navigate("/")}
            data-no-contrast-guard
            className="border font-bold"
            style={{ background: "linear-gradient(135deg, #FDFBF7 0%, #EFE6D6 100%)", borderColor: "#B89555", color: "#064E3B", WebkitTextFillColor: "#064E3B" }}
          >
            <Home className="w-4 h-4" />
            Return Home
          </Button>

          <Button
            onClick={handleRetry}
            disabled={ownerLoading}
            data-no-contrast-guard
            className="border font-bold"
            style={{ background: "rgba(255,255,255,0.08)", borderColor: "rgba(184,149,85,0.72)", color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}
          >
            <RefreshCw className={`w-4 h-4 ${ownerLoading ? "animate-spin" : ""}`} />
            Retry Verification
          </Button>

          {user && (
            <Button
              onClick={handleSignOut}
              data-no-contrast-guard
              className="border font-bold"
              style={{ background: "rgba(255,255,255,0.08)", borderColor: "rgba(184,149,85,0.72)", color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </Button>
          )}
        </div>

        <p className="text-xs mt-8" style={{ color: "rgba(255,255,255,0.72)" }}>
          © {new Date().getFullYear()} JBJ Global Real Estate. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default AccessDenied;