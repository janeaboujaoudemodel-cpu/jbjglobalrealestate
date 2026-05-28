// ingest-rera — Firecrawl scrape of RERA public stats.
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

  const { runId } = await startRun("rera");
  try {
    const schema = {
      type: "object",
      properties: {
        registered_brokers: { type: "number" },
        active_projects: { type: "number" },
        escrow_accounts: { type: "number" },
      },
    };
    // Government source: DXB Interact rental-yield page (RERA-derived index).
    // rera.gov.ae times out via Firecrawl scrape; DXB Interact mirrors RERA's public stats.
    const result = await firecrawlScrape("https://dxbinteract.com/dubai-rental-yield", {
      formats: ["markdown", { type: "json", schema }], waitFor: 3000, onlyMainContent: true,
    });
    const doc = result?.data ?? result;
    const metrics = doc?.json ?? {};
    const period_end = new Date().toISOString().slice(0, 10);

    const sb = svcClient();
    const { data: src } = await sb.from("market_data_sources").select("id").eq("name", "RERA").maybeSingle();

    const rows: any[] = [];
    const map: Array<[string, string, string]> = [
      ["registered_brokers","registered_brokers","count"],
      ["active_projects","active_projects","count"],
      ["escrow_accounts","escrow_accounts","count"],
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
