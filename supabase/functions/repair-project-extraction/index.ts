import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Repair a single pending import by re-scraping its source_url and updating the record.
 */

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");
  const lovableKey = Deno.env.get("LOVABLE_API_KEY");
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  if (!firecrawlKey || !lovableKey) {
    return new Response(JSON.stringify({ error: "Missing API keys" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

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
      return new Response(JSON.stringify({ error: "No source_url to scrape" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[RepairExtraction] Re-scraping: ${item.name} from ${url}`);

    // Scrape with rawHtml - with rate limit handling
    const scrapeRes = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${firecrawlKey}` },
      body: JSON.stringify({ url, formats: ["markdown", "links", "rawHtml"], waitFor: 10000, timeout: 90000, onlyMainContent: false }),
    });

    // Handle rate limiting gracefully - return 503 with retry guidance
    if (scrapeRes.status === 429) {
      const errText = await scrapeRes.text();
      // Extract retry time from error if available
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

    // Handle insufficient credits (402) - return user-friendly error
    if (scrapeRes.status === 402) {
      console.warn(`[RepairExtraction] Firecrawl credits exhausted for ${item.name}`);
      return new Response(JSON.stringify({ 
        error: "Credits exhausted", 
        code: "CREDITS_EXHAUSTED",
        message: "Firecrawl API credits have run out. Please upgrade your plan at https://firecrawl.dev/pricing or wait for credits to reset."
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
    
    // CRITICAL: Enhanced exclusion pattern - catches navbar, header, footer, menu images
    const excludePatterns = /(logo|icon|avatar|placeholder|spinner|favicon|brochure|payment[-_]?plan|floor[-_]?plan|master[-_]?plan|pdf|document|navbar|header|footer|menu|widget|sidebar|banner|thumbnail|thumb_|_thumb|social|share|button|btn_|grid_\d+|general_brochure)/i;
    
    // PRIORITY: Use project-specific images first, then fall back to generic
    const prioritizedImages = projectImageUrls.length >= 2 
      ? [...new Set(projectImageUrls)]
      : [...new Set([...projectImageUrls, ...Array.from(imageSet)])];
    
    // CRITICAL FIX: Use SAFE image size (464x312) - 1200x800 causes 403 errors on Provident CDN
    const imageUrls = prioritizedImages
      .filter((u) => !excludePatterns.test(u))
      .filter((u) => !u.startsWith("data:")) // Drop base64 placeholders
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
    
    // CRITICAL: Validate images are REAL project images, not navbar placeholders
    const validImages = imagesPayload.filter(img => 
      img.url.includes('/off-plan/') || 
      (!img.url.includes('navbar') && !img.url.includes('apartment_navbar') && !img.url.includes('_nav'))
    );
    
    // STRICT completeness: description + developer + 2+ VALID unique images + at least 1 document
    const hasMinimal = Boolean(
      updatedDescription && 
      updatedDevName && 
      updatedDevName.toLowerCase() !== "unknown" && 
      validImages.length >= 2
    );
    const hasDocs = documentsPayload.length > 0;
    const stillIncomplete = !hasMinimal || !hasDocs;

    // CRITICAL FIX: Never overwrite existing images/documents with empty arrays
    // This prevents the "repair deleted my photos" bug
    const existingImages = Array.isArray(item.images) ? item.images : [];
    const existingDocs = Array.isArray(item.documents) ? item.documents : [];
    
    // Only use new images if we found more than existing, or existing is empty
    const finalImages = validImages.length > existingImages.length 
      ? imagesPayload 
      : (validImages.length > 0 ? imagesPayload : existingImages);
    
    // Only use new documents if we found any and existing is empty or we found more
    const finalDocuments = documentsPayload.length > existingDocs.length 
      ? documentsPayload 
      : (documentsPayload.length > 0 ? documentsPayload : existingDocs);
    
    // Recalculate completeness with final values
    const finalHasMinimal = Boolean(
      updatedDescription && 
      updatedDevName && 
      updatedDevName.toLowerCase() !== "unknown" && 
      finalImages.length >= 1 // Accept 1+ images (Reelly only provides cover)
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
      name: item.name,
      images: finalImages.length,
      documents: finalDocuments.length,
      stillIncomplete: finalStillIncomplete,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
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
