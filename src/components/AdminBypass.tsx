import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface AdminBypassProps {
  children: React.ReactNode;
}

/**
 * AdminBypass - Now only protects /admin routes
 * The public site is fully accessible to all users.
 * Admin routes require admin role verification.
 */
const AdminBypass = ({ children }: AdminBypassProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Routes that require admin access
  const isAdminRoute = location.pathname.startsWith("/admin");

  // CRM routes have their own access controls
  const isCrmRoute = location.pathname.startsWith("/crm");

  // Video Builder has its own exclusive access gate
  const isVideoBuilderRoute = location.pathname === "/video-builder";

  useEffect(() => {
    // Only check admin status for admin routes
    if (!isAdminRoute) {
      setIsLoading(false);
      setIsAdmin(true); // Not needed for non-admin routes
      return;
    }

    const checkAdminStatus = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        // If not logged in, send to login (prevents "dead" admin pages)
        if (!session?.user) {
          setIsAdmin(false);
          setIsLoading(false);
          navigate(`/auth?redirect=${encodeURIComponent(location.pathname)}`);
          return;
        }

        // Check multiple roles: admin, owner, founder
        const { data: hasAdminRole } = await supabase
          .rpc("has_role", { _user_id: session.user.id, _role: "admin" });

        const { data: hasOwnerRole } = await supabase
          .rpc("has_role", { _user_id: session.user.id, _role: "owner" });

        // Also check CRM admin status for comprehensive access
        const { data: isCrmAdmin } = await supabase
          .rpc("is_crm_admin", { _user_id: session.user.id });

        const hasAccess = Boolean(hasAdminRole) || Boolean(hasOwnerRole) || Boolean(isCrmAdmin);
        setIsAdmin(hasAccess);
      } catch (error) {
        console.error("Error checking admin status:", error);
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAdminStatus();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      if (isAdminRoute) {
        checkAdminStatus();
      }
    });

    return () => subscription.unsubscribe();
  }, [isAdminRoute, location.pathname, navigate]);

  // CRM routes and Video Builder bypass this gate (they have their own access controls)
  if (isCrmRoute || isVideoBuilderRoute) return <>{children}</>;

  // Non-admin routes are always accessible (public site)
  if (!isAdminRoute) return <>{children}</>;

  // Show loading for admin routes
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // For admin routes, require admin access
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Admin Access Required</h1>
          <p className="text-zinc-400 mb-6">You need admin privileges to access this page.</p>
          <a href="/" className="text-gold hover:underline">Return to Home</a>
        </div>
      </div>
    );
  }

  // Admins see the full site
  return <>{children}</>;
};

export default AdminBypass;
