import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Detect the current Provident "New Projects" pagination count.
 * Uses Firecrawl (same connector as the sync) to be resilient to JS / bot protection.
 */

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");
    if (!firecrawlKey) {
      return new Response(
        JSON.stringify({ success: false, error: "FIRECRAWL_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const url = "https://providentestate.com/new-projects/";

    const scrapeResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${firecrawlKey}`,
      },
      body: JSON.stringify({
        url,
        formats: ["links", "html"],
        waitFor: 5000,
        timeout: 60000,
        onlyMainContent: false,
      }),
    });

    if (!scrapeResponse.ok) {
      const errText = await scrapeResponse.text();
      return new Response(
        JSON.stringify({ success: false, error: "Failed to scrape page", details: errText.substring(0, 300) }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const scrapeData = await scrapeResponse.json();
    const links: string[] = (scrapeData?.data?.links || scrapeData?.links || []) as string[];
    const html: string = (scrapeData?.data?.html || scrapeData?.html || "") as string;

    const candidates: number[] = [];

    const scanText = (text: string) => {
      // /new-projects/page/89/
      for (const match of text.matchAll(/\/new-projects\/page\/(\d+)\/?/g)) {
        candidates.push(Number(match[1]));
      }
      // ?paged=89
      for (const match of text.matchAll(/[?&]paged=(\d+)/g)) {
        candidates.push(Number(match[1]));
      }
    };

    for (const l of links) scanText(l);
    if (html) scanText(html);

    const totalPages = Math.max(1, ...candidates.filter((n) => Number.isFinite(n) && n > 0));

    return new Response(
      JSON.stringify({
        success: true,
        url,
        total_pages: totalPages,
        detected_at: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
