import { createClient } from "npm:@supabase/supabase-js@2";
import {
  corsHeaders, REELLY_API_BASE,
  extractGalleryImages, extractVideos, extractDocuments, extractFloorPlans, extractAmenities, extractUnitTypes
} from "../_shared/reelly-types.ts";

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function fetchReellyProject(reellyId: number, apiKey: string) {
  const res = await fetch(
    `${REELLY_API_BASE}/${reellyId}`,
    { headers: { "X-API-Key": apiKey, "Accept": "application/json" } }
  );
  if (!res.ok) return null;
  const data = await res.json();
  return data?.data || data;
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });

  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const reellyApiKey = Deno.env.get("REELLY_API_KEY") || "";

  if (!supabaseUrl || !supabaseKey) return json(500, { error: "Missing config" });

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const body = await req.json();
    const { slug, action } = body;

    if (!slug) return json(400, { error: "Missing project slug" });

    // Fetch current project from DB - include ALL enrichable fields
    const { data: project, error: projErr } = await supabase
      .from("projects")
      .select("id, name, slug, reelly_id, amenities, usp_bullets, location_distances, description, cover_image_url, developer_name, area_name, price_from, price_to, faqs, floor_plan_types, payment_plan, payment_breakdown, unit_types, video_url, highlights, service_charge, roi_estimate, total_units, building_count, bedrooms_min, bedrooms_max, floors")
      .eq("slug", slug)
      .single();

    if (projErr || !project) return json(404, { error: "Project not found" });

    // Fetch current images and documents count
    const { count: imageCount } = await supabase
      .from("project_images")
      .select("id", { count: "exact", head: true })
      .eq("project_id", project.id);

    const { count: docCount } = await supabase
      .from("project_documents")
      .select("id", { count: "exact", head: true })
      .eq("project_id", project.id);

    // Build "before" snapshot with ALL fields
    const before = {
      amenities_count: (project.amenities as any[])?.length || 0,
      usp_count: (project.usp_bullets as any[])?.length || 0,
      distances_count: (project.location_distances as any[])?.length || 0,
      images_count: imageCount || 0,
      documents_count: docCount || 0,
      faqs_count: (project.faqs as any[])?.length || 0,
      floor_plans_count: (project.floor_plan_types as any[])?.length || 0,
      unit_types_count: (project.unit_types as any[])?.length || 0,
      has_description: !!project.description,
      has_video: !!project.video_url,
      has_payment_plan: !!project.payment_plan,
      highlights_count: (project.highlights as any[])?.length || 0,
      has_service_charge: project.service_charge != null,
      has_roi_estimate: project.roi_estimate != null,
      total_units: project.total_units,
      building_count: project.building_count,
      bedrooms_min: project.bedrooms_min,
      bedrooms_max: project.bedrooms_max,
      floors: project.floors,
    };

    // Fetch enrichment data from Reelly
    let reellyData: any = null;
    let enrichment = {
      amenities: [] as string[],
      usp_bullets: [] as string[],
      location_distances: [] as Array<{ label: string; time: string }>,
      documents: [] as Array<{ url: string; name: string; type: string }>,
      gallery: [] as Array<{ url: string; alt_text: string; display_order: number }>,
      faqs: [] as Array<{ question: string; answer: string }>,
      floor_plans: [] as Array<{ type: string; url: string; label: string; bedrooms?: number }>,
      unit_types: [] as Array<any>,
      description: null as string | null,
      video_url: null as string | null,
      highlights: [] as string[],
      payment_plan: null as string | null,
      payment_breakdown: [] as Array<any>,
      service_charge: null as number | null,
      roi_estimate: null as number | null,
    };

    if (project.reelly_id && reellyApiKey) {
      reellyData = await fetchReellyProject(project.reelly_id, reellyApiKey);
      if (reellyData) {
        enrichment.amenities = extractAmenities(reellyData);
        enrichment.gallery = extractGalleryImages(reellyData);
        enrichment.documents = extractDocuments(reellyData);
        enrichment.floor_plans = extractFloorPlans(reellyData);
        enrichment.unit_types = extractUnitTypes(reellyData);

        // Extract USP/highlights
        if (reellyData.highlights && Array.isArray(reellyData.highlights)) {
          enrichment.highlights = reellyData.highlights.filter((h: any) => typeof h === 'string' ? h : h?.text).map((h: any) => typeof h === 'string' ? h : h.text);
        }
        if (reellyData.usp_bullets && Array.isArray(reellyData.usp_bullets)) {
          enrichment.usp_bullets = reellyData.usp_bullets;
        } else if (enrichment.highlights.length > 0) {
          enrichment.usp_bullets = enrichment.highlights;
        }

        // Description
        if (reellyData.overview) {
          enrichment.description = reellyData.overview;
        }

        // Video
        const videos = reellyData.video_reviews || [];
        if (videos.length > 0) {
          const firstVideo = videos[0];
          enrichment.video_url = typeof firstVideo === 'string' ? firstVideo : firstVideo?.url || null;
        }

        // FAQs
        if (reellyData.faqs && Array.isArray(reellyData.faqs)) {
          enrichment.faqs = reellyData.faqs.filter((f: any) => f?.question && f?.answer);
        }

        // Payment plan
        if (reellyData.payment_plan) {
          enrichment.payment_plan = reellyData.payment_plan.name || reellyData.payment_plan.description || JSON.stringify(reellyData.payment_plan);
          if (reellyData.payment_plan.milestones && Array.isArray(reellyData.payment_plan.milestones)) {
            enrichment.payment_breakdown = reellyData.payment_plan.milestones;
          }
        }

        // Location distances
        if (reellyData.location_distances && Array.isArray(reellyData.location_distances)) {
          enrichment.location_distances = reellyData.location_distances;
        } else if (reellyData.nearby_places && Array.isArray(reellyData.nearby_places)) {
          enrichment.location_distances = reellyData.nearby_places.map((p: any) => ({ label: p.name, time: p.distance })).filter((d: any) => d.label && d.time);
        }

        // Numeric fields
        if (reellyData.service_charge != null) enrichment.service_charge = reellyData.service_charge;
        if (reellyData.roi_estimate != null) enrichment.roi_estimate = reellyData.roi_estimate;
      }
    }

    // Build "after" snapshot
    const after = {
      amenities_count: enrichment.amenities.length || before.amenities_count,
      usp_count: enrichment.usp_bullets.length || before.usp_count,
      distances_count: enrichment.location_distances.length || before.distances_count,
      images_count: (imageCount || 0) + enrichment.gallery.length,
      documents_count: (docCount || 0) + enrichment.documents.length,
      new_images: enrichment.gallery.length,
      new_documents: enrichment.documents.length,
      faqs_count: enrichment.faqs.length || before.faqs_count,
      floor_plans_count: enrichment.floor_plans.length || before.floor_plans_count,
      unit_types_count: enrichment.unit_types.length || before.unit_types_count,
      has_description: !!enrichment.description || before.has_description,
      has_video: !!enrichment.video_url || before.has_video,
      has_payment_plan: !!enrichment.payment_plan || before.has_payment_plan,
      highlights_count: enrichment.highlights.length || before.highlights_count,
      has_service_charge: enrichment.service_charge != null || before.has_service_charge,
      has_roi_estimate: enrichment.roi_estimate != null || before.has_roi_estimate,
      gallery_preview: enrichment.gallery.slice(0, 4).map(g => g.url),
    };

    // If action is "apply", write ALL fields to DB
    if (action === "apply") {
      const updates: Record<string, any> = {};

      if (enrichment.amenities.length > 0 && before.amenities_count === 0) updates.amenities = enrichment.amenities;
      if (enrichment.usp_bullets.length > 0 && before.usp_count === 0) updates.usp_bullets = enrichment.usp_bullets;
      if (enrichment.location_distances.length > 0 && before.distances_count === 0) updates.location_distances = enrichment.location_distances;
      if (enrichment.description && !before.has_description) updates.description = enrichment.description;
      if (enrichment.video_url && !before.has_video) updates.video_url = enrichment.video_url;
      if (enrichment.faqs.length > 0 && before.faqs_count === 0) updates.faqs = enrichment.faqs;
      if (enrichment.floor_plans.length > 0 && before.floor_plans_count === 0) updates.floor_plan_types = enrichment.floor_plans;
      if (enrichment.unit_types.length > 0 && before.unit_types_count === 0) updates.unit_types = enrichment.unit_types;
      if (enrichment.highlights.length > 0 && before.highlights_count === 0) updates.highlights = enrichment.highlights;
      if (enrichment.payment_plan && !before.has_payment_plan) updates.payment_plan = enrichment.payment_plan;
      if (enrichment.payment_breakdown.length > 0) updates.payment_breakdown = enrichment.payment_breakdown;
      if (enrichment.service_charge != null && !before.has_service_charge) updates.service_charge = enrichment.service_charge;
      if (enrichment.roi_estimate != null && !before.has_roi_estimate) updates.roi_estimate = enrichment.roi_estimate;

      if (Object.keys(updates).length > 0) {
        await supabase.from("projects").update(updates).eq("id", project.id);
      }

      // Insert new images
      if (enrichment.gallery.length > 0) {
        const newImages = enrichment.gallery.map((img, i) => ({
          project_id: project.id,
          image_url: img.url,
          alt_text: img.alt_text || `${project.name} image ${i + 1}`,
          display_order: (imageCount || 0) + i,
          data_source: "reelly_enrichment",
        }));
        await supabase.from("project_images").insert(newImages);
      }

      // Insert new documents
      if (enrichment.documents.length > 0) {
        const newDocs = enrichment.documents.map((doc) => ({
          project_id: project.id,
          file_url: doc.url,
          document_type: doc.type,
          file_name: doc.name || doc.type,
          data_source: "reelly_enrichment",
        }));
        await supabase.from("project_documents").insert(newDocs);
      }

      return json(200, {
        success: true,
        applied: true,
        updates_applied: Object.keys(updates),
        new_images: enrichment.gallery.length,
        new_documents: enrichment.documents.length,
      });
    }

    // Preview mode (default)
    return json(200, {
      success: true,
      project: {
        id: project.id,
        name: project.name,
        slug: project.slug,
        reelly_id: project.reelly_id,
        cover_image_url: project.cover_image_url,
        developer_name: project.developer_name,
        area_name: project.area_name,
        price_from: project.price_from,
        price_to: project.price_to,
      },
      before,
      after,
      sources: {
        reelly: reellyData
          ? {
              available: true,
              url: `${REELLY_API_BASE}/${project.reelly_id}`,
              fields_found: Object.entries({
                amenities: enrichment.amenities.length,
                gallery: enrichment.gallery.length,
                documents: enrichment.documents.length,
                floor_plans: enrichment.floor_plans.length,
                unit_types: enrichment.unit_types.length,
                faqs: enrichment.faqs.length,
                highlights: enrichment.highlights.length,
                usp_bullets: enrichment.usp_bullets.length,
                description: enrichment.description ? 1 : 0,
                video: enrichment.video_url ? 1 : 0,
                payment_plan: enrichment.payment_plan ? 1 : 0,
              }).reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {}),
            }
          : { available: false, reason: !project.reelly_id ? "No reelly_id" : "API error" },
      },
    });
  } catch (e) {
    console.error("enrich-project-test error:", e);
    return json(500, { error: e instanceof Error ? e.message : "Unexpected error" });
  }
});
