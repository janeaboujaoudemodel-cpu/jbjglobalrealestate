import { useEffect, useState, ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface ListingAdminGuardProps {
  children: ReactNode;
}

/**
 * ListingAdminGuard - Restricts /listing-admin to users with:
 * 1. "owner" role
 * 2. "admin" role
 * 3. Active entry in listing_admins table
 * 
 * If not authenticated → redirect to /auth with redirect-back
 * If authenticated but unauthorized → redirect to /
 */
const ListingAdminGuard = ({ children }: ListingAdminGuardProps) => {
  const [status, setStatus] = useState<"checking" | "allowed" | "denied" | "unauthenticated">("checking");
  const location = useLocation();

  useEffect(() => {
    let cancelled = false;

    const verify = async (sessionOverride?: any) => {
      const session = sessionOverride || (await supabase.auth.getSession()).data.session;

      // No session = redirect to login
      if (!session?.user) {
        if (!cancelled) setStatus("unauthenticated");
        return;
      }

      const userId = session.user.id;

      try {
        // Check roles in parallel: owner, admin, and listing_admins table
        const [ownerResult, adminResult, listingAdminResult] = await Promise.all([
          supabase.rpc("has_role", { _user_id: userId, _role: "owner" }),
          supabase.rpc("has_role", { _user_id: userId, _role: "admin" }),
          supabase
            .from("listing_admins")
            .select("id")
            .eq("user_id", userId)
            .eq("is_active", true)
            .maybeSingle(),
        ]);

        const isOwner = ownerResult.data === true;
        const isAdmin = adminResult.data === true;
        const isListingAdmin = !!listingAdminResult.data;

        if (isOwner || isAdmin || isListingAdmin) {
          if (!cancelled) setStatus("allowed");
        } else {
          if (!cancelled) setStatus("denied");
        }
      } catch (error) {
        console.error("ListingAdminGuard: Error checking access", error);
        if (!cancelled) setStatus("denied");
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      verify(session);
    });

    verify();

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  if (status === "checking") {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (status === "unauthenticated") {
    // Redirect to auth with redirect-back to current path
    const redirectPath = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/auth?redirect=${redirectPath}`} replace />;
  }

  if (status === "denied") {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ListingAdminGuard;
