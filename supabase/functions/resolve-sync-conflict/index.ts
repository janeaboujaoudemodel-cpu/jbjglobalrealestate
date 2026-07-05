// Phase 3 — apply a resolved sync_conflicts row.
// POST { conflict_id, resolution: 'jbj'|'crm'|'zoho'|'manual'|'ignored', final_value? }
// Writes the chosen value to CRM + JBJ + Zoho (unless 'ignored'), then marks resolved.

import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;
const ZOHO_CRM_API_KEY = Deno.env.get("ZOHO_CRM_API_KEY")!;
const ZOHO_GATEWAY = "https://connector-gateway.lovable.dev/zoho_crm";

const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

const CRM_COL: Record<string, string> = {
  name: "full_name", email: "email_lower", phone: "phone_e164",
  status: "pipeline_stage", notes: "notes",
};
const JBJ_COL: Record<string, string> = {
  name: "name", email: "email", phone: "phone", status: "status", notes: "notes",
};
const ZOHO_FIELD: Record<string, string> = {
  email: "Email", phone: "Phone", status: "Lead_Status", notes: "Description",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { conflict_id, resolution, final_value } = await req.json();
    if (!conflict_id || !resolution) throw new Error("conflict_id + resolution required");

    const { data: c, error: e1 } = await admin.from("sync_conflicts").select("*").eq("id", conflict_id).maybeSingle();
    if (e1 || !c) throw new Error("conflict not found");

    let chosen: string | null = final_value ?? null;
    if (resolution === "jbj") chosen = c.jbj_value;
    else if (resolution === "crm") chosen = c.crm_value;
    else if (resolution === "zoho") chosen = c.zoho_value;

    if (resolution !== "ignored") {
      // Write to CRM
      if (c.crm_lead_id && CRM_COL[c.field]) {
        await admin.from("crm_leads").update({ [CRM_COL[c.field]]: chosen }).eq("id", c.crm_lead_id);
      }
      // Write to JBJ
      if (c.jbj_lead_id && JBJ_COL[c.field]) {
        await admin.from("jbj_leads").update({ [JBJ_COL[c.field]]: chosen }).eq("id", c.jbj_lead_id);
      }
      // Write to Zoho
      if (c.zoho_lead_id) {
        if (c.field === "name") {
          const parts = String(chosen ?? "Unnamed").split(" ");
          const last = parts.length > 1 ? parts.slice(-1)[0] : parts[0];
          const first = parts.length > 1 ? parts.slice(0, -1).join(" ") : "";
          await fetch(`${ZOHO_GATEWAY}/Leads/${c.zoho_lead_id}`, {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "X-Connection-Api-Key": ZOHO_CRM_API_KEY,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ data: [{ Last_Name: last, First_Name: first }] }),
          });
        } else if (ZOHO_FIELD[c.field]) {
          await fetch(`${ZOHO_GATEWAY}/Leads/${c.zoho_lead_id}`, {
            method: "PUT",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "X-Connection-Api-Key": ZOHO_CRM_API_KEY,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ data: [{ [ZOHO_FIELD[c.field]]: chosen }] }),
          });
        }
      }
    }

    await admin.from("sync_conflicts").update({
      resolved_at: new Date().toISOString(),
      resolution,
      final_value: chosen,
    }).eq("id", conflict_id);

    return new Response(JSON.stringify({ ok: true, final_value: chosen }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
