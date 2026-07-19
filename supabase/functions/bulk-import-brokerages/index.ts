import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { requireOwnerAuth } from "../_shared/owner-auth-middleware.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

type InRow = Record<string, unknown>;

const norm = (s: unknown) => String(s ?? "").trim();
const cleanKey = (s: unknown) => norm(s).toLowerCase().replace(/\b(real estate|brokerage|brokers|properties|property|llc|l\.l\.c|fz llc|group)\b/g, "").replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
const phone = (s: unknown) => norm(s).replace(/[^\d+]/g, "").slice(0, 24);
const email = (s: unknown) => {
  const v = norm(s).toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? v : "";
};
const website = (s: unknown) => {
  const v = norm(s);
  if (!v) return "";
  if (/^https?:\/\//i.test(v)) return v;
  return v.includes(".") && !v.includes(" ") ? `https://${v}` : "";
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const auth = await requireOwnerAuth(req, corsHeaders);
    if (auth.response) return auth.response;

    const body = await req.json().catch(() => ({}));
    const rows: InRow[] = Array.isArray(body.rows) ? body.rows : [];
    if (!rows.length) return json({ created: 0, updated: 0, skipped: 0, total_unique: 0, list_id: null, changed: [] });

    const mergeToMain = body.merge_to_main === true;
    const assignToMe = body.assign_to_me === true;
    const rawSpec = String(body.specialty_focus || "");
    const specMap: Record<string, string> = { secondary: "secondary_first", off_plan: "offplan_first", both: "equal", secondary_first: "secondary_first", offplan_first: "offplan_first", equal: "equal" };
    const specialtyFocus = specMap[rawSpec] || "equal";
    const sourceFilename = norm(body.source_filename) || "brokerage-upload.xlsx";
    const sourceLabel = norm(body.source_label) || sourceFilename.replace(/\.(xlsx|xls|csv)$/i, "");
    const listName = norm(body.list_name) || sourceFilename.replace(/\.(xlsx|xls|csv)$/i, "") || `Brokerage database ${new Date().toISOString().slice(0, 10)}`;
    const svc = createClient(SUPABASE_URL, SERVICE_ROLE);

    const { data: list, error: listErr } = await svc.from("crm_lead_lists").insert({
      owner_user_id: auth.userId,
      kind: "brokerages",
      name: await uniqueListName(svc, auth.userId, listName),
      source_filename: sourceFilename,
      description: `${mergeToMain ? "Merged into full portal · " : "Separate list only · "}source: ${sourceLabel} · specialty: ${specialtyFocus}${assignToMe ? " · assigned to uploader" : ""}`,
    }).select("id,name").single();
    if (listErr) throw listErr;

    const byKey = new Map<string, InRow>();
    for (const r of rows) {
      const name = norm((r as any).company_name || (r as any).name || (r as any).agency || (r as any).brokerage_name);
      if (!name) continue;
      const key = cleanKey(name) || email((r as any).email) || phone((r as any).phone);
      if (!key) continue;
      byKey.set(key, { ...(byKey.get(key) ?? {}), ...r, company_name: name });
    }

    const incoming = Array.from(byKey.values());
    const existing = await loadExisting(svc, auth.userId);
    const byName = new Map<string, any>();
    const byEmail = new Map<string, any>();
    const byPhone = new Map<string, any>();
    const byDld = new Map<string, any>();
    for (const b of existing) {
      if (b.company_name) byName.set(cleanKey(b.company_name), b);
      if (b.email) byEmail.set(email(b.email), b);
      if (b.phone) byPhone.set(phone(b.phone), b);
      if (b.dld_office_number) byDld.set(norm(b.dld_office_number), b);
    }

    let created = 0, updated = 0, skipped = 0;
    const changed: Array<{ name: string; action: string; fields: string[] }> = [];
    for (const raw of incoming) {
      const row = normalizeBrokerage(raw);
      const match = (row.dld_office_number && byDld.get(row.dld_office_number)) || (row.email && byEmail.get(row.email)) || (row.phone && byPhone.get(row.phone)) || byName.get(cleanKey(row.company_name));
      let brokerageId = match?.id as string | undefined;
      if (match) {
        const patch: Record<string, unknown> = {};
        for (const [k, v] of Object.entries(row)) {
          if (["company_name", "raw"].includes(k) || v === null || v === "" || v === undefined) continue;
          if (!norm(match[k])) patch[k] = v;
        }
        if (!norm(match.registration_status)) patch.registration_status = "not_registered";
        if (!norm(match.group_status)) patch.group_status = "pending_group_status";
        if (!norm(match.specialty_focus)) patch.specialty_focus = specialtyFocus;
        if (assignToMe && !match.assigned_to) patch.assigned_to = auth.userId;
        if (sourceLabel && !norm(match.source)) patch.source = sourceLabel;
        patch.source_history = appendSourceHistory(match.source_history, sourceFilename, raw, mergeToMain);
        if (Object.keys(patch).length) {
          const { error } = await svc.from("crm_brokerages").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", match.id);
          if (error) { skipped++; continue; }
          updated++;
          changed.push({ name: row.company_name, action: "matched", fields: Object.keys(patch).filter((f) => f !== "source_history").slice(0, 8) });
        }
      } else {
        const { data: inserted, error } = await svc.from("crm_brokerages").insert({
          owner_id: auth.userId,
          company_name: row.company_name,
          website: row.website || null,
          phone: row.phone || null,
          email: row.email || null,
          emirate: row.emirate || null,
          country: row.country || "United Arab Emirates",
          office_location: row.office_location || null,
          office_address: row.office_address || null,
          google_maps_link: row.google_maps_link || null,
          admin_name: row.admin_name || null,
          admin_phone: row.admin_phone || null,
          dld_office_number: row.dld_office_number || null,
          registration_status: "not_registered",
          group_status: "pending_group_status",
          specialty_focus: specialtyFocus as any,
          assigned_to: assignToMe ? auth.userId : null,
          list_id: mergeToMain ? null : list.id,
          attended_briefing: false,
          briefing_count: 0,
          entry_source: "import",
          source: sourceLabel || "import",
          source_detail: sourceLabel,
          original_filename: sourceFilename,
          database_source: list.name,
          upload_source: sourceFilename,
          imported_by: auth.userId,
          imported_at: new Date().toISOString(),
          import_batch_id: list.id,
          import_label: list.name,
          source_history: appendSourceHistory([], sourceFilename, raw, mergeToMain),
        }).select("id").single();
        if (error) { skipped++; continue; }
        brokerageId = inserted?.id;
        created++;
        changed.push({ name: row.company_name, action: mergeToMain ? "created + merged" : "created list-only", fields: ["registration_status", "group_status", "contacts", "database"] });
      }
      if (brokerageId) {
        await svc.from("crm_brokerage_list_members").upsert({
          list_id: list.id,
          brokerage_id: brokerageId,
          owner_user_id: auth.userId,
          source_filename: sourceFilename,
          merge_to_main: mergeToMain,
        }, { onConflict: "list_id,brokerage_id" });
      }
    }

    return json({ created, updated, skipped, total_unique: incoming.length, list_id: list.id, list_name: list.name, merge_to_main: mergeToMain, changed: changed.slice(0, 100) });
  } catch (e) {
    console.error("bulk-import-brokerages", e);
    return json({ error: String((e as Error)?.message ?? e) }, 500);
  }
});

function normalizeBrokerage(raw: InRow) {
  const r: any = raw;
  return {
    company_name: norm(r.company_name || r.name || r.agency || r.brokerage_name),
    website: website(r.website || r.website_url || r.web),
    phone: phone(r.phone || r.mobile || r.telephone || r.contact_number),
    email: email(r.email || r.contact_email || r.admin_email),
    emirate: norm(r.emirate || r.city || r.location),
    country: norm(r.country) || "United Arab Emirates",
    office_location: norm(r.office_location || r.office || r.address || r.office_address),
    office_address: norm(r.office_address || r.address),
    google_maps_link: norm(r.google_maps_link || r.google_maps_url || r.map_url),
    admin_name: norm(r.admin_name || r.contact_name || r.manager || r.primary_contact_name),
    admin_phone: phone(r.admin_phone || r.contact_phone || r.manager_phone),
    dld_office_number: norm(r.dld_office_number || r.office_number || r.rera_license),
  };
}

async function loadExisting(svc: any, ownerId: string) {
  const out: any[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await svc.from("crm_brokerages").select("id,company_name,email,phone,website,emirate,country,office_location,office_address,google_maps_link,admin_name,admin_phone,dld_office_number,registration_status,group_status,source_history").eq("owner_id", ownerId).range(from, from + 999);
    if (error) throw error;
    out.push(...(data ?? []));
    if ((data ?? []).length < 1000) break;
  }
  return out;
}

async function uniqueListName(svc: any, ownerId: string, base: string) {
  const { data } = await svc.from("crm_lead_lists").select("name").eq("owner_user_id", ownerId).eq("kind", "brokerages").ilike("name", `${base}%`);
  const used = new Set((data ?? []).map((r: any) => String(r.name)));
  if (!used.has(base)) return base;
  return `${base} · ${new Date().toISOString().replace(/[:T]/g, "-").slice(0, 16)}`;
}

function appendSourceHistory(current: unknown, filename: string, raw: InRow, mergeToMain: boolean) {
  const arr = Array.isArray(current) ? current.slice(-9) : [];
  arr.push({ filename, merge_to_main: mergeToMain, imported_at: new Date().toISOString(), raw });
  return arr;
}

function json(o: unknown, status = 200) {
  return new Response(JSON.stringify(o), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}