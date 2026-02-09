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

// Check if URL is in authorized sources
async function isAuthorizedSource(supabase: any, url: string): Promise<{ authorized: boolean; sourceName?: string }> {
  try {
    const urlDomain = new URL(url).hostname.replace('www.', '');
    
    // Google Drive is always authorized
    if (urlDomain.includes('google.com')) {
      return { authorized: true, sourceName: 'Google Drive' };
    }

    const { data: sources } = await supabase
      .from('listing_admin_authorized_sources')
      .select('source_name, source_url')
      .eq('is_active', true);

    if (sources) {
      for (const source of sources) {
        const sourceDomain = new URL(source.source_url).hostname.replace('www.', '');
        if (urlDomain.includes(sourceDomain) || sourceDomain.includes(urlDomain)) {
          return { authorized: true, sourceName: source.source_name };
        }
      }
    }

    return { authorized: false };
  } catch {
    return { authorized: false };
  }
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
    let authorizationWarning = "";

    if (extractedUrl) {
      // Check if Firecrawl is available
      if (FIRECRAWL_API_KEY) {
        // Check authorization
        const authCheck = await isAuthorizedSource(supabase, extractedUrl);
        
        if (authCheck.authorized) {
          console.log(`Scraping authorized source: ${authCheck.sourceName}`);
          const scrapeResult = await scrapeUrl(extractedUrl, FIRECRAWL_API_KEY);
          
          if (scrapeResult.success && scrapeResult.content) {
            scrapedContent = `

## SCRAPED CONTENT FROM ${authCheck.sourceName?.toUpperCase() || 'AUTHORIZED SOURCE'}
The following is the actual content extracted from the link. Use this to answer accurately:

${scrapeResult.content.substring(0, 25000)}

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
          authorizationWarning = `

## UNAUTHORIZED SOURCE DETECTED
URL: ${extractedUrl}
This URL is NOT in the authorized sources whitelist.

IMPORTANT: Tell the user that this source is not authorized for scraping. They can add it to the whitelist in the Authorized Sources settings if they want you to extract data from it.

Currently authorized sources:
- Dubai REST (dubairest.gov.ae)
- Al Nair (alnair.ae)
- Dubai Land Department (dubailand.gov.ae)
- RERA (rera.gov.ae)
- Google Drive (always allowed)`;
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
3. Extracting project data automatically from URLs using Firecrawl
4. Reading data from authorized government sources (Dubai REST, Al Nair, DLD, RERA)
5. Organizing projects by developer - NEVER mix albums/projects together
6. Matching RERA/DLD numbers with existing listings
7. Keeping all listing data accurate and properly organized

## WEB SCRAPING CAPABILITIES
${FIRECRAWL_API_KEY ? `You CAN read and extract data from authorized websites:
- Dubai REST (dubairest.gov.ae) - Official DLD portal
- Al Nair (alnair.ae) - Real estate data platform  
- Dubai Land Department (dubailand.gov.ae) - Official DLD site
- RERA (rera.gov.ae) - Real Estate Regulatory Agency
- Google Drive - Always allowed for media/documents

When you receive scraped content, analyze it thoroughly and extract:
- Project names and developers
- RERA/DLD permit numbers
- Pricing information
- Location details
- Handover dates
- Amenities and features` : `Web scraping is NOT available. Firecrawl connector needs to be connected.`}
${scrapedContent}${urlContext}${authorizationWarning}

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
- Only scrape from AUTHORIZED sources
- ${langInstruction}

## Permissions
- Can READ and EXTRACT data from authorized websites
- Can GENERATE and CREATE draft listings
- Can process URLs from Drive, authorized portals
- Can PUBLISH after founder approval
- CANNOT delete listings
- CANNOT scrape unauthorized sources`;

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
    const isUnauthorized = authorizationWarning.length > 0;

    return new Response(JSON.stringify({
      response: assistantResponse.trim(),
      action: suggestsListing ? "suggest_listing" : hasScrapedData ? "scraped_data" : isUnauthorized ? "unauthorized_source" : hasUrl ? "url_detected" : null,
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