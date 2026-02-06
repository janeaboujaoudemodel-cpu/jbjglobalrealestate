import { useNavigate } from "react-router-dom";
import { ShieldX, Home, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

/**
 * AccessDenied (/403) - Shown when authenticated user is NOT the Owner
 * 
 * This page is displayed when:
 * - User is logged in
 * - User's email does NOT match OWNER_EMAIL
 * - User attempted to access an Owner-only route
 * 
 * Identity model reminder:
 * - OWNER = auth.email === OWNER_EMAIL (full access)
 * - VISITOR = no auth (public pages only)
 * - AUTHENTICATED but NOT OWNER = blocked (this page)
 */
const AccessDenied = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success("Signed out successfully");
      navigate("/");
    } catch (error) {
      toast.error("Failed to sign out");
    }
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
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 mb-8">
            <p className="text-zinc-500 text-sm mb-1">Signed in as</p>
            <p className="text-white font-medium">{user.email}</p>
          </div>
        )}

        {/* Notice */}
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-8">
          <p className="text-amber-200 text-sm">
            If you believe this is an error, please contact the system owner directly.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={() => navigate("/")}
            className="bg-gold hover:bg-gold/90 text-black font-medium gap-2"
          >
            <Home className="w-4 h-4" />
            Return Home
          </Button>
          
          <Button
            onClick={handleSignOut}
            variant="outline"
            className="border-zinc-700 text-white hover:bg-zinc-800 gap-2"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
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
