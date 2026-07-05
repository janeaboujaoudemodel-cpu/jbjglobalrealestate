// Phase 3 — Scan all cross-linked leads and log any field-level disagreements
// between the local CRM/JBJ row and the live Zoho record into sync_conflicts.
// POST with no body; returns { scanned, conflicts_created }.

import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const ZOHO_CRM_API_KEY = Deno.env.get("ZOHO_CRM_API_KEY")!;
const ZOHO_GATEWAY = "https://connector-gateway.lovable.dev/zoho_crm";

const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

const norm = (v: unknown) => (v == null ? "" : String(v).trim().toLowerCase());

async function fetchZoho(id: string) {
  const res = await fetch(`${ZOHO_GATEWAY}/Leads/${id}`, {
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": ZOHO_CRM_API_KEY,
    },
  });
  if (!res.ok) return null;
  const j = await res.json();
  return j?.data?.[0] ?? null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { data: leads } = await admin
      .from("crm_leads")
      .select("id, full_name, email_lower, phone_e164, pipeline_stage, notes, zoho_lead_id, jbj_lead_id")
      .not("zoho_lead_id", "is", null)
      .limit(500);

    let created = 0;
    let scanned = 0;
    for (const lead of (leads ?? []) as any[]) {
      scanned++;
      const zoho = await fetchZoho(lead.zoho_lead_id);
      if (!zoho) continue;

      // Optional JBJ side for triangular compare
      let jbj: any = null;
      if (lead.jbj_lead_id) {
        const { data } = await admin.from("jbj_leads").select("name,email,phone,status,notes").eq("id", lead.jbj_lead_id).maybeSingle();
        jbj = data;
      }

      const zohoName = [zoho.First_Name, zoho.Last_Name].filter(Boolean).join(" ").trim();
      const checks: Array<{ field: string; crm: string; zoho: string; jbj: string }> = [
        { field: "name", crm: lead.full_name ?? "", zoho: zohoName, jbj: jbj?.name ?? "" },
        { field: "email", crm: lead.email_lower ?? "", zoho: zoho.Email ?? "", jbj: jbj?.email ?? "" },
        { field: "phone", crm: lead.phone_e164 ?? "", zoho: zoho.Phone ?? zoho.Mobile ?? "", jbj: jbj?.phone ?? "" },
        { field: "status", crm: lead.pipeline_stage ?? "", zoho: zoho.Lead_Status ?? "", jbj: jbj?.status ?? "" },
        { field: "notes", crm: lead.notes ?? "", zoho: zoho.Description ?? "", jbj: jbj?.notes ?? "" },
      ];

      for (const c of checks) {
        // A conflict = at least two non-empty values disagree
        const vals = [norm(c.crm), norm(c.zoho), norm(c.jbj)].filter((v) => v !== "");
        if (vals.length < 2) continue;
        const uniq = new Set(vals);
        if (uniq.size < 2) continue;

        // Avoid duplicating an already-open conflict on the same lead+field
        const { data: existing } = await admin
          .from("sync_conflicts")
          .select("id")
          .eq("crm_lead_id", lead.id)
          .eq("field", c.field)
          .is("resolved_at", null)
          .maybeSingle();
        if (existing) continue;

        const { error } = await admin.from("sync_conflicts").insert({
          crm_lead_id: lead.id,
          jbj_lead_id: lead.jbj_lead_id,
          zoho_lead_id: lead.zoho_lead_id,
          field: c.field,
          crm_value: c.crm || null,
          zoho_value: c.zoho || null,
          jbj_value: c.jbj || null,
        });
        if (!error) created++;
      }

      await new Promise((r) => setTimeout(r, 30));
    }

    return new Response(JSON.stringify({ ok: true, scanned, conflicts_created: created }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
