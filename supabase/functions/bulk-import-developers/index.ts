// Bulk developer import — Excel-wins with Amra/Citi exceptions.
// Owner/admin only. Uses service role to bypass field-protection triggers where safe.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;

type InRow = Record<string, string>;

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
    if (!roles.has("admin") && !roles.has("listing_admin") && !roles.has("portal_developer")) {
      return json({ error: "forbidden" }, 403);
    }

    const body = await req.json().catch(() => ({}));
    const rows: InRow[] = Array.isArray(body?.rows) ? body.rows : [];
    if (!rows.length) return json({ created: 0, updated: 0, filled_citi: 0, protected_amra: 0, skipped: 0 });

    // Service-role client for writes
    const svc = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Dedupe within this chunk
    const bySlug = new Map<string, InRow>();
    let protectedAmra = 0;
    for (const r of rows) {
      const name = String(r.name ?? "").trim();
      if (!name) continue;
      if (isAmra(name)) { protectedAmra++; continue; }
      const key = slugify(name) || name.toLowerCase();
      if (!bySlug.has(key)) bySlug.set(key, { ...r, name });
    }

    const uniqueRows = Array.from(bySlug.entries()); // [slug, row]
    const slugs = uniqueRows.map(([s]) => s);
    const names = uniqueRows.map(([, r]) => r.name);

    // One batch lookup instead of per-row
    const { data: existing, error: exErr } = await svc
      .from("developers")
      .select(["id","slug","name", ...IMPORTABLE_FIELDS].join(","))
      .or(`slug.in.(${slugs.map(quote).join(",")}),name.in.(${names.map(quote).join(",")})`);
    if (exErr) return json({ error: exErr.message }, 500);

    const bySlugExist = new Map<string, any>();
    const byNameExist = new Map<string, any>();
    (existing ?? []).forEach((d: any) => {
      if (d.slug) bySlugExist.set(String(d.slug).toLowerCase(), d);
      if (d.name) byNameExist.set(String(d.name).toLowerCase(), d);
    });

    let created = 0, updated = 0, filled_citi = 0, skipped = 0;

    for (const [slug, r] of uniqueRows) {
      const existRow = bySlugExist.get(slug) || byNameExist.get(String(r.name).toLowerCase());
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
        if (Object.keys(patch).length === 0) { skipped++; continue; }
        const { error } = await svc.from("developers").update(patch).eq("id", existRow.id);
        if (error) { skipped++; continue; }
        if (citi) filled_citi++; else updated++;
      } else {
        const { error } = await svc.from("developers").insert({
          name: r.name,
          slug,
          is_hidden: true,
          ...excelValues,
        } as any);
        if (error) { skipped++; continue; }
        created++;
      }
    }

    return json({ created, updated, filled_citi, protected_amra: protectedAmra, skipped });
  } catch (e) {
    console.error("bulk-import-developers", e);
    return json({ error: String((e as Error).message ?? e) }, 500);
  }
});

function quote(v: string) {
  return `"${String(v).replace(/"/g, '\\"')}"`;
}
function json(o: unknown, status = 200) {
  return new Response(JSON.stringify(o), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
