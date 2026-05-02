// Owner-only kicker: triggers `backfill-handover-dates` repeatedly in the
// background so the handover-date drain runs to completion without the caller
// having to keep a long HTTP connection open.
//
// Each iteration calls the existing function with a small batch (size 5),
// waits ~2s, and re-enters itself via `EdgeRuntime.waitUntil` until either
// `remaining === 0`, the function returns `skipped`, or `max_iterations` is
// reached. Returns immediately with the run id so the caller doesn't block.

import { createClient } from "npm:@supabase/supabase-js@2";
import { requireOwnerAuth } from "../_shared/owner-auth-middleware.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

async function callBackfill(stage: number, batchSize: number): Promise<any> {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/backfill-handover-dates`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SERVICE_KEY}`,
      "Content-Type": "application/json",
      apikey: SERVICE_KEY,
      // Bypass owner-auth-middleware for service-role internal call
      "x-internal-service": "1",
    },
    body: JSON.stringify({ stage, batch_size: batchSize }),
  });
  return await res.json().catch(() => ({}));
}

async function drain(stage: number, batchSize: number, maxIterations: number, runId: string) {
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
  let i = 0;
  let updated = 0;
  let failed = 0;
  let remaining = -1;
  while (i < maxIterations) {
    i++;
    try {
      const r = await callBackfill(stage, batchSize);
      const result = r?.result;
      if (!result || result.skipped) {
        console.log(`[runner ${runId}] stop: skipped or no result`, JSON.stringify(r));
        break;
      }
      updated += Number(result.updated || 0);
      failed += Number(result.failed || 0);
      remaining = Number(result.remaining ?? -1);
      console.log(`[runner ${runId}] iter=${i} updated=${result.updated} failed=${result.failed} remaining=${remaining}`);
      if (remaining === 0) break;
      // Small breather between batches so we don't hammer Firecrawl.
      await new Promise((r) => setTimeout(r, 1500));
    } catch (e: any) {
      console.error(`[runner ${runId}] iter=${i} error`, e?.message);
      failed++;
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
  // Persist a tiny audit row so the owner can see when it ran.
  try {
    await supabase.from("background_job_runs").insert({
      job_name: "drain-handover-dates",
      run_id: runId,
      stage,
      iterations: i,
      updated,
      failed,
      remaining,
      finished_at: new Date().toISOString(),
    });
  } catch (_) {
    // table may not exist; ignore
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const auth = await requireOwnerAuth(req, corsHeaders);
    if (auth.response) return auth.response;

    const body = await req.json().catch(() => ({}));
    const stage = Number(body.stage) || 2;
    const batchSize = Math.min(Math.max(Number(body.batch_size) || 5, 1), 10);
    const maxIterations = Math.min(Math.max(Number(body.max_iterations) || 250, 1), 500);
    const runId = crypto.randomUUID();

    // Fire-and-forget: drain runs in the background without blocking the response.
    // @ts-ignore - EdgeRuntime is available on Supabase Deno deploy
    EdgeRuntime.waitUntil(drain(stage, batchSize, maxIterations, runId));

    return new Response(
      JSON.stringify({ success: true, run_id: runId, stage, batch_size: batchSize, max_iterations: maxIterations, started: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e: any) {
    return new Response(JSON.stringify({ success: false, error: e?.message ?? String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
