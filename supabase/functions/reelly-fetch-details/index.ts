import { createClient } from "@supabase/supabase-js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const REELLY_API_BASE = "https://api-reelly.up.railway.app/api/v2/clients/projects";

interface ReellyImage {
  url: string;
  alt_text?: string;
  type?: string;
  metadata?: any;
}

interface ReellyVideoReview {
  url: string;
  title?: string;
  thumbnail_url?: string;
}

interface ReellyDocument {
  url: string;
  name?: string;
  type?: string;
  file_type?: string;
}

interface ReellyFloorPlan {
  type?: string;
  name?: string;
  url: string;
  image_url?: string;
  label?: string;
  bedrooms?: number;
}

interface ReellyUnit {
  type?: string;
  name?: string;
  bedrooms?: number;
  bathrooms?: number;
  size_min?: number;
  size_max?: number;
  size?: number;
  price_from?: number;
  price_to?: number;
  price?: number;
  available?: number;
  count?: number;
}

interface ReellyAmenity {
  id?: number;
  name: string;
  icon?: string;
  category?: string;
}

interface ReellyProjectDetail {
  id: number;
  name: string;
  developer: string;
  cover_image: { url: string } | null;
  images?: ReellyImage[];
  gallery?: ReellyImage[];
  video_reviews?: ReellyVideoReview[];
  documents?: ReellyDocument[];
  brochures?: ReellyDocument[];
  floor_plans?: ReellyFloorPlan[];
  units?: ReellyUnit[];
  unit_types?: ReellyUnit[];
  amenities?: (ReellyAmenity | string)[];
  facilities?: (ReellyAmenity | string)[];
  features?: string[];
  highlights?: string[];
  faqs?: Array<{ question: string; answer: string }>;
  payment_plan?: {
    name?: string;
    description?: string;
    milestones?: Array<{ percentage: number; description: string }>;
  };
  roi_estimate?: number;
  rental_yield_estimate?: number;
  service_charge?: number;
}

// Extract gallery images
function extractGalleryImages(project: ReellyProjectDetail): Array<{ url: string; alt_text: string; display_order: number }> {
  const images: Array<{ url: string; alt_text: string; display_order: number }> = [];
  const seenUrls = new Set<string>();
  let order = 0;

  // Add cover image first
  if (project.cover_image?.url && !seenUrls.has(project.cover_image.url)) {
    images.push({
      url: project.cover_image.url,
      alt_text: `${project.name} - Cover Image`,
      display_order: order++,
    });
    seenUrls.add(project.cover_image.url);
  }

  // Add gallery images
  const galleryImages = project.images || project.gallery || [];
  for (const img of galleryImages) {
    const url = typeof img === 'string' ? img : img.url;
    if (url && !seenUrls.has(url)) {
      images.push({
        url,
        alt_text: (typeof img === 'object' && img.alt_text) || `${project.name} - Gallery Image ${order}`,
        display_order: order++,
      });
      seenUrls.add(url);
    }
  }

  return images;
}

// Extract video URLs
function extractVideos(project: ReellyProjectDetail): string[] {
  const videoUrls: string[] = [];
  
  if (project.video_reviews && Array.isArray(project.video_reviews)) {
    for (const video of project.video_reviews) {
      const url = typeof video === 'string' ? video : video?.url;
      if (url && !videoUrls.includes(url)) {
        videoUrls.push(url);
      }
    }
  }

  return videoUrls;
}

// Extract documents
function extractDocuments(project: ReellyProjectDetail): Array<{ url: string; name: string; type: string }> {
  const docs: Array<{ url: string; name: string; type: string }> = [];
  const seenUrls = new Set<string>();

  const documents = project.documents || project.brochures || [];
  for (const doc of documents) {
    const url = typeof doc === 'string' ? doc : doc.url;
    const name = typeof doc === 'object' ? (doc.name || doc.type || 'Document') : 'Brochure';
    const type = typeof doc === 'object' ? (doc.type || doc.file_type || 'brochure') : 'brochure';
    
    if (url && !seenUrls.has(url)) {
      docs.push({ url, name, type });
      seenUrls.add(url);
    }
  }

  return docs;
}

// Extract floor plans
function extractFloorPlans(project: ReellyProjectDetail): Array<{ type: string; url: string; label: string; bedrooms?: number }> {
  const plans: Array<{ type: string; url: string; label: string; bedrooms?: number }> = [];
  const seenUrls = new Set<string>();

  const floorPlans = project.floor_plans || [];
  for (const plan of floorPlans) {
    const url = plan.url || plan.image_url;
    if (url && !seenUrls.has(url)) {
      plans.push({
        type: plan.type || plan.name || 'floor_plan',
        url,
        label: plan.label || plan.name || `Floor Plan`,
        bedrooms: plan.bedrooms,
      });
      seenUrls.add(url);
    }
  }

  return plans;
}

// Extract amenities
function extractAmenities(project: ReellyProjectDetail): string[] {
  const amenities: string[] = [];
  const seenNames = new Set<string>();

  const sources = [
    project.amenities,
    project.facilities,
    project.features,
  ];

  for (const source of sources) {
    if (!source) continue;
    
    for (const item of source) {
      const name = typeof item === 'string' ? item : item?.name;
      if (name && !seenNames.has(name.toLowerCase())) {
        amenities.push(name);
        seenNames.add(name.toLowerCase());
      }
    }
  }

  return amenities;
}

// Extract unit types
function extractUnitTypes(project: ReellyProjectDetail): Array<{
  type: string;
  bedrooms?: number;
  bathrooms?: number;
  size_min?: number;
  size_max?: number;
  price_from?: number;
  price_to?: number;
  available?: number;
}> {
  const units: Array<{
    type: string;
    bedrooms?: number;
    bathrooms?: number;
    size_min?: number;
    size_max?: number;
    price_from?: number;
    price_to?: number;
    available?: number;
  }> = [];

  const unitData = project.units || project.unit_types || [];
  for (const unit of unitData) {
    units.push({
      type: unit.type || unit.name || 'Unit',
      bedrooms: unit.bedrooms,
      bathrooms: unit.bathrooms,
      size_min: unit.size_min || unit.size,
      size_max: unit.size_max || unit.size,
      price_from: unit.price_from || unit.price,
      price_to: unit.price_to || unit.price,
      available: unit.available || unit.count,
    });
  }

  return units;
}

// Fetch single project details from Reelly API
async function fetchProjectDetail(apiKey: string, projectId: number): Promise<ReellyProjectDetail | null> {
  const url = `${REELLY_API_BASE}/${projectId}`;
  
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "X-API-Key": apiKey,
        "Accept": "application/json",
      },
    });

    if (!response.ok) {
      console.warn(`[Reelly Details] Failed to fetch project ${projectId}: ${response.status}`);
      return null;
    }

    return await response.json();
  } catch (err) {
    console.warn(`[Reelly Details] Error fetching project ${projectId}:`, err);
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

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json().catch(() => ({}));
    const mode = body.mode || "batch"; // "batch", "test", "specific"
    const batchSize = Math.min(body.batch_size || 50, 100);
    const projectIds = body.project_ids || [];

    console.log(`[Reelly Details] Mode: ${mode}, Batch size: ${batchSize}`);

    // Test mode - just check API connection
    if (mode === "test") {
      // Fetch first project to test
      const { data: sample } = await supabase
        .from("pending_project_imports")
        .select("source_url")
        .ilike("source_url", "%reelly_%")
        .limit(1)
        .single();

      if (!sample?.source_url) {
        return new Response(
          JSON.stringify({ success: true, message: "No Reelly projects in queue to test" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const match = sample.source_url.match(/reelly_(\d+)/);
      if (!match) {
        return new Response(
          JSON.stringify({ success: false, error: "Could not parse Reelly ID from source URL" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const testId = parseInt(match[1], 10);
      const detail = await fetchProjectDetail(apiKey, testId);

      return new Response(
        JSON.stringify({
          success: true,
          test_project_id: testId,
          has_detail: !!detail,
          detail_fields: detail ? {
            has_images: !!(detail.images?.length || detail.gallery?.length),
            images_count: (detail.images?.length || 0) + (detail.gallery?.length || 0),
            has_videos: !!detail.video_reviews?.length,
            videos_count: detail.video_reviews?.length || 0,
            has_documents: !!(detail.documents?.length || detail.brochures?.length),
            documents_count: (detail.documents?.length || 0) + (detail.brochures?.length || 0),
            has_floor_plans: !!detail.floor_plans?.length,
            floor_plans_count: detail.floor_plans?.length || 0,
            has_amenities: !!(detail.amenities?.length || detail.facilities?.length),
            amenities_count: (detail.amenities?.length || 0) + (detail.facilities?.length || 0),
            has_units: !!(detail.units?.length || detail.unit_types?.length),
            units_count: (detail.units?.length || 0) + (detail.unit_types?.length || 0),
            has_faqs: !!detail.faqs?.length,
            faqs_count: detail.faqs?.length || 0,
          } : null,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Specific mode - fetch details for specific project IDs
    if (mode === "specific" && projectIds.length > 0) {
      let updated = 0;
      let failed = 0;
      const errors: string[] = [];

      for (const reellyId of projectIds.slice(0, batchSize)) {
        try {
          const detail = await fetchProjectDetail(apiKey, reellyId);
          
          if (!detail) {
            failed++;
            errors.push(`Project ${reellyId}: Failed to fetch from API`);
            continue;
          }

          const images = extractGalleryImages(detail);
          const videos = extractVideos(detail);
          const documents = extractDocuments(detail);
          const floorPlans = extractFloorPlans(detail);
          const amenities = extractAmenities(detail);
          const unitTypes = extractUnitTypes(detail);

          const { error } = await supabase
            .from("pending_project_imports")
            .update({
              images: images.length > 0 ? images : null,
              video_urls: videos.length > 0 ? videos : null,
              video_url: videos[0] || null,
              documents: documents.length > 0 ? documents : null,
              floor_plan_types: floorPlans.length > 0 ? floorPlans : null,
              amenities: amenities.length > 0 ? amenities : null,
              unit_types: unitTypes.length > 0 ? unitTypes : null,
              faqs: detail.faqs?.length ? detail.faqs : null,
              highlights: detail.highlights?.length ? detail.highlights : null,
              updated_at: new Date().toISOString(),
            })
            .ilike("source_url", `%reelly_${reellyId}%`);

          if (error) {
            failed++;
            errors.push(`Project ${reellyId}: ${error.message}`);
          } else {
            updated++;
          }

          // Rate limiting
          await new Promise(resolve => setTimeout(resolve, 200));
        } catch (err) {
          failed++;
          errors.push(`Project ${reellyId}: ${String(err)}`);
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          mode: "specific",
          processed: projectIds.length,
          updated,
          failed,
          errors: errors.slice(0, 10),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Batch mode - find projects with missing details and fetch them
    // Look for projects that have no images (beyond cover) or no amenities
    const { data: incomplete, error: queryError } = await supabase
      .from("pending_project_imports")
      .select("id, name, source_url, images, amenities")
      .ilike("source_url", "%reelly_%")
      .eq("status", "pending")
      .or("images.is.null,amenities.is.null")
      .limit(batchSize);

    if (queryError) {
      throw new Error(`Database query failed: ${queryError.message}`);
    }

    if (!incomplete || incomplete.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "No projects with missing details found",
          processed: 0,
          updated: 0,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[Reelly Details] Found ${incomplete.length} projects with missing details`);

    let updated = 0;
    let failed = 0;
    const errors: string[] = [];

    for (const project of incomplete) {
      try {
        // Extract Reelly ID from source_url
        const match = project.source_url?.match(/reelly_(\d+)/);
        if (!match) {
          failed++;
          errors.push(`${project.name}: Could not parse Reelly ID`);
          continue;
        }

        const reellyId = parseInt(match[1], 10);
        const detail = await fetchProjectDetail(apiKey, reellyId);
        
        if (!detail) {
          failed++;
          errors.push(`${project.name}: Failed to fetch from API`);
          continue;
        }

        const images = extractGalleryImages(detail);
        const videos = extractVideos(detail);
        const documents = extractDocuments(detail);
        const floorPlans = extractFloorPlans(detail);
        const amenities = extractAmenities(detail);
        const unitTypes = extractUnitTypes(detail);

        const updateData: Record<string, any> = {
          updated_at: new Date().toISOString(),
        };

        // Only update fields that have data
        if (images.length > 0) updateData.images = images;
        if (videos.length > 0) {
          updateData.video_urls = videos;
          updateData.video_url = videos[0];
        }
        if (documents.length > 0) updateData.documents = documents;
        if (floorPlans.length > 0) updateData.floor_plan_types = floorPlans;
        if (amenities.length > 0) updateData.amenities = amenities;
        if (unitTypes.length > 0) updateData.unit_types = unitTypes;
        if (detail.faqs?.length) updateData.faqs = detail.faqs;
        if (detail.highlights?.length) updateData.highlights = detail.highlights;

        const { error } = await supabase
          .from("pending_project_imports")
          .update(updateData)
          .eq("id", project.id);

        if (error) {
          failed++;
          errors.push(`${project.name}: ${error.message}`);
        } else {
          updated++;
          console.log(`[Reelly Details] Updated ${project.name}: ${images.length} images, ${amenities.length} amenities`);
        }

        // Rate limiting - 200ms between requests
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (err) {
        failed++;
        errors.push(`${project.name}: ${String(err)}`);
      }
    }

    // Count remaining incomplete projects
    const { count: remaining } = await supabase
      .from("pending_project_imports")
      .select("id", { count: "exact", head: true })
      .ilike("source_url", "%reelly_%")
      .eq("status", "pending")
      .or("images.is.null,amenities.is.null");

    return new Response(
      JSON.stringify({
        success: true,
        mode: "batch",
        processed: incomplete.length,
        updated,
        failed,
        remaining: remaining || 0,
        errors: errors.slice(0, 10),
        message: `Updated ${updated} projects with detailed data. ${remaining || 0} projects still need details.`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[Reelly Details] Fatal error:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : String(error)
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
