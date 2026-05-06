// Bulk import DLD broker register into crm_brokerages with strict de-duplication.
// Body: { rows: [{ office_number, name_en, name_ar, website, phone, email }] }
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const authHeader = req.headers.get("Authorization") || "";
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: u } = await userClient.auth.getUser();
    if (!u?.user) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const ownerId = u.user.id;

    const { rows } = await req.json();
    if (!Array.isArray(rows)) {
      return new Response(JSON.stringify({ error: "rows must be an array" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Load existing index keys (small payload)
    const { data: existing } = await supabase
      .from("crm_brokerages")
      .select("id, dld_office_number, company_name, email, phone");

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

    const seenInBatch = new Set<string>();

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

      const dupKey =
        (office && `o:${office}`) ||
        (nameKey && `n:${nameKey}`) ||
        (email && `e:${email}`) ||
        (phone && `p:${phone}`);
      if (dupKey) {
        if (seenInBatch.has(dupKey)) {
          skipped++;
          continue;
        }
        seenInBatch.add(dupKey);
      }

      const match =
        (office && byOffice.get(office)) ||
        (nameKey && byName.get(nameKey)) ||
        (email && byEmail.get(email)) ||
        (phone && byPhone.get(phone));

      if (match) {
        // Backfill only — never overwrite curated fields
        const patch: any = {};
        if (office && !match.dld_office_number) patch.dld_office_number = office;
        if (nameAr) patch.name_arabic = nameAr;
        if (Object.keys(patch).length) updates.push({ id: match.id, patch });
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
        return new Response(
          JSON.stringify({ error: error.message, inserted, at: i }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
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
      JSON.stringify({ ok: true, inserted, updated, skipped, received: rows.length }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e?.message || e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
