import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface AdminBypassProps {
  children: React.ReactNode;
}

/**
 * AdminBypass - Only protects /admin routes now.
 * The public site loads normally for everyone.
 */
const AdminBypass = ({ children }: AdminBypassProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);

  const isAdminRoute = location.pathname.startsWith("/admin");

  useEffect(() => {
    // Non-admin routes: render immediately, no access check needed
    if (!isAdminRoute) {
      setHasAccess(true);
      return;
    }

    let cancelled = false;

    const checkAdminAccess = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.user) {
          if (!cancelled) {
            setHasAccess(false);
            // No loaders/portals: just send to login.
            navigate("/auth", { replace: true });
          }
          return;
        }

        const userId = session.user.id;

        const [hasAdminRoleRes, hasOwnerRoleRes, isCrmAdminRes, hasListingAdminRoleRes] =
          await Promise.all([
            supabase.rpc("has_role", { _user_id: userId, _role: "admin" }),
            supabase.rpc("has_role", { _user_id: userId, _role: "owner" }),
            supabase.rpc("is_crm_admin", { _user_id: userId }),
            supabase.rpc("has_role", { _user_id: userId, _role: "listing_admin" }),
          ]);

        const hasAdminRole = hasAdminRoleRes.data;
        const hasOwnerRole = hasOwnerRoleRes.data;
        const isCrmAdmin = isCrmAdminRes.data;
        const hasListingAdminRole = hasListingAdminRoleRes.data;

        const hasFullAccess =
          Boolean(hasAdminRole) ||
          Boolean(hasOwnerRole) ||
          Boolean(isCrmAdmin) ||
          Boolean(hasListingAdminRole);

        if (!cancelled) {
          setHasAccess(hasFullAccess);
          if (!hasFullAccess) {
            // No loader/portal: move them away immediately.
            navigate("/", { replace: true });
          }
        }
      } catch (error) {
        console.error("Error checking admin access:", error);
        if (!cancelled) {
          setHasAccess(false);
          navigate("/", { replace: true });
        }
      }
    };

    checkAdminAccess();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      checkAdminAccess();
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [isAdminRoute, navigate]);

  // Non-admin routes: always render
  if (!isAdminRoute) return <>{children}</>;

  // Admin route: never show a loader/portal.
  // While access is being verified, render the page (we'll redirect if needed).
  if (hasAccess === null) return <>{children}</>;

  // If access is false, we already navigated away.
  if (!hasAccess) return null;

  return <>{children}</>;
};

export default AdminBypass;
