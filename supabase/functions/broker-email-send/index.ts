// Sends broker portal emails through the verified Resend sender.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { sendViaResend } from "../_shared/resendClient.ts";
import { recordJbjResendSend, buildIntendedSendKey, type JbjPortalKind } from "../_shared/jbjSpine.ts";

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
    const userId = claims.claims.sub as string;

    const svc = createClient(SUPABASE_URL, SERVICE);

    // Authorization: only CRM staff / active brokers / owner-admins may send
    // mail from the verified company domain. A valid JWT alone is NOT enough.
    if (!(await isAuthorisedSender(svc, userId))) {
      return j({ error: "Forbidden: sending requires an active broker or CRM staff account" }, 403);
    }

    // Per-user rate limit on outbound sends.
    const rate = await checkSendRate(svc, userId);
    if (!rate.ok) return j({ error: "Rate limit exceeded. Try again later." }, 429);

    const { accountId, to, subject, body, cc, bcc, entityId, portalKind: rawPortalKind = "individual_broker" } = await req.json();
    if (!to || !subject || !body) return j({ error: "to, subject, body required" }, 400);
    const allowedPortals = new Set(["brokerage", "developer", "individual_broker", "client_buyer", "client_seller", "career"]);
    if (!allowedPortals.has(String(rawPortalKind))) return j({ error: "Invalid portalKind" }, 400);
    const portalKind = String(rawPortalKind) as JbjPortalKind;

    const recipientCount = arr(to).length + arr(cc).length + arr(bcc).length;
    if (recipientCount === 0) return j({ error: "At least one recipient required" }, 400);
    if (recipientCount > 25) return j({ error: "Too many recipients in a single send (max 25)" }, 400);


    let replyTo = "helpdesk@jbj.ae";
    if (accountId) {
      const { data: acc } = await svc.from("broker_email_accounts").select("email_address")
        .eq("id", accountId).eq("user_id", claims.claims.sub).maybeSingle();
      if (acc?.email_address) replyTo = acc.email_address;
    }

    const resendResult = await sendViaResend({
      from: "JBJ Global Real Estate <contact@jbj.ae>",
      to: arr(to),
      cc: arr(cc).length ? arr(cc) : undefined,
      bcc: arr(bcc).length ? arr(bcc) : undefined,
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

/**
 * Only CRM staff, active brokers, or platform owners/admins may send mail from
 * the verified company sending domain.
 */
async function isAuthorisedSender(svc: any, userId: string): Promise<boolean> {
  const { data: staff } = await svc
    .from("crm_users_profile")
    .select("id")
    .eq("user_id", userId)
    .eq("is_active", true)
    .maybeSingle();
  if (staff?.id) return true;

  const { data: broker } = await svc
    .from("broker_profiles")
    .select("id")
    .eq("user_id", userId)
    .eq("is_active", true)
    .maybeSingle();
  if (broker?.id) return true;

  const { data: roles } = await svc
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .in("role", ["owner", "admin"]);
  return Array.isArray(roles) && roles.length > 0;
}

/** Per-user send throttle: 60 sends per 60 minutes. Fails closed on error. */
async function checkSendRate(svc: any, userId: string): Promise<{ ok: boolean }> {
  const { data, error } = await svc.rpc("check_rate_limit", {
    p_identifier: userId,
    p_action_type: "broker_email_send",
    p_max_requests: 60,
    p_window_minutes: 60,
  });
  if (error) {
    console.error("broker-email-send rate limit check failed", error.message);
    return { ok: false };
  }
  return { ok: data !== false };
}


function j(b: unknown, s = 200) {
  return new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}
