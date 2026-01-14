import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useForcePasswordChange() {
  const { user } = useAuth();
  const [needsPasswordChange, setNeedsPasswordChange] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userName, setUserName] = useState<string>("");

  useEffect(() => {
    const checkPasswordChangeRequired = async () => {
      if (!user) {
        setIsLoading(false);
        setNeedsPasswordChange(false);
        return;
      }

      try {
        const { data: crmProfile, error } = await supabase
          .from("crm_users_profile")
          .select("force_password_change, display_name")
          .eq("user_id", user.id)
          .single();

        if (error) {
          // No CRM profile = not a CRM user, no force password change needed
          setNeedsPasswordChange(false);
        } else {
          setNeedsPasswordChange(crmProfile?.force_password_change === true);
          setUserName(crmProfile?.display_name || "");
        }
      } catch (error) {
        console.error("Error checking password change status:", error);
        setNeedsPasswordChange(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkPasswordChangeRequired();
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
