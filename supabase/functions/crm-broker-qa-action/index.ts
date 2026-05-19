// TEMPORARY QA-ONLY ENDPOINT — scoped to brokers whose email starts with
// "infoo.jane+qa-" (test fixtures only). Will be deleted at the end of
// checkpoint 3 alongside crm-broker-qa-issue. Provides:
//   - reset_password: sets a known password for the QA broker user so QA
//     can mint a real JWT via /auth/v1/token and drive the live frontend
//     session-track / heartbeat endpoints.
//   - dump_state: returns broker + sessions + blocked devices + recent
//     audit/security log rows for end-to-end DB verification.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface Body {
  action: "reset_password" | "dump_state" | "revoke_session" | "revoke_all" | "block_device" | "unblock_device" | "block_broker" | "unblock_broker";
  broker_email?: string;
  broker_id?: string;
  password?: string;
  session_id?: string;
  device_fingerprint?: string;
  reason?: string;
}

function j(b: unknown, s = 200) {
  return new Response(JSON.stringify(b), { status: s, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const body = (await req.json()) as Body;

    // Resolve broker
    let brokerRow: any = null;
    if (body.broker_id) {
      const { data } = await admin.from("crm_brokers").select("*").eq("id", body.broker_id).maybeSingle();
      brokerRow = data;
    } else if (body.broker_email) {
      const { data } = await admin.from("crm_brokers").select("*").eq("email_lower", body.broker_email.toLowerCase()).maybeSingle();
      brokerRow = data;
    }
    if (!brokerRow) return j({ error: "broker not found" }, 404);

    const email = (brokerRow.email_lower || "").toLowerCase();
    if (!email.startsWith("infoo.jane+qa-")) return j({ error: "QA scope only" }, 403);

    if (body.action === "reset_password") {
      const pwd = body.password || ("QaPwd!" + crypto.randomUUID().slice(0, 12) + "A1");
      const { error } = await admin.auth.admin.updateUserById(brokerRow.user_id, { password: pwd, email_confirm: true });
      if (error) return j({ error: error.message }, 500);
      return j({ ok: true, broker_id: brokerRow.id, user_id: brokerRow.user_id, email, password: pwd });
    }

    if (body.action === "dump_state") {
      const [{ data: sessions }, { data: devices }, { data: audits }, { data: events }, { data: overview }] = await Promise.all([
        admin.from("crm_broker_sessions").select("*").eq("broker_id", brokerRow.id).order("created_at", { ascending: false }),
        admin.from("crm_broker_blocked_devices").select("*").eq("broker_id", brokerRow.id),
        admin.from("crm_audit_logs").select("*").eq("actor_user_id", brokerRow.user_id).order("created_at", { ascending: false }).limit(20),
        admin.from("crm_security_events").select("*").eq("user_id", brokerRow.user_id).order("created_at", { ascending: false }).limit(20),
        admin.from("vw_crm_broker_overview").select("*").eq("id", brokerRow.id).maybeSingle(),
      ]);
      return j({ ok: true, broker: brokerRow, sessions, blocked_devices: devices, audit_logs: audits, security_events: events, overview });
    }

    if (body.action === "revoke_session") {
      if (!body.session_id) return j({ error: "session_id required" }, 400);
      const { error } = await admin.from("crm_broker_sessions").update({
        revoked_at: new Date().toISOString(), revoke_reason: body.reason ?? "qa revoke single",
      }).eq("id", body.session_id).eq("broker_id", brokerRow.id);
      if (error) return j({ error: error.message }, 500);
      await admin.from("crm_audit_logs").insert({
        actor_user_id: brokerRow.owner_id, action: "broker_session_revoked",
        entity_type: "crm_broker_session", entity_id: body.session_id,
        details: { broker_id: brokerRow.id, reason: body.reason ?? "qa revoke single" },
      });
      return j({ ok: true });
    }

    if (body.action === "revoke_all") {
      const { data, error } = await admin.from("crm_broker_sessions").update({
        revoked_at: new Date().toISOString(), revoke_reason: body.reason ?? "qa revoke all",
      }).eq("broker_id", brokerRow.id).is("revoked_at", null).select("id");
      if (error) return j({ error: error.message }, 500);
      await admin.from("crm_audit_logs").insert({
        actor_user_id: brokerRow.owner_id, action: "broker_sessions_revoked_all",
        entity_type: "crm_broker", entity_id: brokerRow.id,
        details: { count: data?.length ?? 0, reason: body.reason ?? "qa revoke all" },
      });
      return j({ ok: true, count: data?.length ?? 0 });
    }

    if (body.action === "block_device") {
      if (!body.device_fingerprint) return j({ error: "device_fingerprint required" }, 400);
      const { data, error } = await admin.from("crm_broker_blocked_devices").upsert({
        owner_id: brokerRow.owner_id, broker_id: brokerRow.id,
        device_fingerprint: body.device_fingerprint, reason: body.reason ?? "qa block",
        blocked_by_user_id: brokerRow.owner_id,
      }, { onConflict: "owner_id,broker_id,device_fingerprint" }).select("id").single();
      if (error) return j({ error: error.message }, 500);
      await admin.from("crm_broker_sessions").update({
        revoked_at: new Date().toISOString(), revoke_reason: "device blocked",
      }).eq("broker_id", brokerRow.id).eq("device_fingerprint", body.device_fingerprint).is("revoked_at", null);
      await admin.from("crm_audit_logs").insert({
        actor_user_id: brokerRow.owner_id, action: "broker_device_blocked",
        entity_type: "crm_broker_blocked_device", entity_id: data.id,
        details: { broker_id: brokerRow.id, fingerprint: body.device_fingerprint },
      });
      return j({ ok: true, block_id: data.id });
    }

    if (body.action === "unblock_device") {
      if (!body.device_fingerprint) return j({ error: "device_fingerprint required" }, 400);
      const { error } = await admin.from("crm_broker_blocked_devices").delete()
        .eq("broker_id", brokerRow.id).eq("device_fingerprint", body.device_fingerprint);
      if (error) return j({ error: error.message }, 500);
      await admin.from("crm_audit_logs").insert({
        actor_user_id: brokerRow.owner_id, action: "broker_device_unblocked",
        entity_type: "crm_broker", entity_id: brokerRow.id,
        details: { fingerprint: body.device_fingerprint },
      });
      return j({ ok: true });
    }

    if (body.action === "block_broker") {
      const { error } = await admin.from("crm_brokers").update({
        blocked_at: new Date().toISOString(), blocked_reason: body.reason ?? "qa block",
      }).eq("id", brokerRow.id);
      if (error) return j({ error: error.message }, 500);
      await admin.from("crm_audit_logs").insert({
        actor_user_id: brokerRow.owner_id, action: "broker_blocked",
        entity_type: "crm_broker", entity_id: brokerRow.id, details: { reason: body.reason ?? "qa block" },
      });
      return j({ ok: true });
    }

    if (body.action === "unblock_broker") {
      const { error } = await admin.from("crm_brokers").update({
        blocked_at: null, blocked_reason: null,
      }).eq("id", brokerRow.id);
      if (error) return j({ error: error.message }, 500);
      await admin.from("crm_audit_logs").insert({
        actor_user_id: brokerRow.owner_id, action: "broker_unblocked",
        entity_type: "crm_broker", entity_id: brokerRow.id, details: {},
      });
      return j({ ok: true });
    }

    return j({ error: "unknown action" }, 400);
  } catch (e) {
    return j({ error: (e as Error).message }, 500);
  }
});
