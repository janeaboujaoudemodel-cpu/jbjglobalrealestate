// Phase 3 — Push calls / notes / assignments to Zoho on CRM-side changes.
// Invoked by DB triggers via pg_net. Body: { kind, record, old_record? }
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GATEWAY = "https://connector-gateway.lovable.dev/zoho_crm";
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
const ZOHO_CRM_API_KEY = Deno.env.get("ZOHO_CRM_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

function zohoHeaders() {
  return {
    Authorization: `Bearer ${LOVABLE_API_KEY}`,
    "X-Connection-Api-Key": ZOHO_CRM_API_KEY!,
    "Content-Type": "application/json",
  };
}

async function zohoFetch(path: string, init: RequestInit = {}) {
  const res = await fetch(`${GATEWAY}${path}`, {
    ...init,
    headers: { ...zohoHeaders(), ...(init.headers ?? {}) },
  });
  if (res.status === 204) return null;
  const json = await res.json().catch(() => null);
  if (!res.ok) throw new Error(`Zoho ${res.status}: ${JSON.stringify(json)}`);
  return json;
}

async function resolveZohoLeadId(leadId: string | null): Promise<string | null> {
  if (!leadId) return null;
  const { data: crm } = await admin
    .from("crm_leads")
    .select("zoho_lead_id, jbj_lead_id")
    .eq("id", leadId)
    .maybeSingle();
  if (crm?.zoho_lead_id) return crm.zoho_lead_id;
  const jbjId = crm?.jbj_lead_id ?? leadId;
  const { data: jbj } = await admin
    .from("jbj_leads")
    .select("zoho_lead_id")
    .eq("id", jbjId)
    .maybeSingle();
  return jbj?.zoho_lead_id ?? null;
}

async function handleNote(record: any) {
  const zohoId = await resolveZohoLeadId(record.lead_id);
  if (!zohoId) return { skipped: "no zoho lead" };
  return await zohoFetch(`/Leads/${zohoId}/Notes`, {
    method: "POST",
    body: JSON.stringify({
      data: [{ Note_Title: "JBJ CRM Note", Note_Content: String(record.body ?? "").slice(0, 32000) }],
    }),
  });
}

async function handleCall(record: any) {
  const zohoId = await resolveZohoLeadId(record.lead_id);
  if (!zohoId) return { skipped: "no zoho lead" };
  const startISO = record.created_at ?? new Date().toISOString();
  const start = new Date(startISO);
  const yyyy = start.getUTCFullYear();
  const mm = String(start.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(start.getUTCDate()).padStart(2, "0");
  const hh = String(start.getUTCHours()).padStart(2, "0");
  const mi = String(start.getUTCMinutes()).padStart(2, "0");
  const zohoStart = `${yyyy}-${mm}-${dd}T${hh}:${mi}:00+00:00`;
  return await zohoFetch(`/Calls`, {
    method: "POST",
    body: JSON.stringify({
      data: [{
        Subject: record.notes ? String(record.notes).slice(0, 120) : "Call",
        Call_Type: record.call_type === "inbound" ? "Inbound" : "Outbound",
        Call_Start_Time: zohoStart,
        Call_Duration: String(Math.max(0, Math.floor((record.duration_seconds ?? 0) / 60))),
        Call_Result: record.call_status ?? "Completed",
        Description: record.ai_summary ?? record.transcript_text ?? record.notes ?? null,
        Who_Id: zohoId,
        $se_module: "Leads",
      }],
    }),
  });
}

async function handleAssignment(record: any, old: any) {
  // Only fire when assignment fields actually changed
  const changed =
    record.assigned_to_user_id !== old?.assigned_to_user_id ||
    record.owner_user_id !== old?.owner_user_id ||
    record.assigned_broker_id !== old?.assigned_broker_id;
  if (!changed) return { skipped: "no assignment change" };
  const zohoId = await resolveZohoLeadId(record.id);
  if (!zohoId) return { skipped: "no zoho lead" };
  const newOwnerUuid = record.assigned_to_user_id ?? record.owner_user_id ?? null;
  if (!newOwnerUuid) return { skipped: "no owner" };
  // Look up Zoho owner mapping via crm_users_profile.zoho_user_id if present, else email
  const { data: prof } = await admin
    .from("crm_users_profile")
    .select("email")
    .eq("user_id", newOwnerUuid)
    .maybeSingle();
  if (!prof?.email) return { skipped: "no email for owner" };
  // Find Zoho user by email
  const users: any = await zohoFetch(`/users?type=AllUsers`);
  const match = users?.users?.find((u: any) => (u.email ?? "").toLowerCase() === prof.email!.toLowerCase());
  if (!match) return { skipped: `no zoho user for ${prof.email}` };
  return await zohoFetch(`/Leads`, {
    method: "PUT",
    body: JSON.stringify({ data: [{ id: zohoId, Owner: { id: match.id } }] }),
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    if (!LOVABLE_API_KEY || !ZOHO_CRM_API_KEY) throw new Error("Zoho connector not configured");
    const { kind, record, old_record } = await req.json();
    let result: unknown;
    switch (kind) {
      case "note": result = await handleNote(record); break;
      case "call": result = await handleCall(record); break;
      case "assignment": result = await handleAssignment(record, old_record ?? {}); break;
      default: throw new Error(`Unknown kind ${kind}`);
    }
    return new Response(JSON.stringify({ ok: true, kind, result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[sync-crm-event-to-zoho]", e);
    return new Response(JSON.stringify({ ok: false, error: String((e as Error).message ?? e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
