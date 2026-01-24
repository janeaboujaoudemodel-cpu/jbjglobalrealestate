import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import ComingSoon from "@/pages/ComingSoon";

interface AdminBypassProps {
  children: React.ReactNode;
}

// Public routes that bypass the Coming Soon gate (always accessible)
// NOTE: Do NOT include "/" unless matching logic treats it as an exact match.
// These are the public-facing pages that should be reachable on the custom domain and indexable by search engines.
const PUBLIC_ROUTES: string[] = [
  "/",
  "/properties",
  "/project",
  "/communities",
  "/community",
  "/developers",
  "/developer",
  "/areas",
  "/area",
  "/buyer-guide",
  "/seller-guide",
  "/rent-guide",
  "/tenant-guide",
  "/landlord-guide",
  "/partners",
  "/faq",
  "/quiz",
  "/quiz-results",
  "/contact",
  "/about",
  "/services",
  "/mortgage-calculator",
  "/market-report",
  "/market-intelligence",
  "/terms",
  "/privacy",
  "/cookies",
  "/trust-and-audit-center",
  "/founder",
  "/awards",
  "/press-kit",
  "/company-profile",
  "/news",
  "/install",
];

function matchesPublicRoute(pathname: string, route: string) {
  if (route === "/") return pathname === "/";
  return pathname === route || pathname.startsWith(`${route}/`);
}

/**
 * AdminBypass - Protects the entire site behind a Coming Soon page
 * Only admin/owner/founder roles can access the full site.
 * Certain public routes are always accessible.
 */
const AdminBypass = ({ children }: AdminBypassProps) => {
  const location = useLocation();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if current route is a public route
  const isPublicRoute = PUBLIC_ROUTES.some((route) =>
    matchesPublicRoute(location.pathname, route)
  );

  // Admin routes require stricter admin verification
  const isAdminRoute = location.pathname.startsWith("/admin");

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

        // Check for listing_admin role 
        const { data: hasListingAdminRole } = await supabase
          .rpc("has_role", { _user_id: session.user.id, _role: "listing_admin" });

        const hasFullAccess =
          Boolean(hasAdminRole) ||
          Boolean(hasOwnerRole) ||
          Boolean(isCrmAdmin) ||
          Boolean(hasListingAdminRole);

        const hasBrokerAccess = Boolean(hasBrokerRole);

        // Admin routes require FULL access only (never broker-only)
        if (isAdminRoute) {
          setHasAccess(hasFullAccess);
          return;
        }

        // Otherwise: allow full access, or broker access (internal users)
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
  }, [location.pathname, isPublicRoute, isAdminRoute]);

  // PUBLIC routes bypass immediately - no loading state needed
  if (isPublicRoute) {
    return <>{children}</>;
  }

  // Show loading spinner ONLY for non-public routes while checking access
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
