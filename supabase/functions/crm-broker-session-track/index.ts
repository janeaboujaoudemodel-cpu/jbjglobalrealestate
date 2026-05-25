// CRM — Authenticated broker registers (or refreshes) a session record.
// Owner uses crm_broker_revoke_session / crm_broker_block_device RPCs to act on it.
// Also detects basic "suspicious" signals (new device fingerprint).
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { sha256Hex, randomToken, clientIp } from "../_shared/brokerInviteCrypto.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SESSION_TTL_HOURS = 24 * 14;

interface Body {
  device_fingerprint?: string | null;
  device_label?: string | null;
  existing_session_token?: string | null;
  heartbeat?: boolean;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) return json({ error: "Unauthorized" }, 401);

    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userRes } = await userClient.auth.getUser();
    const caller = userRes?.user;
    if (!caller) return json({ error: "Unauthorized" }, 401);

    const body = (await req.json().catch(() => ({}))) as Body;
    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const ip = clientIp(req);
    const ua = req.headers.get("user-agent") ?? null;
    const fingerprint = body.device_fingerprint ?? null;

    const { data: broker } = await admin
      .from("crm_brokers")
      .select("id, owner_id, blocked_at")
      .eq("user_id", caller.id)
      .maybeSingle();
    if (!broker) return json({ ok: false, force_signout: true, error: "Not a broker" }, 200);
    if (broker.blocked_at) return json({ ok: false, force_signout: true, error: "Account blocked" }, 200);

    // Check blocked devices
    if (fingerprint) {
      const { data: blk } = await admin
        .from("crm_broker_blocked_devices")
        .select("id")
        .eq("broker_id", broker.id)
        .eq("device_fingerprint", fingerprint)
        .maybeSingle();
      if (blk) {
        await admin.from("crm_security_events").insert({
          user_id: caller.id,
          event_type: "broker_blocked_device_attempt",
          ip_address: ip,
          user_agent: ua,
          details: { broker_id: broker.id, device_fingerprint: fingerprint },
        });
        return json({ error: "Device blocked" }, 403);
      }
    }

    // Refresh existing session if provided
    if (body.existing_session_token) {
      const existingHash = await sha256Hex(body.existing_session_token);
      const { data: row } = await admin
        .from("crm_broker_sessions")
        .select("id, revoked_at")
        .eq("session_token_hash", existingHash)
        .eq("broker_user_id", caller.id)
        .maybeSingle();
      if (row?.revoked_at) {
        await admin.from("crm_security_events").insert({
          user_id: caller.id,
          event_type: "broker_revoked_session_heartbeat",
          ip_address: ip,
          user_agent: ua,
          details: { broker_id: broker.id, session_id: row.id },
        });
        return json({ error: "Session revoked", force_signout: true }, 403);
      }
      if (row) {
        await admin
          .from("crm_broker_sessions")
          .update({ last_seen_at: new Date().toISOString(), ip_address: ip, user_agent: ua })
          .eq("id", row.id);
        return json({ ok: true, session_token: body.existing_session_token, refreshed: true });
      }
      if (body.heartbeat) return json({ error: "Session revoked", force_signout: true }, 403);
    }

    // Suspicious-login signals:
    //   (a) first time we see this device fingerprint for this broker
    //   (b) impossible-travel: a different IP appears within 10 min of any
    //       active (non-revoked) session for this broker
    let suspicious = false;
    let suspiciousReason: string | null = null;
    if (fingerprint) {
      const { count } = await admin
        .from("crm_broker_sessions")
        .select("id", { count: "exact", head: true })
        .eq("broker_id", broker.id)
        .eq("device_fingerprint", fingerprint);
      if ((count ?? 0) === 0) {
        suspicious = true;
        suspiciousReason = "new_device";
      }
    }
    if (!suspicious && ip) {
      const tenMinAgo = new Date(Date.now() - 10 * 60_000).toISOString();
      const { data: recent } = await admin
        .from("crm_broker_sessions")
        .select("ip_address")
        .eq("broker_id", broker.id)
        .is("revoked_at", null)
        .gte("last_seen_at", tenMinAgo)
        .limit(20);
      if ((recent ?? []).some(r => r.ip_address && r.ip_address !== ip)) {
        suspicious = true;
        suspiciousReason = "impossible_travel";
      }
    }

    const sessionToken = randomToken(32);
    const sessionHash = await sha256Hex(sessionToken);
    const expiresAt = new Date(Date.now() + SESSION_TTL_HOURS * 3600_000).toISOString();

    const { data: ins, error: insErr } = await admin
      .from("crm_broker_sessions")
      .insert({
        broker_id: broker.id,
        broker_user_id: caller.id,
        owner_id: broker.owner_id ?? caller.id,
        session_token_hash: sessionHash,
        device_fingerprint: fingerprint,
        device_label: body.device_label ?? null,
        user_agent: ua,
        ip_address: ip,
        expires_at: expiresAt,
        is_suspicious: suspicious,
        metadata: suspiciousReason ? { suspicious_reason: suspiciousReason } : {},
      })
      .select("id")
      .single();
    if (insErr) {
      console.error("crm-broker-session-track insert failed", insErr);
      return json({ error: "Could not start your session. Please try signing in again." }, 500);
    }

    await admin.from("crm_audit_logs").insert({
      actor_user_id: caller.id,
      action: suspicious ? "broker_session_suspicious" : "broker_session_started",
      entity_type: "crm_broker_session",
      entity_id: ins.id,
      details: { broker_id: broker.id, ip, user_agent: ua, device_fingerprint: fingerprint, suspicious_reason: suspiciousReason },
    });
    if (suspicious) {
      await admin.from("crm_security_events").insert({
        user_id: caller.id,
        event_type: suspiciousReason === "impossible_travel" ? "broker_impossible_travel" : "broker_new_device_login",
        ip_address: ip,
        user_agent: ua,
        details: { broker_id: broker.id, device_fingerprint: fingerprint, suspicious_reason: suspiciousReason },
      });
    }

    return json({ ok: true, session_token: sessionToken, session_id: ins.id, expires_at: expiresAt, suspicious });
  } catch (e) {
    console.error("crm-broker-session-track unexpected error", e);
    // Return 200 with a fallback signal — the client treats this as "skip
    // this heartbeat" rather than crashing the React tree.
    return json({ ok: false, fallback: true, error: "SERVICE_FAILED" }, 200);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
