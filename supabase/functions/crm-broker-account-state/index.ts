// Owner-only: set top-level broker account_status (active|suspended|deleted).
// Cascade trigger on crm_brokers handles grant suspension + session revoke.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { requireOwnerAuth } from "../_shared/owner-auth-middleware.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface Body {
  broker_id: string;
  account_status: "active" | "suspended" | "deleted";
  reason?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = await requireOwnerAuth(req, corsHeaders);
    if (auth.response) return auth.response;

    const body = (await req.json()) as Body;
    if (!body.broker_id || !["active", "suspended", "deleted"].includes(body.account_status)) {
      return json({ error: "broker_id and valid account_status required" }, 400);
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    const { data: broker, error: bErr } = await admin
      .from("crm_brokers")
      .select("id, full_name, email_lower, account_status, auth_user_id")
      .eq("id", body.broker_id)
      .maybeSingle();
    if (bErr || !broker) return json({ error: "broker not found" }, 404);

    const prev = broker.account_status ?? "active";

    const { error: uErr } = await admin
      .from("crm_brokers")
      .update({
        account_status: body.account_status,
        account_status_reason: body.reason ?? null,
        account_status_changed_at: new Date().toISOString(),
        account_status_changed_by: auth.userId,
      })
      .eq("id", body.broker_id);
    if (uErr) return json({ error: uErr.message }, 500);

    await admin.from("crm_audit_logs").insert({
      actor_id: auth.userId,
      action: "broker_account_status_change",
      entity_type: "crm_broker",
      entity_id: body.broker_id,
      details: {
        from: prev,
        to: body.account_status,
        reason: body.reason ?? null,
        broker_email: broker.email_lower,
        broker_name: broker.full_name,
      },
    });

    return json({ ok: true, broker_id: body.broker_id, account_status: body.account_status });
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
