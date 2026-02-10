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

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });

  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const reellyApiKey = Deno.env.get("REELLY_API_KEY") || "";

  if (!supabaseUrl || !supabaseKey || !reellyApiKey) {
    return json(500, { error: "Missing config (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, REELLY_API_KEY)" });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const body = await req.json().catch(() => ({}));
    const limit = Math.min(body.limit || 50, 100);
    const action = body.action || "enrich"; // "enrich" or "stats"

    // Stats mode: return how many projects need enrichment
    if (action === "stats") {
      // Count projects with reelly_id that have 0 or 1 images (just cover)
      const { count: totalWithReelly } = await supabase
        .from("projects")
        .select("id", { count: "exact", head: true })
        .eq("is_published", true)
        .not("reelly_id", "is", null);

      // Count projects that have documents
      const { data: projectsWithDocs } = await supabase
        .from("project_documents")
        .select("project_id")
        .limit(5000);
      const uniqueProjectsWithDocs = new Set((projectsWithDocs || []).map((d: any) => d.project_id)).size;

      // Count total images
      
      // Fallback: count project_images
      const { count: totalImages } = await supabase
        .from("project_images")
        .select("id", { count: "exact", head: true });

      const { count: totalDocs } = await supabase
        .from("project_documents")
        .select("id", { count: "exact", head: true });

      return json(200, {
        success: true,
        stats: {
          total_projects_with_reelly_id: totalWithReelly || 0,
          projects_with_documents: uniqueProjectsWithDocs,
          projects_needing_enrichment: (totalWithReelly || 0) - uniqueProjectsWithDocs,
          total_images: totalImages || 0,
          total_documents: totalDocs || 0,
        }
      });
    }

    // Find projects that need enrichment: have reelly_id, published, but missing documents
    // First get IDs of projects that already have documents
    const { data: projectsWithDocs } = await supabase
      .from("project_documents")
      .select("project_id");
    const docProjectIds = new Set((projectsWithDocs || []).map((d: any) => d.project_id));

    // Get published projects with reelly_id
    const { data: candidates, error: queryError } = await supabase
      .from("projects")
      .select("id, name, slug, reelly_id, amenities, usp_bullets, location_distances, description, cover_image_url, faqs, floor_plan_types, payment_plan, payment_breakdown, unit_types, video_url, highlights, service_charge, roi_estimate")
      .eq("is_published", true)
      .not("reelly_id", "is", null)
      .order("created_at", { ascending: true })
      .limit(500);

    if (queryError) return json(500, { error: queryError.message });

    // Filter to projects without documents (and limit)
    const projectsToProcess = (candidates || [])
      .filter((p: any) => !docProjectIds.has(p.id))
      .slice(0, limit);

    if (projectsToProcess.length === 0) {
      return json(200, {
        success: true,
        message: "All projects with Reelly IDs already have documents. Nothing to enrich.",
        processed: 0, images_added: 0, docs_added: 0, fields_updated: 0, errors: 0,
      });
    }

    console.log(`[bulk-enrich] Processing ${projectsToProcess.length} projects`);

    let totalImagesAdded = 0;
    let totalDocsAdded = 0;
    let totalFieldsUpdated = 0;
    let totalErrors = 0;
    const errorDetails: string[] = [];
    const results: Array<{ name: string; status: string; images: number; docs: number; fields: number }> = [];

    for (const project of projectsToProcess) {
      try {
        console.log(`[bulk-enrich] Fetching Reelly data for: ${project.name} (reelly_id: ${project.reelly_id})`);
        const reellyData = await fetchReellyProject(project.reelly_id, reellyApiKey);

        if (!reellyData) {
          console.warn(`[bulk-enrich] No Reelly data for ${project.name}`);
          results.push({ name: project.name, status: "no_data", images: 0, docs: 0, fields: 0 });
          totalErrors++;
          errorDetails.push(`${project.name}: No data from Reelly API`);
          continue;
        }

        // Extract all enrichment data
        const gallery = extractGalleryImages(reellyData);
        const documents = extractDocuments(reellyData);
        const floorPlans = extractFloorPlans(reellyData);
        const amenities = extractAmenities(reellyData);
        const unitTypes = extractUnitTypes(reellyData);
        const { video_url } = extractVideos(reellyData);

        let imagesAdded = 0;
        let docsAdded = 0;
        let fieldsUpdated = 0;

        // 1. Insert gallery images
        if (gallery.length > 0) {
          // Get existing image URLs to avoid duplicates
          const { data: existingImgs } = await supabase
            .from("project_images")
            .select("image_url")
            .eq("project_id", project.id);
          const existingUrls = new Set((existingImgs || []).map((i: any) => i.image_url));
          const { count: existingCount } = await supabase
            .from("project_images")
            .select("id", { count: "exact", head: true })
            .eq("project_id", project.id);

          const newImages = gallery
            .filter(img => !existingUrls.has(img.url))
            .map((img, i) => ({
              project_id: project.id,
              image_url: img.url,
              alt_text: img.alt_text || `${project.name} image ${i + 1}`,
              display_order: (existingCount || 0) + i,
              data_source: "reelly_bulk_enrich",
            }));

          if (newImages.length > 0) {
            const { error: imgErr } = await supabase
              .from("project_images")
              .insert(newImages);

            if (imgErr) {
              errorDetails.push(`${project.name}: image insert - ${imgErr.message}`);
            } else {
              imagesAdded = newImages.length;
            }
          }
        }

        // 2. Insert documents
        if (documents.length > 0) {
          const newDocs = documents.map((doc, i) => ({
            project_id: project.id,
            file_url: doc.url,
            document_type: doc.type || "brochure",
            file_name: doc.name || doc.type || "Document",
            data_source: "reelly_bulk_enrich",
            display_order: i,
          }));

          const { error: docErr, data: docData } = await supabase
            .from("project_documents")
            .insert(newDocs)
            .select("id");

          if (docErr) {
            // Try individual inserts on conflict
            let inserted = 0;
            for (const doc of newDocs) {
              const { error: singleErr } = await supabase.from("project_documents").insert(doc);
              if (!singleErr) inserted++;
            }
            docsAdded = inserted;
          } else {
            docsAdded = docData?.length || documents.length;
          }
        }

        // 3. Update project fields (non-destructive: only fill empty fields)
        const updates: Record<string, any> = {};
        const existingAmenities = (project.amenities as any[]) || [];
        const existingFaqs = (project.faqs as any[]) || [];
        const existingFloorPlans = (project.floor_plan_types as any[]) || [];
        const existingUnitTypes = (project.unit_types as any[]) || [];
        const existingHighlights = (project.highlights as any[]) || [];
        const existingUsp = (project.usp_bullets as any[]) || [];

        if (amenities.length > 0 && existingAmenities.length === 0) updates.amenities = amenities;
        if (unitTypes.length > 0 && existingUnitTypes.length === 0) updates.unit_types = unitTypes;
        if (floorPlans.length > 0 && existingFloorPlans.length === 0) updates.floor_plan_types = floorPlans;
        if (video_url && !project.video_url) updates.video_url = video_url;
        if (!project.description && reellyData.overview) updates.description = reellyData.overview;

        // FAQs
        if (reellyData.faqs && Array.isArray(reellyData.faqs) && existingFaqs.length === 0) {
          const faqs = reellyData.faqs.filter((f: any) => f?.question && f?.answer);
          if (faqs.length > 0) updates.faqs = faqs;
        }

        // Highlights
        if (reellyData.highlights && Array.isArray(reellyData.highlights) && existingHighlights.length === 0) {
          const highlights = reellyData.highlights
            .map((h: any) => typeof h === 'string' ? h : h?.text)
            .filter(Boolean);
          if (highlights.length > 0) updates.highlights = highlights;
        }

        // USP bullets from highlights if empty
        if (existingUsp.length === 0 && reellyData.highlights?.length > 0) {
          const usp = reellyData.highlights
            .map((h: any) => typeof h === 'string' ? h : h?.text)
            .filter(Boolean);
          if (usp.length > 0) updates.usp_bullets = usp;
        }

        // Payment plan
        if (!project.payment_plan && reellyData.payment_plan) {
          updates.payment_plan = reellyData.payment_plan.name || reellyData.payment_plan.description || JSON.stringify(reellyData.payment_plan);
          if (reellyData.payment_plan.milestones && Array.isArray(reellyData.payment_plan.milestones)) {
            updates.payment_breakdown = reellyData.payment_plan.milestones;
          }
        }

        // Location distances
        if (!(project.location_distances as any[])?.length) {
          if (reellyData.location_distances && Array.isArray(reellyData.location_distances)) {
            updates.location_distances = reellyData.location_distances;
          } else if (reellyData.nearby_places && Array.isArray(reellyData.nearby_places)) {
            updates.location_distances = reellyData.nearby_places.map((p: any) => ({ label: p.name, time: p.distance })).filter((d: any) => d.label && d.time);
          }
        }

        // Numeric fields
        if (reellyData.service_charge != null && project.service_charge == null) updates.service_charge = reellyData.service_charge;
        if (reellyData.roi_estimate != null && project.roi_estimate == null) updates.roi_estimate = reellyData.roi_estimate;

        if (Object.keys(updates).length > 0) {
          const { error: updateErr } = await supabase.from("projects").update(updates).eq("id", project.id);
          if (updateErr) {
            errorDetails.push(`${project.name}: update - ${updateErr.message}`);
          } else {
            fieldsUpdated = Object.keys(updates).length;
          }
        }

        totalImagesAdded += imagesAdded;
        totalDocsAdded += docsAdded;
        totalFieldsUpdated += fieldsUpdated;

        results.push({
          name: project.name,
          status: "success",
          images: imagesAdded,
          docs: docsAdded,
          fields: fieldsUpdated,
        });

        console.log(`[bulk-enrich] ${project.name}: +${imagesAdded} images, +${docsAdded} docs, +${fieldsUpdated} fields`);
      } catch (err) {
        totalErrors++;
        const msg = err instanceof Error ? err.message : String(err);
        errorDetails.push(`${project.name}: ${msg}`);
        results.push({ name: project.name, status: "error", images: 0, docs: 0, fields: 0 });
        console.error(`[bulk-enrich] Error for ${project.name}:`, msg);
      }

      // Throttle between API calls (1 second)
      await sleep(1000);
    }

    const summary = {
      success: true,
      processed: projectsToProcess.length,
      images_added: totalImagesAdded,
      docs_added: totalDocsAdded,
      fields_updated: totalFieldsUpdated,
      errors: totalErrors,
      error_details: errorDetails.length > 0 ? errorDetails : undefined,
      results,
    };

    console.log(`[bulk-enrich] Done. Processed=${summary.processed}, Images=${summary.images_added}, Docs=${summary.docs_added}, Fields=${summary.fields_updated}, Errors=${summary.errors}`);

    return json(200, summary);
  } catch (err) {
    console.error("[bulk-enrich] Fatal error:", err);
    return json(500, { error: err instanceof Error ? err.message : String(err) });
  }
});
