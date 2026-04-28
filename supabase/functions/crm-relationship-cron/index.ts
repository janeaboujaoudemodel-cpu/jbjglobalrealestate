/**
 * CRM Relationship Cron — nightly automation
 *
 * - Flags stale developer registrations (no outreach in 14+ days, status pending)
 * - Flags expiring brokerage documents (RERA/Trade License within 30 days)
 * - Writes follow-up reminders into crm_relationship_reminders
 *
 * Triggered by pg_cron via net.http_post. Auth-free (verify_jwt = false)
 * but requires a shared CRON_SECRET header to prevent abuse.
 */
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const expected = Deno.env.get("CRM_CRON_SECRET");
    const provided = req.headers.get("x-cron-secret");
    if (expected && provided !== expected) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const service = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const now = Date.now();
    const FOURTEEN_DAYS = 14 * 24 * 60 * 60 * 1000;
    const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
    const reminders: Array<Record<string, unknown>> = [];

    // 1. Stale developer registrations
    const { data: devs } = await service
      .from("crm_developer_registry")
      .select("id, owner_id, developer_name, status, last_outreach_at, outreach_count");

    for (const d of devs ?? []) {
      if (!["pending_application", "pending_documents", "not_started"].includes(d.status)) continue;
      const last = d.last_outreach_at ? new Date(d.last_outreach_at as string).getTime() : 0;
      if (last && now - last < FOURTEEN_DAYS) continue;
      reminders.push({
        owner_id: d.owner_id,
        kind: "developer_stale",
        ref_table: "crm_developer_registry",
        ref_id: d.id,
        title: `Follow up with ${d.developer_name}`,
        detail: last
          ? `No outreach in ${Math.floor((now - last) / (24 * 60 * 60 * 1000))} days. Status: ${d.status}.`
          : `No outreach yet. Send registration request.`,
        severity: "warning",
      });
    }

    // 2. Expiring brokerage documents
    const { data: brokerages } = await service
      .from("crm_brokerages")
      .select("id, owner_id, company_name, rera_expiry, trade_license_expiry");

    for (const b of brokerages ?? []) {
      const checks: Array<[string, string | null]> = [
        ["RERA license", b.rera_expiry as string | null],
        ["Trade license", b.trade_license_expiry as string | null],
      ];
      for (const [label, expiry] of checks) {
        if (!expiry) continue;
        const ms = new Date(expiry).getTime() - now;
        if (ms > 0 && ms < THIRTY_DAYS) {
          reminders.push({
            owner_id: b.owner_id,
            kind: "doc_expiring",
            ref_table: "crm_brokerages",
            ref_id: b.id,
            title: `${label} expiring for ${b.company_name}`,
            detail: `Expires on ${expiry}. Renew within ${Math.ceil(ms / (24 * 60 * 60 * 1000))} days.`,
            severity: "critical",
          });
        }
      }
    }

    let inserted = 0;
    if (reminders.length) {
      // Upsert by (owner_id, kind, ref_id) to avoid duplicates
      const { error, count } = await service
        .from("crm_relationship_reminders")
        .upsert(reminders, { onConflict: "owner_id,kind,ref_id", count: "exact" });
      if (error) throw error;
      inserted = count ?? reminders.length;
    }

    return new Response(JSON.stringify({ ok: true, generated: reminders.length, inserted }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    console.error("crm-relationship-cron error:", e);
    return new Response(JSON.stringify({ error: e?.message || "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
