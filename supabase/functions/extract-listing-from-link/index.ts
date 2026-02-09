import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ExtractedProject {
  name: string;
  developer: string | null;
  location: string | null;
  emirate: string;
  priceFrom: number | null;
  priceTo: number | null;
  bedroomsMin: number | null;
  bedroomsMax: number | null;
  handoverDate: string | null;
  description: string | null;
  amenities: string[];
  paymentPlan: string | null;
  unitTypes: string[];
  images: string[];
  brochureUrl: string | null;
  floorPlanUrls: string[];
  videoUrl: string | null;
  projectStatus: string;
}

// Developer keywords for auto-detection
const DEVELOPER_KEYWORDS: Record<string, string[]> = {
  "Emaar": ["emaar", "downtown", "dubai hills", "creek harbour", "arabian ranches"],
  "DAMAC": ["damac", "cavalli", "paramount", "aykon"],
  "Sobha": ["sobha", "hartland", "creek vistas"],
  "Nakheel": ["nakheel", "palm", "jumeirah islands", "jvc"],
  "Meraas": ["meraas", "city walk", "la mer", "bluewaters"],
  "Dubai Properties": ["dubai properties", "dp", "business bay", "culture village"],
  "Azizi": ["azizi", "riviera", "aura"],
  "Danube": ["danube", "elz", "bayz", "viewz"],
  "Binghatti": ["binghatti", "jacob"],
  "Select Group": ["select group", "jumeirah living", "peninsula"],
  "MAG": ["mag", "meydan"],
  "Ellington": ["ellington", "wilton"],
  "Omniyat": ["omniyat", "one palm", "alba"],
  "Deyaar": ["deyaar", "montrose"],
  "MTS Development": ["mts", "sunset bay"],
};

function detectDeveloper(text: string): string | null {
  const lower = text.toLowerCase();
  for (const [developer, keywords] of Object.entries(DEVELOPER_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lower.includes(keyword)) {
        return developer;
      }
    }
  }
  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, userId, albumName } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: "URL is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (!FIRECRAWL_API_KEY) {
      return new Response(
        JSON.stringify({ success: false, error: "Firecrawl not configured. Please connect Firecrawl in Settings." }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Starting extraction for URL:", url);

    // Step 1: Scrape the URL using Firecrawl
    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
      formattedUrl = `https://${formattedUrl}`;
    }

    const scrapeResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${FIRECRAWL_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: formattedUrl,
        formats: ["markdown", "links", "html"],
        onlyMainContent: false,
        waitFor: 5000,
      }),
    });

    const scrapeData = await scrapeResponse.json();

    if (!scrapeResponse.ok || !scrapeData.success) {
      console.error("Firecrawl scrape failed:", scrapeData);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: scrapeData.error || "Failed to scrape URL",
          suggestion: "Try providing a direct link to the project page or album"
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const markdown = scrapeData.data?.markdown || "";
    const links = scrapeData.data?.links || [];
    const metadata = scrapeData.data?.metadata || {};

    console.log("Scraped content length:", markdown.length);
    console.log("Found links:", links.length);

    // Step 2: Extract images from the scraped links
    const imageLinks = links.filter((link: string) => 
      /\.(jpg|jpeg|png|webp|gif)(\?|$)/i.test(link) ||
      link.includes("googleusercontent.com") ||
      link.includes("lh3.google") ||
      link.includes("drive.google.com/uc")
    );

    const pdfLinks = links.filter((link: string) =>
      /\.pdf(\?|$)/i.test(link)
    );

    console.log("Image links found:", imageLinks.length);
    console.log("PDF links found:", pdfLinks.length);

    // Step 3: Use AI to extract structured project data
    if (!LOVABLE_API_KEY) {
      // Fallback to basic extraction without AI
      const detectedDeveloper = detectDeveloper(markdown) || detectDeveloper(formattedUrl);
      
      return new Response(
        JSON.stringify({
          success: true,
          extractedProject: {
            name: albumName || metadata.title || "Draft Project",
            developer: detectedDeveloper,
            location: null,
            emirate: "Dubai",
            priceFrom: null,
            priceTo: null,
            bedroomsMin: null,
            bedroomsMax: null,
            handoverDate: null,
            description: markdown.substring(0, 1000),
            amenities: [],
            paymentPlan: null,
            unitTypes: [],
            images: imageLinks.slice(0, 20),
            brochureUrl: pdfLinks[0] || null,
            floorPlanUrls: [],
            videoUrl: null,
            projectStatus: "off-plan",
          },
          rawContent: markdown.substring(0, 5000),
          allLinks: links,
          message: "Basic extraction complete. AI-enhanced extraction unavailable."
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use AI to extract structured data
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        max_tokens: 3000,
        temperature: 0.2,
        messages: [
          {
            role: "system",
            content: `You are a real estate data extraction expert for Dubai property listings.
Extract structured project information from the provided content.

CRITICAL RULES:
1. Keep each project's data SEPARATE - do not mix information between projects
2. If this is an album/folder, the album name indicates the project name
3. Extract ONLY information that belongs to THIS specific project
4. Be precise with prices (convert to AED if needed)
5. Extract ALL image URLs that belong to this project
6. Identify brochures, floor plans, and videos separately

Return a JSON object with this EXACT structure:
{
  "name": "Project Name",
  "developer": "Developer Name or null",
  "location": "Area/Community",
  "emirate": "Dubai",
  "priceFrom": 1000000,
  "priceTo": 5000000,
  "bedroomsMin": 1,
  "bedroomsMax": 4,
  "handoverDate": "Q4 2025 or null",
  "description": "Detailed project description (2-3 paragraphs)",
  "amenities": ["Pool", "Gym", "Spa"],
  "paymentPlan": "60/40 or 20/80 etc",
  "unitTypes": ["Studio", "1BR", "2BR", "3BR"],
  "projectStatus": "off-plan or ready or under-construction",
  "keyFeatures": ["Waterfront", "Sea View", "Private Beach"]
}

If you cannot determine a field, set it to null.
ONLY return valid JSON, no markdown or explanation.`
          },
          {
            role: "user",
            content: `Extract property listing data from this content.
${albumName ? `Album/Project Name: ${albumName}` : ""}
URL: ${formattedUrl}
Page Title: ${metadata.title || "Unknown"}

CONTENT:
${markdown.substring(0, 15000)}

LINKS FOUND:
${links.slice(0, 50).join("\n")}`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_project_data",
              description: "Extract structured project data from real estate content",
              parameters: {
                type: "object",
                properties: {
                  name: { type: "string", description: "Project name" },
                  developer: { type: "string", description: "Developer name" },
                  location: { type: "string", description: "Area/Community location" },
                  emirate: { type: "string", description: "Emirate (Dubai, Abu Dhabi, etc.)" },
                  priceFrom: { type: "number", description: "Starting price in AED" },
                  priceTo: { type: "number", description: "Maximum price in AED" },
                  bedroomsMin: { type: "number", description: "Minimum bedrooms" },
                  bedroomsMax: { type: "number", description: "Maximum bedrooms" },
                  handoverDate: { type: "string", description: "Expected handover date" },
                  description: { type: "string", description: "Project description" },
                  amenities: { type: "array", items: { type: "string" }, description: "List of amenities" },
                  paymentPlan: { type: "string", description: "Payment plan details" },
                  unitTypes: { type: "array", items: { type: "string" }, description: "Unit types available" },
                  projectStatus: { type: "string", description: "off-plan, ready, or under-construction" },
                  keyFeatures: { type: "array", items: { type: "string" }, description: "Key selling features" }
                },
                required: ["name"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "extract_project_data" } }
      }),
    });

    let extractedData: any = null;

    if (aiResponse.ok) {
      const aiData = await aiResponse.json();
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
      
      if (toolCall?.function?.arguments) {
        try {
          extractedData = JSON.parse(toolCall.function.arguments);
        } catch (e) {
          console.error("Failed to parse AI tool response:", e);
        }
      }
      
      // Fallback to content parsing if tool call didn't work
      if (!extractedData) {
        const content = aiData.choices?.[0]?.message?.content || "";
        try {
          extractedData = JSON.parse(content.replace(/```json\n?|\n?```/g, "").trim());
        } catch (e) {
          console.error("Failed to parse AI response:", e);
        }
      }
    }

    // Merge AI extraction with scraped media
    const finalProject: ExtractedProject = {
      name: extractedData?.name || albumName || metadata.title || "Draft Project",
      developer: extractedData?.developer || detectDeveloper(markdown) || detectDeveloper(formattedUrl),
      location: extractedData?.location || null,
      emirate: extractedData?.emirate || "Dubai",
      priceFrom: extractedData?.priceFrom || null,
      priceTo: extractedData?.priceTo || null,
      bedroomsMin: extractedData?.bedroomsMin || null,
      bedroomsMax: extractedData?.bedroomsMax || null,
      handoverDate: extractedData?.handoverDate || null,
      description: extractedData?.description || null,
      amenities: extractedData?.amenities || [],
      paymentPlan: extractedData?.paymentPlan || null,
      unitTypes: extractedData?.unitTypes || [],
      images: imageLinks.slice(0, 30),
      brochureUrl: pdfLinks.find((l: string) => l.toLowerCase().includes("brochure")) || pdfLinks[0] || null,
      floorPlanUrls: pdfLinks.filter((l: string) => l.toLowerCase().includes("floor")),
      videoUrl: links.find((l: string) => l.includes("youtube") || l.includes("vimeo")) || null,
      projectStatus: extractedData?.projectStatus || "off-plan",
    };

    // Log the extraction for tracking
    if (userId) {
      await supabase.from("listing_uploads").insert({
        user_id: userId,
        drive_url: formattedUrl,
        url_type: "firecrawl",
        status: "completed",
        extracted_data: finalProject,
        created_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
      });
    }

    console.log("Extraction complete:", finalProject.name);

    return new Response(
      JSON.stringify({
        success: true,
        extractedProject: finalProject,
        keyFeatures: extractedData?.keyFeatures || [],
        mediaCount: {
          images: imageLinks.length,
          pdfs: pdfLinks.length,
        },
        message: "Project data extracted successfully. Review and edit as needed."
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Extraction error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to extract listing data";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
