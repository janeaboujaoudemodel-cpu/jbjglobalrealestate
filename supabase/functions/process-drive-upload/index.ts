import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface UploadRequest {
  url: string;
  userId: string;
  type?: "drive" | "web" | "upload";
}

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
  files: Array<{
    name: string;
    type: string;
    url: string;
  }>;
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
};

// Detect developer from text
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

// Detect URL type
function detectUrlType(url: string): "drive" | "web" | "unknown" {
  if (url.includes("drive.google.com") || url.includes("docs.google.com")) {
    return "drive";
  }
  if (url.includes("bayut.com") || url.includes("propertyfinder.ae") || 
      url.includes("dubizzle.com") || url.includes("rera.gov.ae") ||
      url.includes("emaar.com") || url.includes("damacproperties.com") ||
      url.includes("sobharealty.com") || url.includes("azizidevelopments.com")) {
    return "web";
  }
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return "web";
  }
  return "unknown";
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { url, userId, type }: UploadRequest = await req.json();

    if (!url) {
      throw new Error("No URL provided");
    }

    const urlType = type || detectUrlType(url);
    
    if (urlType === "unknown") {
      throw new Error("Unsupported URL format. Please provide a Google Drive link, property portal URL, or direct file URL.");
    }

    // Create upload record for tracking
    const { data: uploadRecord, error: uploadError } = await supabase
      .from("listing_uploads")
      .insert({
        user_id: userId,
        drive_url: url,
        url_type: urlType,
        status: "processing",
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (uploadError) {
      console.error("Failed to create upload record:", uploadError);
    }

    // Use AI to extract project information from the URL
    let extractedProject: ExtractedProject | null = null;
    
    try {
      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          max_tokens: 2000,
          temperature: 0.3,
          messages: [
            {
              role: "system",
              content: `You are a real estate data extraction expert. Extract property listing information from URLs.

For the given URL, analyze what type of content it contains and extract:
1. Project/Property name
2. Developer name
3. Location/Area
4. Emirate (Dubai, Abu Dhabi, etc.)
5. Price range (from/to in AED)
6. Bedroom configurations
7. Handover date if available
8. Brief description

Return a JSON object with this structure:
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
  "description": "Brief project description"
}

If you cannot access or determine certain fields, set them to null.
Only return valid JSON, no markdown or explanation.`
            },
            {
              role: "user",
              content: `Extract property listing data from this URL: ${url}

URL Type: ${urlType === "drive" ? "Google Drive (may contain brochures, floor plans)" : "Property portal or developer website"}

Please analyze and extract the project information.`
            }
          ]
        })
      });

      if (aiResponse.ok) {
        const aiData = await aiResponse.json();
        const content = aiData.choices?.[0]?.message?.content || "";
        
        try {
          const parsed = JSON.parse(content.replace(/```json\n?|\n?```/g, "").trim());
          extractedProject = {
            ...parsed,
            files: []
          };
        } catch (parseError) {
          console.error("Failed to parse AI response:", content);
        }
      }
    } catch (aiError) {
      console.error("AI extraction failed:", aiError);
    }

    // If AI extraction failed, create a placeholder with detected developer
    if (!extractedProject) {
      const detectedDeveloper = detectDeveloper(url);
      extractedProject = {
        name: "Draft Project",
        developer: detectedDeveloper,
        location: null,
        emirate: "Dubai",
        priceFrom: null,
        priceTo: null,
        bedroomsMin: null,
        bedroomsMax: null,
        handoverDate: null,
        description: null,
        files: []
      };
    }

    // Update upload record with extracted data
    if (uploadRecord?.id) {
      await supabase
        .from("listing_uploads")
        .update({
          status: "completed",
          extracted_data: extractedProject,
          completed_at: new Date().toISOString(),
        })
        .eq("id", uploadRecord.id);
    }

    return new Response(JSON.stringify({
      success: true,
      message: urlType === "drive" 
        ? "Google Drive link processed successfully"
        : "Property link processed successfully",
      uploadId: uploadRecord?.id,
      status: "completed",
      extractedProject,
      nextSteps: [
        "Review the extracted information below",
        "Fill in any missing details",
        "Click 'Create Draft' to save as a draft listing",
        "Upload images and documents",
        "Submit for approval when ready"
      ]
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    console.error("Upload processing error:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to process link";
    return new Response(JSON.stringify({ 
      success: false,
      error: errorMessage
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});