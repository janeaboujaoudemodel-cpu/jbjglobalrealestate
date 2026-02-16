import { createClient } from "npm:@supabase/supabase-js@2";
import {
  corsHeaders, REELLY_API_BASE, ReellyProject,
  extractGalleryImages, extractVideos, extractDocuments, extractFloorPlans, extractAmenities, extractUnitTypes
} from "../_shared/reelly-types.ts";

async function fetchDetail(apiKey: string, id: number): Promise<{ project: ReellyProject | null; rawKeys: string[] }> {
  try {
    const res = await fetch(`${REELLY_API_BASE}/${id}`, {
      headers: { "X-API-Key": apiKey, "Authorization": `Bearer ${apiKey}`, "Accept": "application/json" },
    });
    if (!res.ok) return { project: null, rawKeys: [] };
    const raw = await res.json();
    const rawKeys = Object.keys(raw || {});
    // Handle possible nested response: { data: {...} } or direct object
    const project = raw?.data || raw;
    return { project, rawKeys };
  } catch {
    return { project: null, rawKeys: [] };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("REELLY_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ success: false, error: "REELLY_API_KEY not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const body = await req.json().catch(() => ({}));
    const batchSize = Math.min(body.batch_size || 10, 50);
    const specificProjectId = body.project_id;
    const force = body.force === true;

    let query;
    if (specificProjectId) {
      query = supabase
        .from("projects")
        .select("id, name, reelly_id, detail_fetched_at, amenities, floor_plan_types")
        .eq("id", specificProjectId)
        .not("reelly_id", "is", null)
        .limit(1);
    } else if (force) {
      // Force mode: re-fetch all projects with reelly_id
      query = supabase
        .from("projects")
        .select("id, name, reelly_id, detail_fetched_at, amenities, floor_plan_types")
        .not("reelly_id", "is", null)
        .order("created_at", { ascending: false })
        .limit(batchSize);
    } else {
      // Default: find projects with EMPTY data (not just missing timestamp)
      // amenities is text[] — empty = '{}', floor_plan_types is jsonb — empty = '[]'
      query = supabase
        .from("projects")
        .select("id, name, reelly_id, detail_fetched_at, amenities, floor_plan_types")
        .not("reelly_id", "is", null)
        .or("amenities.is.null,amenities.eq.{}")
        .order("created_at", { ascending: false })
        .limit(batchSize);
    }

    const { data: projects, error: queryError } = await query;
    if (queryError) {
      return new Response(JSON.stringify({ success: false, error: queryError.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!projects?.length) {
      return new Response(JSON.stringify({
        success: true, message: "No projects needing detail backfill", processed: 0,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    let updated = 0;
    let failed = 0;
    let apiDiagnostics: { rawKeys: string[]; sampleFields: Record<string, unknown> } | null = null;
    const results: Array<{ name: string; status: string; images?: number; docs?: number; amenities?: number; floor_plans?: number }> = [];

    for (const p of projects) {
      const reellyId = typeof p.reelly_id === "number" ? p.reelly_id : parseInt(p.reelly_id, 10);
      if (isNaN(reellyId)) { failed++; results.push({ name: p.name, status: "invalid_reelly_id" }); continue; }

      const { project: detail, rawKeys } = await fetchDetail(apiKey, reellyId);
      if (!detail) { failed++; results.push({ name: p.name, status: "api_fetch_failed" }); continue; }

      // Log diagnostics for the first project to understand API structure
      if (!apiDiagnostics) {
        apiDiagnostics = {
          rawKeys,
          sampleFields: {
            has_amenities: Array.isArray(detail.amenities),
            amenities_count: Array.isArray(detail.amenities) ? detail.amenities.length : 0,
            has_facilities: Array.isArray(detail.facilities),
            facilities_count: Array.isArray(detail.facilities) ? detail.facilities.length : 0,
            has_features: Array.isArray(detail.features),
            features_count: Array.isArray(detail.features) ? detail.features.length : 0,
            has_floor_plans: Array.isArray(detail.floor_plans),
            floor_plans_count: Array.isArray(detail.floor_plans) ? detail.floor_plans.length : 0,
            has_documents: Array.isArray(detail.documents),
            documents_count: Array.isArray(detail.documents) ? detail.documents.length : 0,
            has_brochures: Array.isArray(detail.brochures),
            brochures_count: Array.isArray(detail.brochures) ? detail.brochures.length : 0,
            has_units: Array.isArray(detail.units),
            units_count: Array.isArray(detail.units) ? detail.units.length : 0,
            has_unit_types: Array.isArray(detail.unit_types),
            unit_types_count: Array.isArray(detail.unit_types) ? detail.unit_types.length : 0,
            has_images: Array.isArray(detail.images),
            images_count: Array.isArray(detail.images) ? detail.images.length : 0,
            has_gallery: Array.isArray(detail.gallery),
            gallery_count: Array.isArray(detail.gallery) ? detail.gallery.length : 0,
            has_video_reviews: Array.isArray(detail.video_reviews),
            video_reviews_count: Array.isArray(detail.video_reviews) ? detail.video_reviews.length : 0,
            has_faqs: Array.isArray(detail.faqs),
            faqs_count: Array.isArray(detail.faqs) ? detail.faqs.length : 0,
            has_highlights: Array.isArray(detail.highlights),
            highlights_count: Array.isArray(detail.highlights) ? detail.highlights.length : 0,
            has_payment_plan: !!detail.payment_plan,
            has_overview: !!detail.overview,
            has_short_description: !!detail.short_description,
            has_service_charge: detail.service_charge != null,
            has_roi_estimate: detail.roi_estimate != null,
            has_rental_yield: detail.rental_yield_estimate != null,
          },
        };
        console.log(`[backfill] API diagnostics for ${p.name} (reelly_id=${reellyId}):`, JSON.stringify(apiDiagnostics));
      }

      // Extract all data from detail endpoint
      const galleryImages = extractGalleryImages(detail);
      const videos = extractVideos(detail);
      const documents = extractDocuments(detail);
      const floorPlans = extractFloorPlans(detail);
      const amenities = extractAmenities(detail);
      const unitTypes = extractUnitTypes(detail);

      // Track if we actually got data
      let dataPopulated = false;

      // Update project with enriched data
      const updateData: Record<string, unknown> = {};

      if (amenities.length > 0) { updateData.amenities = amenities; dataPopulated = true; }
      if (floorPlans.length > 0) { updateData.floor_plan_types = floorPlans; dataPopulated = true; }
      if (unitTypes.length > 0) { updateData.unit_types = unitTypes; dataPopulated = true; }
      if (videos.video_url) { updateData.video_url = videos.video_url; dataPopulated = true; }

      // Extract payment plan info
      if (detail.payment_plan) {
        updateData.payment_plan = typeof detail.payment_plan === "string"
          ? detail.payment_plan
          : JSON.stringify(detail.payment_plan);
        dataPopulated = true;
      }

      // Extract payment breakdown
      if (detail.down_payment || detail.installment_plan) {
        const breakdown: Record<string, string> = {};
        if (detail.down_payment) breakdown.down_payment = `${detail.down_payment}%`;
        if (detail.during_construction) breakdown.during_construction = `${detail.during_construction}%`;
        if (detail.on_handover || detail.on_completion) {
          breakdown.on_completion = `${detail.on_handover || detail.on_completion}%`;
        }
        if (Object.keys(breakdown).length > 0) {
          updateData.payment_breakdown = breakdown;
          dataPopulated = true;
        }
      }

      // Extract description/overview if missing
      if (detail.overview) { updateData.description = detail.overview; dataPopulated = true; }
      if (detail.short_description && !detail.overview) { updateData.description = detail.short_description; dataPopulated = true; }

      // Extract FAQs
      if (detail.faqs && Array.isArray(detail.faqs) && detail.faqs.length > 0) {
        updateData.faqs = detail.faqs.filter((f: any) => f?.question && f?.answer);
        if ((updateData.faqs as any[]).length > 0) dataPopulated = true;
      }

      // Extract highlights
      if (detail.highlights && Array.isArray(detail.highlights) && detail.highlights.length > 0) {
        updateData.highlights = detail.highlights;
        dataPopulated = true;
      }

      // Service charge & ROI
      if (detail.service_charge != null) { updateData.service_charge = detail.service_charge; dataPopulated = true; }
      if (detail.roi_estimate != null) { updateData.roi_estimate = detail.roi_estimate; dataPopulated = true; }
      if (detail.rental_yield_estimate != null) { updateData.roi_estimate = detail.rental_yield_estimate; dataPopulated = true; }

      // Only set detail_fetched_at if we ACTUALLY got data
      if (dataPopulated) {
        updateData.detail_fetched_at = new Date().toISOString();
      }

      if (Object.keys(updateData).length > 0) {
        const { error: updateError } = await supabase
          .from("projects")
          .update(updateData)
          .eq("id", p.id);

        if (updateError) {
          failed++;
          results.push({ name: p.name, status: `update_error: ${updateError.message}` });
          continue;
        }
      }

      // Insert gallery images into project_images table
      if (galleryImages.length > 0) {
        const { count } = await supabase
          .from("project_images")
          .select("id", { count: "exact", head: true })
          .eq("project_id", p.id);

        if ((count || 0) < 3) {
          await supabase.from("project_images").delete().eq("project_id", p.id);

          const imageRows = galleryImages.map((img: { url: string; alt_text?: string }, idx: number) => ({
            project_id: p.id,
            image_url: img.url,
            alt_text: img.alt_text || `${p.name} - Image ${idx + 1}`,
            display_order: idx,
            data_source: "reelly",
          }));

          await supabase.from("project_images").insert(imageRows);
        }
      }

      // Insert documents into project_documents table
      if (documents.length > 0) {
        const { count: docCount } = await supabase
          .from("project_documents")
          .select("id", { count: "exact", head: true })
          .eq("project_id", p.id);

        if ((docCount || 0) === 0) {
          const docRows = documents.map((doc: { type: string; url: string; name?: string }) => ({
            project_id: p.id,
            document_type: doc.type,
            file_url: doc.url,
            file_name: doc.name || `${p.name} - ${doc.type}`,
            data_source: "reelly",
          }));

          await supabase.from("project_documents").insert(docRows);
        }
      }

      updated++;
      results.push({
        name: p.name,
        status: dataPopulated ? "success_with_data" : "success_no_new_data",
        images: galleryImages.length,
        docs: documents.length,
        amenities: amenities.length,
        floor_plans: floorPlans.length,
      });

      await new Promise((r) => setTimeout(r, 300));
    }

    return new Response(JSON.stringify({
      success: true,
      processed: projects.length,
      updated,
      failed,
      api_diagnostics: apiDiagnostics,
      results,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
