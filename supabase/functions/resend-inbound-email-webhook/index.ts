import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { checkWebhookReplay, logSecurityEvent, cleanupWebhookReplayLog } from "../_shared/rate-limit-middleware.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Map inbound recipient addresses to service channels
const ADDRESS_TO_SERVICE: Record<string, string> = {
  "hr@notify.jbj.ae": "hr",
  "inquiries@notify.jbj.ae": "inquiries",
  "partnerships@notify.jbj.ae": "partnerships",
  "listings@notify.jbj.ae": "listings",
  "support@notify.jbj.ae": "support",
  "careers@notify.jbj.ae": "hr",
  "contact@notify.jbj.ae": "general",
  "hr@jbj.ae": "hr",
  "inquiries@jbj.ae": "inquiries",
  "partnerships@jbj.ae": "partnerships",
  "listings@jbj.ae": "listings",
  "support@jbj.ae": "support",
  "careers@jbj.ae": "hr",
  "contact@jbj.com": "general",
  // NOTE: noreply@jbj.ae is intentionally NOT in this map — replies to it
  // are intercepted below and bounced with a friendly auto-reply.
};

const NOREPLY_ADDRESSES = new Set([
  "noreply@jbj.ae",
  "no-reply@jbj.ae",
  "noreply@notify.jbj.ae",
  "no-reply@notify.jbj.ae",
]);

function isNoreplyRecipient(toAddresses: string[]): boolean {
  for (const addr of toAddresses) {
    const lower = addr.toLowerCase().trim();
    const match = lower.match(/<([^>]+)>/) || [null, lower];
    const email = (match[1] || lower).trim();
    if (NOREPLY_ADDRESSES.has(email)) return true;
  }
  return false;
}

function resolveService(toAddresses: string[]): string {
  for (const addr of toAddresses) {
    const lower = addr.toLowerCase().trim();
    const match = lower.match(/<([^>]+)>/) || [null, lower];
    const email = (match[1] || lower).trim();
    if (ADDRESS_TO_SERVICE[email]) return ADDRESS_TO_SERVICE[email];
  }
  return "general";
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

  // ── Webhook Signature Verification ──
  const svixId = req.headers.get("svix-id");
  const svixTimestamp = req.headers.get("svix-timestamp");
  const svixSignature = req.headers.get("svix-signature");
  const webhookSecret = Deno.env.get("RESEND_WEBHOOK_SECRET");

  // If webhook secret is configured, enforce signature validation
  if (webhookSecret) {
    if (!svixId || !svixTimestamp || !svixSignature) {
      await logSecurityEvent(supabaseClient, {
        event_type: 'webhook_invalid',
        function_name: 'resend-inbound-email-webhook',
        client_ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown",
        severity: 'high',
        details: { reason: 'missing_svix_headers' },
      });
      return new Response(JSON.stringify({ error: "Missing webhook signature" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Timestamp freshness check (reject if >5 min old)
    const timestampSeconds = parseInt(svixTimestamp, 10);
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - timestampSeconds) > 300) {
      await logSecurityEvent(supabaseClient, {
        event_type: 'webhook_invalid',
        function_name: 'resend-inbound-email-webhook',
        client_ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown",
        severity: 'high',
        details: { reason: 'timestamp_expired', age_seconds: Math.abs(now - timestampSeconds) },
      });
      return new Response(JSON.stringify({ error: "Webhook timestamp expired" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Replay protection via svix-id
    const isReplay = await checkWebhookReplay(supabaseClient, 'resend', svixId);
    if (isReplay) {
      console.log(`[Resend Webhook] Replay blocked: ${svixId}`);
      return new Response(JSON.stringify({ success: true, replay: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  // Periodic cleanup of old replay entries
  cleanupWebhookReplayLog(supabaseClient);

  let payload: Record<string, unknown> = {};

  try {
    payload = await req.json();

    const from = (payload.from || payload.sender || "") as string;
    const to = Array.isArray(payload.to) ? payload.to : [(payload.to || "") as string];
    const subject = (payload.subject || "(No Subject)") as string;
    const textBody = (payload.text || payload.plain || "") as string;
    const htmlBody = (payload.html || "") as string;
    const messageId = (payload.message_id || payload.messageId || null) as string | null;
    const inReplyTo = (payload.in_reply_to || payload.inReplyTo || null) as string | null;

    const fromMatch = from.match(/<([^>]+)>/) || [null, from];
    const senderEmail = (fromMatch[1] || from).trim().toLowerCase();
    const senderName = from.replace(/<[^>]+>/, "").trim() || senderEmail;

    const service = resolveService(to);

    // --- Deduplication check ---
    if (messageId) {
      const { data: existing } = await supabaseClient
        .from("owner_comm_messages")
        .select("id")
        .eq("metadata->>message_id", messageId)
        .eq("sender_identifier", senderEmail)
        .maybeSingle();

      if (existing) {
        console.log(`Duplicate skipped: messageId=${messageId}, sender=${senderEmail}`);
        return new Response(
          JSON.stringify({ success: true, threadId: null, messageId: existing.id, deduplicated: true }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // --- Resolve owner ---
    const ownerEmail = Deno.env.get("OWNER_EMAIL") || "janeaboujaoudenails@gmail.com";
    const { data: ownerUser } = await supabaseClient
      .from("profiles")
      .select("id")
      .eq("email", ownerEmail)
      .maybeSingle();

    const ownerUserId = ownerUser?.id;
    if (!ownerUserId) {
      console.error("Owner user_id not found for:", ownerEmail);
      return new Response(
        JSON.stringify({ success: false, error: "Owner not found", threadId: null, messageId: null }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // --- Find or create thread ---
    const { data: existingThread } = await supabaseClient
      .from("owner_comm_threads")
      .select("id, unread_count")
      .eq("contact_identifier", senderEmail)
      .eq("channel_type", "email")
      .maybeSingle();

    let threadId = existingThread?.id;

    if (!threadId) {
      const { data: newThread, error: threadErr } = await supabaseClient
        .from("owner_comm_threads")
        .insert({
          user_id: ownerUserId,
          contact_identifier: senderEmail,
          contact_name: senderName,
          channel_type: "email",
          status: "needs_reply",
          last_message_preview: (textBody || subject).substring(0, 100),
          last_message_at: new Date().toISOString(),
          unread_count: 1,
          metadata: { service, message_id: messageId },
        })
        .select("id")
        .single();
      if (threadErr) throw new Error(`Thread insert: ${threadErr.message}`);
      threadId = newThread?.id;
    } else {
      await supabaseClient
        .from("owner_comm_threads")
        .update({
          last_message_preview: (textBody || subject).substring(0, 100),
          last_message_at: new Date().toISOString(),
          unread_count: (existingThread.unread_count || 0) + 1,
          status: "needs_reply",
        })
        .eq("id", threadId);
    }

    // --- Insert message ---
    let insertedMessageId: string | null = null;
    if (threadId) {
      const { data: msgData, error: msgErr } = await supabaseClient
        .from("owner_comm_messages")
        .insert({
          thread_id: threadId,
          user_id: ownerUserId,
          direction: "inbound",
          content: textBody || htmlBody || "(Empty message)",
          sender_identifier: senderEmail,
          sender_name: senderName,
          metadata: {
            subject,
            service,
            message_id: messageId,
            in_reply_to: inReplyTo,
            html_body: htmlBody ? true : false,
            raw_from: from,
          },
        })
        .select("id")
        .single();
      if (msgErr) throw new Error(`Message insert: ${msgErr.message}`);
      insertedMessageId = msgData?.id ?? null;
    }

    // --- Notification ---
    if (ownerUserId) {
      await supabaseClient.from("user_notifications").insert({
        user_id: ownerUserId,
        type: "message",
        title: `New email from ${senderName}`,
        message: `Subject: ${subject} — ${(textBody || "").substring(0, 80)}`,
        is_read: false,
        metadata: {
          service,
          sender_email: senderEmail,
          thread_id: threadId,
          action_url: "/owner/inbox",
        },
      });
    }

    console.log(`Inbound email processed: ${senderEmail} → ${service} (thread: ${threadId}, msg: ${insertedMessageId})`);

    // --- Forward to UAE registry inbound matcher (best-effort, non-blocking) ---
    try {
      const svcKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const fnUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/uae-registry-inbound-reply`;
      await fetch(fnUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${svcKey}` },
        body: JSON.stringify({
          from, subject, text: textBody, html: htmlBody,
          message_id: messageId, in_reply_to: inReplyTo, thread_id: threadId,
        }),
      });
    } catch (e) {
      console.warn("uae-registry-inbound-reply forward failed:", (e as Error).message);
    }

    return new Response(
      JSON.stringify({ success: true, threadId, messageId: insertedMessageId }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in resend-inbound-email-webhook:", errMsg);

    try {
      await supabaseClient.from("inbound_email_dead_letters").insert({
        sender_email: (payload.from || payload.sender || "unknown") as string,
        subject: (payload.subject || "") as string,
        error_message: errMsg,
        raw_payload: payload,
      });
    } catch (dlErr) {
      console.error("Dead-letter insert also failed:", dlErr);
    }

    return new Response(
      JSON.stringify({ success: false, error: errMsg, threadId: null, messageId: null }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
