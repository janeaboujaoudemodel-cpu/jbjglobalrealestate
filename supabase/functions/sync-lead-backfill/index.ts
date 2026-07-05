// Phase 5 — one-time bulk backfill for the tri-directional lead sync.
// Iterates jbj_leads + crm_leads (and optionally pulls all Zoho leads),
// invoking sync-lead-tri with { force: true } for each record.
//
// POST body (all optional):
//   { sources?: ("jbj"|"crm"|"zoho")[], only_unsynced?: boolean,
//     limit?: number, dry_run?: boolean }
// Defaults: sources = ["jbj","crm","zoho"], only_unsynced = true, limit = 5000.

import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const ZOHO_CRM_API_KEY = Deno.env.get("ZOHO_CRM_API_KEY")!;
const ZOHO_GATEWAY = "https://connector-gateway.lovable.dev/zoho_crm";

const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false },
});

async function invokeTri(body: Record<string, unknown>) {
  const { error } = await admin.functions.invoke("sync-lead-tri", { body });
  if (error) throw new Error(error.message);
}

async function backfillTable(
  table: "jbj_leads" | "crm_leads",
  source: "jbj" | "crm",
  onlyUnsynced: boolean,
  limit: number,
  dryRun: boolean,
) {
  const q = admin.from(table).select("id, zoho_lead_id").order("created_at", { ascending: true }).limit(limit);
  if (onlyUnsynced) q.is("zoho_lead_id", null);
  const { data, error } = await q;
  if (error) throw error;
  const rows = data ?? [];
  if (dryRun) return { table, count: rows.length, dry_run: true };

  let ok = 0, failed = 0;
  for (const r of rows) {
    try {
      await invokeTri({ source, id: r.id, force: true });
      ok++;
    } catch (e) {
      failed++;
      console.error(`[backfill:${source}] ${r.id} failed:`, (e as Error).message);
    }
    // small pause to be polite to gateway + pg_net
    await new Promise((res) => setTimeout(res, 40));
  }
  return { table, count: rows.length, ok, failed };
}

async function backfillZoho(limit: number, dryRun: boolean) {
  const fields = "id,First_Name,Last_Name,Email,Phone,Mobile,Lead_Status,Lead_Source,Description,Modified_Time";
  let page = 1;
  const perPage = 200;
  const ids: string[] = [];
  while (ids.length < limit) {
    const res = await fetch(
      `${ZOHO_GATEWAY}/Leads?fields=${encodeURIComponent(fields)}&per_page=${perPage}&page=${page}`,
      {
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "X-Connection-Api-Key": ZOHO_CRM_API_KEY,
        },
      },
    );
    if (res.status === 204) break;
    const json = await res.json();
    if (!res.ok) throw new Error(`Zoho list failed [${res.status}]: ${JSON.stringify(json)}`);
    const batch: any[] = json.data ?? [];
    if (batch.length === 0) break;
    for (const r of batch) ids.push(r.id);
    if (!json.info?.more_records) break;
    page++;
  }
  if (dryRun) return { table: "zoho_leads", count: ids.length, dry_run: true };

  let ok = 0, failed = 0;
  for (const zid of ids.slice(0, limit)) {
    try {
      await invokeTri({ source: "zoho", zoho_lead_id: zid, force: true });
      ok++;
    } catch (e) {
      failed++;
      console.error(`[backfill:zoho] ${zid} failed:`, (e as Error).message);
    }
    await new Promise((res) => setTimeout(res, 40));
  }
  return { table: "zoho_leads", count: ids.length, ok, failed };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const sources: string[] = body.sources ?? ["jbj", "crm", "zoho"];
    const onlyUnsynced: boolean = body.only_unsynced ?? true;
    const limit: number = Math.min(Number(body.limit ?? 5000), 10000);
    const dryRun: boolean = !!body.dry_run;

    const results: unknown[] = [];
    if (sources.includes("jbj")) results.push(await backfillTable("jbj_leads", "jbj", onlyUnsynced, limit, dryRun));
    if (sources.includes("crm")) results.push(await backfillTable("crm_leads", "crm", onlyUnsynced, limit, dryRun));
    if (sources.includes("zoho")) results.push(await backfillZoho(limit, dryRun));

    return new Response(JSON.stringify({ ok: true, results }, null, 2), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
