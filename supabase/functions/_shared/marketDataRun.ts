// Helpers: gate an ingestion function (owner-JWT OR INTERNAL_INGEST_SECRET header)
// and record runs in market_data_runs.
import { createClient } from "npm:@supabase/supabase-js@2";
import { requireOwnerAuth } from "./owner-auth-middleware.ts";

export async function authorizeIngestion(
  req: Request,
  corsHeaders: Record<string, string>,
): Promise<Response | null> {
  const secret = Deno.env.get("INTERNAL_INGEST_SECRET");
  const provided = req.headers.get("x-internal-ingest-secret");
  if (secret && provided && provided === secret) return null;
  const auth = await requireOwnerAuth(req, corsHeaders);
  return auth.response;
}

export function svcClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );
}

export async function startRun(sourceKey: string) {
  const sb = svcClient();
  const { data: src } = await sb.from("market_data_sources").select("id").eq("name",
    sourceKey === "dld" ? "DLD"
    : sourceKey === "dxb_interact" ? "DXB Interact"
    : sourceKey === "rera" ? "RERA"
    : sourceKey === "property_monitor" ? "Property Monitor" : sourceKey,
  ).maybeSingle();
  const { data: run, error } = await sb.from("market_data_runs")
    .insert({ source_key: sourceKey, source_id: src?.id ?? null, status: "running" })
    .select().single();
  if (error) throw error;
  return { runId: run.id as string, sourceId: src?.id ?? null };
}

export async function finishRun(
  runId: string,
  status: "success" | "partial" | "error",
  rowsIngested: number,
  details: Record<string, unknown> | null,
  errorText: string | null = null,
) {
  const sb = svcClient();
  await sb.from("market_data_runs").update({
    finished_at: new Date().toISOString(),
    status, rows_ingested: rowsIngested,
    error_text: errorText, details,
  }).eq("id", runId);
  if (status !== "error") {
    // Touch source last_sync_at
    const { data: run } = await sb.from("market_data_runs").select("source_id").eq("id", runId).maybeSingle();
    if (run?.source_id) {
      await sb.from("market_data_sources").update({ last_sync_at: new Date().toISOString() }).eq("id", run.source_id);
    }
  }
}
