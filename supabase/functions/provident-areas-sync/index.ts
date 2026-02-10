import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const log: string[] = [];
  const addLog = (msg: string) => { log.push(msg); console.log(msg); };

  try {
    const body = await req.json().catch(() => ({}));
    const mode = body.mode || "full"; // "full" | "index-only" | "single"
    const singleSlug = body.slug; // for mode=single

    // Step 1: Scrape Provident area-guides index page
    addLog("Step 1: Fetching Provident area guides index...");
    
    let areaUrls: { slug: string; url: string }[] = [];
    
    if (firecrawlKey) {
      const indexRes = await fetch("https://api.firecrawl.dev/v1/scrape", {
        method: "POST",
        headers: { "Authorization": `Bearer ${firecrawlKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          url: "https://providentestate.com/area-guides/",
          formats: ["links", "markdown"],
          onlyMainContent: true,
          waitFor: 5000,
          timeout: 60000,
        }),
      });

      const indexData = await indexRes.json();
      const links: string[] = indexData?.data?.links || indexData?.links || [];
      
      // Extract area guide URLs (format: /area-guides/SLUG/)
      const areaGuidePattern = /\/area-guides\/([a-z0-9-]+)\/?$/;
      for (const link of links) {
        const match = link.match(areaGuidePattern);
        if (match && match[1] !== "area-guides") {
          areaUrls.push({ slug: match[1], url: link.startsWith("http") ? link : `https://providentestate.com${link}` });
        }
      }
      addLog(`Found ${areaUrls.length} area guide URLs from Provident`);
    } else {
      addLog("No FIRECRAWL_API_KEY found, using hardcoded Provident area list");
      // Fallback: known Provident areas
      const knownAreas = [
        "downtown-dubai", "dubai-marina", "palm-jumeirah", "business-bay",
        "dubai-hills-estate", "jumeirah-village-circle", "arabian-ranches",
        "dubai-creek-harbour", "jumeirah-beach-residence", "dubai-south",
        "mohammed-bin-rashid-city", "al-furjan", "jumeirah-lake-towers",
        "dubai-sports-city", "dubailand", "motor-city", "dubai-silicon-oasis",
        "international-city", "production-city", "al-barsha",
        "jumeirah-village-triangle", "meydan", "town-square",
        "damac-hills", "damac-hills-2", "al-barari", "dubai-investment-park",
        "jumeirah-golf-estates", "the-villa", "mudon", "serena",
        "tilal-al-ghaf", "emaar-beachfront", "bluewaters", "city-walk",
        "al-jaddaf", "culture-village", "nad-al-sheba", "ras-al-khor",
        "sobha-hartland", "madinat-jumeirah-living"
      ];
      areaUrls = knownAreas.map(s => ({ slug: s, url: `https://providentestate.com/area-guides/${s}/` }));
    }

    if (mode === "index-only") {
      return new Response(JSON.stringify({ success: true, areaUrls, log }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      });
    }

    // Filter for single slug if requested
    if (mode === "single" && singleSlug) {
      areaUrls = areaUrls.filter(a => a.slug === singleSlug);
      if (areaUrls.length === 0) {
        areaUrls = [{ slug: singleSlug, url: `https://providentestate.com/area-guides/${singleSlug}/` }];
      }
    }

    // Step 2: Scrape each area detail page
    addLog(`Step 2: Scraping ${areaUrls.length} area pages...`);
    let updated = 0;
    let skipped = 0;
    let created = 0;

    for (const area of areaUrls) {
      try {
        // Throttle to avoid rate limiting
        if (updated + skipped > 0) {
          await new Promise(r => setTimeout(r, 3000));
        }

        addLog(`Scraping: ${area.url}`);

        if (!firecrawlKey) {
          addLog(`  Skipped (no Firecrawl key)`);
          skipped++;
          continue;
        }

        const pageRes = await fetch("https://api.firecrawl.dev/v1/scrape", {
          method: "POST",
          headers: { "Authorization": `Bearer ${firecrawlKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            url: area.url,
            formats: ["markdown", "html"],
            onlyMainContent: true,
            waitFor: 5000,
            timeout: 60000,
          }),
        });

        if (pageRes.status === 429 || pageRes.status === 402) {
          addLog(`  Rate limited/credits exhausted (${pageRes.status}), stopping.`);
          break;
        }

        const pageData = await pageRes.json();
        const markdown = pageData?.data?.markdown || pageData?.markdown || "";
        const html = pageData?.data?.html || pageData?.html || "";
        const metadata = pageData?.data?.metadata || pageData?.metadata || {};

        // Extract hero image from metadata (og:image) or HTML
        let heroImage = metadata?.ogImage || metadata?.["og:image"] || null;
        if (!heroImage) {
          // Try to find hero image from HTML
          const imgMatch = html.match(/<img[^>]+class="[^"]*hero[^"]*"[^>]+src="([^"]+)"/i) ||
                           html.match(/<img[^>]+src="([^"]+)"[^>]+class="[^"]*hero[^"]*"/i) ||
                           html.match(/<div[^>]+style="[^"]*background-image:\s*url\(([^)]+)\)/i);
          if (imgMatch) heroImage = imgMatch[1];
        }
        // Also check for first large image in the page
        if (!heroImage) {
          const allImgs = html.matchAll(/<img[^>]+src="(https?:\/\/[^"]+)"/gi);
          for (const m of allImgs) {
            const src = m[1];
            if (src.includes("providentestate.com") && !src.includes("logo") && !src.includes("icon") && !src.includes("avatar")) {
              heroImage = src;
              break;
            }
          }
        }

        // Extract description from markdown (first meaningful paragraph)
        let description = "";
        const lines = markdown.split("\n").filter((l: string) => l.trim().length > 50 && !l.startsWith("#") && !l.startsWith("[") && !l.startsWith("|"));
        if (lines.length > 0) {
          description = lines.slice(0, 3).join(" ").substring(0, 500).trim();
        }

        // Normalize the slug for DB matching
        const slugVariants = [
          area.slug,
          area.slug.replace(/-/g, " "),
          // Handle JVC variant
          area.slug === "jumeirah-village-circle" ? "jumeirah-village-circle-jvc" : null,
        ].filter(Boolean);

        // Find matching area in DB
        let dbArea = null;
        for (const sv of slugVariants) {
          const { data } = await supabase
            .from("areas")
            .select("id, slug, image_url, hero_image_url, description")
            .ilike("slug", `%${sv}%`)
            .limit(1);
          if (data && data.length > 0) {
            dbArea = data[0];
            break;
          }
        }

        if (!dbArea) {
          // Try name match
          const areaName = area.slug.replace(/-/g, " ");
          const { data } = await supabase
            .from("areas")
            .select("id, slug, image_url, hero_image_url, description")
            .ilike("name", `%${areaName}%`)
            .limit(1);
          if (data && data.length > 0) dbArea = data[0];
        }

        if (dbArea) {
          // Update existing area - never overwrite existing images
          const updateData: Record<string, any> = {
            provident_url: area.url,
            updated_at: new Date().toISOString(),
          };

          if (heroImage && !dbArea.image_url) {
            updateData.image_url = heroImage;
          }
          if (heroImage && !dbArea.hero_image_url) {
            updateData.hero_image_url = heroImage;
          }
          if (description && !dbArea.description) {
            updateData.description = description;
          }

          const { error: updateErr } = await supabase
            .from("areas")
            .update(updateData)
            .eq("id", dbArea.id);

          if (updateErr) {
            addLog(`  Error updating ${dbArea.slug}: ${updateErr.message}`);
          } else {
            addLog(`  Updated: ${dbArea.slug} (image: ${heroImage ? "yes" : "no"}, desc: ${description ? "yes" : "no"})`);
            updated++;
          }
        } else {
          // Create new area from Provident
          const areaName = area.slug
            .split("-")
            .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" ");

          const { error: insertErr } = await supabase
            .from("areas")
            .insert({
              name: areaName,
              slug: area.slug,
              emirate: "Dubai",
              image_url: heroImage,
              hero_image_url: heroImage,
              description: description || null,
              provident_url: area.url,
              is_active: true,
              property_count: 0,
            });

          if (insertErr) {
            if (insertErr.message.includes("duplicate")) {
              addLog(`  Already exists: ${area.slug}`);
              skipped++;
            } else {
              addLog(`  Error creating ${area.slug}: ${insertErr.message}`);
            }
          } else {
            addLog(`  Created: ${areaName} (${area.slug})`);
            created++;
          }
        }
      } catch (err) {
        addLog(`  Error processing ${area.slug}: ${err instanceof Error ? err.message : String(err)}`);
        skipped++;
      }
    }

    // Step 3: Compute developer/project counts per area from projects table
    addLog("Step 3: Computing developer/project counts per area...");
    
    const { data: allAreas } = await supabase
      .from("areas")
      .select("id, name, slug")
      .eq("is_active", true);

    if (allAreas) {
      for (const a of allAreas) {
        // Count projects in this area by matching area_name
        const { count: projectCount } = await supabase
          .from("projects")
          .select("id", { count: "exact", head: true })
          .ilike("area_name", `%${a.name}%`);

        // Count distinct developers
        const { data: devData } = await supabase
          .from("projects")
          .select("developer_name")
          .ilike("area_name", `%${a.name}%`)
          .not("developer_name", "is", null);

        const uniqueDevs = new Set(devData?.map((d: any) => d.developer_name) || []);

        if ((projectCount || 0) > 0 || uniqueDevs.size > 0) {
          await supabase
            .from("areas")
            .update({
              property_count: projectCount || 0,
              developer_count: uniqueDevs.size,
              project_count_sale: projectCount || 0,
            })
            .eq("id", a.id);
        }
      }
      addLog(`Updated stats for ${allAreas.length} areas`);
    }

    addLog(`Done! Updated: ${updated}, Created: ${created}, Skipped: ${skipped}`);

    return new Response(JSON.stringify({ success: true, updated, created, skipped, log }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  } catch (error) {
    addLog(`Fatal error: ${error instanceof Error ? error.message : String(error)}`);
    return new Response(JSON.stringify({ success: false, error: String(error), log }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" }
    });
  }
});
