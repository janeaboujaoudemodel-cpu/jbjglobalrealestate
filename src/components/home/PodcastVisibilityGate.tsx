import { useState, useEffect, ReactNode } from "react";
import { usePodcastVisibility } from "@/contexts/PodcastVisibilityContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface PodcastVisibilityGateProps {
  children: ReactNode;
}

/**
 * PodcastVisibilityGate - Conditionally renders podcast section based on visibility setting.
 * 
 * Logic:
 * - Admin/Owner: Always sees the podcast section (for testing)
 * - Regular users: Only see it when isPodcastVisible is true
 * - Unauthenticated users: Only see it when isPodcastVisible is true
 */
export const PodcastVisibilityGate = ({ children }: PodcastVisibilityGateProps) => {
  const { isPodcastVisible, isLoading: isVisibilityLoading } = usePodcastVisibility();
  const { user } = useAuth();
  const [isAdminOrOwner, setIsAdminOrOwner] = useState(false);
  const [isCheckingRole, setIsCheckingRole] = useState(true);

  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) {
        setIsAdminOrOwner(false);
        setIsCheckingRole(false);
        return;
      }

      try {
        // Check if user has admin or owner role
        const [adminRes, ownerRes] = await Promise.all([
          supabase.rpc("has_role", { _user_id: user.id, _role: "admin" }),
          supabase.rpc("has_role", { _user_id: user.id, _role: "owner" }),
        ]);

        setIsAdminOrOwner(adminRes.data === true || ownerRes.data === true);
      } catch (error) {
        console.error("Error checking admin status:", error);
        setIsAdminOrOwner(false);
      } finally {
        setIsCheckingRole(false);
      }
    };

    checkAdminStatus();
  }, [user]);

  // While checking visibility or role, don't render
  if (isVisibilityLoading || isCheckingRole) {
    return null;
  }

  // Admin/Owner always sees the podcast section for testing
  if (isAdminOrOwner) {
    return <>{children}</>;
  }

  // Non-admin: only show if visibility is enabled
  if (!isPodcastVisible) {
    return null;
  }

  return <>{children}</>;
};

export default PodcastVisibilityGate;
