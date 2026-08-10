import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { requireOwnerAuth } from "../_shared/owner-auth-middleware.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Market Import — Approve = Publish
 *
 * Approving a staged market record publishes it into live JBJ inventory in the
 * same action. The staged row is never deleted: it keeps review_decision,
 * publish_status, published_at and the live jbj_* id so the owner can always
 * follow up on any developer or project later.
 */

const norm = (s: unknown) =>
  String(s ?? "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/\b(l\.?l\.?c|fz[- ]?llc|fzco|fze|properties|property|development[s]?|developer[s]?|real estate|group|holding[s]?|company|co|ltd|limited|the)\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const slugify = (s: string) =>
  String(s || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80) || "record";

function englishText(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const pick = obj.en ?? obj.EN ?? obj.english ?? Object.values(obj)[0];
    return typeof pick === "string" ? pick.trim() || null : null;
  }
  const raw = String(value).trim();
  if (!raw) return null;
  if (raw.startsWith("{") || raw.startsWith("[")) {
    try {
      return englishText(JSON.parse(raw));
    } catch {
      /* fall through */
    }
  }
  return raw;
}

function firstUrl(value: unknown): string | null {
  const arr = Array.isArray(value)
    ? value
    : typeof value === "string"
      ? (() => {
          try {
            const p = JSON.parse(value);
            return Array.isArray(p) ? p : [];
          } catch {
            return [];
          }
        })()
      : [];
  for (const item of arr) {
    if (typeof item === "string" && /^https?:\/\//.test(item)) return item;
    if (item && typeof item === "object") {
      const o = item as Record<string, unknown>;
      const url = o.url ?? o.src ?? o.image ?? o.image_url;
      if (typeof url === "string" && /^https?:\/\//.test(url)) return url;
    }
  }
  return null;
}

/** Every image url in a staged media blob, in source order, de-duplicated. */
function allUrls(value: unknown): string[] {
  const raw =
    value && typeof value === "object" && !Array.isArray(value)
      ? ((value as Record<string, unknown>).images ?? (value as Record<string, unknown>).gallery ?? [])
      : value;
  const arr = Array.isArray(raw) ? raw : [];
  const out: string[] = [];
  for (const item of arr) {
    const url =
      typeof item === "string"
        ? item
        : item && typeof item === "object"
          ? ((item as Record<string, unknown>).url ??
             (item as Record<string, unknown>).src ??
             (item as Record<string, unknown>).image_url)
          : null;
    if (typeof url === "string" && /^https?:\/\//.test(url) && !out.includes(url)) out.push(url);
  }
  return out;
}

const titleCase = (s: string) =>
  s.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim().replace(/^./, (c) => c.toUpperCase());

/** Woven amenities arrive grouped ({indoor:[...], outdoor:[...]}) or flat. */
function amenityLabels(value: unknown): string[] {
  const out: string[] = [];
  const push = (v: unknown) => {
    if (typeof v === "string" && v.trim()) {
      const label = titleCase(v);
      if (!out.includes(label)) out.push(label);
    }
  };
  if (Array.isArray(value)) value.forEach(push);
  else if (value && typeof value === "object")
    for (const group of Object.values(value as Record<string, unknown>))
      Array.isArray(group) ? group.forEach(push) : push(group);
  return out;
}

/** [{name, distance_minutes}] -> [{name, minutes}] for the location panel. */
function landmarks(value: unknown): { name: string; minutes: number | null }[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      const o = (item || {}) as Record<string, unknown>;
      const name = typeof o.name === "string" ? o.name : null;
      const minutes = Number(o.distance_minutes ?? o.minutes);
      return name ? { name, minutes: Number.isFinite(minutes) ? minutes : null } : null;
    })
    .filter(Boolean) as { name: string; minutes: number | null }[];
}

/** First payment plan -> "20 / 40 / 40" label + structured milestone breakdown. */
function paymentPlan(value: unknown) {
  const plan = Array.isArray(value) ? (value[0] as Record<string, unknown> | undefined) : undefined;
  if (!plan) return { label: null as string | null, breakdown: null as unknown };
  const stages = [
    { milestone: "Down payment", percentage: Number(plan.startPayment ?? plan.start_payment) },
    { milestone: "During Construction", percentage: Number(plan.interimPayment ?? plan.interim_payment) },
    { milestone: "On Handover", percentage: Number(plan.endPayment ?? plan.end_payment) },
  ].filter((s) => Number.isFinite(s.percentage) && s.percentage > 0);
  if (!stages.length) return { label: null, breakdown: null };
  return { label: stages.map((s) => s.percentage).join(" / "), breakdown: stages };
}

const USD_TO_AED = 3.6725;
/** Market prices are quoted in USD; JBJ inventory is AED. */
function priceAed(amount: unknown, currency: unknown): number | null {
  const value = Number(amount);
  if (!Number.isFinite(value) || value <= 0) return null;
  const cur = String(currency ?? "AED").toUpperCase();
  return cur === "USD" ? Math.round(value * USD_TO_AED) : Math.round(value);
}

function specNumber(specs: unknown, key: string): number | null {
  const o = (specs && typeof specs === "object" ? specs : {}) as Record<string, unknown>;
  const value = Number(o[key]);
  return Number.isFinite(value) && value > 0 ? value : null;
}


serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const ownerAuth = await requireOwnerAuth(req, corsHeaders);
  if (ownerAuth.response) return ownerAuth.response;

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  try {
    const { kind, ids } = (await req.json()) as { kind: "developer" | "project"; ids: string[] };
    if (!kind || !Array.isArray(ids) || !ids.length) return json({ error: "kind and ids are required" }, 400);

    const nowIso = new Date().toISOString();
    const results: { id: string; name: string; status: string; live_id?: string; error?: string }[] = [];

    // live indexes
    const { data: liveDevs } = await supabase.from("developers").select("id,name,slug,logo_url,description,founded_year,headquarters,completed_projects,offplan_projects,total_units_delivered,feature_image_url").limit(6000);
    const devByName = new Map<string, any>();
    for (const d of liveDevs || []) {
      const k = norm(d.name);
      if (k && !devByName.has(k)) devByName.set(k, d);
    }

    const takenSlugs = new Set<string>((liveDevs || []).map((d: any) => d.slug));

    if (kind === "developer") {
      const { data: staged, error } = await supabase
        .from("market_staged_developers")
        .select("*")
        .in("id", ids);
      if (error) throw error;

      for (const s of staged || []) {
        try {
          let live =
            (s.jbj_developer_id && (liveDevs || []).find((d: any) => d.id === s.jbj_developer_id)) ||
            devByName.get(norm(s.name));

          const desc = englishText(s.description);
          const cover = firstUrl(s.gallery);

          if (!live) {
            let slug = slugify(s.name);
            let n = 2;
            while (takenSlugs.has(slug)) slug = `${slugify(s.name)}-${n++}`;
            takenSlugs.add(slug);
            const { data: inserted, error: insErr } = await supabase
              .from("developers")
              .insert({
                name: s.name,
                slug,
                description: desc,
                founded_year: s.founded_year,
                headquarters: s.headquarters,
                completed_projects: s.completed_projects,
                offplan_projects: s.ongoing_projects,
                total_units_delivered: s.units_delivered,
                logo_url: s.logo_url,
                feature_image_url: cover,
                enrichment_source: "market_import",
                last_enriched_at: nowIso,
                is_hidden: false,
              })
              .select("id,name,slug")
              .single();
            if (insErr) throw insErr;
            live = inserted;
          } else {
            // fill only empty JBJ fields — manual JBJ values always win
            const patch: Record<string, unknown> = {};
            if (!live.description && desc) patch.description = desc;
            if (!live.founded_year && s.founded_year) patch.founded_year = s.founded_year;
            if (!live.headquarters && s.headquarters) patch.headquarters = s.headquarters;
            if (!live.completed_projects && s.completed_projects) patch.completed_projects = s.completed_projects;
            if (!live.offplan_projects && s.ongoing_projects) patch.offplan_projects = s.ongoing_projects;
            if (!live.total_units_delivered && s.units_delivered) patch.total_units_delivered = s.units_delivered;
            if (!live.feature_image_url && cover) patch.feature_image_url = cover;
            patch.is_hidden = false;
            patch.last_enriched_at = nowIso;
            const { error: upErr } = await supabase.from("developers").update(patch).eq("id", live.id);
            if (upErr) throw upErr;
          }

          const { error: stErr } = await supabase
            .from("market_staged_developers")
            .update({
              review_decision: "approved",
              reviewed_at: nowIso,
              reviewed_by: ownerAuth.userId || null,
              jbj_developer_id: live.id,
              publish_status: "published",
              published_at: nowIso,
              publish_error: null,
            })
            .eq("id", s.id);
          if (stErr) throw stErr;

          results.push({ id: s.id, name: s.name, status: "published", live_id: live.id });
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          await supabase
            .from("market_staged_developers")
            .update({ review_decision: "approved", reviewed_at: nowIso, publish_status: "failed", publish_error: msg })
            .eq("id", s.id);
          results.push({ id: s.id, name: s.name, status: "failed", error: msg });
        }
      }
    } else {
      const { data: staged, error } = await supabase.from("market_staged_projects").select("*").in("id", ids);
      if (error) throw error;

      const { data: liveProjects } = await supabase
        .from("projects")
        .select(
          "id,name,slug,is_published,description,short_description,cover_image_url,card_image_url,developer_id,price_from,total_units,available_units,latitude,longitude,area_name,emirate,floors,number_of_stories,built_up_area,plot_area,launch_date,expected_completion,handover_date,construction_start_date,construction_status,amenities,amenities_list,location_distances,payment_plan,payment_breakdown,rental_yield_estimate,roi_estimate,property_type_label",
        )
        .limit(8000);
      const projByName = new Map<string, any>();
      for (const p of liveProjects || []) {
        const k = norm(p.name);
        if (k && !projByName.has(k)) projByName.set(k, p);
      }
      const projSlugs = new Set<string>((liveProjects || []).map((p: any) => p.slug));

      for (const s of staged || []) {
        try {
          const devMatch = s.developer_name ? devByName.get(norm(s.developer_name)) : null;
          const desc = englishText(s.description);
          const gallery = allUrls(s.media);
          const cover = gallery[0] ?? firstUrl(s.media);
          const amenities = amenityLabels(s.amenities);
          const distances = landmarks(s.nearby_landmarks);
          const plan = paymentPlan(s.payment_plans);
          const specs = (s.payload && (s.payload as Record<string, unknown>).specs) || null;
          const invest = (s.investment || {}) as Record<string, unknown>;
          const storeys = s.storeys ?? specNumber(specs, "storeys");
          const totalUnits = s.total_units ?? specNumber(specs, "total_units");
          const availableUnits = specNumber(specs, "available_units");
          const builtArea = s.built_area_sqft ?? specNumber(specs, "built_area_sqft");
          const plotArea = s.plot_size_sqft ?? specNumber(specs, "plot_size_sqft");
          const yieldPct = Number(invest.estimated_rental_yield_percent);
          const roiPct = Number(invest.estimated_price_appreciation_1yr);
          const fmtArea = (v: number | null) => (v ? `${Math.round(v).toLocaleString("en-US")} sqft` : null);
          const typeLabel = Array.isArray(s.categories) && s.categories.length
            ? s.categories.map((c: string) => titleCase(c)).join(", ")
            : null;

          // Everything the market source knows, mapped onto JBJ detail fields.
          const detail: Record<string, unknown> = {
            total_units: totalUnits ?? null,
            available_units: availableUnits,
            floors: storeys ?? null,
            number_of_stories: storeys ?? null,
            built_up_area: fmtArea(builtArea),
            plot_area: fmtArea(plotArea),
            launch_date: s.launch_date || null,
            construction_start_date: s.construction_started ? String(s.construction_started).slice(0, 4) : null,
            expected_completion: s.completion_date || null,
            handover_date: s.handover_starts || s.completion_date || null,
            construction_status: s.is_offplan === false ? "completed" : "under_construction",
            property_type_label: typeLabel,
            price_from: priceAed(s.starting_price, s.currency),
            rental_yield_estimate: Number.isFinite(yieldPct) ? yieldPct : null,
            roi_estimate: Number.isFinite(roiPct) ? roiPct : null,
            amenities: amenities.length ? amenities : null,
            amenities_list: amenities.length ? amenities : null,
            location_distances: distances.length ? distances : null,
            payment_plan: plan.label,
            payment_breakdown: plan.breakdown,
          };

          let live =
            (s.jbj_project_id && (liveProjects || []).find((p: any) => p.id === s.jbj_project_id)) ||
            projByName.get(norm(s.name));

          if (!live) {
            let slug = slugify(s.name);
            let n = 2;
            while (projSlugs.has(slug)) slug = `${slugify(s.name)}-${n++}`;
            projSlugs.add(slug);
            const insertRow: Record<string, unknown> = {
              name: s.name,
              slug,
              developer_id: devMatch?.id ?? null,
              developer_name: s.developer_name || null,
              developer_gap_reason: devMatch?.id ? null : s.developer_name ? "developer_not_in_jbj" : "developer_unknown",
              developer_gap_flagged_at: devMatch?.id ? null : nowIso,
              description: desc,
              emirate: s.city || null,
              area_name: s.area || null,
              latitude: s.latitude,
              longitude: s.longitude,
              price_currency: "AED",
              cover_image_url: cover,
              card_image_url: cover,
              source_url: s.source_url,
              source: "market_import",
              import_source: "market_import",
              created_source: "market_import",
              is_offplan: s.is_offplan ?? true,
              is_published: true,
            };
            for (const [k, v] of Object.entries(detail)) if (v !== null && v !== undefined) insertRow[k] = v;
            const { data: inserted, error: insErr } = await supabase
              .from("projects")
              .insert(insertRow)
              .select("id,name,slug")
              .single();
            if (insErr) throw insErr;
            live = inserted;
          } else {
            // fill only empty JBJ fields — manual JBJ values always win
            const isEmpty = (v: unknown) =>
              v === null ||
              v === undefined ||
              v === "" ||
              (Array.isArray(v) && v.length === 0) ||
              (typeof v === "string" && /^(tbd|tbc|n\/?a|payment plan)$/i.test(v.trim()));
            const patch: Record<string, unknown> = { is_published: true };
            if (!live.description && desc) patch.description = desc;
            if (!live.cover_image_url && cover) patch.cover_image_url = cover;
            if (!live.card_image_url && cover) patch.card_image_url = cover;
            if (!live.developer_id && devMatch?.id) patch.developer_id = devMatch.id;
            if (!live.latitude && s.latitude) patch.latitude = s.latitude;
            if (!live.longitude && s.longitude) patch.longitude = s.longitude;
            if (!live.area_name && s.area) patch.area_name = s.area;
            if (!live.emirate && s.city) patch.emirate = s.city;
            for (const [k, v] of Object.entries(detail))
              if (v !== null && v !== undefined && isEmpty((live as Record<string, unknown>)[k])) patch[k] = v;
            const { error: upErr } = await supabase.from("projects").update(patch).eq("id", live.id);
            if (upErr) throw upErr;
          }

          // Gallery: additive only — existing owner photos are never touched.
          if (gallery.length) {
            const { data: existing } = await supabase
              .from("project_images")
              .select("image_url,display_order")
              .eq("project_id", live.id);
            const have = new Set((existing || []).map((r: any) => r.image_url));
            let order = Math.max(-1, ...(existing || []).map((r: any) => Number(r.display_order) || 0));
            const rows = gallery
              .filter((url) => !have.has(url))
              .map((url, i) => ({
                project_id: live.id,
                image_url: url,
                alt_text: `${s.name} gallery`,
                display_order: order + 1 + i,
                asset_role: (existing || []).length === 0 && i === 0 ? "cover" : "gallery",
                data_source: "market_data",
              }));
            if (rows.length) await supabase.from("project_images").insert(rows);
          }


          const { error: stErr } = await supabase
            .from("market_staged_projects")
            .update({
              review_decision: "approved",
              reviewed_at: nowIso,
              reviewed_by: ownerAuth.userId || null,
              jbj_project_id: live.id,
              publish_status: "published",
              published_at: nowIso,
              publish_error: null,
            })
            .eq("id", s.id);
          if (stErr) throw stErr;

          results.push({ id: s.id, name: s.name, status: "published", live_id: live.id });
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e);
          await supabase
            .from("market_staged_projects")
            .update({ review_decision: "approved", reviewed_at: nowIso, publish_status: "failed", publish_error: msg })
            .eq("id", s.id);
          results.push({ id: s.id, name: s.name, status: "failed", error: msg });
        }
      }
    }

    const published = results.filter((r) => r.status === "published").length;
    return json({ ok: true, kind, requested: ids.length, published, failed: results.length - published, results });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : String(e) }, 500);
  }
});
