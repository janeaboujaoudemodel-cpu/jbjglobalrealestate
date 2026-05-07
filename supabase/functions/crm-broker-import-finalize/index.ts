// crm-broker-import-finalize: read staging rows for a batch, apply each
// decision (merge / keep / edit / skip), and return a bulk import summary.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { combineSpecialties, normalizePhone, normalizeEmail } from "../_shared/brokerNormalize.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const { data: { user } } = await createClient(
      Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    ).auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { batch_id } = await req.json();
    if (!batch_id) {
      return new Response(JSON.stringify({ error: "batch_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: batch, error: bErr } = await supabase
      .from("crm_import_batches").select("*").eq("id", batch_id).eq("owner_id", user.id).single();
    if (bErr || !batch) {
      return new Response(JSON.stringify({ error: "Batch not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const specialty: string = batch.specialty_label || batch.default_expertise_type || "other";
    const incomingLabels = [specialty];
    if (batch.specialty_custom_label) incomingLabels.push(batch.specialty_custom_label);

    const { data: stagingRows } = await supabase
      .from("crm_broker_import_staging")
      .select("*")
      .eq("batch_id", batch_id)
      .eq("owner_id", user.id)
      .limit(100000);

    const rows = stagingRows ?? [];
    let merged = 0, created = 0, skipped = 0, missingPhone = 0, missingEmail = 0;

    for (const s of rows) {
      const decision = s.decision || "pending";
      const data = (s.edited ?? s.normalized ?? {}) as Record<string, any>;
      const phone = normalizePhone(data.phone);
      const email = normalizeEmail(data.email);
      if (!phone) missingPhone++;
      if (!email) missingEmail++;

      if (decision === "skip") { skipped++; continue; }

      if (decision === "merge" && s.match_agent_id) {
        const { data: existing } = await supabase
          .from("crm_brokerage_agents").select("*").eq("id", s.match_agent_id).single();
        if (!existing) { skipped++; continue; }

        const newLabels = combineSpecialties(existing.specialty_labels ?? [], incomingLabels);
        const newBatchIds = Array.from(new Set([...(existing.source_batch_ids ?? []), batch_id]));
        const newHistory = [
          ...(Array.isArray(existing.source_history) ? existing.source_history : []),
          {
            batch_id, file: batch.source_filename, label: batch.label,
            specialty: specialty, imported_at: new Date().toISOString(),
          },
        ];
        const newMergeHistory = [
          ...(Array.isArray(existing.merge_history) ? existing.merge_history : []),
          { at: new Date().toISOString(), from_batch: batch_id, source: data, reasons: s.match_reasons },
        ];

        // Fill empty fields only — never overwrite non-null
        const fill = (k: string, v: any) => (existing[k] == null || existing[k] === "" ? v : existing[k]);

        await supabase.from("crm_brokerage_agents").update({
          specialty_labels: newLabels,
          source_batch_ids: newBatchIds,
          source_history: newHistory,
          merge_history: newMergeHistory,
          phone: fill("phone", data.phone),
          phone_normalized: fill("phone_normalized", phone),
          whatsapp: fill("whatsapp", data.whatsapp),
          whatsapp_normalized: fill("whatsapp_normalized", normalizePhone(data.whatsapp)),
          email: fill("email", data.email),
          email_normalized: fill("email_normalized", email),
          license_number: fill("license_number", data.license_number),
          rera_number: fill("rera_number", data.rera_number),
          nationality: fill("nationality", data.nationality),
          country: fill("country", data.country),
          city: fill("city", data.city),
          updated_at: new Date().toISOString(),
        }).eq("id", existing.id);

        merged++;
      } else {
        // keep / edit / pending → insert new
        const { error: insErr } = await supabase.from("crm_brokerage_agents").insert({
          owner_id: user.id,
          brokerage_id: data.brokerage_id ?? null,
          name: data.name || "Unknown",
          phone: data.phone ?? null,
          whatsapp: data.whatsapp ?? data.phone ?? null,
          email: data.email ?? null,
          role: data.role ?? null,
          status: "active",
          source: "registry_import",
          phone_normalized: phone,
          whatsapp_normalized: normalizePhone(data.whatsapp),
          email_normalized: email,
          license_number: data.license_number ?? null,
          rera_number: data.rera_number ?? null,
          nationality: data.nationality ?? null,
          country: data.country ?? null,
          city: data.city ?? null,
          specialty_labels: incomingLabels,
          source_batch_ids: [batch_id],
          source_history: [{
            batch_id, file: batch.source_filename, label: batch.label,
            specialty, imported_at: new Date().toISOString(),
          }],
          import_batch_id: batch_id,
          import_label: batch.label,
        });
        if (!insErr) created++; else skipped++;
      }
    }

    await supabase.from("crm_import_batches").update({
      inserted: created, updated: merged, skipped, status: "complete",
    }).eq("id", batch_id);

    await supabase.from("crm_broker_import_staging").delete().eq("batch_id", batch_id);

    return new Response(JSON.stringify({
      summary: {
        batch_id, total: rows.length,
        new_brokers: created, merged, skipped,
        missing_phone: missingPhone, missing_email: missingEmail,
        labels_applied: incomingLabels,
        source_database: batch.source_name || batch.source_filename,
      },
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
