import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  const results: Record<string, unknown> = {};
  const errors: string[] = [];

  const callFunction = async (name: string, body: Record<string, unknown> = {}) => {
    const url = `${supabaseUrl}/functions/v1/${name}`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${anonKey}`,
      },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }
    if (!res.ok) {
      throw new Error(`${name} returned ${res.status}: ${JSON.stringify(data)}`);
    }
    return data;
  };

  // Step 1: Sync projects from Reelly API
  try {
    console.log("[daily-reelly-auto-sync] Step 1: Syncing projects from Reelly API...");
    const syncResult = await callFunction("reelly-api-sync", {
      action: "sync",
      mode: "quick",
    });
    results.reelly_sync = syncResult;
    console.log("[daily-reelly-auto-sync] Step 1 complete:", JSON.stringify(syncResult).slice(0, 200));
  } catch (err) {
    const msg = `Step 1 (reelly-api-sync) failed: ${err.message}`;
    console.error("[daily-reelly-auto-sync]", msg);
    errors.push(msg);
  }

  // Step 2: Discover new developers and logos (full mode to update all logos)
  try {
    console.log("[daily-reelly-auto-sync] Step 2: Syncing developers (quick mode)...");
    const devResult = await callFunction("reelly-developers-sync", {
      mode: "quick",
    });
    results.developers_sync = devResult;
    console.log("[daily-reelly-auto-sync] Step 2 complete:", JSON.stringify(devResult).slice(0, 200));
  } catch (err) {
    const msg = `Step 2 (reelly-developers-sync) failed: ${err.message}`;
    console.error("[daily-reelly-auto-sync]", msg);
    errors.push(msg);
  }

  // Step 3: Discover new areas
  try {
    console.log("[daily-reelly-auto-sync] Step 3: Syncing areas...");
    const areaResult = await callFunction("reelly-areas-sync");
    results.areas_sync = areaResult;
    console.log("[daily-reelly-auto-sync] Step 3 complete:", JSON.stringify(areaResult).slice(0, 200));
  } catch (err) {
    const msg = `Step 3 (reelly-areas-sync) failed: ${err.message}`;
    console.error("[daily-reelly-auto-sync]", msg);
    errors.push(msg);
  }

  // Step 4: Auto-approve all pending imports
  try {
    console.log("[daily-reelly-auto-sync] Step 4: Bulk approving pending imports...");
    const approveResult = await callFunction("bulk-approve-imports", {
      approve_all: true,
    });
    results.bulk_approve = approveResult;
    console.log("[daily-reelly-auto-sync] Step 4 complete:", JSON.stringify(approveResult).slice(0, 200));
  } catch (err) {
    const msg = `Step 4 (bulk-approve-imports) failed: ${err.message}`;
    console.error("[daily-reelly-auto-sync]", msg);
    errors.push(msg);
  }

  // Step 5: Sync developer feature images from project covers
  try {
    console.log("[daily-reelly-auto-sync] Step 5: Syncing developer feature images...");
    const imageResult = await callFunction("sync-developer-feature-images", {
      dryRun: false,
    });
    results.feature_images = imageResult;
    console.log("[daily-reelly-auto-sync] Step 5 complete:", JSON.stringify(imageResult).slice(0, 200));
  } catch (err) {
    const msg = `Step 5 (sync-developer-feature-images) failed: ${err.message}`;
    console.error("[daily-reelly-auto-sync]", msg);
    errors.push(msg);
  }

  // Step 6: Sync dictionaries (statuses, unit types, regions) & fast logo refresh
  try {
    console.log("[daily-reelly-auto-sync] Step 6: Syncing Reelly dictionaries and developer logos...");
    const dictResult = await callFunction("reelly-dictionary-sync", {
      skip_logos: false,
    });
    results.dictionary_sync = dictResult;
    console.log("[daily-reelly-auto-sync] Step 6 complete:", JSON.stringify(dictResult).slice(0, 200));
  } catch (err) {
    const msg = `Step 6 (reelly-dictionary-sync) failed: ${err.message}`;
    console.error("[daily-reelly-auto-sync]", msg);
    errors.push(msg);
  }

  // Step 7: Sync project markers (coordinates, price, status updates)
  try {
    console.log("[daily-reelly-auto-sync] Step 7: Syncing project markers...");
    const markersResult = await callFunction("reelly-markers-sync", {
      dry_run: false,
    });
    results.markers_sync = markersResult;
    console.log("[daily-reelly-auto-sync] Step 7 complete:", JSON.stringify(markersResult).slice(0, 200));
  } catch (err) {
    const msg = `Step 7 (reelly-markers-sync) failed: ${err.message}`;
    console.error("[daily-reelly-auto-sync]", msg);
    errors.push(msg);
  }

  // Step 8: Full backfill — mirror ALL assets (images, docs, floor plans) to local storage
  try {
    console.log("[daily-reelly-auto-sync] Step 8: Backfilling with full mirroring (images + docs)...");
    const backfillResult = await callFunction("reelly-complete-offline-save", {
      mode: "batch",
      batch_size: 50,
      mirror_images: true, // Always mirror to local storage
    });
    results.offline_backfill = backfillResult;
    console.log("[daily-reelly-auto-sync] Step 8 complete:", JSON.stringify(backfillResult).slice(0, 200));
  } catch (err) {
    const msg = `Step 8 (reelly-complete-offline-save) failed: ${err.message}`;
    console.error("[daily-reelly-auto-sync]", msg);
    errors.push(msg);
  }

  // Step 9: Convert remaining external URLs to local — gradual migration
  try {
    console.log("[daily-reelly-auto-sync] Step 9: Converting external URLs to local storage...");
    const mirrorResult = await callFunction("reelly-emergency-mirror", {
      mode: "start",
    });
    results.external_url_migration = mirrorResult;
    console.log("[daily-reelly-auto-sync] Step 9 complete:", JSON.stringify(mirrorResult).slice(0, 200));
  } catch (err) {
    const msg = `Step 9 (reelly-emergency-mirror) failed: ${err.message}`;
    console.error("[daily-reelly-auto-sync]", msg);
    errors.push(msg);
  }

  // Log summary to database
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const statsCreated = (results.reelly_sync as any)?.created ?? 0;
    const statsUpdated = (results.reelly_sync as any)?.updated ?? 0;
    await supabase.from("sync_jobs").insert({
      job_type: "daily-reelly-auto-sync",
      status: errors.length === 0 ? "completed" : "failed",
      source: "reelly",
      stats_created: statsCreated,
      stats_updated: statsUpdated,
      stats_errors: errors.length,
      error_log: errors.length > 0 ? { steps: results, errors } : null,
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
    });
  } catch (logErr) {
    console.error("[daily-reelly-auto-sync] Failed to log job:", logErr.message);
  }

  return new Response(
    JSON.stringify({
      success: errors.length === 0,
      steps: results,
      errors,
      timestamp: new Date().toISOString(),
    }),
    {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: errors.length === 0 ? 200 : 207,
    }
  );
});
