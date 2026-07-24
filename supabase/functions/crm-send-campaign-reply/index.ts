import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { sendViaResend } from "../_shared/resendClient.ts";
import { recordJbjResendSend, buildIntendedSendKey, type JbjEntityType, type JbjPortalKind } from "../_shared/jbjSpine.ts";
import { wrapEmailHtml, htmlToPlainText } from "../_shared/email-shell.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const OWNER_EMAILS = new Set([
  "janeaboujaoudenails@gmail.com",
  "janeaboujaoudemodel@gmail.com",
  "infoo.jane@gmail.com",
  "helpdesk@jbj.ae",
]);

function escapeHtml(value: string) {
  return value.replace(/[&<>]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[ch] || ch));
}

function textToBrandedHtml(value: string, identityLabel: string, portalKind: JbjPortalKind) {
  const paragraphs = value
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => escapeHtml(part).replace(/\n/g, "<br/>"));

  const isBrokerage = portalKind === "brokerage";
  const eyebrow = isBrokerage ? "CITI Developers" : "JBJ Global Real Estate";
  const signature = isBrokerage ? "Jane Bou Jaoude" : "JBJ Global Real Estate";
  const role = isBrokerage ? "Sales & Training Department" : "Developer Registration Desk";
  const innerHtml = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
      <tr><td align="center" style="padding:0 0 18px;border-bottom:1px solid #B89555;">
        <div style="font-family:Georgia,'Times New Roman',serif;font-size:22px;line-height:1.2;font-weight:700;color:#064E3B;letter-spacing:0;text-align:center;">${escapeHtml(eyebrow)}</div>
        <div style="font-family:Inter,Arial,sans-serif;font-size:11px;font-weight:800;letter-spacing:.18em;text-transform:uppercase;color:#B89555;margin-top:6px;text-align:center;">${escapeHtml(identityLabel)}</div>
      </td></tr>
      <tr><td style="padding:22px 0 6px;font-family:Inter,Arial,sans-serif;color:#0F1A16;font-size:14px;line-height:1.7;">
        ${paragraphs.map((p) => `<p style="margin:0 0 14px;color:#0F1A16;">${p}</p>`).join("")}
        <p style="margin:22px 0 0;color:#0F1A16;">Regards,<br/><strong>${escapeHtml(signature)}</strong><br/><span style="color:#4B5D55;">${escapeHtml(role)}</span></p>
      </td></tr>
    </table>`;

  return wrapEmailHtml({
    innerHtml,
    preheader: paragraphs[0]?.replace(/<br\/>/g, " ") || "JBJ CRM reply",
    brandColor: "#B89555",
    bgPage: "#FDFBF7",
    bgCard: "#FFFFFF",
    textColor: "#0F1A16",
  });
}

function identity(kind: string) {
  if (kind === "brokerages") {
    return { portalKind: "brokerage" as JbjPortalKind, fromName: "Jane Bou Jaoude", fromEmail: "jane@jbj.ae", replyTo: "jane@jbj.ae" };
  }
  if (kind === "clients") {
    return { portalKind: "client_buyer" as JbjPortalKind, fromName: "JBJ Global Real Estate", fromEmail: "helpdesk@jbj.ae", replyTo: "helpdesk@jbj.ae" };
  }
  return { portalKind: "developer" as JbjPortalKind, fromName: "JBJ Global Real Estate", fromEmail: "helpdesk@jbj.ae", replyTo: "helpdesk@jbj.ae" };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("NO_AUTH");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
      auth: { persistSession: false },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user || !OWNER_EMAILS.has(String(user.email || "").toLowerCase())) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = await req.json();
    const recipientEmail = String(body.recipientEmail || "").trim().toLowerCase();
    const subject = String(body.subject || "Campaign reply").trim();
    const bodyText = String(body.bodyText || "").trim();
    if (!recipientEmail.includes("@")) throw new Error("Recipient email is required");
    if (!bodyText) throw new Error("Reply draft is empty");

    const id = identity(String(body.kind || "developers"));
    const entityType = (body.entityType === "brokerage" || body.entityType === "client" || body.entityType === "developer" ? body.entityType : "developer") as JbjEntityType;
    const entityId = body.entityId || null;
    const service = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });

    const html = textToBrandedHtml(bodyText, id.fromName, id.portalKind);
    const text = htmlToPlainText(html);

    const result = await sendViaResend({
      from: `${id.fromName} <${id.fromEmail}>`,
      to: recipientEmail,
      reply_to: id.replyTo,
      cc: id.portalKind === "developer" ? "infoo.jane@gmail.com" : undefined,
      subject,
      html,
      text,
      headers: { "X-JBJ-Campaign-Reply": "true" },
      tags: [
        { name: "portal", value: id.portalKind },
        { name: "mode", value: "reply" },
      ],
    });
    if (!result.ok) {
      return new Response(JSON.stringify({ error: result.error || "Reply send failed", upstream_status: result.status, details: result.data }), { status: result.status >= 400 && result.status < 600 ? result.status : 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const messageId = result.data?.id || null;
    const intendedSendId = `reply:${body.parentRecipientId || recipientEmail}:${messageId || crypto.randomUUID()}`;
    await recordJbjResendSend({
      portalKind: id.portalKind,
      entityType,
      entityId,
      email: recipientEmail,
      templateSlug: "campaign_reply",
      senderEmail: id.fromEmail,
      replyTo: id.replyTo,
      subject,
      resendMessageId: messageId,
      providerResponse: { mode: "reply", data: result.data, parent_recipient_id: body.parentRecipientId || null, html_preview_text: `From: ${id.fromName} <${id.fromEmail}>\nReply-To: ${id.replyTo}\nSubject: ${subject}\n\n${bodyText}` },
      idempotencyKey: buildIntendedSendKey({ portalKind: id.portalKind, sendType: "reply", templateSlug: "campaign_reply", recipientId: entityId || recipientEmail, workflowInstanceId: body.parentRecipientId || recipientEmail, intendedSendId }),
      intendedSendId,
      workflowInstanceId: body.parentRecipientId || null,
      sendCategory: "reply",
      threadId: body.threadId || null,
    });

    await service.from("crm_relationship_email_log").insert({
      owner_id: user.id,
      entity_type: entityType,
      entity_id: entityId,
      direction: "outbound",
      sent_via: "resend",
      external_message_id: messageId,
      thread_id: body.threadId || null,
      from_email: id.fromEmail,
      to_emails: [recipientEmail],
      subject,
      body_snippet: bodyText.slice(0, 500),
      sent_at: new Date().toISOString(),
    });

    return new Response(JSON.stringify({ ok: true, messageId, recipient: recipientEmail }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message || "Reply send failed" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});