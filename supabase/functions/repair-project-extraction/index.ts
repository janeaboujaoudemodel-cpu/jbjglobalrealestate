import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const REELLY_API_BASE = "https://api-reelly.up.railway.app/api/v2/clients/projects";

/**
 * Extract gallery images from Reelly detail response
 */
function extractGalleryImages(project: any): Array<{ url: string; alt_text: string; display_order: number }> {
  const images: Array<{ url: string; alt_text: string; display_order: number }> = [];
  const seen = new Set<string>();
  let order = 0;
  
  if (project.cover_image?.url && !seen.has(project.cover_image.url)) {
    images.push({ url: project.cover_image.url, alt_text: `${project.name} - Cover`, display_order: order++ });
    seen.add(project.cover_image.url);
  }
  for (const img of project.images || project.gallery || []) {
    const url = typeof img === 'string' ? img : img?.url;
    if (url && !seen.has(url)) {
      images.push({ url, alt_text: `${project.name} - Gallery ${order}`, display_order: order++ });
      seen.add(url);
    }
  }
  return images;
}

/**
 * Extract videos from Reelly detail response
 */
function extractVideos(project: any): { video_url: string | null; video_urls: string[] } {
  const urls: string[] = [];
  for (const v of project.video_reviews || []) {
    const url = typeof v === 'string' ? v : v?.url;
    if (url && !urls.includes(url)) urls.push(url);
  }
  return { video_url: urls[0] || null, video_urls: urls };
}

/**
 * Extract documents from Reelly detail response
 */
function extractDocuments(project: any): Array<{ url: string; name: string; type: string }> {
  const docs: Array<{ url: string; name: string; type: string }> = [];
  const seen = new Set<string>();
  for (const doc of project.documents || project.brochures || []) {
    const url = typeof doc === 'string' ? doc : doc?.url;
    const name = typeof doc === 'object' ? (doc.name || 'Document') : 'Brochure';
    const type = typeof doc === 'object' ? (doc.type || 'brochure') : 'brochure';
    if (url && !seen.has(url)) { docs.push({ url, name, type }); seen.add(url); }
  }
  return docs;
}

/**
 * Extract floor plans from Reelly detail response
 */
function extractFloorPlans(project: any): Array<{ type: string; url: string; label: string; bedrooms?: number }> {
  const plans: Array<{ type: string; url: string; label: string; bedrooms?: number }> = [];
  const seen = new Set<string>();
  for (const p of project.floor_plans || []) {
    const url = p.url || p.image_url;
    if (url && !seen.has(url)) {
      plans.push({ type: p.type || 'floor_plan', url, label: p.label || p.name || 'Floor Plan', bedrooms: p.bedrooms });
      seen.add(url);
    }
  }
  return plans;
}

/**
 * Extract amenities from Reelly detail response
 */
function extractAmenities(project: any): string[] {
  const amenities: string[] = [];
  const seen = new Set<string>();
  for (const src of [project.amenities, project.facilities, project.features]) {
    for (const item of src || []) {
      const name = typeof item === 'string' ? item : item?.name;
      if (name && !seen.has(name.toLowerCase())) { amenities.push(name); seen.add(name.toLowerCase()); }
    }
  }
  return amenities;
}

/**
 * Fetch Reelly project detail by ID
 */
async function fetchReellyDetail(apiKey: string, id: number): Promise<any | null> {
  try {
    const res = await fetch(`${REELLY_API_BASE}/${id}`, { 
      headers: { "X-API-Key": apiKey, "Authorization": `Bearer ${apiKey}`, "Accept": "application/json" } 
    });
    if (!res.ok) return null;
    return res.json();
  } catch { return null; }
}

/**
 * Repair a single pending import by re-scraping its source_url and updating the record.
 * NOW SUPPORTS REELLY IMPORTS: Detects reelly_XXXX in source_url and fetches detail API.
 */

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");
  const lovableKey = Deno.env.get("LOVABLE_API_KEY");
  const reellyApiKey = Deno.env.get("REELLY_API_KEY");
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { pendingImportId } = await req.json().catch(() => ({}));
    if (!pendingImportId) {
      return new Response(JSON.stringify({ error: "pendingImportId required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch the pending import
    const { data: item, error: fetchErr } = await supabase
      .from("pending_project_imports")
      .select("*")
      .eq("id", pendingImportId)
      .single();

    if (fetchErr || !item) {
      return new Response(JSON.stringify({ error: "Pending import not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = item.source_url;
    if (!url) {
      return new Response(JSON.stringify({ error: "No source_url to repair" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[RepairExtraction] Processing: ${item.name} from ${url}`);

    // ========== DETECT REELLY IMPORT ==========
    const reellyMatch = url.match(/reelly_(\d+)/);
    if (reellyMatch) {
      console.log(`[RepairExtraction] Detected Reelly import ID: ${reellyMatch[1]}`);
      
      if (!reellyApiKey) {
        return new Response(JSON.stringify({ 
          error: "REELLY_API_KEY not configured", 
          code: "MISSING_API_KEY" 
        }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const reellyId = parseInt(reellyMatch[1], 10);
      const detail = await fetchReellyDetail(reellyApiKey, reellyId);
      
      if (!detail) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: "Could not fetch Reelly detail", 
          code: "REELLY_FETCH_FAILED",
          reelly_id: reellyId 
        }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Extract all data from Reelly detail
      const reellyImages = extractGalleryImages(detail);
      const reellyVideos = extractVideos(detail);
      const reellyDocs = extractDocuments(detail);
      const reellyFloorPlans = extractFloorPlans(detail);
      const reellyAmenities = extractAmenities(detail);

      console.log(`[RepairExtraction] Reelly detail extracted: ${reellyImages.length} images, ${reellyDocs.length} docs, ${reellyFloorPlans.length} floor plans`);

      // Preserve existing data if Reelly returns empty
      const existingImages = Array.isArray(item.images) ? item.images : [];
      const existingDocs = Array.isArray(item.documents) ? item.documents : [];
      const existingFloorPlans = Array.isArray(item.floor_plan_types) ? item.floor_plan_types : [];
      const existingAmenities = Array.isArray(item.amenities) ? item.amenities : [];

      const finalImages = reellyImages.length > 0 ? reellyImages : existingImages;
      const finalDocs = reellyDocs.length > 0 ? reellyDocs : existingDocs;
      const finalFloorPlans = reellyFloorPlans.length > 0 ? reellyFloorPlans : existingFloorPlans;
      const finalAmenities = reellyAmenities.length > 0 ? reellyAmenities : existingAmenities;

      // Update description from Reelly if available
      const finalDescription = detail.overview || detail.short_description || item.description;

      // Check completeness
      const isComplete = Boolean(
        finalDescription && 
        item.developer_name && 
        item.developer_name.toLowerCase() !== "unknown" && 
        finalImages.length >= 1
      );

      // Update the pending import with Reelly data
      const { error: updateErr } = await supabase
        .from("pending_project_imports")
        .update({
          description: finalDescription,
          images: finalImages,
          documents: finalDocs,
          floor_plan_types: finalFloorPlans,
          amenities: finalAmenities,
          video_urls: reellyVideos.video_urls.length > 0 ? reellyVideos.video_urls : item.video_urls,
          video_url: reellyVideos.video_url || item.video_url,
          review_notes: isComplete ? null : "INCOMPLETE: Missing required fields",
          updated_at: new Date().toISOString(),
        })
        .eq("id", pendingImportId);

      if (updateErr) {
        return new Response(JSON.stringify({ error: "Update failed", details: updateErr.message }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // ========== SYNC TO LIVE PROJECT IF EXISTS ==========
      // Check if there's an approved project with matching slug
      if (item.slug) {
        const { data: existingProject } = await supabase
          .from("projects")
          .select("id")
          .eq("slug", item.slug)
          .single();

        if (existingProject) {
          console.log(`[RepairExtraction] Syncing assets to existing project: ${existingProject.id}`);
          
          // Sync images to project_images (dedupe by URL)
          if (finalImages.length > 0) {
            const { data: existingProjImages } = await supabase
              .from("project_images")
              .select("image_url")
              .eq("project_id", existingProject.id);
            
            const existingUrls = new Set((existingProjImages || []).map(i => i.image_url));
            const newImages = finalImages
              .filter(img => !existingUrls.has(img.url))
              .map((img, idx) => ({
                project_id: existingProject.id,
                image_url: img.url,
                alt_text: img.alt_text,
                display_order: existingUrls.size + idx
              }));
            
            if (newImages.length > 0) {
              await supabase.from("project_images").insert(newImages);
              console.log(`[RepairExtraction] Added ${newImages.length} new images to project`);
            }
          }

          // Sync documents to project_documents (dedupe by URL)
          if (finalDocs.length > 0) {
            const { data: existingProjDocs } = await supabase
              .from("project_documents")
              .select("file_url")
              .eq("project_id", existingProject.id);
            
            const existingDocUrls = new Set((existingProjDocs || []).map(d => d.file_url));
            const newDocs = finalDocs
              .filter(doc => !existingDocUrls.has(doc.url))
              .map((doc, idx) => ({
                project_id: existingProject.id,
                file_url: doc.url,
                file_name: doc.name,
                document_type: doc.type,
                display_order: existingDocUrls.size + idx
              }));
            
            if (newDocs.length > 0) {
              await supabase.from("project_documents").insert(newDocs);
              console.log(`[RepairExtraction] Added ${newDocs.length} new documents to project`);
            }
          }
        }
      }

      return new Response(JSON.stringify({
        success: true,
        source: "reelly",
        name: item.name,
        reelly_id: reellyId,
        images: finalImages.length,
        documents: finalDocs.length,
        floor_plans: finalFloorPlans.length,
        amenities: finalAmenities.length,
        stillIncomplete: !isComplete,
        synced_to_project: !!item.slug,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ========== FALLBACK: FIRECRAWL SCRAPING (NON-REELLY) ==========
    if (!firecrawlKey || !lovableKey) {
      return new Response(JSON.stringify({ error: "Missing API keys for scraping" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[RepairExtraction] Using Firecrawl scraping for: ${item.name}`);

    // Scrape with rawHtml - with rate limit handling
    const scrapeRes = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${firecrawlKey}` },
      body: JSON.stringify({ url, formats: ["markdown", "links", "rawHtml"], waitFor: 10000, timeout: 90000, onlyMainContent: false }),
    });

    // Handle rate limiting gracefully - return 503 with retry guidance
    if (scrapeRes.status === 429) {
      const errText = await scrapeRes.text();
      const retryMatch = errText.match(/retry after (\d+)s/i);
      const retryAfter = retryMatch ? parseInt(retryMatch[1], 10) : 60;
      console.warn(`[RepairExtraction] Rate limited for ${item.name}, retry after ${retryAfter}s`);
      return new Response(JSON.stringify({ 
        error: "Rate limited", 
        code: "RATE_LIMITED",
        retry_after_seconds: retryAfter,
        message: `Firecrawl rate limit reached. Please wait ${retryAfter} seconds and try again.`
      }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": String(retryAfter) },
      });
    }

    // Handle insufficient credits (402)
    if (scrapeRes.status === 402) {
      console.warn(`[RepairExtraction] Firecrawl credits exhausted for ${item.name}`);
      return new Response(JSON.stringify({ 
        error: "Credits exhausted", 
        code: "CREDITS_EXHAUSTED",
        message: "Firecrawl API credits have run out."
      }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!scrapeRes.ok) {
      const errText = await scrapeRes.text();
      return new Response(JSON.stringify({ error: "Scrape failed", details: errText.substring(0, 200) }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const scrapeData = await scrapeRes.json();
    const markdown = scrapeData.data?.markdown || "";
    const links = scrapeData.data?.links || [];
    const html = scrapeData.data?.rawHtml || "";

    // Extract images with ENHANCED filtering
    const imageSet = new Set<string>();
    const projectImageUrls: string[] = [];
    
    for (const l of links) {
      if (l.includes("cloudfront.net") && /\.(jpg|jpeg|png|webp)/i.test(l)) {
        imageSet.add(l);
        if (l.includes("/off-plan/") && l.includes("/images/")) {
          projectImageUrls.push(l);
        }
      }
    }
    const imgRx = /<img[^>]+(?:src|data-src|data-lazy-src)=["']([^"']+)["']/gi;
    let m: RegExpExecArray | null;
    while ((m = imgRx.exec(html)) !== null) {
      if (m[1]?.includes("cloudfront.net") && /\.(jpg|jpeg|png|webp)/i.test(m[1])) {
        imageSet.add(m[1]);
        if (m[1].includes("/off-plan/") && m[1].includes("/images/")) {
          projectImageUrls.push(m[1]);
        }
      }
    }
    
    const excludePatterns = /(logo|icon|avatar|placeholder|spinner|favicon|brochure|payment[-_]?plan|floor[-_]?plan|master[-_]?plan|pdf|document|navbar|header|footer|menu|widget|sidebar|banner|thumbnail|thumb_|_thumb|social|share|button|btn_|grid_\d+|general_brochure)/i;
    
    const prioritizedImages = projectImageUrls.length >= 2 
      ? [...new Set(projectImageUrls)]
      : [...new Set([...projectImageUrls, ...Array.from(imageSet)])];
    
    const imageUrls = prioritizedImages
      .filter((u) => !excludePatterns.test(u))
      .filter((u) => !u.startsWith("data:"))
      .map((u) => u.replace(/\/x\/\d+x\d+\//, "/x/464x312/"))
      .slice(0, 12);

    // Extract PDFs
    const pdfRx = /https?:\/\/[^\s"'<>\)]+\.pdf(?:\?[^\s"'<>\)]*)?/gi;
    const pdfs = [...new Set([...(markdown.match(pdfRx) || []), ...(html.match(pdfRx) || [])])];
    let brochureUrl: string | null = null;
    let paymentPlanUrl: string | null = null;
    const floorPlanUrls: string[] = [];
    for (const p of pdfs) {
      const lower = p.toLowerCase();
      if (!brochureUrl && lower.includes("brochure")) brochureUrl = p;
      else if (!paymentPlanUrl && lower.includes("payment")) paymentPlanUrl = p;
      else if (lower.includes("floor")) floorPlanUrls.push(p);
    }
    if (!brochureUrl && pdfs.length > 0) {
      const leftover = pdfs.filter((p) => p !== paymentPlanUrl && !floorPlanUrls.includes(p));
      if (leftover.length > 0) brochureUrl = leftover[0];
    }

    // AI extraction
    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${lovableKey}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Extract real estate project details. Return ONLY valid JSON, no markdown." },
          {
            role: "user",
            content: `Extract project details:
CONTENT:
${markdown.substring(0, 25000)}

IMAGES:
${imageUrls.slice(0, 20).join("\n")}

DOCUMENTS:
brochure: ${brochureUrl || "none"}
payment_plan: ${paymentPlanUrl || "none"}
floor_plans: ${floorPlanUrls.join(", ") || "none"}

Return JSON:
{
  "name": "Project Name",
  "developer_name": "Developer",
  "location": "Area",
  "bedrooms": "1-4 BR",
  "price_from": 1500000,
  "price_text": "AED 1.5M",
  "payment_plan": "60/40",
  "handover_display": "Q2 2028",
  "property_type_label": "Apartment",
  "status_label": "Future Launch or null",
  "description": "2-3 sentence description",
  "amenities": ["Pool","Gym"],
  "image_urls": ["cloudfront urls"]
}`
          }
        ],
        temperature: 0.05,
        max_tokens: 3000,
      }),
    });

    let extracted: Record<string, unknown> = {};
    if (aiRes.ok) {
      const aiData = await aiRes.json();
      const content = aiData.choices?.[0]?.message?.content || "";
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try { extracted = JSON.parse(jsonMatch[0].replace(/,\s*([\]}])/g, "$1")); } catch { /* ignore */ }
      }
    }

    const aiImageUrls = Array.isArray(extracted.image_urls) ? (extracted.image_urls as string[]) : [];
    const combinedImages = [...new Set([...aiImageUrls, ...imageUrls])].slice(0, 12);
    const imagesPayload = combinedImages.map((u, i) => ({ url: u, alt_text: `${item.name} - Image ${i + 1}`, display_order: i }));

    const documentsPayload: Array<{ url: string; type: string; name?: string }> = [];
    if (brochureUrl) documentsPayload.push({ url: brochureUrl, type: "brochure", name: `${item.name} Brochure.pdf` });
    if (paymentPlanUrl) documentsPayload.push({ url: paymentPlanUrl, type: "payment_plan", name: `${item.name} Payment Plan.pdf` });
    for (const fp of floorPlanUrls) documentsPayload.push({ url: fp, type: "floor_plan", name: `${item.name} Floor Plan.pdf` });

    const updatedDescription = (extracted.description as string) || item.description || null;
    const updatedDevName = (extracted.developer_name as string) || item.developer_name || null;
    
    const validImages = imagesPayload.filter(img => 
      img.url.includes('/off-plan/') || 
      (!img.url.includes('navbar') && !img.url.includes('apartment_navbar') && !img.url.includes('_nav'))
    );
    
    // Never overwrite existing data with empty arrays
    const existingImages = Array.isArray(item.images) ? item.images : [];
    const existingDocs = Array.isArray(item.documents) ? item.documents : [];
    
    const finalImages = validImages.length > existingImages.length 
      ? imagesPayload 
      : (validImages.length > 0 ? imagesPayload : existingImages);
    
    const finalDocuments = documentsPayload.length > existingDocs.length 
      ? documentsPayload 
      : (documentsPayload.length > 0 ? documentsPayload : existingDocs);
    
    const finalHasMinimal = Boolean(
      updatedDescription && 
      updatedDevName && 
      updatedDevName.toLowerCase() !== "unknown" && 
      finalImages.length >= 1
    );
    const finalStillIncomplete = !finalHasMinimal;

    const { error: updateErr } = await supabase
      .from("pending_project_imports")
      .update({
        developer_name: updatedDevName,
        description: updatedDescription,
        price_from: (extracted.price_from as number) ?? item.price_from,
        handover_date: (extracted.handover_display as string) ?? item.handover_date,
        payment_plan: (extracted.payment_plan as string) ?? item.payment_plan,
        property_type_label: (extracted.property_type_label as string) ?? item.property_type_label,
        status_label: (extracted.status_label as string) ?? item.status_label,
        amenities: Array.isArray(extracted.amenities) ? extracted.amenities : item.amenities,
        images: finalImages,
        documents: finalDocuments,
        review_notes: finalStillIncomplete ? "INCOMPLETE: Re-scrape recommended" : null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", pendingImportId);

    if (updateErr) {
      return new Response(JSON.stringify({ error: "Update failed", details: updateErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({
      success: true,
      source: "firecrawl",
      name: item.name,
      images: finalImages.length,
      documents: finalDocuments.length,
      stillIncomplete: finalStillIncomplete,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Repair extraction error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
