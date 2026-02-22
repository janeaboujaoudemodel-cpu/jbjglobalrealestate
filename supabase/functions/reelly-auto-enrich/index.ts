import { createClient } from "npm:@supabase/supabase-js@2";
import {
  corsHeaders, REELLY_API_BASE,
  extractGalleryImages, extractVideos, extractDocuments, extractFloorPlans, extractAmenities, extractUnitTypes, extractAmenityImages
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
    { headers: { "X-API-Key": apiKey, "Authorization": `Bearer ${apiKey}`, "Accept": "application/json" } }
  );
  if (!res.ok) return null;
  const data = await res.json();
  return data?.data || data;
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Auto-batch enrichment: processes projects in small batches within a single invocation.
 * Designed to stay within edge function time limits (~25s safe window).
 * Stores progress so it can be called repeatedly to process all projects.
 */
Deno.serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });

  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const reellyApiKey = Deno.env.get("REELLY_API_KEY") || "";

  if (!supabaseUrl || !supabaseKey || !reellyApiKey) {
    return json(500, { error: "Missing config" });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const startTime = Date.now();
  const MAX_RUNTIME_MS = 22_000; // Stay well within 25s limit

  try {
    const body = await req.json().catch(() => ({}));
    const action = body.action || "run";
    const forceRefresh = body.force_refresh || false;
    const batchSize = Math.min(body.batch_size || 8, 15);

    // ── Stats ──
    if (action === "stats") {
      const { count: totalWithReelly } = await supabase
        .from("projects")
        .select("id", { count: "exact", head: true })
        .eq("is_published", true)
        .not("reelly_id", "is", null);

      const { data: projectsWithDocs } = await supabase
        .from("project_documents")
        .select("project_id")
        .limit(5000);
      const uniqueWithDocs = new Set((projectsWithDocs || []).map((d: any) => d.project_id)).size;

      const { count: totalImages } = await supabase
        .from("project_images")
        .select("id", { count: "exact", head: true });

      const { count: totalDocs } = await supabase
        .from("project_documents")
        .select("id", { count: "exact", head: true });

      return json(200, {
        success: true,
        total_projects: totalWithReelly || 0,
        enriched: uniqueWithDocs,
        remaining: (totalWithReelly || 0) - uniqueWithDocs,
        total_images: totalImages || 0,
        total_documents: totalDocs || 0,
      });
    }

    // ── Get candidates ──
    const { data: allProjects } = await supabase
      .from("projects")
      .select("id, name, slug, reelly_id, amenities, amenity_images, usp_bullets, location_distances, description, cover_image_url, faqs, floor_plan_types, payment_plan, payment_breakdown, unit_types, video_url, highlights, service_charge, roi_estimate")
      .eq("is_published", true)
      .not("reelly_id", "is", null)
      .order("created_at", { ascending: true })
      .limit(2000);

    if (!allProjects || allProjects.length === 0) {
      return json(200, { success: true, message: "No projects found", processed: 0 });
    }

    // Filter to only those needing enrichment
    let candidates = allProjects;
    if (!forceRefresh) {
      // Get all project IDs that already have images (means we fetched API data for them)
      const { data: imgData } = await supabase.from("project_images").select("project_id").limit(10000);
      const projectsWithImages = new Set((imgData || []).map((d: any) => d.project_id));
      
      const { data: docsData } = await supabase.from("project_documents").select("project_id").limit(5000);
      const projectsWithDocs = new Set((docsData || []).map((d: any) => d.project_id));
      
      // A project is "done" if it has BOTH images and documents, OR if it has images and all key fields filled
      candidates = allProjects.filter((p: any) => {
        const hasImages = projectsWithImages.has(p.id);
        const hasDocs = projectsWithDocs.has(p.id);
        // If it has both images and docs, it's fully enriched
        if (hasImages && hasDocs) return false;
        // If it has images and all key fields, skip it (API just didn't have docs)
        if (hasImages && p.amenities?.length && p.description) return false;
        return true;
      });
    }

    if (candidates.length === 0) {
      return json(200, { success: true, message: "All projects fully enriched", processed: 0, remaining: 0 });
    }

    console.log(`[auto-enrich] ${candidates.length} projects need enrichment. Processing up to ${batchSize} within time limit.`);

    let processed = 0;
    let imagesAdded = 0;
    let docsAdded = 0;
    let fieldsUpdated = 0;
    let errors = 0;
    const results: Array<{ name: string; status: string; images: number; docs: number; fields: number }> = [];

    for (const project of candidates) {
      // Check time budget
      if (Date.now() - startTime > MAX_RUNTIME_MS) {
        console.log(`[auto-enrich] Time limit reached after ${processed} projects`);
        break;
      }
      if (processed >= batchSize) break;

      try {
        const reellyData = await fetchReellyProject(project.reelly_id, reellyApiKey);
        if (!reellyData) {
          results.push({ name: project.name, status: "no_api_data", images: 0, docs: 0, fields: 0 });
          processed++;
          continue;
        }

        const gallery = extractGalleryImages(reellyData);
        const documents = extractDocuments(reellyData);
        const floorPlans = extractFloorPlans(reellyData);
        const amenities = extractAmenities(reellyData);
        const unitTypes = extractUnitTypes(reellyData);
        const videoUrl = extractVideos(reellyData).video_url;

        let pImages = 0, pDocs = 0, pFields = 0;

        // 1. Images
        if (gallery.length > 0) {
          const { data: existing } = await supabase.from("project_images").select("image_url").eq("project_id", project.id);
          const existingUrls = new Set((existing || []).map((i: any) => i.image_url));
          const { count: existingCount } = await supabase.from("project_images").select("id", { count: "exact", head: true }).eq("project_id", project.id);
          const newImages = gallery.filter(img => !existingUrls.has(img.url)).map((img, i) => ({
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
          const newDocs = documents.filter(d => !existingDocUrls.has(d.url)).map((doc, i) => ({
            project_id: project.id, file_url: doc.url, document_type: doc.type || "brochure",
            file_name: doc.name || "Document", data_source: "auto_enrich", display_order: i,
          }));
          if (newDocs.length > 0) {
            for (const doc of newDocs) {
              const { error: err } = await supabase.from("project_documents").insert(doc);
              if (!err) pDocs++;
            }
          }
        }

        // 3. Update project fields (non-destructive fill)
        const updates: Record<string, any> = {};
        if (amenities.length > 0 && !(project.amenities as any[])?.length) updates.amenities = amenities;
        // Extract and store amenity images (real photos from Reelly)
        const amenityImages = extractAmenityImages(reellyData);
        if (Object.keys(amenityImages).length > 0 && !project.amenity_images) updates.amenity_images = amenityImages;
        if (unitTypes.length > 0 && !(project.unit_types as any[])?.length) updates.unit_types = unitTypes;
        if (floorPlans.length > 0 && !(project.floor_plan_types as any[])?.length) updates.floor_plan_types = floorPlans;
        if (videoUrl && !project.video_url) updates.video_url = videoUrl;
        if (!project.description && reellyData?.overview) updates.description = reellyData.overview;
        if (reellyData?.faqs?.length > 0 && !(project.faqs as any[])?.length) {
          updates.faqs = reellyData.faqs.filter((f: any) => f?.question && f?.answer);
        }
        if (reellyData?.highlights?.length > 0 && !(project.highlights as any[])?.length) {
          updates.highlights = reellyData.highlights.map((h: any) => typeof h === 'string' ? h : h?.text).filter(Boolean);
        }
        if (!(project.usp_bullets as any[])?.length && reellyData?.highlights?.length > 0) {
          updates.usp_bullets = reellyData.highlights.map((h: any) => typeof h === 'string' ? h : h?.text).filter(Boolean);
        }
        if (!project.payment_plan && reellyData?.payment_plan) {
          updates.payment_plan = reellyData.payment_plan.name || reellyData.payment_plan.description || JSON.stringify(reellyData.payment_plan);
          if (reellyData.payment_plan.milestones?.length) updates.payment_breakdown = reellyData.payment_plan.milestones;
        }
        if (!(project.location_distances as any[])?.length) {
          if (reellyData?.location_distances?.length) updates.location_distances = reellyData.location_distances;
          else if (reellyData?.nearby_places?.length) {
            updates.location_distances = reellyData.nearby_places.map((p: any) => ({ label: p.name, time: p.distance })).filter((d: any) => d.label && d.time);
          }
        }
        if (reellyData?.service_charge != null && project.service_charge == null) updates.service_charge = reellyData.service_charge;
        if (reellyData?.roi_estimate != null && project.roi_estimate == null) updates.roi_estimate = reellyData.roi_estimate;

        if (Object.keys(updates).length > 0) {
          const { error: err } = await supabase.from("projects").update(updates).eq("id", project.id);
          if (!err) pFields = Object.keys(updates).length;
        }

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

      await sleep(800);
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
});
