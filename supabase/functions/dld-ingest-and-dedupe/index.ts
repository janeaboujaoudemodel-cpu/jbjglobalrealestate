// supabase/functions/dld-ingest-and-dedupe/index.ts
// -------------------------------------------------------------
// Reads pending staging rows for a given run_id and:
//   • Exact match (name + email + phone all normalized) → mark skipped_exact
//   • Partial match (name+email or name+phone, other differs) → insert a
//     row into dld_scrape_conflicts, mark flagged_conflict
//   • No match → insert into the live table (crm_brokers /
//     crm_brokerages / crm_developer_registry), mark inserted
//
// **Never** updates a live row. Existing DB data is preserved verbatim.
// -------------------------------------------------------------
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

function normEmail(v?: string | null) {
  if (!v) return null;
  const s = String(v).trim().toLowerCase();
  return s.includes("@") ? s : null;
}
function normPhone(v?: string | null) {
  if (!v) return null;
  let s = String(v).trim();
  const plus = s.startsWith("+");
  s = s.replace(/[^\d]/g, "");
  if (!s) return null;
  if (plus) return "+" + s;
  if (s.startsWith("00")) return "+" + s.slice(2);
  if (s.startsWith("0") && s.length >= 9) return "+971" + s.slice(1);
  return "+" + s;
}
function normName(v?: string | null) {
  if (!v) return "";
  return String(v)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function categoryToKey(raw?: string | null): string | null {
  if (!raw) return null;
  const s = raw.toLowerCase();
  if (s.includes("sale")) return "sale";
  if (s.includes("lease") || s.includes("rent")) return "lease";
  if (s.includes("mortgage")) return "mortgage";
  if (s.includes("office")) return "offices";
  if (s.includes("national")) return "nationals";
  if (s.includes("group a")) return "group_a";
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const body = await req.json().catch(() => ({}));
    const run_id = body?.run_id as string | undefined;

    if (!run_id) {
      return new Response(JSON.stringify({ error: "run_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const summary: Record<string, any> = {};

    // ── DEVELOPERS ────────────────────────────────────────────
    {
      const { data: pending } = await admin
        .from("dld_scrape_staging_developers")
        .select("*")
        .eq("run_id", run_id)
        .eq("ingest_status", "pending");

      let inserted = 0, skipped = 0, flagged = 0;
      for (const s of pending ?? []) {
        const email = normEmail(s.email);
        const phone = normPhone(s.phone);
        const name = normName(s.name_en);
        if (!name) { skipped++; continue; }

        const { data: candidates } = await admin
          .from("crm_developer_registry")
          .select("id,name,email,phone_number")
          .ilike("name", `%${(s.name_en || "").slice(0, 40)}%`)
          .limit(10);

        let exact = false, conflictRow: any = null;
        for (const c of candidates ?? []) {
          const cname = normName(c.name);
          const cemail = normEmail(c.email);
          const cphone = normPhone(c.phone_number);
          if (cname !== name) continue;
          if (cemail && email && cemail === email && cphone && phone && cphone === phone) {
            exact = true; break;
          }
          if ((cemail && email && cemail === email && cphone && phone && cphone !== phone) ||
              (cphone && phone && cphone === phone && cemail && email && cemail !== email)) {
            conflictRow = c; break;
          }
        }
        if (exact) {
          skipped++;
          await admin.from("dld_scrape_staging_developers").update({ ingest_status: "skipped_exact", ingested_at: new Date().toISOString() }).eq("id", s.id);
          continue;
        }
        if (conflictRow) {
          flagged++;
          await admin.from("dld_scrape_conflicts").insert({
            segment: "developer",
            live_table: "crm_developer_registry",
            live_row_id: conflictRow.id,
            staging_table: "dld_scrape_staging_developers",
            staging_row_id: s.id,
            match_type: "name_match_contact_differs",
            live_snapshot: conflictRow,
            dld_snapshot: s,
          });
          await admin.from("dld_scrape_staging_developers").update({ ingest_status: "flagged_conflict", ingested_at: new Date().toISOString() }).eq("id", s.id);
          continue;
        }
        // Insert new
        const { error: insErr } = await admin.from("crm_developer_registry").insert({
          name: s.name_en,
          name_ar: s.name_ar,
          license_number: s.license_no,
          phone_number: s.phone,
          email: s.email,
          status: s.status,
          dld_source: "dld_daily",
          first_seen_at: new Date().toISOString(),
        } as any);
        if (insErr) {
          await admin.from("dld_scrape_staging_developers").update({ ingest_status: "error", ingest_note: insErr.message, ingested_at: new Date().toISOString() }).eq("id", s.id);
          continue;
        }
        inserted++;
        await admin.from("dld_scrape_staging_developers").update({ ingest_status: "inserted", ingested_at: new Date().toISOString() }).eq("id", s.id);
      }
      summary.developer = { inserted, skipped, flagged, total: (pending ?? []).length };
    }

    // ── BROKERAGES ─────────────────────────────────────────────
    {
      const { data: pending } = await admin
        .from("dld_scrape_staging_brokerages")
        .select("*")
        .eq("run_id", run_id)
        .eq("ingest_status", "pending");

      let inserted = 0, skipped = 0, flagged = 0;
      for (const s of pending ?? []) {
        const email = normEmail(s.email);
        const phone = normPhone(s.phone);
        const name = normName(s.name_en);
        if (!name) { skipped++; continue; }

        const { data: candidates } = await admin
          .from("crm_brokerages")
          .select("id,company_name,email,phone_number")
          .ilike("company_name", `%${(s.name_en || "").slice(0, 40)}%`)
          .limit(10);

        let exact = false, conflictRow: any = null;
        for (const c of candidates ?? []) {
          const cname = normName(c.company_name);
          const cemail = normEmail(c.email);
          const cphone = normPhone(c.phone_number);
          if (cname !== name) continue;
          if (cemail && email && cemail === email && cphone && phone && cphone === phone) {
            exact = true; break;
          }
          if ((cemail && email && cemail === email && cphone && phone && cphone !== phone) ||
              (cphone && phone && cphone === phone && cemail && email && cemail !== email)) {
            conflictRow = c; break;
          }
        }
        if (exact) {
          skipped++;
          await admin.from("dld_scrape_staging_brokerages").update({ ingest_status: "skipped_exact", ingested_at: new Date().toISOString() }).eq("id", s.id);
          continue;
        }
        if (conflictRow) {
          flagged++;
          await admin.from("dld_scrape_conflicts").insert({
            segment: "brokerage",
            live_table: "crm_brokerages",
            live_row_id: conflictRow.id,
            staging_table: "dld_scrape_staging_brokerages",
            staging_row_id: s.id,
            match_type: "name_match_contact_differs",
            live_snapshot: conflictRow,
            dld_snapshot: s,
          });
          await admin.from("dld_scrape_staging_brokerages").update({ ingest_status: "flagged_conflict", ingested_at: new Date().toISOString() }).eq("id", s.id);
          continue;
        }
        const { error: insErr } = await admin.from("crm_brokerages").insert({
          company_name: s.name_en,
          name_ar: s.name_ar,
          manager: s.manager,
          phone_number: s.phone,
          email: s.email,
          dld_office_no: s.office_no,
          dld_area: s.area,
          dld_source: "dld_daily",
          first_seen_at: new Date().toISOString(),
        } as any);
        if (insErr) {
          await admin.from("dld_scrape_staging_brokerages").update({ ingest_status: "error", ingest_note: insErr.message, ingested_at: new Date().toISOString() }).eq("id", s.id);
          continue;
        }
        inserted++;
        await admin.from("dld_scrape_staging_brokerages").update({ ingest_status: "inserted", ingested_at: new Date().toISOString() }).eq("id", s.id);
      }
      summary.brokerage = { inserted, skipped, flagged, total: (pending ?? []).length };
    }

    // ── BROKERS ────────────────────────────────────────────────
    {
      const { data: pending } = await admin
        .from("dld_scrape_staging_brokers")
        .select("*")
        .eq("run_id", run_id)
        .eq("ingest_status", "pending");

      let inserted = 0, skipped = 0, flagged = 0;
      for (const s of pending ?? []) {
        const email = normEmail(s.email);
        const phone = normPhone(s.mobile);
        const name = normName(s.name_en);
        if (!name) { skipped++; continue; }

        const { data: candidates } = await admin
          .from("crm_brokers")
          .select("id,full_name,email_lower,phone_e164")
          .ilike("full_name", `%${(s.name_en || "").slice(0, 40)}%`)
          .limit(10);

        let exact = false, conflictRow: any = null;
        for (const c of candidates ?? []) {
          const cname = normName(c.full_name);
          const cemail = normEmail(c.email_lower);
          const cphone = normPhone(c.phone_e164);
          if (cname !== name) continue;
          if (cemail && email && cemail === email && cphone && phone && cphone === phone) {
            exact = true; break;
          }
          if ((cemail && email && cemail === email && cphone && phone && cphone !== phone) ||
              (cphone && phone && cphone === phone && cemail && email && cemail !== email)) {
            conflictRow = c; break;
          }
        }
        if (exact) {
          skipped++;
          await admin.from("dld_scrape_staging_brokers").update({ ingest_status: "skipped_exact", ingested_at: new Date().toISOString() }).eq("id", s.id);
          continue;
        }
        if (conflictRow) {
          flagged++;
          await admin.from("dld_scrape_conflicts").insert({
            segment: "broker",
            live_table: "crm_brokers",
            live_row_id: conflictRow.id,
            staging_table: "dld_scrape_staging_brokers",
            staging_row_id: s.id,
            match_type: "name_match_contact_differs",
            live_snapshot: conflictRow,
            dld_snapshot: s,
          });
          await admin.from("dld_scrape_staging_brokers").update({ ingest_status: "flagged_conflict", ingested_at: new Date().toISOString() }).eq("id", s.id);
          continue;
        }
        const catKey = categoryToKey(s.license_category);
        const { error: insErr } = await admin.from("crm_brokers").insert({
          full_name: s.name_en,
          name_ar: s.name_ar,
          current_company: s.office_name,
          phone_e164: phone,
          email_lower: email,
          dld_broker_no: s.broker_no,
          dld_license_category: catKey,
          dld_area: s.area,
          dld_source: "dld_daily",
          first_seen_at: new Date().toISOString(),
          broker_segment: "unclassified",
        } as any);
        if (insErr) {
          await admin.from("dld_scrape_staging_brokers").update({ ingest_status: "error", ingest_note: insErr.message, ingested_at: new Date().toISOString() }).eq("id", s.id);
          continue;
        }
        inserted++;
        await admin.from("dld_scrape_staging_brokers").update({ ingest_status: "inserted", ingested_at: new Date().toISOString() }).eq("id", s.id);
      }
      summary.broker = { inserted, skipped, flagged, total: (pending ?? []).length };
    }

    return new Response(JSON.stringify({ ok: true, run_id, summary }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ ok: false, error: String(err instanceof Error ? err.message : err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
