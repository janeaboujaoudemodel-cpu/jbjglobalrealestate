import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ChatRequest {
  message: string;
  conversationHistory: Array<{ role: string; content: string }>;
  personaName: string;
  personaRole: string;
  driveUrl?: string;
  language?: string;
  extractFromLink?: boolean;
}

// Detect if message contains a URL
function extractUrl(message: string): string | null {
  const urlRegex = /(https?:\/\/[^\s]+)/gi;
  const matches = message.match(urlRegex);
  return matches ? matches[0] : null;
}

// Detect URL type
function detectUrlType(url: string): "drive" | "portal" | "developer" | "unknown" {
  const lower = url.toLowerCase();
  if (lower.includes("drive.google.com") || lower.includes("docs.google.com")) {
    return "drive";
  }
  if (lower.includes("bayut.com") || lower.includes("propertyfinder.ae") || lower.includes("dubizzle.com")) {
    return "portal";
  }
  if (lower.includes("emaar.com") || lower.includes("damac") || lower.includes("sobha") || 
      lower.includes("azizi") || lower.includes("nakheel") || lower.includes("meraas")) {
    return "developer";
  }
  return "unknown";
}

// Extract album/folder name from Google Drive URL path
function extractAlbumName(url: string): string | null {
  // Try to get folder name from URL structure
  const folderMatch = url.match(/\/folders\/([^/?]+)/);
  if (folderMatch) {
    return decodeURIComponent(folderMatch[1]).replace(/[_-]/g, " ");
  }
  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { message, conversationHistory, personaName, personaRole, driveUrl, language }: ChatRequest = await req.json();

    const isArabic = language === "ar";
    const langInstruction = isArabic 
      ? "Respond in Arabic. Use formal Modern Standard Arabic."
      : "Respond in English.";

    // Check if message contains a URL
    const extractedUrl = extractUrl(message);
    const urlType = extractedUrl ? detectUrlType(extractedUrl) : null;
    
    let urlContext = "";
    if (extractedUrl) {
      urlContext = `

## URL DETECTED IN MESSAGE
The user has shared a link: ${extractedUrl}
URL Type: ${urlType === "drive" ? "Google Drive" : urlType === "portal" ? "Property Portal (Bayut/PropertyFinder/Dubizzle)" : urlType === "developer" ? "Developer Website" : "Unknown"}

IMPORTANT: Acknowledge the link and explain:
1. You will process this link to extract project information
2. The extracted data will be used to pre-fill a draft listing
3. The user can review and edit before publishing
4. Ask if they want to proceed with extraction`;
    }

    const systemPrompt = `You are ${personaName}, the ${personaRole} at JBJ Global Real Estate in Dubai, UAE.

## Your Role
Expert at managing property listings for off-plan and secondary market properties. You help by:
1. Creating new property listings with complete details matching Sunset Bay Grand style
2. Processing links from Google Drive, property portals (Bayut, PropertyFinder), and developer websites
3. Extracting project data automatically from URLs using Firecrawl
4. Organizing projects by developer - NEVER mix albums/projects together
5. Ensuring all listing data is accurate and properly organized

## CRITICAL RULES FOR LINK PROCESSING
When a user shares a Google Drive link or any URL:
1. READ the link using Firecrawl to extract ALL content
2. Each album/folder represents ONE project - keep data SEPARATE
3. Extract: Project Name, Developer, Location, Price Range, Bedrooms, Handover, Amenities
4. Identify all images, brochures, floor plans, and videos from that specific album
5. NEVER mix photos or data from different albums/projects
6. Present the extracted data in the EXACT format shown below

## Response Format - BE CONCISE
- Use short, direct sentences
- No fluff or pleasantries
- Structure with bullet points when listing items
- Maximum 150 words unless creating a full listing

## Creating a Listing (Sunset Bay Grand Style)
When creating a listing, format it EXACTLY like this:

---

**Project Name**: [Name from album/folder]
**Developer**: [Developer Name]
**Location**: [Area], [Emirate]

**Price Range**: AED [from] - AED [to]
**Bedrooms**: [configurations available]
**Handover**: [date/quarter]
**Status**: [Off-Plan / Under Construction / Ready]

**Description**:
[2-3 paragraph professional description highlighting key selling points, location benefits, and lifestyle appeal]

**Key Features**:
- [Feature 1]
- [Feature 2]
- [Feature 3]
- [Feature 4]

**Amenities**:
- [Amenity 1]
- [Amenity 2]
- [Amenity 3]

**Payment Plan**: [e.g., 60/40, 20/80, etc.]

**Unit Types Available**:
- Studio | [size] sqft | AED [price]
- 1 Bedroom | [size] sqft | AED [price]
- 2 Bedroom | [size] sqft | AED [price]

**Media Extracted**:
- Images: [count] photos
- Brochure: [Yes/No]
- Floor Plans: [count]
- Video: [Yes/No]

---

## Link Processing Response
When a user shares a link, respond with:
1. Confirm you received and are reading the link
2. Extract and display ALL project information in the format above
3. List all media files found (images, PDFs, videos)
4. Ask if they want to save as draft or need modifications
${urlContext}

## STRICT RULES
- NEVER use emojis
- Use clear paragraph breaks
- Keep responses action-oriented
- NEVER mix data between different albums/projects
- Each album = One distinct project listing
- ${langInstruction}

## Permissions
- Can READ and EXTRACT data from any link using Firecrawl
- Can GENERATE and CREATE draft listings
- Can process URLs from Drive, portals, developer sites
- Can PUBLISH after founder approval
- CANNOT delete listings`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...conversationHistory.map(m => ({
        role: m.role,
        content: m.content
      })),
      { role: "user", content: message }
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages,
        max_tokens: 2000,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: "Rate limits exceeded, please try again later.",
          response: "I'm currently handling many requests. Please try again in a moment." 
        }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ 
          error: "Payment required",
          response: "AI services are temporarily unavailable. Please contact support." 
        }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    let assistantResponse = data.choices?.[0]?.message?.content || "I couldn't process that request.";
    
    // Remove any emojis from response
    assistantResponse = assistantResponse.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F000}-\u{1F02F}]|[\u{1F0A0}-\u{1F0FF}]|[\u{1F100}-\u{1F64F}]|[\u{1F680}-\u{1F6FF}]|[\u{1F910}-\u{1F96B}]|[\u{1F980}-\u{1F9E0}]/gu, '');

    // Detect actions
    const suggestsListing = assistantResponse.toLowerCase().includes("project name:") || 
                           assistantResponse.toLowerCase().includes("shall i create") ||
                           assistantResponse.toLowerCase().includes("ready to create");

    const hasUrl = !!extractedUrl;
    const processingUrl = hasUrl && (
      assistantResponse.toLowerCase().includes("extract") ||
      assistantResponse.toLowerCase().includes("process") ||
      assistantResponse.toLowerCase().includes("received your link")
    );

    return new Response(JSON.stringify({
      response: assistantResponse.trim(),
      action: suggestsListing ? "suggest_listing" : processingUrl ? "processing_url" : hasUrl ? "url_detected" : null,
      detectedUrl: extractedUrl,
      urlType: urlType,
      listingType: "off-plan",
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    console.error("Listing admin chat error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ 
      error: errorMessage,
      response: "I apologize, there was an error processing your request. Please try again."
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});