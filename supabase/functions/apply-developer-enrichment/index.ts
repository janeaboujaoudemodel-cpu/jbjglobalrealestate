// apply-developer-enrichment
// Owner approves a staged developer_enrichment_log entry → applied to developers row.
// Never deletes. Skips logo_url field when developer's logo_locked=true.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { requireOwnerAuth } from "../_shared/owner-auth-middleware.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface Body { log_id?: string; action?: "approve" | "reject"; }

function admin() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const gate = await requireOwnerAuth(req, corsHeaders);
  if (gate.response) return gate.response;

  let body: Body = {};
  try { body = await req.json(); } catch { /* ignore */ }
  if (!body.log_id) {
    return new Response(JSON.stringify({ error: "log_id required" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const action = body.action ?? "approve";
  const supa = admin();

  const { data: log, error } = await supa
    .from("developer_enrichment_log")
    .select("id, developer_id, after_jsonb, status")
    .eq("id", body.log_id)
    .maybeSingle();
  if (error || !log) {
    return new Response(JSON.stringify({ error: "log not found" }), {
      status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  if (log.status === "applied") {
    return new Response(JSON.stringify({ ok: true, already: true }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (action === "reject") {
    await supa.from("developer_enrichment_log").update({ status: "rejected" }).eq("id", log.id);
    return new Response(JSON.stringify({ ok: true, status: "rejected" }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Respect logo lock
  const { data: dev } = await supa.from("developers").select("logo_locked").eq("id", log.developer_id).maybeSingle();
  const after = { ...(log.after_jsonb as Record<string, unknown>) };
  if (dev?.logo_locked) delete after.logo_url;

  const { error: upErr } = await supa.from("developers").update(after).eq("id", log.developer_id);
  if (upErr) {
    await supa.from("developer_enrichment_log").update({ status: "failed", error: upErr.message }).eq("id", log.id);
    return new Response(JSON.stringify({ error: upErr.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  await supa.from("developer_enrichment_log").update({
    status: "applied", applied_at: new Date().toISOString(), applied_by: gate.userId,
  }).eq("id", log.id);

  return new Response(JSON.stringify({ ok: true, status: "applied", fields: Object.keys(after) }), {
    status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
