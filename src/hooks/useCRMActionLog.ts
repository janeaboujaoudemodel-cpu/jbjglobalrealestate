import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type ActionType = "whatsapp" | "email" | "call" | "video" | "chat";

interface LogActionParams {
  actionType: ActionType;
  targetName?: string;
  targetContact?: string;
  leadId?: string;
  employeeId?: string;
  notes?: string;
}

export const useCRMActionLog = () => {
  const logAction = useCallback(async (params: LogActionParams) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.warn("No authenticated user for action logging");
        return null;
      }

      const { data, error } = await supabase
        .from("crm_action_logs")
        .insert({
          user_id: user.id,
          action_type: params.actionType,
          target_name: params.targetName,
          target_contact: params.targetContact,
          lead_id: params.leadId,
          employee_id: params.employeeId,
          notes: params.notes,
        })
        .select()
        .single();

      if (error) {
        console.error("Failed to log action:", error);
        return null;
      }

      return data;
    } catch (err) {
      console.error("Action log error:", err);
      return null;
    }
  }, []);

  return { logAction };
};
