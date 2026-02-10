import { useEffect, useState, ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface ListingAdminGuardProps {
  children: ReactNode;
}

/**
 * ListingAdminGuard - Restricts /listing-admin to users with:
 * 1. Verified Owner (from AuthContext - takes precedence, no DB calls needed)
 * 2. "owner" role in user_roles table
 * 3. "admin" role in user_roles table
 * 4. Active entry in listing_admins table
 * 
 * CRITICAL: Waits for BOTH authLoading AND ownerLoading before making any decisions.
 * This prevents race conditions that cause premature redirects to /403.
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
    let retryCount = 0;
    const MAX_RETRIES = 2;

    const verify = async () => {
      // CRITICAL: Wait for BOTH auth AND owner verification to complete
      if (authLoading || ownerLoading) {
        return;
      }

      if (!user) {
        if (!cancelled) setStatus("unauthenticated");
        return;
      }

      // Owner override - if verified as Owner via AuthContext, allow immediately
      if (isOwner) {
        if (!cancelled) setStatus("allowed");
        return;
      }

      // For non-owners, check database roles
      const userId = user.id;

      try {
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

        if (hasOwnerRole || hasAdminRole || isListingAdmin) {
          if (!cancelled) setStatus("allowed");
        } else {
          if (!cancelled) setStatus("denied");
        }
      } catch (error) {
        console.error("ListingAdminGuard: Error checking access", error);
        // Retry on network errors instead of immediately denying
        if (retryCount < MAX_RETRIES && !cancelled) {
          retryCount++;
          console.log(`ListingAdminGuard: Retrying (${retryCount}/${MAX_RETRIES})...`);
          setTimeout(() => { if (!cancelled) verify(); }, 1500);
        } else {
          if (!cancelled) setStatus("denied");
        }
      }
    };

    verify();

    return () => {
      cancelled = true;
    };
  }, [user, authLoading, isOwner, ownerLoading]);

  // CRITICAL: Show loading while EITHER auth OR owner verification is in progress
  // This prevents premature redirect decisions
  if (authLoading || ownerLoading || status === "checking") {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-zinc-400 text-sm">Verifying access...</p>
        </div>
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
