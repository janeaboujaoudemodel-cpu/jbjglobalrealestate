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

  // Step 1: Discover new Provident projects via Gatsby page-data
  try {
    console.log("[daily-provident-auto-sync] Step 1: Discovering projects...");
    const discoverResult = await callFunction("discover-all-projects", {});
    results.discover_projects = discoverResult;
    console.log("[daily-provident-auto-sync] Step 1 complete:", JSON.stringify(discoverResult).slice(0, 200));
  } catch (err) {
    const msg = `Step 1 (discover-all-projects) failed: ${err.message}`;
    console.error("[daily-provident-auto-sync]", msg);
    errors.push(msg);
  }

  // Step 2: Discover new areas
  try {
    console.log("[daily-provident-auto-sync] Step 2: Syncing areas...");
    const areaResult = await callFunction("provident-areas-sync");
    results.areas_sync = areaResult;
    console.log("[daily-provident-auto-sync] Step 2 complete:", JSON.stringify(areaResult).slice(0, 200));
  } catch (err) {
    const msg = `Step 2 (provident-areas-sync) failed: ${err.message}`;
    console.error("[daily-provident-auto-sync]", msg);
    errors.push(msg);
  }

  // Step 3: Discover new developers and logos
  try {
    console.log("[daily-provident-auto-sync] Step 3: Extracting developers...");
    const devResult = await callFunction("extract-developers-provident");
    results.developers_sync = devResult;
    console.log("[daily-provident-auto-sync] Step 3 complete:", JSON.stringify(devResult).slice(0, 200));
  } catch (err) {
    const msg = `Step 3 (extract-developers-provident) failed: ${err.message}`;
    console.error("[daily-provident-auto-sync]", msg);
    errors.push(msg);
  }

  // Step 4: Auto-approve all pending Provident imports
  try {
    console.log("[daily-provident-auto-sync] Step 4: Bulk approving pending imports...");
    const approveResult = await callFunction("bulk-approve-imports", {
      approve_all: true,
    });
    results.bulk_approve = approveResult;
    console.log("[daily-provident-auto-sync] Step 4 complete:", JSON.stringify(approveResult).slice(0, 200));
  } catch (err) {
    const msg = `Step 4 (bulk-approve-imports) failed: ${err.message}`;
    console.error("[daily-provident-auto-sync]", msg);
    errors.push(msg);
  }

  // Log summary to database
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const statsCreated = (results.discover_projects as any)?.created ?? (results.discover_projects as any)?.total_discovered ?? 0;
    const statsUpdated = (results.bulk_approve as any)?.approved ?? 0;
    await supabase.from("sync_jobs").insert({
      job_type: "daily-provident-auto-sync",
      status: errors.length === 0 ? "completed" : "failed",
      source: "provident",
      stats_created: statsCreated,
      stats_updated: statsUpdated,
      stats_errors: errors.length,
      error_log: errors.length > 0 ? { steps: results, errors } : null,
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
    });
  } catch (logErr) {
    console.error("[daily-provident-auto-sync] Failed to log job:", logErr.message);
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
