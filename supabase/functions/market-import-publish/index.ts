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
  const parsed = typeof value === "string"
    ? (() => { try { return JSON.parse(value); } catch { return value; } })()
    : value;
  const raw =
    parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? ((parsed as Record<string, unknown>).images ??
         (parsed as Record<string, unknown>).gallery ??
         (parsed as Record<string, unknown>).videos ??
         [])
      : parsed;
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

/** Source landmarks -> the exact {label,time} shape consumed by ProjectDetail. */
function landmarks(value: unknown): { label: string; time: string }[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      const o = (item || {}) as Record<string, unknown>;
      const label = typeof o.name === "string" ? o.name : typeof o.label === "string" ? o.label : null;
      const minutes = Number(o.distance_minutes ?? o.minutes);
      const distance = typeof o.distance === "string" ? o.distance.trim() : "";
      const time = Number.isFinite(minutes) ? `${minutes} min` : distance;
      return label && time ? { label, time } : null;
    })
    .filter(Boolean) as { label: string; time: string }[];
}

/** First payment plan -> "20 / 40 / 40" label + structured milestone breakdown. */
function paymentPlan(value: unknown) {
  const plans = Array.isArray(value) ? value : [];
  const breakdown = plans.flatMap((rawPlan, planIndex) => {
    const plan = (rawPlan || {}) as Record<string, unknown>;
    const prefix = plans.length > 1 ? `Plan ${planIndex + 1} — ` : "";
    return [
      { milestone: `${prefix}Down payment`, percentage: Number(plan.startPayment ?? plan.start_payment) },
      { milestone: `${prefix}During Construction`, percentage: Number(plan.interimPayment ?? plan.interim_payment) },
      { milestone: `${prefix}On Handover`, percentage: Number(plan.endPayment ?? plan.end_payment) },
      { milestone: `${prefix}Post-handover`, percentage: Number(plan.postHandoverPayment ?? plan.post_handover_payment) },
    ].filter((stage) => Number.isFinite(stage.percentage) && stage.percentage > 0);
  });
  if (!breakdown.length) return { label: null as string | null, breakdown: null as unknown, downPayment: null as number | null };
  const firstPlanStages = breakdown.filter((stage) => !stage.milestone.startsWith("Plan ") || stage.milestone.startsWith("Plan 1 —"));
  return {
    label: firstPlanStages.map((stage) => stage.percentage).join(" / "),
    breakdown,
    downPayment: breakdown[0]?.percentage ?? null,
  };
}

function objectValue(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function nonEmptyArray(value: unknown): unknown[] | null {
  return Array.isArray(value) && value.length ? value : null;
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

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceRoleKey) {
    return new Response(JSON.stringify({ error: "Backend configuration is incomplete" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const supabase = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  try {
    const { kind, ids } = (await req.json()) as { kind: "developer" | "project"; ids: string[] };
    if (!kind || !Array.isArray(ids) || !ids.length) return json({ error: "kind and ids are required" }, 400);

    const nowIso = new Date().toISOString();
    const results: { id: string; name: string; status: string; live_id?: string; error?: string }[] = [];

    // live indexes
    const { data: liveDevs } = await supabase.from("developers").select("id,name,slug,logo_url,description,founded_year,headquarters,completed_projects,offplan_projects,total_units_delivered,feature_image_url,notable_projects,public_fields,custom_fields").limit(6000);
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
          const developerPayload = objectValue(s.payload);
          const stagedGallery = allUrls(s.gallery);
          const payloadGallery = allUrls(developerPayload.media);
          const completeGallery = Array.from(new Set([...stagedGallery, ...payloadGallery]));
          const developerVideos = Array.from(new Set([...allUrls(s.videos), ...allUrls(objectValue(developerPayload.media).videos)]));
          const cover = completeGallery[0] ?? firstUrl(s.gallery) ?? firstUrl(developerPayload.media);
          const developerSourceData = {
            aliases: nonEmptyArray(s.aliases),
            awards: nonEmptyArray(s.awards),
            gallery: completeGallery.length ? completeGallery : null,
            videos: developerVideos.length ? developerVideos : null,
            rating: s.rating ?? null,
            total_projects: s.total_projects ?? null,
            portfolio: developerPayload.portfolio ?? null,
            statistics: developerPayload.statistics ?? null,
            source_url: s.source_url,
            source_id: s.source_id,
          };

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
                notable_projects: Array.isArray(developerPayload.portfolio)
                  ? (developerPayload.portfolio as unknown[]).map(String).join(", ")
                  : null,
                public_fields: { market_import: developerSourceData },
                custom_fields: { market_import: developerSourceData },
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
            if (!live.notable_projects && Array.isArray(developerPayload.portfolio)) {
              patch.notable_projects = (developerPayload.portfolio as unknown[]).map(String).join(", ");
            }
            const existingPublic = objectValue(live.public_fields);
            const existingCustom = objectValue(live.custom_fields);
            patch.public_fields = { ...existingPublic, market_import: developerSourceData };
            patch.custom_fields = { ...existingCustom, market_import: developerSourceData };
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
           "id,name,slug,is_published,description,short_description,cover_image_url,card_image_url,developer_id,price_from,total_units,available_units,latitude,longitude,location,area_name,emirate,floors,number_of_stories,building_count,built_up_area,plot_area,launch_date,expected_completion,handover_date,construction_start_date,construction_status,status,status_label,amenities,amenities_list,facilities,location_distances,payment_plan,payment_breakdown,down_payment_percent,rental_yield_estimate,roi_estimate,property_type_label,highlights,usp_bullets,units_data,unit_types,bedroom_types,bedrooms_min,bedrooms_max,video_url,video_urls,source_id,external_id",
        )
        .limit(8000);
      const projByName = new Map<string, any>();
      for (const p of liveProjects || []) {
        const k = norm(p.name);
        if (k && !projByName.has(k)) projByName.set(k, p);
      }
      const projSlugs = new Set<string>((liveProjects || []).map((p: any) => p.slug));
      const areaNames = Array.from(new Set((staged || []).map((row: any) => row.area).filter(Boolean)));
      const { data: matchingAreas } = areaNames.length
        ? await supabase.from("areas").select("id,name").in("name", areaNames)
        : { data: [] as { id: string; name: string }[] };
      const areaByName = new Map((matchingAreas || []).map((area: any) => [norm(area.name), area.id]));

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
          const payload = objectValue(s.payload);
          const invest = (s.investment || {}) as Record<string, unknown>;
          const timeline = objectValue(payload.timeline);
          const unitTypes = nonEmptyArray(payload.unitTypes);
          const videoUrls = allUrls(s.videos ?? objectValue(s.media).videos ?? payload.media);
          const storeys = s.storeys ?? specNumber(specs, "storeys");
          const totalUnits = s.total_units ?? specNumber(specs, "total_units");
          const builtArea = s.built_area_sqft ?? specNumber(specs, "built_area_sqft");
          const plotArea = s.plot_size_sqft ?? specNumber(specs, "plot_size_sqft");
          const yieldPct = Number(invest.estimated_rental_yield_percent);
          const roiPct = Number(invest.estimated_price_appreciation_1yr);
          const fmtArea = (v: number | null) => (v ? `${Math.round(v).toLocaleString("en-US")} sqft` : null);
          const typeLabel = Array.isArray(s.categories) && s.categories.length
            ? s.categories.map((c: string) => titleCase(c)).join(", ")
            : null;
          const bedroomValues = (unitTypes || [])
            .map((unit) => Number(objectValue(unit).bedrooms ?? objectValue(unit).bedroom_count))
            .filter((value) => Number.isFinite(value) && value >= 0);
          const sourceHighlights = [
            ...(Array.isArray(timeline.milestones) ? timeline.milestones : []).map((raw) => {
              const milestone = objectValue(raw);
              const name = String(milestone.name || "Construction milestone");
              const date = typeof milestone.date === "string" ? milestone.date.slice(0, 10) : null;
              const completion = Number(milestone.completion_percent);
              return [name, date, Number.isFinite(completion) ? `${completion}%` : null].filter(Boolean).join(" — ");
            }),
            Number.isFinite(yieldPct) ? `Estimated rental yield: ${yieldPct}%` : null,
            Number.isFinite(roiPct) ? `Estimated 1-year price appreciation: ${roiPct}%` : null,
            invest.investment_visa_eligible === true ? "Eligible for a UAE property investment visa, subject to current authority requirements" : null,
          ].filter((item): item is string => typeof item === "string" && item.length > 0);
          const sourceEnvelope = {
            source: "market_import",
            source_url: s.source_url || null,
            source_id: s.source_id || null,
            payload: s.payload || null,
            amenities: s.amenities || null,
            nearby_landmarks: s.nearby_landmarks || null,
            payment_plans: s.payment_plans || null,
            investment: s.investment || null,
            media: s.media || null,
          };

          // Everything the market source knows, mapped onto JBJ detail fields.
          const detail: Record<string, unknown> = {
            total_units: totalUnits ?? null,
            // LOCKED: source availability counts are unit-level inventory and
            // must never be imported. Public availability remains On Request.
            floors: storeys ?? null,
            number_of_stories: storeys ?? null,
            building_count: specNumber(payload, "tower_count"),
            built_up_area: fmtArea(builtArea),
            plot_area: fmtArea(plotArea),
            launch_date: s.launch_date || null,
            construction_start_date: s.construction_started ? String(s.construction_started).slice(0, 4) : null,
            expected_completion: s.completion_date || null,
            handover_date: s.handover_starts || s.completion_date || null,
            construction_status: s.is_offplan === false ? "completed" : "under_construction",
            status: s.status || null,
            status_label: s.status ? titleCase(String(s.status)) : null,
            property_type_label: typeLabel,
            price_from: priceAed(s.starting_price, s.currency),
            rental_yield_estimate: Number.isFinite(yieldPct) ? yieldPct : null,
            roi_estimate: Number.isFinite(roiPct) ? roiPct : null,
            amenities: amenities.length ? amenities : null,
            amenities_list: amenities.length ? amenities : null,
            facilities: amenities.length ? amenities : null,
            location_distances: distances.length ? distances : null,
            payment_plan: plan.label,
            payment_breakdown: plan.breakdown,
            down_payment_percent: plan.downPayment,
            location: s.address || [s.sub_area, s.area, s.city, s.country].filter(Boolean).join(", ") || null,
            highlights: sourceHighlights.length ? sourceHighlights : null,
            usp_bullets: sourceHighlights.length ? sourceHighlights : null,
            units_data: unitTypes,
            unit_types: unitTypes,
            bedroom_types: unitTypes,
            bedrooms_min: bedroomValues.length ? Math.min(...bedroomValues) : null,
            bedrooms_max: bedroomValues.length ? Math.max(...bedroomValues) : null,
            video_url: videoUrls[0] ?? null,
            video_urls: videoUrls.length ? videoUrls : null,
            source_id: s.source_id || null,
            external_id: s.source_id || null,
            area_id: s.area ? areaByName.get(norm(s.area)) ?? null : null,
            reelly_raw_data: sourceEnvelope,
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
              area_id: s.area ? areaByName.get(norm(s.area)) ?? null : null,
              latitude: s.latitude,
              longitude: s.longitude,
              price_currency: "AED",
              cover_image_url: cover,
              card_image_url: cover,
              source_url: s.source_url,
              location: s.address || [s.sub_area, s.area, s.city, s.country].filter(Boolean).join(", ") || null,
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
            if (!live.area_id && s.area) patch.area_id = areaByName.get(norm(s.area)) ?? null;
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
