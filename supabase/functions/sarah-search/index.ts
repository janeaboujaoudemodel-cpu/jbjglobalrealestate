import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const PERPLEXITY_API_KEY = Deno.env.get("PERPLEXITY_API_KEY");
    
    if (!PERPLEXITY_API_KEY) {
      throw new Error("Perplexity API key not configured");
    }

    const { query, searchType = "general", domainFilter = [] } = await req.json();

    if (!query || query.trim().length === 0) {
      throw new Error("No search query provided");
    }

    // Build request body
    const requestBody: Record<string, unknown> = {
      model: "sonar",
      messages: [
        { 
          role: "system", 
          content: "You are Sarah, an AI real estate assistant for JBJ Global Real Estate. Provide accurate, concise information about UAE real estate, focusing on Dubai properties, developers, and market trends. Always cite your sources." 
        },
        { role: "user", content: query }
      ],
      max_tokens: 1500,
      temperature: 0.2,
    };

    // Add domain filtering for authorized sources
    if (domainFilter.length > 0) {
      requestBody.search_domain_filter = domainFilter;
    }

    // Add recency filter for market data
    if (searchType === "market") {
      requestBody.search_recency_filter = "month";
    }

    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${PERPLEXITY_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Perplexity API error:", errorText);
      throw new Error(`Perplexity API error: ${response.status}`);
    }

    const data = await response.json();
    
    return new Response(JSON.stringify({
      success: true,
      content: data.choices?.[0]?.message?.content || "No results found",
      citations: data.citations || [],
      model: data.model,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    console.error("Sarah search error:", error);
    const errorMessage = error instanceof Error ? error.message : "Search failed";
    return new Response(JSON.stringify({ 
      success: false,
      error: errorMessage 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
