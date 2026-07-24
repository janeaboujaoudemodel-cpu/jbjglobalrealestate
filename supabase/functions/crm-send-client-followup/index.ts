/**
 * CRM Send Client Follow-up Email — via Resend
 *
 * Client Portal send path for buyer/seller follow-ups. Records every accepted
 * send in the JBJ campaign spine so the dashboard groups by recipient and the
 * mailbox sync can attach replies to the same client folder.
 */
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { sendViaResend } from "../_shared/resendClient.ts";
import { recordJbjResendSend, buildCampaignIntendedSendKey } from "../_shared/jbjSpine.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const OWNER_EMAILS = [
  "janeaboujaoudenails@gmail.com",
  "janeaboujaoudemodel@gmail.com",
  "infoo.jane@gmail.com",
  "helpdesk@jbj.ae",
];

type ClientVariant = "client_buyer_follow_up" | "client_seller_follow_up";

interface Body {
  clientId?: string;
  variant?: ClientVariant;
  testRecipient?: string;
  testClientName?: string;
  overrideEmail?: string;
  subjectOverride?: string;
}

const fallbackTemplate = (variant: ClientVariant) => {
  if (variant === "client_seller_follow_up") {
    return {
      subject: "JBJ seller follow-up",
      html: `<div style="background:#ffffff;padding:28px;font-family:Arial,sans-serif;color:#0F1A16"><div style="max-width:560px;margin:auto;border:1px solid #B89555;padding:24px"><div style="text-align:center"><strong style="letter-spacing:3px">JBJ GLOBAL REAL ESTATE</strong></div><p>Dear {{client_name}},</p><p>Thank you for connecting with JBJ. We are preparing the next step for your property and will follow up with a concise action plan.</p><p>Please reply to {{reply_to}} so your response stays attached to your client folder.</p><p>Regards,<br/>JBJ Client Relations</p></div></div>`,
    };
  }
  return {
    subject: "JBJ buyer follow-up",
    html: `<div style="background:#ffffff;padding:28px;font-family:Arial,sans-serif;color:#0F1A16"><div style="max-width:560px;margin:auto;border:1px solid #B89555;padding:24px"><div style="text-align:center"><strong style="letter-spacing:3px">JBJ GLOBAL REAL ESTATE</strong></div><p>Dear {{client_name}},</p><p>Thank you for your interest. We are reviewing the best-fit opportunities and will share a focused next step shortly.</p><p>Please reply to {{reply_to}} so your response stays attached to your client folder.</p><p>Regards,<br/>JBJ Client Relations</p></div></div>`,
  };
};

const renderTemplate = (text: string, vars: Record<string, string>) =>
  text.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? "");

const displayNameFromEmail = (email: string, fallback: string) => {
  const local = email.trim().toLowerCase().split("@")[0] || "";
  const clean = local.replace(/\+.*$/, "").replace(/[._\-0-9]+/g, " ").trim();
  if (!clean) return fallback;
  return clean.split(/\s+/).slice(0, 2).map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" ");
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("NO_AUTH");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user || !OWNER_EMAILS.includes(user.email || "")) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const service = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const body = (await req.json()) as Body;
    const variant: ClientVariant = body.variant === "client_seller_follow_up" ? "client_seller_follow_up" : "client_buyer_follow_up";
    const isTest = Boolean(body.testRecipient);

    const { data: templateRow } = await service
      .from("crm_email_templates")
      .select("subject,html")
      .eq("variant", variant)
      .maybeSingle();
    const template = templateRow || fallbackTemplate(variant);

    let client: any = null;
    let recipient = "";
    if (isTest && !body.clientId) {
      recipient = body.testRecipient || "";
      client = { id: null, client_name: body.testClientName || displayNameFromEmail(recipient, "Test Client") };
    } else {
      if (!body.clientId) throw new Error("clientId required");
      const { data: found, error } = await service
        .from("client_investors")
        .select("id,client_name,email,phone,project_name,unit_type")
        .eq("id", body.clientId)
        .single();
      if (error || !found) throw new Error("Client not found");
      client = found;
      recipient = (isTest ? body.testRecipient : (body.overrideEmail || found.email || "")).trim();
    }

    if (!recipient || !recipient.includes("@")) {
      return new Response(JSON.stringify({ error: "No email on file. Edit client to add one." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const fromName = "JBJ Global Real Estate";
    const fromEmail = "helpdesk@jbj.ae";
    const replyTo = "helpdesk@jbj.ae";
    const clientName = client?.client_name || displayNameFromEmail(recipient, "Client");
    const vars = {
      client_name: clientName,
      salutation: clientName,
      project_name: client?.project_name || "",
      unit_type: client?.unit_type || "",
      reply_to: replyTo,
      reply_to_display: replyTo.toUpperCase(),
      from_name: fromName,
      sender_name: fromName,
    };
    const html = renderTemplate(template.html, vars)
      .replace(/\b(?:contact|info|helpdesk)@jbj\.ae\b/gi, replyTo)
      .replace(/JBJ Global Real Estate/g, "JBJ Global Real Estate");
    const baseSubject = isTest && body.subjectOverride?.trim() ? body.subjectOverride.trim() : template.subject;
    const renderedSubject = renderTemplate(baseSubject, vars);
    const subject = isTest ? `[TEST] ${renderedSubject.replace(/^\[TEST\]\s*/i, "")}` : renderedSubject;

    const resendResult = await sendViaResend({
      from: `${fromName} <${fromEmail}>`,
      to: recipient,
      reply_to: replyTo,
      subject,
      html,
      headers: {
        "X-JBJ-Outreach": isTest ? "client-followup-test" : "client-followup",
        "X-JBJ-Variant": variant,
      },
      tags: [
        { name: "variant", value: variant },
        { name: "portal", value: variant === "client_seller_follow_up" ? "client_seller" : "client_buyer" },
        { name: "mode", value: isTest ? "test" : "production" },
      ],
    });

    if (!resendResult.ok) {
      return new Response(JSON.stringify({
        error: resendResult.error || "Client send failed",
        code: "RESEND_CLIENT_SEND_FAILED",
        upstream_status: resendResult.status,
        details: resendResult.data,
        quota: resendResult.quota,
      }), {
        status: resendResult.status >= 400 && resendResult.status < 600 ? resendResult.status : 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const messageId: string | null = resendResult.data?.id || null;
    const portalKind = variant === "client_seller_follow_up" ? "client_seller" : "client_buyer";
    const intendedSendId = `${isTest ? "test" : "campaign"}:${variant}:${client?.id || recipient}:${messageId || crypto.randomUUID()}`;
    await recordJbjResendSend({
      portalKind,
      entityType: "client",
      entityId: client?.id || null,
      email: recipient,
      templateSlug: variant,
      senderEmail: fromEmail,
      replyTo,
      subject,
      resendMessageId: messageId,
      providerResponse: {
        mode: isTest ? "test" : "production",
        status: resendResult.status,
        data: resendResult.data,
        html_preview_text: `From: ${fromName} <${fromEmail}>\nReply-To: ${replyTo}\nSubject: ${subject}\n\nClient follow-up sent from the Client Portal.`,
      },
      intendedSendId,
      sendCategory: isTest ? "test" : "campaign",
      idempotencyKey: buildCampaignIntendedSendKey({
        portalKind,
        templateSlug: variant,
        recipientId: client?.id || recipient,
        intendedSendId,
      }),
    });

    await service.from("crm_relationship_email_log").insert({
      owner_id: user.id,
      entity_type: "client",
      entity_id: client?.id || null,
      direction: "outbound",
      sent_via: "resend",
      external_message_id: messageId,
      thread_id: null,
      from_email: fromEmail,
      to_emails: [recipient],
      subject,
      body_snippet: `${variant === "client_seller_follow_up" ? "Seller" : "Buyer"} follow-up sent to ${clientName}`,
      sent_at: new Date().toISOString(),
    });

    return new Response(JSON.stringify({
      ok: true,
      test: isTest,
      recipient,
      messageId,
      threadId: null,
      from_email: fromEmail,
      reply_to: replyTo,
      sent_via: "resend",
      quota: resendResult.quota,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("crm-send-client-followup error:", e);
    return new Response(JSON.stringify({ error: e?.message || "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});