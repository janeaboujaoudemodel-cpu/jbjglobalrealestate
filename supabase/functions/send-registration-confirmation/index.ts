// Sends an automated "please confirm we are registered with you" email to a
// developer via the connected Gmail (using the same gateway). BCCs the founder
// at infoo.jane@gmail.com on every send. Logs to email_send_log and
// developer_registration_sync_logs.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GATEWAY = "https://connector-gateway.lovable.dev/google_mail/gmail/v1";
const FOUNDER_BCC = "drjane@gmail.com";

function buildRaw(to: string, bcc: string, subject: string, html: string, fromAlias?: string) {
  const lines = [
    `To: ${to}`,
    `Bcc: ${bcc}`,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    'Content-Type: text/html; charset="UTF-8"',
    "",
    html,
  ];
  if (fromAlias) lines.unshift(`From: ${fromAlias}`);
  const raw = lines.join("\r\n");
  // base64url
  const enc = btoa(unescape(encodeURIComponent(raw)));
  return enc.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const jwt = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "");
    const { data: { user } } = await admin.auth.getUser(jwt);
    if (!user) return new Response(JSON.stringify({ error: "unauthenticated" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const GMAIL_KEY = Deno.env.get("GOOGLE_MAIL_API_KEY");
    if (!LOVABLE_API_KEY || !GMAIL_KEY) {
      return new Response(JSON.stringify({ ok: false, error: "Gmail not connected." }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

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

    const raw = buildRaw(to, FOUNDER_BCC, subject, html);

    const sendRes = await fetch(`${GATEWAY}/users/me/messages/send`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": GMAIL_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ raw }),
    });
    const sendJson = await sendRes.json();
    if (!sendRes.ok) {
      return new Response(JSON.stringify({ ok: false, error: `Gmail send failed [${sendRes.status}]: ${JSON.stringify(sendJson)}` }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update developer + log
    await admin
      .from("crm_developer_registry")
      .update({
        registration_status: isDocChase ? "awaiting_document" : "awaiting_confirmation",
        registration_confirmation_sent_at: new Date().toISOString(),
        registration_confirmation_message_id: sendJson?.id ?? null,
      })
      .eq("id", developerId);

    await admin.from("developer_registration_sync_logs").insert({
      user_id: user.id,
      developer_id: developerId,
      gmail_message_id: sendJson?.id ?? null,
      gmail_thread_id: sendJson?.threadId ?? null,
      direction: "out",
      outcome: "sent",
      parsed_intent: isDocChase ? "request_signed_doc" : "registration_confirm",
      detail: { to, subject, bcc: FOUNDER_BCC },
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
        message_id: sendJson?.id ?? null,
        metadata: { bcc: FOUNDER_BCC, developer_id: developerId },
      } as any);
    } catch (_) { /* schema may differ; ignore */ }

    return new Response(JSON.stringify({ ok: true, message_id: sendJson?.id, thread_id: sendJson?.threadId }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown";
    return new Response(JSON.stringify({ ok: false, error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
