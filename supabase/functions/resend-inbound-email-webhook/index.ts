import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Map inbound recipient addresses to service channels
const ADDRESS_TO_SERVICE: Record<string, string> = {
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
    // Extract email from "Name <email>" format
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

  try {
    const payload = await req.json();

    // Resend inbound webhook payload structure
    const from = payload.from || payload.sender || "";
    const to = Array.isArray(payload.to) ? payload.to : [payload.to || ""];
    const subject = payload.subject || "(No Subject)";
    const textBody = payload.text || payload.plain || "";
    const htmlBody = payload.html || "";
    const messageId = payload.message_id || payload.messageId || null;
    const inReplyTo = payload.in_reply_to || payload.inReplyTo || null;

    // Extract sender email
    const fromMatch = from.match(/<([^>]+)>/) || [null, from];
    const senderEmail = (fromMatch[1] || from).trim().toLowerCase();
    const senderName = from.replace(/<[^>]+>/, "").trim() || senderEmail;

    const service = resolveService(to);

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Resolve owner user_id (required for RLS and NOT NULL constraint)
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
        JSON.stringify({ error: "Owner not found" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Find or create thread by sender email
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
      if (threadErr) console.error("Thread insert error:", threadErr);
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

    // Insert inbound message
    if (threadId) {
      const { error: msgErr } = await supabaseClient.from("owner_comm_messages").insert({
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
      });
      if (msgErr) console.error("Message insert error:", msgErr);
    }

    // Create owner notification
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

    console.log(`Inbound email processed: ${senderEmail} → ${service} (thread: ${threadId})`);

    return new Response(
      JSON.stringify({ success: true, threadId }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in resend-inbound-email-webhook:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
