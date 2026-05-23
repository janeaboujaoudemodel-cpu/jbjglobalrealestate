// portal-approve-rep-application
// Owner-only: approve or deny a developer_rep_applications row.
// On approve: insert a developer_sales_reps row (linked back via created_rep_id).
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

interface Body {
  application_id: string;
  action: "approve" | "deny";
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
    if (!body?.application_id || !["approve", "deny"].includes(body.action)) {
      return new Response(JSON.stringify({ error: "bad_request" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: app, error: appErr } = await admin
      .from("developer_rep_applications")
      .select("*")
      .eq("id", body.application_id)
      .maybeSingle();
    if (appErr || !app) {
      return new Response(JSON.stringify({ error: "not_found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (app.status !== "pending") {
      return new Response(JSON.stringify({ error: "already_decided", status: app.status }), {
        status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let createdRepId: string | null = null;

    if (body.action === "approve") {
      // Try to attach to the requested developer (search uae_developers + developers)
      let developerId: string | null = app.requested_developer_id ?? null;
      if (!developerId && app.requested_developer_name) {
        const { data: devMatch } = await admin
          .from("uae_developers")
          .select("id")
          .ilike("name", app.requested_developer_name)
          .limit(1)
          .maybeSingle();
        developerId = devMatch?.id ?? null;
      }

      if (developerId) {
        const { data: rep, error: repErr } = await admin
          .from("developer_sales_reps")
          .insert({
            developer_id: developerId,
            full_name: app.full_name,
            email: app.email,
            phone_e164: app.phone_e164,
            nationality: app.nationality,
            position: app.position,
            languages: app.languages ?? [],
            assigned_emirates: app.assigned_emirates ?? [],
            availability_status: "available",
            is_active: true,
          })
          .select("id")
          .single();
        if (repErr) {
          return new Response(JSON.stringify({ error: repErr.message }), {
            status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        createdRepId = rep.id;
      }
    }

    const { error: updErr } = await admin
      .from("developer_rep_applications")
      .update({
        status: body.action === "approve" ? "approved" : "denied",
        decided_by: u.user.id,
        decided_at: new Date().toISOString(),
        created_rep_id: createdRepId,
      })
      .eq("id", body.application_id);
    if (updErr) {
      return new Response(JSON.stringify({ error: updErr.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await admin.from("developer_portal_audit").insert({
      actor_id: u.user.id,
      action: `rep_application_${body.action}`,
      entity_type: "developer_rep_applications",
      entity_id: body.application_id,
      after: { created_rep_id: createdRepId },
    });

    return new Response(JSON.stringify({ ok: true, created_rep_id: createdRepId }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message ?? "internal_error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
