import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useForcePasswordChange() {
  const { user } = useAuth();
  const [needsPasswordChange, setNeedsPasswordChange] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState<string>("");

  useEffect(() => {
    const checkAndIncrementLogin = async () => {
      if (!user) {
        setIsLoading(false);
        setNeedsPasswordChange(false);
        return;
      }

      try {
        // Fetch current profile
        const { data: crmProfile, error } = await supabase
          .from("crm_users_profile")
          .select("force_password_change, display_name, login_count")
          .eq("user_id", user.id)
          .single();

        if (error) {
          // No CRM profile = not a CRM user, no force password change needed
          setNeedsPasswordChange(false);
          setIsLoading(false);
          return;
        }

        const currentLoginCount = crmProfile?.login_count ?? 0;
        setUserName(crmProfile?.display_name || "");

        // Increment login count
        await supabase
          .from("crm_users_profile")
          .update({ login_count: currentLoginCount + 1 })
          .eq("user_id", user.id);

        // Force password change on 2nd login (login_count was 1 before increment)
        // 1st login (count=0→1): Founder testing, no force
        // 2nd login (count=1→2): Employee's first real login, FORCE change
        if (crmProfile?.force_password_change === true && currentLoginCount >= 1) {
          setNeedsPasswordChange(true);
        } else {
          setNeedsPasswordChange(false);
        }
      } catch (error) {
        console.error("Error checking password change status:", error);
        setNeedsPasswordChange(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkAndIncrementLogin();
  }, [user]);

  const markPasswordChanged = async () => {
    if (!user) return;

    try {
      await supabase
        .from("crm_users_profile")
        .update({
          force_password_change: false,
          last_password_change: new Date().toISOString(),
          first_login_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      setNeedsPasswordChange(false);
    } catch (error) {
      console.error("Error marking password as changed:", error);
    }
  };

  return {
    needsPasswordChange,
    isLoading,
    userName,
    markPasswordChanged,
    setNeedsPasswordChange,
  };
}
