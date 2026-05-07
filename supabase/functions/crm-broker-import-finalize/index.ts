// crm-broker-import-finalize: read staging rows for a batch (paginated),
// apply each decision (merge / keep / edit / skip) using bulk insert + parallel
// updates so it never times out, then return a summary.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { combineSpecialties, normalizePhone, normalizeEmail } from "../_shared/brokerNormalize.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

async function pAllLimit<T>(items: T[], limit: number, fn: (x: T) => Promise<void>) {
  let i = 0;
  const workers = Array(Math.min(limit, items.length)).fill(0).map(async () => {
    while (i < items.length) {
      const idx = i++;
      try { await fn(items[idx]); } catch (_) { /* swallow */ }
    }
  });
  await Promise.all(workers);
}

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

    // Paginated fetch (PostgREST caps at 1000 by default)
    const PAGE = 1000;
    const stagingRows: any[] = [];
    for (let from = 0; ; from += PAGE) {
      const { data: p } = await supabase
        .from("crm_broker_import_staging")
        .select("*")
        .eq("batch_id", batch_id)
        .eq("owner_id", user.id)
        .range(from, from + PAGE - 1);
      const arr = (p ?? []) as any[];
      stagingRows.push(...arr);
      if (arr.length < PAGE) break;
      if (from > 200_000) break;
    }

    let merged = 0, created = 0, skipped = 0, missingPhone = 0, missingEmail = 0;

    // ---- Pre-classify
    const toInsert: any[] = [];
    const mergeGroups = new Map<string, { rows: any[] }>();

    for (const s of stagingRows) {
      const decision = s.decision || "pending";
      const data = (s.edited ?? s.normalized ?? {}) as Record<string, any>;
      const phone = normalizePhone(data.phone);
      const email = normalizeEmail(data.email);
      if (!phone) missingPhone++;
      if (!email) missingEmail++;

      if (decision === "skip") { skipped++; continue; }

      if (decision === "merge" && s.match_agent_id) {
        const g = mergeGroups.get(s.match_agent_id) || { rows: [] };
        g.rows.push({ data, reasons: s.match_reasons });
        mergeGroups.set(s.match_agent_id, g);
      } else {
        toInsert.push({
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
      }
    }

    // Bulk insert in 500-row chunks
    for (let i = 0; i < toInsert.length; i += 500) {
      const chunk = toInsert.slice(i, i + 500);
      const { error, count } = await supabase.from("crm_brokerage_agents").insert(chunk, { count: "exact" });
      if (error) skipped += chunk.length;
      else created += (count ?? chunk.length);
    }

    // Bulk-fetch existing rows being merged (chunked IN)
    const ids = Array.from(mergeGroups.keys());
    const existingById = new Map<string, any>();
    for (let i = 0; i < ids.length; i += 200) {
      const part = ids.slice(i, i + 200);
      const { data } = await supabase.from("crm_brokerage_agents").select("*").in("id", part);
      for (const a of (data ?? [])) existingById.set(a.id, a);
    }

    // Parallel merges (cap concurrency)
    const jobs = Array.from(mergeGroups.entries());
    await pAllLimit(jobs, 20, async ([id, g]) => {
      const ex = existingById.get(id);
      if (!ex) { skipped += g.rows.length; return; }
      const fill = (cur: any, nxt: any) => (cur == null || cur === "" ? nxt : cur);
      let labels = ex.specialty_labels ?? [];
      const newBatchIds = Array.from(new Set([...(ex.source_batch_ids ?? []), batch_id]));
      const newHistory = Array.isArray(ex.source_history) ? [...ex.source_history] : [];
      const newMergeHistory = Array.isArray(ex.merge_history) ? [...ex.merge_history] : [];
      let phone = ex.phone, whatsapp = ex.whatsapp, email = ex.email;
      let phoneN = ex.phone_normalized, waN = ex.whatsapp_normalized, emailN = ex.email_normalized;
      let lic = ex.license_number, rera = ex.rera_number;
      let nat = ex.nationality, country = ex.country, city = ex.city;

      for (const r of g.rows) {
        const d = r.data;
        labels = combineSpecialties(labels, incomingLabels);
        newHistory.push({
          batch_id, file: batch.source_filename, label: batch.label,
          specialty, imported_at: new Date().toISOString(),
        });
        newMergeHistory.push({ at: new Date().toISOString(), from_batch: batch_id, source: d, reasons: r.reasons });
        phone = fill(phone, d.phone); phoneN = fill(phoneN, normalizePhone(d.phone));
        whatsapp = fill(whatsapp, d.whatsapp); waN = fill(waN, normalizePhone(d.whatsapp));
        email = fill(email, d.email); emailN = fill(emailN, normalizeEmail(d.email));
        lic = fill(lic, d.license_number); rera = fill(rera, d.rera_number);
        nat = fill(nat, d.nationality); country = fill(country, d.country); city = fill(city, d.city);
      }

      const { error } = await supabase.from("crm_brokerage_agents").update({
        specialty_labels: labels,
        source_batch_ids: newBatchIds,
        source_history: newHistory,
        merge_history: newMergeHistory,
        phone, phone_normalized: phoneN,
        whatsapp, whatsapp_normalized: waN,
        email, email_normalized: emailN,
        license_number: lic, rera_number: rera,
        nationality: nat, country, city,
        updated_at: new Date().toISOString(),
      }).eq("id", id);
      if (error) skipped += g.rows.length;
      else merged += g.rows.length;
    });

    await supabase.from("crm_import_batches").update({
      inserted: created, updated: merged, skipped, status: "complete",
    }).eq("id", batch_id);

    await supabase.from("crm_broker_import_staging").delete().eq("batch_id", batch_id);

    return new Response(JSON.stringify({
      summary: {
        batch_id, total: stagingRows.length,
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
