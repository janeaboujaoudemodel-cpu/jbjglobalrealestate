import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Repair Approved Projects
 * 
 * This function finds approved projects that are missing metadata (USPs, location details,
 * amenities, payment breakdown, documents, etc.) and backfills from their corresponding
 * pending_project_imports records.
 * 
 * This is Phase 2 of the "Fix All Listings" pipeline.
 */

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { limit = 100, dryRun = false } = await req.json().catch(() => ({}));

    console.log(`[RepairApproved] Starting repair (limit=${limit}, dryRun=${dryRun})...`);

    // Find projects that are missing key extracted fields
    const { data: projects, error: fetchError } = await supabase
      .from("projects")
      .select("id, name, slug, description, usp_headline, usp_bullets, location_headline, location_description, location_distances, floor_plan_types, faqs, payment_breakdown, amenities_list")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (fetchError) {
      return new Response(JSON.stringify({ error: "Failed to fetch projects", details: fetchError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stats = {
      checked: 0,
      repaired: 0,
      imagesRepaired: 0,
      documentsRepaired: 0,
      metadataRepaired: 0,
      alreadyComplete: 0,
      noSourceFound: 0,
      errors: 0,
    };

    const errors: Array<{ name: string; error: string }> = [];

    for (const project of projects || []) {
      stats.checked++;

      // Check if project is missing key metadata
      const isMissingMetadata = 
        !project.usp_headline && 
        !project.usp_bullets && 
        !project.location_headline && 
        !project.floor_plan_types &&
        !project.payment_breakdown;

      // Check if project has images
      const { count: imageCount } = await supabase
        .from("project_images")
        .select("*", { count: "exact", head: true })
        .eq("project_id", project.id);

      // Check if project has documents
      const { count: docCount } = await supabase
        .from("project_documents")
        .select("*", { count: "exact", head: true })
        .eq("project_id", project.id);

      const hasImages = imageCount && imageCount > 0;
      const hasDocs = docCount && docCount > 0;

      // If project is complete, skip
      if (!isMissingMetadata && hasImages && hasDocs) {
        stats.alreadyComplete++;
        continue;
      }

      // Find corresponding approved import with all extracted data
      const { data: importRecord, error: importError } = await supabase
        .from("pending_project_imports")
        .select(`
          id, images, documents, description, developer_name, developer_id,
          price_from, price_to, bedrooms_min, bedrooms_max, size_min, size_max,
          handover_date, payment_plan, amenities, property_type_label, status_label,
          usp_headline, usp_bullets, usp_image_url,
          location_headline, location_description, location_distances, location_image_url,
          floor_plan_types, faqs, payment_breakdown, amenities_list
        `)
        .eq("slug", project.slug)
        .in("status", ["approved", "merged"])
        .order("updated_at", { ascending: false })
        .maybeSingle();

      if (importError) {
        console.error(`[RepairApproved] Error fetching import for ${project.name}:`, importError.message);
        errors.push({ name: project.name, error: importError.message });
        stats.errors++;
        continue;
      }

      if (!importRecord) {
        console.log(`[RepairApproved] No approved import found for: ${project.name}`);
        stats.noSourceFound++;
        continue;
      }

      if (dryRun) {
        console.log(`[DryRun] Would repair: ${project.name}`);
        stats.repaired++;
        continue;
      }

      let repaired = false;

      // 1. Repair metadata if missing
      if (isMissingMetadata) {
        const metadataUpdate: Record<string, any> = {};

        // Copy USP fields
        if (importRecord.usp_headline) metadataUpdate.usp_headline = importRecord.usp_headline;
        if (importRecord.usp_bullets) metadataUpdate.usp_bullets = importRecord.usp_bullets;
        if (importRecord.usp_image_url) metadataUpdate.usp_image_url = importRecord.usp_image_url;

        // Copy location fields
        if (importRecord.location_headline) metadataUpdate.location_headline = importRecord.location_headline;
        if (importRecord.location_description) metadataUpdate.location_description = importRecord.location_description;
        if (importRecord.location_distances) metadataUpdate.location_distances = importRecord.location_distances;
        if (importRecord.location_image_url) metadataUpdate.location_image_url = importRecord.location_image_url;

        // Copy other extended fields
        if (importRecord.floor_plan_types) metadataUpdate.floor_plan_types = importRecord.floor_plan_types;
        if (importRecord.faqs) metadataUpdate.faqs = importRecord.faqs;
        if (importRecord.payment_breakdown) metadataUpdate.payment_breakdown = importRecord.payment_breakdown;
        if (importRecord.amenities_list) metadataUpdate.amenities_list = importRecord.amenities_list;

        // Also fill in any missing basic fields
        if (!project.description && importRecord.description) {
          metadataUpdate.description = importRecord.description;
        }

        if (Object.keys(metadataUpdate).length > 0) {
          metadataUpdate.updated_at = new Date().toISOString();

          const { error: updateError } = await supabase
            .from("projects")
            .update(metadataUpdate)
            .eq("id", project.id);

          if (updateError) {
            console.error(`[RepairApproved] Failed to update metadata for ${project.name}:`, updateError.message);
            errors.push({ name: project.name, error: `Metadata update: ${updateError.message}` });
            stats.errors++;
          } else {
            console.log(`[RepairApproved] ✓ Metadata repaired for: ${project.name}`);
            stats.metadataRepaired++;
            repaired = true;
          }
        }
      }

      // 2. Repair images if missing
      if (!hasImages && importRecord.images) {
        const images = Array.isArray(importRecord.images) 
          ? importRecord.images 
          : (typeof importRecord.images === 'string' ? JSON.parse(importRecord.images) : []);

        if (images.length > 0) {
          const imageInserts = images.map((img: { url: string; alt_text?: string; display_order?: number }, idx: number) => ({
            project_id: project.id,
            image_url: img.url,
            alt_text: img.alt_text || `${project.name} - Image ${idx + 1}`,
            display_order: img.display_order ?? idx,
          }));

          const { error: imgError } = await supabase
            .from("project_images")
            .insert(imageInserts);

          if (imgError) {
            console.error(`[RepairApproved] Failed to insert images for ${project.name}:`, imgError.message);
            errors.push({ name: project.name, error: `Images: ${imgError.message}` });
          } else {
            console.log(`[RepairApproved] ✓ Images repaired for: ${project.name} (${images.length} images)`);
            stats.imagesRepaired++;
            repaired = true;
          }
        }
      }

      // 3. Repair documents if missing
      if (!hasDocs && importRecord.documents) {
        const documents = Array.isArray(importRecord.documents) 
          ? importRecord.documents 
          : (typeof importRecord.documents === 'string' ? JSON.parse(importRecord.documents) : []);

        if (documents.length > 0) {
          const docInserts = documents.map((doc: { url: string; type: string; name?: string }, idx: number) => ({
            project_id: project.id,
            file_url: doc.url,
            document_type: doc.type || 'brochure',
            file_name: doc.name || `${project.name} Document ${idx + 1}.pdf`,
            display_order: idx,
          }));

          const { error: docError } = await supabase
            .from("project_documents")
            .insert(docInserts);

          if (docError) {
            console.error(`[RepairApproved] Failed to insert documents for ${project.name}:`, docError.message);
            errors.push({ name: project.name, error: `Documents: ${docError.message}` });
          } else {
            console.log(`[RepairApproved] ✓ Documents repaired for: ${project.name} (${documents.length} docs)`);
            stats.documentsRepaired++;
            repaired = true;
          }
        }
      }

      if (repaired) {
        stats.repaired++;
      }
    }

    console.log(`[RepairApproved] Complete: ${stats.repaired} repaired, ${stats.alreadyComplete} already complete, ${stats.errors} errors`);

    return new Response(JSON.stringify({
      success: true,
      dryRun,
      stats,
      errors: errors.slice(0, 10),
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("[RepairApproved] Error:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
