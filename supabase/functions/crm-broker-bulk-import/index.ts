// crm-broker-bulk-import: high-throughput chunked importer.
// Receives up to 1000 normalized broker rows + batch_id; matches against the
// existing registry in a single round-trip, then bulk-inserts new + parallel
// merges duplicates. No per-row awaits, no Review panel needed.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import {
  combineSpecialties,
  normalizePhone,
  normalizeEmail,
  nameSimilarity,
} from "../_shared/brokerNormalize.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface IncomingRow {
  index: number;
  name?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  email?: string | null;
  role?: string | null;
  brokerage_id?: string | null;
  license_number?: string | null;
  rera_number?: string | null;
  nationality?: string | null;
  country?: string | null;
  city?: string | null;
}

async function pAllLimit<T>(items: T[], limit: number, fn: (x: T) => Promise<void>) {
  let i = 0;
  const workers = Array(Math.min(limit, items.length)).fill(0).map(async () => {
    while (i < items.length) {
      const idx = i++;
      try { await fn(items[idx]); } catch (_) { /* swallow per-item */ }
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

    const body = await req.json();
    const rows: IncomingRow[] = Array.isArray(body?.rows) ? body.rows : [];
    const batchId: string | null = body?.batch_id ?? null;
    if (!batchId) {
      return new Response(JSON.stringify({ error: "batch_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (rows.length === 0) {
      return new Response(JSON.stringify({ inserted: 0, merged: 0, skipped: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (rows.length > 1000) {
      return new Response(JSON.stringify({ error: "Max 1000 rows per chunk" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Load batch metadata once for labels + history entries
    const { data: batch } = await supabase
      .from("crm_import_batches").select("*").eq("id", batchId).eq("owner_id", user.id).single();
    if (!batch) {
      return new Response(JSON.stringify({ error: "Batch not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const specialty: string = batch.specialty_label || batch.default_expertise_type || "other";
    const incomingLabels = [specialty];
    if (batch.specialty_custom_label) incomingLabels.push(batch.specialty_custom_label);

    // ---- Normalize once
    const norm = rows.map((r) => ({
      ...r,
      _phone: normalizePhone(r.phone),
      _whatsapp: normalizePhone(r.whatsapp),
      _email: normalizeEmail(r.email),
      _license: (r.license_number || r.rera_number || "").trim() || null,
    }));

    // ---- Lookup candidates (one IN per key set)
    const phones = Array.from(new Set(norm.flatMap((r) => [r._phone, r._whatsapp]).filter(Boolean) as string[]));
    const emails = Array.from(new Set(norm.map((r) => r._email).filter(Boolean) as string[]));
    const licenses = Array.from(new Set(norm.map((r) => r._license).filter(Boolean) as string[]));
    const agencyIds = Array.from(new Set(norm.map((r) => r.brokerage_id).filter(Boolean) as string[]));

    let agents: any[] = [];
    if (phones.length || emails.length || licenses.length || agencyIds.length) {
      const queries: Promise<any>[] = [];
      const sel = "id, name, brokerage_id, phone, whatsapp, email, phone_normalized, whatsapp_normalized, email_normalized, license_number, rera_number, specialty_labels, source_batch_ids, source_history, merge_history, nationality, country, city, role";
      if (phones.length) queries.push(supabase.from("crm_brokerage_agents").select(sel).eq("owner_id", user.id).in("phone_normalized", phones));
      if (phones.length) queries.push(supabase.from("crm_brokerage_agents").select(sel).eq("owner_id", user.id).in("whatsapp_normalized", phones));
      if (emails.length) queries.push(supabase.from("crm_brokerage_agents").select(sel).eq("owner_id", user.id).in("email_normalized", emails));
      if (licenses.length) queries.push(supabase.from("crm_brokerage_agents").select(sel).eq("owner_id", user.id).in("license_number", licenses));
      if (agencyIds.length) queries.push(supabase.from("crm_brokerage_agents").select(sel).eq("owner_id", user.id).in("brokerage_id", agencyIds).limit(5000));
      const results = await Promise.all(queries);
      const seen = new Set<string>();
      for (const res of results) {
        for (const a of (res.data ?? [])) {
          if (seen.has(a.id)) continue;
          seen.add(a.id);
          agents.push(a);
        }
      }
    }

    // Index candidates
    const byPhone = new Map<string, any>();
    const byEmail = new Map<string, any>();
    const byLicense = new Map<string, any>();
    const byAgency = new Map<string, any[]>();
    for (const a of agents) {
      if (a.phone_normalized) byPhone.set(a.phone_normalized, a);
      if (a.whatsapp_normalized) byPhone.set(a.whatsapp_normalized, a);
      if (a.email_normalized) byEmail.set(a.email_normalized, a);
      if (a.license_number) byLicense.set(a.license_number, a);
      if (a.rera_number) byLicense.set(a.rera_number, a);
      if (a.brokerage_id) {
        if (!byAgency.has(a.brokerage_id)) byAgency.set(a.brokerage_id, []);
        byAgency.get(a.brokerage_id)!.push(a);
      }
    }

    // ---- Decide per row
    const toInsert: any[] = [];
    const toMerge: { existing: any; data: any; reasons: string[] }[] = [];
    let missingPhone = 0, missingEmail = 0;

    for (const r of norm) {
      if (!r._phone) missingPhone++;
      if (!r._email) missingEmail++;

      let best: any = null; const reasons: string[] = [];
      const try_ = (cand: any, reason: string) => { if (cand && !best) { best = cand; reasons.push(reason); } };
      if (r._phone) try_(byPhone.get(r._phone), "phone match");
      if (!best && r._whatsapp) try_(byPhone.get(r._whatsapp), "whatsapp match");
      if (!best && r._email) try_(byEmail.get(r._email), "email match");
      if (!best && r._license) try_(byLicense.get(r._license), "license match");
      if (!best && r.name && r.brokerage_id) {
        const pool = byAgency.get(r.brokerage_id) || [];
        let topSim = 0; let topAg: any = null;
        for (const a of pool) {
          const sim = nameSimilarity(r.name, a.name || "");
          if (sim >= 0.85 && sim > topSim) { topSim = sim; topAg = a; }
        }
        if (topAg) { best = topAg; reasons.push(`name ${(topSim * 100).toFixed(0)}% + same agency`); }
      }

      if (best) {
        toMerge.push({ existing: best, data: r, reasons });
      } else {
        toInsert.push({
          owner_id: user.id,
          brokerage_id: r.brokerage_id ?? null,
          name: r.name || "Unknown",
          phone: r.phone ?? null,
          whatsapp: r.whatsapp ?? r.phone ?? null,
          email: r.email ?? null,
          role: r.role ?? null,
          status: "active",
          source: "registry_import",
          phone_normalized: r._phone,
          whatsapp_normalized: r._whatsapp,
          email_normalized: r._email,
          license_number: r.license_number ?? null,
          rera_number: r.rera_number ?? null,
          nationality: r.nationality ?? null,
          country: r.country ?? null,
          city: r.city ?? null,
          specialty_labels: incomingLabels,
          source_batch_ids: [batchId],
          source_history: [{
            batch_id: batchId, file: batch.source_filename, label: batch.label,
            source_name: batch.source_name ?? null, source_type: batch.source_type ?? null,
            specialty, imported_at: new Date().toISOString(),
          }],
          import_batch_id: batchId,
          import_label: batch.label,
        });
      }
    }

    // ---- Bulk insert (chunked at 500 to stay under PG payload caps)
    let inserted = 0, skipped = 0;
    for (let i = 0; i < toInsert.length; i += 500) {
      const chunk = toInsert.slice(i, i + 500);
      const { error, count } = await supabase.from("crm_brokerage_agents").insert(chunk, { count: "exact" });
      if (error) skipped += chunk.length;
      else inserted += (count ?? chunk.length);
    }

    // ---- Parallel merges (group by existing id so we only update each agent once per chunk)
    const mergeMap = new Map<string, { existing: any; rows: { data: any; reasons: string[] }[] }>();
    for (const m of toMerge) {
      const e = mergeMap.get(m.existing.id) || { existing: m.existing, rows: [] };
      e.rows.push({ data: m.data, reasons: m.reasons });
      mergeMap.set(m.existing.id, e);
    }
    let merged = 0;
    const mergeJobs = Array.from(mergeMap.values());
    await pAllLimit(mergeJobs, 20, async (job) => {
      const ex = job.existing;
      const fill = (k: string, v: any) => (ex[k] == null || ex[k] === "" ? v : ex[k]);
      let labels = ex.specialty_labels ?? [];
      const newBatchIds = Array.from(new Set([...(ex.source_batch_ids ?? []), batchId]));
      const newHistory = Array.isArray(ex.source_history) ? [...ex.source_history] : [];
      const newMergeHistory = Array.isArray(ex.merge_history) ? [...ex.merge_history] : [];
      let phone = ex.phone, whatsapp = ex.whatsapp, email = ex.email;
      let phoneN = ex.phone_normalized, waN = ex.whatsapp_normalized, emailN = ex.email_normalized;
      let lic = ex.license_number, rera = ex.rera_number;
      let nat = ex.nationality, country = ex.country, city = ex.city;
      for (const r of job.rows) {
        labels = combineSpecialties(labels, incomingLabels);
        newHistory.push({
          batch_id: batchId, file: batch.source_filename, label: batch.label,
          source_name: batch.source_name ?? null, source_type: batch.source_type ?? null,
          specialty, imported_at: new Date().toISOString(),
        });
        newMergeHistory.push({ at: new Date().toISOString(), from_batch: batchId, reasons: r.reasons });
        const d = r.data;
        if (phone == null || phone === "") { phone = d.phone ?? phone; phoneN = d._phone ?? phoneN; }
        if (whatsapp == null || whatsapp === "") { whatsapp = d.whatsapp ?? whatsapp; waN = d._whatsapp ?? waN; }
        if (email == null || email === "") { email = d.email ?? email; emailN = d._email ?? emailN; }
        if (lic == null || lic === "") lic = d.license_number ?? lic;
        if (rera == null || rera === "") rera = d.rera_number ?? rera;
        if (nat == null || nat === "") nat = d.nationality ?? nat;
        if (country == null || country === "") country = d.country ?? country;
        if (city == null || city === "") city = d.city ?? city;
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
      }).eq("id", ex.id);
      if (!error) merged += job.rows.length;
      else skipped += job.rows.length;
    });

    // bump batch counters (best-effort)
    try {
      await supabase.from("crm_import_batches").update({
        inserted: (batch.inserted ?? 0) + inserted,
        updated: (batch.updated ?? 0) + merged,
        skipped: (batch.skipped ?? 0) + skipped,
        status: "running",
      }).eq("id", batchId);
    } catch (_) { /* best effort */ }

    return new Response(JSON.stringify({
      inserted, merged, skipped,
      missing_phone: missingPhone, missing_email: missingEmail,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
