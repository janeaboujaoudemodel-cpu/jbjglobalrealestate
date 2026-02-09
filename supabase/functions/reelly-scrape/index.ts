import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Target projects for Phase 1 test
const TARGET_PROJECTS = [
  {
    name: "Divine Elements",
    url: "https://reelly.ai/off-plan/divine-elements",
    slug: "divine-elements",
  },
  {
    name: "The Meriva Collection",
    url: "https://reelly.ai/off-plan/the-meriva-collection",
    slug: "the-meriva-collection",
  },
  {
    name: "Al Hasin Residence Six",
    url: "https://reelly.ai/off-plan/al-hasin-residence-six",
    slug: "al-hasin-residence-six",
  },
  {
    name: "Confident Preston",
    url: "https://reelly.ai/off-plan/confident-preston",
    slug: "confident-preston",
  },
];

interface ScrapedProject {
  name: string;
  developer: string | null;
  location: string | null;
  priceFrom: number | null;
  priceTo: number | null;
  bedroomsMin: number | null;
  bedroomsMax: number | null;
  sizeMin: number | null;
  sizeMax: number | null;
  handoverDate: string | null;
  description: string | null;
  images: string[];
  brochureUrl: string | null;
}

async function scrapeProjectPage(
  url: string,
  firecrawlKey: string
): Promise<ScrapedProject | null> {
  console.log(`Scraping: ${url}`);

  try {
    const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${firecrawlKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        formats: ["markdown", "html", "links"],
        onlyMainContent: true,
        waitFor: 5000,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(`Firecrawl error for ${url}:`, data);
      return null;
    }

    const markdown = data.data?.markdown || data.markdown || "";
    const html = data.data?.html || data.html || "";
    const links = data.data?.links || data.links || [];
    const metadata = data.data?.metadata || data.metadata || {};

    return parseProjectData(markdown, html, links, metadata);
  } catch (error) {
    console.error(`Error scraping ${url}:`, error);
    return null;
  }
}

function parseProjectData(
  markdown: string,
  html: string,
  links: string[],
  metadata: Record<string, unknown>
): ScrapedProject | null {
  // CRITICAL: Detect 404/error pages before parsing
  const errorIndicators = [
    "page not found",
    "doesn't exist",
    "has been moved",
    "404",
    "not available",
    "under maintenance",
    "page-not-found",
  ];
  
  const lowerMarkdown = markdown.toLowerCase();
  const lowerHtml = html.toLowerCase();
  
  for (const indicator of errorIndicators) {
    if (lowerMarkdown.includes(indicator) || lowerHtml.includes(indicator)) {
      console.log(`Detected error page: contains "${indicator}"`);
      return null; // Return null for error pages
    }
  }
  
  // Check for minimal content (error pages are usually very short)
  if (markdown.length < 200 && !markdown.includes("AED")) {
    console.log(`Page content too short (${markdown.length} chars) - likely error page`);
    return null;
  }

  // Extract name from metadata or first heading
  const name =
    String(metadata.title || "")
      .replace(" | Reelly", "")
      .replace(" - Reelly", "")
      .trim() || extractPattern(markdown, /^#\s+(.+)$/m) || "Unknown Project";

  // Reject generic/error names
  if (name === "Not Found" || name === "Unknown Project" || name === "404" || name.includes("Page Not Found")) {
    console.log(`Rejected invalid project name: ${name}`);
    return null;
  }

  // Extract developer
  const developer =
    extractPattern(markdown, /(?:by|developer)[:\s]+([A-Za-z\s&]+)/i) ||
    extractPattern(html, /developer[^>]*>([^<]+)</i);

  // Extract location/community
  const location =
    extractPattern(markdown, /(?:location|area|community)[:\s]+([A-Za-z\s,]+)/i) ||
    extractPattern(html, /(?:Dubai|Abu Dhabi|Sharjah)[\s,]+([A-Za-z\s]+)/);

  // Extract price range (AED)
  const priceMatch = markdown.match(
    /(?:AED|Price)[:\s]*([0-9,.]+)(?:\s*[-–to]+\s*(?:AED\s*)?([0-9,.]+))?[KMB]?/i
  );
  let priceFrom: number | null = null;
  let priceTo: number | null = null;
  if (priceMatch) {
    priceFrom = parsePrice(priceMatch[1]);
    priceTo = priceMatch[2] ? parsePrice(priceMatch[2]) : priceFrom;
  }

  // Extract bedrooms
  const bedroomMatch = markdown.match(
    /(\d+)(?:\s*[-–to]+\s*(\d+))?\s*(?:BR|Bed(?:room)?s?)/i
  );
  let bedroomsMin: number | null = null;
  let bedroomsMax: number | null = null;
  if (bedroomMatch) {
    bedroomsMin = parseInt(bedroomMatch[1]);
    bedroomsMax = bedroomMatch[2] ? parseInt(bedroomMatch[2]) : bedroomsMin;
  }

  // Extract size (sqft)
  const sizeMatch = markdown.match(
    /(\d+(?:,\d+)?)\s*(?:[-–to]+\s*(\d+(?:,\d+)?))?\s*(?:sq\.?\s*ft|sqft)/i
  );
  let sizeMin: number | null = null;
  let sizeMax: number | null = null;
  if (sizeMatch) {
    sizeMin = parseInt(sizeMatch[1].replace(/,/g, ""));
    sizeMax = sizeMatch[2]
      ? parseInt(sizeMatch[2].replace(/,/g, ""))
      : sizeMin;
  }

  // Extract handover date
  const handoverMatch = markdown.match(
    /(?:handover|completion|ready)[:\s]*(?:Q[1-4]\s*)?(\d{4})/i
  );
  const handoverDate = handoverMatch ? `${handoverMatch[1]}-01-01` : null;

  // Extract description
  const description = extractDescription(markdown);

  // Extract images - must have valid images
  const images = extractImages(html, links);
  
  // Validate: must have at least 1 real image (not error page SVGs)
  const validImages = images.filter(img => 
    !img.includes("page-not-found") && 
    !img.includes("error") &&
    !img.includes("404") &&
    (img.endsWith(".jpg") || img.endsWith(".jpeg") || img.endsWith(".png") || img.endsWith(".webp"))
  );
  
  if (validImages.length === 0) {
    console.log("No valid images found - likely error page");
    return null;
  }

  // Find brochure/PDF
  const brochureUrl =
    links.find(
      (link) =>
        link.toLowerCase().includes("brochure") ||
        (link.toLowerCase().endsWith(".pdf") && !link.includes("floorplan"))
    ) || null;

  return {
    name,
    developer: developer?.trim() || null,
    location: location?.trim() || null,
    priceFrom,
    priceTo,
    bedroomsMin,
    bedroomsMax,
    sizeMin,
    sizeMax,
    handoverDate,
    description,
    images: validImages,
    brochureUrl,
  };
}

function extractPattern(text: string, pattern: RegExp): string | null {
  const match = text.match(pattern);
  return match ? match[1].trim() : null;
}

function parsePrice(str: string): number {
  const clean = str.replace(/,/g, "");
  const num = parseInt(clean);
  // Handle K, M, B suffixes if present
  if (str.match(/M/i)) return num * 1000000;
  if (str.match(/K/i)) return num * 1000;
  if (str.match(/B/i)) return num * 1000000000;
  return num;
}

function extractDescription(markdown: string): string | null {
  const paragraphs = markdown.split("\n\n").filter(
    (p) =>
      p.length > 50 &&
      !p.startsWith("#") &&
      !p.includes("![") &&
      !p.match(/^\s*[-*]\s/)
  );
  return paragraphs[0]?.substring(0, 500) || null;
}

function extractImages(html: string, links: string[]): string[] {
  const images: string[] = [];
  const seen = new Set<string>();

  // Patterns to exclude
  const excludePatterns = [
    /navbar/i,
    /header/i,
    /footer/i,
    /menu/i,
    /widget/i,
    /sidebar/i,
    /banner/i,
    /thumbnail/i,
    /social/i,
    /share/i,
    /button/i,
    /icon/i,
    /logo/i,
    /avatar/i,
    /placeholder/i,
    /grid_01_50def6e330/i,
    /signature_property_47dbd09aff/i,
  ];

  // Extract from img tags
  const imgMatches = html.matchAll(/<img[^>]+src="([^"]+)"[^>]*>/gi);
  for (const match of imgMatches) {
    const src = match[1];
    if (isValidImage(src, excludePatterns) && !seen.has(src)) {
      seen.add(src);
      images.push(src);
    }
  }

  // Check links for images
  for (const link of links) {
    if (
      link.match(/\.(jpg|jpeg|png|webp)$/i) &&
      isValidImage(link, excludePatterns) &&
      !seen.has(link)
    ) {
      seen.add(link);
      images.push(link);
    }
  }

  return images.slice(0, 10);
}

function isValidImage(url: string, excludePatterns: RegExp[]): boolean {
  if (!url.startsWith("http")) return false;
  for (const pattern of excludePatterns) {
    if (pattern.test(url)) return false;
  }
  return true;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");
    if (!firecrawlKey) {
      console.error("FIRECRAWL_API_KEY not configured");
      return new Response(
        JSON.stringify({
          success: false,
          error: "Firecrawl connector not configured. Please connect Firecrawl in Settings.",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action } = await req.json();

    // Test Firecrawl connection
    if (action === "test-auth") {
      try {
        const testResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${firecrawlKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url: "https://reelly.ai",
            formats: ["markdown"],
            onlyMainContent: true,
          }),
        });

        if (testResponse.ok) {
          return new Response(
            JSON.stringify({
              success: true,
              message: "Firecrawl connection successful - ready to scrape",
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        } else {
          const errorData = await testResponse.json();
          return new Response(
            JSON.stringify({
              success: false,
              error: errorData.error || `Firecrawl status ${testResponse.status}`,
            }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
      } catch (error) {
        return new Response(
          JSON.stringify({
            success: false,
            error: `Connection test failed: ${(error as Error).message}`,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // Import projects
    if (action === "import") {
      const results: Array<{
        project: string;
        slug: string;
        action: "created" | "updated";
        imagesCount: number;
        hasBrochure: boolean;
      }> = [];
      const errors: Array<{ project: string; error: string }> = [];

      // Get or create developer for imports
      let { data: developer } = await supabase
        .from("developers")
        .select("id")
        .eq("slug", "reelly-import")
        .single();

      if (!developer) {
        const { data: newDev } = await supabase
          .from("developers")
          .insert({
            name: "Imported from Reelly",
            slug: "reelly-import",
            rank: 999,
          })
          .select("id")
          .single();
        developer = newDev;
      }

      // Process each project with rate limiting
      for (let i = 0; i < TARGET_PROJECTS.length; i++) {
        const target = TARGET_PROJECTS[i];

        // 3 second delay between requests
        if (i > 0) {
          await new Promise((resolve) => setTimeout(resolve, 3000));
        }

        try {
          console.log(`Processing ${target.name}...`);
          const scraped = await scrapeProjectPage(target.url, firecrawlKey);

          if (!scraped) {
            errors.push({
              project: target.name,
              error: "Page returned 404 or error content - URL may be deprecated. Reelly has moved to soft.reelly.io which requires API access.",
            });
            continue;
          }

          // Check if exists
          const { data: existing } = await supabase
            .from("projects")
            .select("id")
            .eq("slug", target.slug)
            .single();

          let projectId: string;
          let actionType: "created" | "updated";

          const projectData = {
            name: scraped.name,
            description: scraped.description,
            location: scraped.location,
            price_from: scraped.priceFrom,
            price_to: scraped.priceTo,
            bedrooms_min: scraped.bedroomsMin,
            bedrooms_max: scraped.bedroomsMax,
            size_min: scraped.sizeMin,
            size_max: scraped.sizeMax,
            handover_date: scraped.handoverDate,
            source: "reelly",
            source_url: target.url,
            updated_at: new Date().toISOString(),
          };

          if (existing) {
            await supabase
              .from("projects")
              .update(projectData)
              .eq("id", existing.id);
            projectId = existing.id;
            actionType = "updated";
          } else {
            const { data: newProject, error: insertError } = await supabase
              .from("projects")
              .insert({
                ...projectData,
                slug: target.slug,
                developer_id: developer?.id,
              })
              .select("id")
              .single();

            if (insertError) throw insertError;
            projectId = newProject!.id;
            actionType = "created";
          }

          // Handle images
          if (scraped.images.length > 0) {
            await supabase
              .from("project_images")
              .delete()
              .eq("project_id", projectId);

            const imageInserts = scraped.images.map((url, idx) => ({
              project_id: projectId,
              image_url: url,
              alt_text: `${scraped.name} - Image ${idx + 1}`,
              display_order: idx,
            }));

            await supabase.from("project_images").insert(imageInserts);
          }

          // Handle brochure
          if (scraped.brochureUrl) {
            await supabase
              .from("project_documents")
              .delete()
              .eq("project_id", projectId)
              .eq("document_type", "brochure");

            await supabase.from("project_documents").insert({
              project_id: projectId,
              document_type: "brochure",
              file_url: scraped.brochureUrl,
              file_name: `${target.slug}-brochure.pdf`,
            });
          }

          results.push({
            project: target.name,
            slug: target.slug,
            action: actionType,
            imagesCount: scraped.images.length,
            hasBrochure: !!scraped.brochureUrl,
          });
        } catch (error) {
          console.error(`Error processing ${target.name}:`, error);
          errors.push({
            project: target.name,
            error: (error as Error).message,
          });
        }
      }

      const summary = {
        processed: results.length + errors.length,
        created: results.filter((r) => r.action === "created").length,
        updated: results.filter((r) => r.action === "updated").length,
        failed: errors.length,
      };

      return new Response(
        JSON.stringify({ success: true, results, errors, summary }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: "Invalid action" }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in reelly-scrape:", error);
    return new Response(
      JSON.stringify({ success: false, error: (error as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
