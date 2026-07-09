import { supabase } from "@/integrations/supabase/client";

/**
 * Lightweight analytics helper. Writes to `user_journey_events` (existing
 * append-only table). Never throws, never blocks the UI.
 */
export async function logAnalytics(
  event: string,
  payload: Record<string, unknown> = {},
): Promise<void> {
  try {
    const { data: sess } = await supabase.auth.getSession();
    const uid = sess.session?.user?.id ?? null;
    await supabase.from("user_journey_events" as any).insert({
      user_id: uid,
      event_type: event,
      event_data: payload,
      page_url: typeof window !== "undefined" ? window.location.pathname : null,
    } as any);
  } catch {
    /* analytics failure must never break UX */
  }
}
