/**
 * Sarah Test Extraction - Robust Single Project Test
 * 
 * Extracts project data with multiple fallback strategies:
 * 1. Firecrawl scrape (with proper timeout/waitFor)
 * 2. Gatsby page-data.json API
 * 3. Manual content parsing
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
  extraction_method?: string;
  duration_ms?: number;
}

// Extract project slug from various URL formats
function extractProjectSlug(url: string): string | null {
  const match = url.match(/new-projects\/([^\/\?#]+)/);
  return match ? match[1].replace(/\/$/, "") : null;
}

// Try fetching Gatsby page-data.json (most reliable for Provident)
async function fetchGatsbyPageData(projectSlug: string): Promise<any | null> {
  try {
    const pageDataUrl = `https://providentestate.com/page-data/new-projects/${projectSlug}/page-data.json`;
    console.log("[Sarah] Trying Gatsby API:", pageDataUrl);
    
    const res = await fetch(pageDataUrl, {
      headers: { "Accept": "application/json" }
    });
    
    if (!res.ok) {
      console.log("[Sarah] Gatsby API returned:", res.status);
      return null;
    }
    
    const data = await res.json();
    console.log("[Sarah] Gatsby API success, data size:", JSON.stringify(data).length);
    return data;
  } catch (err) {
    console.error("[Sarah] Gatsby API error:", err);
    return null;
  }
}

// Extract data from Gatsby page-data structure
function parseGatsbyData(pageData: any): Partial<ExtractionResult["project"]> & { images: string[], documents: any } {
  const project = pageData?.result?.data?.wpProject || 
                  pageData?.result?.data?.project ||
                  pageData?.result?.pageContext?.project ||
                  {};
  
  const acf = project.projectAcf || project.acf || {};
  const images: string[] = [];
  const documents = { brochure: null as string | null, floorPlans: [] as string[], paymentPlan: null as string | null };
  
  // Extract images from gallery
  const gallery = acf.gallery || acf.projectGallery || [];
  if (Array.isArray(gallery)) {
    gallery.forEach((img: any) => {
      const url = img?.sourceUrl || img?.url || img?.mediaItemUrl;
      if (url && typeof url === "string") images.push(url);
    });
  }
  
  // Extract featured image
  const featuredImage = project.featuredImage?.node?.sourceUrl || acf.featuredImage?.sourceUrl;
  if (featuredImage) images.unshift(featuredImage);
  
  // Extract PDFs
  const brochure = acf.brochure?.mediaItemUrl || acf.brochure?.url || acf.brochureUrl;
  if (brochure) documents.brochure = brochure;
  
  const paymentPlan = acf.paymentPlan?.mediaItemUrl || acf.paymentPlanUrl;
  if (paymentPlan) documents.paymentPlan = paymentPlan;
  
  // Floor plans
  const floorPlans = acf.floorPlans || [];
  if (Array.isArray(floorPlans)) {
    floorPlans.forEach((fp: any) => {
      const url = fp?.mediaItemUrl || fp?.url;
      if (url) documents.floorPlans.push(url);
    });
  }
  
  return {
    name: project.title || acf.projectName || "Unknown",
    developer: acf.developer?.title || acf.developerName || "Unknown",
    location: acf.location || acf.area || "Dubai",
    status: acf.status || "Under Construction",
    price_from: parsePrice(acf.priceFrom || acf.startingPrice),
    bedrooms_min: parseBedrooms(acf.bedrooms)?.[0] || null,
    bedrooms_max: parseBedrooms(acf.bedrooms)?.[1] || null,
    handover_date: acf.handover || acf.handoverDate || null,
    property_type: acf.propertyType || null,
    status_label: acf.statusLabel || null,
    description: project.content || acf.description || null,
    images,
    documents
  };
}

function parsePrice(val: any): number | null {
  if (!val) return null;
  if (typeof val === "number") return val;
  const match = String(val).replace(/,/g, "").match(/(\d+)/);
  return match ? parseInt(match[1]) : null;
}

function parseBedrooms(val: any): [number, number] | null {
  if (!val) return null;
  const str = String(val);
  const match = str.match(/(\d+)(?:\s*[-–]\s*(\d+))?/);
  if (!match) return null;
  const min = parseInt(match[1]);
  const max = match[2] ? parseInt(match[2]) : min;
  return [min, max];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();
  const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");
  const lovableKey = Deno.env.get("LOVABLE_API_KEY");
  let apiCallsMade = 0;

  // Check API keys
  if (!firecrawlKey) {
    return new Response(JSON.stringify({ 
      success: false, 
      error: "FIRECRAWL_API_KEY not configured",
      validationErrors: ["Missing Firecrawl API key"],
      apiCallsMade: 0,
      totalApiCost: "$0"
    }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { testUrl } = await req.json().catch(() => ({}));
    const projectUrl = testUrl || "https://providentestate.com/new-projects/damac-sun-city/";
    
    console.log("[Sarah] Starting extraction test:", projectUrl);

    // Validate URL
    if (!projectUrl.includes("providentestate.com")) {
      return new Response(JSON.stringify({
        success: false,
        error: "URL must be a Provident Estate page",
        validationErrors: ["Invalid URL - only providentestate.com supported"],
        apiCallsMade: 0,
        totalApiCost: "$0"
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const projectSlug = extractProjectSlug(projectUrl);
    console.log("[Sarah] Project slug:", projectSlug);

    // STRATEGY 1: Try Gatsby page-data.json first (fastest & most reliable)
    if (projectSlug) {
      const gatsbyData = await fetchGatsbyPageData(projectSlug);
      
      if (gatsbyData?.result?.data) {
        console.log("[Sarah] Using Gatsby API data");
        const parsed = parseGatsbyData(gatsbyData);
        
        const projectInfo = {
          name: parsed.name || "Unknown",
          developer: parsed.developer || "Unknown",
          location: parsed.location || "Dubai",
          status: parsed.status || "Under Construction",
          price_from: parsed.price_from ?? null,
          bedrooms_min: parsed.bedrooms_min ?? null,
          bedrooms_max: parsed.bedrooms_max ?? null,
          handover_date: parsed.handover_date ?? null,
          property_type: parsed.property_type ?? null,
          status_label: parsed.status_label ?? null,
          description: parsed.description ?? null
        };

        const result: ExtractionResult = {
          success: true,
          project: projectInfo,
          images: parsed.images || [],
          videos: [],
          documents: parsed.documents || { brochure: null, floorPlans: [], paymentPlan: null },
          validationErrors: [],
          apiCallsMade: 1,
          totalApiCost: "$0.001",
          extraction_method: "gatsby-api",
          duration_ms: Date.now() - startTime
        };

        // Validate we got enough data
        if (!projectInfo.name || projectInfo.name === "Unknown") {
          result.validationErrors.push("Could not extract project name");
          result.success = false;
        }

        console.log("[Sarah] Gatsby extraction complete:", projectInfo.name, "| Images:", result.images.length);

        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // STRATEGY 2: Try Firecrawl scrape with safe parameters
    console.log("[Sarah] Gatsby API unavailable, trying Firecrawl...");
    
    const scrapeRes = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${firecrawlKey}`,
      },
      body: JSON.stringify({ 
        url: projectUrl, 
        formats: ["markdown", "links"],
        waitFor: 10000,  // 10s wait (safe: < 30s default timeout / 2)
        timeout: 60000,  // 60s timeout
        onlyMainContent: false
      }),
    });
    apiCallsMade++;

    if (!scrapeRes.ok) {
      const errText = await scrapeRes.text();
      console.error("[Sarah] Firecrawl error:", scrapeRes.status, errText);
      
      // Parse error for user-friendly message
      let errorDetail = "Unknown scraping error";
      try {
        const errJson = JSON.parse(errText);
        if (errJson.code === "SCRAPE_ALL_ENGINES_FAILED") {
          errorDetail = "The website blocked the scraping attempt. This is a source limitation, not an app bug.";
        } else {
          errorDetail = errJson.error || errJson.message || errText.substring(0, 200);
        }
      } catch {
        errorDetail = errText.substring(0, 200);
      }

      return new Response(JSON.stringify({
        success: false,
        error: "Firecrawl scrape failed",
        validationErrors: [errorDetail],
        apiCallsMade,
        totalApiCost: `$${(apiCallsMade * 0.001).toFixed(4)}`,
        extraction_method: "firecrawl-failed",
        duration_ms: Date.now() - startTime
      }), {
        status: 200, // Return 200 so UI can display the error nicely
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const scrapeData = await scrapeRes.json();
    const markdown = scrapeData.data?.markdown || "";
    const links = scrapeData.data?.links || [];

    console.log("[Sarah] Firecrawl success:", markdown.length, "chars,", links.length, "links");

    // Extract images from links
    const images = links.filter((link: string) => 
      /\.(jpg|jpeg|png|webp)(\?|$)/i.test(link) &&
      !link.includes("logo") &&
      !link.includes("icon") &&
      link.includes("cloudfront") // Provident uses CloudFront for images
    );

    // Extract PDFs
    const pdfs = links.filter((link: string) => /\.pdf(\?|$)/i.test(link));
    const brochure = pdfs.find((p: string) => /brochure/i.test(p)) || pdfs[0] || null;
    const paymentPlan = pdfs.find((p: string) => /payment/i.test(p)) || null;
    const floorPlans = pdfs.filter((p: string) => /floor|plan/i.test(p));

    // Use AI to extract structured data if we have enough content
    let projectData = {
      name: projectSlug?.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase()) || "Unknown",
      developer: "Unknown",
      location: "Dubai",
      status: "Under Construction",
      price_from: null as number | null,
      bedrooms_min: null as number | null,
      bedrooms_max: null as number | null,
      handover_date: null as string | null,
      property_type: null as string | null,
      status_label: null as string | null,
      description: null as string | null
    };

    if (markdown.length > 500 && lovableKey) {
      console.log("[Sarah] Using AI to extract structured data...");
      
      try {
        const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${lovableKey}`,
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              { role: "system", content: "Extract real estate project data. Return ONLY valid JSON." },
              { role: "user", content: `Extract from this content:\n\n${markdown.substring(0, 15000)}\n\nReturn JSON: {"name":"","developer":"","location":"","price_from":null,"bedrooms":"","handover":"","property_type":"","description":""}` }
            ],
            temperature: 0.1,
            max_tokens: 2000,
          }),
        });
        apiCallsMade++;

        if (aiRes.ok) {
          const aiData = await aiRes.json();
          const content = aiData.choices?.[0]?.message?.content || "";
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]);
            projectData = {
              ...projectData,
              name: parsed.name || projectData.name,
              developer: parsed.developer || projectData.developer,
              location: parsed.location || projectData.location,
              price_from: parsePrice(parsed.price_from),
              bedrooms_min: parseBedrooms(parsed.bedrooms)?.[0] || null,
              bedrooms_max: parseBedrooms(parsed.bedrooms)?.[1] || null,
              handover_date: parsed.handover || null,
              property_type: parsed.property_type || null,
              description: parsed.description || null
            };
          }
        }
      } catch (aiErr) {
        console.error("[Sarah] AI extraction failed:", aiErr);
      }
    }

    const result: ExtractionResult = {
      success: true,
      project: projectData,
      images: images.slice(0, 50), // Limit for response size
      videos: [],
      documents: { brochure, floorPlans, paymentPlan },
      validationErrors: [],
      apiCallsMade,
      totalApiCost: `$${(apiCallsMade * 0.002).toFixed(4)}`,
      extraction_method: "firecrawl",
      duration_ms: Date.now() - startTime
    };

    // Validate results
    if (images.length === 0) {
      result.validationErrors.push("No images found - page may need different scraping approach");
    }
    if (projectData.name === "Unknown") {
      result.validationErrors.push("Could not extract project name");
    }

    result.success = result.validationErrors.length === 0;

    console.log("[Sarah] Complete:", projectData.name, "| Images:", result.images.length, "| Success:", result.success);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("[Sarah] Fatal error:", error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      validationErrors: ["Unexpected error occurred"],
      apiCallsMade,
      totalApiCost: `$${(apiCallsMade * 0.001).toFixed(4)}`,
      duration_ms: Date.now() - startTime
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
