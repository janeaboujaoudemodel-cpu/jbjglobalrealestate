import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

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

    // Update job log
    if (jobId) {
      await supabase
        .from("extraction_job_logs")
        .update({
          status: totalErrors > totalSuccess ? "failed" : "completed",
          completed_at: new Date().toISOString(),
          records_found: totalProcessed,
          records_matched: totalSuccess,
          records_pending: totalErrors,
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
          processed: totalProcessed,
          success: totalSuccess,
          errors: totalErrors,
        },
        message: `Daily extraction complete: ${totalSuccess} enriched, ${totalErrors} errors`,
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
