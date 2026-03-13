/**
 * Send Owner Email — Edge Function
 * 
 * Sends outbound emails on behalf of the owner using Resend API (company)
 * or falls back to normal mode (personal / no key).
 * 
 * ACCESS: Owner-only (authenticated + email check)
 */
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const OWNER_EMAIL = "janeaboujaoudenails@gmail.com";

interface SendEmailRequest {
  to: string;
  subject: string;
  body: string;
  senderId: string;
  senderName: string;
  senderEmail: string;
  senderTitle: string;
  account: "company" | "personal";
  useResend: boolean;
  alsoNotifyChat?: boolean;
  chatRecipientId?: string;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No auth" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user || user.email !== OWNER_EMAIL) {
      return new Response(JSON.stringify({ error: "Owner access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: SendEmailRequest = await req.json();
    if (!body.to || !body.subject) {
      return new Response(JSON.stringify({ error: "Missing to/subject" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build signature block
    const signatureHtml = `
      <br/><br/>
      <div style="border-top: 1px solid #e5e5e5; padding-top: 16px; margin-top: 16px; font-family: Arial, sans-serif;">
        <p style="margin: 0; font-weight: 600; color: #333;">${body.senderName}</p>
        <p style="margin: 2px 0; font-size: 13px; color: #666;">${body.senderTitle}</p>
        ${body.account === "company" ? '<p style="margin: 2px 0; font-size: 13px; color: #666;">JBJ Global Real Estate</p>' : ''}
        <p style="margin: 2px 0; font-size: 13px; color: #C9A84C;">${body.senderEmail}</p>
      </div>
    `;

    const fullHtml = `<div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">${body.body.replace(/\n/g, '<br/>')}${signatureHtml}</div>`;

    let sendMethod = "normal";
    let resendMessageId: string | null = null;

    // Determine which API key to use
    let apiKey: string | null = null;
    if (body.useResend) {
      if (body.account === "company") {
        apiKey = Deno.env.get("RESEND_API_KEY") || null;
      } else {
        // Personal account uses separate key if configured
        apiKey = Deno.env.get("RESEND_PERSONAL_API_KEY") || null;
      }
    }

    if (apiKey) {
      // Send via Resend API
      const resendPayload = {
        from: `${body.senderName} <${body.senderEmail}>`,
        to: [body.to],
        subject: body.subject,
        html: fullHtml,
        reply_to: body.senderEmail,
      };

      const resendRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(resendPayload),
      });

      if (!resendRes.ok) {
        const errText = await resendRes.text();
        console.error("Resend API error:", errText);
        // Fall back to normal mode
        sendMethod = "normal_fallback";
      } else {
        const resendData = await resendRes.json();
        resendMessageId = resendData.id || null;
        sendMethod = "resend";
      }
    } else {
      sendMethod = "normal";
    }

    // Log to owner_comm_threads/messages for the inbox system
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Find or create outbound thread
    const { data: existingThread } = await serviceClient
      .from("owner_comm_threads")
      .select("id")
      .eq("contact_identifier", body.to.toLowerCase())
      .eq("channel_type", "email")
      .maybeSingle();

    let threadId = existingThread?.id;

    if (!threadId) {
      const { data: newThread } = await serviceClient
        .from("owner_comm_threads")
        .insert({
          user_id: user.id,
          contact_identifier: body.to.toLowerCase(),
          contact_name: body.to,
          channel_type: "email",
          status: "resolved",
          last_message_preview: body.subject.substring(0, 100),
          last_message_at: new Date().toISOString(),
          unread_count: 0,
        })
        .select("id")
        .single();
      threadId = newThread?.id;
    } else {
      await serviceClient
        .from("owner_comm_threads")
        .update({
          last_message_preview: body.subject.substring(0, 100),
          last_message_at: new Date().toISOString(),
          status: "resolved",
        })
        .eq("id", threadId);
    }

    // Insert sent message record
    if (threadId) {
      await serviceClient.from("owner_comm_messages").insert({
        thread_id: threadId,
        user_id: user.id,
        direction: "outbound",
        content: body.body,
        sender_identifier: body.senderEmail,
        sender_name: body.senderName,
        metadata: {
          subject: body.subject,
          send_method: sendMethod,
          resend_message_id: resendMessageId,
          sender_id: body.senderId,
          sender_title: body.senderTitle,
          account: body.account,
        },
      });
    }

    // Cross-notification: also notify in team chat if toggled
    if (body.alsoNotifyChat && body.chatRecipientId) {
      await serviceClient.from("employee_chat_messages").insert({
        channel_id: "email-notifications",
        sender_id: user.id,
        sender_name: body.senderName,
        content: `📧 Email sent to ${body.to}: "${body.subject}"`,
        metadata: { type: "email_notification", thread_id: threadId },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        sendMethod,
        resendMessageId,
        threadId,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("send-owner-email error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
