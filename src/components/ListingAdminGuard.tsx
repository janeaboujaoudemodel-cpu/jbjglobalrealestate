import { useEffect, useState, ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

/**
 * ADMIN_EMAIL - the ONLY email allowed to access /listing-admin.
 * Change this if ownership is transferred.
 */
const ADMIN_EMAIL = "janeaboujaoudenails@gmail.com";

interface ListingAdminGuardProps {
  children: ReactNode;
}

/**
 * ListingAdminGuard - Restricts /listing-admin to the designated owner email.
 */
const ListingAdminGuard = ({ children }: ListingAdminGuardProps) => {
  const [status, setStatus] = useState<"checking" | "allowed" | "denied">("checking");

  useEffect(() => {
    let cancelled = false;

    const verify = async (sessionOverride?: any) => {
      const session = sessionOverride || (await supabase.auth.getSession()).data.session;

      if (!session?.user) {
        if (!cancelled) setStatus("denied");
        return;
      }

      const email = session.user.email?.toLowerCase().trim();

      if (email === ADMIN_EMAIL.toLowerCase().trim()) {
        if (!cancelled) setStatus("allowed");
      } else {
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

  if (status === "denied") {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default ListingAdminGuard;
