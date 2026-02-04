import { createClient } from "@supabase/supabase-js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface AssetExtractionResult {
  floorPlans: Array<{ label: string; pdfUrl?: string; imageUrl?: string }>;
  documents: Array<{ type: string; url: string; name?: string }>;
  amenitiesMedia: Array<{ label: string; imageUrl: string }>;
  masterPlanUrl: string | null;
  bedroomTypes: string[];
  unitTypes: Array<{
    type: string;
    size_from?: number;
    size_to?: number;
    price_from?: number;
    available_units?: number;
  }>;
}

/**
 * Extract floor plans from markdown/links
 * Looks for patterns like "Floor Plans", PDF links, image galleries
 */
function extractFloorPlans(markdown: string, links: string[]): AssetExtractionResult["floorPlans"] {
  const floorPlans: AssetExtractionResult["floorPlans"] = [];
  
  // Find PDF links that look like floor plans
  const pdfRegex = /https?:\/\/[^\s"'<>]+\.pdf/gi;
  const pdfLinks = markdown.match(pdfRegex) || [];
  
  for (const pdfUrl of pdfLinks) {
    const lowerUrl = pdfUrl.toLowerCase();
    if (lowerUrl.includes("floor") || lowerUrl.includes("plan") || lowerUrl.includes("layout")) {
      const label = extractLabelFromUrl(pdfUrl) || "Floor Plan";
      floorPlans.push({ label, pdfUrl });
    }
  }
  
  // Also check links array for floor plan images
  for (const link of links) {
    const lowerLink = link.toLowerCase();
    if ((lowerLink.includes("floor") || lowerLink.includes("plan")) && 
        (lowerLink.endsWith(".jpg") || lowerLink.endsWith(".png") || lowerLink.endsWith(".webp"))) {
      const label = extractLabelFromUrl(link) || "Floor Plan";
      floorPlans.push({ label, imageUrl: link });
    }
  }
  
  return floorPlans;
}

/**
 * Extract documents (brochures, fact sheets, etc.)
 */
function extractDocuments(markdown: string, links: string[]): AssetExtractionResult["documents"] {
  const documents: AssetExtractionResult["documents"] = [];
  
  // Find PDF links
  const pdfRegex = /https?:\/\/[^\s"'<>]+\.pdf/gi;
  const pdfLinks = markdown.match(pdfRegex) || [];
  
  for (const url of pdfLinks) {
    const lowerUrl = url.toLowerCase();
    let type = "document";
    let name = extractLabelFromUrl(url);
    
    if (lowerUrl.includes("brochure")) {
      type = "brochure";
      name = name || "Project Brochure";
    } else if (lowerUrl.includes("fact") || lowerUrl.includes("sheet")) {
      type = "fact_sheet";
      name = name || "Fact Sheet";
    } else if (lowerUrl.includes("floor") || lowerUrl.includes("plan")) {
      type = "floor_plan";
      name = name || "Floor Plan";
    } else if (lowerUrl.includes("payment")) {
      type = "payment_plan";
      name = name || "Payment Plan";
    }
    
    documents.push({ type, url, name: name || undefined });
  }
  
  return documents;
}

/**
 * Extract amenities with their associated images
 */
function extractAmenitiesMedia(markdown: string, links: string[]): AssetExtractionResult["amenitiesMedia"] {
  const amenitiesMedia: AssetExtractionResult["amenitiesMedia"] = [];
  
  // Common amenity keywords
  const amenityKeywords = [
    "pool", "gym", "spa", "garden", "park", "playground", "tennis",
    "basketball", "yoga", "meditation", "lounge", "lobby", "concierge",
    "parking", "security", "cctv", "sauna", "steam", "jacuzzi",
    "restaurant", "cafe", "retail", "supermarket", "mosque", "school",
    "kids", "children", "clubhouse", "beach", "marina", "lake",
    "jogging", "running", "cycling", "bbq", "barbecue"
  ];
  
  // Look for image links that match amenity keywords
  for (const link of links) {
    const lowerLink = link.toLowerCase();
    if (lowerLink.endsWith(".jpg") || lowerLink.endsWith(".png") || lowerLink.endsWith(".webp")) {
      for (const keyword of amenityKeywords) {
        if (lowerLink.includes(keyword)) {
          const label = capitalizeLabel(keyword);
          amenitiesMedia.push({ label, imageUrl: link });
          break;
        }
      }
    }
  }
  
  return amenitiesMedia;
}

/**
 * Extract master plan URL
 */
function extractMasterPlan(markdown: string, links: string[]): string | null {
  // Look for master plan image or PDF
  for (const link of links) {
    const lowerLink = link.toLowerCase();
    if (lowerLink.includes("master") && lowerLink.includes("plan")) {
      return link;
    }
  }
  
  // Check markdown for master plan mentions
  const masterPlanMatch = markdown.match(/master\s*plan[^]*?(https?:\/\/[^\s"'<>]+\.(jpg|png|pdf|webp))/i);
  if (masterPlanMatch) {
    return masterPlanMatch[1];
  }
  
  return null;
}

/**
 * Extract bedroom types from markdown
 * Looks for patterns like "1BR, 2BR, 3BR Duplex, Penthouse"
 */
function extractBedroomTypes(markdown: string): string[] {
  const bedroomTypes: Set<string> = new Set();
  
  // Pattern: 1BR, 2 BR, 3-Bedroom, Studio, Penthouse, Duplex, etc.
  const patterns = [
    /\b(studio)\b/gi,
    /\b(\d+)\s*(?:BR|Bedroom|Bed)\b/gi,
    /\b(penthouse)\b/gi,
    /\b(duplex)\b/gi,
    /\b(townhouse)\b/gi,
    /\b(villa)\b/gi,
  ];
  
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(markdown)) !== null) {
      const type = match[0].trim();
      // Normalize: "2 BR" -> "2BR", "Studio" -> "Studio"
      const normalized = type.replace(/\s+/g, "").replace(/bedroom/i, "BR").replace(/bed\b/i, "BR");
      bedroomTypes.add(normalized);
    }
  }
  
  // Sort numerically then alphabetically
  return Array.from(bedroomTypes).sort((a, b) => {
    const numA = parseInt(a) || 999;
    const numB = parseInt(b) || 999;
    if (numA !== numB) return numA - numB;
    return a.localeCompare(b);
  });
}

/**
 * Extract unit types with pricing info
 */
function extractUnitTypes(markdown: string): AssetExtractionResult["unitTypes"] {
  const unitTypes: AssetExtractionResult["unitTypes"] = [];
  
  // Look for tables or structured unit data
  // Pattern: "1BR | 650 sqft | AED 1,200,000"
  const unitPattern = /(\d+\s*BR|Studio|Penthouse|Duplex)[^|]*\|?\s*(\d[\d,]*)\s*(?:sqft|sq\.?ft)?[^|]*\|?\s*(?:AED|USD|$)?\s*([\d,]+)/gi;
  
  let match;
  while ((match = unitPattern.exec(markdown)) !== null) {
    const type = match[1].trim();
    const size = parseInt(match[2].replace(/,/g, ""));
    const price = parseInt(match[3].replace(/,/g, ""));
    
    unitTypes.push({
      type,
      size_from: size || undefined,
      price_from: price || undefined,
    });
  }
  
  return unitTypes;
}

// Helper functions
function extractLabelFromUrl(url: string): string | null {
  try {
    const filename = url.split("/").pop()?.split("?")[0] || "";
    const nameWithoutExt = filename.replace(/\.[^.]+$/, "");
    return nameWithoutExt
      .replace(/[-_]/g, " ")
      .replace(/\b\w/g, c => c.toUpperCase())
      .trim() || null;
  } catch {
    return null;
  }
}

function capitalizeLabel(word: string): string {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

/**
 * Scrape a Reelly project page using Firecrawl
 */
async function scrapeReellyPage(url: string, firecrawlApiKey: string): Promise<{ markdown: string; links: string[] }> {
  const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${firecrawlApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url,
      formats: ["markdown", "links"],
      onlyMainContent: true,
      waitFor: 5000,
      timeout: 60000,
    }),
  });
  
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Firecrawl scrape failed: ${error}`);
  }
  
  const data = await response.json();
  return {
    markdown: data.data?.markdown || data.markdown || "",
    links: data.data?.links || data.links || [],
  };
}

/**
 * Main handler
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const firecrawlApiKey = Deno.env.get("FIRECRAWL_API_KEY");
    
    if (!firecrawlApiKey) {
      return new Response(
        JSON.stringify({ error: "FIRECRAWL_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Parse request body
    let options: {
      action?: "fill_single" | "fill_batch" | "test";
      importId?: string;
      limit?: number;
    } = { action: "fill_batch", limit: 10 };
    
    try {
      const body = await req.json();
      options = { ...options, ...body };
    } catch {
      // No body provided
    }
    
    console.log(`[Fill Missing Assets] Action: ${options.action}`);
    
    // TEST action - just return info about what would be processed
    if (options.action === "test") {
      const { data: pending } = await supabase
        .from("pending_project_imports")
        .select("id, name, source_url, floor_plan_types, documents")
        .eq("status", "pending")
        .like("source_url", "%reelly%")
        .limit(5);
      
      const needsFilling = pending?.filter(p => 
        (!p.floor_plan_types || (p.floor_plan_types as any[]).length === 0) ||
        (!p.documents || (p.documents as any[]).length === 0)
      ) || [];
      
      return new Response(
        JSON.stringify({
          success: true,
          message: `Found ${needsFilling.length} Reelly projects needing asset fill`,
          samples: needsFilling.map(p => ({
            id: p.id,
            name: p.name,
            hasFloorPlans: Array.isArray(p.floor_plan_types) && p.floor_plan_types.length > 0,
            hasDocuments: Array.isArray(p.documents) && p.documents.length > 0,
          })),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // FILL_SINGLE action
    if (options.action === "fill_single" && options.importId) {
      const { data: pending, error } = await supabase
        .from("pending_project_imports")
        .select("*")
        .eq("id", options.importId)
        .single();
      
      if (error || !pending) {
        return new Response(
          JSON.stringify({ error: "Import not found" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      // Extract Reelly project ID from source_url
      const reellyIdMatch = pending.source_url?.match(/reelly_(\d+)/);
      if (!reellyIdMatch) {
        return new Response(
          JSON.stringify({ error: "Not a Reelly import or missing project ID" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      const reellyProjectId = reellyIdMatch[1];
      const reellyUrl = `https://reelly.io/off-plan/${reellyProjectId}`;
      
      console.log(`[Fill Missing Assets] Scraping ${reellyUrl}`);
      
      const { markdown, links } = await scrapeReellyPage(reellyUrl, firecrawlApiKey);
      
      // Extract assets
      const floorPlans = extractFloorPlans(markdown, links);
      const documents = extractDocuments(markdown, links);
      const amenitiesMedia = extractAmenitiesMedia(markdown, links);
      const masterPlanUrl = extractMasterPlan(markdown, links);
      const bedroomTypes = extractBedroomTypes(markdown);
      const unitTypes = extractUnitTypes(markdown);
      
      // Build update object - only update missing fields
      const updates: Record<string, any> = {};
      
      if (floorPlans.length > 0 && (!pending.floor_plan_types || (pending.floor_plan_types as any[]).length === 0)) {
        updates.floor_plan_types = floorPlans;
      }
      
      if (documents.length > 0 && (!pending.documents || (pending.documents as any[]).length === 0)) {
        updates.documents = documents;
      }
      
      if (bedroomTypes.length > 0 && (!pending.bedroom_types || (pending.bedroom_types as any[]).length === 0)) {
        updates.bedroom_types = bedroomTypes;
      }
      
      if (unitTypes.length > 0 && (!pending.unit_types || (pending.unit_types as any[]).length === 0)) {
        updates.unit_types = unitTypes;
      }
      
      // Store amenities media as part of amenities_list if empty
      if (amenitiesMedia.length > 0 && (!pending.amenities_list || (pending.amenities_list as any[]).length === 0)) {
        updates.amenities_list = amenitiesMedia.map(a => a.label);
        // Store full amenity data as highlights (or a new column)
        updates.highlights = amenitiesMedia;
      }
      
      if (Object.keys(updates).length > 0) {
        updates.updated_at = new Date().toISOString();
        
        const { error: updateError } = await supabase
          .from("pending_project_imports")
          .update(updates)
          .eq("id", options.importId);
        
        if (updateError) {
          throw updateError;
        }
      }
      
      return new Response(
        JSON.stringify({
          success: true,
          importId: options.importId,
          extracted: {
            floorPlans: floorPlans.length,
            documents: documents.length,
            amenitiesMedia: amenitiesMedia.length,
            bedroomTypes: bedroomTypes.length,
            unitTypes: unitTypes.length,
            masterPlanUrl: !!masterPlanUrl,
          },
          updated: Object.keys(updates).filter(k => k !== "updated_at"),
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // FILL_BATCH action - process multiple imports
    const limit = Math.min(Math.max(options.limit || 10, 1), 50);
    
    // Find Reelly imports that need asset filling
    const { data: pending } = await supabase
      .from("pending_project_imports")
      .select("id, name, source_url, floor_plan_types, documents")
      .eq("status", "pending")
      .like("source_url", "%reelly%")
      .limit(limit * 2); // Fetch more to filter
    
    const needsFilling = pending?.filter(p => 
      (!p.floor_plan_types || (p.floor_plan_types as any[]).length === 0) ||
      (!p.documents || (p.documents as any[]).length === 0)
    ).slice(0, limit) || [];
    
    console.log(`[Fill Missing Assets] Processing ${needsFilling.length} imports`);
    
    let filled = 0;
    let skipped = 0;
    const errors: string[] = [];
    
    for (const imp of needsFilling) {
      try {
        const reellyIdMatch = imp.source_url?.match(/reelly_(\d+)/);
        if (!reellyIdMatch) {
          skipped++;
          continue;
        }
        
        const reellyProjectId = reellyIdMatch[1];
        const reellyUrl = `https://reelly.io/off-plan/${reellyProjectId}`;
        
        const { markdown, links } = await scrapeReellyPage(reellyUrl, firecrawlApiKey);
        
        const floorPlans = extractFloorPlans(markdown, links);
        const documents = extractDocuments(markdown, links);
        const bedroomTypes = extractBedroomTypes(markdown);
        
        const updates: Record<string, any> = {};
        
        if (floorPlans.length > 0 && (!imp.floor_plan_types || (imp.floor_plan_types as any[]).length === 0)) {
          updates.floor_plan_types = floorPlans;
        }
        
        if (documents.length > 0 && (!imp.documents || (imp.documents as any[]).length === 0)) {
          updates.documents = documents;
        }
        
        if (bedroomTypes.length > 0) {
          updates.bedroom_types = bedroomTypes;
        }
        
        if (Object.keys(updates).length > 0) {
          updates.updated_at = new Date().toISOString();
          
          await supabase
            .from("pending_project_imports")
            .update(updates)
            .eq("id", imp.id);
          
          filled++;
        } else {
          skipped++;
        }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (err) {
        errors.push(`${imp.name}: ${(err as Error).message}`);
      }
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        processed: needsFilling.length,
        filled,
        skipped,
        errors: errors.slice(0, 10),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    console.error("[Fill Missing Assets] Error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
