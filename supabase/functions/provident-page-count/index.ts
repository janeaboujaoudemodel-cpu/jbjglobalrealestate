import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LISTINGS_PER_PAGE = 15;
const KNOWN_FALLBACK_PAGES = 89; // ~1334 listings as of last known count

/**
 * Detect the current Provident "New Projects" pagination count.
 * Uses Firecrawl to scrape the page and extract listing count.
 * Falls back to known page count if detection fails.
 */

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");
    if (!firecrawlKey) {
      // Return fallback if no API key
      return new Response(
        JSON.stringify({ 
          success: true, 
          total_pages: KNOWN_FALLBACK_PAGES,
          estimated_listings: KNOWN_FALLBACK_PAGES * LISTINGS_PER_PAGE,
          source: "fallback",
          detected_at: new Date().toISOString()
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
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
        formats: ["markdown", "html"],
        waitFor: 5000,
        timeout: 60000,
        onlyMainContent: false,
      }),
    });

    if (!scrapeResponse.ok) {
      console.error("Firecrawl failed, using fallback");
      return new Response(
        JSON.stringify({ 
          success: true, 
          total_pages: KNOWN_FALLBACK_PAGES,
          estimated_listings: KNOWN_FALLBACK_PAGES * LISTINGS_PER_PAGE,
          source: "fallback",
          detected_at: new Date().toISOString()
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const scrapeData = await scrapeResponse.json();
    const html: string = (scrapeData?.data?.html || scrapeData?.html || "") as string;
    const markdown: string = (scrapeData?.data?.markdown || scrapeData?.markdown || "") as string;

    let totalListings = 0;
    let totalPages = 0;
    let source = "detected";

    // Strategy 1: Look for listing count in text (e.g., "1,334 properties" or "Showing 1334 results")
    const countPatterns = [
      /(\d{1,4}(?:,\d{3})*)\s*(?:properties|projects|listings|results)/i,
      /(?:showing|found|total|of)\s*(\d{1,4}(?:,\d{3})*)/i,
      /(\d{3,4})\s*off[- ]?plan/i,
    ];

    const textToSearch = markdown + " " + html;
    
    for (const pattern of countPatterns) {
      const match = textToSearch.match(pattern);
      if (match) {
        const num = parseInt(match[1].replace(/,/g, ""), 10);
        if (num > 100 && num < 5000) { // Reasonable range for listings
          totalListings = num;
          totalPages = Math.ceil(totalListings / LISTINGS_PER_PAGE);
          console.log(`Detected ${totalListings} listings from pattern: ${pattern}`);
          break;
        }
      }
    }

    // Strategy 2: Look for page numbers in pagination elements
    if (!totalPages) {
      const pagePatterns = [
        /\/new-projects\/page\/(\d+)\/?/g,
        /[?&]paged=(\d+)/g,
        /page[=\/](\d+)/gi,
        /"page":\s*(\d+)/g,
        /data-page="(\d+)"/g,
      ];

      const candidates: number[] = [];
      for (const pattern of pagePatterns) {
        for (const match of textToSearch.matchAll(pattern)) {
          const num = parseInt(match[1], 10);
          if (num > 0 && num < 500) {
            candidates.push(num);
          }
        }
      }

      if (candidates.length > 0) {
        totalPages = Math.max(...candidates);
        totalListings = totalPages * LISTINGS_PER_PAGE;
        console.log(`Detected ${totalPages} pages from pagination patterns`);
      }
    }

    // Strategy 3: Count listing cards in HTML
    if (!totalPages) {
      const cardPatterns = [
        /<div[^>]*class="[^"]*property-card[^"]*"/gi,
        /<div[^>]*class="[^"]*listing-card[^"]*"/gi,
        /<a[^>]*href="[^"]*\/off-plan\/[^"]*"/gi,
        /<div[^>]*class="[^"]*offplan-card[^"]*"/gi,
      ];

      let maxCards = 0;
      for (const pattern of cardPatterns) {
        const matches = html.match(pattern);
        if (matches && matches.length > maxCards) {
          maxCards = matches.length;
        }
      }

      // If we found cards on page 1, estimate total based on typical counts
      if (maxCards >= 10) {
        // Use fallback total but confirm the site is working
        totalPages = KNOWN_FALLBACK_PAGES;
        totalListings = KNOWN_FALLBACK_PAGES * LISTINGS_PER_PAGE;
        source = "fallback_confirmed";
        console.log(`Found ${maxCards} cards on first page, using fallback count`);
      }
    }

    // Final fallback
    if (!totalPages || totalPages < 10) {
      totalPages = KNOWN_FALLBACK_PAGES;
      totalListings = KNOWN_FALLBACK_PAGES * LISTINGS_PER_PAGE;
      source = "fallback";
      console.log("Using fallback page count");
    }

    return new Response(
      JSON.stringify({
        success: true,
        url,
        total_pages: totalPages,
        estimated_listings: totalListings,
        source,
        detected_at: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error detecting pages:", message);
    
    // Return fallback on error
    return new Response(
      JSON.stringify({ 
        success: true, 
        total_pages: KNOWN_FALLBACK_PAGES,
        estimated_listings: KNOWN_FALLBACK_PAGES * LISTINGS_PER_PAGE,
        source: "fallback_error",
        error: message,
        detected_at: new Date().toISOString()
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
