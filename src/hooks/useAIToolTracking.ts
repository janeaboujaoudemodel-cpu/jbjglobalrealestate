/**
 * AI Tool Usage Tracking Hook
 * Logs every tool invocation for analytics & audit intelligence.
 */
import { useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export function useAIToolTracking() {
  const trackToolStart = useCallback(async (toolId: string): Promise<string | null> => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return null;

      const { data, error } = await supabase
        .from("ai_tool_usage_events")
        .insert({
          tool_id: toolId,
          user_id: session.user.id,
          user_role: session.user.user_metadata?.user_role || "unknown",
          status: "pending",
          started_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (error) {
        console.warn("[AIToolTracking] start error:", error.message);
        return null;
      }
      return data?.id ?? null;
    } catch {
      return null;
    }
  }, []);

  const trackToolComplete = useCallback(async (
    eventId: string | null,
    status: "success" | "failure" | "abandoned",
    responseTimeMs?: number,
    errorMessage?: string
  ) => {
    if (!eventId) return;
    try {
      const now = new Date().toISOString();
      await supabase
        .from("ai_tool_usage_events")
        .update({
          status,
          completed_at: now,
          response_time_ms: responseTimeMs ?? null,
          error_message: errorMessage ?? null,
        })
        .eq("id", eventId);
    } catch {
      // Non-blocking — tracking failure should never break the tool
    }
  }, []);

  return { trackToolStart, trackToolComplete };
}
