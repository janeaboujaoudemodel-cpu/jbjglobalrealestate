// Enriches public.developers from the woven.ae public developer directory.
// Fills only gaps (never overwrites existing owner content) and stores project
// galleries in developer_media. Woven's own phone/email/website are never copied.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

const STOP = new Set([
  "development", "developments", "developer", "developers", "properties", "property",
  "real", "estate", "group", "llc", "holding", "holdings", "fzco", "fze", "dubai",
  "uae", "the", "and", "co", "ltd", "limited", "company", "investment", "investments",
  "international", "projects", "realty", "llp", "pjsc", "psc", "sa",
]);

const ALIAS: Record<string, string> = {
  "4-direction-developers": "4Direction Developments",
  "townx-real-estate": "Town X",
  "siroya-ventures-realty-llc": "Siroya Ventures Star Real Estate Developers L.L.C",
  "keymavens-development": "Key Mavens For Real Estate Development L.L.C",
  "khamas-group-of-investment-cos": "Khamas Group",
  "acube-developments": "Acube RE Development",
  "pure-gold": "Pure Gold Living",
  "prescott": "Prescott / Golden Bridge",
  "reef-luxury-development": "Reef Development",
  "marquis-point": "Marquis Development",
  "elysian-properties": "Elysian Develoments",
  "city-view-developments": "City View Prime Real Estate Development L.L.C",
  "crystal-bay-development": "Crystal Bay Atira Development L.L.C",
  "aum-develovers": "AUM Development",
  "vantage-ventures": "Vantage Developments",
  "wadan-devolopment": "Wadan Development",
  "gfs-builders-developers": "GFS Developments",
  "hayaat-developments": "Hayaat Ikhlaq Developments L.L.C",
  "hmb": "HMB Homes",
  "jhk-developments": "Jhk Heights Real Estate Development L.L.C",
  "mill-hill-developer": "Mill Hill Riviera Development L.L.C",
  "m4": "M Four Development",
  "skyland-properties": "Skyland Horizons Real Estate Development L.L.C",
  "revolution": "R.Evolution",
};

function norm(input: string): string {
  let s = input.toLowerCase().replace(/&/g, " and ");
  s = s.replace(/\bl\s*\.?\s*l\s*\.?\s*c\b/g, " ");
  s = s.replace(/[^a-z0-9]+/g, " ");
  const toks = s.split(" ").filter((t) => t.length > 1 && !STOP.has(t));
  return toks.join("") || s.replace(/[^a-z0-9]+/g, "");
}

type Gallery = { url: string; caption: string };

function parsePage(slug: string, raw: string) {
  const t = raw.replace(/\\"/g, '"').replace(/\\n/g, "\n");
  let i = t.indexOf(`"slug":"${slug}","description":{"en":"`);
  if (i < 0) i = t.indexOf(`"slug":"${slug}","logo":{"url"`);
  let dev: any = null;
  if (i > 0) {
    const s = t.lastIndexOf('{"_id"', i);
    let d = 0, end = -1;
    for (let j = s; j < t.length; j++) {
      if (t[j] === "{") d++;
      else if (t[j] === "}") {
        d--;
        if (d === 0) { end = j; break; }
      }
    }
    if (end > 0) { try { dev = JSON.parse(t.slice(s, end + 1)); } catch { dev = null; } }
  }
  const gallery: Gallery[] = [];
  const seen = new Set<string>();
  for (const m of raw.matchAll(/<img[^>]+>/g)) {
    const tag = m[0];
    const src = tag.match(/src="([^"]+)"/)?.[1];
    if (!src) continue;
    let u = src.replace(/&amp;/g, "&");
    const inner = u.match(/url=([^&]+)/)?.[1];
    if (inner) u = decodeURIComponent(inner);
    if (!u.includes("cdn.woven.ae") && !u.includes("woven-marketplace-bucket")) continue;
    if (seen.has(u)) continue;
    seen.add(u);
    const alt = (tag.match(/alt="([^"]*)"/)?.[1] ?? "").replace(/&amp;/g, "&");
    gallery.push({ url: u, caption: alt });
  }
  return { dev, gallery };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const offset = Number(body.offset ?? 0);
    const limit = Number(body.limit ?? 40);
    const dryRun = Boolean(body.dryRun ?? false);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const sitemap = await (await fetch("https://www.woven.ae/sitemap.xml")).text();
    const slugs = [...new Set(
      [...sitemap.matchAll(/<loc>https?:\/\/(?:www\.)?woven\.ae\/en\/developers\/([^<]+)<\/loc>/g)]
        .map((m) => m[1]).filter((s) => s !== "woven"),
    )].sort();

    const { data: devs, error: devErr } = await supabase
      .from("developers")
      .select("id,name,description,founded_year,headquarters,office_address,completed_projects,offplan_projects,total_units_delivered,feature_image_url,logo_url,logo_url_processed,logo_locked");
    if (devErr) throw devErr;

    const byKey = new Map<string, any>();
    for (const d of devs ?? []) {
      const k = norm(d.name ?? "");
      if (k && !byKey.has(k)) byKey.set(k, d);
    }

    const slice = slugs.slice(offset, offset + limit);
    const report: any = { total: slugs.length, offset, processed: slice.length, updated: [], unmatched: [], failed: [], mediaInserted: 0 };

    for (const slug of slice) {
      let html = "";
      try {
        html = await (await fetch(`https://www.woven.ae/en/developers/${slug}`, {
          headers: { "User-Agent": "Mozilla/5.0" },
        })).text();
      } catch (_e) { report.failed.push(slug); continue; }
      const { dev, gallery } = parsePage(slug, html);
      if (!dev) { report.failed.push(slug); continue; }

      const aliasName = ALIAS[slug];
      let target = aliasName
        ? (devs ?? []).find((d: any) => d.name === aliasName)
        : undefined;
      if (!target) {
        const k = norm(dev.name ?? slug.replace(/-/g, " "));
        target = byKey.get(k) ??
          byKey.get(k + "developments") ?? byKey.get(k + "developers") ??
          byKey.get(k.replace("developments", ""));
      }
      if (!target) { report.unmatched.push({ slug, name: dev.name }); continue; }

      const st = dev.statistics ?? dev.portfolio ?? {};
      const hq = (dev.headquarters ?? [])[0] ?? {};
      const hqText = [hq.city, hq.country].filter(Boolean).join(", ");
      const descr = String(dev.description?.en ?? "").replace(/\s+/g, " ").trim();
      let cover = gallery.find((g) => g.caption.toLowerCase().includes("cover"))?.url ??
        gallery[0]?.url ?? "";
      const wovenLogo = String(dev.logo?.url ?? "");
      const realLogo = wovenLogo.includes("cdn.woven.ae") ? wovenLogo : "";

      const patch: Record<string, unknown> = {
        enrichment_source: "woven.ae",
        last_enriched_at: new Date().toISOString(),
      };
      if (!target.founded_year && dev.established_year) patch.founded_year = dev.established_year;
      if (!target.headquarters && hqText) patch.headquarters = hqText;
      if (!target.office_address && hq.address) patch.office_address = hq.address;
      if (target.completed_projects == null && st.completed_projects != null) patch.completed_projects = st.completed_projects;
      if (target.offplan_projects == null && st.ongoing_projects != null) patch.offplan_projects = st.ongoing_projects;
      if (target.total_units_delivered == null && st.total_units_delivered != null) patch.total_units_delivered = st.total_units_delivered;
      if ((target.description ?? "").length < 120 && descr.length > 120) patch.description = descr;
      if (!target.feature_image_url && cover) patch.feature_image_url = cover;
      if (!target.logo_url_processed && !target.logo_url && !target.logo_locked && realLogo) {
        patch.logo_url = realLogo;
      }

      if (!dryRun && Object.keys(patch).length > 2) {
        const { error } = await supabase.from("developers").update(patch).eq("id", target.id);
        if (error) { report.failed.push(`${slug}: ${error.message}`); continue; }
      }

      if (!dryRun && gallery.length) {
        const { data: existing } = await supabase.from("developer_media")
          .select("url").eq("developer_id", target.id);
        const have = new Set((existing ?? []).map((r: any) => r.url));
        const rows = gallery.slice(0, 10)
          .filter((g) => !have.has(g.url))
          .map((g, i) => ({
            developer_id: target.id, kind: "photo", url: g.url,
            caption: g.caption.replace(/\s+/g, " ").trim(), display_order: i, is_public: true,
          }));
        if (rows.length) {
          const { error } = await supabase.from("developer_media").insert(rows);
          if (!error) report.mediaInserted += rows.length;
          else report.failed.push(`${slug} media: ${error.message}`);
        }
      }

      report.updated.push({ slug, name: target.name, fields: Object.keys(patch), images: gallery.length });
    }

    return new Response(JSON.stringify(report), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("woven-enrich failed", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
