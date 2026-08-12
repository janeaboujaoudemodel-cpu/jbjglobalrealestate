// Activity log helper for the Admin Email Inbox.
import type { SupabaseClient } from "npm:@supabase/supabase-js@2";

export async function logInboxActivity(
  admin: SupabaseClient,
  entry: {
    event_type: string;
    account_id?: string | null;
    email_id?: string | null;
    status?: "ok" | "warn" | "error";
    message?: string;
    detail?: Record<string, unknown>;
    actor?: string | null;
  },
) {
  try {
    await admin.from("inbox_activity_log").insert({
      event_type: entry.event_type,
      account_id: entry.account_id ?? null,
      email_id: entry.email_id ?? null,
      status: entry.status ?? "ok",
      message: entry.message ?? null,
      detail: entry.detail ?? {},
      actor: entry.actor ?? null,
    });
  } catch (err) {
    console.error("inbox activity log failed", err);
  }
}
