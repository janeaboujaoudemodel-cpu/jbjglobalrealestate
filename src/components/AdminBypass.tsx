import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import ComingSoon from "@/pages/ComingSoon";

interface AdminBypassProps {
  children: React.ReactNode;
}

// Public routes that bypass the Coming Soon gate (always accessible)
const PUBLIC_ROUTES = [
  "/install",
  "/vapi-prompt",
  "/areas",
  "/area/",
  "/seller-guide",
  "/seller-listing",
  "/video-builder",
];

/**
 * AdminBypass - Protects the entire site behind a Coming Soon page
 * Only admin/owner/founder roles can access the full site.
 * Certain public routes are always accessible.
 */
const AdminBypass = ({ children }: AdminBypassProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if current route is a public route
  const isPublicRoute = PUBLIC_ROUTES.some(
    (route) => location.pathname === route || location.pathname.startsWith(route)
  );

  // Admin routes require stricter admin verification
  const isAdminRoute = location.pathname.startsWith("/admin");

  // CRM routes have their own access controls
  const isCrmRoute = location.pathname.startsWith("/crm");

  // Video Builder has its own exclusive access gate
  const isVideoBuilderRoute = location.pathname === "/video-builder";

  useEffect(() => {
    const checkAccess = async () => {
      // Public routes are always accessible
      if (isPublicRoute) {
        setHasAccess(true);
        setIsLoading(false);
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();

        // Not logged in - show Coming Soon page
        if (!session?.user) {
          setHasAccess(false);
          setIsLoading(false);
          return;
        }

        // Check for admin/owner/founder roles
        const { data: hasAdminRole } = await supabase
          .rpc("has_role", { _user_id: session.user.id, _role: "admin" });

        const { data: hasOwnerRole } = await supabase
          .rpc("has_role", { _user_id: session.user.id, _role: "owner" });

        // Check CRM admin for comprehensive access
        const { data: isCrmAdmin } = await supabase
          .rpc("is_crm_admin", { _user_id: session.user.id });

        // Check for broker role (can access video builder and some features)
        const { data: hasBrokerRole } = await supabase
          .rpc("has_role", { _user_id: session.user.id, _role: "broker" });

        const hasFullAccess = Boolean(hasAdminRole) || Boolean(hasOwnerRole) || Boolean(isCrmAdmin);
        const hasBrokerAccess = Boolean(hasBrokerRole);

        // Full access for admins/owners/founders, or broker access for specific routes
        setHasAccess(hasFullAccess || hasBrokerAccess);
      } catch (error) {
        console.error("Error checking access:", error);
        setHasAccess(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAccess();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkAccess();
    });

    return () => subscription.unsubscribe();
  }, [location.pathname, isPublicRoute]);

  // CRM routes and Video Builder bypass this gate (they have their own access controls)
  if (isCrmRoute || isVideoBuilderRoute) return <>{children}</>;

  // Show loading spinner
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // No access - show Coming Soon page
  if (!hasAccess) {
    return <ComingSoon />;
  }

  // Authorized users see the full site
  return <>{children}</>;
};

export default AdminBypass;
