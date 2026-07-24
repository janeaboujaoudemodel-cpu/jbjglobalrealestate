// Sends broker portal emails through the verified Resend sender.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { sendViaResend } from "../_shared/resendClient.ts";
import { recordJbjResendSend, buildIntendedSendKey } from "../_shared/jbjSpine.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = req.headers.get("Authorization");
    if (!auth?.startsWith("Bearer ")) return j({ error: "Unauthorized" }, 401);
    const u = createClient(SUPABASE_URL, ANON, { global: { headers: { Authorization: auth } } });
    const { data: claims } = await u.auth.getClaims(auth.replace("Bearer ", ""));
    if (!claims?.claims?.sub) return j({ error: "Unauthorized" }, 401);

    const { accountId, to, subject, body, cc, bcc, entityId, portalKind = "individual_broker" } = await req.json();
    if (!to || !subject || !body) return j({ error: "to, subject, body required" }, 400);

    const svc = createClient(SUPABASE_URL, SERVICE);
    let replyTo = "helpdesk@jbj.ae";
    if (accountId) {
      const { data: acc } = await svc.from("broker_email_accounts").select("email_address")
        .eq("id", accountId).eq("user_id", claims.claims.sub).maybeSingle();
      if (acc?.email_address) replyTo = acc.email_address;
    }

    const resendResult = await sendViaResend({
      from: "JBJ Global Real Estate <contact@jbj.ae>",
      to: arr(to),
      cc: arr(cc),
      bcc: arr(bcc),
      reply_to: replyTo,
      subject,
      html: body,
      tags: [
        { name: "workflow", value: "broker_email_send" },
        { name: "portal", value: String(portalKind) },
      ],
    });
    if (!resendResult.ok) {
      return j({ error: resendResult.error || "Resend send failed", upstream_status: resendResult.status, details: resendResult.data }, resendResult.status >= 400 && resendResult.status < 600 ? resendResult.status : 502);
    }

    const messageId = resendResult.data?.id || null;
    const intendedSendId = `broker-email:${claims.claims.sub}:${messageId || crypto.randomUUID()}`;
    await recordJbjResendSend({
      portalKind,
      entityType: portalKind === "individual_broker" ? "individual_broker" : "brokerage",
      entityId: entityId ?? null,
      email: arr(to)[0],
      templateSlug: "broker_email_send",
      senderEmail: "contact@jbj.ae",
      replyTo,
      subject,
      resendMessageId: messageId,
      providerResponse: { status: resendResult.status, data: resendResult.data },
      intendedSendId,
      workflowInstanceId: claims.claims.sub,
      sendCategory: "transactional",
      idempotencyKey: buildIntendedSendKey({
        portalKind,
        sendType: "transactional",
        templateSlug: "broker_email_send",
        workflowInstanceId: claims.claims.sub,
        recipientId: arr(to)[0],
        intendedSendId,
      }),
    });
    return j({ ok: true, id: messageId, sent_via: "resend" });
  } catch (e) {
    return j({ error: (e as Error).message }, 500);
  }
});

function arr(v: any): string[] { return !v ? [] : Array.isArray(v) ? v : [v]; }

function j(b: unknown, s = 200) {
  return new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
