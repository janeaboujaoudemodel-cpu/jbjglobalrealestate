import { useNavigate } from "react-router-dom";
import { ShieldX, Home, LogOut, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

/**
 * AccessDenied (/403) - Shown when authenticated user is NOT the Owner
 * 
 * This page is displayed when:
 * - User is logged in but is not verified as Owner via backend
 * 
 * Identity model:
 * - OWNER = verified via verify-owner edge function (full access)
 * - VISITOR = no auth (public pages only)
 * - AUTHENTICATED but NOT OWNER = blocked (this page)
 */
const AccessDenied = () => {
  const navigate = useNavigate();
  const { user, signOut, refreshOwnerVerification, ownerLoading, ownerError } = useAuth();

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
    await refreshOwnerVerification();
    // If verification succeeds, the user will be able to navigate back
    toast.info("Verification refreshed. Try navigating again.");
  };

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

        {/* Error Info */}
        {ownerError && (
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
