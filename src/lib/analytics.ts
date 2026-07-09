import { supabase } from "@/integrations/supabase/client";

/** Per-tab, stable session id for anonymous journey analytics. */
function getSessionId(): string {
  if (typeof window === "undefined") return "server";
  try {
    let s = sessionStorage.getItem("jbj_ux_session");
    if (!s) {
      s =
        (crypto as any)?.randomUUID?.() ??
        `s_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      sessionStorage.setItem("jbj_ux_session", s);
    }
    return s;
  } catch {
    return "sess_no_storage";
  }
}

/**
 * Lightweight analytics helper. Writes to `user_journey_events`.
 * Never throws, never blocks the UI.
 */
export async function logAnalytics(
  event: string,
  payload: Record<string, unknown> = {},
): Promise<void> {
  try {
    const { data: sess } = await supabase.auth.getSession();
    const uid = sess.session?.user?.id ?? null;
    await supabase.from("user_journey_events").insert({
      user_id: uid,
      session_id: getSessionId(),
      event_type: event,
      event_data: payload as any,
      page_path:
        typeof window !== "undefined"
          ? window.location.pathname + window.location.search
          : "/",
      referrer:
        typeof document !== "undefined" ? document.referrer || null : null,
    });
  } catch {
    /* analytics failure must never break UX */
  }
}
