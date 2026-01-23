import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ExtractRequest {
  url: string;
  sourceType: 'dubai_rest' | 'al_nair' | 'dld' | 'rera' | 'google_drive' | 'other';
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url, sourceType }: ExtractRequest = await req.json();

    const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!FIRECRAWL_API_KEY) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Firecrawl is not connected. Please connect it in Settings → Connectors." 
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "AI capabilities not configured." 
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Step 1: Scrape the URL with Firecrawl
    console.log(`Scraping ${sourceType} URL:`, url);
    
    const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        formats: ['markdown', 'html'],
        onlyMainContent: true,
        waitFor: 3000, // Wait for dynamic content
      }),
    });

    const scrapeData = await scrapeResponse.json();

    if (!scrapeResponse.ok || !scrapeData.success) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: `Failed to scrape: ${scrapeData.error || 'Unknown error'}` 
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const scrapedContent = scrapeData.data?.markdown || scrapeData.markdown || '';
    
    // Step 2: Use AI to extract structured project data
    const extractionPrompt = getExtractionPrompt(sourceType, scrapedContent);
    
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: extractionPrompt.system },
          { role: "user", content: extractionPrompt.user }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_projects",
              description: "Extract real estate project information from scraped content",
              parameters: {
                type: "object",
                properties: {
                  projects: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        project_name: { type: "string" },
                        developer_name: { type: "string" },
                        location: { type: "string" },
                        emirate: { type: "string" },
                        rera_number: { type: "string" },
                        dld_permit: { type: "string" },
                        price_from: { type: "number" },
                        price_to: { type: "number" },
                        bedrooms_min: { type: "number" },
                        bedrooms_max: { type: "number" },
                        handover_date: { type: "string" },
                        status: { type: "string" },
                        amenities: { type: "array", items: { type: "string" } },
                        description: { type: "string" }
                      },
                      required: ["project_name"]
                    }
                  },
                  source_summary: { type: "string" },
                  total_found: { type: "number" }
                },
                required: ["projects", "total_found"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "extract_projects" } }
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI extraction error:", errorText);
      return new Response(JSON.stringify({ 
        success: false, 
        error: "Failed to process scraped content with AI" 
      }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      return new Response(JSON.stringify({ 
        success: false, 
        error: "AI could not extract project data from this page" 
      }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const extractedData = JSON.parse(toolCall.function.arguments);

    // Step 3: Store scraped data for review
    const { data: sourceData } = await supabase
      .from('listing_admin_authorized_sources')
      .select('id')
      .ilike('source_url', `%${new URL(url).hostname.replace('www.', '')}%`)
      .single();

    await supabase
      .from('listing_admin_scraped_data')
      .insert({
        source_id: sourceData?.id,
        source_url: url,
        scraped_content: { raw: scrapedContent.substring(0, 50000) }, // Limit storage
        extracted_projects: extractedData,
        status: 'extracted'
      });

    return new Response(JSON.stringify({
      success: true,
      data: extractedData,
      sourceUrl: url,
      sourceType
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    console.error("Sarah extract projects error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ 
      success: false,
      error: errorMessage
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function getExtractionPrompt(sourceType: string, content: string) {
  const baseSystem = `You are an expert real estate data extraction AI for Dubai/UAE property market.
Your job is to accurately extract project information from scraped website content.

RULES:
- Extract ONLY factual data present in the content
- Do not invent or hallucinate any information
- Use null for missing fields
- Prices should be in AED (numbers only, no formatting)
- RERA numbers follow format like "RERA/XXX/XXXX" or numeric IDs
- Handover dates should be in format "Q1 2025" or "2025-03" if available
- Emirates: Dubai, Abu Dhabi, Sharjah, Ajman, Ras Al Khaimah, Fujairah, Umm Al Quwain`;

  const sourceInstructions: Record<string, string> = {
    dubai_rest: `Focus on extracting official DLD/RERA registration numbers and permit details.`,
    al_nair: `Al Nair contains comprehensive project data. Extract all available fields including developer, location, and pricing.`,
    dld: `Official Dubai Land Department data. Prioritize permit numbers and official registration details.`,
    rera: `RERA registration portal. Focus on regulatory compliance numbers and developer registration.`,
    google_drive: `This is media/brochure content. Extract project marketing information, amenities, and features.`,
    other: `General extraction. Identify any real estate project information available.`
  };

  return {
    system: `${baseSystem}\n\n${sourceInstructions[sourceType] || sourceInstructions.other}`,
    user: `Extract all real estate project information from this scraped content:\n\n${content.substring(0, 30000)}`
  };
}
