// developer-visibility-bulk-set
// Owner-only. Sets per-field public visibility flags (public_fields jsonb)
// on a batch of developers.
//
// Body: { developer_ids: string[], fields: Record<string, boolean>, mode: "merge" | "replace" }
// Allowed field keys: instagram_url, linkedin_url, office_address, google_maps_url,
// office_phone, whatsapp, website_url, admin_email.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { requireOwnerAuth } from "../_shared/owner-auth-middleware.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ALLOWED = new Set([
  "instagram_url", "linkedin_url", "office_address", "google_maps_url",
  "office_phone", "whatsapp", "website_url", "admin_email",
]);

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

  let body: {
    developer_ids?: string[];
    fields?: Record<string, boolean>;
    mode?: "merge" | "replace";
  } = {};
  try { body = await req.json(); } catch { /* ignore */ }

  const ids = Array.isArray(body.developer_ids) ? body.developer_ids.filter((x) => typeof x === "string") : [];
  if (!ids.length) {
    return new Response(JSON.stringify({ error: "developer_ids required" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  if (ids.length > 1000) {
    return new Response(JSON.stringify({ error: "max 1000 developers per call" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const fieldsIn = body.fields && typeof body.fields === "object" ? body.fields : {};
  const cleaned: Record<string, boolean> = {};
  for (const [k, v] of Object.entries(fieldsIn)) {
    if (ALLOWED.has(k)) cleaned[k] = !!v;
  }
  if (!Object.keys(cleaned).length) {
    return new Response(JSON.stringify({ error: "no valid fields provided" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const mode = body.mode === "replace" ? "replace" : "merge";

  const supa = admin();
  let ok = 0, fail = 0;

  if (mode === "replace") {
    const { error } = await supa.from("developers").update({ public_fields: cleaned }).in("id", ids);
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    ok = ids.length;
  } else {
    const { data: current, error } = await supa
      .from("developers")
      .select("id, public_fields")
      .in("id", ids);
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    for (const row of current ?? []) {
      const merged = { ...((row.public_fields as Record<string, boolean>) ?? {}), ...cleaned };
      const { error: upErr } = await supa.from("developers")
        .update({ public_fields: merged })
        .eq("id", row.id);
      if (upErr) { console.error("update failed", row.id, upErr); fail++; } else { ok++; }
    }
  }

  return new Response(JSON.stringify({ ok: true, updated: ok, failed: fail, fields: cleaned, mode }), {
    status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
