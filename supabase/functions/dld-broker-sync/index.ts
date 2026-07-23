// DLD broker & brokerage sync — pulls the public Dubai Pulse register
// of real-estate brokers (individuals) and broker offices (agencies)
// and upserts them into crm_brokers / crm_brokerages, then logs a row
// into public.dld_daily_sync_runs so the Broker Portal can display
// "last run" stats. On upstream failure we still log the run so the
// user can see the button worked.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const OFFICES_URL = "https://www.dubaipulse.gov.ae/dataset/00_real_estate_offices/resource/real_estate_offices/download?format=csv";
const BROKERS_URL = "https://www.dubaipulse.gov.ae/dataset/00_real_estate_brokers/resource/real_estate_brokers/download?format=csv";

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length);
  if (lines.length < 2) return [];
  const header = lines[0].split(",").map((h) => h.replace(/"/g, "").trim().toLowerCase());
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].match(/("([^"]|"")*"|[^,]*)(,|$)/g) || [];
    const row: Record<string, string> = {};
    header.forEach((h, idx) => {
      row[h] = (cols[idx] || "").replace(/,$/, "").replace(/^"|"$/g, "").replace(/""/g, '"').trim();
    });
    rows.push(row);
  }
  return rows;
}

async function getDefaultOwnerId(supabase: ReturnType<typeof createClient>) {
  const { data: brokerageOwner } = await supabase
    .from("crm_brokerages")
    .select("owner_id")
    .not("owner_id", "is", null)
    .limit(1)
    .maybeSingle();
  if (brokerageOwner?.owner_id) return brokerageOwner.owner_id as string;

  const { data: developerOwner } = await supabase
    .from("crm_developer_registry")
    .select("owner_id")
    .not("owner_id", "is", null)
    .limit(1)
    .maybeSingle();
  return (developerOwner?.owner_id as string | undefined) ?? null;
}

function isCreatedDuringRun(createdAt: string | null | undefined, startedAt: string) {
  if (!createdAt) return false;
  return new Date(createdAt).getTime() >= new Date(startedAt).getTime() - 1000;
}

async function fetchCsv(url: string): Promise<Record<string, string>[]> {
  const res = await fetch(url, {
    headers: { "User-Agent": "JBJ-Broker-Sync/1.0" },
    signal: AbortSignal.timeout(30_000),
  });
  if (!res.ok) throw new Error(`DLD HTTP ${res.status}`);
  return parseCsv(await res.text());
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY);
  const started = new Date().toISOString();
  const ownerId = await getDefaultOwnerId(supabase);

  let agenciesInserted = 0, agenciesUpdated = 0;
  let brokersInserted = 0, brokersUpdated = 0;
  let status: "success" | "partial" | "failed" = "success";
  let errMsg: string | null = null;
  const summary: Record<string, unknown> = {};

  // Offices → crm_brokerages
  try {
    const offices = await fetchCsv(OFFICES_URL);
    summary.offices_fetched = offices.length;
    const batches: any[] = [];
    for (const r of offices.slice(0, 5000)) {
      const name = r["office_name_en"] || r["office_name"] || r["name"];
      if (!name) continue;
      batches.push({
        owner_id: ownerId,
        company_name: name,
        emirate: "Dubai",
        country: "United Arab Emirates",
        phone: r["phone"] || r["phone_no"] || null,
        email: r["email"] || null,
        office_address: r["address"] || r["office_address"] || null,
        office_location: r["area"] || r["area_en"] || r["office_area"] || null,
        dld_area: r["area"] || r["area_en"] || r["office_area"] || null,
        dld_office_number: r["office_no"] || r["office_number"] || r["license_no"] || null,
        dld_office_no: r["office_no"] || r["office_number"] || r["license_no"] || null,
        dld_source: "dld_daily",
        first_seen_at: started,
        database_source: "DLD",
        original_filename: "DLD Broker Offices Register",
        source: "dld_register",
        source_detail: "DLD Broker Offices import",
      });
    }
    for (let i = 0; i < batches.length; i += 500) {
      const slice = batches.slice(i, i + 500);
      const { data, error } = await supabase
        .from("crm_brokerages")
        .upsert(slice, { onConflict: "company_name", ignoreDuplicates: false, count: "exact" })
        .select("id,created_at");
      if (error) throw error;
      const createdNow = (data ?? []).filter((row: any) => isCreatedDuringRun(row.created_at, started)).length;
      agenciesInserted += createdNow;
      agenciesUpdated += Math.max(0, (data?.length || 0) - createdNow);
    }
  } catch (e) {
    status = "partial";
    errMsg = `offices: ${String(e)}`;
    console.warn("[dld-broker-sync] offices failed:", e);
  }

  // Brokers → crm_brokers
  try {
    const brokers = await fetchCsv(BROKERS_URL);
    summary.brokers_fetched = brokers.length;
    const batches: any[] = [];
    for (const r of brokers.slice(0, 8000)) {
      const name = r["broker_name_en"] || r["broker_name"] || r["name"];
      const email = (r["email"] || "").toLowerCase();
      if (!name && !email) continue;
      batches.push({
        full_name: name || email,
        email_lower: email || null,
        phone_e164: r["phone"] || r["mobile"] || null,
        current_company: r["office_name_en"] || r["office_name"] || null,
        database_source: "DLD",
        original_filename: "DLD Broker Register",
      });
    }
    for (let i = 0; i < batches.length; i += 500) {
      const slice = batches.slice(i, i + 500);
      const { data, error } = await supabase
        .from("crm_brokers")
        .upsert(slice, { onConflict: "email_lower", ignoreDuplicates: false })
        .select("id,created_at");
      if (error) throw error;
      const createdNow = (data ?? []).filter((row: any) => isCreatedDuringRun(row.created_at, started)).length;
      brokersInserted += createdNow;
      brokersUpdated += Math.max(0, (data?.length || 0) - createdNow);
    }
  } catch (e) {
    status = status === "partial" ? "failed" : "partial";
    errMsg = (errMsg ? errMsg + " | " : "") + `brokers: ${String(e)}`;
    console.warn("[dld-broker-sync] brokers failed:", e);
  }

  const finished = new Date().toISOString();
  await supabase.from("dld_daily_sync_runs").insert({
    run_started_at: started,
    run_finished_at: finished,
    status,
    agencies_inserted: agenciesInserted,
    agencies_updated: agenciesUpdated,
    brokers_inserted: brokersInserted,
    brokers_updated: brokersUpdated,
    error_message: errMsg,
    raw_summary: summary,
    brokerages_new: agenciesInserted,
  });

  return new Response(
    JSON.stringify({
      ok: status !== "failed",
      status,
      agencies_inserted: agenciesInserted,
      agencies_updated: agenciesUpdated,
      brokers_inserted: brokersInserted,
      brokers_updated: brokersUpdated,
      error: errMsg,
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
  );
});
