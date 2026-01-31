import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * DISCOVER ALL PROJECTS - Uses Firecrawl MAP to find all project URLs
 * Then stores them in a queue table for batch processing
 */

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const firecrawlKey = Deno.env.get("FIRECRAWL_API_KEY");

  if (!firecrawlKey) {
    return new Response(JSON.stringify({ error: "Missing FIRECRAWL_API_KEY" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const { freshStart = false } = await req.json().catch(() => ({}));

    console.log("[Discover] Starting project URL discovery via MAP...");

    // Use Firecrawl MAP to get ALL URLs from the site
    const mapRes = await fetch("https://api.firecrawl.dev/v1/map", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${firecrawlKey}` },
      body: JSON.stringify({
        url: "https://providentestate.com/new-projects/",
        search: "new-projects",
        // Firecrawl MAP can return up to ~5000 URLs. Need full inventory of 1335+
        limit: 5000,
        ignoreSitemap: false,
        includeSubdomains: false,
      }),
    });

    if (!mapRes.ok) {
      const errText = await mapRes.text();
      console.error("[Discover] MAP failed:", errText);
      return new Response(JSON.stringify({ error: `MAP failed: ${mapRes.status}`, details: errText.substring(0, 300) }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const mapData = await mapRes.json();
    const allLinks: string[] = mapData.links || [];
    console.log(`[Discover] MAP returned ${allLinks.length} total URLs`);

    // Filter to project detail URLs only
    const projectUrls = [...new Set(
      allLinks
        .map((l: string) => l.trim().replace(/\/$/, ""))
        .filter((l: string) => {
          if (!l.startsWith("https://providentestate.com/new-projects/")) return false;
          if (l.includes("/page/")) return false;
          if (l.includes("/developed-by-")) return false;
          if (/\/new-projects\/in-[a-z0-9\-]+$/i.test(l)) return false;
          if (l === "https://providentestate.com/new-projects") return false;
          // Must have a slug after /new-projects/
          const match = l.match(/\/new-projects\/([a-z0-9\-]+)$/i);
          return match && match[1].length > 3;
        })
    )];

    console.log(`[Discover] Found ${projectUrls.length} unique project URLs`);

    if (projectUrls.length === 0) {
      return new Response(JSON.stringify({ 
        success: true, 
        message: "No project URLs discovered", 
        raw_links: allLinks.length 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // If freshStart, clear pending queue first (keep approved ones)
    if (freshStart) {
      console.log("[Discover] Fresh start - clearing ALL pending queue...");
      const { error: deleteErr } = await supabase
        .from("pending_project_imports")
        .delete()
        .eq("status", "pending");
      
      if (deleteErr) console.error("[Discover] Delete error:", deleteErr);
    }

    // Get existing slugs from approved projects only (so we don't skip them)
    const { data: existingApproved } = await supabase
      .from("pending_project_imports")
      .select("slug")
      .eq("status", "approved");
    
    const { data: existingProjects } = await supabase
      .from("projects")
      .select("slug");

    const existingSlugs = new Set([
      ...(existingApproved || []).map(i => i.slug),
      ...(existingProjects || []).map(p => p.slug),
    ]);

    // Prepare new imports
    const newUrls: string[] = [];
    const existingUrls: string[] = [];

    for (const url of projectUrls) {
      const slug = url.match(/\/new-projects\/([^\/\?#]+)/)?.[1]?.toLowerCase().replace(/\/$/, "") || "";
      if (slug && !existingSlugs.has(slug)) {
        newUrls.push(url);
      } else {
        existingUrls.push(url);
      }
    }

    // Insert placeholders for new URLs (will be scraped later)
    const placeholders = newUrls.map(url => {
      const slug = url.match(/\/new-projects\/([^\/\?#]+)/)?.[1]?.toLowerCase().replace(/\/$/, "") || "";
      const name = slug.split("-").slice(0, 3).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
      return {
        slug,
        name,
        source_url: url,
        status: "pending",  // Must be pending, approved, rejected, or merged
        emirate: "Dubai",
        is_new_project: true,
        images: [],
        documents: [],
        review_notes: "PENDING_SCRAPE",
      };
    });

    if (placeholders.length > 0) {
      // Insert in batches of 50
      let insertedCount = 0;
      let errorCount = 0;
      
      for (let i = 0; i < placeholders.length; i += 50) {
        const batch = placeholders.slice(i, i + 50);
        const { error: insertErr, data: insertedData } = await supabase
          .from("pending_project_imports")
          .insert(batch)
          .select("id");
        
        if (insertErr) {
          console.error(`[Discover] Insert batch ${i}-${i + batch.length} error:`, insertErr.message);
          errorCount += batch.length;
        } else {
          insertedCount += insertedData?.length || batch.length;
          console.log(`[Discover] Inserted batch ${i}-${i + batch.length} (${insertedData?.length || batch.length} rows)`);
        }
      }
      
      console.log(`[Discover] Total inserted: ${insertedCount}, errors: ${errorCount}`);
    }

    return new Response(JSON.stringify({
      success: true,
      discovered_urls: projectUrls.length,
      new_urls: newUrls.length,
      existing_urls: existingUrls.length,
      queued_for_scraping: placeholders.length,
      sample_urls: projectUrls.slice(0, 10),
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("[Discover] Error:", error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
