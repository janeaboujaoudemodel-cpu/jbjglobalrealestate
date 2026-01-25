import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ProvidentDeveloper {
  name: string;
  slug: string;
  description: string;
  feature_image_url: string;
  logo_url: string;
  provident_link: string;
  display_order: number;
}

const PROVIDENT_DEVELOPERS_URL = "https://providentestate.com/developers/";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[&]/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function normalizeUrl(url: string): string {
  const trimmed = url?.trim() ?? "";
  if (!trimmed) return "";
  if (trimmed.startsWith("//")) return `https:${trimmed}`;
  if (trimmed.startsWith("/")) return `https://providentestate.com${trimmed}`;
  return trimmed;
}

function decodeHtmlEntities(input: string): string {
  return input
    .replace(/&amp;nbsp;/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

/**
 * Pick the best image URL from an <img> tag.
 * We use srcset if available (picking the largest width descriptor),
 * otherwise fall back to src.
 * 
 * IMPORTANT: We do NOT upgrade URLs to larger sizes like /x/1600x1200/
 * because those return AccessDenied from Provident's CDN.
 */
function pickBestImageFromImgTag(imgTag: string): string {
  // Try srcset first
  const srcsetMatch = imgTag.match(/srcset="([^"]+)"/);
  if (srcsetMatch?.[1]) {
    const parts = srcsetMatch[1].split(",").map((s) => s.trim()).filter(Boolean);
    const candidates = parts.map((p) => {
      const segments = p.split(/\s+/);
      const url = segments[0] || "";
      const descriptor = segments[1] || "";
      const width = descriptor.endsWith("w") ? Number(descriptor.replace("w", "")) : 0;
      return { url: normalizeUrl(url), width: Number.isFinite(width) ? width : 0 };
    });

    // Sort by width descending, pick the largest available
    candidates.sort((a, b) => b.width - a.width);
    const best = candidates[0];
    if (best?.url) return best.url;
  }

  // Fallback to src
  const srcMatch = imgTag.match(/src="([^"]+)"/);
  return srcMatch?.[1] ? normalizeUrl(srcMatch[1]) : "";
}

/**
 * Extract all developer cards from an HTML page.
 * Uses a robust approach: find all <div class="developer-card"> starts
 * and slice between them.
 */
function extractDeveloperCards(html: string, startingOrder: number): { developers: ProvidentDeveloper[]; displayOrder: number } {
  const developers: ProvidentDeveloper[] = [];
  let displayOrder = startingOrder;

  // Find all card start positions
  const startRegex = /<div\s+class="developer-card[^"]*">/gi;
  const starts: number[] = [];
  let m: RegExpExecArray | null;
  while ((m = startRegex.exec(html)) !== null) {
    starts.push(m.index);
  }

  console.log(`  Found ${starts.length} developer-card starts on this page`);

  for (let i = 0; i < starts.length; i++) {
    const start = starts[i];
    const end = i + 1 < starts.length ? starts[i + 1] : html.length;
    const cardHtml = html.slice(start, end);
    displayOrder++;

    // Feature image: look for img inside .img-section
    let featureImage = "";
    const featureBlockMatch = cardHtml.match(/<div\s+class="img-section"[^>]*>([\s\S]*?)<\/div>/i);
    if (featureBlockMatch) {
      const imgMatch = featureBlockMatch[1].match(/<img[^>]*>/i);
      if (imgMatch) {
        featureImage = pickBestImageFromImgTag(imgMatch[0]);
      }
    }

    // Logo image: look for img inside .logo-section
    let logo = "";
    const logoBlockMatch = cardHtml.match(/<div\s+class="logo-section"[^>]*>([\s\S]*?)<\/div>/i);
    if (logoBlockMatch) {
      const imgMatch = logoBlockMatch[1].match(/<img[^>]*>/i);
      if (imgMatch) {
        logo = pickBestImageFromImgTag(imgMatch[0]);
      }
    }

    // Name: inside <a class="name"><span>...</span></a>
    const nameMatch = cardHtml.match(/<a\s+class="name"[^>]*>\s*<span>([^<]+)<\/span>/i);
    const name = nameMatch ? decodeHtmlEntities(nameMatch[1]).trim() : "";

    // Link: from href on .img-section-wrap or .name
    const linkMatch = cardHtml.match(/<a\s+[^>]*class="(?:img-section-wrap|name)"[^>]*href="([^"]+)"/i);
    const providentLink = linkMatch?.[1] ? normalizeUrl(linkMatch[1]) : "";

    // Description: inside <p class="description">
    const descMatch = cardHtml.match(/<p\s+class="description"[^>]*>([\s\S]*?)<\/p>/i);
    let description = descMatch ? descMatch[1] : "";
    description = decodeHtmlEntities(description)
      .replace(/<[^>]+>/g, "")
      .trim();

    // Skip if no name or no images at all
    if (!name) continue;
    if (!featureImage && !logo) continue;

    developers.push({
      name,
      slug: slugify(name),
      description,
      feature_image_url: featureImage,
      logo_url: logo,
      provident_link: providentLink,
      display_order: displayOrder,
    });

    console.log(`  ✅ [${displayOrder}] ${name} | Logo: ${logo ? "✓" : "✗"} | Image: ${featureImage ? "✓" : "✗"}`);
  }

  return { developers, displayOrder };
}

/**
 * Detect maximum page number from pagination links
 */
function extractMaxPage(html: string): number {
  const pages: number[] = [];
  
  // Match ?page=N patterns
  for (const match of html.matchAll(/developers\/?\?page=(\d+)/gi)) {
    pages.push(Number(match[1]));
  }
  
  // Match /page/N patterns
  for (const match of html.matchAll(/developers\/?page\/(\d+)/gi)) {
    pages.push(Number(match[1]));
  }
  
  const validPages = pages.filter((n) => Number.isFinite(n) && n > 0);
  return validPages.length > 0 ? Math.max(...validPages) : 1;
}

/**
 * PROVIDENT DEVELOPERS EXTRACTION v5
 * 
 * • Fetches ALL developers from https://providentestate.com/developers/ (with pagination)
 * • Uses srcset/src URLs directly (no broken "upgrades" to blocked resolutions)
 * • Deduplicates by slug before insert
 * • Clears ALL existing pending rows before inserting to avoid duplicates
 * • Preserves source ordering via display_order column
 */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("🔄 Starting Provident Developers Extraction v5...");

    const requestHeaders = {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
      "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.5",
    };

    // 1) Fetch page 1
    console.log(`📄 Fetching page 1: ${PROVIDENT_DEVELOPERS_URL}`);
    const page1Res = await fetch(PROVIDENT_DEVELOPERS_URL, { headers: requestHeaders });
    if (!page1Res.ok) {
      throw new Error(`Failed to fetch Provident developers page 1: ${page1Res.status}`);
    }
    const page1Html = await page1Res.text();
    console.log(`📄 Page 1 HTML: ${page1Html.length} characters`);

    const maxPage = extractMaxPage(page1Html);
    console.log(`📄 Detected max page: ${maxPage}`);

    // 2) Parse page 1
    let allDevelopers: ProvidentDeveloper[] = [];
    let { developers: page1Devs, displayOrder } = extractDeveloperCards(page1Html, 0);
    allDevelopers = allDevelopers.concat(page1Devs);
    console.log(`📄 Page 1: extracted ${page1Devs.length} developers`);

    // 3) Fetch and parse remaining pages (up to 50 max for safety)
    if (maxPage > 1) {
      for (let page = 2; page <= Math.min(maxPage, 50); page++) {
        const pageUrl = `${PROVIDENT_DEVELOPERS_URL}?page=${page}`;
        console.log(`📄 Fetching page ${page}: ${pageUrl}`);
        
        const res = await fetch(pageUrl, { headers: requestHeaders });
        if (!res.ok) {
          console.warn(`⚠️ Failed to fetch page ${page} (${res.status}) - stopping pagination`);
          break;
        }
        
        const html = await res.text();
        const parsed = extractDeveloperCards(html, displayOrder);
        displayOrder = parsed.displayOrder;
        allDevelopers = allDevelopers.concat(parsed.developers);
        console.log(`📄 Page ${page}: extracted ${parsed.developers.length} developers`);
      }
    }

    // 4) Deduplicate by slug (prevents unique-constraint failures)
    const bySlug = new Map<string, ProvidentDeveloper>();
    for (const dev of allDevelopers) {
      if (!dev.slug) continue;
      if (!bySlug.has(dev.slug)) {
        bySlug.set(dev.slug, dev);
      }
    }
    const extractedDevelopers = Array.from(bySlug.values()).sort((a, b) => a.display_order - b.display_order);

    console.log(`📊 Total extracted: ${extractedDevelopers.length} developers (deduped from ${allDevelopers.length})`);

    // Safety check: if parsing regresses, don't wipe the queue
    if (extractedDevelopers.length < 10) {
      throw new Error(
        `TOO FEW DEVELOPERS EXTRACTED (${extractedDevelopers.length}) - aborting to prevent data loss. Check if Provident changed their HTML structure.`
      );
    }

    // 5) Clear ALL existing rows before insert (fresh full sync)
    console.log("🗑️ Clearing all existing pending_developer_imports rows...");
    const { error: delErr } = await supabase
      .from("pending_developer_imports")
      .delete()
      .not("id", "is", null); // delete all rows

    if (delErr) {
      console.warn("Warning: could not clear rows:", delErr.message);
    }

    // 6) Insert fresh data
    const rows = extractedDevelopers.map((dev) => ({
      name: dev.name,
      slug: dev.slug,
      description: dev.description,
      feature_image_url: dev.feature_image_url,
      logo_url: dev.logo_url,
      provident_link: dev.provident_link,
      source: "provident_estate",
      status: "pending",
      extracted_at: new Date().toISOString(),
    }));

    console.log(`💾 Inserting ${rows.length} rows...`);
    const { error: insertError } = await supabase
      .from("pending_developer_imports")
      .insert(rows);

    if (insertError) {
      console.error("Insert error:", insertError);
      throw new Error(`Failed to store pending imports: ${insertError.message}`);
    }

    // 7) Log extraction job
    await supabase.from("extraction_job_logs").insert({
      source_id: null,
      job_type: "developer_extraction",
      status: "completed",
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      records_found: extractedDevelopers.length,
      records_matched: 0,
      records_pending: extractedDevelopers.length,
      metadata: {
        source: "provident_estate",
        url: PROVIDENT_DEVELOPERS_URL,
        version: "v5",
        pages_fetched: maxPage,
      },
    });

    console.log(`✅ Successfully extracted and stored ${extractedDevelopers.length} developers`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Successfully extracted ${extractedDevelopers.length} developers`,
        count: extractedDevelopers.length,
        developers: extractedDevelopers.map((d) => ({
          name: d.name,
          order: d.display_order,
          logo: d.logo_url ? "✓" : "✗",
          image: d.feature_image_url ? "✓" : "✗",
        })),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("❌ Extraction error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";

    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
