// ingest-dld — pulls Dubai Land Department headline numbers via Firecrawl scrape.
// Normalizes to market_data_points + writes a market_data_runs row.
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

  const { runId } = await startRun("dld");
  try {
    const schema = {
      type: "object",
      properties: {
        total_transactions: { type: "number" },
        total_value_aed: { type: "number" },
        offplan_share: { type: "number" },
        avg_price_per_sqft_aed: { type: "number" },
        top_areas: {
          type: "array",
          items: { type: "object", properties: { name: { type: "string" }, transactions: { type: "number" } } },
        },
      },
    };
    // Government source: DXB Interact (official public mirror of DLD transactions).
    // Underlying data = Dubai Land Department; chosen because dubailand.gov.ae / dubaipulse.gov.ae
    // time out via Firecrawl scrape (heavy JS / anti-bot).
    const result = await firecrawlScrape("https://dxbinteract.com/", {
      formats: ["markdown", { type: "json", schema }], waitFor: 3000, onlyMainContent: true,
    });
    const doc = result?.data ?? result;
    const metrics = doc?.json ?? {};
    const period_end = new Date().toISOString().slice(0, 10);

    const sb = svcClient();
    const { data: src } = await sb.from("market_data_sources").select("id").eq("name", "DLD").maybeSingle();

    const rows: any[] = [];
    if (typeof metrics.total_transactions === "number") {
      rows.push({ source_id: src?.id, data_type: "transactions_total", location: "Dubai",
        value: metrics.total_transactions, unit: "count", period_end, metadata: {} });
    }
    if (typeof metrics.total_value_aed === "number") {
      rows.push({ source_id: src?.id, data_type: "transactions_value", location: "Dubai",
        value: metrics.total_value_aed, unit: "AED", period_end, metadata: {} });
    }
    if (typeof metrics.offplan_share === "number") {
      rows.push({ source_id: src?.id, data_type: "offplan_share", location: "Dubai",
        value: metrics.offplan_share, unit: "ratio", period_end, metadata: {} });
    }
    if (typeof metrics.avg_price_per_sqft_aed === "number") {
      rows.push({ source_id: src?.id, data_type: "avg_price_sqft", location: "Dubai",
        value: metrics.avg_price_per_sqft_aed, unit: "AED/sqft", period_end, metadata: {} });
    }
    if (rows.length) await sb.from("market_data_points").insert(rows);

    const partial = rows.length === 0;
    await finishRun(runId, partial ? "partial" : "success", rows.length,
      { metrics, top_areas_count: Array.isArray(metrics.top_areas) ? metrics.top_areas.length : 0 },
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
