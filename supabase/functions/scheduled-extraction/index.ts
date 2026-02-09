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

// Extract projects from scraped content using Lovable AI
async function extractProjectsWithAI(markdown: string, sourceName: string): Promise<ExternalProject[]> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  
  if (!LOVABLE_API_KEY) {
    console.log("No Lovable API key - using regex extraction");
    return extractProjectsWithRegex(markdown);
  }

  try {
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
For each REAL project listing (not generic headers or promotional text), extract:
- project_name: The actual name of the property/project (e.g., "The Grand at Downtown", "Marina Heights")
- developer: The developer company name (e.g., "Emaar", "DAMAC", "Sobha")
- location: The specific area/community (e.g., "Downtown Dubai", "Dubai Marina")
- emirate: Dubai, Abu Dhabi, etc.
- status: Off-Plan, Ready, Under Construction, etc.
- price_from: Starting price in AED (number only)
- price_to: Maximum price in AED (number only)
- handover_date: Expected handover date/quarter (e.g., "Q4 2025", "2026")
- description: Brief description of the project
- amenities: Array of amenities if mentioned

IMPORTANT: Only extract REAL project names. Ignore generic text like "Premium Quality", "Strong Investment Returns", or section headers. A real project name is specific like "Damac Hills 2" or "Emaar Beachfront".

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

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Lovable AI extraction failed:", errorText);
      return extractProjectsWithRegex(markdown);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "[]";
    
    // Clean and parse JSON
    let cleanJson = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    
    const projects = JSON.parse(cleanJson);
    console.log(`Lovable AI extracted ${projects.length} real projects`);
    return projects;
  } catch (e) {
    console.error("AI extraction error:", e);
    return extractProjectsWithRegex(markdown);
  }
}

// Fallback regex extraction
function extractProjectsWithRegex(markdown: string): ExternalProject[] {
  const projects: ExternalProject[] = [];
  
  // Look for patterns like "Project Name - Developer" or headers with project info
  const projectPatterns = [
    /##\s*([A-Z][^#\n]+)/g,  // Markdown headers
    /\*\*([A-Z][^*]+)\*\*/g, // Bold text
    /Project:\s*([^\n]+)/gi,
    /Property:\s*([^\n]+)/gi,
  ];

  const seen = new Set<string>();
  
  for (const pattern of projectPatterns) {
    let match;
    while ((match = pattern.exec(markdown)) !== null) {
      const name = match[1].trim();
      if (name.length > 3 && name.length < 100 && !seen.has(name.toLowerCase())) {
        seen.add(name.toLowerCase());
        
        // Try to extract more context around this match
        const context = markdown.substring(Math.max(0, match.index - 200), match.index + 500);
        
        const priceMatch = context.match(/AED\s*([\d,]+)/i);
        const locationMatch = context.match(/(?:in|at|location:?)\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i);
        const developerMatch = context.match(/(?:by|developer:?)\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i);
        
        projects.push({
          project_name: name,
          developer: developerMatch?.[1] || undefined,
          location: locationMatch?.[1] || undefined,
          emirate: "Dubai",
          price_from: priceMatch ? parseInt(priceMatch[1].replace(/,/g, "")) : undefined,
        });
      }
    }
  }

  console.log(`Regex extracted ${projects.length} projects`);
  return projects;
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
      console.log(`Processing source: ${source.name} (${source.base_url})`);

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
        let scrapedContent = "";

        // Use Firecrawl to scrape the source
        if (FIRECRAWL_KEY && source.base_url) {
          console.log(`Scraping ${source.base_url} with Firecrawl...`);
          
          try {
            const scrapeResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${FIRECRAWL_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                url: source.base_url,
                formats: ["markdown"],
                onlyMainContent: true,
                waitFor: 3000,
              }),
            });

            if (scrapeResponse.ok) {
              const scraped = await scrapeResponse.json();
              scrapedContent = scraped.data?.markdown || "";
              console.log(`Scraped ${scrapedContent.length} characters from ${source.name}`);

              if (scrapedContent.length > 100) {
                externalProjects = await extractProjectsWithAI(scrapedContent, source.name);
              }
            } else {
              const errorText = await scrapeResponse.text();
              console.error("Firecrawl error:", errorText);
            }
          } catch (scrapeErr) {
            console.error("Scraping failed:", scrapeErr);
          }
        } else {
          console.log("No Firecrawl API key configured - skipping web scraping");
        }

        // Process extracted projects
        let recordsFound = externalProjects.length;
        let recordsMatched = 0;
        let recordsPending = 0;

        for (const extProject of externalProjects) {
          const match = findBestMatch(extProject, allListings);
          
          if (match) {
            recordsMatched++;
            
            const existingListing = allListings.find(l => l.id === match.listing_id);
            if (!existingListing) continue;

            // Check for fields that can be added (not replaced)
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
            // No match - this could be a new project to add
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
        await supabase
          .from("extraction_job_logs")
          .update({
            status: "completed",
            completed_at: new Date().toISOString(),
            records_found: recordsFound,
            records_matched: recordsMatched,
            records_pending: recordsPending,
            metadata: { 
              manual, 
              content_length: scrapedContent.length,
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
          status: "completed",
          found: recordsFound,
          matched: recordsMatched,
          pending: recordsPending,
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
        message: "Extraction job completed",
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
