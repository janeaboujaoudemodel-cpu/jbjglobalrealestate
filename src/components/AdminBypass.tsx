import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
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
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAdminRoute = location.pathname.startsWith("/admin");

  useEffect(() => {
    // Non-admin routes: render immediately, no access check needed
    if (!isAdminRoute) {
      setHasAccess(true);
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    const checkAdminAccess = async () => {
      setIsLoading(true);

      try {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session?.user) {
          if (!cancelled) {
            setHasAccess(false);
            setIsLoading(false);
          }
          return;
        }

        const { data: hasAdminRole } = await supabase
          .rpc("has_role", { _user_id: session.user.id, _role: "admin" });

        const { data: hasOwnerRole } = await supabase
          .rpc("has_role", { _user_id: session.user.id, _role: "owner" });

        const { data: isCrmAdmin } = await supabase
          .rpc("is_crm_admin", { _user_id: session.user.id });

        const { data: hasListingAdminRole } = await supabase
          .rpc("has_role", { _user_id: session.user.id, _role: "listing_admin" });

        const hasFullAccess =
          Boolean(hasAdminRole) ||
          Boolean(hasOwnerRole) ||
          Boolean(isCrmAdmin) ||
          Boolean(hasListingAdminRole);

        if (!cancelled) setHasAccess(hasFullAccess);
      } catch (error) {
        console.error("Error checking admin access:", error);
        if (!cancelled) setHasAccess(false);
      } finally {
        if (!cancelled) setIsLoading(false);
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
  }, [isAdminRoute]);

  // Non-admin routes: always render
  if (!isAdminRoute) {
    return <>{children}</>;
  }

  // Admin routes: show loading while checking
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-12 h-12 border-3 border-gold/20 border-t-gold rounded-full animate-spin" />
      </div>
    );
  }

  // No admin access - redirect to home
  if (!hasAccess) {
    window.location.href = "/";
    return null;
  }

  return <>{children}</>;
};

export default AdminBypass;
