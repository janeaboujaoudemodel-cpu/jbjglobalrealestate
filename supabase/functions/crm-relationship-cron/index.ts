/**
 * CRM Relationship Cron — nightly automation
 *
 * - Flags stale developer registrations (no outreach in 14+ days, status pending) -> follow_up
 * - Flags expiring brokerage RERA / Trade License (within 30 days) -> document_expiry
 *
 * Writes into existing crm_relationship_reminders table.
 * Triggered by pg_cron via net.http_post.
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
    // Fail closed: require the secret to be configured AND the header to be present AND matching.
    if (!expected || !provided || provided !== expected) {
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
      .select("id, owner_id, developer_name, status, last_outreach_at");

    for (const d of devs ?? []) {
      if (!["pending_application", "pending_documents", "not_started"].includes(d.status as string)) continue;
      const last = d.last_outreach_at ? new Date(d.last_outreach_at as string).getTime() : 0;
      if (last && now - last < FOURTEEN_DAYS) continue;
      const days = last ? Math.floor((now - last) / (24 * 60 * 60 * 1000)) : null;
      reminders.push({
        owner_id: d.owner_id,
        kind: "follow_up",
        title: `Follow up with ${d.developer_name}`,
        body: days
          ? `No outreach in ${days} days. Status: ${d.status}.`
          : `No outreach yet. Send a registration request.`,
        due_at: new Date().toISOString(),
        dev_registry_id: d.id,
        ai_generated: true,
      });
    }

    // 2. Expiring broker documents (RERA card + Emirates ID)
    // Expiry dates live on broker_profiles, not crm_brokerages.
    const { data: brokers } = await service
      .from("broker_profiles")
      .select("id, user_id, display_name, rera_expiry_date, id_expiry_date");

    for (const b of brokers ?? []) {
      const checks: Array<[string, string | null]> = [
        ["RERA card", (b.rera_expiry_date as string | null) ?? null],
        ["Emirates ID", (b.id_expiry_date as string | null) ?? null],
      ];
      for (const [label, expiry] of checks) {
        if (!expiry) continue;
        const ms = new Date(expiry).getTime() - now;
        if (ms > 0 && ms < THIRTY_DAYS) {
          reminders.push({
            owner_id: b.user_id,
            kind: "document_expiry",
            title: `${label} expiring for ${b.display_name}`,
            body: `Expires on ${expiry}. Renew within ${Math.ceil(ms / (24 * 60 * 60 * 1000))} days.`,
            due_at: expiry,
            metadata: { broker_profile_id: b.id, document: label },
            ai_generated: true,
          });
        }
      }
    }

    let inserted = 0;
    for (const r of reminders) {
      // Avoid duplicates: skip if an open AI-generated reminder of the same kind exists for the same ref
      const refField = r.dev_registry_id ? "dev_registry_id" : "brokerage_id";
      const refVal = r[refField];
      const { data: existing } = await service
        .from("crm_relationship_reminders")
        .select("id")
        .eq("owner_id", r.owner_id)
        .eq("kind", r.kind)
        .eq(refField, refVal)
        .eq("is_done", false)
        .eq("ai_generated", true)
        .limit(1);
      if (existing && existing.length > 0) continue;
      const { error } = await service.from("crm_relationship_reminders").insert(r);
      if (!error) inserted++;
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
