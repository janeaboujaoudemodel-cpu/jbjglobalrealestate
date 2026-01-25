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

function pickBestImageFromImgTag(imgTag: string): string {
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
    candidates.sort((a, b) => b.width - a.width);
    const best = candidates[0];
    if (best?.url) return best.url;
  }
  const srcMatch = imgTag.match(/src="([^"]+)"/);
  return srcMatch?.[1] ? normalizeUrl(srcMatch[1]) : "";
}

function extractDeveloperCards(html: string): ProvidentDeveloper[] {
  const developers: ProvidentDeveloper[] = [];
  let displayOrder = 0;

  const startRegex = /<div\s+class="developer-card[^"]*">/gi;
  const starts: number[] = [];
  let m: RegExpExecArray | null;
  while ((m = startRegex.exec(html)) !== null) {
    starts.push(m.index);
  }

  console.log(`  Found ${starts.length} developer-card starts`);

  for (let i = 0; i < starts.length; i++) {
    const start = starts[i];
    const end = i + 1 < starts.length ? starts[i + 1] : html.length;
    const cardHtml = html.slice(start, end);
    displayOrder++;

    let featureImage = "";
    const featureBlockMatch = cardHtml.match(/<div\s+class="img-section"[^>]*>([\s\S]*?)<\/div>/i);
    if (featureBlockMatch) {
      const imgMatch = featureBlockMatch[1].match(/<img[^>]*>/i);
      if (imgMatch) featureImage = pickBestImageFromImgTag(imgMatch[0]);
    }

    let logo = "";
    const logoBlockMatch = cardHtml.match(/<div\s+class="logo-section"[^>]*>([\s\S]*?)<\/div>/i);
    if (logoBlockMatch) {
      const imgMatch = logoBlockMatch[1].match(/<img[^>]*>/i);
      if (imgMatch) logo = pickBestImageFromImgTag(imgMatch[0]);
    }

    const nameMatch = cardHtml.match(/<a\s+class="name"[^>]*>\s*<span>([^<]+)<\/span>/i);
    const name = nameMatch ? decodeHtmlEntities(nameMatch[1]).trim() : "";

    const linkMatch = cardHtml.match(/<a\s+[^>]*class="(?:img-section-wrap|name)"[^>]*href="([^"]+)"/i);
    const providentLink = linkMatch?.[1] ? normalizeUrl(linkMatch[1]) : "";

    const descMatch = cardHtml.match(/<p\s+class="description"[^>]*>([\s\S]*?)<\/p>/i);
    let description = descMatch ? descMatch[1] : "";
    description = decodeHtmlEntities(description).replace(/<[^>]+>/g, "").trim();

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

  return developers;
}

/**
 * PROVIDENT DEVELOPERS EXTRACTION v7 - FIRECRAWL WITH AUTO-SCROLL
 * 
 * Uses Firecrawl with scroll actions to load ALL developers from infinite scroll.
 * Provident's site loads 24 cards initially and requires scrolling to load more.
 */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const firecrawlApiKey = Deno.env.get("FIRECRAWL_API_KEY");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log("🔄 Starting Provident Developers Extraction v7 (Auto-Scroll)...");

    if (!firecrawlApiKey) {
      throw new Error("FIRECRAWL_API_KEY not configured");
    }

    // Build scroll actions to trigger infinite scroll loading
    // Each scroll loads ~24 more developers, need 7 scrolls for all ~168
    const scrollActions = [];
    for (let i = 0; i < 10; i++) {
      scrollActions.push({ type: "scroll", direction: "down", amount: 2000 });
      scrollActions.push({ type: "wait", milliseconds: 1500 });
    }

    console.log(`📄 Scraping with Firecrawl + ${scrollActions.length / 2} scrolls: ${PROVIDENT_DEVELOPERS_URL}`);
    
    const firecrawlResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${firecrawlApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url: PROVIDENT_DEVELOPERS_URL,
        formats: ["html"],
        onlyMainContent: false,
        waitFor: 3000,
        timeout: 90000,
        actions: scrollActions,
      }),
    });

    if (!firecrawlResponse.ok) {
      const errorText = await firecrawlResponse.text();
      console.error("Firecrawl error:", errorText);
      throw new Error(`Firecrawl request failed: ${firecrawlResponse.status}`);
    }

    const firecrawlData = await firecrawlResponse.json();
    const html = firecrawlData?.data?.html || firecrawlData?.html || "";
    
    if (!html) {
      console.error("Firecrawl response:", JSON.stringify(firecrawlData).slice(0, 500));
      throw new Error("No HTML returned from Firecrawl");
    }

    console.log(`📄 Received HTML: ${html.length} characters`);

    // Extract all developer cards
    const allDevelopers = extractDeveloperCards(html);

    // Deduplicate by slug
    const bySlug = new Map<string, ProvidentDeveloper>();
    for (const dev of allDevelopers) {
      if (!dev.slug) continue;
      if (!bySlug.has(dev.slug)) {
        bySlug.set(dev.slug, dev);
      }
    }
    const extractedDevelopers = Array.from(bySlug.values()).sort((a, b) => a.display_order - b.display_order);

    console.log(`📊 Total extracted: ${extractedDevelopers.length} developers (deduped from ${allDevelopers.length})`);

    // Safety check
    if (extractedDevelopers.length < 10) {
      throw new Error(
        `TOO FEW DEVELOPERS EXTRACTED (${extractedDevelopers.length}) - aborting. Check if Provident changed their HTML or if Firecrawl didn't wait long enough.`
      );
    }

    // Clear all existing rows
    console.log("🗑️ Clearing all existing pending_developer_imports rows...");
    const { error: delErr } = await supabase
      .from("pending_developer_imports")
      .delete()
      .not("id", "is", null);

    if (delErr) {
      console.warn("Warning: could not clear rows:", delErr.message);
    }

    // Insert fresh data
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

    // Log extraction job
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
        version: "v6-firecrawl",
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
