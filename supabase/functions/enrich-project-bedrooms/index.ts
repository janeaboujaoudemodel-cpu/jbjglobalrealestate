// enrich-project-bedrooms
// ------------------------------------------------------------
// Reelly-only bedroom enrichment for a single project (owner/admin tool).
// The Property Finder / Bayut / Driven scraping path was removed per the
// no-secondary-source-scraping rule (mem://constraints/no-secondary-source-scraping).
//
// Source of truth: projects.reelly_raw_data.typical_units[].bedrooms
// — populated by background-enrichment-runner from the Reelly partner API
// (developer-direct off-plan feed).
//
// Modes (POST body):
//   { projectId, preview?: true }  → returns { before, proposed, hasFinding }
//   { projectId, apply: true }     → updates projects.bedrooms_{min,max,types}
//                                    and writes an admin_edit_log row so the
//                                    Undo flow keeps working.
// ------------------------------------------------------------

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function extractBedroomsFromReelly(raw: any): { min: number | null; max: number | null; types: number[] } {
  const units = raw?.typical_units;
  if (!Array.isArray(units) || units.length === 0) return { min: null, max: null, types: [] };
  const nums = new Set<number>();
  for (const u of units) {
    const b = u?.bedrooms;
    if (typeof b === "number" && Number.isFinite(b)) {
      nums.add(b);
    } else if (typeof b === "string") {
      const s = b.trim().toLowerCase();
      if (s === "studio" || s === "0") nums.add(0);
      else {
        const m = s.match(/(\d+)/);
        if (m) nums.add(parseInt(m[1], 10));
      }
    }
  }
  if (nums.size === 0) return { min: null, max: null, types: [] };
  const arr = Array.from(nums).sort((a, b) => a - b);
  return { min: arr[0], max: arr[arr.length - 1], types: arr };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  if (!supabaseUrl || !serviceKey) return json(500, { error: "Missing config" });

  const supabase = createClient(supabaseUrl, serviceKey);

  // Auth — owner/admin only
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return json(401, { error: "unauthorized" });
  const token = authHeader.replace("Bearer ", "");
  const { data: userData } = await supabase.auth.getUser(token);
  const userId = userData?.user?.id;
  if (!userId) return json(401, { error: "unauthorized" });

  const { data: roleRow } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .in("role", ["owner", "admin"])
    .maybeSingle();
  if (!roleRow) return json(403, { error: "forbidden" });

  let body: any = {};
  try { body = await req.json(); } catch { /* noop */ }
  const projectId: string = body.projectId;
  const apply: boolean = body.apply === true;
  if (!projectId) return json(400, { error: "projectId required" });

  const { data: project, error: pErr } = await supabase
    .from("projects")
    .select("id, name, bedrooms_min, bedrooms_max, bedroom_types, reelly_raw_data")
    .eq("id", projectId)
    .single();
  if (pErr || !project) return json(404, { error: "project not found" });

  const before = {
    bedrooms_min: project.bedrooms_min,
    bedrooms_max: project.bedrooms_max,
    bedroom_types: project.bedroom_types,
  };
  const proposed = extractBedroomsFromReelly(project.reelly_raw_data);
  const hasFinding = proposed.min != null || proposed.max != null || proposed.types.length > 0;

  if (!apply) {
    return json(200, { before, proposed, hasFinding, source: "reelly_partner_api" });
  }

  if (!hasFinding) return json(200, { applied: false, reason: "no_data" });

  const updates: Record<string, any> = {};
  if (proposed.min != null) updates.bedrooms_min = proposed.min;
  if (proposed.max != null) updates.bedrooms_max = proposed.max;
  if (proposed.types.length > 0) updates.bedroom_types = proposed.types;

  const { error: uErr } = await supabase.from("projects").update(updates).eq("id", projectId);
  if (uErr) return json(500, { error: uErr.message });

  await supabase.from("admin_edit_log").insert({
    project_id: projectId,
    user_id: userId,
    action: "ai_enrich_bedrooms",
    section: "bedrooms",
    changed_fields: Object.keys(updates),
    before_values: before,
    after_values: updates,
    summary: `Bedrooms enriched from Reelly partner API (min=${proposed.min}, max=${proposed.max}, types=[${proposed.types.join(",")}])`,
  });

  return json(200, { applied: true, updates });
});
