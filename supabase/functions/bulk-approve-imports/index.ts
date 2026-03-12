import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Bulk Approve Pending Imports - FULL REELLY PARITY
 * Automatically approves all pending project imports and moves them to main projects table
 * with ALL data including images, documents, videos, amenities, floor plans, etc.
 */

interface ImageData {
  url: string;
  alt_text?: string;
  display_order?: number;
}

interface DocumentData {
  url: string;
  name?: string;
  type?: string;
}

interface FloorPlanData {
  type: string;
  url: string;
  label: string;
  bedrooms?: number;
}

interface UnitTypeData {
  type: string;
  bedrooms?: number;
  bathrooms?: number;
  size_min?: number;
  size_max?: number;
  price_from?: number;
  price_to?: number;
  available?: number;
}

/**
 * Bulk Approve Pending Imports v3 - ALWAYS OVERWRITE MODE
 * 
 * Now enforces "Always Overwrite" - Reelly data REPLACES existing records.
 * This ensures 100% parity with the Reelly API source.
 */

function detectSource(sourceUrl: string | null): string {
  if (!sourceUrl) return "manual";
  const lower = sourceUrl.toLowerCase();
  if (lower.includes("providentestate.com") || lower.includes("provident")) return "provident";
  if (lower.includes("reelly") || lower.includes("#reelly_")) return "reelly";
  return "manual";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // publish: when true, sets is_published=true on approved projects. Default false.
    // merge_mode: when true, matches existing projects by name and enriches (never overwrites non-null fields)
    // updateExisting: when true with slug match, fully overwrites (Reelly parity mode)
    const { limit = 200, dryRun = false, minImages = 0, updateExisting = true, merge_mode = true, publish = true } = await req.json().catch(() => ({}));

    console.log(`[BulkApprove] Starting (limit=${limit}, dryRun=${dryRun}, minImages=${minImages}, updateExisting=${updateExisting}, publish=${publish})...`);

    // Get developers list for matching
    const { data: developersList } = await supabase.from("developers").select("id, name, slug");
    const developers = developersList || [];
    console.log(`[BulkApprove] Loaded ${developers.length} developers for matching`);

    // Get areas for matching
    const { data: areasList } = await supabase.from("areas").select("id, name, slug");
    const areas = areasList || [];
    console.log(`[BulkApprove] Loaded ${areas.length} areas for matching`);

    // Get pending imports
    const { data: pendingImports, error: fetchError } = await supabase
      .from("pending_project_imports")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(limit);

    if (fetchError) {
      console.error("Failed to fetch pending imports:", fetchError);
      return new Response(JSON.stringify({ error: "Failed to fetch pending imports", details: fetchError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!pendingImports || pendingImports.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: "No pending imports to approve",
        stats: { approved: 0, skipped: 0, errors: 0 }
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[BulkApprove] Found ${pendingImports.length} pending imports`);

    const stats = {
      approved: 0,
      updated: 0,
      skipped: 0,
      errors: 0,
      noImages: 0,
    };

    const errors: Array<{ name: string; error: string }> = [];

    for (const item of pendingImports) {
      try {
        // Parse images
        const images: ImageData[] = Array.isArray(item.images) 
          ? item.images 
          : (typeof item.images === 'string' ? JSON.parse(item.images) : []);

        // Validate images if minimum required
        if (minImages > 0 && (!images || images.length < minImages)) {
          console.log(`[BulkApprove] Skipping ${item.name} - insufficient images (${images?.length || 0})`);
          stats.noImages++;
          stats.skipped++;
          continue;
        }

        // Check if project already exists by slug
        const { data: existingProject } = await supabase
          .from("projects")
          .select("id, name, description, amenities, payment_plan")
          .eq("slug", item.slug)
          .maybeSingle();

        // If no slug match but merge_mode is on, try name matching
        let mergeTarget: { id: string; name: string; description: string | null; amenities: string[] | null; payment_plan: string | null } | null = existingProject;
        
        if (!mergeTarget && merge_mode && item.name) {
          const cleanName = item.name.trim();
          const { data: nameMatches } = await supabase
            .from("projects")
            .select("id, name, description, amenities, payment_plan")
            .ilike("name", cleanName)
            .limit(1);
          
          if (nameMatches && nameMatches.length > 0) {
            mergeTarget = nameMatches[0];
            console.log(`[BulkApprove] Name match: "${item.name}" → existing "${mergeTarget.name}" (id: ${mergeTarget.id})`);
          }
        }

        // If we found an existing project and NOT in updateExisting mode, handle merge or skip
        if (mergeTarget && !updateExisting) {
          if (merge_mode) {
            // MERGE MODE: enrich existing project with missing data only (never overwrite non-null)
            const enrichFields: Record<string, unknown> = {};
            if (!mergeTarget.description && item.description) enrichFields.description = item.description;
            if ((!mergeTarget.amenities || mergeTarget.amenities.length === 0) && item.amenities) {
              const amenitiesList = Array.isArray(item.amenities) ? item.amenities.map(String) : [];
              if (amenitiesList.length > 0) {
                enrichFields.amenities = amenitiesList;
                enrichFields.amenities_list = amenitiesList;
              }
            }
            if (!mergeTarget.payment_plan && item.payment_plan) enrichFields.payment_plan = item.payment_plan;
            if (item.short_description) enrichFields.short_description = item.short_description;
            
            if (Object.keys(enrichFields).length > 0) {
              enrichFields.updated_at = new Date().toISOString();
              await supabase.from("projects").update(enrichFields).eq("id", mergeTarget.id);
              console.log(`[BulkApprove] Merged ${Object.keys(enrichFields).length} fields into "${mergeTarget.name}"`);
              stats.updated++;
            } else {
              stats.skipped++;
            }
            
            // Mark as approved with merge reference
            await supabase
              .from("pending_project_imports")
              .update({ 
                status: "approved", 
                matched_project_id: mergeTarget.id,
                reviewed_at: new Date().toISOString(),
                review_notes: Object.keys(enrichFields).length > 0 
                  ? `Merged fields: ${Object.keys(enrichFields).filter(k => k !== 'updated_at').join(', ')}`
                  : "Already exists, no new data to merge"
              })
              .eq("id", item.id);
            continue;
          } else {
            console.log(`[BulkApprove] Skipping ${item.name} - already exists`);
            stats.skipped++;
            await supabase
              .from("pending_project_imports")
              .update({ 
                status: "approved", 
                matched_project_id: mergeTarget.id,
                reviewed_at: new Date().toISOString(),
                review_notes: "Already exists in projects table"
              })
              .eq("id", item.id);
            continue;
          }
        }

        if (dryRun) {
          console.log(`[DryRun] Would approve: ${item.name} (${images.length} images)`);
          stats.approved++;
          continue;
        }

        // Match developer by name
        let matchedDeveloperId: string | null = null;
        if (item.developer_name) {
          const devNameLower = item.developer_name.toLowerCase().trim();
          const matchedDev = developers.find((d: { id: string; name: string; slug: string }) => 
            d.name.toLowerCase() === devNameLower || 
            d.name.toLowerCase().includes(devNameLower) ||
            devNameLower.includes(d.name.toLowerCase()) ||
            d.slug === devNameLower.replace(/\s+/g, '-')
          );
          if (matchedDev) {
            matchedDeveloperId = matchedDev.id;
          }
        }

        // Match area by name - only use if we can verify it exists
        let matchedAreaId: string | null = null;
        if (item.area_name) {
          const areaNameLower = item.area_name.toLowerCase().trim();
          const matchedArea = areas.find((a: { id: string; name: string; slug: string }) => 
            a.name.toLowerCase() === areaNameLower ||
            a.slug === areaNameLower.replace(/\s+/g, '-')
          );
          if (matchedArea) {
            matchedAreaId = matchedArea.id;
          }
        }
        // Verify the area_id from item exists in our areas list before using it
        if (!matchedAreaId && item.area_id) {
          const areaExists = areas.find((a: { id: string }) => a.id === item.area_id);
          if (areaExists) {
            matchedAreaId = item.area_id;
          }
        }

        // Parse all JSONB arrays with proper typing
        const documents: DocumentData[] = Array.isArray(item.documents) ? item.documents : [];
        const floorPlanTypes: FloorPlanData[] = Array.isArray(item.floor_plan_types) ? item.floor_plan_types : [];
        const unitTypes: UnitTypeData[] = Array.isArray(item.unit_types) ? item.unit_types : [];
        const amenitiesList: string[] = Array.isArray(item.amenities) 
          ? item.amenities.map((a: unknown) => String(a))
          : (Array.isArray(item.amenities_list) ? item.amenities_list.map((a: unknown) => String(a)) : []);
        const highlights: string[] = Array.isArray(item.highlights) ? item.highlights : [];
        const videoUrls: string[] = Array.isArray(item.video_urls) ? item.video_urls : [];

        // Determine cover image (first image URL)
        const coverImageUrl = images[0]?.url || null;

        // Extract reelly_id from source_url
        let reellyId: number | null = null;
        const reellyMatch = item.source_url?.match(/reelly_(\d+)/);
        if (reellyMatch) {
          reellyId = parseInt(reellyMatch[1], 10);
        }

        // Build complete project data with ALL fields
        const projectData: Record<string, unknown> = {
          name: item.name,
          slug: item.slug,
          developer_id: matchedDeveloperId,
          developer_name: item.developer_name || null,
          location: item.location || null,
          emirate: item.emirate || "Dubai",
          description: ((item.description || item.short_description || '').replace(/^#{1,6}\s*/gm, '').replace(/\n{3,}/g, '\n\n').trim()) || null,
          short_description: item.short_description || null,
          price_from: item.price_from || null,
          price_to: item.price_to || null,
          bedrooms_min: item.bedrooms_min || null,
          bedrooms_max: item.bedrooms_max || null,
          size_min: item.size_min || null,
          size_max: item.size_max || null,
          floors: item.floors || null,
          building_count: item.building_count || null,
          total_units: item.total_units || null,
          handover_date: item.handover_date || null,
          expected_completion: item.handover_display || item.handover_date || null,
          payment_plan: item.payment_plan || null,
          payment_breakdown: item.payment_breakdown || null,
          source_url: item.source_url || null,
          property_type_label: item.property_type_label || null,
          status_label: item.status_label || item.sale_status || null,
          construction_status: item.construction_status || null,
          sale_status: item.sale_status || null,
          construction_progress: item.construction_progress || null,
          construction_start_date: item.construction_start_date || null,
          // Amenities as text[] array
          amenities: amenitiesList.length > 0 ? amenitiesList : null,
          amenities_list: amenitiesList.length > 0 ? amenitiesList : null,
        // Location fields
        latitude: item.latitude || null,
        longitude: item.longitude || null,
        // Only set area_id if we found a valid match (avoid FK constraint errors)
        area_id: matchedAreaId || null,
          area_name: item.area_name || null,
          // USP fields
          usp_headline: item.usp_headline || null,
          usp_bullets: item.usp_bullets || null,
          usp_image_url: item.usp_image_url || null,
          // Location content fields
          location_headline: item.location_headline || null,
          location_description: item.location_description || null,
          location_distances: item.location_distances || null,
          location_image_url: item.location_image_url || null,
          // Floor plans
          floor_plan_types: floorPlanTypes.length > 0 ? floorPlanTypes : null,
          // FAQs
          faqs: item.faqs || null,
          // Unit types
          unit_types: unitTypes.length > 0 ? unitTypes : null,
          bedroom_types: item.bedroom_types || null,
          // Highlights
          highlights: highlights.length > 0 ? highlights : null,
          // Video
          video_url: item.video_url || (videoUrls.length > 0 ? videoUrls[0] : null),
          // Cover image
          cover_image_url: coverImageUrl,
          // Reelly fields
          reelly_id: reellyId,
          source: detectSource(item.source_url),
          import_source: detectSource(item.source_url),
          source_updated_at: item.source_updated_at || null,
          // Flags
          is_offplan: true,
          is_developer_direct: true,
          is_featured: false,
          is_premium: false,
          is_published: publish,
          is_sold_out: item.sale_status?.toLowerCase().includes('sold') || item.status_label?.toLowerCase().includes('sold') || false,
        };

        let projectId: string;

        if (mergeTarget && updateExisting) {
          // Update existing project (full overwrite for Reelly parity)
          const { error: updateError } = await supabase
            .from("projects")
            .update({ ...projectData, updated_at: new Date().toISOString() })
            .eq("id", mergeTarget.id);

          if (updateError) {
            console.error(`[BulkApprove] Failed to update project ${item.name}:`, updateError);
            errors.push({ name: item.name, error: updateError.message });
            stats.errors++;
            continue;
          }
          projectId = mergeTarget.id;
          stats.updated++;
        } else {
          // Insert new project
          const { data: newProject, error: insertError } = await supabase
            .from("projects")
            .insert(projectData)
            .select("id")
            .single();

          if (insertError) {
            console.error(`[BulkApprove] Failed to insert project ${item.name}:`, insertError);
            errors.push({ name: item.name, error: insertError.message });
            stats.errors++;
            continue;
          }
          projectId = newProject.id;
          stats.approved++;
        }

        // Insert images
        if (images.length > 0) {
          // First delete existing images if updating
          if (mergeTarget && updateExisting) {
            await supabase.from("project_images").delete().eq("project_id", projectId);
          }

          const imageInserts = images.map((img: ImageData, idx: number) => ({
            project_id: projectId,
            image_url: img.url,
            alt_text: img.alt_text || `${item.name} - Image ${idx + 1}`,
            display_order: img.display_order ?? idx,
          }));

          const { error: imgError } = await supabase
            .from("project_images")
            .insert(imageInserts);

          if (imgError) {
            console.warn(`[BulkApprove] Image insert warning for ${item.name}:`, imgError.message);
          }
        }

        // Insert documents (brochures, floor plans, etc.)
        if (documents.length > 0) {
          // First delete existing documents if updating
          if (mergeTarget && updateExisting) {
            await supabase.from("project_documents").delete().eq("project_id", projectId);
          }

          const docInserts = documents.map((doc: DocumentData, idx: number) => ({
            project_id: projectId,
            file_url: doc.url,
            file_name: doc.name || `Document ${idx + 1}`,
            document_type: doc.type || 'brochure',
            display_order: idx,
          }));

          const { error: docError } = await supabase
            .from("project_documents")
            .insert(docInserts);

          if (docError) {
            console.warn(`[BulkApprove] Document insert warning for ${item.name}:`, docError.message);
          }
        }

        // Mark as approved in pending_project_imports
        await supabase
          .from("pending_project_imports")
          .update({ 
            status: "approved", 
            matched_project_id: projectId,
            reviewed_at: new Date().toISOString(),
            review_notes: "Auto-approved via bulk-approve-imports v2"
          })
          .eq("id", item.id);

        console.log(`[BulkApprove] ✓ ${mergeTarget ? 'Updated' : 'Approved'}: ${item.name} (${images.length} images, ${documents.length} docs)`);

      } catch (err) {
        console.error(`[BulkApprove] Error processing ${item.name}:`, err);
        errors.push({ name: item.name, error: err instanceof Error ? err.message : String(err) });
        stats.errors++;
      }
    }

    return new Response(JSON.stringify({
      success: true,
      dryRun,
      stats,
      errors: errors.length > 0 ? errors.slice(0, 20) : undefined,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Bulk approve error:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
