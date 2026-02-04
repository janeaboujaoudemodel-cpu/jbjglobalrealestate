import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Target projects for Phase 1 test
const TARGET_PROJECTS = [
  "Divine Elements",
  "The Meriva Collection", 
  "Al Hasin Residence Six",
  "Confident Preston"
];

interface ReellyProject {
  id: string;
  name: string;
  developer: string;
  area: string;
  status: string;
  handover: string;
  priceFrom: number | null;
  bedrooms: { min: number | null; max: number | null };
  sizes: { min: number | null; max: number | null; unit: string };
  paymentPlan: string | null;
  description: string;
  highlights: string[];
  latitude: number | null;
  longitude: number | null;
  coverImage: string;
  galleryImages: string[];
  brochureUrl: string | null;
  floorplanUrls: string[];
  units: any[];
}

async function authenticateReelly(): Promise<{ token: string; cookies: string } | null> {
  const email = Deno.env.get("REELLY_EMAIL");
  const password = Deno.env.get("REELLY_PASSWORD");
  
  if (!email || !password) {
    console.error("REELLY_EMAIL or REELLY_PASSWORD not configured");
    return null;
  }

  try {
    // Step 1: Get the login page to extract any CSRF tokens
    const loginPageRes = await fetch("https://find.reelly.io/sign-in", {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });
    
    const initialCookies = loginPageRes.headers.get("set-cookie") || "";
    console.log("Got initial cookies from login page");

    // Step 2: Attempt authentication via Memberstack (Reelly uses Memberstack for auth)
    // Note: Reelly uses Wized + Memberstack for auth, we need to find the correct endpoint
    
    // Try the Memberstack API directly
    const memberstackAuthUrl = "https://client.memberstack.com/auth/login";
    
    const authRes = await fetch(memberstackAuthUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Origin": "https://find.reelly.io",
        "Referer": "https://find.reelly.io/sign-in",
      },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    if (authRes.ok) {
      const authData = await authRes.json();
      console.log("Memberstack auth successful");
      return {
        token: authData.token || authData.access_token || "",
        cookies: authRes.headers.get("set-cookie") || initialCookies,
      };
    }

    console.error("Memberstack auth failed:", authRes.status);
    
    // Fallback: Try Wized auth endpoint
    const wizedAuthRes = await fetch("https://api.wized.com/v1/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      body: JSON.stringify({ email, password }),
    });

    if (wizedAuthRes.ok) {
      const wizedData = await wizedAuthRes.json();
      console.log("Wized auth successful");
      return {
        token: wizedData.token || "",
        cookies: wizedAuthRes.headers.get("set-cookie") || "",
      };
    }

    console.error("All auth attempts failed");
    return null;
  } catch (error) {
    console.error("Authentication error:", error);
    return null;
  }
}

async function scrapeWithFirecrawl(url: string, auth?: { token: string; cookies: string }): Promise<any> {
  const apiKey = Deno.env.get("FIRECRAWL_API_KEY");
  if (!apiKey) {
    throw new Error("FIRECRAWL_API_KEY not configured");
  }

  const requestBody: Record<string, any> = {
    url,
    formats: ["markdown", "html", "links"],
    onlyMainContent: true,
    waitFor: 8000,
    timeout: 60000,
  };

  // Add authentication headers if available
  if (auth) {
    requestBody.headers = {
      "Cookie": auth.cookies,
      "Authorization": `Bearer ${auth.token}`,
    };
  }

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
    throw new Error(`Firecrawl error: ${data.error || response.status}`);
  }

  return data;
}

function parseProjectFromHtml(html: string, markdown: string): Partial<ReellyProject> | null {
  try {
    // Extract project name
    const nameMatch = html.match(/<h1[^>]*class="[^"]*project-title[^"]*"[^>]*>([^<]+)<\/h1>/i) ||
                      html.match(/<h1[^>]*>([^<]+)<\/h1>/i);
    const name = nameMatch ? nameMatch[1].trim() : "";

    // Extract developer name
    const developerMatch = html.match(/developer[^>]*>([^<]+)</i) ||
                           markdown.match(/Developer:\s*([^\n]+)/i);
    const developer = developerMatch ? developerMatch[1].trim() : "";

    // Extract area/location
    const areaMatch = html.match(/location[^>]*>([^<]+)</i) ||
                      markdown.match(/Location:\s*([^\n]+)/i);
    const area = areaMatch ? areaMatch[1].trim() : "";

    // Extract price
    const priceMatch = markdown.match(/AED\s*([\d,]+)/i) ||
                       html.match(/price[^>]*>AED\s*([\d,]+)/i);
    const priceFrom = priceMatch ? parseInt(priceMatch[1].replace(/,/g, "")) : null;

    // Extract bedrooms
    const bedroomMatch = markdown.match(/(\d+)\s*-\s*(\d+)\s*BR/i) ||
                         markdown.match(/(\d+)\s*BR/i);
    const bedrooms = bedroomMatch 
      ? { min: parseInt(bedroomMatch[1]), max: parseInt(bedroomMatch[2] || bedroomMatch[1]) }
      : { min: null, max: null };

    // Extract sizes
    const sizeMatch = markdown.match(/([\d,]+)\s*-\s*([\d,]+)\s*(sqft|sq\.ft|m²)/i) ||
                      markdown.match(/([\d,]+)\s*(sqft|sq\.ft|m²)/i);
    const sizes = sizeMatch 
      ? { 
          min: parseInt(sizeMatch[1].replace(/,/g, "")), 
          max: parseInt((sizeMatch[2] || sizeMatch[1]).replace(/,/g, "")),
          unit: sizeMatch[3] || sizeMatch[2] || "sqft"
        }
      : { min: null, max: null, unit: "sqft" };

    // Extract handover date
    const handoverMatch = markdown.match(/handover[:\s]*([^\n]+)/i) ||
                          markdown.match(/completion[:\s]*([^\n]+)/i);
    const handover = handoverMatch ? handoverMatch[1].trim() : "";

    // Extract status
    const statusMatch = markdown.match(/status[:\s]*(off[\s-]*plan|ready|under\s*construction)/i);
    const status = statusMatch ? statusMatch[1].toLowerCase().replace(/\s+/g, "_") : "off_plan";

    // Extract images from HTML
    const imageMatches = html.matchAll(/<img[^>]+src="([^"]+)"/gi);
    const allImages: string[] = [];
    for (const match of imageMatches) {
      const src = match[1];
      if (src && !src.includes("logo") && !src.includes("icon") && !src.includes("avatar")) {
        allImages.push(src);
      }
    }

    // First unique image is cover, rest are gallery
    const uniqueImages = [...new Set(allImages)];
    const coverImage = uniqueImages[0] || "";
    const galleryImages = uniqueImages.slice(1);

    // Extract brochure PDF link
    const brochureMatch = html.match(/href="([^"]+\.pdf[^"]*)"/i) ||
                          html.match(/brochure[^>]+href="([^"]+)"/i);
    const brochureUrl = brochureMatch ? brochureMatch[1] : null;

    // Extract description
    const descMatch = markdown.match(/##\s*(?:About|Description|Overview)[^\n]*\n+([^#]+)/i);
    const description = descMatch ? descMatch[1].trim() : "";

    // Extract highlights/features
    const highlightMatches = markdown.matchAll(/[•\-\*]\s*([^\n]+)/g);
    const highlights: string[] = [];
    for (const match of highlightMatches) {
      if (match[1] && match[1].length > 5 && match[1].length < 200) {
        highlights.push(match[1].trim());
      }
    }

    // Extract coordinates from Google Maps or similar
    const coordMatch = html.match(/lat[="':]+(-?\d+\.?\d*)/i);
    const lngMatch = html.match(/lng[="':]+(-?\d+\.?\d*)/i);
    const latitude = coordMatch ? parseFloat(coordMatch[1]) : null;
    const longitude = lngMatch ? parseFloat(lngMatch[1]) : null;

    return {
      name,
      developer,
      area,
      status,
      handover,
      priceFrom,
      bedrooms,
      sizes,
      description,
      highlights: highlights.slice(0, 10),
      latitude,
      longitude,
      coverImage,
      galleryImages: galleryImages.slice(0, 20),
      brochureUrl,
      floorplanUrls: [],
      units: [],
    };
  } catch (error) {
    console.error("Error parsing project HTML:", error);
    return null;
  }
}

async function searchReellyProjects(auth: { token: string; cookies: string } | null): Promise<string[]> {
  // First, try to get the project listing page
  const listingUrl = "https://find.reelly.io/";
  
  try {
    const result = await scrapeWithFirecrawl(listingUrl, auth || undefined);
    const html = result.data?.html || "";
    const links = result.data?.links || [];
    
    // Find project links matching our target projects
    const projectLinks: string[] = [];
    
    for (const targetName of TARGET_PROJECTS) {
      const searchName = targetName.toLowerCase().replace(/\s+/g, "[-\\s]*");
      const regex = new RegExp(`/projects/\\d+`, 'gi');
      
      // Check links for project URLs
      for (const link of links) {
        if (link.includes("/projects/") && !projectLinks.includes(link)) {
          projectLinks.push(link);
        }
      }
    }
    
    console.log(`Found ${projectLinks.length} potential project links`);
    return projectLinks;
  } catch (error) {
    console.error("Error searching Reelly projects:", error);
    return [];
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, projectIds } = await req.json();
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (action === "authenticate") {
      // Test authentication
      const auth = await authenticateReelly();
      return new Response(
        JSON.stringify({ 
          success: !!auth, 
          message: auth ? "Authentication successful" : "Authentication failed" 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "discover") {
      // Discover available projects
      const auth = await authenticateReelly();
      const projectLinks = await searchReellyProjects(auth);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          projectLinks,
          targetProjects: TARGET_PROJECTS
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "import") {
      // Import specific projects
      const auth = await authenticateReelly();
      
      // Create sync log entry
      const { data: syncLog, error: syncLogError } = await supabase
        .from("reelly_sync_logs")
        .insert({
          sync_type: "import",
          status: "running",
        })
        .select()
        .single();

      if (syncLogError) {
        console.error("Failed to create sync log:", syncLogError);
      }

      const results: any[] = [];
      const errors: any[] = [];
      let created = 0;
      let updated = 0;

      // If no specific project IDs provided, try to find the target projects
      let urlsToScrape = projectIds || [];
      
      if (urlsToScrape.length === 0) {
        // Try to discover projects first
        const discovered = await searchReellyProjects(auth);
        urlsToScrape = discovered.slice(0, 10); // Limit to first 10 for testing
      }

      for (const projectUrl of urlsToScrape) {
        try {
          console.log(`Scraping project: ${projectUrl}`);
          
          // Add delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          const scrapeResult = await scrapeWithFirecrawl(projectUrl, auth || undefined);
          const html = scrapeResult.data?.html || "";
          const markdown = scrapeResult.data?.markdown || "";
          
          const projectData = parseProjectFromHtml(html, markdown);
          
          if (projectData && projectData.name) {
            // Check if it's one of our target projects
            const isTargetProject = TARGET_PROJECTS.some(
              target => projectData.name?.toLowerCase().includes(target.toLowerCase())
            );

            if (!isTargetProject && projectIds?.length === 0) {
              console.log(`Skipping non-target project: ${projectData.name}`);
              continue;
            }

            // Generate slug
            const slug = projectData.name
              .toLowerCase()
              .replace(/[^a-z0-9]+/g, "-")
              .replace(/(^-|-$)/g, "");

            // Extract Reelly project ID from URL
            const reellyIdMatch = projectUrl.match(/\/projects\/(\d+)/);
            const reellyId = reellyIdMatch ? reellyIdMatch[1] : null;

            // Check if project already exists
            const { data: existing } = await supabase
              .from("projects")
              .select("id")
              .eq("source", "reelly")
              .eq("source_id", reellyId)
              .maybeSingle();

            const projectRecord = {
              name: projectData.name,
              slug,
              source: "reelly",
              source_id: reellyId,
              source_url: projectUrl,
              description: projectData.description || null,
              location: projectData.area || null,
              price_from: projectData.priceFrom || null,
              bedrooms_min: projectData.bedrooms?.min ?? null,
              bedrooms_max: projectData.bedrooms?.max ?? null,
              size_min: projectData.sizes?.min ?? null,
              size_max: projectData.sizes?.max ?? null,
              handover_date: projectData.handover || null,
              status: projectData.status === "ready" ? "ready" : "off_plan",
              is_offplan: projectData.status !== "ready",
              highlights: projectData.highlights,
              latitude: projectData.latitude,
              longitude: projectData.longitude,
              updated_at: new Date().toISOString(),
            };

            if (existing) {
              // Update existing project
              await supabase
                .from("projects")
                .update(projectRecord)
                .eq("id", existing.id);
              updated++;
              results.push({ ...projectRecord, action: "updated", id: existing.id });
            } else {
              // Insert new project
              const { data: newProject, error: insertError } = await supabase
                .from("projects")
                .insert({
                  ...projectRecord,
                  created_at: new Date().toISOString(),
                })
                .select()
                .single();

              if (insertError) {
                errors.push({ url: projectUrl, error: insertError.message });
              } else if (newProject) {
                created++;

                // Insert cover image
                if (projectData.coverImage) {
                  await supabase.from("project_images").insert({
                    project_id: newProject.id,
                    image_url: projectData.coverImage,
                    alt_text: `${projectData.name} - Cover`,
                    display_order: 0,
                  });
                }

                // Insert gallery images
                const galleryImages = projectData.galleryImages || [];
                for (let i = 0; i < galleryImages.length; i++) {
                  await supabase.from("project_images").insert({
                    project_id: newProject.id,
                    image_url: galleryImages[i],
                    alt_text: `${projectData.name} - Image ${i + 1}`,
                    display_order: i + 1,
                  });
                }

                // Insert brochure if available
                if (projectData.brochureUrl) {
                  await supabase.from("project_documents").insert({
                    project_id: newProject.id,
                    document_type: "brochure",
                    file_url: projectData.brochureUrl,
                    file_name: `${projectData.name} Brochure.pdf`,
                    display_order: 0,
                  });
                }

                results.push({ ...projectRecord, action: "created", id: newProject.id });
              }
            }
          } else {
            console.log(`Could not parse project from: ${projectUrl}`);
            errors.push({ url: projectUrl, error: "Could not parse project data" });
          }
        } catch (error) {
          console.error(`Error processing ${projectUrl}:`, error);
          errors.push({ url: projectUrl, error: String(error) });
        }
      }

      // Update sync log
      if (syncLog) {
        await supabase
          .from("reelly_sync_logs")
          .update({
            status: errors.length > 0 && results.length === 0 ? "failed" : "completed",
            completed_at: new Date().toISOString(),
            projects_processed: urlsToScrape.length,
            projects_created: created,
            projects_updated: updated,
            errors,
          })
          .eq("id", syncLog.id);
      }

      return new Response(
        JSON.stringify({
          success: true,
          results,
          errors,
          summary: {
            processed: urlsToScrape.length,
            created,
            updated,
            failed: errors.length,
          },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, error: "Invalid action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in reelly-scrape:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
