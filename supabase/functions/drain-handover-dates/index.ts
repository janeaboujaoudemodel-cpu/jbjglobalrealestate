// Owner-only background runner: drains the queue of projects with NULL
// handover_date by repeatedly calling Firecrawl (Stage 2 logic from
// `backfill-handover-dates`) in small batches. Returns immediately with a
// run id; the actual work continues in the background via EdgeRuntime.waitUntil.

import { createClient } from "npm:@supabase/supabase-js@2";
import { requireOwnerAuth } from "../_shared/owner-auth-middleware.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// ---- Same validator as backfill-handover-dates ----
const ALLOW_RE = /^(Q[1-4] 20\d{2}|20\d{2}|Ready)$/;
const normalize = (raw: unknown): string | null => {
  if (raw == null) return null;
  let s = String(raw).trim();
  if (!s) return null;
  if (/^(tba|to be announced|soon|coming soon|n\/?a|unknown|null)$/i.test(s)) return null;
  const q = s.match(/Q\s?([1-4])\s*[\/\-\s]?\s*(20\d{2})/i);
  if (q) s = `Q${q[1]} ${q[2]}`;
  if (/^(ready|completed|handed.?over)$/i.test(s)) s = "Ready";
  if (!ALLOW_RE.test(s)) {
    const yMatch = s.match(/(20\d{2})/);
    if (yMatch) {
      const y = parseInt(yMatch[1], 10);
      if (y >= new Date().getFullYear()) s = String(y);
    }
  }
  return ALLOW_RE.test(s) ? s : null;
};

async function processBatch(
  supabase: any,
  apiKey: string,
  batchSize: number,
): Promise<{ updated: number; failed: number; remaining: number; processed: number }> {
  const { data: rows, error } = await supabase
    .from("projects")
    .select("id, name, source_url")
    .is("handover_date", null)
    .not("source_url", "is", null)
    .limit(batchSize);
  if (error) throw error;
  if (!rows?.length) return { updated: 0, failed: 0, remaining: 0, processed: 0 };

  let updated = 0;
  let failed = 0;
  for (const row of rows) {
    try {
      const fcResp = await fetch("https://api.firecrawl.dev/v2/scrape", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          url: row.source_url,
          formats: [
            {
              type: "json",
              prompt:
                "Extract the project's expected handover or completion date. Return ONLY one of: 'Q1 YYYY' / 'Q2 YYYY' / 'Q3 YYYY' / 'Q4 YYYY' / a 4-digit year (YYYY) / 'Ready' (if already handed over) / null. If unclear or unverifiable, return null. Do NOT guess.",
              schema: {
                type: "object",
                properties: { handover_date: { type: ["string", "null"] } },
                required: ["handover_date"],
              },
            },
          ],
          onlyMainContent: true,
        }),
      });
      if (!fcResp.ok) {
        failed++;
        continue;
      }
      const fcData = await fcResp.json();
      const raw = fcData?.data?.json?.handover_date ?? fcData?.json?.handover_date ?? null;
      const value = normalize(raw);
      if (!value) {
        // Mark as "tried but unverifiable" by setting source_url to null effectively?
        // No — we leave row alone. But to avoid re-trying it forever, write a sentinel
        // into expected_completion only if both are null. Cleaner: add a tried-at column? skip for now.
        failed++;
        continue;
      }
      const { error: upErr } = await supabase
        .from("projects")
        .update({ handover_date: value, expected_completion: value })
        .eq("id", row.id)
        .is("handover_date", null);
      if (upErr) {
        failed++;
        continue;
      }
      updated++;
    } catch (_e) {
      failed++;
    }
  }

  const { count } = await supabase
    .from("projects")
    .select("id", { count: "exact", head: true })
    .is("handover_date", null)
    .not("source_url", "is", null);

  return { updated, failed, remaining: count ?? 0, processed: rows.length };
}

async function drain(batchSize: number, maxIterations: number, runId: string) {
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
  const apiKey = Deno.env.get("FIRECRAWL_API_KEY");
  if (!apiKey) {
    console.warn(`[drain ${runId}] FIRECRAWL_API_KEY missing, aborting`);
    return;
  }
  let totalUpdated = 0;
  let totalFailed = 0;
  let consecutiveZeroProgress = 0;
  for (let i = 1; i <= maxIterations; i++) {
    try {
      const r = await processBatch(supabase, apiKey, batchSize);
      totalUpdated += r.updated;
      totalFailed += r.failed;
      console.log(
        `[drain ${runId}] iter=${i} updated=${r.updated} failed=${r.failed} remaining=${r.remaining} processed=${r.processed}`,
      );
      if (r.processed === 0) break;
      if (r.updated === 0) {
        consecutiveZeroProgress++;
        // After many failures in a row (Firecrawl can't extract), bail out — Stage 3 (AI)
        // is the right tool, not endless Firecrawl retries.
        if (consecutiveZeroProgress >= 5) {
          console.log(`[drain ${runId}] 5 consecutive batches with 0 updates — stopping`);
          break;
        }
      } else {
        consecutiveZeroProgress = 0;
      }
      if (r.remaining === 0) break;
      await new Promise((res) => setTimeout(res, 1500));
    } catch (e: any) {
      console.error(`[drain ${runId}] iter=${i} error`, e?.message);
      await new Promise((res) => setTimeout(res, 3000));
    }
  }
  console.log(`[drain ${runId}] done — totalUpdated=${totalUpdated} totalFailed=${totalFailed}`);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const auth = await requireOwnerAuth(req, corsHeaders);
    if (auth.response) return auth.response;

    const body = await req.json().catch(() => ({}));
    const batchSize = Math.min(Math.max(Number(body.batch_size) || 5, 1), 10);
    const maxIterations = Math.min(Math.max(Number(body.max_iterations) || 250, 1), 500);
    const runId = crypto.randomUUID();

    // @ts-ignore EdgeRuntime is available on Supabase
    EdgeRuntime.waitUntil(drain(batchSize, maxIterations, runId));

    return new Response(
      JSON.stringify({ success: true, run_id: runId, batch_size: batchSize, max_iterations: maxIterations, started: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e: any) {
    return new Response(JSON.stringify({ success: false, error: e?.message ?? String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
