import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const DEVELOPER_KEYWORDS: Record<string, string[]> = {
  "Emaar": ["emaar", "downtown", "dubai hills", "creek harbour", "arabian ranches"],
  "DAMAC": ["damac", "cavalli", "paramount", "aykon"],
  "Sobha": ["sobha", "hartland", "creek vistas"],
  "Nakheel": ["nakheel", "palm", "jumeirah islands"],
  "Meraas": ["meraas", "city walk", "la mer", "bluewaters"],
  "Dubai Properties": ["dubai properties", "business bay", "culture village"],
  "Azizi": ["azizi", "riviera", "aura"],
  "Danube": ["danube", "elz", "bayz", "viewz"],
  "Binghatti": ["binghatti", "jacob"],
  "Select Group": ["select group", "jumeirah living", "peninsula"],
  "MAG": ["mag", "meydan"],
  "Ellington": ["ellington", "wilton"],
  "Omniyat": ["omniyat", "one palm", "alba"],
  "Deyaar": ["deyaar", "montrose"],
  "MTS Development": ["mts", "sunset bay"],
  "Imtiaz": ["imtiaz"],
  "Reportage": ["reportage"],
  "Tiger Group": ["tiger"],
  "Samana": ["samana"],
  "Object 1": ["object 1"],
  "Vincitore": ["vincitore"],
  "Citi Developer": ["citi developer", "citideveloper"],
};

function toSlug(val: string): string {
  return val.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").replace(/-+/g, "-").slice(0, 80);
}

function humanizeDocTitle(rawName: string): string {
  let t = rawName
    .replace(/\.[a-z0-9]{2,5}$/i, "")
    .replace(/\(\d+\)\s*$/g, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!t) return rawName;
  return t.replace(/\b\w/g, c => c.toUpperCase());
}

function classifyDocument(name: string): string {
  const lower = (name || "").toLowerCase();
  if (lower.includes("brochure")) return "brochure";
  if (lower.includes("fact") && lower.includes("sheet")) return "fact_sheet";
  if (lower.includes("payment") && lower.includes("plan")) return "payment_plan";
  if (lower.includes("floor") || lower.includes("layout")) return "floor_plan";
  if (lower.includes("inventory")) return "inventory";
  if (lower.includes("price") && lower.includes("list")) return "price_list";
  return "document";
}

async function matchDeveloperId(supabase: any, devName: string | null): Promise<string | null> {
  if (!devName) return null;
  try {
    const norm = devName.toLowerCase().trim();
    const { data } = await supabase
      .from("developers")
      .select("id, name")
      .ilike("name", `%${norm}%`)
      .limit(1)
      .maybeSingle();
    if (data?.id) return data.id;

    const words = norm.split(/\s+/).filter((w: string) => w.length > 3);
    for (const word of words) {
      const { data: wordMatch } = await supabase
        .from("developers")
        .select("id")
        .ilike("name", `%${word}%`)
        .limit(1)
        .maybeSingle();
      if (wordMatch?.id) return wordMatch.id;
    }
  } catch (err) {
    console.error("[generate-listing] Developer match error:", err);
  }
  return null;
}

// Schema for a single project extraction
const projectSchema = {
  type: "object",
  properties: {
    name: { type: ["string", "null"], description: "Project name" },
    developer: { type: ["string", "null"], description: "Developer company name" },
    location: { type: ["string", "null"], description: "Location/area name" },
    emirate: { type: ["string", "null"], description: "Emirate (Dubai, Abu Dhabi, etc.)" },
    priceFrom: { type: ["number", "null"], description: "Starting price in AED" },
    priceTo: { type: ["number", "null"], description: "Maximum price in AED" },
    bedroomsMin: { type: ["number", "null"] },
    bedroomsMax: { type: ["number", "null"] },
    handoverDate: { type: ["string", "null"], description: "Expected handover/completion date" },
    completionPercentage: { type: ["number", "null"] },
    description: { type: ["string", "null"], description: "Full project description — verbatim from source" },
    amenities: { type: "array", items: { type: "string" }, description: "ALL amenities — every single one found" },
    paymentPlan: { type: ["string", "null"], description: "Payment plan summary e.g. 60/40, 80/20" },
    paymentBreakdown: {
      type: "array",
      items: {
        type: "object",
        properties: {
          milestone: { type: "string" },
          percentage: { type: ["number", "null"] },
          amount: { type: ["string", "null"] },
          timing: { type: ["string", "null"] },
        },
      },
    },
    unitTypes: { type: "array", items: { type: "string" } },
    unitDetails: {
      type: "array",
      items: {
        type: "object",
        properties: {
          type: { type: "string" },
          sizeMin: { type: ["number", "null"] },
          sizeMax: { type: ["number", "null"] },
          priceFrom: { type: ["number", "null"] },
          priceTo: { type: ["number", "null"] },
          bathrooms: { type: ["number", "null"] },
          availableUnits: { type: ["number", "null"] },
          floorPlanTypes: { type: "array", items: { type: "string" } },
        },
      },
    },
    projectStatus: { type: ["string", "null"] },
    keyFeatures: { type: "array", items: { type: "string" } },
    propertyType: { type: ["string", "null"] },
    serviceCharge: { type: ["string", "null"] },
    totalUnits: { type: ["number", "null"] },
    floors: { type: ["number", "null"] },
    sizeMin: { type: ["number", "null"] },
    sizeMax: { type: ["number", "null"] },
    highlights: { type: "array", items: { type: "string" } },
    nearbyLandmarks: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          distance: { type: ["string", "null"] },
          time: { type: ["string", "null"] },
        },
      },
    },
    reraNumber: { type: ["string", "null"] },
    faqs: {
      type: "array",
      items: {
        type: "object",
        properties: {
          q: { type: "string" },
          a: { type: "string" },
        },
      },
    },
    comparableProjects: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          developer: { type: ["string", "null"] },
          reason: { type: ["string", "null"] },
          _enriched: { type: "boolean" },
        },
      },
    },
  },
  required: ["name"],
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { files, url, description, action, existingId } = await req.json();

    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    const firecrawlApiKey = Deno.env.get("FIRECRAWL_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (!lovableApiKey) {
      return new Response(
        JSON.stringify({ success: false, error: "AI gateway not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ========== ACTION: SAVE ==========
    if (action === "save") {
      const projectDataObj = files;
      const mode = url;
      
      if (mode === "replace" && existingId) {
        await supabase.from("pending_project_imports").delete().eq("id", existingId);
      }
      
      if (mode === "merge" && existingId) {
        const { data: existing } = await supabase
          .from("pending_project_imports")
          .select("*")
          .eq("id", existingId)
          .single();
        
        if (existing) {
          const mergedImages = [...(existing.images || []), ...(projectDataObj.images || [])];
          const mergedDocs = [...(existing.documents || []), ...(projectDataObj.documents || [])];
          const mergedAmenities = [...new Set([...(existing.amenities || []), ...(projectDataObj.amenities || [])])];
          
          const updateData: Record<string, any> = {};
          for (const [key, val] of Object.entries(projectDataObj)) {
            if (val !== null && val !== undefined && val !== "" && !Array.isArray(val)) {
              if (!existing[key] || existing[key] === null || existing[key] === "") {
                updateData[key] = val;
              }
            }
          }
          updateData.images = mergedImages;
          updateData.documents = mergedDocs;
          updateData.amenities = mergedAmenities;
          updateData.updated_at = new Date().toISOString();
          
          const { error } = await supabase
            .from("pending_project_imports")
            .update(updateData)
            .eq("id", existingId);
          
          if (error) throw error;
          return new Response(
            JSON.stringify({ success: true, mode: "merged", id: existingId }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
      
      const { data: saved, error: saveErr } = await supabase
        .from("pending_project_imports")
        .insert(projectDataObj)
        .select()
        .single();
      
      if (saveErr) throw saveErr;
      return new Response(
        JSON.stringify({ success: true, mode: mode || "new", id: saved.id }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ========== ACTION: EXTRACT (default) ==========
    const hasFiles = files && files.length > 0 && files.some((f: any) => f.base64);
    console.log("[generate-listing] Starting extraction. Files:", files?.length || 0, "URL:", url || "none", "hasFiles:", hasFiles);

    // Build vision content parts
    const contentParts: any[] = [];
    
    contentParts.push({
      type: "text",
      text: `You are a senior UAE real estate data extraction specialist. Extract COMPLETE listing data from the provided documents and content.

CRITICAL RULES:
- Extract ONLY facts explicitly present in the documents. NEVER invent or guess.
- If a field is not found, return null (or [] for arrays).
- NEVER default emirate to Dubai unless explicitly stated.
- Copy descriptions VERBATIM from source material.
- Extract ALL amenities — every single one, not a summary.
- Extract the COMPLETE payment plan with all milestones and percentages exactly as shown.
- Extract ALL unit types with sizes, prices, and details.
- For nearby landmarks, extract exact distances and travel times as stated.
- Extract RERA number, service charge, total units, number of floors if present.

MULTI-PROJECT RULE:
- If the content contains MULTIPLE DISTINCT real estate projects (different project names, different buildings), return EACH as a separate entry in the projects array.
- Do NOT merge data from different projects into one entry.
- Each project should have its own complete data set.
- If all content is about ONE project, return an array with one entry.

ENRICHMENT (mark as enriched):
- You may add nearby landmark context if the area is clearly identified.
- You may suggest comparable projects. Mark with _enriched: true.`
    });

    // Add uploaded files as images (vision)
    if (hasFiles) {
      for (const file of files) {
        if (file.base64 && file.mimeType) {
          contentParts.push({
            type: "image_url",
            image_url: {
              url: `data:${file.mimeType};base64,${file.base64}`,
            },
          });
          contentParts.push({
            type: "text",
            text: `[Document: ${file.name}]`,
          });
        }
      }
    }

    // Add URL-scraped content
    let scrapedContent = "";
    if (url && firecrawlApiKey) {
      try {
        let formattedUrl = url.trim();
        if (!formattedUrl.startsWith("http")) formattedUrl = `https://${formattedUrl}`;
        
        console.log("[generate-listing] Scraping URL:", formattedUrl);
        const scrapeRes = await fetch("https://api.firecrawl.dev/v1/scrape", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${firecrawlApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url: formattedUrl,
            formats: ["markdown", "links"],
            onlyMainContent: true,
            waitFor: 5000,
            timeout: 30000,
          }),
        });
        
        if (scrapeRes.ok) {
          const scrapeData = await scrapeRes.json();
          scrapedContent = scrapeData?.data?.markdown || "";
          console.log("[generate-listing] Scraped content length:", scrapedContent.length);
        }
      } catch (err) {
        console.warn("[generate-listing] URL scrape failed:", err);
      }
    }

    if (scrapedContent) {
      contentParts.push({
        type: "text",
        text: `\n\n--- WEBSITE CONTENT ---\n${scrapedContent.substring(0, 50000)}`,
      });
    }

    if (description) {
      contentParts.push({
        type: "text",
        text: `\n\n--- ADDITIONAL DESCRIPTION ---\n${description}`,
      });
    }

    contentParts.push({
      type: "text",
      text: "\n\nNow extract ALL project data from the above. If there are MULTIPLE distinct projects, return each separately using the extract_projects tool. Do NOT merge different projects.",
    });

    // Choose model: Flash for URL-only (faster), Pro for vision
    const model = hasFiles ? "google/gemini-2.5-pro" : "google/gemini-2.5-flash";
    console.log("[generate-listing] Using model:", model, "with", contentParts.length, "content parts");
    
    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        max_tokens: 16000,
        temperature: 0.05,
        messages: [
          {
            role: "user",
            content: contentParts,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_projects",
              description: "Extract complete structured data for one or more real estate projects. Return each distinct project as a separate entry.",
              parameters: {
                type: "object",
                properties: {
                  projects: {
                    type: "array",
                    items: projectSchema,
                    description: "Array of extracted projects. One entry per distinct project.",
                  },
                },
                required: ["projects"],
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "extract_projects" } },
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error("[generate-listing] AI error:", aiRes.status, errText);
      
      if (aiRes.status === 429) {
        return new Response(
          JSON.stringify({ success: false, error: "Rate limit exceeded. Please wait a moment and try again." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiRes.status === 402) {
        return new Response(
          JSON.stringify({ success: false, error: "AI credits exhausted. Please add credits in Settings." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ success: false, error: "AI extraction failed" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiRes.json();
    const toolCall = aiData?.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall?.function?.arguments) {
      console.error("[generate-listing] No tool call in response");
      return new Response(
        JSON.stringify({ success: false, error: "AI did not return structured data" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let parsed: any;
    try {
      parsed = JSON.parse(toolCall.function.arguments);
    } catch (err) {
      console.error("[generate-listing] Failed parsing:", err);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to parse AI response" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Handle both old single-project and new multi-project format
    const rawProjects: any[] = parsed.projects || (parsed.name ? [parsed] : []);
    console.log("[generate-listing] Extracted", rawProjects.length, "project(s)");

    const documentRecords = (files || []).map((f: any) => ({
      name: humanizeDocTitle(f.name),
      type: classifyDocument(f.name),
      originalName: f.name,
    }));

    // Process each project
    const projects = [];
    const allDuplicates: any[] = [];

    for (const extracted of rawProjects) {
      const devId = await matchDeveloperId(supabase, extracted.developer);
      const slug = toSlug(extracted.name || "unnamed-project");

      // Check for duplicates
      const { data: pendingMatches } = await supabase
        .from("pending_project_imports")
        .select("id, name, slug, source_url, status, created_at")
        .or(`slug.eq.${slug},name.ilike.%${(extracted.name || "").substring(0, 30)}%`)
        .limit(5);
      
      if (pendingMatches?.length) {
        allDuplicates.push(...pendingMatches.map((m: any) => ({ ...m, source: "pending" })));
      }
      
      const { data: liveMatches } = await supabase
        .from("projects")
        .select("id, name, slug, created_at")
        .or(`slug.eq.${slug},name.ilike.%${(extracted.name || "").substring(0, 30)}%`)
        .limit(5);
      
      if (liveMatches?.length) {
        allDuplicates.push(...liveMatches.map((m: any) => ({ ...m, source: "live" })));
      }

      projects.push({
        ...extracted,
        slug,
        developer_id: devId,
        documents: documentRecords,
      });
    }

    // Deduplicate
    const seenDupIds = new Set<string>();
    const uniqueDuplicates = allDuplicates.filter(d => {
      if (seenDupIds.has(d.id)) return false;
      seenDupIds.add(d.id);
      return true;
    });

    return new Response(
      JSON.stringify({
        success: true,
        projects,
        // Keep backward compat
        extracted: projects[0] || null,
        duplicates: uniqueDuplicates,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("[generate-listing] Error:", error);
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
