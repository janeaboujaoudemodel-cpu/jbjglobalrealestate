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
  action: "reset_password" | "dump_state";
  broker_email?: string;
  broker_id?: string;
  password?: string;
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

    return j({ error: "unknown action" }, 400);
  } catch (e) {
    return j({ error: (e as Error).message }, 500);
  }
});
