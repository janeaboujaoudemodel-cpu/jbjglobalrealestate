import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import ComingSoon from "@/pages/ComingSoon";

interface AdminBypassProps {
  children: React.ReactNode;
}

/**
 * AdminBypass - Access gate for the internal portal.
 * 
 * Behavior:
 * - If the visitor is NOT authenticated / not a team member: show the approved ComingSoon page
 * - If the visitor IS a team member: render the app
 */
const AdminBypass = ({ children }: AdminBypassProps) => {
  const location = useLocation();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const checkAccess = async (sessionOverride?: any) => {
      try {
        const session = sessionOverride
          ? sessionOverride
          : (await supabase.auth.getSession()).data.session;

        if (!session?.user) {
          if (!cancelled) {
            setHasAccess(false);
            setIsChecking(false);
          }
          return;
        }

        const userId = session.user.id;

        try {
          const [hasAdminRoleRes, hasOwnerRoleRes, isCrmAdminRes, hasListingAdminRoleRes, hasBrokerRoleRes] =
            await Promise.all([
              supabase.rpc("has_role", { _user_id: userId, _role: "admin" }),
              supabase.rpc("has_role", { _user_id: userId, _role: "owner" }),
              supabase.rpc("is_crm_admin", { _user_id: userId }),
              supabase.rpc("has_role", { _user_id: userId, _role: "listing_admin" }),
              supabase.rpc("has_role", { _user_id: userId, _role: "broker" }),
            ]);

          const hasAdminRole = hasAdminRoleRes.data === true;
          const hasOwnerRole = hasOwnerRoleRes.data === true;
          const isCrmAdmin = isCrmAdminRes.data === true;
          const hasListingAdminRole = hasListingAdminRoleRes.data === true;
          const hasBrokerRole = hasBrokerRoleRes.data === true;

          // Any team member gets full access
          const hasFullAccess =
            hasAdminRole ||
            hasOwnerRole ||
            isCrmAdmin ||
            hasListingAdminRole ||
            hasBrokerRole;

          if (!cancelled) {
            setHasAccess(hasFullAccess);
            setIsChecking(false);
          }
        } catch (rpcError) {
          console.error("RPC error checking roles:", rpcError);
          // If RPC fails but user is authenticated, grant access (prevents false blocks)
          if (!cancelled) {
            setHasAccess(true);
            setIsChecking(false);
          }
        }
      } catch (error) {
        console.error("Error checking access:", error);
        if (!cancelled) {
          setHasAccess(false);
          setIsChecking(false);
        }
      }
    };

    // IMPORTANT: subscribe first, then fetch session (prevents race on page load)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      checkAccess(session);
    });

    checkAccess();

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, [location.pathname]);

  // Still checking access
  if (isChecking) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Has access: render content
  if (hasAccess) return <>{children}</>;

  // No access: show the approved ComingSoon page (single source of truth)
  return <ComingSoon />;
};

export default AdminBypass;