// ingest-dxb-interact — Firecrawl scrape of DXB Interact public dashboards.
import { authorizeIngestion, svcClient, startRun, finishRun } from "../_shared/marketDataRun.ts";
import { firecrawlScrape } from "../_shared/firecrawl.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-internal-ingest-secret",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const denied = await authorizeIngestion(req, corsHeaders);
  if (denied) return denied;

  const { runId } = await startRun("dxb_interact");
  try {
    const schema = {
      type: "object",
      properties: {
        ytd_transactions: { type: "number" },
        ytd_value_aed: { type: "number" },
        ready_share: { type: "number" },
        offplan_share: { type: "number" },
      },
    };
    const result = await firecrawlScrape("https://www.dxbinteract.com/", {
      formats: ["markdown", { type: "json", schema }], waitFor: 2000,
    });
    const doc = result?.data ?? result;
    const metrics = doc?.json ?? {};
    const period_end = new Date().toISOString().slice(0, 10);

    const sb = svcClient();
    const { data: src } = await sb.from("market_data_sources").select("id").eq("name", "DXB Interact").maybeSingle();

    const rows: any[] = [];
    const map: Array<[string, string, string]> = [
      ["ytd_transactions","transactions_ytd","count"],
      ["ytd_value_aed","transactions_value_ytd","AED"],
      ["ready_share","ready_share","ratio"],
      ["offplan_share","offplan_share","ratio"],
    ];
    for (const [k, type, unit] of map) {
      if (typeof (metrics as any)[k] === "number") {
        rows.push({ source_id: src?.id, data_type: type, location: "Dubai",
          value: (metrics as any)[k], unit, period_end, metadata: {} });
      }
    }
    if (rows.length) await sb.from("market_data_points").insert(rows);

    const partial = rows.length === 0;
    await finishRun(runId, partial ? "partial" : "success", rows.length, { metrics },
      partial ? "No numeric fields extracted" : null);
    return new Response(JSON.stringify({ ok: true, rows: rows.length, metrics }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    await finishRun(runId, "error", 0, null, String((e as Error).message || e));
    return new Response(JSON.stringify({ error: String((e as Error).message || e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
