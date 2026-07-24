// Shared helper: record every live Resend send into the canonical JBJ
// campaign spine (`jbj_campaign_recipients` + `jbj_email_events`).
// Idempotency-key based — safe to call twice for the same logical send.
import { createClient } from "npm:@supabase/supabase-js@2";

export type JbjPortalKind =
  | "brokerage"
  | "developer"
  | "individual_broker"
  | "client_buyer"
  | "client_seller"
  | "career";
export type JbjEntityType =
  | "brokerage"
  | "developer"
  | "individual_broker"
  | "client"
  | "candidate";

export interface JbjRecordArgs {
  portalKind: JbjPortalKind;
  entityType: JbjEntityType;
  entityId?: string | null;
  email: string;
  templateSlug: string;
  templateVersionId?: string | null;
  senderEmail: string;
  replyTo: string;
  subject: string;
  resendMessageId: string | null;
  providerResponse: unknown;
  /** Stable per-intended-email key. Same key = retry of the same intended email. */
  idempotencyKey: string;
  intendedSendId?: string | null;
  workflowInstanceId?: string | null;
  sendCategory?: "campaign" | "transactional" | "reply" | "test" | "legacy";
  threadId?: string | null;
}

function admin() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );
}

/** Record a Resend send in the JBJ spine. Returns recipient row id (or null on failure). */
export async function recordJbjResendSend(args: JbjRecordArgs): Promise<string | null> {
  try {
    const sb = admin();
    const { data, error } = await sb.rpc("jbj_record_resend_send", {
      _portal_kind: args.portalKind,
      _entity_type: args.entityType,
      _entity_id: args.entityId ?? null,
      _email: args.email,
      _template_slug: args.templateSlug,
      _template_version: args.templateVersionId ?? null,
      _sender_email: args.senderEmail,
      _reply_to: args.replyTo,
      _subject: args.subject,
      _resend_message_id: args.resendMessageId,
      _provider_response: (args.providerResponse ?? {}) as any,
      _idempotency_key: args.idempotencyKey,
      _thread_id: args.threadId ?? null,
      _intended_send_id: args.intendedSendId ?? null,
      _workflow_instance_id: args.workflowInstanceId ?? null,
      _send_category: args.sendCategory ?? "campaign",
    });
    if (error) {
      console.error("[jbjSpine] jbj_record_resend_send failed:", error);
      return null;
    }
    return (data as string) ?? null;
  } catch (e) {
    console.error("[jbjSpine] unexpected:", e);
    return null;
  }
}

/**
 * Convenience: build a stable idempotency key for a live send.
 *
 * Contract (Phase 1.5): the key must represent one intended email, not just
 * recipient + template. That allows retries without duplicates while permitting
 * future campaigns/follow-ups to the same recipient/template.
 *
 * Accepts an array of parts for backwards-compat with existing callers.
 */
export function buildIdempotencyKey(parts: (string | null | undefined)[]): string {
  return parts.filter(Boolean).join(":").toLowerCase();
}

export interface IntendedSendKeyArgs {
  portalKind: JbjPortalKind;
  sendType: "campaign" | "transactional" | "reply" | "test" | "follow_up";
  templateSlug: string;
  campaignId?: string | null;
  campaignRecipientId?: string | null;
  workflowInstanceId?: string | null;
  recipientId?: string | null;
  intendedSendId: string;
}

/** Preferred key builder — intended-send-specific. */
export function buildIntendedSendKey(a: IntendedSendKeyArgs): string {
  const scope = a.sendType === "transactional" || a.sendType === "reply"
    ? [a.workflowInstanceId, a.recipientId]
    : [a.campaignId, a.campaignRecipientId || a.recipientId];
  return [a.portalKind, a.sendType, a.templateSlug, ...scope, a.intendedSendId]
    .filter(Boolean)
    .join(":")
    .toLowerCase();
}

export function buildCampaignIntendedSendKey(args: {
  portalKind: JbjPortalKind;
  templateSlug: string;
  campaignId?: string | null;
  campaignRecipientId?: string | null;
  recipientId?: string | null;
  intendedSendId: string;
}) {
  return buildIntendedSendKey({ ...args, sendType: "campaign" });
}

export function buildTransactionalIntendedSendKey(args: {
  portalKind: JbjPortalKind;
  templateSlug: string;
  workflowInstanceId: string;
  recipientId?: string | null;
  intendedSendId: string;
}) {
  return buildIntendedSendKey({ ...args, sendType: "transactional" });
}
