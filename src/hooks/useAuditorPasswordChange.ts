import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useAuditorPasswordChange() {
  const { user, isAuditor, isOwner, updatePassword } = useAuth();
  const [needsPasswordChange, setNeedsPasswordChange] = useState(false);
  const [passwordAlreadyChanged, setPasswordAlreadyChanged] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [displayName, setDisplayName] = useState("");

  useEffect(() => {
    if (!user || !isAuditor || isOwner) {
      setIsLoading(false);
      setNeedsPasswordChange(false);
      return;
    }

    const check = async () => {
      try {
        const { data, error } = await supabase
          .from("auditor_profiles")
          .select("force_password_change, password_changed, display_name, total_logins")
          .eq("user_id", user.id)
          .single();

        if (error || !data) {
          setIsLoading(false);
          return;
        }

        setDisplayName((data as any).display_name || "");
        const forceChange = (data as any).force_password_change === true;
        const alreadyChanged = (data as any).password_changed === true;

        setNeedsPasswordChange(forceChange);
        setPasswordAlreadyChanged(alreadyChanged);

        // Increment login count
        await supabase
          .from("auditor_profiles")
          .update({
            total_logins: ((data as any).total_logins || 0) + 1,
            last_login_at: new Date().toISOString(),
          })
          .eq("user_id", user.id);
      } catch {
        // silent
      } finally {
        setIsLoading(false);
      }
    };

    check();
  }, [user, isAuditor, isOwner]);

  const changePassword = useCallback(
    async (newPassword: string) => {
      if (!user) throw new Error("Not authenticated");

      const { error } = await updatePassword(newPassword);
      if (error) throw error;

      // Mark password as changed in auditor_profiles
      await supabase
        .from("auditor_profiles")
        .update({
          force_password_change: false,
          password_changed: true,
          password_changed_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);

      setNeedsPasswordChange(false);
      setPasswordAlreadyChanged(true);
    },
    [user, updatePassword]
  );

  return {
    needsPasswordChange,
    passwordAlreadyChanged,
    isLoading,
    displayName,
    changePassword,
  };
}
