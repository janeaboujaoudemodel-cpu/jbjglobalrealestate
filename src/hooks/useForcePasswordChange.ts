import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useForcePasswordChange() {
  const { user } = useAuth();
  const [needsPasswordChange, setNeedsPasswordChange] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState<string>("");
  const [isFirstLoginAfterPasswordChange, setIsFirstLoginAfterPasswordChange] = useState(false);

  useEffect(() => {
    const checkPasswordStatus = async () => {
      if (!user) {
        setIsLoading(false);
        setNeedsPasswordChange(false);
        return;
      }

      try {
        // Fetch current profile
        const { data: crmProfile, error } = await supabase
          .from("crm_users_profile")
          .select("force_password_change, display_name, login_count, password_changed_at")
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

        // Force password change on FIRST login if flag is set
        // Once password is changed, flag is false and welcome screen shows on next login
        if (crmProfile?.force_password_change === true) {
          setNeedsPasswordChange(true);
          setIsFirstLoginAfterPasswordChange(false);
        } else if (crmProfile?.password_changed_at && currentLoginCount === 1) {
          // This is the first login AFTER password was changed - show welcome screen
          setNeedsPasswordChange(false);
          setIsFirstLoginAfterPasswordChange(true);
        } else {
          setNeedsPasswordChange(false);
          setIsFirstLoginAfterPasswordChange(false);
        }
      } catch (error) {
        console.error("Error checking password change status:", error);
        setNeedsPasswordChange(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkPasswordStatus();
  }, [user]);

  const markPasswordChanged = async () => {
    if (!user) return;

    try {
      await supabase
        .from("crm_users_profile")
        .update({
          force_password_change: false,
          password_changed_at: new Date().toISOString(),
          first_login_at: new Date().toISOString(),
          // Reset login count so next login is "first login after password change"
          login_count: 0,
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
    isFirstLoginAfterPasswordChange,
  };
}
