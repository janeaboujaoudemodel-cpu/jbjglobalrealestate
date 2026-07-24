// Sends an automated registration-confirmation email to a developer via Resend.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { sendViaResend } from "../_shared/resendClient.ts";
import { recordJbjResendSend, buildTransactionalIntendedSendKey } from "../_shared/jbjSpine.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FOUNDER_BCC = "infoo.jane@gmail.com";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const jwt = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
    const { data: { user } } = await admin.auth.getUser(jwt);
    if (!user) return new Response(JSON.stringify({ error: "unauthenticated" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const body = await req.json().catch(() => ({}));
    const developerId: string | undefined = body.developer_id;
    const variant: string = body.variant || "registration_confirm"; // or "request_signed_doc"
    if (!developerId) {
      return new Response(JSON.stringify({ error: "developer_id required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: dev } = await admin
      .from("crm_developer_registry")
      .select("id, owner_id, developer_name, developer_email, channel_department_email")
      .eq("id", developerId)
      .maybeSingle();
    if (!dev || dev.owner_id !== user.id) {
      return new Response(JSON.stringify({ error: "developer not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const to = (dev.developer_email || dev.channel_department_email || "").trim();
    if (!to) {
      return new Response(JSON.stringify({ error: "developer has no email on file" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const isDocChase = variant === "request_signed_doc";
    const subject = isDocChase
      ? `Kindly resend the signed agreement — JBJ Global Real Estate × ${dev.developer_name || "your team"}`
      : `Confirming JBJ Global Real Estate registration with ${dev.developer_name || "your team"}`;
    const html = isDocChase
      ? `<p>Dear ${dev.developer_name || "team"},</p>
         <p>Thank you for confirming our registration. For our records, could you please resend us a copy of the fully signed agreement between <strong>JBJ Global Real Estate</strong> and <strong>${dev.developer_name || "your team"}</strong>?</p>
         <p>Kind regards,<br/>JBJ Global Real Estate</p>`
      : `<p>Dear ${dev.developer_name || "team"},</p>
         <p>Following our recently signed agreement, could you please confirm that <strong>JBJ Global Real Estate</strong> is now officially registered as a broker partner with <strong>${dev.developer_name || "your team"}</strong>?</p>
         <p>If a signed registration certificate or document is available, kindly attach it to your reply so we can keep our records aligned.</p>
         <p>Kind regards,<br/>JBJ Global Real Estate</p>`;

    const resendResult = await sendViaResend({
      from: "JBJ Global Real Estate <contact@jbj.ae>",
      to,
      bcc: FOUNDER_BCC,
      reply_to: "helpdesk@jbj.ae",
      subject,
      html,
      tags: [
        { name: "workflow", value: variant },
        { name: "portal", value: "developer" },
      ],
    });
    if (!resendResult.ok) {
      return new Response(JSON.stringify({ ok: false, error: resendResult.error || "Resend send failed", upstream_status: resendResult.status, details: resendResult.data }), {
        status: resendResult.status >= 400 && resendResult.status < 600 ? resendResult.status : 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const messageId = resendResult.data?.id || null;

    // Update developer + log
    await admin
      .from("crm_developer_registry")
      .update({
        registration_status: isDocChase ? "awaiting_document" : "awaiting_confirmation",
        registration_confirmation_sent_at: new Date().toISOString(),
        registration_confirmation_message_id: messageId,
      })
      .eq("id", developerId);

    await admin.from("developer_registration_sync_logs").insert({
      user_id: user.id,
      developer_id: developerId,
      gmail_message_id: messageId,
      gmail_thread_id: null,
      direction: "out",
      outcome: "sent",
      parsed_intent: isDocChase ? "request_signed_doc" : "registration_confirm",
      detail: { to, subject, bcc: FOUNDER_BCC, provider: "resend" },
    });

    const intendedSendId = `transactional:${variant}:${developerId}:${messageId || crypto.randomUUID()}`;
    await recordJbjResendSend({
      portalKind: "developer",
      entityType: "developer",
      entityId: developerId,
      email: to,
      templateSlug: variant,
      senderEmail: "contact@jbj.ae",
      replyTo: "helpdesk@jbj.ae",
      subject,
      resendMessageId: messageId,
      providerResponse: { status: resendResult.status, data: resendResult.data },
      intendedSendId,
      workflowInstanceId: developerId,
      sendCategory: "transactional",
      idempotencyKey: buildTransactionalIntendedSendKey({
        portalKind: "developer",
        templateSlug: variant,
        workflowInstanceId: developerId,
        recipientId: developerId,
        intendedSendId,
      }),
    });

    // Log to email_send_log if it exists (best-effort)
    try {
      await admin.from("email_send_log").insert({
        user_id: user.id,
        to_email: to,
        recipient_email: to,
        subject,
        kind: isDocChase ? "registration_doc_request" : "registration_confirm",
        template: variant,
        template_name: variant,
        status: "sent",
        message_id: messageId,
        metadata: { bcc: FOUNDER_BCC, developer_id: developerId },
      } as any);
    } catch (_) { /* schema may differ; ignore */ }

    return new Response(JSON.stringify({ ok: true, message_id: messageId, thread_id: null, sent_via: "resend" }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown";
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
