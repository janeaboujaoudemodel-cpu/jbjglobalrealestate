import { useEffect, useState, ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface ListingAdminGuardProps {
  children: ReactNode;
}

/**
 * ListingAdminGuard - Restricts /listing-admin to users with:
 * 1. Verified Owner (from AuthContext - takes precedence)
 * 2. "owner" role in user_roles table
 * 3. "admin" role in user_roles table
 * 4. Active entry in listing_admins table
 * 
 * If not authenticated → redirect to /auth with redirect-back
 * If authenticated but unauthorized → redirect to /
 */
const ListingAdminGuard = ({ children }: ListingAdminGuardProps) => {
  const { user, loading: authLoading, isOwner, ownerLoading } = useAuth();
  const [status, setStatus] = useState<"checking" | "allowed" | "denied" | "unauthenticated">("checking");
  const location = useLocation();

  useEffect(() => {
    let cancelled = false;

    const verify = async () => {
      // Wait for auth to finish loading
      if (authLoading || ownerLoading) return;

      // No user = redirect to login
      if (!user) {
        if (!cancelled) setStatus("unauthenticated");
        return;
      }

      // Owner override - if verified as Owner, allow immediately
      if (isOwner) {
        if (!cancelled) setStatus("allowed");
        return;
      }

      const userId = user.id;

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

        const hasOwnerRole = ownerResult.data === true;
        const hasAdminRole = adminResult.data === true;
        const isListingAdmin = !!listingAdminResult.data;

        // Owner role (via has_role) or listing manager access
        if (hasOwnerRole || hasAdminRole || isListingAdmin) {
          if (!cancelled) setStatus("allowed");
        } else {
          if (!cancelled) setStatus("denied");
        }
      } catch (error) {
        console.error("ListingAdminGuard: Error checking access", error);
        if (!cancelled) setStatus("denied");
      }
    };

    verify();

    return () => {
      cancelled = true;
    };
  }, [user, authLoading, isOwner, ownerLoading]);

  // Still checking auth or owner status
  if (authLoading || ownerLoading || status === "checking") {
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
