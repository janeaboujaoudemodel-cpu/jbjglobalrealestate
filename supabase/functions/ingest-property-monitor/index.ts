// ingest-property-monitor — requires PROPERTY_MONITOR_API_KEY.
// Degrades gracefully: returns "secret missing" + records partial run until configured.
import { authorizeIngestion, startRun, finishRun } from "../_shared/marketDataRun.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-internal-ingest-secret",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const denied = await authorizeIngestion(req, corsHeaders);
  if (denied) return denied;

  const { runId } = await startRun("property_monitor");
  const apiKey = Deno.env.get("PROPERTY_MONITOR_API_KEY");
  if (!apiKey) {
    await finishRun(runId, "partial", 0, { reason: "secret_missing" },
      "PROPERTY_MONITOR_API_KEY not configured");
    return new Response(JSON.stringify({
      ok: false, skipped: true,
      message: "PROPERTY_MONITOR_API_KEY not configured. Add it in Lovable Cloud secrets to enable ingestion.",
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  // TODO: real Property Monitor API call once the key + endpoint contract are known.
  // Placeholder structure ready for activation.
  try {
    await finishRun(runId, "partial", 0,
      { reason: "endpoint_not_wired", note: "API key present; awaiting endpoint contract" },
      "Endpoint not wired yet");
    return new Response(JSON.stringify({ ok: true, pending: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    await finishRun(runId, "error", 0, null, String((e as Error).message || e));
    return new Response(JSON.stringify({ error: String((e as Error).message || e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
