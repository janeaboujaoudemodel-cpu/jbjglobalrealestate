import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Daily Auto-Extraction — Single daily cron entry point
 * 
 * 1. Processes pending_project_imports with missing data (batch-extract-pending)
 * 2. Triggers daily-provident-auto-sync for full source mirror
 */

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    const body = await req.json().catch(() => ({}));
    const manual = body?.manual === true;
    const batchSize = body?.batchSize ?? 10;
    const maxBatches = body?.maxBatches ?? 20;

    // Log extraction start
    const { data: jobLog } = await supabase
      .from("extraction_job_logs")
      .insert({
        source_id: null,
        status: "running",
        started_at: new Date().toISOString(),
        records_found: 0,
        records_matched: 0,
        records_pending: 0,
      })
      .select("id")
      .single();

    const jobId = jobLog?.id;

    let totalProcessed = 0;
    let totalSuccess = 0;
    let totalErrors = 0;

    // ═══════════════════════════════════════════════════════════════
    // PHASE 1: Process pending imports queue (batch-extract-pending)
    // ═══════════════════════════════════════════════════════════════
    console.log("[daily-auto-extraction] Phase 1: Processing pending imports...");

    for (let batch = 0; batch < maxBatches; batch++) {
      // Find pending imports that need extraction (missing core data)
      const { data: pending, error: fetchErr } = await supabase
        .from("pending_project_imports")
        .select("id")
        .eq("status", "pending")
        .or(
          [
            "description.is.null",
            "images.is.null",
            "images.eq.[]",
            "developer_name.is.null",
            "developer_name.ilike.unknown",
          ].join(",")
        )
        .order("created_at", { ascending: true })
        .limit(batchSize);

      if (fetchErr) {
        console.error("Error fetching pending imports:", fetchErr);
        break;
      }

      if (!pending || pending.length === 0) {
        console.log("No more pending imports need extraction");
        break;
      }

      // Process each item through the batch extractor
      try {
        const response = await fetch(
          `${supabaseUrl}/functions/v1/batch-extract-pending`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${serviceKey}`,
            },
            body: JSON.stringify({
              limit: batchSize,
              throttleMs: 2000,
              concurrency: 1,
              maxDurationMs: 55000,
            }),
          }
        );

        if (!response.ok) {
          console.error("Batch extract failed:", await response.text());
          totalErrors++;
          continue;
        }

        const result = await response.json();
        const processed = result?.stats?.processed ?? 0;
        const success = result?.stats?.success ?? 0;
        const errors = result?.stats?.errors ?? 0;

        totalProcessed += processed;
        totalSuccess += success;
        totalErrors += errors;

        if (processed === 0) break;
      } catch (e) {
        console.error("Batch extraction error:", e);
        totalErrors++;
        if (totalErrors >= 3) break;
      }

      // Brief pause between batches
      await new Promise((r) => setTimeout(r, 1000));
    }

    console.log(`[daily-auto-extraction] Phase 1 done: ${totalSuccess} enriched, ${totalErrors} errors`);

    // ═══════════════════════════════════════════════════════════════
    // PHASE 2: Trigger full Provident source mirror
    // ═══════════════════════════════════════════════════════════════
    console.log("[daily-auto-extraction] Phase 2: Triggering Provident auto-sync...");
    let providentSyncResult: any = null;

    try {
      const syncResponse = await fetch(
        `${supabaseUrl}/functions/v1/daily-provident-auto-sync`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${serviceKey}`,
          },
          body: JSON.stringify({ manual: false }),
        }
      );

      if (syncResponse.ok) {
        providentSyncResult = await syncResponse.json();
        console.log(`[daily-auto-extraction] Provident sync: ${providentSyncResult?.stats?.projects_found ?? 0} projects, ${providentSyncResult?.stats?.projects_scraped ?? 0} scraped`);
      } else {
        const errText = await syncResponse.text();
        console.error("[daily-auto-extraction] Provident sync failed:", errText.substring(0, 200));
      }
    } catch (e) {
      console.error("[daily-auto-extraction] Provident sync error:", e);
    }

    // Update job log
    if (jobId) {
      await supabase
        .from("extraction_job_logs")
        .update({
          status: totalErrors > totalSuccess ? "failed" : "completed",
          completed_at: new Date().toISOString(),
          records_found: totalProcessed + (providentSyncResult?.stats?.projects_found ?? 0),
          records_matched: totalSuccess + (providentSyncResult?.stats?.projects_scraped ?? 0),
          records_pending: totalErrors + (providentSyncResult?.stats?.scrape_errors ?? 0),
          error_message:
            totalErrors > 0
              ? `${totalErrors} items failed during extraction`
              : null,
        })
        .eq("id", jobId);
    }

    return new Response(
      JSON.stringify({
        success: true,
        manual,
        stats: {
          pending_processed: totalProcessed,
          pending_success: totalSuccess,
          pending_errors: totalErrors,
          provident_sync: providentSyncResult?.stats ?? null,
        },
        message: `Daily extraction complete: ${totalSuccess} enriched, ${totalErrors} errors. Provident sync: ${providentSyncResult?.stats?.projects_found ?? 0} projects.`,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Daily extraction error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
