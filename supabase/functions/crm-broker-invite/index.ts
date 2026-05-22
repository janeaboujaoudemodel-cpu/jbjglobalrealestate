// CRM — Owner sends/resends a branded invitation to a broker.
// Creates auth user if needed, issues hashed invitation token + OTP,
// emails the activation link, and writes audit logs.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { requireOwnerAuth } from "../_shared/owner-auth-middleware.ts";
import { sendViaResend } from "../_shared/resendClient.ts";
import { renderBrokerInviteEmail } from "../_shared/brokerInviteEmail.ts";
import { sha256Hex, randomToken, randomOtp, clientIp } from "../_shared/brokerInviteCrypto.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const PUBLIC_BASE = "https://jbj.ae";
const TOKEN_TTL_MIN = 60 * 24 * 365 * 10; // used for legacy reporting only; revoke/block controls invalidation

interface Body {
  broker_email: string;
  broker_display_name?: string;
  broker_id?: string | null;
  action?: "invite" | "resend" | "revoke" | "block" | "unblock";
  reason?: string | null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = await requireOwnerAuth(req, corsHeaders);
    if (auth.response) return auth.response;

    const body = (await req.json()) as Body;
    const email = (body.broker_email || "").trim().toLowerCase();
    if (!email || !email.includes("@")) return json({ error: "broker_email required" }, 400);

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const ip = clientIp(req);
    const ua = req.headers.get("user-agent") ?? null;

    // Find or create the auth user
    const { data: existing } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
    const match = existing?.users?.find((u: any) => (u.email ?? "").toLowerCase() === email);
    let brokerUserId: string;
    if (match) {
      brokerUserId = match.id;
    } else {
      const tmp = crypto.randomUUID().replace(/-/g, "") + "Aa!1";
      const { data: cr, error: cErr } = await admin.auth.admin.createUser({
        email,
        password: tmp,
        email_confirm: true,
        user_metadata: { invited_as_broker: true, display_name: body.broker_display_name ?? email.split("@")[0] },
      });
      if (cErr || !cr?.user) return json({ error: cErr?.message ?? "Could not create user" }, 500);
      brokerUserId = cr.user.id;
    }

    // Ensure crm_brokers row
    let brokerId = body.broker_id ?? null;
    if (!brokerId) {
      const { data: brokerRow } = await admin
        .from("crm_brokers")
        .select("id")
        .or(`user_id.eq.${brokerUserId},email_lower.eq.${email}`)
        .maybeSingle();
      if (brokerRow) {
        brokerId = brokerRow.id;
      } else {
        const { data: ins, error: insErr } = await admin
          .from("crm_brokers")
          .insert({
            user_id: brokerUserId,
            owner_id: auth.userId,
            email_lower: email,
            full_name: body.broker_display_name ?? email.split("@")[0],
          })
          .select("id")
          .single();
        if (insErr || !ins) return json({ error: insErr?.message ?? "Could not create broker" }, 500);
        brokerId = ins.id;
      }
    }

    // REVOKE
    if (body.action === "revoke") {
      await admin
        .from("crm_brokers")
        .update({
          invitation_status: "revoked",
          invitation_token_hash: null,
          otp_hash: null,
          otp_expires_at: null,
        })
        .eq("id", brokerId);
      await admin.from("crm_audit_logs").insert({
        actor_user_id: auth.userId,
        action: "broker_invitation_revoked",
        entity_type: "crm_broker",
        entity_id: brokerId,
        details: { email, ip, user_agent: ua },
      });
      return json({ ok: true, action: "revoked" });
    }

    // BLOCK / UNBLOCK broker account (also revokes all live sessions on block)
    if (body.action === "block" || body.action === "unblock") {
      const isBlock = body.action === "block";
      await admin
        .from("crm_brokers")
        .update({
          blocked_at: isBlock ? new Date().toISOString() : null,
          blocked_by_user_id: isBlock ? auth.userId : null,
          blocked_reason: isBlock ? (body.reason ?? null) : null,
        })
        .eq("id", brokerId);

      if (isBlock) {
        await admin
          .from("crm_broker_sessions")
          .update({
            revoked_at: new Date().toISOString(),
            revoked_by_user_id: auth.userId,
            revoke_reason: "broker_blocked",
          })
          .eq("broker_id", brokerId)
          .is("revoked_at", null);
      }

      await admin.from("crm_audit_logs").insert({
        actor_user_id: auth.userId,
        action: isBlock ? "broker_account_blocked" : "broker_account_unblocked",
        entity_type: "crm_broker",
        entity_id: brokerId,
        details: { email, ip, user_agent: ua, reason: body.reason ?? null },
      });
      return json({ ok: true, action: body.action });
    }


    // INVITE / RESEND — issue fresh token + OTP
    const token = randomToken(32);
    const otp = randomOtp();
    const tokenHash = await sha256Hex(token);
    const otpHash = await sha256Hex(otp);
    const tokenExp = new Date(Date.now() + TOKEN_TTL_MIN * 60_000).toISOString();
    const otpExp = null;

    // Detach user_id from any other (stale/revoked) crm_brokers rows so the
    // unique(user_id) constraint doesn't silently block backfill below.
    await admin
      .from("crm_brokers")
      .update({ user_id: null })
      .eq("user_id", brokerUserId)
      .neq("id", brokerId);


    await admin
      .from("crm_brokers")
      .update({
        user_id: brokerUserId, // backfill if row was created without it
        invitation_status: "otp_sent",
        invitation_token_hash: tokenHash,
        invitation_token_expires_at: tokenExp,
        invitation_sent_at: new Date().toISOString(),
        invited_by_user_id: auth.userId,
        otp_hash: otpHash,
        otp_expires_at: otpExp,
        otp_attempts: 0,
        otp_last_sent_at: new Date().toISOString(),
        activation_verified_at: null,
        must_reset_password: true,
      })
      .eq("id", brokerId);


    const { data: brokerRow } = await admin
      .from("crm_brokers")
      .select("full_name, email_lower")
      .eq("id", brokerId)
      .single();
    const { data: ownerRow } = await admin
      .from("auth.users" as any)
      .select("email")
      .eq("id", auth.userId)
      .maybeSingle();

    const activationUrl = `${PUBLIC_BASE}/broker/activate?token=${token}`;
    const tpl = renderBrokerInviteEmail({
      brokerName: brokerRow?.full_name ?? email.split("@")[0],
      ownerName: ownerRow?.email ?? "JBJ Global Real Estate",
      activationUrl,
      otp,
    });

    const sent = await sendViaResend({
      from: "JBJ Global Real Estate <contact@jbj.ae>",
      to: email,
      subject: tpl.subject,
      html: tpl.html,
      tags: [{ name: "kind", value: "broker_invite" }],
    });

    const resendMessageId =
      (sent as any)?.data?.id ?? (sent as any)?.data?.data?.id ?? null;

    await admin.from("crm_audit_logs").insert({
      actor_user_id: auth.userId,
      action: body.action === "resend" ? "broker_invitation_resent" : "broker_invitation_sent",
      entity_type: "crm_broker",
      entity_id: brokerId,
      details: {
        email,
        ip,
        user_agent: ua,
        email_ok: sent.ok,
        email_status: sent.status,
        resend_message_id: resendMessageId,
        resend_response: sent.data ?? null,
        resend_error: sent.error ?? null,
      },
    });

    // Also persist to email_send_log for delivery tracking
    await admin.from("email_send_log").insert({
      to_email: email,
      kind: "broker_invite",
      subject: tpl.subject,
      template: "broker_invite_v1",
      resend_message_id: resendMessageId,
      status: sent.ok ? "accepted" : "failed",
      error: sent.ok ? null : (sent.error ?? `status ${sent.status}`),
      sent_on: new Date().toISOString().slice(0, 10),
    });

    if (!sent.ok) return json({ ok: false, error: sent.error ?? "Email send failed", quota: sent.quota }, 502);
    return json({ ok: true, broker_id: brokerId, expires_at: tokenExp, resend_message_id: resendMessageId });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
