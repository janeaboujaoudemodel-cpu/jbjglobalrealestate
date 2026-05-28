import { createClient } from "npm:@supabase/supabase-js@2";
import { requireOwnerAuth } from "../_shared/owner-auth-middleware.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const VALID_TYPES = new Set([
  "full_time", "part_time", "freelancer", "referral", "intern", "contractor",
]);
const VALID_STATUSES = new Set([
  "active", "on_leave", "left_company", "terminated", "inactive",
]);

type Action = "set_status" | "set_employment_type" | "delete";

interface Body {
  action: Action;
  user_ids: string[];
  payload?: {
    employment_status?: string;
    employment_type?: string | null;
    left_reason?: string;
  };
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const auth = await requireOwnerAuth(req, corsHeaders);
    if (auth.response) return auth.response;
    const actingUserId = (auth as any).userId ?? (auth as any).user?.id ?? null;

    const body = (await req.json().catch(() => ({}))) as Body;
    const { action, user_ids, payload = {} } = body;

    if (!action || !["set_status", "set_employment_type", "delete"].includes(action)) {
      return new Response(JSON.stringify({ error: "invalid action" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!Array.isArray(user_ids) || user_ids.length === 0 || user_ids.length > 200) {
      return new Response(JSON.stringify({ error: "user_ids must be 1..200 uuids" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!user_ids.every((id) => typeof id === "string" && UUID_RE.test(id))) {
      return new Response(JSON.stringify({ error: "user_ids must all be uuids" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Snapshot before
    const { data: before } = await supabase
      .from("crm_users_profile")
      .select("id, user_id, display_name, employment_status, employment_type, is_active, left_at, left_reason")
      .in("user_id", user_ids);

    const beforeMap = new Map((before ?? []).map((r: any) => [r.user_id, r]));

    let updatePatch: Record<string, unknown> = {};
    let summary = "";

    if (action === "set_status") {
      const s = String(payload.employment_status ?? "");
      if (!VALID_STATUSES.has(s)) {
        return new Response(JSON.stringify({ error: "invalid employment_status" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const leaving = s !== "active";
      updatePatch = {
        employment_status: s,
        left_at: leaving ? new Date().toISOString() : null,
        left_reason: leaving ? (payload.left_reason ?? null) : null,
        is_active: !leaving,
        updated_at: new Date().toISOString(),
      };
      summary = `Set employment_status=${s} for ${user_ids.length} employee(s)`;
    } else if (action === "set_employment_type") {
      const t = payload.employment_type;
      if (t !== null && t !== undefined && !VALID_TYPES.has(String(t))) {
        return new Response(JSON.stringify({ error: "invalid employment_type" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      updatePatch = {
        employment_type: t ?? null,
        updated_at: new Date().toISOString(),
      };
      summary = `Set employment_type=${t ?? "—"} for ${user_ids.length} employee(s)`;
    } else if (action === "delete") {
      // Soft delete — FK safety. Never hard-delete employees who own leads/calls.
      updatePatch = {
        employment_status: "terminated",
        is_active: false,
        left_at: new Date().toISOString(),
        left_reason: payload.left_reason ?? "Removed by owner",
        updated_at: new Date().toISOString(),
      };
      summary = `Soft-deleted ${user_ids.length} employee(s)`;
    }

    const { data: updated, error } = await supabase
      .from("crm_users_profile")
      .update(updatePatch)
      .in("user_id", user_ids)
      .select("user_id, display_name, employment_status, employment_type, is_active, left_at, left_reason");

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Audit log (best-effort, never blocks)
    try {
      const logRows = (updated ?? []).map((row: any) => ({
        entity_type: "crm_users_profile",
        entity_id: row.user_id,
        entity_name: row.display_name,
        user_id: actingUserId,
        action,
        section: "hr_employee_bulk",
        changed_fields: Object.keys(updatePatch),
        before_values: beforeMap.get(row.user_id) ?? null,
        after_values: row,
        summary,
      }));
      if (logRows.length) {
        await supabase.from("admin_edit_log").insert(logRows);
      }
    } catch (_e) { /* swallow */ }

    return new Response(
      JSON.stringify({ success: true, action, affected: updated?.length ?? 0, summary }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message ?? "internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
