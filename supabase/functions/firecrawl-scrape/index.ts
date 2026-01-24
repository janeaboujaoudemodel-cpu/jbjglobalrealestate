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
    const { url, options } = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ success: false, error: "URL is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiKey = Deno.env.get("FIRECRAWL_API_KEY");
    if (!apiKey) {
      console.error("FIRECRAWL_API_KEY not configured");
      return new Response(
        JSON.stringify({ success: false, error: "Firecrawl connector not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Format URL
    let formattedUrl = url.trim();
    if (!formattedUrl.startsWith("http://") && !formattedUrl.startsWith("https://")) {
      formattedUrl = `https://${formattedUrl}`;
    }

    console.log("Scraping URL:", formattedUrl);

    // CRITICAL FIX: Firecrawl requires waitFor <= timeout/2
    // Default timeout is 30000ms, so default max waitFor is 15000ms
    let waitFor = options?.waitFor || 5000;
    let timeout = options?.timeout || 60000;
    
    // Enforce the constraint: waitFor must be <= timeout/2
    const maxWaitFor = Math.floor(timeout / 2) - 1000; // Buffer of 1s
    if (waitFor > maxWaitFor) {
      console.log(`Clamping waitFor from ${waitFor} to ${maxWaitFor} (timeout=${timeout})`);
      waitFor = maxWaitFor;
    }

    // Build request body - simpler for reliability
    const requestBody: Record<string, any> = {
      url: formattedUrl,
      formats: options?.formats || ["markdown", "links"],
      onlyMainContent: options?.onlyMainContent ?? true,
      waitFor,
      timeout,
    };

    // Only add location if provided
    if (options?.location) {
      requestBody.location = options.location;
    }

    // DO NOT include "actions" for complex scroll behavior - causes failures
    // Keep scraping simple and reliable

    console.log("Firecrawl request:", JSON.stringify({ 
      url: formattedUrl, 
      waitFor, 
      timeout,
      formats: requestBody.formats 
    }));

    const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Firecrawl API error:", data);
      
      // Provide structured error response
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: data.error || `Request failed with status ${response.status}`,
          code: data.code || "UNKNOWN_ERROR",
          details: data.details || [],
          url: formattedUrl,
          requestOptions: { waitFor, timeout, formats: requestBody.formats }
        }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Scrape successful, markdown length:", data.data?.markdown?.length || 0);
    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error scraping:", error);
    const errorMessage = error instanceof Error ? error.message : "Failed to scrape";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
