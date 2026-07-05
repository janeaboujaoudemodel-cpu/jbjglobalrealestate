// Phase 2 — Reverse pull from Zoho CRM (Zoho is source of truth).
// Runs on pg_cron every 2 minutes. Pulls Zoho Leads modified since the
// last successful run, and for each record upserts into jbj_leads +
// crm_leads via the same guarded RPCs used by sync-lead-tri.

import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const ZOHO_CRM_API_KEY = Deno.env.get("ZOHO_CRM_API_KEY")!;
const ZOHO_GATEWAY = "https://connector-gateway.lovable.dev/zoho_crm";
const CURSOR_KEY = "zoho_reverse_pull_cursor";
const FIELDS = [
  "id",
  "First_Name",
  "Last_Name",
  "Email",
  "Phone",
  "Mobile",
  "Lead_Status",
  "Lead_Source",
  "Description",
  "Modified_Time",
].join(",");

const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false },
});

interface ZohoLead {
  id: string;
  First_Name?: string | null;
  Last_Name?: string | null;
  Email?: string | null;
  Phone?: string | null;
  Mobile?: string | null;
  Lead_Status?: string | null;
  Lead_Source?: string | null;
  Description?: string | null;
  Modified_Time?: string | null;
}

async function getCursor(): Promise<string | null> {
  const { data } = await admin.from("app_settings").select("value").eq("key", CURSOR_KEY).maybeSingle();
  return (data?.value as string | null) ?? null;
}

async function setCursor(iso: string) {
  await admin.from("app_settings").upsert({ key: CURSOR_KEY, value: iso }, { onConflict: "key" });
}

async function fetchModifiedSince(iso: string | null): Promise<ZohoLead[]> {
  const headers = {
    Authorization: `Bearer ${LOVABLE_API_KEY}`,
    "X-Connection-Api-Key": ZOHO_CRM_API_KEY,
    // If-Modified-Since restricts to Leads modified after this timestamp.
    ...(iso ? { "If-Modified-Since": iso } : {}),
  };
  const url = `${ZOHO_GATEWAY}/Leads?fields=${encodeURIComponent(FIELDS)}&per_page=200&sort_by=Modified_Time&sort_order=desc`;
  const res = await fetch(url, { headers });
  if (res.status === 204 || res.status === 304) return [];
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Zoho list failed ${res.status}: ${t}`);
  }
  const j = await res.json();
  return (j?.data ?? []) as ZohoLead[];
}

async function upsertFromZoho(z: ZohoLead) {
  const first = z.First_Name ?? "";
  const last = z.Last_Name ?? "";
  const name = [first, last].filter(Boolean).join(" ").trim() || "Unnamed lead";
  const email = z.Email ?? null;
  const phone = z.Phone ?? z.Mobile ?? null;
  const status = z.Lead_Status ?? null;
  const notes = z.Description ?? null;
  const source = z.Lead_Source ?? null;

  // Look up existing siblings by zoho id (then email fallback)
  let crmId: string | null = null;
  let jbjId: string | null = null;

  {
    const { data } = await admin.from("crm_leads").select("id").eq("zoho_lead_id", z.id).maybeSingle();
    crmId = data?.id ?? null;
  }
  if (!crmId && email) {
    const { data } = await admin.from("crm_leads").select("id").eq("email_lower", email.toLowerCase()).maybeSingle();
    crmId = data?.id ?? null;
  }
  {
    const { data } = await admin.from("jbj_leads").select("id").eq("zoho_lead_id", z.id).maybeSingle();
    jbjId = data?.id ?? null;
  }
  if (!jbjId && email) {
    const { data } = await admin.from("jbj_leads").select("id").eq("email", email).maybeSingle();
    jbjId = data?.id ?? null;
  }

  // Upsert CRM
  const crmRow = {
    full_name: name,
    email_lower: email ? email.toLowerCase() : null,
    phone_e164: phone,
    pipeline_stage: status,
    notes,
    source,
    zoho_lead_id: z.id,
    jbj_lead_id: jbjId,
    owner_type: "user",
    last_synced_at: new Date().toISOString(),
    last_sync_source: "zoho-reverse-pull",
    zoho_updated_at: z.Modified_Time ?? null,
    sync_error: null,
  };
  const { data: crmUpserted, error: crmErr } = await admin.rpc("sync_upsert_crm_lead", {
    p_existing_id: crmId,
    p_row: crmRow,
  });
  if (crmErr) throw crmErr;
  const newCrmId = (crmUpserted as string) ?? crmId;

  // Upsert JBJ
  const jbjRow = {
    name,
    email,
    phone,
    status,
    notes,
    source,
    zoho_lead_id: z.id,
    crm_lead_id: newCrmId,
    last_synced_at: new Date().toISOString(),
    last_sync_source: "zoho-reverse-pull",
    zoho_updated_at: z.Modified_Time ?? null,
    sync_error: null,
  };
  const { data: jbjUpserted, error: jbjErr } = await admin.rpc("sync_upsert_jbj_lead", {
    p_existing_id: jbjId,
    p_row: jbjRow,
  });
  if (jbjErr) throw jbjErr;
  const newJbjId = (jbjUpserted as string) ?? jbjId;

  // Cross-link back
  if (newCrmId && newJbjId) {
    await admin.rpc("sync_backfill_refs", {
      p_source: "crm",
      p_id: newCrmId,
      p_crm_id: null,
      p_zoho_id: z.id,
      p_error: null,
    });
    await admin.rpc("sync_backfill_refs", {
      p_source: "jbj",
      p_id: newJbjId,
      p_crm_id: newCrmId,
      p_zoho_id: z.id,
      p_error: null,
    });
  }

  return { zoho_id: z.id, crm_id: newCrmId, jbj_id: newJbjId };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const cursor = await getCursor();
    const started = new Date().toISOString();
    const leads = await fetchModifiedSince(cursor);

    const results: Array<Record<string, unknown>> = [];
    const errors: Array<Record<string, unknown>> = [];
    let newestModified = cursor;

    for (const z of leads) {
      try {
        const r = await upsertFromZoho(z);
        results.push(r);
        if (z.Modified_Time && (!newestModified || z.Modified_Time > newestModified)) {
          newestModified = z.Modified_Time;
        }
      } catch (e) {
        errors.push({ zoho_id: z.id, error: String((e as Error).message ?? e) });
      }
    }

    // Advance cursor only if we processed cleanly (or nothing to do).
    if (errors.length === 0) {
      await setCursor(newestModified ?? started);
    }

    return new Response(
      JSON.stringify({
        ok: true,
        pulled: leads.length,
        synced: results.length,
        errors,
        cursor_before: cursor,
        cursor_after: newestModified ?? started,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("zoho-reverse-pull error:", e);
    return new Response(JSON.stringify({ error: String((e as Error).message ?? e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
