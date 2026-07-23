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
  /**
   * Stable per-logical-send key. Same key = same recipient row (upsert).
   * Recommended: `${portal}:${templateSlug}:${entityId ?? email}:${dateBucket}`.
   */
  idempotencyKey: string;
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
 * Contract (Phase 1 correction):
 *   `${portalKind}:${sendType}:${templateSlug}:${templateVersion||'v0'}:${entityId||emailNorm}`
 * where `sendType` is 'live' | 'test'. Live keys collapse repeat sends of the
 * same logical intent (same recipient + same template version) into one spine
 * row. Test keys should include a fresh nonce (timestamp or Resend message id)
 * to allow explicit re-tests.
 *
 * Accepts an array of parts for backwards-compat with existing callers.
 */
export function buildIdempotencyKey(parts: (string | null | undefined)[]): string {
  return parts.filter(Boolean).join(":").toLowerCase();
}

export interface IntendedSendKeyArgs {
  portalKind: JbjPortalKind;
  sendType: "live" | "test";
  templateSlug: string;
  templateVersion?: string | null;
  entityId?: string | null;
  emailNorm?: string | null;
  nonce?: string | null; // only for test sends
}

/** Preferred key builder — intended-send-specific. */
export function buildIntendedSendKey(a: IntendedSendKeyArgs): string {
  const version = a.templateVersion ?? "v0";
  const target = a.entityId ?? (a.emailNorm || "").toLowerCase();
  const base = [a.portalKind, a.sendType, a.templateSlug, version, target];
  if (a.sendType === "test") base.push(a.nonce || String(Date.now()));
  return base.filter(Boolean).join(":").toLowerCase();
}
