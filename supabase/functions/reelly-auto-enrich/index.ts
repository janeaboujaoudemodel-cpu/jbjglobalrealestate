import { createClient } from "npm:@supabase/supabase-js@2";
import {
  corsHeaders, REELLY_API_BASE,
  extractGalleryImages, extractDocuments, extractAmenities, extractAmenityImages
} from "../_shared/reelly-types.ts";
import { acquireLock, releaseLock } from "../_shared/safe-execution.ts";

const FUNCTION_NAME = "reelly-auto-enrich";

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// Wrap entire handler with concurrency lock
const originalServe = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // Concurrency guard — skip if already running
  const gotLock = await acquireLock(FUNCTION_NAME, 12);
  if (!gotLock) {
    console.log(`[${FUNCTION_NAME}] Skipped — previous execution still running`);
    return json(200, { success: true, skipped: true, message: "Previous execution still running" });
  }

  const startTime = Date.now();
  try {
    return await handleEnrich(req, startTime);
  } finally {
    await releaseLock(FUNCTION_NAME, Date.now() - startTime);
  }
};

Deno.serve(originalServe);

async function handleEnrich(req: Request, startTime: number): Promise<Response> {

async function fetchReellyProject(reellyId: number, apiKey: string) {
  const res = await fetch(
    `${REELLY_API_BASE}/${reellyId}`,
    { headers: { "X-API-Key": apiKey, "Authorization": `Bearer ${apiKey}`, "Accept": "application/json" } }
  );
  if (!res.ok) return null;
  const data = await res.json();
  return data?.data || data;
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ── Direct extraction from raw Reelly API response ──

function extractPaymentBreakdown(raw: any): any[] | null {
  const plans = raw?.payment_plans;
  if (!Array.isArray(plans) || plans.length === 0) return null;
  const steps = plans[0]?.steps;
  if (!Array.isArray(steps) || steps.length === 0) return null;
  return steps
    .filter((s: any) => s.percentage > 0)
    .map((s: any) => ({
      milestone: s.name || s.stage_type || "Payment",
      percentage: s.percentage,
      stage_type: s.stage_type || null,
    }));
}

function extractPaymentPlanText(raw: any): string | null {
  const plans = raw?.payment_plans;
  if (!Array.isArray(plans) || plans.length === 0) return null;
  const steps = plans[0]?.steps;
  if (!Array.isArray(steps) || steps.length === 0) {
    return plans[0]?.name || null;
  }
  // Build shorthand like "10/50/40"
  const pcts = steps.filter((s: any) => s.percentage > 0).map((s: any) => s.percentage);
  if (pcts.length > 0) return pcts.join("/") + " Payment Plan";
  return plans[0]?.name || null;
}

function extractLocationDistances(raw: any): any[] | null {
  const points = raw?.project_map_points;
  if (!Array.isArray(points) || points.length === 0) return null;
  return points.map((p: any) => ({
    label: p.map_point_name || p.name,
    time: p.time ? `${p.time} min` : `${p.distance} km`,
    distance_km: p.distance,
  })).filter((d: any) => d.label);
}

function extractVideoUrls(raw: any): { video_url: string | null; video_urls: string[] } {
  const reviews = raw?.video_reviews;
  if (!Array.isArray(reviews) || reviews.length === 0) return { video_url: null, video_urls: [] };
  const urls = reviews
    .map((v: any) => v.url || v.video_url || v.link)
    .filter(Boolean);
  return { video_url: urls[0] || null, video_urls: urls };
}

function extractTypicalUnits(raw: any): any[] | null {
  const units = raw?.typical_units;
  if (!Array.isArray(units) || units.length === 0) return null;
  return units.map((u: any) => ({
    bedrooms: u.bedrooms,
    from_size: u.from_size_sqft || u.from_size_m2,
    to_size: u.to_size_sqft || u.to_size_m2,
    size_unit: u.from_size_sqft ? "sqft" : "m2",
    from_price: u.from_price_aed || u.from_price_usd,
    to_price: u.to_price_aed || u.to_price_usd,
    price_currency: u.from_price_aed ? "AED" : "USD",
    layouts: Array.isArray(u.layout) ? u.layout.map((l: any) => ({
      name: l.name,
      size: l.size_sqft || l.size_m2,
      image_url: l.image?.url || null,
    })) : [],
  }));
}

function extractFloorPlanTypes(raw: any): any[] | null {
  const fps = raw?.floor_plans;
  if (!Array.isArray(fps) || fps.length === 0) return null;
  return fps.map((fp: any) => ({
    name: fp.name || "Floor Plan",
    file_url: fp.file,
    file_type: fp.file_type || "floor_plan",
    description: fp.description || null,
  }));
}

function extractServiceCharge(raw: any): string | null {
  if (raw?.service_charge) return String(raw.service_charge);
  return null;
}

// -- handler continues from guarded entry point above --
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });

  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const reellyApiKey = Deno.env.get("REELLY_API_KEY") || "";

  if (!supabaseUrl || !supabaseKey || !reellyApiKey) {
    return json(500, { error: "Missing config" });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const MAX_RUNTIME_MS = 22_000;

  try {
    const body = await req.json().catch(() => ({}));
    const action = body.action || "run";
    const forceRefresh = body.force_refresh || false;
    const batchSize = Math.min(body.batch_size || 10, 15);

    // ── Stats ──
    if (action === "stats") {
      const { count: totalWithReelly } = await supabase
        .from("projects").select("id", { count: "exact", head: true })
        .eq("is_published", true).not("reelly_id", "is", null);

      const { count: enrichedCount } = await supabase
        .from("projects").select("id", { count: "exact", head: true })
        .eq("is_published", true).not("reelly_id", "is", null)
        .not("reelly_raw_data", "is", null);

      const { count: withPayment } = await supabase
        .from("projects").select("id", { count: "exact", head: true })
        .eq("is_published", true).not("reelly_id", "is", null)
        .not("payment_breakdown", "is", null);

      const { count: withPOI } = await supabase
        .from("projects").select("id", { count: "exact", head: true })
        .eq("is_published", true).not("reelly_id", "is", null)
        .not("location_distances", "is", null);

      const { count: totalImages } = await supabase
        .from("project_images").select("id", { count: "exact", head: true });
      const { count: totalDocs } = await supabase
        .from("project_documents").select("id", { count: "exact", head: true });

      return json(200, {
        success: true,
        total_projects: totalWithReelly || 0,
        enriched_with_raw_data: enrichedCount || 0,
        remaining: (totalWithReelly || 0) - (enrichedCount || 0),
        with_payment_plans: withPayment || 0,
        with_poi: withPOI || 0,
        total_images: totalImages || 0,
        total_documents: totalDocs || 0,
      });
    }

    // ── Re-extract mode: extract from stored reelly_raw_data without API calls ──
    if (action === "re-extract") {
      const { data: rawProjects } = await supabase
        .from("projects")
        .select("id, name, reelly_raw_data, payment_plan, payment_breakdown, location_distances, video_url, video_urls, unit_types, floor_plan_types, service_charge, faqs, highlights, usp_bullets, description")
        .eq("is_published", true)
        .not("reelly_id", "is", null)
        .not("reelly_raw_data", "is", null)
        .limit(2000);

      if (!rawProjects?.length) return json(200, { success: true, message: "No projects with raw data", processed: 0 });

      let updated = 0;
      for (const p of rawProjects) {
        const raw = p.reelly_raw_data;
        const updates: Record<string, any> = {};
        
        const ppBreakdown = extractPaymentBreakdown(raw);
        if (ppBreakdown && !p.payment_breakdown) updates.payment_breakdown = ppBreakdown;
        const ppText = extractPaymentPlanText(raw);
        if (ppText && !p.payment_plan) updates.payment_plan = ppText;
        const poi = extractLocationDistances(raw);
        if (poi && !(p.location_distances as any[])?.length) updates.location_distances = poi;
        const vids = extractVideoUrls(raw);
        if (vids.video_url && !p.video_url) { updates.video_url = vids.video_url; updates.video_urls = vids.video_urls; }
        const units = extractTypicalUnits(raw);
        if (units) updates.unit_types = units;
        const fps = extractFloorPlanTypes(raw);
        if (fps) updates.floor_plan_types = fps;
        const sc = extractServiceCharge(raw);
        if (sc && !p.service_charge) updates.service_charge = sc;

        if (Object.keys(updates).length > 0) {
          await supabase.from("projects").update(updates).eq("id", p.id);
          updated++;
        }
      }
      return json(200, { success: true, mode: "re-extract", processed: rawProjects.length, updated });
    }

    // ── Get candidates (projects WITHOUT raw data stored) ──
    const { data: allProjects } = await supabase
      .from("projects")
      .select("id, name, slug, reelly_id, amenities, amenity_images, usp_bullets, location_distances, description, cover_image_url, faqs, floor_plan_types, payment_plan, payment_breakdown, unit_types, video_url, highlights, service_charge, roi_estimate, reelly_raw_data")
      .eq("is_published", true)
      .not("reelly_id", "is", null)
      .order("created_at", { ascending: true })
      .limit(2000);

    if (!allProjects || allProjects.length === 0) {
      return json(200, { success: true, message: "No projects found", processed: 0 });
    }

    // Filter: projects without raw data stored (need API fetch)
    let candidates = allProjects;
    if (!forceRefresh) {
      candidates = allProjects.filter((p: any) => !p.reelly_raw_data);
    }

    if (candidates.length === 0) {
      return json(200, { success: true, message: "All projects have raw data stored", processed: 0, remaining: 0 });
    }

    console.log(`[auto-enrich] ${candidates.length} projects need API fetch + enrichment. Processing up to ${batchSize}.`);

    let processed = 0, imagesAdded = 0, docsAdded = 0, fieldsUpdated = 0, errors = 0;
    const results: Array<{ name: string; status: string; images: number; docs: number; fields: number }> = [];

    for (const project of candidates) {
      if (Date.now() - startTime > MAX_RUNTIME_MS) break;
      if (processed >= batchSize) break;

      try {
        const reellyData = await fetchReellyProject(project.reelly_id, reellyApiKey);
        if (!reellyData) {
          results.push({ name: project.name, status: "no_api_data", images: 0, docs: 0, fields: 0 });
          processed++;
          continue;
        }

        // Use shared extractors for gallery/docs/amenities
        const gallery = extractGalleryImages(reellyData);
        const documents = extractDocuments(reellyData);
        const amenities = extractAmenities(reellyData);
        const amenityImages = extractAmenityImages(reellyData);

        // Use direct extractors for fields the shared lib missed
        const ppBreakdown = extractPaymentBreakdown(reellyData);
        const ppText = extractPaymentPlanText(reellyData);
        const poi = extractLocationDistances(reellyData);
        const vids = extractVideoUrls(reellyData);
        const units = extractTypicalUnits(reellyData);
        const fps = extractFloorPlanTypes(reellyData);
        const sc = extractServiceCharge(reellyData);

        let pImages = 0, pDocs = 0, pFields = 0;

        // 1. Images
        if (gallery.length > 0) {
          const { data: existing } = await supabase.from("project_images").select("image_url").eq("project_id", project.id);
          const existingUrls = new Set((existing || []).map((i: any) => i.image_url));
          const { count: existingCount } = await supabase.from("project_images").select("id", { count: "exact", head: true }).eq("project_id", project.id);
          const newImages = gallery.filter((img: any) => !existingUrls.has(img.url)).map((img: any, i: number) => ({
            project_id: project.id, image_url: img.url, alt_text: img.alt_text, display_order: (existingCount || 0) + i, data_source: "auto_enrich",
          }));
          if (newImages.length > 0) {
            const { error: err } = await supabase.from("project_images").insert(newImages);
            if (!err) pImages = newImages.length;
          }
        }

        // 2. Documents
        if (documents.length > 0) {
          const { data: existingDocs } = await supabase.from("project_documents").select("file_url").eq("project_id", project.id);
          const existingDocUrls = new Set((existingDocs || []).map((d: any) => d.file_url));
          const newDocs = documents.filter((d: any) => !existingDocUrls.has(d.url)).map((doc: any, i: number) => ({
            project_id: project.id, file_url: doc.url, document_type: doc.type || "brochure",
            file_name: doc.name || "Document", data_source: "auto_enrich", display_order: i,
          }));
          for (const doc of newDocs) {
            const { error: err } = await supabase.from("project_documents").insert(doc);
            if (!err) pDocs++;
          }
        }

        // 3. Update project fields — STORE RAW DATA + extract all fields
        const updates: Record<string, any> = {
          reelly_raw_data: reellyData,
          detail_fetched_at: new Date().toISOString(),
        };

        // Amenities
        if (amenities.length > 0 && !(project.amenities as any[])?.length) updates.amenities = amenities;
        if (Object.keys(amenityImages).length > 0 && !project.amenity_images) updates.amenity_images = amenityImages;

        // Payment
        if (ppBreakdown && !project.payment_breakdown) updates.payment_breakdown = ppBreakdown;
        if (ppText && !project.payment_plan) updates.payment_plan = ppText;

        // Location/POI
        if (poi && !(project.location_distances as any[])?.length) updates.location_distances = poi;

        // Videos
        if (vids.video_url && !project.video_url) {
          updates.video_url = vids.video_url;
          updates.video_urls = vids.video_urls;
        }

        // Unit types & floor plans (always overwrite with latest)
        if (units) updates.unit_types = units;
        if (fps) updates.floor_plan_types = fps;

        // Service charge
        if (sc && !project.service_charge) updates.service_charge = sc;

        // Description
        if (!project.description && reellyData?.overview) updates.description = reellyData.overview;
        if (!project.description && reellyData?.short_description) updates.description = reellyData.short_description;

        // Highlights / USP
        if (reellyData?.highlights?.length > 0 && !(project.highlights as any[])?.length) {
          updates.highlights = reellyData.highlights.map((h: any) => typeof h === 'string' ? h : h?.text).filter(Boolean);
        }
        if (!(project.usp_bullets as any[])?.length && reellyData?.highlights?.length > 0) {
          updates.usp_bullets = reellyData.highlights.map((h: any) => typeof h === 'string' ? h : h?.text).filter(Boolean);
        }

        // ROI
        if (reellyData?.roi_estimate != null && project.roi_estimate == null) updates.roi_estimate = reellyData.roi_estimate;

        const { error: err } = await supabase.from("projects").update(updates).eq("id", project.id);
        if (!err) pFields = Object.keys(updates).length - 2; // exclude raw_data + detail_fetched_at

        imagesAdded += pImages;
        docsAdded += pDocs;
        fieldsUpdated += pFields;
        processed++;

        results.push({ name: project.name, status: "success", images: pImages, docs: pDocs, fields: pFields });
        console.log(`[auto-enrich] ✓ ${project.name}: +${pImages} imgs, +${pDocs} docs, +${pFields} fields`);

      } catch (err) {
        errors++;
        processed++;
        const msg = err instanceof Error ? err.message : String(err);
        results.push({ name: project.name, status: "error", images: 0, docs: 0, fields: 0 });
        console.error(`[auto-enrich] ✗ ${project.name}: ${msg}`);
      }

      await sleep(300);
    }

    return json(200, {
      success: true,
      processed,
      remaining: candidates.length - processed,
      images_added: imagesAdded,
      docs_added: docsAdded,
      fields_updated: fieldsUpdated,
      errors,
      elapsed_ms: Date.now() - startTime,
      results,
    });
  } catch (err) {
    console.error("[auto-enrich] Fatal:", err);
    return json(500, { error: err instanceof Error ? err.message : String(err) });
  }
}
