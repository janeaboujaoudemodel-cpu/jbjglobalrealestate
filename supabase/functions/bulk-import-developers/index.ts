// Bulk developer import — Excel-wins with Amra/Citi exceptions.
// Owner/admin only. Uses service role to bypass field-protection triggers where safe.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;

type InRow = Record<string, any>;

const IMPORTABLE_FIELDS = [
  "website_url","ceo_name","founded_year","description","office_phone",
  "whatsapp","admin_email","instagram_url","linkedin_url","notable_projects",
  "specialization","parent_company","logo_url","google_drive_url",
] as const;

const norm = (s: string) => String(s ?? "").trim().toLowerCase().replace(/[_\-]+/g, " ").replace(/\s+/g, " ");
const slugify = (s: string) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
const isAmra = (n: string) => norm(n).includes("amra");
const isCiti = (n: string) => /\bciti\b/.test(norm(n));

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    // Verify caller is an admin/owner
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader) return json({ error: "unauthorized" }, 401);
    const userClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData } = await userClient.auth.getUser();
    const uid = userData.user?.id;
    if (!uid) return json({ error: "unauthorized" }, 401);
    const { data: roleRows } = await userClient.from("user_roles").select("role").eq("user_id", uid);
    const roles = new Set((roleRows ?? []).map((r: any) => r.role));
    if (!roles.has("owner") && !roles.has("admin")) {
      return json({ error: "forbidden" }, 403);
    }

    const body = await req.json().catch(() => ({}));
    const rows: InRow[] = Array.isArray(body?.rows) ? body.rows : [];
    const autoEnrichDrive = body?.auto_enrich_drive !== false;
    if (!rows.length) return json({ created: 0, updated: 0, filled_citi: 0, protected_amra: 0, skipped: 0, total_unique: 0, drive_jobs: 0 });

    // Service-role client for writes
    const svc = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Dedupe across the entire uploaded database. Last non-empty Excel value wins
    // for repeated rows of the same developer, while custom fields are merged.
    const bySlug = new Map<string, InRow>();
    let protectedAmra = 0;
    for (const r of rows) {
      const name = String(r.name ?? "").trim();
      if (!name) continue;
      if (isAmra(name)) { protectedAmra++; continue; }
      const key = slugify(name) || name.toLowerCase();
      const previous = bySlug.get(key) ?? {};
      const merged: InRow = { ...previous, name };
      for (const [k, vRaw] of Object.entries(r)) {
        const v = typeof vRaw === "string" ? vRaw.trim() : vRaw;
        if (k === "custom_fields" && typeof vRaw === "object" && vRaw) {
          (merged as any).custom_fields = { ...((merged as any).custom_fields ?? {}), ...(vRaw as any) };
        } else if (v !== "" && v !== null && v !== undefined) {
          (merged as any)[k] = v as any;
        }
      }
      bySlug.set(key, merged);
    }

    const uniqueRows = Array.from(bySlug.entries()); // [slug, row]
    const slugs = uniqueRows.map(([s]) => s);
    const names = uniqueRows.map(([, r]) => r.name);
    if (!uniqueRows.length) {
      return json({ created: 0, updated: 0, filled_citi: 0, protected_amra: protectedAmra, skipped: 0, total_unique: 0, drive_jobs: 0 });
    }

    const existing = await loadExistingDevelopers(svc, slugs, names);

    const bySlugExist = new Map<string, any>();
    const byNameExist = new Map<string, any>();
    (existing ?? []).forEach((d: any) => {
      if (d.slug) bySlugExist.set(String(d.slug).toLowerCase(), d);
      if (d.name) byNameExist.set(norm(String(d.name)), d);
    });

    let created = 0, updated = 0, filled_citi = 0, skipped = 0, driveJobs = 0;

    for (const [slug, r] of uniqueRows) {
      const existRow = bySlugExist.get(slug) || byNameExist.get(norm(String(r.name)));
      const excelValues: Record<string, any> = {};
      for (const f of IMPORTABLE_FIELDS) {
        const v = String((r as any)[f] ?? "").trim();
        if (!v) continue;
        if (f === "founded_year") {
          const n = parseInt(v.replace(/\D/g, ""), 10);
          if (Number.isFinite(n) && n > 1800 && n < 2200) excelValues[f] = n;
        } else {
          excelValues[f] = v;
        }
      }
      const customFields = normalizeCustomFields((r as any).custom_fields);

      if (existRow) {
        const citi = isCiti(r.name) || isCiti(existRow.name ?? "");
        const patch: Record<string, any> = {};
        for (const [k, v] of Object.entries(excelValues)) {
          if (citi) {
            // fill-blanks-only
            const cur = (existRow as any)[k];
            if (cur === null || cur === undefined || cur === "" ) patch[k] = v;
          } else {
            // Excel wins on non-empty cells
            if ((existRow as any)[k] !== v) patch[k] = v;
          }
        }
        if (Object.keys(customFields).length) {
          const existingCustom = normalizeCustomFields(existRow.custom_fields);
          const mergedCustom = citi ? fillBlankCustomFields(existingCustom, customFields) : { ...existingCustom, ...customFields };
          if (JSON.stringify(existingCustom) !== JSON.stringify(mergedCustom)) patch.custom_fields = mergedCustom;
        }
        if (Object.keys(patch).length === 0) { skipped++; continue; }
        const { error } = await svc.from("developers").update({ ...patch, updated_at: new Date().toISOString() }).eq("id", existRow.id);
        if (error) { skipped++; continue; }
        if (citi) filled_citi++; else updated++;
        if (autoEnrichDrive && (patch.google_drive_url || excelValues.google_drive_url)) {
          driveJobs += await queueDriveJob(svc, existRow.id, String((patch.google_drive_url ?? excelValues.google_drive_url) || ""));
        }
      } else {
        const { data: inserted, error } = await svc.from("developers").insert({
          name: r.name,
          slug,
          is_hidden: true,
          ...excelValues,
          ...(Object.keys(customFields).length ? { custom_fields: customFields } : {}),
        } as any).select("id").single();
        if (error) { skipped++; continue; }
        created++;
        if (autoEnrichDrive && excelValues.google_drive_url && inserted?.id) {
          driveJobs += await queueDriveJob(svc, inserted.id, String(excelValues.google_drive_url));
        }
      }
    }

    return json({ created, updated, filled_citi, protected_amra: protectedAmra, skipped, total_unique: uniqueRows.length, drive_jobs: driveJobs });
  } catch (e) {
    console.error("bulk-import-developers", e);
    return json({ error: String((e as Error).message ?? e) }, 500);
  }
});

function quote(v: string) {
  return `"${String(v).replace(/"/g, '\\"')}"`;
}
function normalizeCustomFields(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    const key = String(k ?? "").trim();
    const val = String(v ?? "").trim();
    if (key && val) out[key] = val;
  }
  return out;
}
function fillBlankCustomFields(existing: Record<string, string>, incoming: Record<string, string>) {
  const out = { ...existing };
  for (const [k, v] of Object.entries(incoming)) if (!String(out[k] ?? "").trim()) out[k] = v;
  return out;
}
async function queueDriveJob(svc: any, developerId: string, folderUrl: string) {
  if (!folderUrl || !/drive\.google\.com|docs\.google\.com/i.test(folderUrl)) return 0;
  const { data: latest } = await svc
    .from("developer_drive_jobs")
    .select("id,status")
    .eq("developer_id", developerId)
    .eq("folder_url", folderUrl)
    .in("status", ["queued", "running"])
    .limit(1)
    .maybeSingle();
  if (latest?.id) return 0;
  const { data: job, error } = await svc.from("developer_drive_jobs").insert({
    developer_id: developerId,
    folder_url: folderUrl,
    status: "queued",
  }).select("id").single();
  if (error) return 0;
  await svc.from("developers").update({ drive_enrichment_status: "queued" }).eq("id", developerId);
  return 1;
}
async function loadExistingDevelopers(svc: any, slugs: string[], names: string[]) {
  const select = ["id","slug","name","custom_fields", ...IMPORTABLE_FIELDS].join(",");
  const byId = new Map<string, any>();
  for (let i = 0; i < slugs.length; i += 100) {
    const chunk = slugs.slice(i, i + 100);
    if (!chunk.length) continue;
    const { data, error } = await svc.from("developers").select(select).in("slug", chunk);
    if (error) throw new Error(error.message);
    (data ?? []).forEach((row: any) => byId.set(row.id, row));
  }
  for (let i = 0; i < names.length; i += 80) {
    const chunk = names.slice(i, i + 80).filter(Boolean);
    if (!chunk.length) continue;
    const { data, error } = await svc.from("developers").select(select).in("name", chunk);
    if (error) throw new Error(error.message);
    (data ?? []).forEach((row: any) => byId.set(row.id, row));
  }
  return Array.from(byId.values());
}
function json(o: unknown, status = 200) {
  return new Response(JSON.stringify(o), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
