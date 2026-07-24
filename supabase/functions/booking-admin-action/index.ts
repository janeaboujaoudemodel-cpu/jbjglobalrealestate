// Admin actions on bookings: confirm | reject | cancel | reschedule.
// Requires an authenticated owner/admin session. All writes go through
// service role after the caller is verified.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), {
      status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const auth = req.headers.get("Authorization") ?? "";
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: auth } },
    });
    const { data: u } = await userClient.auth.getUser();
    const user = u?.user;
    if (!user) {
      return new Response(JSON.stringify({ error: "unauthenticated" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: role } = await admin
      .from("user_roles").select("role").eq("user_id", user.id).in("role", ["owner", "admin"]).maybeSingle();
    if (!role) {
      return new Response(JSON.stringify({ error: "forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { appointment_id, action, starts_at, ends_at, reason } = body ?? {};
    if (!appointment_id || !action) {
      return new Response(JSON.stringify({ error: "missing_fields" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: appt, error: aErr } = await admin
      .from("jbj_booking_appointments").select("*").eq("id", appointment_id).maybeSingle();
    if (aErr || !appt) {
      return new Response(JSON.stringify({ error: "not_found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    const auditEntry = {
      at: new Date().toISOString(),
      by: user.email ?? user.id,
      action,
      reason: reason ?? null,
    };

    if (action === "confirm") patch.status = "confirmed";
    else if (action === "reject") { patch.status = "rejected"; patch.cancellation_reason = reason ?? null; }
    else if (action === "cancel") { patch.status = "cancelled"; patch.cancellation_reason = reason ?? null; }
    else if (action === "reschedule") {
      if (!starts_at || !ends_at) {
        return new Response(JSON.stringify({ error: "starts_at_ends_at_required" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      patch.starts_at = starts_at;
      patch.ends_at = ends_at;
      patch.status = "rescheduled";
    } else {
      return new Response(JSON.stringify({ error: "invalid_action" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prevAudit = Array.isArray(appt.audit) ? appt.audit : [];
    patch.audit = [...prevAudit, auditEntry];

    const { error: uErr } = await admin
      .from("jbj_booking_appointments").update(patch).eq("id", appointment_id);
    if (uErr) throw uErr;

    return new Response(JSON.stringify({ ok: true }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ error: "server_error", details: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
