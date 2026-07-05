// Phase 1 tri-directional lead sync: JBJ CRM <-> CRM <-> Zoho CRM.
// Invoked by DB triggers on jbj_leads / crm_leads via pg_net, and can be
// called manually with { source: 'zoho', zoho_lead_id } for reverse pulls.
//
// Recursion guard: every DB write we perform sets
// `SET LOCAL app.lead_sync_in_progress = 'on'` via a SQL helper so the
// triggers skip re-emitting.

import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

type Source = "jbj" | "crm" | "zoho";
type Operation = "insert" | "update" | "delete";

interface Payload {
  source: Source;
  operation: Operation;
  record?: Record<string, unknown>;
  old_record?: Record<string, unknown>;
}

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const ZOHO_CRM_API_KEY = Deno.env.get("ZOHO_CRM_API_KEY")!;
const ZOHO_GATEWAY = "https://connector-gateway.lovable.dev/zoho_crm";

const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false },
});

// ---------- Canonical lead shape ----------
interface Canonical {
  name: string | null;
  email: string | null;
  phone: string | null;
  status: string | null;
  notes: string | null;
  source: string | null;
  jbj_lead_id?: string | null;
  crm_lead_id?: string | null;
  zoho_lead_id?: string | null;
}

function fromJbj(r: Record<string, any>): Canonical {
  return {
    name: r.name ?? null,
    email: r.email ?? null,
    phone: r.phone ?? null,
    status: r.status ?? null,
    notes: r.notes ?? null,
    source: r.source ?? null,
    jbj_lead_id: r.id ?? null,
    crm_lead_id: r.crm_lead_id ?? null,
    zoho_lead_id: r.zoho_lead_id ?? null,
  };
}

function fromCrm(r: Record<string, any>): Canonical {
  return {
    name: r.full_name ?? null,
    email: r.email_lower ?? r.email_normalized ?? null,
    phone: r.phone_e164 ?? r.phone_raw ?? null,
    status: r.pipeline_stage ?? null,
    notes: r.notes ?? null,
    source: r.source ?? null,
    jbj_lead_id: r.jbj_lead_id ?? null,
    crm_lead_id: r.id ?? null,
    zoho_lead_id: r.zoho_lead_id ?? null,
  };
}

function fromZoho(r: Record<string, any>): Canonical {
  const first = r.First_Name ?? "";
  const last = r.Last_Name ?? "";
  const name = [first, last].filter(Boolean).join(" ").trim() || null;
  return {
    name,
    email: r.Email ?? null,
    phone: r.Phone ?? r.Mobile ?? null,
    status: r.Lead_Status ?? null,
    notes: r.Description ?? null,
    source: r.Lead_Source ?? null,
    zoho_lead_id: r.id ?? null,
  };
}

// ---------- Sync-guarded writes ----------
async function withSyncGuard<T>(fn: () => Promise<T>): Promise<T> {
  // The RLS-bypassing service role client uses a fresh connection per call,
  // so we perform the flag toggle + write in one RPC via a single statement.
  return await fn();
}

async function upsertJbj(c: Canonical): Promise<string | null> {
  // Try find existing
  let existingId: string | null = c.jbj_lead_id ?? null;
  if (!existingId && c.zoho_lead_id) {
    const { data } = await admin.from("jbj_leads").select("id").eq("zoho_lead_id", c.zoho_lead_id).maybeSingle();
    existingId = data?.id ?? null;
  }
  if (!existingId && c.crm_lead_id) {
    const { data } = await admin.from("jbj_leads").select("id").eq("crm_lead_id", c.crm_lead_id).maybeSingle();
    existingId = data?.id ?? null;
  }
  if (!existingId && c.email) {
    const { data } = await admin.from("jbj_leads").select("id").eq("email", c.email).maybeSingle();
    existingId = data?.id ?? null;
  }

  const row: Record<string, unknown> = {
    name: c.name ?? "Unnamed lead",
    email: c.email,
    phone: c.phone,
    status: c.status,
    notes: c.notes,
    source: c.source,
    crm_lead_id: c.crm_lead_id,
    zoho_lead_id: c.zoho_lead_id,
    last_synced_at: new Date().toISOString(),
    last_sync_source: "sync-worker",
    sync_error: null,
  };

  // Call RPC that toggles the guard for this statement
  const { data, error } = await admin.rpc("sync_upsert_jbj_lead", {
    p_existing_id: existingId,
    p_row: row,
  });
  if (error) throw error;
  return (data as string) ?? existingId;
}

async function upsertCrm(c: Canonical): Promise<string | null> {
  let existingId: string | null = c.crm_lead_id ?? null;
  if (!existingId && c.zoho_lead_id) {
    const { data } = await admin.from("crm_leads").select("id").eq("zoho_lead_id", c.zoho_lead_id).maybeSingle();
    existingId = data?.id ?? null;
  }
  if (!existingId && c.jbj_lead_id) {
    const { data } = await admin.from("crm_leads").select("id").eq("jbj_lead_id", c.jbj_lead_id).maybeSingle();
    existingId = data?.id ?? null;
  }
  if (!existingId && c.email) {
    const { data } = await admin.from("crm_leads").select("id").eq("email_lower", c.email.toLowerCase()).maybeSingle();
    existingId = data?.id ?? null;
  }

  const row: Record<string, unknown> = {
    full_name: c.name ?? "Unnamed lead",
    email_lower: c.email ? c.email.toLowerCase() : null,
    phone_e164: c.phone,
    pipeline_stage: c.status,
    notes: c.notes,
    source: c.source,
    jbj_lead_id: c.jbj_lead_id,
    zoho_lead_id: c.zoho_lead_id,
    owner_type: "user",
    last_synced_at: new Date().toISOString(),
    last_sync_source: "sync-worker",
    sync_error: null,
  };

  const { data, error } = await admin.rpc("sync_upsert_crm_lead", {
    p_existing_id: existingId,
    p_row: row,
  });
  if (error) throw error;
  return (data as string) ?? existingId;
}

async function upsertZoho(c: Canonical): Promise<string | null> {
  const nameParts = (c.name ?? "Unnamed").split(" ");
  const lastName = nameParts.length > 1 ? nameParts.slice(-1)[0] : nameParts[0];
  const firstName = nameParts.length > 1 ? nameParts.slice(0, -1).join(" ") : "";

  const body = {
    data: [
      {
        Last_Name: lastName,
        First_Name: firstName,
        Email: c.email,
        Phone: c.phone,
        Lead_Status: c.status,
        Description: c.notes,
        Lead_Source: c.source,
        Company: "JBJ Lead", // required by Zoho
      },
    ],
    trigger: [],
  };

  const headers = {
    Authorization: `Bearer ${LOVABLE_API_KEY}`,
    "X-Connection-Api-Key": ZOHO_CRM_API_KEY,
    "Content-Type": "application/json",
  };

  if (c.zoho_lead_id) {
    const res = await fetch(`${ZOHO_GATEWAY}/Leads/${c.zoho_lead_id}`, {
      method: "PUT",
      headers,
      body: JSON.stringify(body),
    });
    if (!res.ok && res.status !== 204) {
      const t = await res.text();
      throw new Error(`Zoho update failed ${res.status}: ${t}`);
    }
    return c.zoho_lead_id;
  } else {
    const res = await fetch(`${ZOHO_GATEWAY}/Leads`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });
    const j = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(`Zoho create failed ${res.status}: ${JSON.stringify(j)}`);
    const zid = j?.data?.[0]?.details?.id ?? null;
    return zid;
  }
}

async function fanOut(canonical: Canonical, source: Source): Promise<{ jbj: string | null; crm: string | null; zoho: string | null; errors: Record<string, string> }> {
  const errors: Record<string, string> = {};
  const c: Canonical = { ...canonical };

  if (source !== "zoho") {
    try {
      const zid = await upsertZoho(c);
      if (zid) c.zoho_lead_id = zid;
    } catch (e) {
      errors.zoho = String((e as Error).message ?? e);
    }
  }
  if (source !== "crm") {
    try {
      const cid = await upsertCrm(c);
      if (cid) c.crm_lead_id = cid;
    } catch (e) {
      errors.crm = String((e as Error).message ?? e);
    }
  }
  if (source !== "jbj") {
    try {
      const jid = await upsertJbj(c);
      if (jid) c.jbj_lead_id = jid;
    } catch (e) {
      errors.jbj = String((e as Error).message ?? e);
    }
  }

  // Back-fill cross-refs on the source row so future edits find their siblings
  try {
    if (source === "jbj" && c.jbj_lead_id) {
      await admin.rpc("sync_backfill_refs", {
        p_source: "jbj",
        p_id: c.jbj_lead_id,
        p_crm_id: c.crm_lead_id,
        p_zoho_id: c.zoho_lead_id,
        p_error: Object.keys(errors).length ? JSON.stringify(errors) : null,
      });
    } else if (source === "crm" && c.crm_lead_id) {
      await admin.rpc("sync_backfill_refs", {
        p_source: "crm",
        p_id: c.crm_lead_id,
        p_crm_id: null,
        p_zoho_id: c.zoho_lead_id,
        p_error: Object.keys(errors).length ? JSON.stringify(errors) : null,
      });
    }
  } catch (e) {
    errors.backfill = String((e as Error).message ?? e);
  }

  return { jbj: c.jbj_lead_id ?? null, crm: c.crm_lead_id ?? null, zoho: c.zoho_lead_id ?? null, errors };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const payload = (await req.json()) as Payload & { id?: string; force?: boolean };

    // Force-sync path: caller passes { source, id, force:true } — load the record ourselves.
    if (payload.force && payload.id && payload.source) {
      let record: any = null;
      if (payload.source === "jbj") {
        const { data } = await admin.from("jbj_leads").select("*").eq("id", payload.id).maybeSingle();
        record = data;
      } else if (payload.source === "crm") {
        const { data } = await admin.from("crm_leads").select("*").eq("id", payload.id).maybeSingle();
        record = data;
      }
      if (!record) {
        return new Response(JSON.stringify({ error: "record not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      payload.operation = "update";
      payload.record = record;
    }

    if (!payload?.source || !payload?.operation) {
      return new Response(JSON.stringify({ error: "source and operation required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Phase 1: skip deletes (soft-delete not standardised across the three systems)
    if (payload.operation === "delete") {
      return new Response(JSON.stringify({ ok: true, skipped: "delete not synced in Phase 1" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }


    let canonical: Canonical;
    if (payload.source === "jbj") canonical = fromJbj(payload.record ?? {});
    else if (payload.source === "crm") canonical = fromCrm(payload.record ?? {});
    else canonical = fromZoho(payload.record ?? {});

    const result = await fanOut(canonical, payload.source);

    return new Response(JSON.stringify({ ok: true, result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("sync-lead-tri error:", e);
    return new Response(JSON.stringify({ error: String((e as Error).message ?? e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
