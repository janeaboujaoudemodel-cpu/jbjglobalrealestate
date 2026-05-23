// portal-decide-access-request
// Owner-only: approve / deny / revoke a developer_rep_access_requests row.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

interface Body {
  request_id: string;
  action: "approve" | "deny" | "revoke";
  expires_at?: string | null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const auth = req.headers.get("Authorization") ?? "";

    const userClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: auth } },
    });
    const { data: u } = await userClient.auth.getUser();
    if (!u?.user) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE);
    const { data: isOwner } = await admin.rpc("is_portal_owner", { _uid: u.user.id });
    if (!isOwner) {
      return new Response(JSON.stringify({ error: "forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as Body;
    if (!body?.request_id || !["approve", "deny", "revoke"].includes(body.action)) {
      return new Response(JSON.stringify({ error: "bad_request" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const statusMap = { approve: "approved", deny: "denied", revoke: "revoked" } as const;
    const patch: Record<string, unknown> = {
      status: statusMap[body.action],
      decided_by: u.user.id,
      decided_at: new Date().toISOString(),
    };
    if (body.action === "approve" && body.expires_at !== undefined) {
      patch.expires_at = body.expires_at;
    }

    const { error: updErr } = await admin
      .from("developer_rep_access_requests")
      .update(patch)
      .eq("id", body.request_id);
    if (updErr) {
      return new Response(JSON.stringify({ error: updErr.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await admin.from("developer_portal_audit").insert({
      actor_id: u.user.id,
      action: `rep_access_${body.action}`,
      entity_type: "developer_rep_access_requests",
      entity_id: body.request_id,
      after: patch,
    });

    return new Response(JSON.stringify({ ok: true }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message ?? "internal_error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
