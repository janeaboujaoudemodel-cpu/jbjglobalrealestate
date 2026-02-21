/**
 * reelly-emergency-mirror
 *
 * Emergency full-extraction orchestrator. Fires batches of 10 to
 * reelly-complete-offline-save with mirror_images: true until all
 * projects with missing data are enriched.
 *
 * Modes:
 *   status  — Return counts of projects needing enrichment (no writes)
 *   start   — Fire batches for projects missing critical data
 *   full    — Fire batches for ALL published Reelly projects (complete re-mirror)
 */

import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const BATCH_SIZE = 10;
const MAX_BATCHES = 20; // 200 projects per orchestrator call

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const body = await req.json().catch(() => ({}));
    const mode = body.mode || "status";
    const offset = body.offset || 0; // For paginating through all projects in "full" mode

    // ── Count projects needing enrichment ────────────────────────────────────
    const { count: needsBedrooms } = await supabase
      .from("projects")
      .select("*", { count: "exact", head: true })
      .not("reelly_id", "is", null)
      .eq("is_published", true)
      .is("bedrooms_min", null);

    const { count: needsPrice } = await supabase
      .from("projects")
      .select("*", { count: "exact", head: true })
      .not("reelly_id", "is", null)
      .eq("is_published", true)
      .is("price_from", null);

    const { count: needsCover } = await supabase
      .from("projects")
      .select("*", { count: "exact", head: true })
      .not("reelly_id", "is", null)
      .eq("is_published", true)
      .is("cover_image_url", null);

    const { count: needsAmenities } = await supabase
      .from("projects")
      .select("*", { count: "exact", head: true })
      .not("reelly_id", "is", null)
      .eq("is_published", true)
      .is("amenities", null);

    const { count: needsUnitTypes } = await supabase
      .from("projects")
      .select("*", { count: "exact", head: true })
      .not("reelly_id", "is", null)
      .eq("is_published", true)
      .is("unit_types", null);

    const { count: externalCovers } = await supabase
      .from("projects")
      .select("*", { count: "exact", head: true })
      .not("reelly_id", "is", null)
      .eq("is_published", true)
      .not("cover_image_url", "is", null)
      .not("cover_image_url", "like", "%mdafrewypkkrildjgtey%");

    const { count: totalProjects } = await supabase
      .from("projects")
      .select("*", { count: "exact", head: true })
      .not("reelly_id", "is", null)
      .eq("is_published", true);

    if (mode === "status") {
      return new Response(JSON.stringify({
        success: true,
        mode: "status",
        total_reelly_projects: totalProjects,
        needs_bedrooms: needsBedrooms,
        needs_price: needsPrice,
        needs_cover: needsCover,
        needs_amenities: needsAmenities,
        needs_unit_types: needsUnitTypes,
        external_cover_urls: externalCovers,
        estimated_batches_needed: Math.ceil((totalProjects || 0) / BATCH_SIZE),
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ── "full" mode: process ALL published projects ──────────────────────────
    if (mode === "full") {
      const { data: allProjects } = await supabase
        .from("projects")
        .select("reelly_id, name")
        .not("reelly_id", "is", null)
        .eq("is_published", true)
        .order("reelly_id", { ascending: true })
        .range(offset, offset + BATCH_SIZE * MAX_BATCHES - 1);

      if (!allProjects?.length) {
        return new Response(JSON.stringify({
          success: true,
          mode: "full",
          message: offset > 0 ? "All remaining projects processed!" : "No projects found",
          batches_fired: 0,
          projects_queued: 0,
          next_offset: null,
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const reellyIds = allProjects.map(p => p.reelly_id).filter(Boolean);
      const batches = chunk(reellyIds, BATCH_SIZE);

      console.log(`[emergency-mirror:full] Firing ${batches.length} batches for ${reellyIds.length} projects (offset ${offset})`);

      const functionUrl = `${SUPABASE_URL}/functions/v1/reelly-complete-offline-save`;
      for (const batch of batches) {
        const promise = fetch(functionUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            "apikey": SUPABASE_SERVICE_ROLE_KEY,
          },
          body: JSON.stringify({
            mode: "specific",
            project_ids: batch,
            batch_size: batch.length,
            mirror_images: true,
          }),
        }).then(r => {
          console.log(`[emergency-mirror:full] Batch [${batch[0]}..] responded ${r.status}`);
          return r.text();
        }).catch(e => {
          console.warn(`[emergency-mirror:full] Batch [${batch[0]}..] error:`, e.message);
        });

        try {
          // @ts-ignore
          if (typeof EdgeRuntime !== "undefined" && EdgeRuntime.waitUntil) {
            // @ts-ignore
            EdgeRuntime.waitUntil(promise);
          }
        } catch (_) { /* ignore */ }
      }

      const nextOffset = reellyIds.length >= BATCH_SIZE * MAX_BATCHES ? offset + reellyIds.length : null;

      return new Response(JSON.stringify({
        success: true,
        mode: "full",
        message: `Dispatched ${batches.length} batches (${reellyIds.length} projects) with full mirroring`,
        batches_fired: batches.length,
        projects_queued: reellyIds.length,
        offset_used: offset,
        next_offset: nextOffset,
        call_again: nextOffset !== null,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ── "start" mode: fire batches for projects with missing data ─────────────
    const { data: missingData } = await supabase
      .from("projects")
      .select("reelly_id, name")
      .not("reelly_id", "is", null)
      .eq("is_published", true)
      .or("bedrooms_min.is.null,price_from.is.null,cover_image_url.is.null,amenities.is.null,unit_types.is.null")
      .limit(BATCH_SIZE * MAX_BATCHES);

    if (!missingData?.length) {
      return new Response(JSON.stringify({
        success: true,
        mode: "start",
        message: "All projects already have complete data!",
        batches_fired: 0,
        projects_queued: 0,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const reellyIds = missingData.map(p => p.reelly_id).filter(Boolean);
    const batches = chunk(reellyIds, BATCH_SIZE);

    console.log(`[emergency-mirror] Firing ${batches.length} batches for ${reellyIds.length} projects`);

    const functionUrl = `${SUPABASE_URL}/functions/v1/reelly-complete-offline-save`;
    for (const batch of batches) {
      const promise = fetch(functionUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          "apikey": SUPABASE_SERVICE_ROLE_KEY,
        },
        body: JSON.stringify({
          mode: "specific",
          project_ids: batch,
          batch_size: batch.length,
          mirror_images: true,
        }),
      }).then(r => {
        console.log(`[emergency-mirror] Batch [${batch[0]}..] responded ${r.status}`);
        return r.text();
      }).catch(e => {
        console.warn(`[emergency-mirror] Batch [${batch[0]}..] error:`, e.message);
      });

      try {
        // @ts-ignore
        if (typeof EdgeRuntime !== "undefined" && EdgeRuntime.waitUntil) {
          // @ts-ignore
          EdgeRuntime.waitUntil(promise);
        }
      } catch (_) { /* ignore */ }
    }

    return new Response(JSON.stringify({
      success: true,
      mode: "start",
      message: `Dispatched ${batches.length} batches (${reellyIds.length} projects) with image mirroring enabled`,
      batches_fired: batches.length,
      projects_queued: reellyIds.length,
      status_before: {
        needs_bedrooms: needsBedrooms,
        needs_price: needsPrice,
        needs_cover: needsCover,
        needs_amenities: needsAmenities,
        needs_unit_types: needsUnitTypes,
      },
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (e: any) {
    console.error("[emergency-mirror] Fatal:", e);
    return new Response(JSON.stringify({ success: false, error: e.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}
