import { createClient } from "npm:@supabase/supabase-js@2";
import {
  corsHeaders,
  REELLY_API_BASE,
  ReellyProject,
  extractGalleryImages,
  extractVideos,
  extractDocuments,
  extractFloorPlans,
  extractAmenities,
  extractUnitTypes,
} from "../_shared/reelly-types.ts";

/**
 * Reelly Backfill Projects
 * 
 * This function backfills missing detail data (floor plans, amenities, documents, etc.)
 * directly into the approved `projects` table. It's designed to fix the data gap
 * where projects were approved before detail enrichment was run.
 * 
 * Modes:
 * - "batch": Process a batch of projects missing data (default: 50)
 * - "all": Process ALL projects with missing data in batches
 * - "specific": Process specific project IDs only
 * - "stats": Return counts of projects needing backfill
 */

interface BackfillRequest {
  mode?: "batch" | "all" | "specific" | "stats";
  batch_size?: number;
  project_ids?: string[];
  force_refresh?: boolean; // Overwrite existing data
  job_id?: string; // For resumable sync tracking
  started_at?: string; // Timestamp cursor for force_refresh progress tracking
}

interface BackfillResponse {
  success: boolean;
  mode?: string;
  processed?: number;
  updated?: number;
  failed?: number;
  remaining?: number;
  stats?: {
    total_projects: number;
    missing_floor_plans: number;
    missing_amenities: number;
    missing_documents: number;
    missing_any: number;
  };
  errors?: string[];
  job_id?: string;
  message?: string;
  error?: string;
}

async function fetchProjectDetail(apiKey: string, reelyId: number): Promise<ReellyProject | null> {
  try {
    const res = await fetch(`${REELLY_API_BASE}/${reelyId}`, {
      headers: { "X-API-Key": apiKey, "Authorization": `Bearer ${apiKey}`, "Accept": "application/json" },
    });
    if (!res.ok) {
      console.error(`Failed to fetch project ${reelyId}: ${res.status}`);
      return null;
    }
    return res.json();
  } catch (err) {
    console.error(`Error fetching project ${reelyId}:`, err);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("REELLY_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: "REELLY_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body: BackfillRequest = await req.json().catch(() => ({}));
    const mode = body.mode || "batch";
    const batchSize = Math.min(body.batch_size || 50, 100);
    const forceRefresh = body.force_refresh || false;
    const specificIds = body.project_ids || [];
    const startedAt = body.started_at || new Date().toISOString();

    // Stats mode - just return counts
    if (mode === "stats") {
      const { count: totalProjects } = await supabase
        .from("projects")
        .select("*", { count: "exact", head: true })
        .not("reelly_id", "is", null);

      const { count: missingFloorPlans } = await supabase
        .from("projects")
        .select("*", { count: "exact", head: true })
        .not("reelly_id", "is", null)
        .or("floor_plan_types.is.null,floor_plan_types.eq.[]");

      const { count: missingAmenities } = await supabase
        .from("projects")
        .select("*", { count: "exact", head: true })
        .not("reelly_id", "is", null)
        .or("amenities.is.null,amenities.eq.{}");

      // Count projects missing documents (check project_documents table)
      const { data: projectsWithDocs } = await supabase
        .from("project_documents")
        .select("project_id")
        .limit(10000);
      const projectIdsWithDocs = new Set((projectsWithDocs || []).map((d: any) => d.project_id));
      
      const { data: allReelyProjects } = await supabase
        .from("projects")
        .select("id")
        .not("reelly_id", "is", null);
      const missingDocuments = (allReelyProjects || []).filter((p: any) => !projectIdsWithDocs.has(p.id)).length;

      // Count projects not yet fetched from detail API
      const { count: missingAny } = await supabase
        .from("projects")
        .select("*", { count: "exact", head: true })
        .not("reelly_id", "is", null)
        .is("detail_fetched_at", null);

      return new Response(
        JSON.stringify({
          success: true,
          mode: "stats",
          stats: {
            total_projects: totalProjects || 0,
            missing_floor_plans: missingFloorPlans || 0,
            missing_amenities: missingAmenities || 0,
            missing_documents: missingDocuments || 0,
            missing_any: missingAny || 0,
          },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Specific mode - process only given project IDs
    if (mode === "specific" && specificIds.length > 0) {
      const { data: projects } = await supabase
        .from("projects")
        .select("id, reelly_id, name")
        .in("id", specificIds)
        .not("reelly_id", "is", null);

      if (!projects?.length) {
        return new Response(
          JSON.stringify({ success: true, message: "No valid projects found", processed: 0, updated: 0 }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      let updated = 0;
      let failed = 0;
      const errors: string[] = [];

      for (const project of projects) {
        const detail = await fetchProjectDetail(apiKey, project.reelly_id);
        if (!detail) {
          failed++;
          errors.push(`Failed to fetch ${project.name} (ID: ${project.reelly_id})`);
          continue;
        }

        const updateResult = await updateProjectWithDetails(supabase, project.id, detail, forceRefresh);
        if (updateResult.success) {
          updated++;
        } else {
          failed++;
          errors.push(updateResult.error || `Failed to update ${project.name}`);
        }

        // Rate limiting
        await new Promise((r) => setTimeout(r, 200));
      }

      return new Response(
        JSON.stringify({
          success: true,
          mode: "specific",
          processed: projects.length,
          updated,
          failed,
          errors: errors.slice(0, 10),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Batch/All mode - find projects missing data
    let query = supabase
      .from("projects")
      .select("id, reelly_id, name, slug, floor_plan_types, amenities")
      .not("reelly_id", "is", null);

    if (!forceRefresh) {
      // Only get projects not yet fetched from detail API
      query = query.is("detail_fetched_at", null);
    } else {
      // For force_refresh: only process projects not yet refreshed in this run
      query = query.or(`detail_fetched_at.is.null,detail_fetched_at.lt.${startedAt}`);
    }

    query = query.order("detail_fetched_at", { ascending: true, nullsFirst: true });

    const { data: projectsToBackfill, error: queryError } = await query.limit(batchSize);

    if (queryError) {
      throw new Error(`Failed to query projects: ${queryError.message}`);
    }

    if (!projectsToBackfill?.length) {
      return new Response(
        JSON.stringify({
          success: true,
          mode,
          message: "All projects already have complete data",
          processed: 0,
          updated: 0,
          remaining: 0,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get remaining count for progress tracking
    let remainingQuery = supabase
      .from("projects")
      .select("*", { count: "exact", head: true })
      .not("reelly_id", "is", null);

    if (!forceRefresh) {
      remainingQuery = remainingQuery.is("detail_fetched_at", null);
    } else {
      remainingQuery = remainingQuery.or(`detail_fetched_at.is.null,detail_fetched_at.lt.${startedAt}`);
    }

    const { count: remainingCount } = await remainingQuery;

    let updated = 0;
    let failed = 0;
    const errors: string[] = [];
    const results: Array<{ name: string; slug?: string; status: string; images?: number; docs?: number }> = [];

    // Create or update sync job for persistence
    let jobId = body.job_id;
    if (!jobId && mode === "all") {
      const { data: newJob } = await supabase
        .from("sync_jobs")
        .insert({
          job_type: "reelly_backfill",
          status: "running",
          total_items: remainingCount || 0,
        })
        .select("id")
        .single();
      jobId = newJob?.id;
    }

    for (const project of projectsToBackfill) {
      console.log(`Backfilling: ${project.name} (Reelly ID: ${project.reelly_id})`);

      const detail = await fetchProjectDetail(apiKey, project.reelly_id);
      if (!detail) {
        failed++;
        errors.push(`API fetch failed: ${project.name}`);
        results.push({ name: project.name, slug: project.slug, status: "api_fetch_failed" });
        // Still mark as fetched so we don't retry infinitely
        await supabase.from("projects").update({ detail_fetched_at: new Date().toISOString() }).eq("id", project.id);
        continue;
      }

      const updateResult = await updateProjectWithDetails(supabase, project.id, detail, forceRefresh);
      if (updateResult.success) {
        updated++;
        const imgCount = updateResult.fields?.find(f => f.startsWith("images("))?.match(/\d+/)?.[0];
        const docCount = updateResult.fields?.includes("documents") ? 1 : 0;
        results.push({ name: project.name, slug: project.slug, status: "success", images: imgCount ? parseInt(imgCount) : 0, docs: docCount });
        console.log(`✓ Updated ${project.name} with: ${updateResult.fields?.join(", ") || "all fields"}`);
      } else {
        failed++;
        errors.push(updateResult.error || `DB update failed: ${project.name}`);
        results.push({ name: project.name, slug: project.slug, status: updateResult.error || "update_failed" });
      }

      // Rate limiting to avoid API throttling
      await new Promise((r) => setTimeout(r, 200));

      // Update job progress
      if (jobId) {
        await supabase
          .from("sync_jobs")
          .update({
            stats_updated: updated,
            stats_errors: failed,
            updated_at: new Date().toISOString(),
          })
          .eq("id", jobId);
      }
    }

    // Update job status if completed
    if (jobId && (remainingCount || 0) - projectsToBackfill.length <= 0) {
      await supabase
        .from("sync_jobs")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
        })
        .eq("id", jobId);
    }

    return new Response(
      JSON.stringify({
        success: true,
        mode,
        processed: projectsToBackfill.length,
        updated,
        failed,
        remaining: Math.max(0, (remainingCount || 0) - projectsToBackfill.length),
        errors: errors.slice(0, 10),
        results: results.slice(0, 200),
        job_id: jobId,
        message: `Backfilled ${updated} projects with detailed data`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e: any) {
    console.error("Backfill error:", e);
    return new Response(
      JSON.stringify({ success: false, error: e.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function updateProjectWithDetails(
  supabase: any,
  projectId: string,
  detail: ReellyProject,
  forceRefresh: boolean
): Promise<{ success: boolean; error?: string; fields?: string[] }> {
  try {
    const updateData: Record<string, any> = {};
    const updatedFields: string[] = [];

    // Extract all detail data
    const floorPlans = extractFloorPlans(detail);
    const amenities = extractAmenities(detail);
    const documents = extractDocuments(detail);
    const unitTypes = extractUnitTypes(detail);
    const gallery = extractGalleryImages(detail);
    const videos = extractVideos(detail);

    // CRITICAL: Always update core fields from Reelly API
    // Prices - only update if Reelly has valid prices
    if (detail.min_price > 0) {
      updateData.price_from = detail.min_price;
      updatedFields.push("price_from");
    }
    if (detail.max_price > 0) {
      updateData.price_to = detail.max_price;
      updatedFields.push("price_to");
    }

    // Size data
    if (detail.min_size > 0) {
      updateData.size_min = detail.min_size;
      updatedFields.push("size_min");
    }
    if (detail.max_size > 0) {
      updateData.size_max = detail.max_size;
      updatedFields.push("size_max");
    }

    // Units count
    if (detail.units_count > 0) {
      updateData.total_units = detail.units_count;
      updatedFields.push("units_count");
    }

    // Building count (NOT floors - building_count is number of buildings, not floors)
    if (detail.building_count > 0) {
      updateData.building_count = detail.building_count;
      updatedFields.push("building_count");
    }

    // Calculate bedrooms min/max from unit types
    if (unitTypes.length > 0) {
      const bedroomValues = unitTypes.map((u: any) => u.bedrooms).filter((b: any) => typeof b === 'number' && b >= 0);
      if (bedroomValues.length > 0) {
        updateData.bedrooms_min = Math.min(...bedroomValues);
        updateData.bedrooms_max = Math.max(...bedroomValues);
        updatedFields.push("bedrooms_min", "bedrooms_max");
      }
    }

    // Description (strip markdown headers)
    if (detail.overview || detail.short_description) {
      let cleanDesc = (detail.overview || detail.short_description || '');
      cleanDesc = cleanDesc.replace(/^#{1,6}\s*/gm, '').replace(/\n{3,}/g, '\n\n').trim();
      if (cleanDesc) {
        updateData.description = cleanDesc;
        updatedFields.push("description");
      }
    }
    if (detail.short_description) {
      updateData.short_description = detail.short_description;
    }

    // Cover image
    if (detail.cover_image?.url) {
      updateData.cover_image_url = detail.cover_image.url;
      updatedFields.push("cover_image");
    }

    // Handover dates
    if (detail.completion_datetime || detail.construction_end_date || detail.completion_date) {
      updateData.handover_date = detail.completion_datetime?.split('T')[0] || detail.construction_end_date || detail.completion_date;
      updatedFields.push("handover_date");
    }

    // Floor plans - always set (empty array means "checked, none found")
    updateData.floor_plan_types = floorPlans;
    if (floorPlans.length > 0) updatedFields.push("floor_plans");

    // Amenities - always set (empty array means "checked, none found")
    updateData.amenities = amenities.length > 0 ? amenities : [];
    if (amenities.length > 0) updatedFields.push("amenities");

    // Documents are stored in project_documents table (handled below)
    if (documents.length > 0) {
      updatedFields.push("documents");
    }

    // Unit types
    if (unitTypes.length > 0) {
      updateData.unit_types = unitTypes;
      updatedFields.push("unit_types");
    }

    // Video URL
    if (videos.video_url) {
      updateData.video_url = videos.video_url;
      updatedFields.push("video");
    }

    // Payment plan from Reelly
    if (detail.payment_plan) {
      updateData.payment_breakdown = detail.payment_plan;
      updatedFields.push("payment_plan");
    }

    // FAQs
    if (detail.faqs && detail.faqs.length > 0) {
      updateData.faqs = detail.faqs;
      updatedFields.push("faqs");
    }

    // Highlights
    if (detail.highlights && detail.highlights.length > 0) {
      updateData.highlights = detail.highlights;
      updatedFields.push("highlights");
    }

    // ROI estimates
    if (detail.roi_estimate) {
      updateData.roi_estimate = detail.roi_estimate;
      updatedFields.push("roi");
    }

    if (detail.rental_yield_estimate) {
      updateData.rental_yield = detail.rental_yield_estimate;
      updatedFields.push("rental_yield");
    }

    if (detail.service_charge) {
      updateData.service_charge = detail.service_charge;
      updatedFields.push("service_charge");
    }

    // Always mark as fetched so we don't re-process
    updateData.detail_fetched_at = new Date().toISOString();
    updateData.updated_at = new Date().toISOString();

    const { error } = await supabase
      .from("projects")
      .update(updateData)
      .eq("id", projectId);

    if (error) {
      return { success: false, error: error.message };
    }

    // Also insert documents into project_documents table
    if (documents.length > 0) {
      for (const doc of documents) {
        await supabase
          .from("project_documents")
          .upsert(
            {
              project_id: projectId,
              file_url: doc.url,
              file_name: doc.name,
              document_type: doc.type,
              data_source: "reelly",
            },
            { onConflict: "project_id,file_url" }
          );
      }
    }

    // Update gallery images if missing
    if (gallery.length > 0) {
      const { count: existingImagesCount } = await supabase
        .from("project_images")
        .select("*", { count: "exact", head: true })
        .eq("project_id", projectId);

      // Only add images if project has none or force refresh
      if ((existingImagesCount || 0) === 0 || forceRefresh) {
        for (const img of gallery) {
          await supabase
            .from("project_images")
            .upsert(
              {
                project_id: projectId,
                image_url: img.url,
                alt_text: img.alt_text,
                display_order: img.display_order,
                data_source: "reelly",
              },
              { onConflict: "project_id,image_url" }
            );
        }
        updatedFields.push(`images(${gallery.length})`);
      }
    }

    return { success: true, fields: updatedFields };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
