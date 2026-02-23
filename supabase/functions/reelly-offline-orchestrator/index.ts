/**
 * reelly-offline-orchestrator
 * 
 * Queries projects needing data, splits them into small batches of 10,
 * then fires each batch as a fire-and-forget request to reelly-complete-offline-save.
 * This avoids timeouts by never waiting for image mirroring to complete.
 * 
 * Called by pg_cron every 5 minutes until all projects are enriched.
 */

import { createClient } from "npm:@supabase/supabase-js@2";
import { acquireLock, releaseLock } from "../_shared/safe-execution.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const BATCH_SIZE = 10;
const MAX_BATCHES = 4; // reduced from 6 to 4 = max 40 projects per run

const FUNCTION_NAME = "reelly-offline-orchestrator";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // Concurrency guard
  const gotLock = await acquireLock(FUNCTION_NAME, 15);
  if (!gotLock) {
    console.log(`[${FUNCTION_NAME}] Skipped — previous execution still running`);
    return new Response(JSON.stringify({ success: true, skipped: true, message: "Previous execution still running" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const startTime = Date.now();
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const body = await req.json().catch(() => ({}));
    const forceAll = body.force_all === true;
    const mirrorImages = body.mirror_images !== false;

    // ── 1. Find projects that still need enrichment ──────────────────────────
    let query = supabase
      .from("projects")
      .select("reelly_id, id, name")
      .not("reelly_id", "is", null)
      .eq("is_published", true)
      .limit(BATCH_SIZE * MAX_BATCHES);

    if (!forceAll) {
      // Prioritize: no bedrooms OR no price (most impactful missing fields)
      query = query.or("bedrooms_min.is.null,price_from.is.null");
    } else {
      // Force mode: re-process everything (for image mirroring pass)
      query = query.order("updated_at", { ascending: true });
    }

    const { data: projects, error } = await query;

    if (error) {
      console.error("[orchestrator] Query error:", error.message);
      return new Response(JSON.stringify({ success: false, error: error.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!projects?.length) {
      // All high-priority fields done — now sweep for missing covers
      const { data: noCover } = await supabase
        .from("projects")
        .select("reelly_id, id, name")
        .not("reelly_id", "is", null)
        .eq("is_published", true)
        .is("cover_image_url", null)
        .limit(BATCH_SIZE * MAX_BATCHES);

      if (!noCover?.length) {
        return new Response(JSON.stringify({
          success: true,
          message: "All projects are fully enriched — nothing to process",
          batches_fired: 0,
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // Fire batches for no-cover projects
      const batches = chunk(noCover.map(p => p.reelly_id), BATCH_SIZE);
      fireAndForget(batches, mirrorImages);

      return new Response(JSON.stringify({
        success: true,
        message: `Fired ${batches.length} cover-fix batches for ${noCover.length} projects`,
        batches_fired: batches.length,
        projects_queued: noCover.length,
        mode: "cover-fix",
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ── 2. Split into batches of BATCH_SIZE and fire concurrently ────────────
    const reellyIds = projects.map(p => p.reelly_id);
    const batches = chunk(reellyIds, BATCH_SIZE);

    console.log(`[orchestrator] Firing ${batches.length} batches for ${reellyIds.length} projects`);

    // Fire all batches without awaiting — true fire-and-forget
    fireAndForget(batches, mirrorImages);

    await releaseLock(FUNCTION_NAME, Date.now() - startTime);
    return new Response(JSON.stringify({
      success: true,
      message: `Dispatched ${batches.length} sub-batches covering ${reellyIds.length} projects`,
      batches_fired: batches.length,
      projects_queued: reellyIds.length,
      sample_ids: reellyIds.slice(0, 5),
      duration_ms: Date.now() - startTime,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (e: any) {
    console.error("[orchestrator] Fatal:", e);
    await releaseLock(FUNCTION_NAME, Date.now() - startTime);
    return new Response(JSON.stringify({ success: false, error: e.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// ── Helpers ──────────────────────────────────────────────────────────────────

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function fireAndForget(batches: number[][], mirrorImages: boolean) {
  const functionUrl = `${SUPABASE_URL}/functions/v1/reelly-complete-offline-save`;
  const serviceKey = SUPABASE_SERVICE_ROLE_KEY;

  for (const batch of batches) {
    // Use EdgeRuntime.waitUntil if available, otherwise just fire without await
    const promise = fetch(functionUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${serviceKey}`,
        "apikey": serviceKey,
      },
      body: JSON.stringify({
        mode: "specific",
        project_ids: batch,
        batch_size: batch.length,
        mirror_images: mirrorImages,
      }),
    }).then(r => {
      console.log(`[orchestrator] Batch [${batch[0]}..] responded ${r.status}`);
      return r.text();
    }).catch(e => {
      console.warn(`[orchestrator] Batch [${batch[0]}..] fire error:`, e.message);
    });

    // Best-effort: register with edge runtime if available
    try {
      // @ts-ignore
      if (typeof EdgeRuntime !== "undefined" && EdgeRuntime.waitUntil) {
        // @ts-ignore
        EdgeRuntime.waitUntil(promise);
      }
    } catch (_) { /* ignore */ }
  }
}
