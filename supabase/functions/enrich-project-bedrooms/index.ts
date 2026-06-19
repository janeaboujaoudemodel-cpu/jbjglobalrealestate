/**
 * enrich-project-bedrooms
 * Owner-only. Searches UAE portals (Provident, Property Finder, Bayut, Driven) for the
 * project's real bedroom mix and returns a Before/After diff (`bedrooms_min`, `bedrooms_max`,
 * `bedroom_types`). Never writes — apply step is `apply=true` after preview.
 */
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { firecrawlScrape } from "../_shared/firecrawl.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

const SOURCES = (name: string, area?: string | null) => {
  const q = encodeURIComponent(`${name}${area ? " " + area : ""} Dubai bedrooms apartment`);
  return [
    `https://www.propertyfinder.ae/en/search?l=1&c=2&q=${q}`,
    `https://www.bayut.com/to-buy/property/dubai/?q=${q}`,
    `https://www.providentestate.com/?s=${q}`,
    `https://drivenproperties.com/?s=${q}`,
  ];
};

function inferBedroomTypes(text: string): { types: number[]; min: number | null; max: number | null } {
  const norm = text.toLowerCase().replace(/\s+/g, " ");
  const set = new Set<number>();
  // matches "1 BR", "1-bedroom", "studio", "2 bedroom", "1 / 2 / 3 bedroom"
  if (/\bstudio\b/.test(norm)) set.add(0);
  const re = /(\d)\s*(?:-|–)?\s*(?:br|bed|bedroom|bedrooms|bhk)\b/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(norm))) {
    const n = parseInt(m[1], 10);
    if (n >= 0 && n <= 8) set.add(n);
  }
  if (set.size === 0) return { types: [], min: null, max: null };
  const arr = [...set].sort((a, b) => a - b);
  return { types: arr, min: arr[0], max: arr[arr.length - 1] };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    // ── Auth: owner only ──────────────────────────────────────────────
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    if (!token) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: { user } } = await admin.auth.getUser(token);
    if (!user?.id) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const { data: roleRow } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .in("role", ["owner", "admin"]);
    if (!roleRow?.length) return new Response(JSON.stringify({ error: "Owner only" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const body = await req.json().catch(() => ({}));
    const projectId = String(body.projectId || "");
    const apply = !!body.apply;
    if (!projectId) return new Response(JSON.stringify({ error: "projectId required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // ── Load project ──────────────────────────────────────────────────
    const { data: project } = await admin
      .from("projects")
      .select("id, name, slug, bedrooms_min, bedrooms_max, bedroom_types, area:areas(name)")
      .eq("id", projectId)
      .maybeSingle();
    if (!project) return new Response(JSON.stringify({ error: "Project not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const before = {
      bedrooms_min: project.bedrooms_min ?? null,
      bedrooms_max: project.bedrooms_max ?? null,
      bedroom_types: project.bedroom_types ?? null,
    };

    // ── Apply step ────────────────────────────────────────────────────
    if (apply) {
      const proposed = body.proposed || {};
      const upd: any = {};
      if (typeof proposed.bedrooms_min === "number") upd.bedrooms_min = proposed.bedrooms_min;
      if (typeof proposed.bedrooms_max === "number") upd.bedrooms_max = proposed.bedrooms_max;
      if (Array.isArray(proposed.bedroom_types)) upd.bedroom_types = proposed.bedroom_types;
      if (Object.keys(upd).length === 0) {
        return new Response(JSON.stringify({ error: "Nothing to apply" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const { error: uErr } = await admin.from("projects").update(upd).eq("id", projectId);
      if (uErr) throw uErr;
      await admin.from("admin_edit_log").insert({
        entity_type: "project",
        entity_id: projectId,
        entity_name: project.name,
        action: "ai_enrich_bedrooms",
        section: "details",
        changed_fields: Object.keys(upd),
        before_values: before,
        after_values: upd,
        summary: "Bedroom mix backfilled from public portal data",
        user_id: user.id,
      } as any);
      return new Response(JSON.stringify({ ok: true, before, after: upd }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ── Preview step: scrape + extract ───────────────────────────────
    const urls = SOURCES(project.name, (project as any).area?.name);
    const aggregated: string[] = [];
    const citations: string[] = [];
    for (const u of urls) {
      try {
        const r = await firecrawlScrape(u, { formats: ["markdown"], onlyMainContent: true });
        const md = r?.data?.markdown || r?.markdown;
        if (md && typeof md === "string") {
          aggregated.push(md.slice(0, 12000));
          citations.push(u);
        }
      } catch (e) {
        console.warn("scrape failed", u, e);
      }
      if (aggregated.length >= 3) break;
    }

    let inferred = inferBedroomTypes(aggregated.join("\n\n"));

    // ── LLM refinement via Lovable AI Gateway ────────────────────────
    if (LOVABLE_API_KEY && aggregated.length) {
      try {
        const prompt = `Extract the bedroom mix for the Dubai project "${project.name}" from the source text below. Return ONLY JSON of shape {"bedrooms_min":number|null,"bedrooms_max":number|null,"bedroom_types":number[],"confidence":"high"|"medium"|"low"}. Use 0 for Studio. Do not invent values; if uncertain, return null/empty arrays.\n\n=== SOURCES ===\n${aggregated.join("\n\n---\n\n").slice(0, 14000)}`;
        const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" },
          }),
        });
        if (aiRes.ok) {
          const j = await aiRes.json();
          const txt = j?.choices?.[0]?.message?.content;
          if (typeof txt === "string") {
            const parsed = JSON.parse(txt);
            if (Array.isArray(parsed?.bedroom_types) && parsed.bedroom_types.length) {
              const types = parsed.bedroom_types.filter((n: any) => typeof n === "number" && n >= 0 && n <= 8);
              inferred = {
                types,
                min: typeof parsed.bedrooms_min === "number" ? parsed.bedrooms_min : (types.length ? Math.min(...types) : null),
                max: typeof parsed.bedrooms_max === "number" ? parsed.bedrooms_max : (types.length ? Math.max(...types) : null),
              };
            }
          }
        }
      } catch (e) { console.warn("ai refine failed", e); }
    }

    const proposed = {
      bedrooms_min: inferred.min,
      bedrooms_max: inferred.max,
      bedroom_types: inferred.types,
    };

    const hasFinding = inferred.types.length > 0;

    return new Response(JSON.stringify({
      ok: true,
      before,
      proposed,
      hasFinding,
      citations,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    console.error("enrich-project-bedrooms error", e);
    return new Response(JSON.stringify({ error: e?.message || "Internal error" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
