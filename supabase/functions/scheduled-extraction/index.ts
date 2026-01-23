import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ExternalProject {
  project_name: string;
  project_number?: string;
  developer?: string;
  location?: string;
  emirate?: string;
  status?: string;
  price_from?: number;
  price_to?: number;
  handover_date?: string;
  amenities?: string[];
  description?: string;
}

interface MatchResult {
  listing_id: string;
  listing_table: string;
  confidence_score: number;
  match_method: string;
}

// Smart matching function - matches by project name or number
function findBestMatch(
  externalProject: ExternalProject,
  existingListings: any[]
): MatchResult | null {
  let bestMatch: MatchResult | null = null;
  let highestScore = 0;

  const externalName = externalProject.project_name?.toLowerCase().trim() || "";
  const externalNumber = externalProject.project_number?.toLowerCase().trim() || "";

  for (const listing of existingListings) {
    let score = 0;
    let method = "";

    const listingName = (listing.name || listing.project_name || "").toLowerCase().trim();
    const listingNumber = (listing.project_number || listing.rera_number || "").toLowerCase().trim();

    // Exact project number match (highest confidence)
    if (externalNumber && listingNumber && externalNumber === listingNumber) {
      score = 0.95;
      method = "exact_project_number";
    }
    // Exact name match
    else if (externalName && listingName && externalName === listingName) {
      score = 0.90;
      method = "exact_name";
    }
    // Name contains match
    else if (externalName && listingName && 
             (listingName.includes(externalName) || externalName.includes(listingName))) {
      const overlap = Math.min(externalName.length, listingName.length) / 
                      Math.max(externalName.length, listingName.length);
      score = 0.70 + (overlap * 0.15);
      method = "partial_name";
    }
    // Fuzzy name matching (Levenshtein-like)
    else if (externalName && listingName) {
      const similarity = calculateSimilarity(externalName, listingName);
      if (similarity > 0.75) {
        score = similarity * 0.85;
        method = "fuzzy_name";
      }
    }

    if (score > highestScore && score >= 0.60) {
      highestScore = score;
      bestMatch = {
        listing_id: listing.id,
        listing_table: listing._table || "projects",
        confidence_score: Math.round(score * 100) / 100,
        match_method: method,
      };
    }
  }

  return bestMatch;
}

// Simple similarity calculation
function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;
  
  if (longer.length === 0) return 1.0;
  
  let matches = 0;
  const shorterWords = shorter.split(/\s+/);
  const longerWords = longer.split(/\s+/);
  
  for (const word of shorterWords) {
    if (longerWords.some(w => w.includes(word) || word.includes(w))) {
      matches++;
    }
  }
  
  return matches / Math.max(shorterWords.length, longerWords.length);
}

// Compare values and detect what's new (safe update logic - only ADD new info)
function detectNewInfo(
  externalData: ExternalProject,
  existingListing: any
): { field: string; current: string | null; proposed: string }[] {
  const changes: { field: string; current: string | null; proposed: string }[] = [];
  
  const fieldsToCheck = [
    { external: "developer", existing: "developer" },
    { external: "location", existing: "location" },
    { external: "handover_date", existing: "handover_date" },
    { external: "price_from", existing: "price_from" },
    { external: "price_to", existing: "price_to" },
    { external: "description", existing: "description" },
  ];

  for (const field of fieldsToCheck) {
    const externalValue = externalData[field.external as keyof ExternalProject];
    const existingValue = existingListing[field.existing];

    // Only propose if external has value AND existing is empty/null
    if (externalValue && !existingValue) {
      changes.push({
        field: field.existing,
        current: null,
        proposed: String(externalValue),
      });
    }
  }

  // Handle amenities array (merge, don't replace)
  if (externalData.amenities && externalData.amenities.length > 0) {
    const existingAmenities = existingListing.amenities || [];
    const newAmenities = externalData.amenities.filter(
      a => !existingAmenities.some((e: string) => 
        e.toLowerCase() === a.toLowerCase()
      )
    );
    if (newAmenities.length > 0) {
      changes.push({
        field: "amenities_additions",
        current: JSON.stringify(existingAmenities),
        proposed: JSON.stringify(newAmenities),
      });
    }
  }

  return changes;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { sourceId, manual = false } = await req.json().catch(() => ({}));

    console.log("Starting scheduled extraction job...");

    // Get active data sources
    let sourcesQuery = supabase
      .from("external_data_sources")
      .select("*")
      .eq("is_active", true);

    if (sourceId) {
      sourcesQuery = sourcesQuery.eq("id", sourceId);
    }

    const { data: sources, error: sourcesError } = await sourcesQuery;

    if (sourcesError || !sources?.length) {
      console.log("No active data sources found");
      return new Response(
        JSON.stringify({ success: true, message: "No active data sources" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get all existing listings for matching
    const { data: existingProjects } = await supabase
      .from("projects")
      .select("id, name, developer, location, handover_date, price_from, price_to, amenities, description, rera_number");

    const { data: rentalListings } = await supabase
      .from("rental_listings")
      .select("id, property_name, location, emirate");

    const { data: sellerListings } = await supabase
      .from("seller_listings")
      .select("id, property_name, location, emirate");

    const allListings = [
      ...(existingProjects || []).map(p => ({ ...p, _table: "projects" })),
      ...(rentalListings || []).map(r => ({ ...r, name: r.property_name, _table: "rental_listings" })),
      ...(sellerListings || []).map(s => ({ ...s, name: s.property_name, _table: "seller_listings" })),
    ];

    const results = [];

    for (const source of sources) {
      console.log(`Processing source: ${source.name}`);

      // Create job log entry
      const { data: jobLog, error: jobError } = await supabase
        .from("extraction_job_logs")
        .insert({
          source_id: source.id,
          status: "running",
          started_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (jobError) {
        console.error("Failed to create job log:", jobError);
        continue;
      }

      try {
        // Fetch data from external source
        // Note: In production, this would call the actual API
        // For now, we simulate with mock data or use Firecrawl
        let externalProjects: ExternalProject[] = [];

        if (source.base_url.includes("dubailand.gov.ae")) {
          // Dubai REST API simulation - in production, use actual API
          console.log("Fetching from Dubai REST API...");
          // This would be: const response = await fetch(source.base_url + "/api/projects");
          // For now, we'll check if Firecrawl can help
          const FIRECRAWL_KEY = Deno.env.get("FIRECRAWL_API_KEY");
          if (FIRECRAWL_KEY) {
            try {
              const scrapeResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
                method: "POST",
                headers: {
                  "Authorization": `Bearer ${FIRECRAWL_KEY}`,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  url: source.base_url,
                  formats: ["markdown", "links"],
                  onlyMainContent: true,
                }),
              });
              
              if (scrapeResponse.ok) {
                const scraped = await scrapeResponse.json();
                console.log("Scraped Dubai REST data:", scraped.data?.markdown?.length || 0, "chars");
                // Parse the scraped data for project info
                // This is where AI extraction would happen
              }
            } catch (e) {
              console.log("Firecrawl extraction failed:", e);
            }
          }
        } else if (source.base_url.includes("alnair.ae")) {
          console.log("Fetching from Al Nair Registry...");
          // Similar approach for Al Nair
        }

        // Process extracted projects
        let recordsFound = externalProjects.length;
        let recordsMatched = 0;
        let recordsPending = 0;

        for (const extProject of externalProjects) {
          const match = findBestMatch(extProject, allListings);
          
          if (match) {
            recordsMatched++;
            
            // Get the existing listing details
            const existingListing = allListings.find(l => l.id === match.listing_id);
            if (!existingListing) continue;

            // Detect new information (safe update - only additions)
            const newInfo = detectNewInfo(extProject, existingListing);

            for (const change of newInfo) {
              recordsPending++;
              
              // Insert into pending updates queue
              await supabase.from("listing_pending_updates").insert({
                listing_id: match.listing_id,
                listing_table: match.listing_table,
                source_id: source.id,
                job_id: jobLog.id,
                field_name: change.field,
                current_value: change.current,
                proposed_value: change.proposed,
                change_type: "add",
                confidence_score: match.confidence_score,
                match_method: match.match_method,
                status: "pending",
              });
            }
          }
        }

        // Update job log with results
        await supabase
          .from("extraction_job_logs")
          .update({
            status: "completed",
            completed_at: new Date().toISOString(),
            records_found: recordsFound,
            records_matched: recordsMatched,
            records_pending: recordsPending,
          })
          .eq("id", jobLog.id);

        // Update source last extraction time
        await supabase
          .from("external_data_sources")
          .update({ last_extraction_at: new Date().toISOString() })
          .eq("id", source.id);

        results.push({
          source: source.name,
          status: "completed",
          found: recordsFound,
          matched: recordsMatched,
          pending: recordsPending,
        });

      } catch (sourceError) {
        console.error(`Error processing source ${source.name}:`, sourceError);
        
        await supabase
          .from("extraction_job_logs")
          .update({
            status: "failed",
            completed_at: new Date().toISOString(),
            error_message: sourceError instanceof Error ? sourceError.message : "Unknown error",
          })
          .eq("id", jobLog.id);

        results.push({
          source: source.name,
          status: "failed",
          error: sourceError instanceof Error ? sourceError.message : "Unknown error",
        });
      }
    }

    console.log("Extraction job completed:", results);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Extraction job completed",
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Extraction job error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Extraction failed",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
