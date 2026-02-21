import { createClient } from "npm:@supabase/supabase-js@2";
import {
  corsHeaders, REELLY_API_BASE, ReellyProject,
  extractGalleryImages, extractVideos, extractDocuments, extractFloorPlans,
  extractAmenities, extractUnitTypes, fetchReellyWithRetry,
} from "../_shared/reelly-types.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const STORAGE_BUCKET = "project-media";

// ── Fetch a single project detail from Reelly API ────────────────────────────
async function fetchDetail(apiKey: string, id: number): Promise<ReellyProject | null> {
  try {
    const res = await fetchReellyWithRetry(`${REELLY_API_BASE}/${id}`, apiKey);
    if (!res.ok) {
      console.warn(`[reelly-complete-offline-save] ID ${id} returned ${res.status}`);
      return null;
    }
    return res.json();
  } catch (e) {
    console.error(`[reelly-complete-offline-save] fetchDetail error for ${id}:`, e);
    return null;
  }
}

// ── Mirror an image URL to Supabase Storage ───────────────────────────────────
async function mirrorImage(
  supabase: ReturnType<typeof createClient>,
  imageUrl: string,
  reellyId: number,
  filename: string,
): Promise<string | null> {
  try {
    const res = await fetch(imageUrl, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) return null;
    const buffer = await res.arrayBuffer();
    const contentType = res.headers.get("content-type") || "image/jpeg";
    const ext = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg";
    const path = `projects/${reellyId}/${filename}.${ext}`;

    const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(path, buffer, {
      contentType,
      upsert: true,
    });
    if (error) {
      console.warn(`[mirrorImage] Upload failed for ${path}:`, error.message);
      return null;
    }
    const { data: { publicUrl } } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
    return publicUrl;
  } catch (e) {
    console.warn(`[mirrorImage] Error for ${imageUrl}:`, e);
    return null;
  }
}

// ── Mirror a document/brochure to Supabase Storage ────────────────────────────
async function mirrorDocument(
  supabase: ReturnType<typeof createClient>,
  docUrl: string,
  reellyId: number,
  filename: string,
): Promise<string | null> {
  try {
    // Convert Google Drive sharing links to direct download
    let downloadUrl = docUrl;
    if (docUrl.includes("drive.google.com")) {
      const match = docUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
      if (match) downloadUrl = `https://drive.google.com/uc?export=download&id=${match[1]}`;
    }

    const res = await fetch(downloadUrl, { signal: AbortSignal.timeout(30000) });
    if (!res.ok) return null;
    const buffer = await res.arrayBuffer();
    if (buffer.byteLength < 100) return null; // Skip empty/tiny files

    const contentType = res.headers.get("content-type") || "application/pdf";
    let ext = "pdf";
    if (contentType.includes("doc")) ext = "docx";
    else if (contentType.includes("xlsx") || contentType.includes("spreadsheet")) ext = "xlsx";

    const safeName = filename.replace(/[^a-z0-9_-]/gi, "_").slice(0, 60);
    const path = `projects/${reellyId}/docs/${safeName}.${ext}`;

    const { error } = await supabase.storage.from(STORAGE_BUCKET).upload(path, buffer, {
      contentType,
      upsert: true,
    });
    if (error) {
      console.warn(`[mirrorDocument] Upload failed for ${path}:`, error.message);
      return null;
    }
    const { data: { publicUrl } } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
    return publicUrl;
  } catch (e) {
    console.warn(`[mirrorDocument] Error for ${docUrl}:`, e);
    return null;
  }
}

// ── Compute bedrooms_min / bedrooms_max from unit_types array ──────────────────
function computeBedroomRange(units: ReturnType<typeof extractUnitTypes>): { min: number | null; max: number | null } {
  const bedroomValues = units
    .map(u => u.bedrooms)
    .filter((b): b is number => b != null && !isNaN(b));

  if (!bedroomValues.length) return { min: null, max: null };
  return {
    min: Math.min(...bedroomValues),
    max: Math.max(...bedroomValues),
  };
}

// ── Compute price range from unit_types ────────────────────────────────────────
function computePriceRange(units: ReturnType<typeof extractUnitTypes>, projectMinPrice: number, projectMaxPrice: number): { from: number | null; to: number | null } {
  const prices = units.flatMap(u => [u.price_from, u.price_to]).filter((p): p is number => p != null && p > 0);
  const fallbackFrom = projectMinPrice > 0 ? projectMinPrice : null;
  const fallbackTo   = projectMaxPrice > 0 ? projectMaxPrice : null;
  if (!prices.length) return { from: fallbackFrom, to: fallbackTo };
  return { from: Math.min(...prices), to: Math.max(...prices) };
}

// ── Check if a URL is already mirrored to our storage ─────────────────────────
function isLocalUrl(url: string): boolean {
  return url.includes("mdafrewypkkrildjgtey") || url.includes("supabase");
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN HANDLER
// ─────────────────────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("REELLY_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ success: false, error: "REELLY_API_KEY not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const body = await req.json().catch(() => ({}));
    const mode = body.mode || "batch";
    const batchSize = Math.min(body.batch_size || 20, 50);
    const mirrorImages = body.mirror_images !== false; // default true
    const projectIds: number[] = body.project_ids || [];

    // ── "specific" mode: process given reelly IDs ─────────────────────────────
    if (mode === "specific" && projectIds.length) {
      const results = { updated: 0, failed: 0, imagesStored: 0, docsStored: 0 };

      for (const reellyId of projectIds.slice(0, batchSize)) {
        const { data: dbProject } = await supabase
          .from("projects")
          .select("id")
          .eq("reelly_id", reellyId)
          .maybeSingle();

        if (!dbProject?.id) {
          console.warn(`[specific] No DB project found for reelly_id ${reellyId}`);
          results.failed++;
          continue;
        }

        const detail = await fetchDetail(apiKey, reellyId);
        if (!detail) {
          console.error(`[specific] No API detail for reelly_id ${reellyId}`);
          results.failed++;
          continue;
        }

        try {
          const updateData = await buildUpdateData(supabase, detail, reellyId, mirrorImages, results, dbProject.id);
          console.log(`[specific] Updating project ${dbProject.id} (reelly_id ${reellyId}) with: ${Object.keys(updateData).join(", ")}`);
          const { error } = await supabase.from("projects").update(updateData).eq("id", dbProject.id);
          if (error) {
            console.error(`[specific] Update error for project ${dbProject.id}:`, error.message);
            results.failed++;
          } else {
            console.log(`[specific] Successfully updated project ${dbProject.id}`);
            results.updated++;
          }
        } catch (buildErr: any) {
          console.error(`[specific] buildUpdateData error for reelly_id ${reellyId}:`, buildErr.message);
          results.failed++;
        }
        await new Promise(r => setTimeout(r, 300));
      }

      return new Response(JSON.stringify({ success: true, mode: "specific", ...results }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── "test" mode: single project to verify extraction ─────────────────────
    if (mode === "test") {
      const { data: sample } = await supabase.from("projects")
        .select("reelly_id, name")
        .not("reelly_id", "is", null)
        .eq("is_published", true)
        .limit(1)
        .single();

      if (!sample?.reelly_id) {
        return new Response(JSON.stringify({ success: true, message: "No Reelly projects found" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const detail = await fetchDetail(apiKey, sample.reelly_id);
      if (!detail) {
        return new Response(JSON.stringify({ success: false, error: `Failed to fetch detail for reelly_id ${sample.reelly_id}` }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const units = extractUnitTypes(detail);
      const amenities = extractAmenities(detail);
      const images = extractGalleryImages(detail);
      const docs = extractDocuments(detail);
      const floors = extractFloorPlans(detail);
      const bedrooms = computeBedroomRange(units);
      const prices = computePriceRange(units, detail.min_price, detail.max_price);

      return new Response(JSON.stringify({
        success: true,
        reelly_id: sample.reelly_id,
        project_name: sample.name,
        extracted: {
          images_count: images.length,
          documents_count: docs.length,
          floor_plans_count: floors.length,
          amenities_count: amenities.length,
          unit_types_count: units.length,
          bedrooms_min: bedrooms.min,
          bedrooms_max: bedrooms.max,
          price_from: prices.from,
          price_to: prices.to,
          has_cover: !!detail.cover_image?.url,
          has_videos: detail.video_reviews?.length > 0,
        },
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ── "raw_diagnostic" mode: show raw API response for units ──────────────
    if (mode === "raw_diagnostic" && projectIds.length) {
      const detail = await fetchDetail(apiKey, projectIds[0]);
      if (!detail) {
        return new Response(JSON.stringify({ success: false, error: "Failed to fetch" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({
        success: true,
        reelly_id: projectIds[0],
        raw_units: detail.units || null,
        raw_unit_types: detail.unit_types || null,
        raw_typical_units: detail.typical_units || null,
        raw_buildings: detail.buildings?.slice(0, 2) || null,
        extracted_unit_types: extractUnitTypes(detail),
        project_min_price: detail.min_price,
        project_max_price: detail.max_price,
        project_min_size: detail.min_size,
        project_max_size: detail.max_size,
        units_count: detail.units_count,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ── "batch" mode (default): process projects with ANY missing data ────────
    // Expanded query: missing bedrooms, price, cover, amenities, unit_types, or external cover URLs
    const { data: projects } = await supabase
      .from("projects")
      .select("id, reelly_id, name, cover_image_url, bedrooms_min, price_from, amenities, unit_types")
      .not("reelly_id", "is", null)
      .eq("is_published", true)
      .or("cover_image_url.is.null,bedrooms_min.is.null,price_from.is.null,amenities.is.null,unit_types.is.null")
      .limit(batchSize);

    if (!projects?.length) {
      // Secondary: find projects with external (non-local) cover images to mirror
      const { data: externalProjects } = await supabase
        .from("projects")
        .select("id, reelly_id, name, cover_image_url")
        .not("reelly_id", "is", null)
        .eq("is_published", true)
        .not("cover_image_url", "like", "%mdafrewypkkrildjgtey%")
        .not("cover_image_url", "is", null)
        .limit(batchSize);

      if (!externalProjects?.length) {
        return new Response(JSON.stringify({ success: true, message: "All projects have complete local data", processed: 0 }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const results = { updated: 0, failed: 0, imagesStored: 0, docsStored: 0 };
      for (const project of externalProjects) {
        const detail = await fetchDetail(apiKey, project.reelly_id);
        if (!detail) { results.failed++; continue; }
        const updateData = await buildUpdateData(supabase, detail, project.reelly_id, true, results, project.id);
        const { error } = await supabase.from("projects").update(updateData).eq("id", project.id);
        if (error) { console.error(`[batch-mirror] Update error for ${project.id}:`, error.message); results.failed++; } else results.updated++;
        await new Promise(r => setTimeout(r, 300));
      }
      return new Response(JSON.stringify({ success: true, mode: "batch-mirror-external", ...results }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const results = { updated: 0, failed: 0, imagesStored: 0, docsStored: 0, processed: projects.length };
    for (const project of projects) {
      const detail = await fetchDetail(apiKey, project.reelly_id);
      if (!detail) { results.failed++; continue; }
      const updateData = await buildUpdateData(supabase, detail, project.reelly_id, mirrorImages, results, project.id);
      const { error } = await supabase.from("projects").update(updateData).eq("id", project.id);
      if (error) { console.error(`[batch] Update error for ${project.id}:`, error.message); results.failed++; } else results.updated++;
      await new Promise(r => setTimeout(r, 300));
    }

    return new Response(JSON.stringify({ success: true, mode: "batch", ...results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (e: any) {
    console.error("[reelly-complete-offline-save] Fatal error:", e);
    return new Response(JSON.stringify({ success: false, error: e.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// BUILD UPDATE DATA — Only updates valid `projects` columns.
// Images go into project_images table; documents into project_documents table.
// Floor plans mirrored to storage and saved in floor_plan_types column.
// ─────────────────────────────────────────────────────────────────────────────

async function buildUpdateData(
  supabase: ReturnType<typeof createClient>,
  detail: ReellyProject,
  reellyId: number,
  mirrorImages: boolean,
  results: { imagesStored: number; docsStored?: number },
  projectId?: string,
): Promise<Record<string, unknown>> {
  const units     = extractUnitTypes(detail);
  const amenities = extractAmenities(detail);
  const images    = extractGalleryImages(detail);
  const docs      = extractDocuments(detail);
  const floors    = extractFloorPlans(detail);
  const videos    = extractVideos(detail);
  const bedrooms  = computeBedroomRange(units);
  const prices    = computePriceRange(units, detail.min_price, detail.max_price);

  // ── Only columns that exist in the `projects` table ───────────────────────
  const updateData: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (units.length)            updateData.unit_types    = units;
  if (bedrooms.min != null)    updateData.bedrooms_min  = bedrooms.min;
  if (bedrooms.max != null)    updateData.bedrooms_max  = bedrooms.max;
  if (detail.min_size > 0)     updateData.size_min      = detail.min_size;
  if (detail.max_size > 0)     updateData.size_max      = detail.max_size;
  if (prices.from != null)     updateData.price_from    = prices.from;
  if (prices.to   != null)     updateData.price_to      = prices.to;
  if (amenities.length)        updateData.amenities     = amenities;
  if (videos.video_url)        updateData.video_url     = videos.video_url;
  if (videos.video_urls.length) updateData.video_urls   = videos.video_urls;
  if ((detail as any).highlights?.length) updateData.highlights = (detail as any).highlights;
  if ((detail as any).faqs?.length)       updateData.faqs       = (detail as any).faqs;

  // ── Cover image — always mirror to local storage ───────────────────────────
  const coverUrl = detail.cover_image?.url;
  if (mirrorImages && coverUrl) {
    const mirrored = await mirrorImage(supabase, coverUrl, reellyId, "cover");
    updateData.cover_image_url = mirrored || coverUrl;
    if (mirrored) results.imagesStored++;
  } else if (coverUrl) {
    updateData.cover_image_url = coverUrl;
  } else if (images.length) {
    updateData.cover_image_url = images[0].url;
  }

  // ── Sync gallery images into project_images table (mirror each to storage) ─
  if (projectId && images.length) {
    const imageRows: Array<{ project_id: string; image_url: string; alt_text: string; display_order: number }> = [];
    let i = 0;
    for (const img of images.slice(0, 20)) {
      let finalUrl = img.url;
      if (mirrorImages && !isLocalUrl(finalUrl)) {
        const mirrored = await mirrorImage(supabase, img.url, reellyId, `img-${i}`);
        if (mirrored) { finalUrl = mirrored; results.imagesStored++; }
      }
      imageRows.push({ project_id: projectId, image_url: finalUrl, alt_text: img.alt_text || "", display_order: i });
      i++;
      await new Promise(r => setTimeout(r, 80));
    }
    await supabase.from("project_images").delete().eq("project_id", projectId);
    if (imageRows.length) {
      const { error: imgErr } = await supabase.from("project_images").insert(imageRows);
      if (imgErr) console.warn(`[buildUpdateData] project_images insert error for project ${projectId}:`, imgErr.message);
      else console.log(`[buildUpdateData] Inserted ${imageRows.length} images for project ${projectId}`);
    }
  }

  // ── Sync documents/brochures — mirror to storage ───────────────────────────
  if (projectId && docs.length) {
    await supabase.from("project_documents").delete().eq("project_id", projectId);
    const docRows: Array<{ project_id: string; file_url: string; file_name: string; document_type: string; display_order: number }> = [];

    for (let idx = 0; idx < Math.min(docs.length, 20); idx++) {
      const doc = docs[idx];
      let finalUrl = doc.url;
      if (mirrorImages && finalUrl && !isLocalUrl(finalUrl)) {
        const mirrored = await mirrorDocument(supabase, finalUrl, reellyId, `doc-${idx}-${doc.name?.replace(/[^a-z0-9]/gi, '_') || idx}`);
        if (mirrored) {
          finalUrl = mirrored;
          if (results.docsStored != null) results.docsStored++;
        }
      }
      if (finalUrl) {
        docRows.push({
          project_id: projectId,
          file_url: finalUrl,
          file_name: doc.name || `Document ${idx + 1}`,
          document_type: doc.type || "brochure",
          display_order: idx,
        });
      }
    }

    if (docRows.length) {
      const { error: docErr } = await supabase.from("project_documents").insert(docRows);
      if (docErr) console.warn(`[buildUpdateData] project_documents insert error for project ${projectId}:`, docErr.message);
      else console.log(`[buildUpdateData] Inserted ${docRows.length} documents for project ${projectId}`);
    }
  }

  // ── Mirror floor plan images to storage and save in floor_plan_types ───────
  if (floors.length) {
    const mirroredFloors: Array<{ type: string; url: string; label: string; bedrooms?: number }> = [];

    for (let idx = 0; idx < Math.min(floors.length, 20); idx++) {
      const fp = floors[idx];
      let finalUrl = fp.url;
      if (mirrorImages && finalUrl && !isLocalUrl(finalUrl)) {
        const mirrored = await mirrorImage(supabase, finalUrl, reellyId, `floorplan-${idx}`);
        if (mirrored) { finalUrl = mirrored; results.imagesStored++; }
      }
      mirroredFloors.push({ ...fp, url: finalUrl });

      // Also insert floor plans as documents for easy download
      if (projectId && finalUrl) {
        await supabase.from("project_documents").upsert({
          project_id: projectId,
          file_url: finalUrl,
          file_name: fp.label || `Floor Plan ${idx + 1}`,
          document_type: "floor_plan",
          display_order: 100 + idx,
        }, { onConflict: "project_id,file_url", ignoreDuplicates: true }).then(() => {});
      }
    }

    updateData.floor_plan_types = mirroredFloors;
  }

  // ── Mirror unit type layout URLs to storage ────────────────────────────────
  if (mirrorImages && units.length) {
    for (let idx = 0; idx < units.length; idx++) {
      const u = units[idx];
      if (u.layout_url && !isLocalUrl(u.layout_url)) {
        const mirrored = await mirrorImage(supabase, u.layout_url, reellyId, `layout-${idx}`);
        if (mirrored) { u.layout_url = mirrored; results.imagesStored++; }
      }
    }
    // Re-set unit_types with mirrored layout URLs
    updateData.unit_types = units;
  }

  return updateData;
}
