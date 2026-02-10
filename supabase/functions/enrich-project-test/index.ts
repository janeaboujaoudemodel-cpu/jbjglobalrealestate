import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function fetchReellyProject(reellyId: number, apiKey: string) {
  const res = await fetch(
    `https://api-reelly.up.railway.app/api/v2/projects/${reellyId}`,
    { headers: { "X-API-Key": apiKey, "Accept": "application/json" } }
  );
  if (!res.ok) return null;
  const data = await res.json();
  return data?.data || data;
}

async function fetchProvidentBySlug(slug: string, reellyId: number | null, firecrawlKey: string) {
  // Strip the Reelly ID suffix from slug for Provident URL matching
  // e.g. "binghatti-titania-binghatti-3012" -> "binghatti-titania-binghatti"
  let cleanSlug = slug;
  if (reellyId) {
    const suffix = `-${reellyId}`;
    if (cleanSlug.endsWith(suffix)) {
      cleanSlug = cleanSlug.slice(0, -suffix.length);
    }
  }
  const providentUrl = `https://www.providentestate.com/off-plan/${cleanSlug}/`;
  try {
    const res = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${firecrawlKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: providentUrl,
        formats: ["markdown"],
        onlyMainContent: true,
        waitFor: 3000,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      source_url: providentUrl,
      markdown: data?.data?.markdown || data?.markdown || null,
      metadata: data?.data?.metadata || data?.metadata || null,
    };
  } catch {
    return null;
  }
}

function extractAmenitiesFromReelly(project: any): string[] {
  if (!project) return [];
  const amenities: string[] = [];
  
  // Check amenities field
  if (project.amenities && Array.isArray(project.amenities)) {
    for (const a of project.amenities) {
      if (typeof a === "string") amenities.push(a);
      else if (a?.name) amenities.push(a.name);
    }
  }
  
  // Check features field
  if (project.features && Array.isArray(project.features)) {
    for (const f of project.features) {
      if (typeof f === "string" && !amenities.includes(f)) amenities.push(f);
      else if (f?.name && !amenities.includes(f.name)) amenities.push(f.name);
    }
  }
  
  return amenities;
}

function extractUspFromReelly(project: any): string[] {
  if (!project) return [];
  const bullets: string[] = [];
  
  if (project.usp_bullets && Array.isArray(project.usp_bullets)) {
    return project.usp_bullets;
  }
  if (project.highlights && Array.isArray(project.highlights)) {
    for (const h of project.highlights) {
      if (typeof h === "string") bullets.push(h);
      else if (h?.text) bullets.push(h.text);
    }
  }
  if (project.selling_points && Array.isArray(project.selling_points)) {
    for (const s of project.selling_points) {
      if (typeof s === "string" && !bullets.includes(s)) bullets.push(s);
    }
  }
  
  return bullets;
}

function extractLocationDistances(project: any): Array<{ label: string; time: string }> {
  if (!project) return [];
  const distances: Array<{ label: string; time: string }> = [];
  
  if (project.location_distances && Array.isArray(project.location_distances)) {
    return project.location_distances;
  }
  if (project.nearby_places && Array.isArray(project.nearby_places)) {
    for (const p of project.nearby_places) {
      if (p?.name && p?.distance) {
        distances.push({ label: p.name, time: p.distance });
      }
    }
  }
  if (project.distances && Array.isArray(project.distances)) {
    for (const d of project.distances) {
      if (d?.label && d?.time) distances.push(d);
      else if (d?.name && d?.distance) distances.push({ label: d.name, time: d.distance });
    }
  }
  
  return distances;
}

function extractDocuments(project: any): Array<{ type: string; url: string; name?: string }> {
  if (!project) return [];
  const docs: Array<{ type: string; url: string; name?: string }> = [];
  
  if (project.documents && Array.isArray(project.documents)) {
    for (const d of project.documents) {
      if (d?.url) {
        docs.push({ type: d.type || "brochure", url: d.url, name: d.name || d.title });
      }
    }
  }
  if (project.brochure_url) {
    docs.push({ type: "brochure", url: project.brochure_url });
  }
  if (project.payment_plan_url) {
    docs.push({ type: "payment_plan", url: project.payment_plan_url });
  }
  
  return docs;
}

function extractGallery(project: any): Array<{ url: string; alt?: string }> {
  if (!project) return [];
  const images: Array<{ url: string; alt?: string }> = [];
  
  if (project.images && Array.isArray(project.images)) {
    for (const img of project.images) {
      if (typeof img === "string") images.push({ url: img });
      else if (img?.url) images.push({ url: img.url, alt: img.alt || img.caption });
    }
  }
  if (project.gallery && Array.isArray(project.gallery)) {
    for (const img of project.gallery) {
      if (typeof img === "string") images.push({ url: img });
      else if (img?.url) images.push({ url: img.url, alt: img.alt });
    }
  }
  
  return images;
}

function extractAmenitiesFromMarkdown(markdown: string | null): string[] {
  if (!markdown) return [];
  const amenities: string[] = [];
  
  // Look for amenities section
  const amenitySection = markdown.match(/(?:amenities|facilities|features)[:\s]*\n([\s\S]*?)(?:\n#{1,3}\s|\n\n\n)/i);
  if (amenitySection) {
    const lines = amenitySection[1].split("\n");
    for (const line of lines) {
      const clean = line.replace(/^[-*•]\s*/, "").trim();
      if (clean.length > 2 && clean.length < 60) {
        amenities.push(clean);
      }
    }
  }
  
  return amenities;
}

serve(async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "Method not allowed" });

  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const reellyApiKey = Deno.env.get("REELLY_API_KEY") || "";
  const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY") || "";

  if (!supabaseUrl || !supabaseKey) return json(500, { error: "Missing config" });

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const body = await req.json();
    const { slug, action } = body;

    if (!slug) return json(400, { error: "Missing project slug" });

    // Fetch current project from DB
    const { data: project, error: projErr } = await supabase
      .from("projects")
      .select("id, name, slug, reelly_id, amenities, usp_bullets, location_distances, description, cover_image_url, developer_name, area_name, price_from, price_to")
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

    // Build "before" snapshot
    const before = {
      amenities: project.amenities || [],
      usp_bullets: project.usp_bullets || [],
      location_distances: project.location_distances || [],
      images_count: imageCount || 0,
      documents_count: docCount || 0,
    };

    // Fetch enrichment data from Reelly
    let reellyData: any = null;
    let reellyEnrichment = {
      amenities: [] as string[],
      usp_bullets: [] as string[],
      location_distances: [] as Array<{ label: string; time: string }>,
      documents: [] as Array<{ type: string; url: string; name?: string }>,
      gallery: [] as Array<{ url: string; alt?: string }>,
    };

    if (project.reelly_id && reellyApiKey) {
      reellyData = await fetchReellyProject(project.reelly_id, reellyApiKey);
      if (reellyData) {
        reellyEnrichment = {
          amenities: extractAmenitiesFromReelly(reellyData),
          usp_bullets: extractUspFromReelly(reellyData),
          location_distances: extractLocationDistances(reellyData),
          documents: extractDocuments(reellyData),
          gallery: extractGallery(reellyData),
        };
      }
    }

    // Fetch enrichment data from Provident
    let providentData: any = null;
    let providentEnrichment = {
      amenities: [] as string[],
      markdown_excerpt: null as string | null,
    };

    if (firecrawlKey) {
      providentData = await fetchProvidentBySlug(slug, project.reelly_id, firecrawlKey);
      if (providentData?.markdown) {
        providentEnrichment = {
          amenities: extractAmenitiesFromMarkdown(providentData.markdown),
          markdown_excerpt: providentData.markdown.slice(0, 500),
        };
      }
    }

    // Merge enrichment (Reelly primary, Provident fills gaps)
    const mergedAmenities = reellyEnrichment.amenities.length > 0
      ? reellyEnrichment.amenities
      : providentEnrichment.amenities;

    const after = {
      amenities: mergedAmenities,
      usp_bullets: reellyEnrichment.usp_bullets,
      location_distances: reellyEnrichment.location_distances,
      images_count: (imageCount || 0) + reellyEnrichment.gallery.length,
      documents_count: (docCount || 0) + reellyEnrichment.documents.length,
      new_images: reellyEnrichment.gallery.length,
      new_documents: reellyEnrichment.documents.length,
      gallery_preview: reellyEnrichment.gallery.slice(0, 4).map(g => g.url),
    };

    // If action is "apply", write to DB
    if (action === "apply") {
      const updates: Record<string, any> = {};
      if (mergedAmenities.length > 0 && (!project.amenities || project.amenities.length === 0)) {
        updates.amenities = mergedAmenities;
      }
      if (reellyEnrichment.usp_bullets.length > 0 && (!project.usp_bullets || project.usp_bullets.length === 0)) {
        updates.usp_bullets = reellyEnrichment.usp_bullets;
      }
      if (reellyEnrichment.location_distances.length > 0 && (!project.location_distances || project.location_distances.length === 0)) {
        updates.location_distances = reellyEnrichment.location_distances;
      }

      if (Object.keys(updates).length > 0) {
        await supabase.from("projects").update(updates).eq("id", project.id);
      }

      // Insert new images
      if (reellyEnrichment.gallery.length > 0) {
        const newImages = reellyEnrichment.gallery.map((img, i) => ({
          project_id: project.id,
          image_url: img.url,
          alt_text: img.alt || `${project.name} image ${i + 1}`,
          sort_order: (imageCount || 0) + i,
          data_source: "reelly_enrichment",
        }));
        await supabase.from("project_images").insert(newImages);
      }

      // Insert new documents
      if (reellyEnrichment.documents.length > 0) {
        const newDocs = reellyEnrichment.documents.map((doc) => ({
          project_id: project.id,
          document_url: doc.url,
          document_type: doc.type,
          document_name: doc.name || doc.type,
          data_source: "reelly_enrichment",
        }));
        await supabase.from("project_documents").insert(newDocs);
      }

      return json(200, {
        success: true,
        applied: true,
        updates_applied: Object.keys(updates),
        new_images: reellyEnrichment.gallery.length,
        new_documents: reellyEnrichment.documents.length,
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
              url: `https://api-reelly.up.railway.app/api/v2/projects/${project.reelly_id}`,
              amenities_found: reellyEnrichment.amenities.length,
              usp_found: reellyEnrichment.usp_bullets.length,
              distances_found: reellyEnrichment.location_distances.length,
              images_found: reellyEnrichment.gallery.length,
              documents_found: reellyEnrichment.documents.length,
            }
          : { available: false, reason: !project.reelly_id ? "No reelly_id" : "API error" },
        provident: providentData
          ? {
              available: true,
              url: `https://www.provident.ae/off-plan/${slug}`,
              amenities_found: providentEnrichment.amenities.length,
              markdown_excerpt: providentEnrichment.markdown_excerpt,
            }
          : { available: false, reason: firecrawlKey ? "Page not found" : "No Firecrawl key" },
      },
    });
  } catch (e) {
    console.error("enrich-project-test error:", e);
    return json(500, { error: e instanceof Error ? e.message : "Unexpected error" });
  }
});
