import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

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
  image_url?: string;
}

interface MatchResult {
  listing_id: string;
  listing_table: string;
  confidence_score: number;
  match_method: string;
}

// Smart matching function
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

    if (externalNumber && listingNumber && externalNumber === listingNumber) {
      score = 0.95;
      method = "exact_project_number";
    } else if (externalName && listingName && externalName === listingName) {
      score = 0.90;
      method = "exact_name";
    } else if (externalName && listingName && 
               (listingName.includes(externalName) || externalName.includes(listingName))) {
      const overlap = Math.min(externalName.length, listingName.length) / 
                      Math.max(externalName.length, listingName.length);
      score = 0.70 + (overlap * 0.15);
      method = "partial_name";
    } else if (externalName && listingName) {
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

// ── Direct API extraction for known REST API sources ──
async function extractFromDubaiRestApi(baseUrl: string): Promise<ExternalProject[]> {
  const projects: ExternalProject[] = [];
  
  try {
    // Dubai REST / DLD API - fetch off-plan projects
    const endpoints = [
      `${baseUrl}/api/transactions/offplan`,
      `${baseUrl}/api/projects`,
    ];
    
    for (const endpoint of endpoints) {
      try {
        console.log(`Trying Dubai REST endpoint: ${endpoint}`);
        const res = await fetch(endpoint, {
          headers: { "Accept": "application/json" },
          signal: AbortSignal.timeout(15000),
        });
        
        if (!res.ok) {
          console.log(`Endpoint ${endpoint} returned ${res.status}, trying next...`);
          continue;
        }
        
        const data = await res.json();
        const items = Array.isArray(data) ? data : (data.data || data.results || data.projects || []);
        
        if (!Array.isArray(items) || items.length === 0) {
          console.log(`Endpoint ${endpoint} returned no array data`);
          continue;
        }
        
        console.log(`Got ${items.length} items from ${endpoint}`);
        
        for (const item of items) {
          const name = item.project_name || item.projectName || item.name || item.title;
          if (!name) continue;
          
          projects.push({
            project_name: name,
            developer: item.developer || item.developer_name || item.developerName,
            location: item.area || item.location || item.community || item.area_name,
            emirate: item.emirate || "Dubai",
            status: item.status || item.project_status || "Off-Plan",
            price_from: item.price_from || item.priceFrom || item.min_price,
            price_to: item.price_to || item.priceTo || item.max_price,
            handover_date: item.handover_date || item.handoverDate || item.completion_date,
            description: item.description,
            amenities: item.amenities,
            image_url: item.image_url || item.imageUrl || item.thumbnail,
          });
        }
        
        if (projects.length > 0) break; // Got data, no need to try more endpoints
      } catch (endpointErr) {
        console.log(`Endpoint ${endpoint} failed:`, endpointErr instanceof Error ? endpointErr.message : "unknown");
      }
    }
  } catch (err) {
    console.error("Dubai REST API extraction failed:", err);
  }
  
  console.log(`Dubai REST API extracted ${projects.length} projects`);
  return projects;
}

// Extract from Provident website using Firecrawl
async function extractFromProvident(baseUrl: string, firecrawlKey: string): Promise<ExternalProject[]> {
  const projects: ExternalProject[] = [];
  
  try {
    console.log(`Scraping Provident: ${baseUrl}`);
    
    const scrapeResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${firecrawlKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: baseUrl,
        formats: ["markdown", "links"],
        onlyMainContent: true,
        waitFor: 5000,
        timeout: 30000,
      }),
    });
    
    if (!scrapeResponse.ok) {
      console.error("Firecrawl error for Provident:", await scrapeResponse.text());
      return projects;
    }
    
    const scraped = await scrapeResponse.json();
    const markdown = scraped.data?.markdown || "";
    const links = scraped.data?.links || [];
    
    console.log(`Provident scraped: ${markdown.length} chars, ${links.length} links`);
    
    if (markdown.length < 100) return projects;
    
    // Use AI to extract project listings from the Provident page
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.log("No Lovable API key for AI extraction");
      return projects;
    }
    
    const response = await fetch("https://api.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are extracting real estate project listings from a Provident Estate webpage.
For each REAL project, extract:
- project_name: The actual project name (e.g., "Damac Hills 2", "The Oasis by Emaar")
- developer: Developer company name
- location: Area/community in Dubai
- emirate: "Dubai"
- status: "Off-Plan", "Ready", etc.
- price_from: Starting price in AED (number only)
- handover_date: Expected date/quarter
- description: Brief description
- amenities: Array of amenities if listed

IMPORTANT: Only extract REAL project names. Ignore headers, navigation items, promotional text.
Return ONLY a valid JSON array. No markdown, no explanation.`
          },
          {
            role: "user",
            content: `Extract all real estate project listings:\n\n${markdown.substring(0, 25000)}`
          }
        ],
        temperature: 0.1,
        max_tokens: 4000,
      }),
    });
    
    if (response.ok) {
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || "[]";
      const cleanJson = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      
      try {
        const extracted = JSON.parse(cleanJson);
        if (Array.isArray(extracted)) {
          projects.push(...extracted);
        }
      } catch (parseErr) {
        console.error("Failed to parse AI extraction result:", parseErr);
      }
    }
  } catch (err) {
    console.error("Provident extraction failed:", err);
  }
  
  console.log(`Provident extracted ${projects.length} projects`);
  return projects;
}

// Generic Firecrawl + AI extraction (fallback)
async function extractWithFirecrawl(baseUrl: string, sourceName: string, firecrawlKey: string): Promise<ExternalProject[]> {
  try {
    const scrapeResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${firecrawlKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: baseUrl,
        formats: ["markdown"],
        onlyMainContent: true,
        waitFor: 3000,
      }),
    });

    if (!scrapeResponse.ok) {
      console.error("Firecrawl error:", await scrapeResponse.text());
      return [];
    }

    const scraped = await scrapeResponse.json();
    const markdown = scraped.data?.markdown || "";
    
    if (markdown.length < 100) {
      console.log(`Too little content scraped from ${sourceName} (${markdown.length} chars)`);
      return [];
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return [];

    const response = await fetch("https://api.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a real estate data extractor. Extract all property/project listings from the content.
For each REAL project listing, extract: project_name, developer, location, emirate, status, price_from, price_to, handover_date, description, amenities.
IMPORTANT: Only extract REAL project names. Ignore generic text.
Return ONLY valid JSON array. No markdown, no explanation.`
          },
          {
            role: "user",
            content: `Extract all real estate project listings from this ${sourceName} webpage content:\n\n${markdown.substring(0, 20000)}`
          }
        ],
        temperature: 0.1,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) return [];

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "[]";
    const cleanJson = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const projects = JSON.parse(cleanJson);
    console.log(`AI extracted ${projects.length} projects from ${sourceName}`);
    return Array.isArray(projects) ? projects : [];
  } catch (e) {
    console.error("Firecrawl+AI extraction error:", e);
    return [];
  }
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

    console.log("Starting scheduled extraction job...", { sourceId, manual });

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
        JSON.stringify({ success: true, message: "No active data sources", recordsFound: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get existing listings for matching
    const { data: existingProjects } = await supabase
      .from("projects")
      .select("id, name, developer, location, handover_date, price_from, price_to, amenities, description, rera_number");

    const allListings = (existingProjects || []).map(p => ({ ...p, _table: "projects" }));

    const results = [];
    const FIRECRAWL_KEY = Deno.env.get("FIRECRAWL_API_KEY");

    for (const source of sources) {
      console.log(`Processing source: ${source.name} (${source.base_url}) [type: ${source.source_type}]`);

      // Create job log entry
      const { data: jobLog, error: jobError } = await supabase
        .from("extraction_job_logs")
        .insert({
          source_id: source.id,
          status: "running",
          started_at: new Date().toISOString(),
          metadata: { manual, triggered_at: new Date().toISOString() },
        })
        .select()
        .single();

      if (jobError) {
        console.error("Failed to create job log:", jobError);
        continue;
      }

      try {
        let externalProjects: ExternalProject[] = [];

        // ── Route extraction by source type ──
        const url = (source.base_url || "").toLowerCase();
        
        if (source.source_type === "rest_api" || url.includes("dubailand") || url.includes("alnair") || url.includes("gateway")) {
          // Direct API call for known REST endpoints
          console.log(`Using direct API extraction for ${source.name}`);
          externalProjects = await extractFromDubaiRestApi(source.base_url);
        } else if (url.includes("provident")) {
          // Provident-specific extraction with Firecrawl + targeted AI
          if (FIRECRAWL_KEY) {
            console.log(`Using Provident-specific extraction for ${source.name}`);
            externalProjects = await extractFromProvident(source.base_url, FIRECRAWL_KEY);
          } else {
            console.log("No Firecrawl API key - cannot scrape Provident");
          }
        } else if (FIRECRAWL_KEY) {
          // Generic Firecrawl + AI fallback
          console.log(`Using generic Firecrawl+AI extraction for ${source.name}`);
          externalProjects = await extractWithFirecrawl(source.base_url, source.name, FIRECRAWL_KEY);
        } else {
          console.log(`No extraction method available for ${source.name} (no Firecrawl key)`);
        }

        // Process extracted projects
        let recordsFound = externalProjects.length;
        let recordsMatched = 0;
        let recordsPending = 0;

        if (recordsFound === 0) {
          console.log(`⚠️ No projects extracted from ${source.name}. Source URL: ${source.base_url}`);
        }

        for (const extProject of externalProjects) {
          const match = findBestMatch(extProject, allListings);
          
          if (match) {
            recordsMatched++;
            
            const existingListing = allListings.find(l => l.id === match.listing_id);
            if (!existingListing) continue;

            const fieldsToAdd: { field: string; current: string | null; proposed: string }[] = [];
            
            if (extProject.developer && !existingListing.developer) {
              fieldsToAdd.push({ field: "developer", current: null, proposed: extProject.developer });
            }
            if (extProject.location && !existingListing.location) {
              fieldsToAdd.push({ field: "location", current: null, proposed: extProject.location });
            }
            if (extProject.handover_date && !existingListing.handover_date) {
              fieldsToAdd.push({ field: "handover_date", current: null, proposed: extProject.handover_date });
            }
            if (extProject.price_from && !existingListing.price_from) {
              fieldsToAdd.push({ field: "price_from", current: null, proposed: String(extProject.price_from) });
            }
            if (extProject.description && !existingListing.description) {
              fieldsToAdd.push({ field: "description", current: null, proposed: extProject.description });
            }

            for (const change of fieldsToAdd) {
              recordsPending++;
              
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
          } else {
            recordsPending++;
            
            await supabase.from("listing_pending_updates").insert({
              listing_id: null,
              listing_table: "projects",
              source_id: source.id,
              job_id: jobLog.id,
              field_name: "new_project",
              current_value: null,
              proposed_value: JSON.stringify(extProject),
              change_type: "create",
              confidence_score: 0,
              match_method: "new_record",
              status: "pending",
            });
          }
        }

        // Update job log with results
        const jobStatus = recordsFound === 0 ? "completed_empty" : "completed";
        await supabase
          .from("extraction_job_logs")
          .update({
            status: jobStatus,
            completed_at: new Date().toISOString(),
            records_found: recordsFound,
            records_matched: recordsMatched,
            records_pending: recordsPending,
            error_message: recordsFound === 0 ? `No projects found from ${source.name}. The source may require a different extraction method or the URL may not contain listing data.` : null,
            metadata: { 
              manual, 
              source_type: source.source_type,
              extraction_method: source.source_type === "rest_api" ? "direct_api" : "firecrawl_ai",
              projects_extracted: externalProjects.length,
            },
          })
          .eq("id", jobLog.id);

        // Update source last extraction time
        await supabase
          .from("external_data_sources")
          .update({ last_extraction_at: new Date().toISOString() })
          .eq("id", source.id);

        results.push({
          source: source.name,
          status: jobStatus,
          found: recordsFound,
          matched: recordsMatched,
          pending: recordsPending,
          method: source.source_type === "rest_api" ? "direct_api" : "firecrawl_ai",
        });

        console.log(`Source ${source.name} completed: found=${recordsFound}, matched=${recordsMatched}, pending=${recordsPending}`);

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

    const totalFound = results.reduce((sum, r) => sum + (r.found || 0), 0);
    const totalMatched = results.reduce((sum, r) => sum + (r.matched || 0), 0);
    const totalPending = results.reduce((sum, r) => sum + (r.pending || 0), 0);

    return new Response(
      JSON.stringify({
        success: true,
        message: totalFound === 0 
          ? "Extraction completed but no projects were found. Check source URLs and extraction methods."
          : "Extraction job completed",
        results,
        summary: { totalFound, totalMatched, totalPending },
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