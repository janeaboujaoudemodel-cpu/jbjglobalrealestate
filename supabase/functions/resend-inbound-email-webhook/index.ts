import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Map inbound recipient addresses to service channels
const ADDRESS_TO_SERVICE: Record<string, string> = {
  // notify.jbj.ae subdomain (primary inbound)
  "hr@notify.jbj.ae": "hr",
  "inquiries@notify.jbj.ae": "inquiries",
  "partnerships@notify.jbj.ae": "partnerships",
  "listings@notify.jbj.ae": "listings",
  "support@notify.jbj.ae": "support",
  "careers@notify.jbj.ae": "hr",
  "contact@notify.jbj.ae": "general",
  // Legacy fallbacks (jbj.ae direct — transition period)
  "hr@jbj.ae": "hr",
  "inquiries@jbj.ae": "inquiries",
  "partnerships@jbj.ae": "partnerships",
  "listings@jbj.ae": "listings",
  "support@jbj.ae": "support",
  "careers@jbj.ae": "hr",
  "contact@jbj.com": "general",
  "noreply@jbj.ae": "general",
};

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

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

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

    return new Response(
      JSON.stringify({ success: true, threadId, messageId: insertedMessageId }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : "Unknown error";
    console.error("Error in resend-inbound-email-webhook:", errMsg);

    // --- Dead-letter logging ---
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
