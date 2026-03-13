import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Daily Provident Auto-Sync — Full mirror pipeline
 * 
 * 1. Calls provident-full-sync step=full_sync to discover all developers + projects
 * 2. For each newly discovered project, calls provident-scrape-project for deep detail extraction
 * 3. Logs results to sync_jobs and extraction_job_logs
 * 
 * NO "fix" or "repair" — extract completely the first time.
 */

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceKey);

  const startedAt = new Date().toISOString();
  let syncJobId: string | null = null;
  let extractionJobId: string | null = null;

  const stats = {
    developers_found: 0,
    developers_created: 0,
    developers_updated: 0,
    projects_found: 0,
    projects_scraped: 0,
    scrape_errors: 0,
    errors: [] as string[],
  };

  try {
    const body = await req.json().catch(() => ({}));
    const manual = body?.manual === true;
    const developerLimit = body?.developerLimit ?? null; // null = all developers

    console.log(`[daily-provident-auto-sync] Starting full mirror pipeline (manual=${manual})...`);

    // Create sync job record
    const { data: syncJob } = await supabase
      .from("sync_jobs")
      .insert({
        job_type: "daily-provident-auto-sync",
        status: "running",
        source: "provident",
        started_at: startedAt,
        stats_created: 0,
        stats_updated: 0,
        stats_errors: 0,
      })
      .select("id")
      .single();

    syncJobId = syncJob?.id || null;

    // Create extraction job log
    const { data: extractionJob } = await supabase
      .from("extraction_job_logs")
      .insert({
        source_id: null,
        status: "running",
        started_at: startedAt,
        records_found: 0,
        records_matched: 0,
        records_pending: 0,
      })
      .select("id")
      .single();

    extractionJobId = extractionJob?.id || null;

    // ═══════════════════════════════════════════════════════════════
    // STEP 1: Full sync — discover all developers and their projects
    // ═══════════════════════════════════════════════════════════════
    console.log("[daily-provident-auto-sync] Step 1: Running provident-full-sync (full_sync)...");

    const fullSyncResponse = await fetch(`${supabaseUrl}/functions/v1/provident-full-sync`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({
        step: "full_sync",
        limit: developerLimit,
      }),
    });

    if (!fullSyncResponse.ok) {
      const errText = await fullSyncResponse.text();
      throw new Error(`provident-full-sync failed: ${fullSyncResponse.status} — ${errText.substring(0, 300)}`);
    }

    const fullSyncResult = await fullSyncResponse.json();
    stats.developers_found = fullSyncResult.developers_found ?? 0;
    stats.developers_created = fullSyncResult.developers_created ?? 0;
    stats.developers_updated = fullSyncResult.developers_updated ?? 0;
    stats.projects_found = fullSyncResult.projects_synced ?? 0;

    if (fullSyncResult.errors && fullSyncResult.errors.length > 0) {
      stats.errors.push(...fullSyncResult.errors.slice(0, 20));
    }

    console.log(`[daily-provident-auto-sync] Step 1 done: ${stats.developers_found} devs, ${stats.projects_found} projects`);

    // ═══════════════════════════════════════════════════════════════
    // STEP 2: Deep scrape each project that's missing complete data
    // ═══════════════════════════════════════════════════════════════
    console.log("[daily-provident-auto-sync] Step 2: Deep scraping projects with missing data...");

    // Find projects that were just synced but lack complete data
    const { data: incompleteProjects } = await supabase
      .from("projects")
      .select("id, name, source_url")
      .not("source_url", "is", null)
      .ilike("source_url", "%providentestate.com%")
      .or([
        "description.is.null",
        "description.eq.",
        "amenities.is.null",
        "size_min.is.null",
      ].join(","))
      .order("updated_at", { ascending: false })
      .limit(50); // Process up to 50 per run to stay within time limits

    const projectsToScrape = incompleteProjects || [];
    console.log(`[daily-provident-auto-sync] Found ${projectsToScrape.length} projects needing deep scrape`);

    for (const project of projectsToScrape) {
      if (!project.source_url) continue;

      try {
        console.log(`[daily-provident-auto-sync] Deep scraping: ${project.name}`);

        const scrapeResponse = await fetch(`${supabaseUrl}/functions/v1/provident-scrape-project`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${serviceKey}`,
          },
          body: JSON.stringify({
            projectUrl: project.source_url,
            projectId: project.id,
            projectName: project.name,
          }),
        });

        if (scrapeResponse.ok) {
          const scrapeResult = await scrapeResponse.json();
          if (scrapeResult.success) {
            stats.projects_scraped++;
            console.log(`[daily-provident-auto-sync] ✓ ${project.name}: ${scrapeResult.images_found} imgs, brochure=${scrapeResult.brochure_found}`);
          } else {
            stats.scrape_errors++;
            stats.errors.push(`${project.name}: scrape returned success=false`);
          }
        } else {
          stats.scrape_errors++;
          const errText = await scrapeResponse.text();
          stats.errors.push(`${project.name}: ${scrapeResponse.status}`);
          console.warn(`[daily-provident-auto-sync] ✗ ${project.name}: ${errText.substring(0, 100)}`);
        }

        // Brief pause between scrapes to avoid rate limiting
        await new Promise(r => setTimeout(r, 2000));
      } catch (err) {
        stats.scrape_errors++;
        const msg = err instanceof Error ? err.message : "Unknown error";
        stats.errors.push(`${project.name}: ${msg}`);
        console.error(`[daily-provident-auto-sync] Error scraping ${project.name}:`, err);
      }
    }

    // ═══════════════════════════════════════════════════════════════
    // STEP 3: Also process pending_project_imports queue
    // ═══════════════════════════════════════════════════════════════
    console.log("[daily-provident-auto-sync] Step 3: Processing pending imports queue...");

    try {
      const batchResponse = await fetch(`${supabaseUrl}/functions/v1/batch-extract-pending`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${serviceKey}`,
        },
        body: JSON.stringify({
          limit: 25,
          throttleMs: 2000,
          concurrency: 1,
          maxDurationMs: 55000,
        }),
      });

      if (batchResponse.ok) {
        const batchResult = await batchResponse.json();
        console.log(`[daily-provident-auto-sync] Batch extract: ${batchResult?.stats?.success ?? 0} success, ${batchResult?.stats?.errors ?? 0} errors`);
      }
    } catch (err) {
      console.warn("[daily-provident-auto-sync] Batch extract failed:", err);
    }

    // ═══════════════════════════════════════════════════════════════
    // STEP 4: Update job records with final stats
    // ═══════════════════════════════════════════════════════════════
    const completedAt = new Date().toISOString();
    const hasErrors = stats.scrape_errors > 0 || stats.errors.length > 0;
    const finalStatus = hasErrors && stats.projects_scraped === 0 ? "failed" : "completed";

    if (syncJobId) {
      await supabase
        .from("sync_jobs")
        .update({
          status: finalStatus,
          completed_at: completedAt,
          stats_created: stats.developers_created + stats.projects_found,
          stats_updated: stats.projects_scraped,
          stats_errors: stats.scrape_errors,
          error_log: stats.errors.length > 0 ? stats.errors : null,
        })
        .eq("id", syncJobId);
    }

    if (extractionJobId) {
      await supabase
        .from("extraction_job_logs")
        .update({
          status: finalStatus,
          completed_at: completedAt,
          records_found: stats.projects_found,
          records_matched: stats.projects_scraped,
          records_pending: stats.scrape_errors,
          error_message: stats.errors.length > 0 ? stats.errors.slice(0, 5).join("; ") : null,
        })
        .eq("id", extractionJobId);
    }

    console.log(`[daily-provident-auto-sync] Complete: ${stats.developers_found} devs, ${stats.projects_found} projects discovered, ${stats.projects_scraped} deep-scraped, ${stats.scrape_errors} errors`);

    return new Response(
      JSON.stringify({
        success: true,
        manual,
        stats,
        timestamp: completedAt,
        message: `Daily sync complete: ${stats.projects_found} projects discovered, ${stats.projects_scraped} deep-scraped`,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("[daily-provident-auto-sync] Fatal error:", error);

    // Update job records on failure
    const failedAt = new Date().toISOString();
    const errorMsg = error instanceof Error ? error.message : "Unknown error";

    if (syncJobId) {
      await supabase
        .from("sync_jobs")
        .update({
          status: "failed",
          completed_at: failedAt,
          stats_errors: stats.scrape_errors + 1,
          error_log: [errorMsg, ...stats.errors],
        })
        .eq("id", syncJobId);
    }

    if (extractionJobId) {
      await supabase
        .from("extraction_job_logs")
        .update({
          status: "failed",
          completed_at: failedAt,
          error_message: errorMsg,
        })
        .eq("id", extractionJobId);
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMsg,
        stats,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
