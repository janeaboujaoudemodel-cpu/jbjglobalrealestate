// Bulk import DLD broker register into crm_brokerages with strict per-owner de-duplication.
// Body: { rows: [{ office_number, name_en, name_ar, website, phone, email }] }
import { createClient } from "npm:@supabase/supabase-js@2";
import { requireOwnerAuth } from "../_shared/owner-auth-middleware.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const norm = (s: string) =>
  (s || "")
    .toUpperCase()
    .replace(/\(BRANCH\)|BRANCH|\bBR\b|\bL\.?L\.?C\.?\b|\bLLC\b|\bFZE\b|\bFZ\-?LLC\b/g, "")
    .replace(/[^A-Z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const cleanWebsite = (w: string) => {
  if (!w) return "";
  const s = w.trim();
  if (!s || s.includes(" ")) return ""; // names like "Mohammad Rafie" leaked into Website
  if (/^https?:\/\//i.test(s)) return s;
  if (/\./.test(s)) return "https://" + s.replace(/^\/+/, "");
  return "";
};

const cleanPhone = (p: string) => (p || "").replace(/[^\d+]/g, "").slice(0, 20);
const cleanEmail = (e: string) => {
  const s = (e || "").trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) ? s : "";
};

async function loadExistingBrokerages(supabase: any, ownerId: string) {
  const all: any[] = [];
  const page = 1000;
  for (let from = 0; ; from += page) {
    const { data, error } = await supabase
      .from("crm_brokerages")
      .select("id, dld_office_number, company_name, email, phone")
      .eq("owner_id", ownerId)
      .range(from, from + page - 1);
    if (error) throw error;
    const batch = data || [];
    all.push(...batch);
    if (batch.length < page) break;
    if (from > 200_000) break;
  }
  return all;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = await requireOwnerAuth(req, corsHeaders);
    if (auth.response) return auth.response;

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const ownerId = auth.userId;

    const { rows } = await req.json();
    if (!Array.isArray(rows)) {
      return new Response(JSON.stringify({ error: "rows must be an array" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Load the full existing index for this owner only. A single select is capped at
    // 1,000 rows, so pagination is required once the DLD directory is partially loaded.
    const existing = await loadExistingBrokerages(supabase, ownerId);

    const byOffice = new Map<string, any>();
    const byName = new Map<string, any>();
    const byEmail = new Map<string, any>();
    const byPhone = new Map<string, any>();
    for (const r of existing || []) {
      if (r.dld_office_number) byOffice.set(String(r.dld_office_number), r);
      if (r.company_name) byName.set(norm(r.company_name), r);
      if (r.email) byEmail.set(String(r.email).toLowerCase(), r);
      if (r.phone) byPhone.set(cleanPhone(r.phone), r);
    }

    const inserts: any[] = [];
    const updates: { id: string; patch: any }[] = [];
    let skipped = 0;

    const seenOfficesInBatch = new Set<string>();
    const claimedExistingIds = new Set<string>();

    for (const raw of rows) {
      const office = String(raw.office_number || "").trim();
      const nameEn = String(raw.name_en || "").trim();
      if (!nameEn) {
        skipped++;
        continue;
      }
      const nameKey = norm(nameEn);
      const email = cleanEmail(raw.email);
      const website = cleanWebsite(raw.website);
      const phone = cleanPhone(raw.phone);
      const nameAr = String(raw.name_ar || "").trim() || null;

      if (office) {
        if (seenOfficesInBatch.has(office)) {
          skipped++;
          continue;
        }
        seenOfficesInBatch.add(office);
      }

      const officeMatch = office ? byOffice.get(office) : null;
      const nameMatch = nameKey ? byName.get(nameKey) : null;
      const emailMatch = email ? byEmail.get(email) : null;
      const phoneMatch = phone ? byPhone.get(phone) : null;
      const canClaim = (candidate: any) =>
        candidate && !candidate.dld_office_number && !claimedExistingIds.has(candidate.id);
      const match =
        officeMatch ||
        (canClaim(nameMatch) ? nameMatch : null) ||
        (canClaim(emailMatch) ? emailMatch : null) ||
        (canClaim(phoneMatch) ? phoneMatch : null);

      if (match) {
        // Backfill only — never overwrite curated fields
        const patch: any = {};
        if (office && !match.dld_office_number) patch.dld_office_number = office;
        if (nameAr) patch.name_arabic = nameAr;
        if (Object.keys(patch).length) updates.push({ id: match.id, patch });
        claimedExistingIds.add(match.id);
        if (office) {
          match.dld_office_number = office;
          byOffice.set(office, match);
        }
        skipped++;
        continue;
      }

      inserts.push({
        owner_id: ownerId,
        company_name: nameEn,
        name_arabic: nameAr,
        dld_office_number: office || null,
        website: website || null,
        phone: phone || null,
        email: email || null,
        emirate: "Dubai",
        region: "UAE",
        source: "dld_register",
        source_detail: "DLD Broker Offices import",
        entry_source: "directory",
        registration_status: "not_registered",
        outreach_stage: "not_contacted",
        enrichment_status: "pending",
      });

      // mark as seen so next dup row in same batch isn't inserted twice
      if (office) byOffice.set(office, { id: "_pending_" });
      if (nameKey) byName.set(nameKey, { id: "_pending_" });
      if (email) byEmail.set(email, { id: "_pending_" });
      if (phone) byPhone.set(phone, { id: "_pending_" });
    }

    // Insert in chunks of 500
    let inserted = 0;
    for (let i = 0; i < inserts.length; i += 500) {
      const chunk = inserts.slice(i, i + 500);
      const { error, count } = await supabase
        .from("crm_brokerages")
        .insert(chunk, { count: "exact" });
      if (error) {
        // Fall back to row-by-row so one bad dup doesn't kill the batch
        for (const row of chunk) {
          const { error: rowErr } = await supabase.from("crm_brokerages").insert(row);
          if (!rowErr) inserted++;
          else skipped++;
        }
        continue;
      }
      inserted += count ?? chunk.length;
    }

    let updated = 0;
    for (const u of updates) {
      const { error } = await supabase
        .from("crm_brokerages")
        .update(u.patch)
        .eq("id", u.id);
      if (!error) updated++;
    }

    return new Response(
      JSON.stringify({ ok: true, inserted, updated, skipped, received: rows.length, ownerId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e?.message || e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
