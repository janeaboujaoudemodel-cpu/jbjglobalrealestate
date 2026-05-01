// Shared audit-log helper for the Communication Hub channels.
// Append-only writes into owner_comm_channel_audit_log via service role.
// Never throws — audit failures must not break the calling flow.

// deno-lint-ignore no-explicit-any
type AdminClient = any;

export type ChannelAuditEvent =
  | "connected"
  | "reconnected"
  | "synced"
  | "sync_failed"
  | "auto_replied"
  | "auto_reply_skipped"
  | "inbound_received";

export interface ChannelAuditInput {
  user_id: string;
  channel_id: string | null;
  channel_type: string;
  identifier?: string | null;
  event_type: ChannelAuditEvent;
  details?: Record<string, unknown>;
}

export async function logChannelAudit(admin: AdminClient, input: ChannelAuditInput): Promise<void> {
  try {
    await admin.from("owner_comm_channel_audit_log").insert({
      user_id: input.user_id,
      channel_id: input.channel_id,
      channel_type: input.channel_type,
      identifier: input.identifier ?? null,
      event_type: input.event_type,
      details: input.details ?? {},
    });
  } catch (err) {
    // Audit logging must never break the primary flow.
    console.warn("[channel-audit] insert failed", err);
  }
}
