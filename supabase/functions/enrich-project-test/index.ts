import { createClient } from "npm:@supabase/supabase-js@2";
import {
  corsHeaders, REELLY_API_BASE,
  extractGalleryImages, extractVideos, extractDocuments, extractFloorPlans, extractAmenities, extractUnitTypes
} from "../_shared/reelly-types.ts";
import { fetchProvidentPageDataDetail } from "../_shared/provident/pagedata-detail.ts";

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
  if (!res.ok) {
    console.log(`[enrich-test] Reelly API ${res.status} for id ${reellyId}`);
    return null;
  }
  const raw = await res.json();
  const topKeys = Object.keys(raw || {});
  console.log(`[enrich-test] Reelly API response keys for ${reellyId}: ${topKeys.join(", ")}`);
  
  // Handle nested response
  const data = raw?.data || raw;
  
  // Log what data fields are actually populated
  const fieldReport = {
    amenities: Array.isArray(data.amenities) ? data.amenities.length : (Array.isArray(data.facilities) ? data.facilities.length : 0),
    features: Array.isArray(data.features) ? data.features.length : 0,
    floor_plans: Array.isArray(data.floor_plans) ? data.floor_plans.length : 0,
    documents: Array.isArray(data.documents) ? data.documents.length : 0,
    brochures: Array.isArray(data.brochures) ? data.brochures.length : 0,
    images: Array.isArray(data.images) ? data.images.length : (Array.isArray(data.gallery) ? data.gallery.length : 0),
    units: Array.isArray(data.units) ? data.units.length : (Array.isArray(data.unit_types) ? data.unit_types.length : 0),
    faqs: Array.isArray(data.faqs) ? data.faqs.length : 0,
    overview: !!data.overview,
    video_reviews: Array.isArray(data.video_reviews) ? data.video_reviews.length : 0,
  };
  console.log(`[enrich-test] Reelly data fields for ${reellyId}:`, JSON.stringify(fieldReport));
  
  return data;
}

/** Generate slug variants to try matching on Provident */
function generateSlugVariants(slug: string, name: string, developerName?: string): string[] {
  const variants = new Set<string>();
  variants.add(slug);
  
  // Remove trailing numeric suffixes (e.g., "project-name-3012" -> "project-name")
  const withoutTrailingNum = slug.replace(/-\d+$/, "");
  if (withoutTrailingNum !== slug) variants.add(withoutTrailingNum);
  
  // Simplify name to slug
  const nameSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  variants.add(nameSlug);
  
  // Remove developer prefix patterns like "binghatti-titania-binghatti" -> "binghatti-titania"
  const parts = slug.split("-");
  if (parts.length >= 3) {
    variants.add(parts.slice(0, Math.ceil(parts.length / 2)).join("-"));
    variants.add(parts.slice(0, 2).join("-"));
  }
  
  // Developer-first pattern: "{developer}-{project}" (e.g., "azizi-riviera-59")
  if (developerName) {
    const devSlug = developerName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    variants.add(`${devSlug}-${nameSlug}`);
    variants.add(`${nameSlug}-by-${devSlug}`);
    // Name without developer reference
    const nameWithoutDev = name.toLowerCase()
      .replace(new RegExp(`\\b${developerName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').toLowerCase()}\\b`, 'g'), '')
      .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    if (nameWithoutDev && nameWithoutDev !== nameSlug) variants.add(nameWithoutDev);
  }
  
  // Try name without trailing numbers
  const nameWithoutNums = nameSlug.replace(/-\d+$/, "");
  if (nameWithoutNums !== nameSlug) variants.add(nameWithoutNums);
  
  // Try just first 2 words of the name
  const nameWords = name.split(/\s+/).filter(w => w.length > 1);
  if (nameWords.length >= 2) {
    variants.add(nameWords.slice(0, 2).join("-").toLowerCase().replace(/[^a-z0-9-]+/g, ""));
  }
  
  return [...variants];
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
    const { slug, action, mode, batch_size, source, skip_reelly } = body;

    // ── Batch mode: process multiple projects ──
    if (mode === "batch") {
      const limit = Math.min(batch_size || 10, 25);
      const isProvidentOnly = source === "provident_only";

      // Build query - optionally filter to provident-sourced projects only
      let projectQuery = supabase
        .from("projects")
        .select("id, name, slug, reelly_id, amenities, faqs, floor_plan_types, description, usp_bullets, developer_name")
        .eq("is_published", true)
        .or("amenities.is.null,amenities.eq.{},faqs.is.null,faqs.eq.[],floor_plan_types.is.null,floor_plan_types.eq.[],description.is.null,usp_bullets.is.null,usp_bullets.eq.{}");

      const { data: projects, error: queryErr } = await projectQuery.limit(limit);

      if (queryErr) return json(500, { error: queryErr.message });

      // Count remaining
      let remainingQuery = supabase
        .from("projects")
        .select("id", { count: "exact", head: true })
        .eq("is_published", true)
        .or("amenities.is.null,amenities.eq.{},faqs.is.null,faqs.eq.[],floor_plan_types.is.null,floor_plan_types.eq.[],description.is.null,usp_bullets.is.null,usp_bullets.eq.{}");

      const { count: remaining } = await remainingQuery;

      if (!projects || projects.length === 0) {
        return json(200, { success: true, processed: 0, enriched: 0, errors: 0, remaining: 0, message: "All projects enriched!" });
      }

      let enriched = 0;
      let errors = 0;
      let totalImages = 0;
      let totalDocs = 0;
      let totalFields = 0;

      for (const proj of projects) {
        try {
          // Call the same enrichment logic via internal fetch to self
          const enrichUrl = `${supabaseUrl}/functions/v1/enrich-project-test`;
          const res = await fetch(enrichUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${supabaseKey}`,
            },
            body: JSON.stringify({ slug: proj.slug, action: "apply", skip_reelly: isProvidentOnly }),
          });

          if (res.ok) {
            const result = await res.json();
            if (result.success && result.applied) {
              enriched++;
              totalImages += result.new_images || 0;
              totalDocs += result.new_documents || 0;
              totalFields += (result.updates_applied?.length || 0);
            }
          } else {
            errors++;
          }
        } catch {
          errors++;
        }
      }

      return json(200, {
        success: true,
        processed: projects.length,
        enriched,
        errors,
        remaining: Math.max(0, (remaining || 0) - projects.length),
        total_images: totalImages,
        total_documents: totalDocs,
        total_fields: totalFields,
      });
    }

    if (!slug) return json(400, { error: "Missing project slug" });

    // Fetch current project from DB
    const { data: project, error: projErr } = await supabase
      .from("projects")
      .select("id, name, slug, reelly_id, amenities, usp_bullets, location_distances, description, cover_image_url, developer_name, area_name, price_from, price_to, faqs, floor_plan_types, payment_plan, payment_breakdown, unit_types, video_url, highlights, service_charge, roi_estimate, total_units, building_count, bedrooms_min, bedrooms_max, floors")
      .eq("slug", slug)
      .single();

    if (projErr || !project) return json(404, { error: "Project not found" });

    const { count: imageCount } = await supabase
      .from("project_images")
      .select("id", { count: "exact", head: true })
      .eq("project_id", project.id);

    const { count: docCount } = await supabase
      .from("project_documents")
      .select("id", { count: "exact", head: true })
      .eq("project_id", project.id);

    // Build "before" snapshot
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

    // Enrichment data accumulator
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

    // ── Source 1: Reelly API ──
    let reellyData: any = null;
    if (project.reelly_id && reellyApiKey && !skip_reelly) {
      reellyData = await fetchReellyProject(project.reelly_id, reellyApiKey);
      if (reellyData) {
        enrichment.amenities = extractAmenities(reellyData);
        enrichment.gallery = extractGalleryImages(reellyData);
        enrichment.documents = extractDocuments(reellyData);
        enrichment.floor_plans = extractFloorPlans(reellyData);
        enrichment.unit_types = extractUnitTypes(reellyData);

        if (reellyData.highlights && Array.isArray(reellyData.highlights)) {
          enrichment.highlights = reellyData.highlights.filter((h: any) => typeof h === 'string' ? h : h?.text).map((h: any) => typeof h === 'string' ? h : h.text);
        }
        if (reellyData.usp_bullets && Array.isArray(reellyData.usp_bullets)) {
          enrichment.usp_bullets = reellyData.usp_bullets;
        } else if (enrichment.highlights.length > 0) {
          enrichment.usp_bullets = enrichment.highlights;
        }
        if (reellyData.overview) enrichment.description = reellyData.overview;
        const videos = reellyData.video_reviews || [];
        if (videos.length > 0) {
          const firstVideo = videos[0];
          enrichment.video_url = typeof firstVideo === 'string' ? firstVideo : firstVideo?.url || null;
        }
        if (reellyData.faqs && Array.isArray(reellyData.faqs)) {
          enrichment.faqs = reellyData.faqs.filter((f: any) => f?.question && f?.answer);
        }
        if (reellyData.payment_plan) {
          enrichment.payment_plan = reellyData.payment_plan.name || reellyData.payment_plan.description || JSON.stringify(reellyData.payment_plan);
          if (reellyData.payment_plan.milestones && Array.isArray(reellyData.payment_plan.milestones)) {
            enrichment.payment_breakdown = reellyData.payment_plan.milestones;
          }
        }
        if (reellyData.location_distances && Array.isArray(reellyData.location_distances)) {
          enrichment.location_distances = reellyData.location_distances;
        } else if (reellyData.nearby_places && Array.isArray(reellyData.nearby_places)) {
          enrichment.location_distances = reellyData.nearby_places.map((p: any) => ({ label: p.name, time: p.distance })).filter((d: any) => d.label && d.time);
        }
        if (reellyData.service_charge != null) enrichment.service_charge = reellyData.service_charge;
        if (reellyData.roi_estimate != null) enrichment.roi_estimate = reellyData.roi_estimate;
      }
    }

    // ── Source 2: Provident (fill gaps) ──
    let providentData: any = null;
    let providentSlugUsed: string | null = null;
    const slugVariants = generateSlugVariants(project.slug, project.name, project.developer_name);
    
    for (const variant of slugVariants) {
      console.log(`[enrich-test] Trying Provident slug: ${variant}`);
      const pd = await fetchProvidentPageDataDetail(variant);
      if (pd && (pd.amenities.length > 0 || pd.images.length > 0 || pd.faqs.length > 0 || pd.uspBullets.length > 0 || pd.description)) {
        providentData = pd;
        providentSlugUsed = variant;
        console.log(`[enrich-test] Provident match found: ${variant}`);
        break;
      }
    }

    // Merge Provident data into enrichment where Reelly returned nothing
    if (providentData) {
      if (enrichment.amenities.length === 0 && providentData.amenities.length > 0)
        enrichment.amenities = providentData.amenities;
      if (enrichment.usp_bullets.length === 0 && providentData.uspBullets.length > 0)
        enrichment.usp_bullets = providentData.uspBullets;
      if (enrichment.location_distances.length === 0 && providentData.locationDistances.length > 0)
        enrichment.location_distances = providentData.locationDistances;
      if (enrichment.faqs.length === 0 && providentData.faqs.length > 0)
        enrichment.faqs = providentData.faqs;
      if (enrichment.floor_plans.length === 0 && providentData.floorPlanTypes.length > 0)
        enrichment.floor_plans = providentData.floorPlanTypes.map((fp: any) => ({ type: fp.label, url: fp.pdfUrl || '', label: fp.label }));
      if (!enrichment.description && providentData.description)
        enrichment.description = providentData.description;
      if (!enrichment.payment_plan && providentData.paymentPlan)
        enrichment.payment_plan = providentData.paymentPlan;
      if (enrichment.gallery.length <= 1 && providentData.images.length > 0)
        enrichment.gallery = [...enrichment.gallery, ...providentData.images.map((img: any, i: number) => ({ url: img.url, alt_text: img.alt_text, display_order: (enrichment.gallery.length) + i }))];
      // Documents from Provident
      const provDocs: Array<{ url: string; name: string; type: string }> = [];
      if (providentData.brochureUrl) provDocs.push({ url: providentData.brochureUrl, name: "Brochure", type: "brochure" });
      if (providentData.paymentPlanPdfUrl) provDocs.push({ url: providentData.paymentPlanPdfUrl, name: "Payment Plan", type: "payment_plan" });
      for (const fpUrl of (providentData.floorPlanPdfUrls || [])) {
        provDocs.push({ url: fpUrl, name: "Floor Plan", type: "floor_plan" });
      }
      if (enrichment.documents.length === 0 && provDocs.length > 0)
        enrichment.documents = provDocs;
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

      if (enrichment.gallery.length > 0) {
        const newImages = enrichment.gallery.map((img, i) => ({
          project_id: project.id,
          image_url: img.url,
          alt_text: img.alt_text || `${project.name} image ${i + 1}`,
          display_order: (imageCount || 0) + i,
          data_source: providentData ? "provident_enrichment" : "reelly_enrichment",
        }));
        await supabase.from("project_images").insert(newImages);
      }

      if (enrichment.documents.length > 0) {
        const newDocs = enrichment.documents.map((doc) => ({
          project_id: project.id,
          file_url: doc.url,
          document_type: doc.type,
          file_name: doc.name || doc.type,
          data_source: providentData ? "provident_enrichment" : "reelly_enrichment",
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
        provident: providentData
          ? {
              available: true,
              slug_used: providentSlugUsed,
              fields_found: {
                amenities: providentData.amenities?.length || 0,
                images: providentData.images?.length || 0,
                faqs: providentData.faqs?.length || 0,
                usp_bullets: providentData.uspBullets?.length || 0,
                floor_plans: providentData.floorPlanTypes?.length || 0,
                distances: providentData.locationDistances?.length || 0,
                description: providentData.description ? 1 : 0,
                brochure: providentData.brochureUrl ? 1 : 0,
                payment_plan_pdf: providentData.paymentPlanPdfUrl ? 1 : 0,
              },
            }
          : { available: false, reason: "No Provident slug match" },
      },
    });
  } catch (e) {
    console.error("enrich-project-test error:", e);
    return json(500, { error: e instanceof Error ? e.message : "Unexpected error" });
  }
});
