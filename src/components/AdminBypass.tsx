import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import ComingSoon from "@/pages/ComingSoon";

interface AdminBypassProps {
  children: React.ReactNode;
}

// Public routes that bypass the Coming Soon gate (always accessible).
// Per current launch mode: the entire site is gated (except /auth which is defined
// outside of this wrapper in App routes).
const PUBLIC_ROUTES: string[] = [];

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
    let cancelled = false;
    let safetyTimeout: number | undefined;

    const clearSafetyTimeout = () => {
      if (safetyTimeout) window.clearTimeout(safetyTimeout);
      safetyTimeout = undefined;
    };

    const startSafetyTimeout = () => {
      clearSafetyTimeout();
      safetyTimeout = window.setTimeout(() => {
        if (cancelled) return;
        console.warn("[JBJ] Access check timed out; falling back to ComingSoon");
        setHasAccess(false);
        setIsLoading(false);
      }, 3000);
    };

    const checkAccess = async () => {
      startSafetyTimeout();
      if (!cancelled) setIsLoading(true);

      // Public routes are always accessible
      if (isPublicRoute) {
        if (!cancelled) {
          setHasAccess(true);
          setIsLoading(false);
        }
        clearSafetyTimeout();
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();

        // Not logged in - show Coming Soon page
        if (!session?.user) {
          if (!cancelled) {
            setHasAccess(false);
            setIsLoading(false);
          }
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
          if (!cancelled) setHasAccess(hasFullAccess);
          return;
        }

        // Otherwise: allow full access, or broker access (internal users)
        if (!cancelled) setHasAccess(hasFullAccess || hasBrokerAccess);
      } catch (error) {
        console.error("Error checking access:", error);
        if (!cancelled) setHasAccess(false);
      } finally {
        clearSafetyTimeout();
        if (!cancelled) setIsLoading(false);
      }
    };

    checkAccess();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkAccess();
    });

    return () => {
      cancelled = true;
      clearSafetyTimeout();
      subscription.unsubscribe();
    };
  }, [location.pathname, isPublicRoute, isAdminRoute]);

  // PUBLIC routes bypass immediately - no loading state needed
  if (isPublicRoute) {
    return <>{children}</>;
  }

  // Show loading spinner ONLY for non-public routes while checking access
  if (isLoading) {
    // If anything is slow (auth/network), never trap visitors on an infinite spinner.
    return <ComingSoon />;
  }

  // No access - show Coming Soon page
  if (!hasAccess) {
    return <ComingSoon />;
  }

  // Authorized users see the full site
  return <>{children}</>;
};

export default AdminBypass;
