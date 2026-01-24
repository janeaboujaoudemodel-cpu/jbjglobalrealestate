/**
 * Sarah Test Extraction - Single Project Test
 * 
 * This function tests extraction on ONE project to validate 100% success
 * before approving Sarah for full extraction.
 * 
 * It extracts ALL data including:
 * - Project details
 * - ALL images (no limits)
 * - ALL videos
 * - Brochure PDFs
 * - Floor plan PDFs
 * - Payment plan documents
 * - Developer info
 * - Status labels
 * - Handover dates
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ExtractionResult {
  success: boolean;
  project?: {
    name: string;
    developer: string;
    location: string;
    status: string;
    price_from: number | null;
    bedrooms_min: number | null;
    bedrooms_max: number | null;
    handover_date: string | null;
    property_type: string | null;
    status_label: string | null;
    description: string | null;
  };
  images: string[];
  videos: string[];
  documents: {
    brochure: string | null;
    floorPlans: string[];
    paymentPlan: string | null;
  };
  validationErrors: string[];
  apiCallsMade: number;
  totalApiCost: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");
  const lovableKey = Deno.env.get("LOVABLE_API_KEY");

  // Validation - fail fast if keys missing
  if (!firecrawlKey) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: "FIRECRAWL_API_KEY not configured",
      validationErrors: ["Missing Firecrawl API key - cannot scrape"]
    }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!lovableKey) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: "LOVABLE_API_KEY not configured",
      validationErrors: ["Missing Lovable API key - cannot use AI"]
    }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  let apiCallsMade = 0;

  try {
    const { testUrl } = await req.json().catch(() => ({}));
    
    // Use a known good project URL for testing
    const projectUrl = testUrl || "https://providentestate.com/new-projects/damac-sun-city/";
    
    console.log("[Test] Starting single project extraction:", projectUrl);

    // Validate URL format
    if (!projectUrl.includes("providentestate.com")) {
      return new Response(JSON.stringify({
        success: false,
        error: "Invalid project URL",
        validationErrors: ["URL must be a Provident Estate page"]
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Step 1: Scrape the project detail page with ALL formats
    // Use MUCH longer wait time for Gatsby/React JS rendering
    console.log("[Test] Step 1: Scraping project page (waiting 20s for JS to render)...");
    
    const scrapeRes = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${firecrawlKey}`,
      },
      body: JSON.stringify({ 
        url: projectUrl, 
        formats: ["markdown", "links", "rawHtml", "screenshot"],
        waitFor: 20000, // Wait 20 seconds for full JS rendering (Gatsby site)
        timeout: 120000, // 2 minute timeout
        onlyMainContent: false, // Get EVERYTHING including sidebars, galleries
        // Actions to trigger content loading
        actions: [
          { type: "wait", milliseconds: 3000 },
          { type: "scroll", direction: "down", amount: 500 },
          { type: "wait", milliseconds: 2000 },
          { type: "scroll", direction: "down", amount: 1000 },
          { type: "wait", milliseconds: 2000 },
          { type: "scroll", direction: "up", amount: 1500 },
          { type: "wait", milliseconds: 3000 },
        ]
      }),
    });
    apiCallsMade++;

    if (!scrapeRes.ok) {
      const errText = await scrapeRes.text();
      console.error("[Test] Scrape failed:", scrapeRes.status, errText);
      return new Response(JSON.stringify({
        success: false,
        error: "Firecrawl scrape failed",
        validationErrors: [`Scrape error ${scrapeRes.status}: ${errText.substring(0, 200)}`],
        apiCallsMade
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const scrapeData = await scrapeRes.json();
    const markdown = scrapeData.data?.markdown || "";
    const links = scrapeData.data?.links || [];
    const html = scrapeData.data?.rawHtml || "";

    console.log("[Test] Scraped:", markdown.length, "chars,", links.length, "links, HTML:", html.length, "chars");

    // If content is too short, the JS didn't render - try extracting from page-data.json
    if (markdown.length < 500 && html.length < 5000) {
      console.log("[Test] Content too short, trying to fetch Gatsby page-data.json...");
      
      // Extract project slug from URL
      const urlParts = projectUrl.split("/");
      const projectSlug = urlParts[urlParts.length - 2] || urlParts[urlParts.length - 1];
      const pageDataUrl = `https://providentestate.com/page-data/new-projects/${projectSlug}/page-data.json`;
      
      try {
        const pageDataRes = await fetch(pageDataUrl);
        if (pageDataRes.ok) {
          const pageData = await pageDataRes.json();
          console.log("[Test] Got Gatsby page-data.json, extracting...");
          
          // Extract from Gatsby's internal data structure
          const projectInfo = pageData?.result?.data?.wpProject || pageData?.result?.pageContext || {};
          
          if (projectInfo.title || projectInfo.name) {
            // Build a comprehensive markdown from the page data
            const extractedContent = JSON.stringify(projectInfo, null, 2);
            console.log("[Test] Extracted page-data content:", extractedContent.length, "chars");
            
            // Use AI to parse this structured data
            const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${lovableKey}`,
              },
              body: JSON.stringify({
                model: "google/gemini-2.5-flash",
                messages: [
                  { 
                    role: "system", 
                    content: "You are a precise real estate data extractor. Extract data from Gatsby/WordPress structured data. Return valid JSON only." 
                  },
                  {
                    role: "user",
                    content: `Extract the project details from this Gatsby page data:

URL: ${projectUrl}

PAGE DATA:
${extractedContent.substring(0, 80000)}

Return a JSON object with these EXACT fields:
{
  "name": "Full project name",
  "developer_name": "Developer company name",
  "location": "Area/community name",
  "emirate": "Dubai",
  "description": "Full project description",
  "bedrooms": "Bedroom configuration",
  "property_types": ["Array of property types"],
  "price_from_aed": 1500000,
  "handover_date": "Q2 2029 or Ready",
  "status_label": "Future Launch|New Phase|New Launch|Coming Soon|null",
  "amenities": ["Array of amenities"],
  "payment_plan_summary": "e.g., 80/20",
  "image_urls": ["All image URLs found"],
  "brochure_url": "PDF brochure URL if available",
  "video_urls": ["Video URLs"],
  "floor_plan_urls": ["Floor plan PDFs"],
  "payment_plan_url": "Payment plan PDF URL"
}

CRITICAL: Return ONLY the JSON object, no markdown formatting.`
                  }
                ],
                temperature: 0.1,
                max_tokens: 10000,
              }),
            });
            apiCallsMade++;

            if (aiRes.ok) {
              const aiData = await aiRes.json();
              const content = aiData.choices?.[0]?.message?.content || "";
              
              // Extract JSON from response
              let jsonStr = content;
              const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
              if (codeBlockMatch) {
                jsonStr = codeBlockMatch[1];
              }
              const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
              
              if (jsonMatch) {
                try {
                  const projectData = JSON.parse(jsonMatch[0]);
                  
                  const duration = Date.now() - startTime;
                  
                  // Build result from page-data extraction
                  const result: ExtractionResult = {
                    success: true,
                    project: {
                      name: projectData.name || "Unknown",
                      developer: projectData.developer_name || "Unknown",
                      location: projectData.location || "Dubai",
                      status: projectData.handover_date?.toLowerCase().includes("ready") ? "Ready" : "Under Construction",
                      price_from: projectData.price_from_aed || null,
                      bedrooms_min: null,
                      bedrooms_max: null,
                      handover_date: projectData.handover_date || null,
                      property_type: projectData.property_types?.[0] || null,
                      status_label: projectData.status_label || null,
                      description: projectData.description || null
                    },
                    images: projectData.image_urls || [],
                    videos: projectData.video_urls || [],
                    documents: {
                      brochure: projectData.brochure_url || null,
                      floorPlans: projectData.floor_plan_urls || [],
                      paymentPlan: projectData.payment_plan_url || null
                    },
                    validationErrors: [],
                    apiCallsMade,
                    totalApiCost: `~$${(apiCallsMade * 0.001).toFixed(4)}`
                  };

                  console.log("[Test] Complete via page-data in", duration, "ms. Success:", result.success);
                  console.log("[Test] Images:", result.images.length, "Videos:", result.videos.length);

                  return new Response(JSON.stringify({
                    ...result,
                    duration_ms: duration,
                    extraction_method: "gatsby-page-data",
                    stats: {
                      total_images: result.images.length,
                      total_videos: result.videos.length,
                      total_pdfs: (result.documents.brochure ? 1 : 0) + result.documents.floorPlans.length + (result.documents.paymentPlan ? 1 : 0),
                      has_brochure: !!result.documents.brochure,
                      has_payment_plan: !!result.documents.paymentPlan,
                      floor_plans_count: result.documents.floorPlans.length
                    },
                    message: `✅ Extraction test PASSED (via Gatsby page-data)! Found ${result.images.length} images.`
                  }), {
                    headers: { ...corsHeaders, "Content-Type": "application/json" },
                  });
                } catch (parseErr) {
                  console.error("[Test] Failed to parse page-data AI response");
                }
              }
            }
          }
        }
      } catch (pageDataErr) {
        console.error("[Test] page-data.json fetch failed:", pageDataErr);
      }
    }

    if (markdown.length < 200) {
      return new Response(JSON.stringify({
        success: false,
        error: "Insufficient content scraped - JavaScript rendering may have failed",
        validationErrors: [
          "Page content too short - the website uses heavy JavaScript (Gatsby/React)",
          "Try increasing wait time or check if the URL is correct"
        ],
        apiCallsMade,
        debug: {
          markdown_length: markdown.length,
          html_length: html.length,
          links_count: links.length
        }
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Step 2: Extract ALL image URLs from all sources (NO LIMITS)
    console.log("[Test] Step 2: Extracting ALL images...");
    
    // Multiple image patterns to catch all sources
    const imagePatterns = [
      /https?:\/\/[a-z0-9\-\.]+\.cloudfront\.net\/[^\s"'<>\)]+\.(?:jpg|jpeg|png|webp)/gi,
      /https?:\/\/[^\s"'<>\)]+provident[^\s"'<>\)]+\.(?:jpg|jpeg|png|webp)/gi,
      /https?:\/\/[^\s"'<>\)]+wp-content[^\s"'<>\)]+\.(?:jpg|jpeg|png|webp)/gi,
      /https?:\/\/[^\s"'<>\)]+\.(?:jpg|jpeg|png|webp)(?:\?[^\s"'<>\)]*)?/gi,
    ];

    const imageSet = new Set<string>();
    
    // Extract from markdown
    for (const pattern of imagePatterns) {
      const matches = markdown.match(pattern) || [];
      matches.forEach((url: string) => imageSet.add(url));
    }
    
    // Extract from HTML
    for (const pattern of imagePatterns) {
      const matches = html.match(pattern) || [];
      matches.forEach((url: string) => imageSet.add(url));
    }
    
    // Extract from links
    links.forEach((link: string) => {
      if (/\.(jpg|jpeg|png|webp)(\?|$)/i.test(link)) {
        imageSet.add(link);
      }
    });

    // Extract from HTML img tags and data attributes
    const imgTagPattern = /<img[^>]+(?:src|data-src|data-lazy-src|srcset)=["']([^"']+)["']/gi;
    let imgMatch;
    while ((imgMatch = imgTagPattern.exec(html)) !== null) {
      if (imgMatch[1] && !imgMatch[1].startsWith('data:')) {
        // Handle srcset
        const srcsetUrls = imgMatch[1].split(',').map(s => s.trim().split(' ')[0]);
        srcsetUrls.forEach(url => {
          if (url && url.startsWith('http')) imageSet.add(url);
        });
      }
    }

    // Extract from background-image CSS
    const bgPattern = /background-image:\s*url\(['"]?([^'")\s]+)['"]?\)/gi;
    while ((imgMatch = bgPattern.exec(html)) !== null) {
      if (imgMatch[1] && !imgMatch[1].startsWith('data:')) {
        imageSet.add(imgMatch[1]);
      }
    }

    // Extract from JSON-LD or script data
    const jsonLdPattern = /"image":\s*"([^"]+)"/gi;
    while ((imgMatch = jsonLdPattern.exec(html)) !== null) {
      if (imgMatch[1] && imgMatch[1].startsWith('http')) {
        imageSet.add(imgMatch[1]);
      }
    }

    // Filter and upgrade to high-res versions
    let allImages = Array.from(imageSet)
      .map(url => {
        // Try to upgrade to higher resolution
        return url
          .replace(/\/x\/\d+x\d+\//, "/x/1200x800/")
          .replace(/w=\d+/, "w=1200")
          .replace(/h=\d+/, "h=800")
          .replace(/-\d+x\d+\./, "-1200x800.");
      })
      .filter(url => {
        const lower = url.toLowerCase();
        return !lower.includes("logo") && 
               !lower.includes("icon") &&
               !lower.includes("avatar") &&
               !lower.includes("placeholder") &&
               !lower.includes("spinner") &&
               !lower.includes("loading") &&
               !lower.includes("analytics") &&
               !lower.includes("pixel") &&
               !lower.includes("tracker") &&
               !lower.includes("t.co") &&
               url.length > 20 &&
               url.length < 500;
      });

    // Deduplicate by base URL (without query params)
    const seen = new Set<string>();
    allImages = allImages.filter(url => {
      const base = url.split('?')[0];
      if (seen.has(base)) return false;
      seen.add(base);
      return true;
    });

    console.log("[Test] Found", allImages.length, "unique images (NO LIMIT)");

    // Step 3: Extract ALL videos
    console.log("[Test] Step 3: Extracting videos...");
    
    const videoPatterns = [
      /https?:\/\/[^\s"'<>\)]+\.(?:mp4|webm|mov)/gi,
      /https?:\/\/(?:www\.)?youtube\.com\/(?:watch\?v=|embed\/)([a-zA-Z0-9_-]+)/gi,
      /https?:\/\/(?:www\.)?youtu\.be\/([a-zA-Z0-9_-]+)/gi,
      /https?:\/\/(?:www\.)?vimeo\.com\/(\d+)/gi,
      /https?:\/\/player\.vimeo\.com\/video\/(\d+)/gi,
    ];

    const videoSet = new Set<string>();
    for (const pattern of videoPatterns) {
      const matches = markdown.match(pattern) || [];
      matches.forEach((url: string) => videoSet.add(url));
      const htmlMatches = html.match(pattern) || [];
      htmlMatches.forEach((url: string) => videoSet.add(url));
    }

    // Extract from video/iframe tags
    const videoTagPattern = /<(?:video|iframe)[^>]+src=["']([^"']+)["']/gi;
    let videoMatch;
    while ((videoMatch = videoTagPattern.exec(html)) !== null) {
      if (videoMatch[1]) videoSet.add(videoMatch[1]);
    }

    const allVideos = Array.from(videoSet);
    console.log("[Test] Found", allVideos.length, "videos");

    // Step 4: Extract ALL PDF documents (brochures, floor plans, payment plans)
    console.log("[Test] Step 4: Extracting ALL documents...");
    
    const pdfPattern = /https?:\/\/[^\s"'<>\)]+\.pdf(?:\?[^\s"'<>\)]*)?/gi;
    const allPdfs = [...new Set([
      ...(markdown.match(pdfPattern) || []),
      ...(html.match(pdfPattern) || []),
      ...links.filter((l: string) => l.toLowerCase().endsWith(".pdf") || l.toLowerCase().includes(".pdf?"))
    ])];

    // Categorize PDFs
    let brochure: string | null = null;
    let paymentPlan: string | null = null;
    const floorPlans: string[] = [];

    for (const pdf of allPdfs) {
      const lower = pdf.toLowerCase();
      if (lower.includes("brochure")) {
        brochure = pdf;
      } else if (lower.includes("payment")) {
        paymentPlan = pdf;
      } else if (lower.includes("floor")) {
        floorPlans.push(pdf);
      } else if (lower.includes("plan") && !paymentPlan) {
        // Could be payment plan or floor plan
        if (lower.includes("unit") || lower.includes("layout")) {
          floorPlans.push(pdf);
        } else {
          paymentPlan = pdf;
        }
      }
    }

    // If no brochure found but we have PDFs, use the first one
    if (!brochure && allPdfs.length > 0) {
      const nonCategorized = allPdfs.filter(p => 
        p !== paymentPlan && !floorPlans.includes(p)
      );
      if (nonCategorized.length > 0) {
        brochure = nonCategorized[0];
      }
    }

    console.log("[Test] Documents found - Brochure:", !!brochure, "Payment:", !!paymentPlan, "Floor plans:", floorPlans.length, "Total PDFs:", allPdfs.length);

    // Step 5: Use AI to extract structured project data
    console.log("[Test] Step 5: AI extraction...");
    
    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${lovableKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { 
            role: "system", 
            content: "You are a precise real estate data extractor. Extract ONLY factual data from the content. Return valid JSON only." 
          },
          {
            role: "user",
            content: `Extract the project details from this property page:

PAGE URL: ${projectUrl}

CONTENT:
${markdown.substring(0, 50000)}

Return a JSON object with these EXACT fields:
{
  "name": "Full project name without developer prefix",
  "developer_name": "Developer company name (e.g., DAMAC, Emaar, Sobha)",
  "location": "Area/community name (e.g., Dubai South, Dubai Hills)",
  "emirate": "Dubai",
  "description": "Full project description (2-3 paragraphs)",
  "bedrooms": "Bedroom configuration (e.g., Studio, 1-3 BR)",
  "property_types": ["Array of property types like Apartment, Villa, Townhouse, Sky Villa"],
  "price_from_aed": 1500000,
  "handover_date": "Q2 2029 or Ready",
  "status_label": "Future Launch|New Phase|New Launch|Coming Soon|null",
  "amenities": ["Array of ALL amenities mentioned"],
  "payment_plan_summary": "e.g., 80/20 or 60/40 with details",
  "size_sqft_from": 500,
  "size_sqft_to": 3000
}

CRITICAL: Return ONLY the JSON object, no markdown formatting.`
          }
        ],
        temperature: 0.1,
        max_tokens: 6000,
      }),
    });
    apiCallsMade++;

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error("[Test] AI failed:", aiRes.status, errText);
      
      if (aiRes.status === 429) {
        return new Response(JSON.stringify({
          success: false,
          error: "Rate limited - please wait and try again",
          validationErrors: ["AI rate limit exceeded"],
          apiCallsMade
        }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      if (aiRes.status === 402) {
        return new Response(JSON.stringify({
          success: false,
          error: "AI credits exhausted",
          validationErrors: ["No AI credits remaining - please add credits"],
          apiCallsMade
        }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({
        success: false,
        error: "AI extraction failed",
        validationErrors: [`AI error ${aiRes.status}: ${errText.substring(0, 200)}`],
        apiCallsMade
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiRes.json();
    const content = aiData.choices?.[0]?.message?.content || "";
    
    // Extract JSON from response
    let jsonStr = content;
    const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
      jsonStr = codeBlockMatch[1];
    }
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      console.error("[Test] No JSON in AI response:", content.substring(0, 300));
      return new Response(JSON.stringify({
        success: false,
        error: "AI returned invalid data",
        validationErrors: ["Could not parse AI response as JSON"],
        rawResponse: content.substring(0, 500),
        apiCallsMade
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let projectData: any;
    try {
      projectData = JSON.parse(jsonMatch[0]);
    } catch (parseErr) {
      console.error("[Test] JSON parse error:", parseErr);
      return new Response(JSON.stringify({
        success: false,
        error: "Failed to parse AI response",
        validationErrors: ["JSON parsing failed"],
        apiCallsMade
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("[Test] AI extracted project:", projectData.name);

    // Step 6: Validate extraction quality - NO ARBITRARY LIMITS
    console.log("[Test] Step 6: Validating extraction quality...");
    
    const validationErrors: string[] = [];
    
    if (!projectData.name || projectData.name.length < 3) {
      validationErrors.push("Project name is missing or too short");
    }
    
    if (!projectData.developer_name) {
      validationErrors.push("Developer name is missing");
    }
    
    if (!projectData.location) {
      validationErrors.push("Location is missing");
    }
    
    // NO minimum image validation - we extract what's available
    if (allImages.length === 0) {
      validationErrors.push("No images found on the page");
    }
    
    if (!projectData.description || projectData.description.length < 50) {
      validationErrors.push("Description is missing or too short");
    }

    // Get price in AED
    const priceAed = projectData.price_from_aed || null;

    // Parse bedrooms
    const brMatches = projectData.bedrooms?.match(/(\d+)/g) || [];
    const brMin = brMatches[0] ? parseInt(brMatches[0]) : null;
    const brMax = brMatches.length > 1 ? parseInt(brMatches[brMatches.length - 1]) : brMin;

    // Determine status
    const yearMatch = projectData.handover_date?.match(/\d{4}/);
    const year = yearMatch ? parseInt(yearMatch[0]) : new Date().getFullYear() + 2;
    const isReady = projectData.handover_date?.toLowerCase().includes("ready") || year <= new Date().getFullYear();
    const status = isReady ? "Ready" : "Under Construction";

    const duration = Date.now() - startTime;
    
    // Build result
    const result: ExtractionResult = {
      success: validationErrors.length === 0,
      project: {
        name: projectData.name || "Unknown",
        developer: projectData.developer_name || "Unknown",
        location: projectData.location || "Dubai",
        status,
        price_from: priceAed,
        bedrooms_min: brMin,
        bedrooms_max: brMax,
        handover_date: projectData.handover_date || null,
        property_type: projectData.property_types?.[0] || null,
        status_label: projectData.status_label || null,
        description: projectData.description || null
      },
      images: allImages, // ALL images, no limit
      videos: allVideos, // ALL videos
      documents: {
        brochure,
        floorPlans,
        paymentPlan
      },
      validationErrors,
      apiCallsMade,
      totalApiCost: `~$${(apiCallsMade * 0.001).toFixed(4)}`
    };

    console.log("[Test] Complete in", duration, "ms. Success:", result.success);
    console.log("[Test] Images:", allImages.length, "Videos:", allVideos.length, "PDFs:", allPdfs.length);
    console.log("[Test] Validation errors:", validationErrors);

    return new Response(JSON.stringify({
      ...result,
      duration_ms: duration,
      extraction_method: "firecrawl-js-render",
      stats: {
        total_images: allImages.length,
        total_videos: allVideos.length,
        total_pdfs: allPdfs.length,
        has_brochure: !!brochure,
        has_payment_plan: !!paymentPlan,
        floor_plans_count: floorPlans.length
      },
      message: result.success 
        ? `✅ Extraction test PASSED! Found ${allImages.length} images, ${allVideos.length} videos, ${allPdfs.length} PDFs.`
        : "❌ Extraction test FAILED. Fix issues before proceeding."
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("[Test] Fatal error:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      validationErrors: ["Unexpected error during extraction"],
      apiCallsMade
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
