// CRM: Manage a broker grant — suspend, unsuspend, revoke, restrict scope, or update visibility rule.
// Owner/admin only. Audit logged automatically via crm_grants_audit trigger.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

type Action = "suspend" | "unsuspend" | "revoke" | "unrevoke" | "restrict" | "update";

type Body = {
  grant_id: string;
  action: Action;
  reason?: string | null;
  // For "update" / "restrict":
  visibility_direction?: "broker_to_owner_only" | "bidirectional";
  date_window_mode?: "all" | "today" | "last_7" | "last_30" | "custom" | "from_date";
  date_window_start?: string | null;
  date_window_end?: string | null;
  lead_ids?: string[] | null;
  status_filter?: string[] | null;
  permission_level?: "view" | "edit";
  expires_at?: string | null;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) return json({ error: "Missing Authorization" }, 401);

    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userRes } = await userClient.auth.getUser();
    const caller = userRes?.user;
    if (!caller) return json({ error: "Unauthorized" }, 401);

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const body = (await req.json()) as Body;
    if (!body?.grant_id || !body?.action) return json({ error: "grant_id and action required" }, 400);

    const { data: grant, error: gErr } = await admin
      .from("crm_database_grants")
      .select("id, source_database_id, broker_user_id")
      .eq("id", body.grant_id)
      .maybeSingle();
    if (gErr || !grant) return json({ error: "Grant not found" }, 404);

    const { data: db } = await admin
      .from("crm_source_databases")
      .select("owner_user_id")
      .eq("id", grant.source_database_id)
      .maybeSingle();

    const [{ data: isAdmin }, { data: isOwner }] = await Promise.all([
      admin.rpc("has_role", { _user_id: caller.id, _role: "admin" }),
      admin.rpc("has_role", { _user_id: caller.id, _role: "owner" }),
    ]);
    const allowed = db?.owner_user_id === caller.id || !!isAdmin || !!isOwner;
    if (!allowed) return json({ error: "Forbidden" }, 403);

    const now = new Date().toISOString();
    const patch: Record<string, unknown> = {};

    switch (body.action) {
      case "suspend":
        patch.suspended_at = now;
        patch.suspend_reason = body.reason ?? null;
        break;
      case "unsuspend":
        patch.suspended_at = null;
        patch.suspend_reason = null;
        break;
      case "revoke":
        patch.revoked_at = now;
        patch.revoke_reason = body.reason ?? null;
        break;
      case "unrevoke":
        patch.revoked_at = null;
        patch.revoke_reason = null;
        break;
      case "restrict":
      case "update":
        if (body.visibility_direction) patch.visibility_direction = body.visibility_direction;
        if (body.date_window_mode)     patch.date_window_mode = body.date_window_mode;
        if (body.date_window_start !== undefined) patch.date_window_start = body.date_window_start;
        if (body.date_window_end   !== undefined) patch.date_window_end   = body.date_window_end;
        if (body.lead_ids          !== undefined) patch.lead_ids          = body.lead_ids;
        if (body.status_filter     !== undefined) patch.status_filter     = body.status_filter;
        if (body.permission_level)               patch.permission_level   = body.permission_level;
        if (body.expires_at        !== undefined) patch.expires_at        = body.expires_at;
        if (body.action === "restrict") patch.restricted_at = now;
        break;
      default:
        return json({ error: "Unknown action" }, 400);
    }

    const { data: updated, error: uErr } = await admin
      .from("crm_database_grants")
      .update(patch)
      .eq("id", body.grant_id)
      .select()
      .single();
    if (uErr) return json({ error: uErr.message }, 500);

    return json({ ok: true, grant: updated });
  } catch (e) {
    console.error("crm-broker-grant-manage error:", e);
    return json({ error: (e as Error).message ?? "Internal error" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
