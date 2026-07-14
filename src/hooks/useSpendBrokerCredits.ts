import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface SpendResult {
  ok: boolean;
  balance?: number;
  cost?: number;
  reason?: string;
}

/**
 * Client-side wrapper around the spend_broker_credits RPC. Server enforces
 * the actual debit and cost lookup — this hook only invokes and toasts.
 * Feature callers: `const spend = useSpendBrokerCredits(); const r = await spend("ai_lead_draft"); if (!r.ok) return;`
 */
export function useSpendBrokerCredits() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useCallback(
    async (actionKey: string, relatedId?: string): Promise<SpendResult> => {
      if (!user?.id) {
        toast.error("Sign in required");
        return { ok: false, reason: "no_user" };
      }
      const { data, error } = await supabase.rpc("spend_broker_credits", {
        p_action_key: actionKey,
        ...(relatedId ? { p_related_id: relatedId } : {}),
      });
      if (error) {
        toast.error(error.message || "Could not spend credits");
        return { ok: false, reason: error.message };
      }
      const result = (data as SpendResult) ?? { ok: false };
      qc.invalidateQueries({ queryKey: ["broker-credit-wallet", user.id] });
      if (!result.ok) {
        toast.error(
          result.reason === "insufficient_credits"
            ? "You're out of credits. Top up to continue."
            : result.reason || "Action blocked",
        );
      }
      return result;
    },
    [user?.id, qc],
  );
}
