import { createClient } from "npm:@supabase/supabase-js@2";
import { discoverAllProjectsViaPageData } from "../_shared/provident/pagedata-discovery.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface ReellyLocation {
  id: number;
  country: number;
  region: string;
  city: string | null;
  district: string;
  sector: string;
  village: string | null;
  latitude: number;
  longitude: number;
}

interface ReellyProject {
  id: number;
  name: string;
  location: ReellyLocation;
  is_published: boolean;
}

interface ReellyPaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

interface AreaCandidate {
  name: string;
  emirate: string;
  locationId?: number;
  latitude?: number;
  longitude?: number;
  sector?: string;
  projectCount: number;
  source: "reelly" | "provident" | "both";
}

/**
 * Paginate through ALL Reelly projects to extract every unique area.
 */
async function fetchAllReellyAreas(apiKey: string): Promise<Map<string, AreaCandidate>> {
  const areas = new Map<string, AreaCandidate>();
  const PAGE_SIZE = 100;
  let offset = 0;
  let total = 0;
  let fetched = 0;

  do {
    const url = `https://api-reelly.up.railway.app/api/v2/clients/projects?limit=${PAGE_SIZE}&offset=${offset}`;
    const res = await fetch(url, {
      headers: { "X-API-Key": apiKey, "Content-Type": "application/json" },
    });

    if (!res.ok) {
      console.warn(`[AreasSync] Reelly API ${res.status} at offset ${offset}`);
      break;
    }

    const data: ReellyPaginatedResponse<ReellyProject> = await res.json();
    total = data.count || 0;
    const projects = data.results || [];
    fetched += projects.length;

    for (const p of projects) {
      if (!p.location?.district) continue;
      const name = p.location.district.trim();
      const key = name.toLowerCase();
      if (!key) continue;

      const existing = areas.get(key);
      if (existing) {
        existing.projectCount++;
        if (!existing.latitude && p.location.latitude) {
          existing.latitude = p.location.latitude;
          existing.longitude = p.location.longitude;
        }
      } else {
        areas.set(key, {
          name,
          emirate: p.location.region || "Dubai",
          locationId: p.location.id,
          latitude: p.location.latitude,
          longitude: p.location.longitude,
          sector: p.location.sector,
          projectCount: 1,
          source: "reelly",
        });
      }
    }

    offset += PAGE_SIZE;
    console.log(`[AreasSync] Reelly: fetched ${fetched}/${total} projects, ${areas.size} areas so far`);

    // Small delay to be respectful
    if (offset < total) await new Promise(r => setTimeout(r, 300));
  } while (offset < total);

  console.log(`[AreasSync] Reelly total: ${areas.size} unique areas from ${fetched} projects`);
  return areas;
}

/**
 * Extract areas from Provident discovery (uses Gatsby page-data).
 */
async function fetchProvidentAreas(): Promise<Map<string, AreaCandidate>> {
  const areas = new Map<string, AreaCandidate>();

  try {
    // Discover projects from Provident (pages 1-89)
    const discovery = await discoverAllProjectsViaPageData({ concurrency: 4 });
    console.log(`[AreasSync] Provident: discovered ${discovery.total_discovered} projects`);

    for (const p of discovery.projects) {
      if (!p.location) continue;
      // Provident locations are like "Dubai Hills Estate", "Palm Jumeirah", etc.
      const name = p.location.trim();
      const key = name.toLowerCase();
      if (!key || key.length < 2) continue;

      const existing = areas.get(key);
      if (existing) {
        existing.projectCount++;
      } else {
        areas.set(key, {
          name,
          emirate: "Dubai",
          projectCount: 1,
          source: "provident",
        });
      }
    }
  } catch (e) {
    console.warn(`[AreasSync] Provident discovery error:`, e);
  }

  console.log(`[AreasSync] Provident total: ${areas.size} unique areas`);
  return areas;
}

/**
 * Merge Reelly + Provident areas without duplicates.
 */
function mergeAreas(reelly: Map<string, AreaCandidate>, provident: Map<string, AreaCandidate>): Map<string, AreaCandidate> {
  const merged = new Map(reelly);

  for (const [key, pArea] of provident) {
    const existing = merged.get(key);
    if (existing) {
      existing.projectCount += pArea.projectCount;
      existing.source = "both";
    } else {
      merged.set(key, pArea);
    }
  }

  return merged;
}

/**
 * Generate a premium area description using AI.
 */
async function generateAreaDescription(areaName: string, projectCount: number, sector?: string): Promise<string | null> {
  try {
    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) return null;

    const prompt = `Write a 2-3 sentence premium real estate description for the Dubai area "${areaName}"${sector ? ` in the ${sector} sector` : ""}. It has approximately ${projectCount} new development projects. Focus on what makes this area attractive for property investment. Be factual and sophisticated, not promotional. Do not use exclamation marks.`;

    const res = await fetch("https://ai-gateway.lovable.dev/google/gemini-2.5-flash-lite/chat", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [{ role: "user", content: prompt }],
        max_tokens: 200,
      }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    return data?.choices?.[0]?.message?.content?.trim() || null;
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("REELLY_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json().catch(() => ({}));
    const action = body.action || "sync_from_api";
    const enrichDescriptions = body.enrich_descriptions !== false; // default true

    console.log(`[AreasSync] Action: ${action}, enrich: ${enrichDescriptions}`);

    // ========== Full Sync: Reelly + Provident ==========
    if (action === "sync_from_api" || action === "full_sync") {
      if (!apiKey) {
        return new Response(
          JSON.stringify({ success: false, error: "REELLY_API_KEY not configured" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      // Fetch areas from both sources in parallel
      const [reellyAreas, providentAreas] = await Promise.all([
        fetchAllReellyAreas(apiKey),
        action === "full_sync" ? fetchProvidentAreas() : Promise.resolve(new Map<string, AreaCandidate>()),
      ]);

      const merged = action === "full_sync" ? mergeAreas(reellyAreas, providentAreas) : reellyAreas;
      console.log(`[AreasSync] Merged: ${merged.size} unique areas`);

      // Get existing areas
      const { data: existingAreas } = await supabase
        .from("areas")
        .select("id, reelly_id, slug, name, description, latitude, longitude, property_count");

      const existingBySlug = new Map((existingAreas || []).map(a => [a.slug, a]));

      let inserted = 0;
      let updated = 0;
      let skipped = 0;
      let descriptionsGenerated = 0;
      let errors = 0;
      const errorDetails: string[] = [];

      for (const [, area] of merged) {
        try {
          const slug = generateSlug(area.name);
          const existing = existingBySlug.get(slug);

          if (existing) {
            const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

            if (area.latitude && area.longitude && !existing.latitude) {
              updates.latitude = area.latitude;
              updates.longitude = area.longitude;
            }
            if (area.locationId && !existing.reelly_id) {
              updates.reelly_id = area.locationId;
            }
            // Update project count
            updates.property_count = area.projectCount;

            // Generate description if missing
            if (!existing.description && enrichDescriptions) {
              const desc = await generateAreaDescription(area.name, area.projectCount, area.sector);
              if (desc) {
                updates.description = desc;
                descriptionsGenerated++;
              }
            }

            const { error } = await supabase.from("areas").update(updates).eq("id", existing.id);
            if (error) {
              errors++;
              errorDetails.push(`Update ${area.name}: ${error.message}`);
            } else {
              updated++;
            }
          } else {
            // Generate description for new area
            let description: string | null = null;
            if (enrichDescriptions) {
              description = await generateAreaDescription(area.name, area.projectCount, area.sector);
              if (description) descriptionsGenerated++;
            }

            const { error } = await supabase.from("areas").insert({
              name: area.name,
              slug,
              emirate: area.emirate,
              reelly_id: area.locationId || null,
              latitude: area.latitude || null,
              longitude: area.longitude || null,
              property_count: area.projectCount,
              description,
              is_active: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            });

            if (error) {
              if (error.code === "23505") skipped++;
              else {
                errors++;
                errorDetails.push(`Insert ${area.name}: ${error.message}`);
              }
            } else {
              inserted++;
            }
          }
        } catch (err) {
          errors++;
          errorDetails.push(`${area.name}: ${err instanceof Error ? err.message : String(err)}`);
        }
      }

      return new Response(JSON.stringify({
        success: true,
        action,
        reelly_areas: reellyAreas.size,
        provident_areas: action === "full_sync" ? providentAreas.size : 0,
        merged_total: merged.size,
        inserted,
        updated,
        skipped,
        descriptions_generated: descriptionsGenerated,
        errors,
        error_details: errorDetails.slice(0, 10),
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ========== Test mode ==========
    if (action === "test") {
      if (!apiKey) {
        return new Response(
          JSON.stringify({ success: false, error: "REELLY_API_KEY not configured" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      // Quick test: first page only
      const url = `https://api-reelly.up.railway.app/api/v2/clients/projects?limit=200&offset=0`;
      const res = await fetch(url, {
        headers: { "X-API-Key": apiKey, "Content-Type": "application/json" },
      });

      if (!res.ok) {
        return new Response(JSON.stringify({ success: false, error: `API ${res.status}` }), {
          status: res.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const data: ReellyPaginatedResponse<ReellyProject> = await res.json();
      const areas = new Map<string, { name: string; count: number }>();

      for (const p of data.results || []) {
        if (p.location?.district) {
          const key = p.location.district.toLowerCase().trim();
          const existing = areas.get(key);
          if (existing) existing.count++;
          else areas.set(key, { name: p.location.district.trim(), count: 1 });
        }
      }

      return new Response(JSON.stringify({
        success: true,
        mode: "test",
        total_projects_available: data.count,
        projects_sampled: data.results?.length || 0,
        unique_areas_found: areas.size,
        sample_areas: Array.from(areas.values()).sort((a, b) => b.count - a.count).slice(0, 20),
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ========== Extract from projects table ==========
    if (action === "extract_from_projects") {
      // Extract areas from the projects table itself
      const { data: projects } = await supabase
        .from("projects")
        .select("area_name")
        .not("area_name", "is", null)
        .neq("area_name", "");

      const areas = new Map<string, { name: string; count: number }>();
      for (const p of projects || []) {
        if (p.area_name) {
          const key = p.area_name.toLowerCase().trim();
          const existing = areas.get(key);
          if (existing) existing.count++;
          else areas.set(key, { name: p.area_name.trim(), count: 1 });
        }
      }

      const { data: existingAreas } = await supabase.from("areas").select("slug");
      const existingSlugs = new Set((existingAreas || []).map(a => a.slug));

      let inserted = 0;
      let skipped = 0;
      let descriptionsGenerated = 0;

      for (const [, area] of areas) {
        const slug = generateSlug(area.name);
        if (existingSlugs.has(slug)) { skipped++; continue; }

        let description: string | null = null;
        if (enrichDescriptions) {
          description = await generateAreaDescription(area.name, area.count);
          if (description) descriptionsGenerated++;
        }

        const { error } = await supabase.from("areas").insert({
          name: area.name,
          slug,
          emirate: "Dubai",
          property_count: area.count,
          description,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        if (!error) inserted++;
        else if (error.code !== "23505") console.warn(`Insert ${area.name}: ${error.message}`);
        else skipped++;
      }

      return new Response(JSON.stringify({
        success: true,
        action: "extract_from_projects",
        unique_areas: areas.size,
        inserted,
        skipped,
        descriptions_generated: descriptionsGenerated,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({
      success: true,
      message: "Actions: 'sync_from_api' (Reelly only), 'full_sync' (Reelly + Provident), 'test', 'extract_from_projects'",
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error) {
    console.error("[AreasSync] Fatal:", error);
    return new Response(JSON.stringify({ success: false, error: error instanceof Error ? error.message : String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
