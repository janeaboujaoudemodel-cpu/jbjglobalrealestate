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
  "contact@jbj.ae": "general",
  "contact@notify.jbj.ae": "general",
  // NOTE: noreply@jbj.ae is intentionally NOT in this map — replies to it
  // are intercepted below and bounced with a friendly auto-reply.
};

// Inboxes that should send a friendly acknowledgement to the sender
// (in addition to ingesting the message into the team inbox).
const CONTACT_ACK_ADDRESSES = new Set([
  "contact@jbj.ae",
  "contact@notify.jbj.ae",
]);

function isContactAckRecipient(toAddresses: string[]): boolean {
  for (const addr of toAddresses) {
    const lower = addr.toLowerCase().trim();
    const match = lower.match(/<([^>]+)>/) || [null, lower];
    const email = (match[1] || lower).trim();
    if (CONTACT_ACK_ADDRESSES.has(email)) return true;
  }
  return false;
}

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

  // Mandatory: webhook secret MUST be configured. Reject otherwise.
  if (!webhookSecret) {
    console.error("RESEND_WEBHOOK_SECRET not configured");
    await logSecurityEvent(supabaseClient, {
      event_type: 'webhook_misconfigured',
      function_name: 'resend-inbound-email-webhook',
      client_ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown",
      severity: 'critical',
      details: { reason: 'missing_webhook_secret' },
    });
    return new Response(JSON.stringify({ error: "Server misconfigured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Enforce signature validation
  {
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

    // --- Intercept replies to noreply@ addresses ---
    if (isNoreplyRecipient(to)) {
      console.log(`[Inbound] Reply to noreply intercepted: from=${senderEmail}, subject=${subject}`);
      const resendApiKey = Deno.env.get("RESEND_API_KEY");
      if (resendApiKey && senderEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(senderEmail)) {
        const friendlyHtml = `<!doctype html><html><body style="margin:0;padding:0;background:#FDFBF7;font-family:Inter,Arial,sans-serif;color:#1A1A1A;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FDFBF7;padding:40px 0;"><tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="background:#F7F2EA;border:1px solid #B89555;border-radius:8px;padding:36px 40px;">
      <tr><td style="font-size:13px;letter-spacing:.18em;text-transform:uppercase;color:#1A1A1A;opacity:.55;padding-bottom:14px;">JBJ Global Real Estate</td></tr>
      <tr><td style="font-size:22px;font-weight:600;color:#1A1A1A;padding-bottom:18px;line-height:1.3;">Thanks for writing in — but this inbox isn't monitored.</td></tr>
      <tr><td style="font-size:14px;line-height:1.7;color:#1A1A1A;padding-bottom:24px;">
        Hi${senderName && senderName !== senderEmail ? ` ${senderName.replace(/[<>&"']/g, "")}` : ""},<br/><br/>
        We received your reply to <strong>noreply@jbj.ae</strong>, but no one on our team checks this address.
        For anything you need — questions, follow-ups, or to reach a real person on the team —
        please write to us at <a href="mailto:contact@jbj.ae" style="color:#1A1A1A;font-weight:600;">contact@jbj.ae</a>
        and we'll get back to you shortly.
      </td></tr>
      <tr><td style="padding-top:8px;border-top:1px solid #B89555;font-size:12px;color:#1A1A1A;opacity:.6;line-height:1.6;">
        With appreciation,<br/><strong>The JBJ Team</strong><br/>
        <a href="mailto:contact@jbj.ae" style="color:#1A1A1A;">contact@jbj.ae</a> · <a href="https://jbj.ae" style="color:#1A1A1A;">jbj.ae</a>
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`;
        try {
          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { "Authorization": `Bearer ${resendApiKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              from: "JBJ Global Real Estate <noreply@jbj.ae>",
              to: [senderEmail],
              reply_to: "contact@jbj.ae",
              subject: `Please write to contact@jbj.ae instead`,
              html: friendlyHtml,
            }),
          });
        } catch (e) {
          console.warn("[Inbound] noreply auto-reply failed:", (e as Error).message);
        }
      }
      // Skip ingesting into the inbox; ack so Resend doesn't retry.
      return new Response(
        JSON.stringify({ success: true, intercepted: "noreply", threadId: null, messageId: null }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // --- Friendly acknowledgement for contact@jbj.ae ---
    // Same branded structure as the noreply bounce, but we ALSO ingest the
    // message into the team inbox below (fire-and-forget ack).
    if (isContactAckRecipient(to)) {
      const resendApiKey = Deno.env.get("RESEND_API_KEY");
      if (resendApiKey && senderEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(senderEmail)) {
        const safeName = senderName && senderName !== senderEmail
          ? ` ${senderName.replace(/[<>&"']/g, "")}`
          : "";
        const safeSubject = (subject || "your message").replace(/[<>&"']/g, "");
        const ackHtml = `<!doctype html><html><body style="margin:0;padding:0;background:#FDFBF7;font-family:Inter,Arial,sans-serif;color:#1A1A1A;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#FDFBF7;padding:40px 0;"><tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="background:#F7F2EA;border:1px solid #B89555;border-radius:8px;padding:36px 40px;">
      <tr><td style="font-size:13px;letter-spacing:.18em;text-transform:uppercase;color:#1A1A1A;opacity:.55;padding-bottom:14px;">JBJ Global Real Estate</td></tr>
      <tr><td style="font-size:22px;font-weight:600;color:#1A1A1A;padding-bottom:18px;line-height:1.3;">Thank you${safeName} — we've received your message.</td></tr>
      <tr><td style="font-size:14px;line-height:1.7;color:#1A1A1A;padding-bottom:24px;">
        We've received your email regarding <strong>${safeSubject}</strong> and a member of our team will get back to you shortly.<br/><br/>
        For anything urgent, please call <a href="tel:+971547167107" style="color:#1A1A1A;font-weight:600;">+971 54 716 7107</a>.
      </td></tr>
      <tr><td style="padding-top:8px;border-top:1px solid #B89555;font-size:12px;color:#1A1A1A;opacity:.6;line-height:1.6;">
        With appreciation,<br/><strong>The JBJ Team</strong><br/>
        <a href="mailto:contact@jbj.ae" style="color:#1A1A1A;">contact@jbj.ae</a> · <a href="https://jbj.ae" style="color:#1A1A1A;">jbj.ae</a>
      </td></tr>
    </table>
  </td></tr></table>
</body></html>`;
        try {
          await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: { "Authorization": `Bearer ${resendApiKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              from: "JBJ Global Real Estate <noreply@jbj.ae>",
              to: [senderEmail],
              reply_to: "contact@jbj.ae",
              subject: `We've received your message — ${safeSubject}`,
              html: ackHtml,
            }),
          });
        } catch (e) {
          console.warn("[Inbound] contact ack failed:", (e as Error).message);
        }
      }
      // Continue to ingestion below — do NOT return.
    }

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
