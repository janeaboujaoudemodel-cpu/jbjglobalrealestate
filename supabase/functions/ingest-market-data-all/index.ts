// ingest-market-data-all — orchestrator. Calls each ingestion function in sequence.
// Designed to be invoked daily by pg_cron with x-internal-ingest-secret header.
import { authorizeIngestion } from "../_shared/marketDataRun.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-internal-ingest-secret",
};

const FUNCTIONS = ["ingest-dld", "ingest-dxb-interact", "ingest-rera", "ingest-property-monitor"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const denied = await authorizeIngestion(req, corsHeaders);
  if (denied) return denied;

  const base = Deno.env.get("SUPABASE_URL")!;
  const secret = Deno.env.get("INTERNAL_INGEST_SECRET") ?? "";
  const authHeader = req.headers.get("Authorization") ?? "";

  const results: Record<string, any> = {};
  for (const fn of FUNCTIONS) {
    try {
      const res = await fetch(`${base}/functions/v1/${fn}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-internal-ingest-secret": secret,
          ...(authHeader ? { Authorization: authHeader } : {}),
          apikey: Deno.env.get("SUPABASE_ANON_KEY") ?? "",
        },
        body: "{}",
      });
      const text = await res.text();
      let json: any; try { json = JSON.parse(text); } catch { json = { raw: text }; }
      results[fn] = { status: res.status, ...json };
    } catch (e) {
      results[fn] = { status: 0, error: String((e as Error).message || e) };
    }
  }

  return new Response(JSON.stringify({ ok: true, results }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
