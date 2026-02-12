import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

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
function detectUrlType(url: string): "drive" | "portal" | "developer" | "government" | "unknown" {
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
  if (lower.includes("dubairest") || lower.includes("rera.gov") || lower.includes("dubailand.gov") ||
      lower.includes("alnair") || lower.includes("dld.gov")) {
    return "government";
  }
  return "unknown";
}

// Scrape URL using Firecrawl
async function scrapeUrl(url: string, firecrawlKey: string): Promise<{ success: boolean; content?: string; error?: string }> {
  try {
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        formats: ['markdown'],
        onlyMainContent: true,
        waitFor: 3000,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      return { success: false, error: data.error || 'Failed to scrape' };
    }

    return { success: true, content: data.data?.markdown || data.markdown || '' };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    
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
    let scrapedContent = "";

    if (extractedUrl) {
      // Check if Firecrawl is available
      if (FIRECRAWL_API_KEY) {
        // Always scrape ANY URL — no whitelist restriction
        console.log(`Scraping URL: ${extractedUrl}`);
        const scrapeResult = await scrapeUrl(extractedUrl, FIRECRAWL_API_KEY);
        
        if (scrapeResult.success && scrapeResult.content) {
          // Try to find matching project in DB for merge
          let mergeContext = "";
          try {
            const urlContent = scrapeResult.content.substring(0, 2000);
            // Extract potential project name from scraped content
            const titleMatch = urlContent.match(/^#\s+(.+)$/m) || urlContent.match(/^(.+?)[\n\r]/);
            if (titleMatch) {
              const potentialName = titleMatch[1].trim().substring(0, 100);
              const { data: matchingProjects } = await supabase
                .from('projects')
                .select('id, name, slug, developer_name')
                .ilike('name', `%${potentialName.split(' ').slice(0, 3).join('%')}%`)
                .limit(3);
              
              if (matchingProjects && matchingProjects.length > 0) {
                mergeContext = `\n\n## POTENTIAL MATCHING PROJECTS IN DATABASE\nThe following existing projects may match the scraped content. If there's a match, suggest MERGING the new data into the existing listing:\n${matchingProjects.map(p => `- "${p.name}" (slug: ${p.slug}, developer: ${p.developer_name || 'unknown'})`).join('\n')}`;
              }
            }
          } catch (e) {
            console.warn("Project matching failed:", e);
          }

          scrapedContent = `

## SCRAPED CONTENT FROM URL
The following is the actual content extracted from the link. Use this to answer accurately:

${scrapeResult.content.substring(0, 25000)}
${mergeContext}
---
END OF SCRAPED CONTENT
`;
        } else {
          urlContext = `

## URL DETECTED - SCRAPING FAILED
URL: ${extractedUrl}
Error: ${scrapeResult.error}
Inform the user that you could not extract content from this link.`;
        }
      } else {
        urlContext = `

## URL DETECTED - FIRECRAWL NOT CONNECTED
URL: ${extractedUrl}
URL Type: ${urlType}

You cannot scrape this URL because Firecrawl is not connected. 
Tell the user: "I can see you've shared a link, but web scraping is not yet enabled. Please connect Firecrawl in Settings → Connectors to allow me to read external websites."`;
      }
    }

    const systemPrompt = `You are ${personaName}, the ${personaRole} at JBJ Global Real Estate in Dubai, UAE.

## Your Role
Expert at managing property listings for off-plan and secondary market properties. You help by:
1. Creating new property listings with complete details matching Sunset Bay Grand style
2. Processing links from Google Drive, property portals, and developer websites
3. Extracting project data automatically from ANY URL using Firecrawl
4. Reading data from any website — government portals, developer sites, property portals, blogs, etc.
5. Organizing projects by developer - NEVER mix albums/projects together
6. Matching RERA/DLD numbers with existing listings
7. Keeping all listing data accurate and properly organized
8. MERGING extracted data with existing listings when a project name match is found

## WEB SCRAPING CAPABILITIES
${FIRECRAWL_API_KEY ? `You CAN read and extract data from ANY website. There are NO restrictions on which URLs you can scrape.

When you receive scraped content, analyze it thoroughly and extract:
- Project names and developers
- RERA/DLD permit numbers
- Pricing information
- Location details
- Handover dates
- Amenities and features
- Images, documents, brochures
- Floor plans and unit types
- Payment plans
- FAQs and highlights

If a matching project already exists in the database, suggest MERGING the new data to enrich the existing listing.` : `Web scraping is NOT available. Firecrawl connector needs to be connected.`}
${scrapedContent}${urlContext}

## Response Format - BE CONCISE
- Use short, direct sentences
- No fluff or pleasantries
- Structure with bullet points when listing items
- Maximum 150 words unless creating a full listing

## Creating a Listing (Sunset Bay Grand Style)
When creating a listing, format it EXACTLY like this:

---

**Project Name**: [Name from source]
**Developer**: [Developer Name]
**Location**: [Area], [Emirate]
**RERA Number**: [If available]
**DLD Permit**: [If available]

**Price Range**: AED [from] - AED [to]
**Bedrooms**: [configurations available]
**Handover**: [date/quarter]
**Status**: [Off-Plan / Under Construction / Ready]

**Description**:
[2-3 paragraph professional description]

**Key Features**:
- [Feature 1]
- [Feature 2]
- [Feature 3]

**Amenities**:
- [Amenity 1]
- [Amenity 2]
- [Amenity 3]

**Payment Plan**: [e.g., 60/40, 20/80, etc.]

**Unit Types Available**:
- Studio | [size] sqft | AED [price]
- 1 Bedroom | [size] sqft | AED [price]

---

## STRICT RULES
- NEVER use emojis
- Use clear paragraph breaks
- Keep responses action-oriented
- NEVER mix data between different albums/projects
- Each album = One distinct project listing
- ${langInstruction}

## Permissions
- Can READ and EXTRACT data from ANY website
- Can GENERATE and CREATE draft listings
- Can process URLs from any source
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
        max_tokens: 2500,
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
    const hasScrapedData = scrapedContent.length > 0;

    return new Response(JSON.stringify({
      response: assistantResponse.trim(),
      action: suggestsListing ? "suggest_listing" : hasScrapedData ? "scraped_data" : hasUrl ? "url_detected" : null,
      detectedUrl: extractedUrl,
      urlType: urlType,
      listingType: "off-plan",
      scraped: hasScrapedData,
      firecrawlEnabled: !!FIRECRAWL_API_KEY,
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
