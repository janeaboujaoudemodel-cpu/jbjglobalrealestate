// CRM — Public endpoint. Verifies invitation token + OTP, returns a short-lived
// activation ticket the broker can exchange for a password set in crm-broker-activate.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { sha256Hex, randomToken, clientIp } from "../_shared/brokerInviteCrypto.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const MAX_OTP_ATTEMPTS = 5;
const TICKET_TTL_MIN = 10;

interface Body {
  token: string;
  otp: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const body = (await req.json()) as Body;
    if (!body.token || !body.otp) return json({ error: "token and otp required" }, 400);

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const ip = clientIp(req);
    const ua = req.headers.get("user-agent") ?? null;

    // IP throttle: reuse crm_security_events. >10 broker_otp_failed from same IP
    // in the last 15 min = lockout. No new table/system created.
    if (ip) {
      const since = new Date(Date.now() - 15 * 60_000).toISOString();
      const { count: ipFails } = await admin
        .from("crm_security_events")
        .select("id", { count: "exact", head: true })
        .eq("event_type", "broker_otp_failed")
        .eq("ip_address", ip)
        .gte("created_at", since);
      if ((ipFails ?? 0) >= 10) {
        await logSecurity(admin, null, null, "broker_otp_ip_throttled", ip, ua);
        return json({ error: "Too many attempts from this network. Try again later." }, 429);
      }
    }

    const tokenHash = await sha256Hex(body.token);

    const { data: broker } = await admin
      .from("crm_brokers")
      .select("id, user_id, owner_id, email_lower, full_name, invitation_status, invitation_token_expires_at, otp_hash, otp_expires_at, otp_attempts, blocked_at")
      .eq("invitation_token_hash", tokenHash)
      .maybeSingle();

    if (!broker) {
      await logSecurity(admin, null, null, "broker_invitation_invalid_token", ip, ua);
      return json({ error: "Invalid or expired invitation" }, 400);
    }

    if (broker.blocked_at) {
      await logSecurity(admin, broker.id, broker.user_id, "broker_blocked_login_attempt", ip, ua);
      return json({ error: "Account is blocked. Contact the owner." }, 403);
    }

    const now = Date.now();
    if (!broker.invitation_token_expires_at || new Date(broker.invitation_token_expires_at).getTime() < now) {
      await admin.from("crm_brokers").update({ invitation_status: "expired" }).eq("id", broker.id);
      await logSecurity(admin, broker.id, broker.user_id, "broker_invitation_expired", ip, ua);
      return json({ error: "Invitation expired. Ask the owner to resend." }, 410);
    }

    if (!broker.otp_hash || !broker.otp_expires_at || new Date(broker.otp_expires_at).getTime() < now) {
      await logSecurity(admin, broker.id, broker.user_id, "broker_otp_expired", ip, ua);
      return json({ error: "Code expired. Ask the owner to resend." }, 410);
    }

    if ((broker.otp_attempts ?? 0) >= MAX_OTP_ATTEMPTS) {
      await admin.from("crm_brokers").update({ invitation_status: "revoked", otp_hash: null }).eq("id", broker.id);
      await logSecurity(admin, broker.id, broker.user_id, "broker_otp_lockout", ip, ua);
      return json({ error: "Too many incorrect attempts. Invitation locked." }, 429);
    }

    const otpHash = await sha256Hex(body.otp.trim());
    if (otpHash !== broker.otp_hash) {
      await admin
        .from("crm_brokers")
        .update({ otp_attempts: (broker.otp_attempts ?? 0) + 1 })
        .eq("id", broker.id);
      await logSecurity(admin, broker.id, broker.user_id, "broker_otp_failed", ip, ua);
      return json({ error: "Incorrect code", attempts_left: MAX_OTP_ATTEMPTS - (broker.otp_attempts ?? 0) - 1 }, 400);
    }

    // Issue activation ticket (single-use, short-lived)
    const ticket = randomToken(32);
    const ticketHash = await sha256Hex(ticket);
    const ticketExp = new Date(now + TICKET_TTL_MIN * 60_000).toISOString();

    await admin
      .from("crm_brokers")
      .update({
        invitation_status: "otp_sent",
        otp_hash: null,
        otp_attempts: 0,
        // reuse invitation_token_hash as one-shot activation ticket
        invitation_token_hash: ticketHash,
        invitation_token_expires_at: ticketExp,
      })
      .eq("id", broker.id);

    await admin.from("crm_audit_logs").insert({
      actor_user_id: broker.user_id,
      action: "broker_otp_verified",
      entity_type: "crm_broker",
      entity_id: broker.id,
      metadata: { ip, user_agent: ua },
    });

    return json({
      ok: true,
      ticket,
      expires_at: ticketExp,
      broker: { email: broker.email_lower, name: broker.full_name },
    });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});

async function logSecurity(
  admin: any,
  brokerId: string | null,
  userId: string | null,
  event: string,
  ip: string | null,
  ua: string | null,
) {
  try {
    await admin.from("crm_security_events").insert({
      user_id: userId,
      event_type: event,
      severity: event.includes("lockout") || event.includes("blocked") ? "high" : "medium",
      ip_address: ip,
      user_agent: ua,
      metadata: { broker_id: brokerId },
    });
  } catch { /* ignore */ }
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
